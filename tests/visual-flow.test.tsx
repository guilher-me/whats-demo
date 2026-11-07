// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { Blob as NativeBlob } from 'node:buffer';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { App } from '../src/app/App';
import { decode } from '../src/core/codec';
import example from '../src/core/default-project.json';
import { createStep, STORAGE_KEY } from '../src/core/project';
import type { FlowDefinition, FlowStep, Project } from '../src/core/types';

const button = (name: string) => screen.getByRole('button', { name });
const tab = (name: string) => screen.getByRole('tab', { name });
const phone = () => within(document.getElementById('phone-preview')!);
const api = () => window.whatsappFakeFlows!;
const current = () => api().getProject().steps[0] as FlowStep;

function setup(configure?: (step: FlowStep) => void) {
  const step = createStep('flow') as FlowStep;
  configure?.(step);
  const project: Project = {
    version: 1,
    contact: { name: 'Loja teste', verified: false },
    steps: [step],
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(project));
  render(<App />);
  return step;
}
function openFooter() {
  fireEvent.click(screen.getByText('Botão final', { selector: 'summary > span' }));
}
function chooseScreen(name: string) {
  fireEvent.click(
    within(screen.getByRole('group', { name: 'Telas do Flow' })).getByRole('button', {
      name,
    }),
  );
}

