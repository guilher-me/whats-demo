// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { parseMessageFormatting } from '../src/core/message-formatting';
import { FormattedMessageText } from '../src/features/conversation/components/FormattedMessageText';
import { App } from '../src/app/App';
import { STORAGE_KEY } from '../src/core/project';
import { encode, decode } from '../src/core/codec';
import { Blob as NativeBlob } from 'node:buffer';
beforeEach(() => {
  localStorage.clear();
  history.replaceState(null, '', '/');
  vi.useFakeTimers();
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});
it('renderiza os três estilos com elementos semânticos e permite combinações', () => {
  const { container } = render(
    <FormattedMessageText text="Olá, *negrito _itálico ~tachado~_* e ~antigo~." />,
  );
  expect(container.querySelector('strong em s')).toHaveTextContent('tachado');
  expect(container.querySelectorAll('s')).toHaveLength(2);
  expect(container).toHaveTextContent('Olá, negrito itálico tachado e antigo.');
});
it.each([
  '*sem fechar',
  '_ com espaço_',
  '~com espaço ~',
  'nome_do_campo',
  '2*3*4',
  '**markdown**',
  '~~markdown~~',
])('mantém texto literal sem um par válido: %s', (text) => {
  expect(parseMessageFormatting(text)).toEqual([{ type: 'text', text }]);
});
it('preserva quebras de linha, acentos e texto HTML como conteúdo inerte', () => {
  const { container } = render(
    <FormattedMessageText text={'<img src=x onerror=alert(1)> *São João*\n_segunda linha_'} />,
  );
  expect(container.querySelector('img')).toBeNull();
  expect(container.querySelector('strong')).toHaveTextContent('São João');
  expect(container.textContent).toBe('<img src=x onerror=alert(1)> São João\nsegunda linha');
});
it('lida com uma mensagem longa de marcadores não fechados sem perder conteúdo', () => {
  const text = '*aberto\n'.repeat(5000);
  expect(parseMessageFormatting(text)).toEqual([{ type: 'text', text }]);
});
it('formata a prévia e a reprodução mantendo a sintaxe original no projeto e no link', async () => {
  const project = {
    version: 1 as const,
    contact: { name: 'Empresa teste', avatar: '', verified: false },
    steps: [{ id: 'a', type: 'business' as const, text: '*Olá* _cliente_ ~antigo~', delay: 0 }],
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(project));
  render(<App />);
  await act(async () => {});
  const editor = screen.getByRole('article', { name: 'Etapa 1' });
  fireEvent.focus(within(editor).getByLabelText('Texto da mensagem'));
  const draft = screen.getByLabelText('Prévia da mensagem em edição', { selector: '.draft-chat' });
  expect(draft.querySelector('strong')).toHaveTextContent('Olá');
  expect(draft.querySelector('em')).toHaveTextContent('cliente');
  expect(draft.querySelector('s')).toHaveTextContent('antigo');
  expect(within(editor).getByLabelText('Texto da mensagem')).toHaveValue(project.steps[0].text);
  fireEvent.click(screen.getByRole('button', { name: 'Iniciar manual' }));
  await act(async () => {
    await vi.advanceTimersByTimeAsync(1);
  });
  expect(document.querySelector('.messages strong')).toHaveTextContent('Olá');
  expect(window.whatsappFakeFlows!.getProject().steps[0].text).toBe(project.steps[0].text);
  vi.stubGlobal('Blob', NativeBlob);
  expect(await decode(await encode(window.whatsappFakeFlows!.getProject()))).toEqual(project);
});
it('formata mensagens digitadas pelo cliente', async () => {
  const project = {
    version: 1,
    contact: { name: 'Empresa teste', avatar: '', verified: false },
    steps: [{ id: 'a', type: 'user', text: 'oi', delay: 0 }],
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(project));
  render(<App />);
  await act(async () => {});
  fireEvent.click(screen.getByRole('button', { name: 'Iniciar manual' }));
  fireEvent.change(screen.getByLabelText('Mensagem'), {
    target: { value: 'Quero *agendar* uma _consulta_.' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Enviar mensagem' }));
  await act(async () => {});
  expect(document.querySelector('.bubble.user strong')).toHaveTextContent('agendar');
  expect(document.querySelector('.bubble.user em')).toHaveTextContent('consulta');
});
