import { t } from '../i18n';
import { validateProject } from './engine';
import type { Project, Step } from './types';
export const STORAGE_KEY = 'whatsdemo-document-alpha1';
export function projectStorageKey(url: { protocol: string; pathname: string }): string {
  const development =
    /^https?:$/.test(url.protocol) &&
    /\/development(?:\/(?:index\.html|whats-demo\.html|whatsapp-fake-flows\.html)?)?$/.test(
      url.pathname,
    );
  return development ? `${STORAGE_KEY}:development` : STORAGE_KEY;
}
export const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
export const uid = () =>
  `step-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
export function normalizeProject(
  input: unknown,
  options?: { allowDrafts?: boolean; strictIds?: boolean },
): Project {
  const validated = validateProject(input, options);
  const project = clone({
    version: validated.version,
    contact: { name: validated.contact.name, verified: Boolean(validated.contact.verified) },
    steps: validated.steps.map((step) => {
      const { id, type, text, delay, typing, typingMs } = step;
      const fields = { id, type, text, delay, typing, typingMs };
      if (step.type === 'flow') {
        const { label, completion, flow, answers } = step;
        return { ...fields, type: step.type, label, completion, flow, answers };
      }
      const { interactive, voiceDurationSeconds, media } = step;
      return { ...fields, type: step.type, interactive, voiceDurationSeconds, media };
    }),
  });
  const used = new Set<string>();
  for (const step of project.steps) {
    if (typeof step.id !== 'string' || !step.id || used.has(step.id)) {
      if (options?.strictIds) throw new Error(t('sharing.stepIds'));
      step.id = uid();
    }
    used.add(step.id);
    if (step.type === 'flow') step.label ||= t('seed.openFlow');
  }
  return project;
}
export function createStep(type: Step['type']): Step {
  const base = {
    id: uid(),
    text:
      type === 'user'
        ? t('seed.hello')
        : type === 'flow'
          ? t('seed.formHint')
          : t('seed.newMessage'),
    delay: type === 'user' ? 0.4 : 1,
    typing: true,
  };
  if (type !== 'flow') return { ...base, type };
  return {
    ...base,
    type,
    label: t('seed.openForm'),
    completion: t('seed.sent'),
    answers: { name: t('seed.customer') },
    flow: {
      version: '7.3',
      screens: [
        {
          id: 'FORM_SCREEN',
          title: t('seed.form'),
          terminal: true,
          layout: {
            type: 'SingleColumnLayout',
            children: [
              { type: 'TextInput', name: 'name', label: t('seed.name'), required: true },
              {
                type: 'Footer',
                label: t('seed.confirm'),
                'on-click-action': { name: 'complete', payload: { name: '${form.name}' } },
              },
            ],
          },
        },
      ],
    },
  };
}