beforeEach(() => {
  localStorage.clear();
  history.replaceState(null, '', '/');
  vi.stubGlobal('Blob', NativeBlob);
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

it('builds two screens, connects a route and tests it in an isolated phone session', () => {
  const initial = setup((step) => {
    step.flow.routing_model = {};
  });
  expect(tab('Visual')).toHaveAttribute('aria-selected', 'true');
  const first = initial.flow.screens[0].id;
  fireEvent.click(button('Adicionar tela'));
  expect(current().flow.screens).toHaveLength(2);
  expect(
    screen.getByText('Esta tela ainda não tem rota de entrada.', {
      selector: '.builder-issues span',
    }),
  ).toBeVisible();
  expect(phone().getByText('Tela 2', { selector: '.flow-header strong' })).toBeVisible();
  const second = current().flow.screens[1].id;

  fireEvent.keyDown(button('Adicionar componente'), { key: 'Enter' });
  fireEvent.click(screen.getByRole('menuitem', { name: 'Título' }));
  expect(current().flow.screens[1].layout.children.map((c) => c.type)).toEqual([
    'TextHeading',
    'Footer',
  ]);
  chooseScreen(initial.flow.screens[0].title);
  openFooter();
  fireEvent.change(screen.getByLabelText('Ação do botão'), { target: { value: second } });
  expect(current().flow.routing_model).toEqual({ [first]: [second] });
  expect(current().flow.screens[0].terminal).toBe(false);
  chooseScreen('Tela 2');
  expect(button('Remover tela')).toBeDisabled();

  openFooter();
  const footerAction = screen.getByLabelText('Ação do botão');
  fireEvent.change(footerAction, { target: { value: first } });
  expect(screen.getByText(/Há alterações pendentes no Flow/)).toBeVisible();
  expect(footerAction).toBeEnabled();
  expect(current().flow.screens[1].terminal).toBe(true);
  expect(phone().getByRole('button', { name: 'Concluir' })).toBeVisible();
  fireEvent.change(footerAction, { target: { value: '' } });
  expect(screen.queryByText(/Há alterações pendentes no Flow/)).toBeNull();

  fireEvent.click(button('Recolher Preview'));
  fireEvent.click(button('Testar Flow'));
  expect(
    phone().getByText(initial.flow.screens[0].title, { selector: '.flow-header strong' }),
  ).toBeVisible();
  const fill = () =>
    fireEvent.change(phone().getByLabelText(initial.flow.screens[0].layout.children[0].label!), {
      target: { value: 'Cliente de teste' },
    });
  const advance = () => fireEvent.click(document.querySelector('[data-flow-next]')!);
  fill();
  advance();
  expect(phone().getByText('Tela 2', { selector: '.flow-header strong' })).toBeVisible();
  fireEvent.keyDown(button('Adicionar componente'), { key: 'Enter' });
  fireEvent.click(screen.getByRole('menuitem', { name: 'Parágrafo' }));
  expect(phone().getByText('Tela 2', { selector: '.flow-header strong' })).toBeVisible();
  expect(phone().getByText('Parágrafo')).toBeVisible();
  fireEvent.click(phone().getByRole('button', { name: 'Voltar' }));
  expect(phone().getByDisplayValue('Cliente de teste')).toBeVisible();
  advance();
  advance();
  expect(phone().getByText('Teste do Flow concluído.')).toBeVisible();
  fireEvent.click(button('Reiniciar Flow'));
  expect(phone().getByLabelText(initial.flow.screens[0].layout.children[0].label!)).toHaveValue('');
  expect(current().answers).toEqual(initial.answers);
  expect(api().getState().messages).toEqual([]);
});

it.each(['invitation', 'test'] as const)(
  'keeps a Flow opened through %s in the phone while adding and removing components',
  (entry) => {
    const step = setup();
    if (entry === 'test') fireEvent.click(button('Testar Flow'));
    else {
      fireEvent.click(screen.getByRole('article', { name: 'Etapa 1' }));
      fireEvent.click(phone().getByRole('button', { name: step.label }));
    }

    const label = step.flow.screens[0].layout.children[0].label!;
    const input = phone().getByLabelText(label);
    const sheet = input.closest('.flow-sheet');
    fireEvent.change(input, { target: { value: 'Valor de teste' } });

    fireEvent.keyDown(button('Adicionar componente'), { key: 'Enter' });
    fireEvent.click(screen.getByRole('menuitem', { name: 'Parágrafo' }));
    expect(phone().getByText('Parágrafo')).toBeVisible();
    expect(phone().getByLabelText(label)).toHaveValue('Valor de teste');
    expect(phone().getByLabelText(label).closest('.flow-sheet')).toBe(sheet);

    const summary = screen.getByText('Parágrafo', { selector: 'summary > span' });
    fireEvent.click(summary);
    fireEvent.click(
      within(summary.closest('details')!).getByRole('button', { name: 'Remover componente' }),
    );
    expect(phone().queryByText('Parágrafo')).toBeNull();
    expect(phone().getByLabelText(label)).toHaveValue('Valor de teste');

    fireEvent.click(phone().getByRole('button', { name: /Fechar/ }));
    fireEvent.keyDown(button('Adicionar componente'), { key: 'Enter' });
    fireEvent.click(screen.getByRole('menuitem', { name: 'Título' }));
    expect(phone().queryByLabelText(label)).toBeNull();
  },
);

it('keeps the example Flow valid when removing an input forwarded to the next screen', () => {
  const step = setup((step) => {
    const request = example.steps.find((item) => item.type === 'flow')!;
    step.flow = structuredClone(request.flow!);
    step.answers = structuredClone(request.answers!);
  });
  fireEvent.click(button('Testar Flow'));
  const sheet = phone().getByLabelText('Quantity').closest('.flow-sheet');
  const summary = screen.getByText('quantity', { selector: 'summary > code' });
  fireEvent.click(summary);
  fireEvent.click(
    within(summary.closest('details')!).getByRole('button', { name: 'Remover componente' }),
  );

  expect(screen.queryByText(/Há alterações pendentes no Flow/)).toBeNull();
  expect(phone().queryByLabelText('Quantity')).toBeNull();
  expect(phone().getByText('Your piece').closest('.flow-sheet')).toBe(sheet);

  const flow = current().flow;
  const [product, contact] = flow.screens;
  expect(product.layout.children.at(-1)!['on-click-action']?.payload).toEqual({
    product: '${form.product}',
    color: '${form.color}',
    quantity: contact.data!.quantity.__example__,
  });
  expect(contact).toEqual(step.flow.screens[1]);
  expect(flow.routing_model).toEqual(step.flow.routing_model);
  expect(button('Reproduzir automaticamente')).toBeEnabled();
});

it('removes only the deleted field bindings from a completion payload', () => {
  setup((step) => {
    const screen = step.flow.screens[0];
    screen.layout.children.at(-1)!['on-click-action']!.payload = {
      name: '${form.name}',
      customer: '${screen.FORM_SCREEN.form.name}',
      literal: 'name',
    };
  });
  const summary = screen.getByText('name', { selector: 'summary > code' });
  fireEvent.click(summary);
  fireEvent.click(
    within(summary.closest('details')!).getByRole('button', { name: 'Remover componente' }),
  );

  expect(screen.queryByText(/Há alterações pendentes no Flow/)).toBeNull();
  expect(current().flow.screens[0].layout.children).toHaveLength(1);
  expect(current().flow.screens[0].layout.children[0]['on-click-action']?.payload).toEqual({
    literal: 'name',
  });
});

it('preserves JSON formatting and keeps invalid changes out of the phone and the saved journey', () => {
  const step = setup();
  chooseScreen(step.flow.screens[0].title);
  fireEvent.click(tab('JSON'));
  const input = screen.getByLabelText('Flow JSON');
  const flow: FlowDefinition = structuredClone(step.flow);
  flow.screens[0].title = 'Título aplicado pelo JSON';
  const formatted = JSON.stringify(flow, null, 4) + '\n';
  fireEvent.change(input, { target: { value: formatted } });
  expect(input).toHaveValue(formatted);
  expect(phone().getByText('Título aplicado pelo JSON')).toBeVisible();
  expect(
    JSON.parse(screen.getByRole<HTMLTextAreaElement>('textbox', { name: 'JSON da jornada' }).value)
      .steps[0].flow,
  ).toEqual(flow);

  flow.screens[0].layout.children.at(-1)!['on-click-action'] = {
    name: 'navigate',
    next: { type: 'screen', name: 'MISSING' },
    payload: {},
  };
  fireEvent.change(input, { target: { value: JSON.stringify(flow) } });
  expect(screen.getAllByText(/on-click-action/).length).toBeGreaterThan(0);
  fireEvent.change(input, { target: { value: '{truncated' } });
  fireEvent.click(tab('Visual'));
  expect(screen.getByLabelText('Título da tela')).toBeDisabled();
  expect(phone().getByText('Título aplicado pelo JSON')).toBeVisible();
  expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!).steps[0].flow.screens[0].title).toBe(
    'Título aplicado pelo JSON',
  );
  fireEvent.click(tab('JSON'));
  expect(input).toHaveValue('{truncated');
  fireEvent.click(button('Descartar rascunho'));
  fireEvent.click(tab('Visual'));
  expect(screen.getByLabelText('Título da tela')).toBeEnabled();
});

