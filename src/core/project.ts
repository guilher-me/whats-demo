import { t } from '../i18n';
import { validateProject } from './engine';
import { isAllowedAvatar } from './images/policy';
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
export function normalizeProject(input: unknown, options?: { allowDrafts?: boolean }): Project {
  // Keep the synchronous v1 API; invalid photos cannot invalidate the whole journey.
  if (
    input &&
    typeof input === 'object' &&
    'contact' in input &&
    input.contact &&
    typeof input.contact === 'object'
  ) {
    const contact = input.contact;
    input = {
      ...input,
      contact: {
        ...contact,
        avatar: 'avatar' in contact && isAllowedAvatar(contact.avatar) ? contact.avatar : '',
      },
    };
  }
  const project = clone(validateProject(input, options));
  const used = new Set<string>();
  project.contact.avatar ||= '';
  project.contact.verified = Boolean(project.contact.verified);
  for (const step of project.steps) {
    if (!step.id || used.has(step.id)) step.id = uid();
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
