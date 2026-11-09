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

it('commits the selected icon and custom color only when Apply is pressed', async () => {
  const user = userEvent.setup();
  render(<App />);
  const open = async () => {
    await user.click(screen.getByRole('button', { name: 'Editar ícone da empresa' }));
    return within(screen.getByRole('dialog', { name: 'Ícone da empresa' }));
  };
  const current = () => window.whatsDemo!.getProject().contact;

  let picker = await open();
  await user.click(picker.getByRole('radio', { name: 'Carro' }));
  await user.click(
    within(picker.getByRole('group', { name: 'Cor de fundo' })).getByRole('radio', {
      name: 'Azul',
    }),
  );
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
  const colors = within(picker.getByRole('group', { name: 'Cor de fundo' }));
  expect(colors.getAllByRole('radio').map((color) => color.getAttribute('aria-label'))).toEqual([
    'Verde',
    'Azul',
    'Rosa',
    'Amarelo',
    'Branco',
    'Verde-escuro',
    'Azul-escuro',
    'Vermelho',
    'Laranja',
    'Preto',
  ]);
  const custom = colors.getByLabelText('Escolher outra cor');
  expect(custom).toHaveAttribute('type', 'color');
  fireEvent.change(custom, { target: { value: '#f1f5f9' } });
  expect(document.querySelector('.contact-avatar-preview .avatar circle')).toHaveAttribute(
    'fill',
    '#F1F5F9',
  );
  expect(current()).not.toHaveProperty('iconBackground');
  await user.click(picker.getByRole('button', { name: 'Aplicar' }));
  expect(current()).toMatchObject({ icon: 'tooth', iconBackground: '#F1F5F9' });
  expect(document.querySelector('.chat-header .avatar circle')).toHaveAttribute('fill', '#F1F5F9');

  picker = await open();
  expect(picker.getByRole('radio', { name: 'Dente' })).toBeChecked();
  await user.click(picker.getByRole('button', { name: 'Restaurar padrão' }));
  await user.keyboard('{Escape}');
  expect(current().icon).toBe('tooth');
});

it('customizes the glyph independently and restores automatic contrast', async () => {
  const user = userEvent.setup();
  render(<App />);
  const open = async () => {
    await user.click(screen.getByRole('button', { name: 'Editar ícone da empresa' }));
    return within(screen.getByRole('dialog', { name: 'Ícone da empresa' }));
  };
  const contact = () => window.whatsDemo!.getProject().contact;
  const preview = () => document.querySelector('.contact-avatar-preview .avatar path');

  let picker = await open();
  const colors = within(picker.getByRole('group', { name: 'Cor do ícone' }));
  expect(colors.getByRole('button', { name: 'Contraste automático' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await user.click(colors.getByRole('radio', { name: 'Preto' }));
  expect(preview()).toHaveAttribute('fill', '#000000');
  expect(contact()).not.toHaveProperty('iconForeground');

  const custom = colors.getByLabelText('Escolher outra cor');
  fireEvent.change(custom, { target: { value: '#9a305b' } });
  expect(preview()).toHaveAttribute('fill', '#9A305B');
  await user.click(picker.getByRole('button', { name: 'Aplicar' }));
  expect(contact()).toMatchObject({ iconForeground: '#9A305B' });
  expect(contact()).not.toHaveProperty('iconBackground');
  expect(document.querySelector('.chat-header .avatar path')).toHaveAttribute('fill', '#9A305B');

  picker = await open();
  await user.click(picker.getByRole('button', { name: 'Contraste automático' }));
  expect(preview()).toHaveAttribute('fill', '#fff');
  await user.click(picker.getByRole('button', { name: 'Aplicar' }));
  expect(contact()).not.toHaveProperty('iconForeground');
});
