// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { Blob as NativeBlob } from 'node:buffer';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { App } from '../src/app/App';
import { savedJourney } from './fixtures/journey-library';
import { readJsonEditor, writeJsonEditor } from './fixtures/json-editor';
import { decode } from '../src/core/codec';
import example from './fixtures/luma-project.json';
import { createStep, STORAGE_KEY } from '../src/core/project';
import type { FlowDefinition, FlowStep, Project } from '../src/core/types';

const button = (name: string) => screen.getByRole('button', { name });
const tab = (name: string) => screen.getByRole('tab', { name });
const phone = () => within(document.getElementById('phone-preview')!);
const api = () => window.whatsDemo!;
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
  expect(phone().getByRole('button', { name: 'Fechar Flow' })).toBeVisible();
  expect(phone().queryByRole('button', { name: 'Voltar' })).toBeNull();
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
  expect(phone().queryByRole('button', { name: 'Fechar Flow' })).toBeNull();
  fireEvent.click(phone().getByRole('button', { name: 'Voltar' }));
  expect(phone().getByRole('button', { name: 'Fechar Flow' })).toBeVisible();
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
  writeJsonEditor(input, formatted);
  expect(readJsonEditor(input)).toBe(formatted);
  expect(phone().getByText('Título aplicado pelo JSON')).toBeVisible();
  expect(
    JSON.parse(readJsonEditor(screen.getByRole('textbox', { name: 'JSON da jornada' }))).steps[0]
      .flow,
  ).toEqual(flow);

  flow.screens[0].layout.children.at(-1)!['on-click-action'] = {
    name: 'navigate',
    next: { type: 'screen', name: 'MISSING' },
    payload: {},
  };
  writeJsonEditor(input, JSON.stringify(flow));
  expect(screen.getAllByText(/on-click-action/).length).toBeGreaterThan(0);
  writeJsonEditor(input, '{truncated');
  fireEvent.click(tab('Visual'));
  expect(screen.getByLabelText('Título da tela')).toBeDisabled();
  expect(phone().getByText('Título aplicado pelo JSON')).toBeVisible();
  expect(savedJourney()?.project.steps[0]).toMatchObject({
    flow: { screens: [{ title: 'Título aplicado pelo JSON' }] },
  });
  fireEvent.click(tab('JSON'));
  expect(readJsonEditor(input)).toBe('{truncated');
  cleanup();
  render(<App />);
  expect(readJsonEditor(screen.getByLabelText('Flow JSON'))).toBe('{truncated');
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

async function openAnswers() {
  const section = document.querySelector('.flow-answers')!;
  fireEvent.click(section.querySelector('summary')!);
  const controls = within(section as HTMLElement);
  await controls.findByRole('tablist', { name: 'Respostas automáticas' });
  return controls;
}

