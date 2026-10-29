// @vitest-environment jsdom
import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { useRecording } from '../src/features/recording/useRecording';
import { preparePhoneRecording } from '../src/features/recording/session';
import { formatElapsed, type PhoneRecording } from '../src/features/recording/types';
vi.mock('../src/features/recording/session', () => ({ preparePhoneRecording: vi.fn() }));
const revoke = vi.fn();
beforeEach(() => {
  vi.useFakeTimers();
  vi.clearAllMocks();
  const NativeURL = URL;
  vi.stubGlobal(
    'URL',
    class extends NativeURL {
      static createObjectURL = vi.fn(() => 'blob:test-recording');
      static revokeObjectURL = revoke;
    },
  );
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});
function setup() {
  const session = {
    start: vi.fn(),
    cancel: vi.fn(),
    finish: vi.fn(async () => ({
      blob: new Blob(['clip']),
      extension: 'webm' as const,
      width: 720,
      height: 1280,
      durationMs: 5000,
    })),
  };
  vi.mocked(preparePhoneRecording).mockResolvedValue(session);
  let complete!: () => void,
    status = 'Em andamento';
  const run = vi.fn(
    () =>
      new Promise<void>((resolve) => {
        complete = () => {
          status = 'Conversa concluída.';
          resolve();
        };
      }),
  );
  const stop = vi.fn();
  const hook = renderHook(() =>
    useRecording({
      phone: { current: document.createElement('div') },
      prepare: vi.fn(),
      run,
      stopPlayback: stop,
      playbackStatus: () => status,
    }),
  );
  return { ...hook, session, run, stop, complete: () => complete() };
}
async function tick(ms: number) {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });
}
it('conta 3 segundos, grava automaticamente e encerra 2 segundos após a jornada', async () => {
  const app = setup();
  act(() => {
    void app.result.current.start('automatic');
  });
  await tick(0);
  expect(app.result.current.phase).toBe('countdown');
  await tick(2999);
  expect(app.session.start).not.toHaveBeenCalled();
  await tick(1);
  expect(app.run).toHaveBeenCalledWith(true);
  expect(app.result.current.phase).toBe('recording');
  act(app.complete);
  await tick(1999);
  expect(app.session.finish).not.toHaveBeenCalled();
  await tick(1);
  expect(app.result.current.result?.url).toBe('blob:test-recording');
  expect(app.result.current.busy).toBe(false);
});
it('mantém gravação manual até finalizar e revoga a URL ao descartar', async () => {
  const app = setup();
  act(() => {
    void app.result.current.start('manual');
  });
  await tick(3001);
  expect(app.run).toHaveBeenCalledWith(false);
  act(app.complete);
  await tick(5000);
  expect(app.result.current.phase).toBe('recording');
  await act(async () => {
    await app.result.current.finish();
  });
  expect(app.result.current.result?.extension).toBe('webm');
  expect(app.stop).toHaveBeenCalled();
  act(() => app.result.current.discard());
  expect(revoke).toHaveBeenCalledWith('blob:test-recording');
});
it('cancela durante a contagem sem iniciar a jornada', async () => {
  const app = setup();
  act(() => {
    void app.result.current.start('automatic');
  });
  await tick(1000);
  act(() => app.result.current.cancel());
  await tick(5000);
  expect(app.session.cancel).toHaveBeenCalled();
  expect(app.run).not.toHaveBeenCalled();
  expect(app.result.current.phase).toBe('idle');
});
it('cancela uma preparação que terminou depois do cancelamento', async () => {
  const app = setup();
  let resolve!: (session: PhoneRecording) => void;
  vi.mocked(preparePhoneRecording).mockReturnValueOnce(
    new Promise((done) => {
      resolve = done;
    }),
  );
  act(() => {
    void app.result.current.start('manual');
  });
  await tick(0);
  act(() => app.result.current.cancel());
  await act(async () => resolve(app.session));
  expect(app.session.cancel).toHaveBeenCalled();
  expect(app.result.current.phase).toBe('idle');
  expect(app.run).not.toHaveBeenCalled();
});
it('encerra a sessão ao desmontar e formata o contador sem reiniciar em um minuto', async () => {
  const app = setup();
  act(() => {
    void app.result.current.start('manual');
  });
  await tick(3001);
  app.unmount();
  expect(app.session.cancel).toHaveBeenCalled();
  expect(formatElapsed(75)).toBe('01:15');
});
