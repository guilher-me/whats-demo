// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { App } from '../src/app/App';
import { readJsonEditor, writeJsonEditor } from './fixtures/json-editor';
import { createLumaProject } from './fixtures/luma-project';
import type { FlowStep } from '../src/core/types';
import { STORAGE_KEY } from '../src/core/project';

const button = (name: string) => screen.getByRole('button', { name });
const code = () => screen.getByRole('textbox', { name: 'JSON da jornada' });
const api = () => window.whatsappFakeFlows!;

beforeEach(() => {
  localStorage.clear();
  history.replaceState(null, '', '/');
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

it('keeps a code draft when collapsing and reopening the workbench panels', () => {
  render(<App />);
  const panels = within(screen.getByRole('group', { name: 'Painéis da jornada' }));
  expect(panels.getAllByRole('button')).toHaveLength(3);
  writeJsonEditor(code(), '{invalid draft');
  fireEvent.click(button('Recolher Código'));
  expect(screen.queryByRole('textbox', { name: 'JSON da jornada' })).toBeNull();
  fireEvent.click(button('Recolher Editor'));
  expect(button('Recolher Preview')).toBeDisabled();
  fireEvent.click(button('Expandir Código'));
  expect(readJsonEditor(code())).toBe('{invalid draft');
  expect(button('Recolher Preview')).toBeEnabled();
  fireEvent.click(button('Expandir Editor'));
  expect(screen.getByLabelText('Nome do contato')).toBeVisible();
});

it('formats JSON with line numbers and highlighting without rewriting literals or applying it', () => {
  render(<App />);
  const previous = api().getProject();
  writeJsonEditor(code(), '{"name":"\\u0041","number":9007199254740993,"flag":true}');
  fireEvent.click(button('Formatar JSON'));
  expect(readJsonEditor(code())).toBe(
    '{\n  "name": "\\u0041",\n  "number": 9007199254740993,\n  "flag": true\n}',
  );
  expect(document.querySelector('.journey-code .cm-lineNumbers')).toBeVisible();
  expect(code().querySelector('.json-key')).toHaveTextContent('"name"');
  expect(code().querySelector('.json-string')).toHaveTextContent('\\u0041');
  expect(api().getProject()).toEqual(previous);

  writeJsonEditor(code(), '{"incomplete":');
  fireEvent.click(button('Formatar JSON'));
  expect(screen.getByRole('alert')).toHaveTextContent(
    'Corrija a sintaxe do JSON antes de formatar.',
  );
  expect(readJsonEditor(code())).toBe('{"incomplete":');
});

it('resizes the stacked panels with the keyboard', () => {
  vi.stubGlobal('matchMedia', () => ({
    matches: false,
    addEventListener: () => {},
    removeEventListener: () => {},
  }));
  render(<App />);
  const handle = screen.getByRole('separator', { name: 'Redimensionar Código e Editor' });
  const panel = document.getElementById('workspace-code')!;
  expect(handle).toHaveAttribute('aria-orientation', 'horizontal');
  expect(panel.style.getPropertyValue('--panel-height')).toBe('410px');
  fireEvent.keyDown(handle, { key: 'ArrowDown' });
  expect(panel.style.getPropertyValue('--panel-height')).toBe('434px');
  fireEvent.keyDown(handle, { key: 'Home' });
  expect(panel.style.getPropertyValue('--panel-height')).toBe('220px');
});

it('applies valid journey JSON atomically and preserves the editor on failure', () => {
  render(<App />);
  const previous = api().getProject();
  writeJsonEditor(code(), '{invalid');
  fireEvent.click(button('Aplicar'));
  expect(screen.getByRole('alert')).toHaveTextContent('JSON inválido.');
  expect(api().getProject()).toEqual(previous);
  expect(localStorage.getItem(STORAGE_KEY)).toBeNull();

  const next = { ...previous, contact: { ...previous.contact, name: 'Empresa do código' } };
  writeJsonEditor(code(), JSON.stringify(next));
  fireEvent.click(button('Validar'));
  expect(screen.getByText('Jornada validada.')).toBeVisible();
  expect(api().getProject()).toEqual(previous);
  fireEvent.click(button('Aplicar'));
  expect(screen.getByLabelText('Nome do contato')).toHaveValue('Empresa do código');
  expect(screen.getByTitle('Empresa do código')).toBeVisible();
  expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!).contact.name).toBe('Empresa do código');
});

it('keeps newer visual edits separate from a pending code draft', () => {
  render(<App />);
  const project = api().getProject();
  const draft = JSON.stringify({
    ...project,
    contact: { ...project.contact, name: 'Proposta do código' },
  });
  writeJsonEditor(code(), draft);
  fireEvent.change(screen.getByLabelText('Nome do contato'), {
    target: { value: 'Edição visual' },
  });
  expect(readJsonEditor(code())).toBe(draft);
  expect(button('Aplicar')).toBeDisabled();
  fireEvent.click(button('Recarregar do editor'));
  expect(JSON.parse(readJsonEditor(code())).contact.name).toBe('Edição visual');
});

it('reports precise Flow errors and keeps the manual mode for missing automatic answers', async () => {
  render(<App />);
  const candidate = createLumaProject();
  const stepIndex = candidate.steps.findIndex((step) => step.type === 'flow');
  const step = candidate.steps[stepIndex] as FlowStep;
  step.answers = {};
  writeJsonEditor(code(), JSON.stringify(candidate));
  fireEvent.click(button('Aplicar'));
  const issues = screen.getByRole('list', { name: 'Diagnósticos da jornada' });
  expect(issues).toHaveTextContent(`steps[${stepIndex}].answers.`);
  expect(button('Reproduzir automaticamente')).toBeDisabled();
  expect(button('Iniciar manual')).toBeEnabled();
  await expect(api().play('automatic')).rejects.toThrow();

  step.flow.screens[0].layout.children.unshift({ type: 'InvalidWidget' });
  const result = api().validateProject(candidate);
  expect(result.valid).toBe(false);
  writeJsonEditor(code(), JSON.stringify(candidate));
  fireEvent.click(button('Aplicar'));
  expect(screen.getByRole('alert')).toHaveTextContent('Corrija os erros de Flow JSON');
  expect(screen.getByRole('list', { name: 'Diagnósticos da jornada' })).toHaveTextContent(
    `steps[${stepIndex}].flow.screens[0].layout.children[0].type`,
  );
  expect(
    (api().getProject().steps[stepIndex] as FlowStep).flow.screens[0].layout.children[0].type,
  ).not.toBe('InvalidWidget');
});
