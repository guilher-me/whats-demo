import { validateProject } from './engine';
import type { Project, Step } from './types';
export const STORAGE_KEY = 'whatsapp-fake-flows-v1';
export const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
export const uid = () =>
  `step-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
export function normalizeProject(input: unknown, options?: { allowDrafts?: boolean }): Project {
  const project = clone(validateProject(input, options));
  const used = new Set<string>();
  project.contact.avatar ||= '';
  project.contact.verified = Boolean(project.contact.verified);
  for (const step of project.steps) {
    if (!step.id || used.has(step.id)) step.id = uid();
    used.add(step.id);
    if (step.type === 'flow') step.label ||= 'Abrir Flow';
  }
  return project;
}
export function createStep(type: Step['type']): Step {
  const base = {
    id: uid(),
    text:
      type === 'user'
        ? 'oi'
        : type === 'flow'
          ? 'Preencha o formulário para continuar.'
          : 'Nova mensagem',
    delay: type === 'user' ? 0.4 : 1,
    typing: true,
  };
  if (type !== 'flow') return { ...base, type };
  return {
    ...base,
    type,
    label: 'Abrir formulário',
    completion: 'Dados enviados',
    answers: { name: 'Cliente exemplo' },
    flow: {
      version: '7.3',
      screens: [
        {
          id: 'FORM_SCREEN',
          title: 'Formulário',
          terminal: true,
          layout: {
            type: 'SingleColumnLayout',
            children: [
              { type: 'TextInput', name: 'name', label: 'Nome', required: true },
              {
                type: 'Footer',
                label: 'Confirmar',
                'on-click-action': { name: 'complete', payload: { name: '${form.name}' } },
              },
            ],
          },
        },
      ],
    },
  };
}