it('generates typed answers for new Visual and JSON fields and plays two screens', async () => {
  setup((step) => {
    step.delay = 0;
    step.answers.name = 'Nome configurado';
  });
  fireEvent.keyDown(button('Adicionar componente'), { key: 'Enter' });
  fireEvent.click(screen.getByRole('menuitem', { name: 'Campo de texto' }));
  expect(current().answers.field_1).toBe('Cliente exemplo');

  const flow = current().flow;
  const entry = flow.screens[0];
  entry.terminal = false;
  entry.layout.children.at(-1)!['on-click-action'] = {
    name: 'navigate',
    next: { type: 'screen', name: 'FINISH' },
    payload: {},
  };
  const choices = [
    { id: 'a', title: 'Opção A' },
    { id: 'b', title: 'Opção B' },
  ];
  flow.screens.push({
    id: 'FINISH',
    title: 'Detalhes',
    terminal: true,
    layout: {
      type: 'SingleColumnLayout',
      children: [
        {
          type: 'TextInput',
          name: 'digits',
          label: 'Código',
          required: true,
          'input-type': 'number',
          'min-chars': 3,
        },
        { type: 'TextInput', name: 'mail', label: 'E-mail', 'input-type': 'email', required: true },
        { type: 'TextArea', name: 'note', label: 'Observação', 'max-length': 5 },
        {
          type: 'DatePicker',
          name: 'when',
          label: 'Data',
          required: true,
          'max-date': '2029-02-01',
        },
        { type: 'RadioButtonsGroup', name: 'radio', label: 'Opção única', 'data-source': choices },
        { type: 'Dropdown', name: 'dropdown', label: 'Lista', 'data-source': choices },
        {
          type: 'CheckboxGroup',
          name: 'multi',
          label: 'Múltiplas opções',
          'data-source': choices,
          'min-selected-items': 2,
        },
        { type: 'OptIn', name: 'optional', label: 'Aceite opcional' },
        { type: 'OptIn', name: 'required', label: 'Aceite obrigatório', required: true },
        { type: 'Footer', label: 'Concluir', 'on-click-action': { name: 'complete', payload: {} } },
      ],
    },
  });
  fireEvent.click(tab('JSON'));
  writeJsonEditor(screen.getByLabelText('Flow JSON'), JSON.stringify(flow));
  expect(current().answers).toEqual({
    name: 'Nome configurado',
    field_1: 'Cliente exemplo',
    digits: '100',
    mail: 'cliente@example.com',
    note: 'Clien',
    when: '2029-02-01',
    radio: 'a',
    dropdown: 'a',
    multi: ['a', 'b'],
    optional: false,
    required: true,
  });

  const answers = await openAnswers();
  expect(answers.getByRole('tab', { name: 'Visual' })).toHaveAttribute('aria-selected', 'true');
  const details = within(answers.getByRole('region', { name: 'Detalhes' }));
  expect(details.getByLabelText('Data')).toHaveValue('2029-02-01');
  expect(details.getByRole('checkbox', { name: 'Aceite opcional' })).not.toBeChecked();
  expect(details.getByRole('checkbox', { name: 'Aceite obrigatório' })).toBeChecked();
  expect(details.getByRole('combobox', { name: 'Lista' })).toHaveValue('a');
  fireEvent.change(details.getByLabelText('E-mail'), { target: { value: 'demo@example.com' } });
  const visualTab = answers.getByRole('tab', { name: 'Visual' });
  fireEvent.keyDown(visualTab, { key: 'ArrowRight' });
  const answerJson = answers.getByRole('textbox', { name: /Respostas automáticas \(/ });
  expect(JSON.parse(readJsonEditor(answerJson)).mail).toBe('demo@example.com');

  fireEvent.click(button('Testar Flow'));
  expect(phone().getByLabelText('Nome')).toHaveValue('');
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'performance'] });
  try {
    fireEvent.click(button('Reproduzir automaticamente'));
    await act(async () => vi.advanceTimersByTimeAsync(120_000));
    expect(api().getState().messages.at(-1)?.text).toBe(current().completion);
    expect(api().getState().running).toBe(false);
  } finally {
    vi.useRealTimers();
  }
});

