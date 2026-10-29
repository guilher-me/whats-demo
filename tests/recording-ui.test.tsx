// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import axe from 'axe-core';
import { App } from '../src/app/App';
import { STORAGE_KEY } from '../src/core/project';
import { preparePhoneRecording } from '../src/features/recording/session';
vi.mock('../src/features/recording/session', () => ({
  preparePhoneRecording: vi.fn(),
  recordingSupport: () => '',
}));
const revoke = vi.fn();
beforeEach(() => {
  vi.useFakeTimers();
  vi.clearAllMocks();
  localStorage.clear();
  history.replaceState(null, '', '/');
  const NativeURL = URL;
  vi.stubGlobal(
    'URL',
    class extends NativeURL {
      static createObjectURL = () => 'blob:recording-test';
      static revokeObjectURL = revoke;
    },
  );
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});
async function start() {
  const project = {
    version: 1,
    contact: { name: 'Empresa teste', avatar: '', verified: false },
    steps: [{ id: 'hello', type: 'user', text: 'oi', delay: 0 }],
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(project));
  const session = {
    start: vi.fn(),
    cancel: vi.fn(),
    finish: vi.fn(async () => ({
      blob: new Blob(['video'], { type: 'video/webm' }),
      extension: 'webm' as const,
      width: 720,
      height: 1280,
      durationMs: 4000,
    })),
  };
  vi.mocked(preparePhoneRecording).mockResolvedValue(session);
  render(<App />);
  await act(async () => {});
  return { project, session };
}
async function tick(ms: number) {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });
}
it('grava manualmente, bloqueia alterações e oferece download acessível com extensão correta', async () => {
  const { project, session } = await start();
  fireEvent.click(screen.getByRole('button', { name: 'Gravar celular' }));
  fireEvent.click(screen.getByRole('button', { name: /^Gravar manualmente/ }));
  await tick(3001);
  expect(session.start).toHaveBeenCalledOnce();
  expect(document.querySelector('.editor')).toHaveAttribute('inert');
  expect(() => window.whatsappFakeFlows!.loadProject(project)).toThrow('gravação');
  expect(screen.getByRole('button', { name: 'Parar reprodução' })).toBeDisabled();
  fireEvent.change(screen.getByLabelText('Mensagem'), { target: { value: 'oi' } });
  fireEvent.click(screen.getByRole('button', { name: 'Enviar mensagem' }));
  await tick(2000);
  expect(screen.getByRole('button', { name: 'Finalizar gravação' })).toBeEnabled();
  expect(screen.queryByRole('dialog', { name: 'Gravação pronta' })).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Finalizar gravação' }));
  await tick(0);
  const result = screen.getByRole('dialog', { name: 'Gravação pronta' });
  expect(within(result).getByRole('link', { name: 'Baixar vídeo' })).toHaveAttribute(
    'download',
    expect.stringMatching(/\.webm$/),
  );
  expect(within(result).getByLabelText('Vídeo da jornada gravada')).toHaveAttribute(
    'src',
    'blob:recording-test',
  );
  fireEvent.click(within(result).getByRole('button', { name: 'Descartar' }));
  expect(revoke).toHaveBeenCalledWith('blob:recording-test');
  expect(document.querySelector('.editor')).not.toHaveAttribute('inert');
});
it('cancela a contagem pela interface e volta a liberar a edição', async () => {
  const { session } = await start();
  fireEvent.click(screen.getByRole('button', { name: 'Gravar celular' }));
  fireEvent.click(screen.getByRole('button', { name: /^Gravar automaticamente/ }));
  await tick(1000);
  fireEvent.click(screen.getByRole('button', { name: 'Cancelar gravação' }));
  await tick(4000);
  expect(session.cancel).toHaveBeenCalled();
  expect(session.start).not.toHaveBeenCalled();
  expect(screen.getByRole('button', { name: 'Gravar celular' })).toBeEnabled();
});
it('apresenta erros de preparação em um diálogo sem deixar a interface bloqueada', async () => {
  await start();
  vi.mocked(preparePhoneRecording).mockRejectedValueOnce(new Error('Captura indisponível'));
  fireEvent.click(screen.getByRole('button', { name: 'Gravar celular' }));
  fireEvent.click(screen.getByRole('button', { name: /^Gravar manualmente/ }));
  await tick(1);
  expect(screen.getByRole('dialog', { name: 'Não foi possível gravar' })).toHaveTextContent(
    'Captura indisponível',
  );
  expect(document.querySelector('.editor')).not.toHaveAttribute('inert');
});
it('mantém a semântica acessível no diálogo de configuração', async () => {
  await start();
  fireEvent.click(screen.getByRole('button', { name: 'Gravar celular' }));
  vi.useRealTimers();
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
  const result = await axe.run(document.body, { rules: { 'color-contrast': { enabled: false } } });
  expect(result.violations.map((v) => v.id)).toEqual([]);
});