it('keeps advanced conditions and payloads when editing an adjacent supported component', async () => {
  const step = setup((step) => {
    step.flow.screens[0].layout.children.unshift({
      type: 'If',
      condition: true,
      then: [{ type: 'TextBody', text: 'Texto condicional' }],
    });
  });
  const advanced = step.flow.screens[0].layout.children[0];
  const footer = step.flow.screens[0].layout.children.at(-1);
  expect(screen.getByText('Configuração avançada no JSON')).toBeVisible();
  const summary = screen.getByText('Campo de texto', { selector: 'summary > span' });
  fireEvent.click(summary);
  fireEvent.change(within(summary.closest('details')!).getByLabelText('Rótulo'), {
    target: { value: 'Rótulo atualizado' },
  });
  const children = current().flow.screens[0].layout.children;
  expect(children[0]).toEqual(advanced);
  expect(children.at(-1)).toEqual(footer);
  expect(children[1].label).toBe('Rótulo atualizado');
  const url = new URL(await api().createShareURL());
  const decoded = (await decode(url.hash)) as Project;
  expect((decoded.steps[0] as FlowStep).flow).toEqual(current().flow);
});

it('reports incompatible choice answers while leaving manual playback available', async () => {
  setup((step) => {
    step.flow.screens[0].layout.children[0] = {
      type: 'RadioButtonsGroup',
      name: 'name',
      label: 'Escolha',
      'data-source': [{ id: 'accepted', title: 'Uma opção' }],
    };
    step.answers = { name: 'invalid' };
  });
  expect(button('Iniciar manual')).toBeEnabled();
  expect(button('Reproduzir automaticamente')).toBeDisabled();
  expect(screen.getAllByText(/answers.name/).length).toBeGreaterThan(0);
  await expect(api().play('automatic')).rejects.toThrow();

  act(() =>
    api().loadProject({
      ...api().getProject(),
      steps: [{ ...current(), answers: { name: 'accepted' } }],
    }),
  );
  expect(button('Reproduzir automaticamente')).toBeEnabled();
});
