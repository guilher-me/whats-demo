import { expect, it, vi } from 'vitest';
import { createAutomationAPI, type AutomationState } from '../src/features/automation/api';
import { normalizeProject } from '../src/core/project';
import { decode } from '../src/core/codec';
import legacy from './fixtures/v1-project.json';
function setup() {
  let project = normalizeProject(legacy);
  let state: AutomationState = {
    ready: true,
    running: false,
    status: 'Pronto',
    activeStep: null,
    flowScreen: null,
    pendingMessageId: null,
    messages: [],
  };
  const replace = vi.fn((next) => {
    project = next;
  });
  const run = vi.fn(async () => {
    state = { ...state, status: 'Conversa concluída.' };
  });
  const api = createAutomationAPI({
    project: () => project,
    state: () => state,
    hasErrors: () => false,
    replace,
    run,
    stop: vi.fn(),
    reset: vi.fn(),
    example: () => normalizeProject(legacy),
    instructions: () => 'Instructions',
    href: () => 'https://example.com/demo/app.html',
  });
  return {
    api,
    replace,
    run,
    setState: (next: Partial<AutomationState>) => {
      state = { ...state, ...next };
    },
  };
}
it('valida sem alterar o projeto e rejeita carregamentos inválidos atomicamente', () => {
  const { api, replace } = setup();
  expect(api.validateProject({ version: 99 }).valid).toBe(false);
  expect(() => api.loadProject({ version: 99 })).toThrow();
  expect(replace).not.toHaveBeenCalled();
  expect(api.getProject()).toEqual(legacy);
});
it('usa cópias em ambos os sentidos e mantém o contrato versionado', () => {
  const { api } = setup();
  const candidate = api.getProject();
  candidate.contact.name = 'Empresa nova';
  const loaded = api.loadProject(candidate);
  candidate.contact.name = 'Mutação externa';
  loaded.steps.length = 0;
  expect(api.getProject().contact.name).toBe('Empresa nova');
  expect(api.getProject().steps.length).toBeGreaterThan(0);
  expect(api.apiVersion).toBe(1);
  expect(Object.isFrozen(api)).toBe(true);
});
it('gera links sem persistir e rejeita um projeto nulo explícito', async () => {
  const { api, replace } = setup();
  const url = new URL(await api.createShareURL());
  expect(await decode(url.hash)).toEqual(legacy);
  expect(replace).not.toHaveBeenCalled();
  await expect(api.createShareURL(null)).rejects.toThrow();
});
it('bloqueia escrita durante carregamento e reprodução concorrente ou modo inválido', async () => {
  const { api, run, setState } = setup();
  setState({ ready: false });
  expect(() => api.loadProject(legacy)).toThrow('Aguarde');
  await expect(api.play()).rejects.toThrow('Aguarde');
  setState({ ready: true, running: true });
  await expect(api.play()).rejects.toThrow('andamento');
  setState({ running: false });
  await expect(api.play('other' as 'manual')).rejects.toThrow('Modo inválido');
  expect(run).not.toHaveBeenCalled();
  expect((await api.play()).status).toBe('Conversa concluída.');
  expect(run).toHaveBeenCalledWith(legacy, true);
});