it('fills only absent answers, preserves an invalid JSON draft, and repairs removed options explicitly', async () => {
  const step = setup((step) => {
    const fields = step.flow.screens[0].layout.children;
    fields.splice(
      1,
      0,
      { type: 'TextInput', name: 'email', label: 'E-mail', required: true, 'input-type': 'email' },
      { type: 'OptIn', name: 'accept', label: 'Aceite' },
      {
        type: 'CheckboxGroup',
        name: 'options',
        label: 'Escolhas',
        'data-source': [{ id: 'a', title: 'Opção A' }],
      },
      {
        type: 'Dropdown',
        name: 'choice',
        label: 'Opção',
        'data-source': [
          { id: 'old', title: 'Antiga' },
          { id: 'new', title: 'Nova' },
        ],
      },
    );
    step.answers = { name: 'Ana', accept: false, options: [], choice: 'old' };
  });
  const answers = await openAnswers();
  expect(button('Iniciar manual')).toBeEnabled();
  expect(button('Reproduzir automaticamente')).toBeDisabled();
  fireEvent.click(answers.getByRole('button', { name: 'Preencher respostas faltantes' }));
  expect(current().answers).toEqual({ ...step.answers, email: 'cliente@example.com' });

  fireEvent.click(answers.getByRole('tab', { name: 'JSON' }));
  const input = answers.getByRole('textbox', { name: /Respostas automáticas \(/ });
  const formatted = JSON.stringify({ ...current().answers, name: 'Ana no JSON' }, null, 4);
  writeJsonEditor(input, formatted);
  expect(readJsonEditor(input)).toBe(formatted);
  writeJsonEditor(input, '{incompleto');
  fireEvent.click(answers.getByRole('tab', { name: 'Visual' }));
  const name = answers.getByRole('textbox', { name: 'Nome' });
  expect(name).toHaveValue('Ana no JSON');
  expect(name).toBeDisabled();
  expect(button('Iniciar manual')).toBeEnabled();
  fireEvent.click(answers.getByRole('tab', { name: 'JSON' }));
  expect(readJsonEditor(input)).toBe('{incompleto');
  fireEvent.click(answers.getByRole('button', { name: 'Descartar rascunho de respostas' }));
  expect(JSON.parse(readJsonEditor(input)).name).toBe('Ana no JSON');

  const flow = current().flow;
  const choice = flow.screens[0].layout.children.find((field) => field.name === 'choice')!;
  choice['data-source'] = [{ id: 'new', title: 'Nova' }];
  const structure = within(document.querySelector('.flow-json')!);
  fireEvent.click(structure.getByRole('tab', { name: 'JSON' }));
  writeJsonEditor(structure.getByLabelText('Flow JSON'), JSON.stringify(flow));
  expect(current().answers.choice).toBe('old');
  expect(button('Iniciar manual')).toBeEnabled();
  expect(button('Reproduzir automaticamente')).toBeDisabled();
  fireEvent.click(answers.getByRole('tab', { name: 'Visual' }));
  expect(answers.getByRole('combobox', { name: 'Opção' })).toHaveAttribute('aria-invalid', 'true');
  fireEvent.click(answers.getByRole('button', { name: 'Usar sugestão' }));
  expect(current().answers.choice).toBe('new');
  expect(button('Reproduzir automaticamente')).toBeEnabled();
});

it('fills a common shared choice and guides dynamic choices to JSON', async () => {
  setup((step) => {
    const first = step.flow.screens[0];
    const footer = first.layout.children.at(-1)!;
    first.terminal = false;
    const options = [{ id: 'allowed', title: 'Opção dinâmica' }];
    footer['on-click-action'] = {
      name: 'navigate',
      next: { type: 'screen', name: 'SECOND' },
      payload: { options },
    };
    first.layout.children.splice(1, 0, {
      type: 'Dropdown',
      name: 'shared',
      label: 'Primeira escolha',
      'data-source': [
        { id: 'first', title: 'Primeira' },
        { id: 'common', title: 'Em comum' },
      ],
    });
    step.flow.screens.push({
      id: 'SECOND',
      title: 'Segunda tela',
      terminal: true,
      data: { options: { type: 'array', __example__: options } },
      layout: {
        type: 'SingleColumnLayout',
        children: [
          {
            type: 'Dropdown',
            name: 'shared',
            label: 'Segunda escolha',
            'data-source': [
              { id: 'second', title: 'Segunda' },
              { id: 'common', title: 'Em comum' },
            ],
          },
          {
            type: 'Dropdown',
            name: 'dynamic',
            label: 'Escolha dinâmica',
            required: true,
            'data-source': '${data.options}',
          },
          {
            type: 'Footer',
            label: 'Concluir',
            'on-click-action': { name: 'complete', payload: {} },
          },
        ],
      },
    });
  });
  const answers = await openAnswers();
  fireEvent.click(answers.getByRole('button', { name: 'Preencher respostas faltantes' }));
  expect(current().answers.shared).toBe('common');
  expect(current().answers).not.toHaveProperty('dynamic');
  expect(answers.getAllByText(/Resposta compartilhada/)).toHaveLength(2);
  expect(answers.getByText(/As opções dependem dos dados/)).toBeVisible();
  expect(button('Reproduzir automaticamente')).toBeDisabled();
  fireEvent.click(answers.getByRole('button', { name: 'Editar respostas em JSON' }));
  const input = answers.getByRole('textbox', { name: /Respostas automáticas \(/ });
  writeJsonEditor(input, JSON.stringify({ ...current().answers, dynamic: 'allowed' }));
  expect(button('Reproduzir automaticamente')).toBeEnabled();
});
