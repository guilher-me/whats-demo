// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import axe from 'axe-core';
import { App } from '../src/app/App';
import { createStep, STORAGE_KEY } from '../src/core/project';
import { createInteractive } from '../src/core/interactive';
import { SelectField } from '../src/components/ui/SelectField';
import { useState } from 'react';
import { i18n, locales, t } from '../src/i18n';

beforeEach(() => {
  Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
    configurable: true,
    value: vi.fn(),
  });
  localStorage.clear();
  history.replaceState(null, '', '/');
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  Reflect.deleteProperty(HTMLElement.prototype, 'scrollIntoView');
});
async function start() {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      version: 1,
      contact: { name: 'Store', avatar: '', verified: true },
      steps: [
        { id: 'hello', type: 'user', text: 'Hello', delay: 0.4 },
        {
          id: 'choices',
          type: 'business',
          text: 'Choose a service',
          delay: 1,
          interactive: createInteractive('buttons'),
        },
        { ...createStep('flow'), id: 'form' },
      ],
    }),
  );
  render(<App />);
  await act(async () => {});
}
it('expands one step at a time, collapses it and preserves the project', async () => {
  await start();
  const before = window.whatsappFakeFlows!.getProject();
  expect(screen.getByRole('button', { name: 'Recolher etapa 1' })).toHaveAttribute(
    'aria-expanded',
    'true',
  );
  fireEvent.click(screen.getByRole('button', { name: 'Editar etapa 2' }));
  expect(screen.getByRole('button', { name: 'Editar etapa 1' })).toHaveAttribute(
    'aria-expanded',
    'false',
  );
  expect(screen.getByRole('button', { name: 'Recolher etapa 2' })).toHaveAttribute(
    'aria-expanded',
    'true',
  );
  fireEvent.click(screen.getByRole('button', { name: 'Recolher etapa 2' }));
  expect(screen.getAllByRole('button', { name: /Editar etapa/ })).toHaveLength(3);
  expect(window.whatsappFakeFlows!.getProject()).toEqual(before);
});
it('keeps an invalid Flow draft and its validation when the step is collapsed', async () => {
  await start();
  fireEvent.click(screen.getByRole('button', { name: 'Editar etapa 3' }));
  fireEvent.change(screen.getByLabelText('Flow JSON'), { target: { value: '{broken' } });
  expect(screen.getByRole('button', { name: 'Iniciar manual' })).toBeDisabled();
  fireEvent.click(screen.getByRole('button', { name: 'Editar etapa 1' }));
  fireEvent.click(screen.getByRole('button', { name: 'Editar etapa 3' }));
  expect(screen.getByLabelText('Flow JSON')).toHaveValue('{broken');
  expect(screen.getByRole('button', { name: 'Iniciar manual' })).toBeDisabled();
});
it('opens the actions of a collapsed step without expanding its editor', async () => {
  const user = userEvent.setup();
  await start();
  const card = screen.getByRole('article', { name: 'Etapa 2' });
  const toggle = within(card).getByRole('button', { name: 'Editar etapa 2' });
  const trigger = within(card).getByRole('button', { name: 'Ações da etapa' });
  act(() => trigger.focus());
  await user.keyboard('{Enter}');
  expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await user.keyboard('{Escape}');
  expect(toggle).toHaveAttribute('aria-expanded', 'false');
});
it('supports keyboard menus, Escape focus return, duplication and disabled boundaries', async () => {
  const user = userEvent.setup();
  await start();
  const card = screen.getByRole('article', { name: 'Etapa 1' });
  const trigger = within(card).getByRole('button', { name: 'Ações da etapa' });
  act(() => trigger.focus());
  await user.keyboard('{Enter}');
  expect(screen.getByRole('menuitem', { name: 'Mover para cima' })).toHaveAttribute(
    'data-disabled',
  );
  await user.keyboard('{Escape}');
  expect(trigger).toHaveFocus();
  await user.keyboard('{Enter}');
  await user.click(screen.getByRole('menuitem', { name: 'Duplicar etapa' }));
  const steps = window.whatsappFakeFlows!.getProject().steps;
  expect(steps).toHaveLength(4);
  expect(steps[0].text).toBe(steps[1].text);
  expect(new Set(steps.map((step) => step.id)).size).toBe(4);
});
function SelectHarness() {
  const [value, setValue] = useState('a');
  return (
    <>
      <SelectField
        label="Reply"
        value={value}
        onValueChange={setValue}
        options={[
          { value: 'a', label: 'Alpha' },
          { value: 'b', label: 'Beta' },
        ]}
      />
      <output>{value}</output>
    </>
  );
}
it('supports a custom select using keyboard navigation', async () => {
  const user = userEvent.setup();
  render(<SelectHarness />);
  const trigger = screen.getByRole('combobox', { name: 'Reply' });
  act(() => trigger.focus());
  await user.keyboard('{Enter}');
  await user.keyboard('{ArrowDown}{Enter}');
  expect(screen.getByRole('status')).toHaveTextContent('b');
  expect(trigger).toHaveTextContent('Beta');
});
it.each(locales)(
  'provides accessible editor disclosures and format controls in %s',
  async (locale) => {
    await i18n.changeLanguage(locale);
    await start();
    fireEvent.click(screen.getByRole('button', { name: t('editor.expandStep', { v0: 2 }) }));
    const group = screen.getByRole('group', { name: t('editor.format') });
    expect(within(group).getAllByRole('radio')).toHaveLength(3);
    const results = await axe.run(document.body, {
      rules: { 'color-contrast': { enabled: false } },
    });
    expect(results.violations.map((result) => result.id)).toEqual([]);
  },
);
