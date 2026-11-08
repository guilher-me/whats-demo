// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, expect, it } from 'vitest';
import { App } from '../src/app/App';

afterEach(() => {
  cleanup();
  localStorage.clear();
  history.replaceState(null, '', '/');
});

it('commits the selected icon and HEX only when Apply is pressed', async () => {
  const user = userEvent.setup();
  render(<App />);
  const open = async () => {
    await user.click(screen.getByRole('button', { name: 'Editar ícone da empresa' }));
    return within(screen.getByRole('dialog', { name: 'Ícone da empresa' }));
  };
  const current = () => window.whatsappFakeFlows!.getProject().contact;

  let picker = await open();
  await user.click(picker.getByRole('radio', { name: 'Carro' }));
  await user.click(picker.getByRole('radio', { name: 'Azul' }));
  expect(picker.getByText('car', { selector: 'code' })).toBeVisible();
  expect(current()).not.toHaveProperty('icon');
  await user.click(picker.getByRole('button', { name: 'Cancelar' }));
  expect(current()).not.toHaveProperty('iconBackground');

  picker = await open();
  await user.click(picker.getByRole('radio', { name: 'Cachorro' }));
  await user.click(picker.getByRole('button', { name: 'Fechar diálogo' }));
  expect(current()).not.toHaveProperty('icon');

  picker = await open();
  await user.click(picker.getByRole('radio', { name: 'Dente' }));
  const hex = picker.getByRole('textbox', { name: 'HEX personalizado' });
  fireEvent.change(hex, { target: { value: 'invalid' } });
  expect(picker.getByRole('button', { name: 'Aplicar' })).toBeDisabled();
  expect(picker.getByRole('alert')).toBeVisible();
  fireEvent.change(hex, { target: { value: 'f1f5f9' } });
  await user.click(picker.getByRole('button', { name: 'Aplicar' }));
  expect(current()).toMatchObject({ icon: 'tooth', iconBackground: '#F1F5F9' });
  expect(document.querySelector('.chat-header .avatar circle')).toHaveAttribute('fill', '#F1F5F9');

  picker = await open();
  expect(picker.getByRole('radio', { name: 'Dente' })).toBeChecked();
  await user.click(picker.getByRole('button', { name: 'Restaurar padrão' }));
  await user.keyboard('{Escape}');
  expect(current().icon).toBe('tooth');
});
