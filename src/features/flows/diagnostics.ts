import { validateFlowJson } from 'flowso/validator';
import { resolve, SUPPORTED_COMPONENTS } from '../../core/engine';
import { normalizeProject } from '../../core/project';
import type { FlowComponent, FlowStep, Project } from '../../core/types';
import { t } from '../../i18n';
import { createSession, followFooter, getComponents } from './model';

export interface JourneyDiagnostic {
  kind: 'definition' | 'simulator' | 'automatic';
  severity: 'error' | 'warning';
  path: string;
  message: string;
}

function missingAutomaticAnswer(step: FlowStep): string | undefined {
  let session = createSession(step);
  const seen = new Set<number>();
  while (seen.size < 30 && !seen.has(session.index)) {
    seen.add(session.index);
    for (const field of getComponents(session)) {
      if (!field.name) continue;
      const value = resolve(step.answers[field.name], { data: session.data, form: session.form });
      if (value !== undefined)
        session = { ...session, form: { ...session.form, [field.name]: value } };
    }
    const missing = getComponents(session).find((field) => {
      if (!field.required || !field.name) return false;
      const value = session.form[field.name];
      return (
        value == null || value === '' || value === false || (Array.isArray(value) && !value.length)
      );
    });
    if (missing?.name) return missing.name;

    const result = followFooter(session);
    if (!result.session) return undefined;
    session = result.session;
  }
}

export function journeyDiagnostics(project: Project): JourneyDiagnostic[] {
  const result: JourneyDiagnostic[] = [];
  for (const [index, step] of project.steps.entries()) {
    if (step.type !== 'flow') continue;
    const root = `steps[${index}]`;
    const definition = validateFlowJson(step.flow).issues;
    for (const issue of definition)
      for (const pointer of issue.pointers)
        result.push({
          kind: 'definition',
          severity: issue.severity,
          path: pointer.path === '$' ? root + '.flow' : `${root}.flow.${pointer.path}`,
          message: issue.message,
        });

    const simulator: JourneyDiagnostic[] = [];
    const walk = (components: FlowComponent[], parent: string) => {
      components.forEach((component, index) => {
        const path = `${parent}[${index}]`;
        if (!SUPPORTED_COMPONENTS.has(component.type) && !['Form', 'If'].includes(component.type))
          simulator.push({
            kind: 'simulator',
            severity: 'warning',
            path: path + '.type',
            message: t('errors.unsupported', { v0: component.type }),
          });
        const action = component['on-click-action']?.name;
        if (action && !['complete', 'navigate'].includes(action))
          simulator.push({
            kind: 'simulator',
            severity: 'warning',
            path: path + '.on-click-action',
            message: t('errors.unsupportedAction', { v0: action }),
          });
        for (const branch of ['children', 'then', 'else'] as const) {
          if (component[branch]) walk(component[branch], path + '.' + branch);
        }
      });
    };
    step.flow.screens.forEach((screen, screenIndex) =>
      walk(screen.layout.children, `${root}.flow.screens[${screenIndex}].layout.children`),
    );
    result.push(...simulator);

    if (simulator.length || definition.some((issue) => issue.severity === 'error')) continue;
    try {
      const missing = missingAutomaticAnswer(step);
      if (missing)
        result.push({
          kind: 'automatic',
          severity: 'warning',
          path: `${root}.answers.${missing}`,
          message: t('errors.autoAnswer', { v0: missing }),
        });
    } catch {
      // Runtime-specific data and navigation errors remain reported by the player.
    }
  }
  return result;
}

/** Inspect a proposed edit without changing the currently loaded journey. */
export function reviewJourney(input: unknown, strictIds = false) {
  const project = normalizeProject(input, { strictIds });
  const diagnostics = journeyDiagnostics(project);
  const errors = diagnostics
    .filter((issue) => issue.kind === 'definition' && issue.severity === 'error')
    .map((issue) => `${issue.path} · ${issue.message}`);
  return { project, diagnostics, errors };
}
