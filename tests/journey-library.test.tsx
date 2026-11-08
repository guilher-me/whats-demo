// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { act, cleanup, fireEvent, render, renderHook, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { App } from '../src/app/App';
import type { Project } from '../src/core/types';
import * as codec from '../src/core/codec';
import {
  localJourneyId,
  setJourneyAddress,
  useLiveJourneyLink,
} from '../src/features/journeys/live-link';
import type { Journey } from '../src/features/journeys/storage';
import { savedJourney } from './fixtures/journey-library';

beforeEach(() => {
  localStorage.clear();
  history.replaceState(null, '', '/');
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

function project(name: string): Project {
  return {
    version: 1,
    contact: { name, verified: false },
    steps: [{ id: 'hello', type: 'business', text: 'Olá', delay: 0 }],
  };
}

it('creates an empty journey and reopens the prior titled record without merging their contents', () => {
  render(<App />);
  fireEvent.change(screen.getByLabelText('Título da jornada'), { target: { value: 'Primeira' } });
  fireEvent.change(screen.getByLabelText('Nome do contato'), { target: { value: 'Empresa A' } });
  fireEvent.click(screen.getByRole('button', { name: /Nova jornada/ }));
  expect(screen.getByLabelText('Nome do contato')).toHaveFocus();
  expect(screen.getByLabelText('Nome do contato')).toHaveValue('');
  expect(savedJourney()?.project.steps).toEqual([]);
  fireEvent.change(screen.getByLabelText('Título da jornada'), { target: { value: 'Segunda' } });
  fireEvent.keyDown(screen.getByRole('button', { name: 'Minhas jornadas' }), { key: 'Enter' });
  expect(screen.getByRole('menuitemradio', { name: 'Segunda' })).toHaveAttribute(
    'aria-checked',
    'true',
  );
  fireEvent.click(screen.getByRole('menuitemradio', { name: 'Primeira' }));
  expect(screen.getByLabelText('Nome do contato')).toHaveValue('Empresa A');
  expect(savedJourney()?.title).toBe('Primeira');
  cleanup();
  render(<App />);
  expect(screen.getByLabelText('Nome do contato')).toHaveValue('Empresa A');
});

it('keeps a late compression result from replacing a different journey address', async () => {
  vi.useFakeTimers();
  let finish!: (value: string) => void;
  const first: Journey = { id: 'a', title: '', updatedAt: 0, project: project('A') };
  const second: Journey = { id: 'b', title: '', updatedAt: 0, project: project('B') };
  const encode = vi
    .spyOn(codec, 'createShareURL')
    .mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    )
    .mockResolvedValueOnce('https://example.test/#editor=v3z.B&lang=pt-BR');
  const hook = renderHook(({ item, blocked }) => useLiveJourneyLink(item, true, blocked, 'pt-BR'), {
    initialProps: { item: first, blocked: false },
  });
  await act(() => vi.advanceTimersByTimeAsync(500));
  expect(encode).toHaveBeenCalledTimes(1);
  setJourneyAddress(second.id, '');
  hook.rerender({ item: second, blocked: false });
  await act(() => vi.advanceTimersByTimeAsync(500));
  expect(location.hash).toBe('#editor=v3z.B&lang=pt-BR');
  await act(async () => {
    finish('https://example.test/#editor=v3z.A&lang=pt-BR');
  });
  expect(localJourneyId()).toBe('b');
  expect(location.hash).toBe('#editor=v3z.B&lang=pt-BR');
  hook.rerender({ item: { ...second, project: project('Pending') }, blocked: true });
  await act(() => vi.advanceTimersByTimeAsync(500));
  expect(encode).toHaveBeenCalledTimes(2);
  expect(location.hash).toBe('#editor=v3z.B&lang=pt-BR');
});
