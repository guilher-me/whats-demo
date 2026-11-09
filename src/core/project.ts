import { DEFAULT_BUSINESS_ICON, DEFAULT_ICON_BACKGROUND } from './business-avatar';
import { t } from '../i18n';
import { referencedVariableStepIds } from './journey-variables';
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
const base62 = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

function reservedStepIds(steps: readonly Step[]) {
  const reserved = new Set(steps.map(({ id }) => id));
  for (const step of steps) {
    for (const id of referencedVariableStepIds(step)) reserved.add(id);
    const commerce = step.type === 'flow' ? undefined : step.commerce;
    if (commerce?.kind === 'cart') reserved.add(commerce.offerId);
    if (commerce?.kind === 'pix' && 'cartId' in commerce.amount)
      reserved.add(commerce.amount.cartId);
  }
  return reserved;
}

function availableStepId(reserved: ReadonlySet<string>) {
  const radix = base62.length;
  const capacity = radix ** 3;
  const start = Math.floor(Math.random() * capacity);
  for (let offset = 0; offset < capacity; offset++) {
    const value = (start + offset) % capacity;
    const id =
      'N-' +
      base62[Math.floor(value / radix ** 2)] +
      base62[Math.floor(value / radix) % radix] +
      base62[value % radix];
    if (!reserved.has(id)) return id;
  }
  return uid();
}

export const newStepId = (steps: readonly Step[]) => availableStepId(reservedStepIds(steps));

export function normalizeProject(
  input: unknown,
  options?: { allowDrafts?: boolean; strictIds?: boolean },
): Project {
  const validated = validateProject(input, options);
  const { name, verified, icon, iconBackground, iconForeground } = validated.contact;
  const background = iconBackground?.toUpperCase();
  const project = clone({
    version: validated.version,
    catalog: validated.catalog,
    contact: {
      name,
      verified: Boolean(verified),
      icon: icon === DEFAULT_BUSINESS_ICON ? undefined : icon,
      iconBackground: background === DEFAULT_ICON_BACKGROUND ? undefined : background,
      iconForeground: iconForeground?.toUpperCase(),
    },
    steps: validated.steps.map((step) => {
      const { id, type, text, delay, typing, typingMs } = step;
      const fields = { id, type, text, delay, typing, typingMs };
      if (step.type === 'flow') {
        const { label, completion, flow, answers } = step;
        return { ...fields, type: step.type, label, completion, flow, answers };
      }
      const { interactive, voiceDurationSeconds, media, commerce } = step;
      return { ...fields, type: step.type, interactive, voiceDurationSeconds, media, commerce };
    }),
  });
  const used = new Set<string>();
  let reserved: Set<string> | undefined;
  for (const step of project.steps) {
    if (typeof step.id !== 'string' || !step.id || used.has(step.id)) {
      if (options?.strictIds) throw new Error(t('sharing.stepIds'));
      reserved ??= reservedStepIds(project.steps);
      step.id = availableStepId(reserved);
      reserved.add(step.id);
    }
    used.add(step.id);
    if (step.type === 'flow') step.label ||= t('seed.openFlow');
  }
  return project;
}
export function createStep(type: Step['type'], steps: readonly Step[] = []): Step {
  const base = {
    id: newStepId(steps),
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
