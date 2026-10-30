// @vitest-environment jsdom
import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { useProject } from '../src/features/editor/hooks/useProject';
import { normalizeProject, STORAGE_KEY } from '../src/core/project';
import { encode } from '../src/core/codec';
import { createDefaultProject } from '../src/core/defaults';
import legacy from './fixtures/v1-project.json';
beforeEach(() => {
  localStorage.clear();
  history.replaceState(null, '', '/');
  vi.stubGlobal('CompressionStream', undefined);
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
it('ignores old shared URL data entirely', async () => {
  history.replaceState(null, '', '/#project=invalid');
  const { result } = renderHook(useProject);
  await act(async () => {});
  expect(result.current.project).toEqual(createDefaultProject());
});
it('removes unsupported photos from saved drafts while preserving their messages', async () => {
  const project = normalizeProject(legacy);
  project.contact.avatar = 'https://attacker.test/tracking.png';
  localStorage.setItem(STORAGE_KEY, JSON.stringify(project));
  const { result } = renderHook(useProject);
  await act(async () => {});
  expect(result.current.project.contact.avatar).toBe('');
  expect(result.current.project.steps).toEqual(project.steps);
  expect(result.current.saveState).toBe('recovered');
});
