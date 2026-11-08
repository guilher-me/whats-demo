import { validateFlowJson } from 'flowso/validator';
import { SUPPORTED_COMPONENTS } from '../../core/engine';
import { normalizeProject } from '../../core/project';
import type { FlowComponent, FlowStep, Project } from '../../core/types';
import { t } from '../../i18n';
import { createSession, followFooter, getComponents } from './model';
import { automaticAnswer } from './answers';

export interface JourneyDiagnostic {
  kind: 'definition' | 'simulator' | 'automatic';
  severity: 'error' | 'warning';
  path: string;
  message: string;
}

const pathAt = (root: string, path: string) => (root ? `${root}.${path}` : path);

export function flowDefinitionDiagnostics(input: unknown, root = 'flow'): JourneyDiagnostic[] {
  try {
    return validateFlowJson(input).issues.flatMap((issue) =>
      issue.pointers.map((pointer) => ({
        kind: 'definition' as const,
        severity: issue.severity,
        path: pointer.path === '$' ? root : pathAt(root, pointer.path),
        message: issue.error === 'UNREACHABLE_SCREEN' ? t('builder.unreachable') : issue.message,
      })),
    );
  } catch {
    return [{ kind: 'definition', severity: 'error', path: root, message: t('errors.project') }];
  }
}

function automaticAnswerIssue(step: FlowStep): { name: string; message: string } | undefined {
  let session = createSession(step);
  const seen = new Set<number>();
  while (seen.size < 30 && !seen.has(session.index)) {
    seen.add(session.index);
    const visited = new Set<FlowComponent>();
    for (;;) {
      const field = getComponents(session).find((item) => item.name && !visited.has(item));
      if (!field?.name) break;
      visited.add(field);
      const { value, error } = automaticAnswer(field, step.answers, {
        data: session.data,
        form: session.form,
      });
      if (error) return { name: field.name, message: error };
      if (value !== undefined)
        session = { ...session, form: { ...session.form, [field.name]: value } };
    }

    const result = followFooter(session);
    if (!result.session) return undefined;
    session = result.session;
  }
}

export function flowDiagnostics(step: FlowStep, root = ''): JourneyDiagnostic[] {
  const definition = flowDefinitionDiagnostics(step.flow, pathAt(root, 'flow'));
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
      for (const event of ['on-click-action', 'on-select-action', 'on-unselect-action'] as const) {
        const action = (
          component as FlowComponent & Record<typeof event, FlowComponent['on-click-action']>
        )[event]?.name;
        if (action && (event !== 'on-click-action' || !['complete', 'navigate'].includes(action)))
          simulator.push({
            kind: 'simulator',
            severity: 'warning',
            path: path + '.' + event,
            message: t('errors.unsupportedAction', { v0: action }),
          });
      }
      for (const branch of ['children', 'then', 'else'] as const) {
        if (component[branch]) walk(component[branch], path + '.' + branch);
      }
    });
  };
  step.flow.screens.forEach((screen, index) =>
    walk(screen.layout.children, pathAt(root, `flow.screens[${index}].layout.children`)),
  );
  const issues = [...definition, ...simulator];
  if (definition.some((issue) => issue.severity === 'error')) return issues;
  try {
    const issue = automaticAnswerIssue(step);
    if (issue)
      issues.push({
        kind: 'automatic',
        severity: 'warning',
        path: pathAt(root, `answers.${issue.name}`),
        message: issue.message,
      });
  } catch {
    // Runtime-specific data and navigation errors remain reported by the player.
  }
  return issues;
}

export function journeyDiagnostics(project: Project): JourneyDiagnostic[] {
  return project.steps.flatMap((step, index) =>
    step.type === 'flow' ? flowDiagnostics(step, `steps[${index}]`) : [],
  );
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
