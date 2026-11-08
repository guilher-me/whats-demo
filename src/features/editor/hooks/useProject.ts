import { useCallback, useEffect, useState, useRef } from 'react';
import type { Project, Step } from '../../../core/types';
import { clone, normalizeProject, projectStorageKey, uid } from '../../../core/project';
import { t } from '../../../i18n';

export type SaveState = 'empty' | 'recovered' | 'saving' | 'saved' | 'failed' | 'shared';
export interface SharedCopy {
  project: Project;
  token: string;
}

export function useProject(copy?: SharedCopy) {
  const edited = useRef(false);
  const [storageKey] = useState(() => {
    const base = projectStorageKey(window.location);
    return copy ? base + ':copy:' + copy.token : base;
  });
  const [initial] = useState<{ project: Project; state: SaveState; error?: string }>(() => {
    const fallback: { project: Project; state: SaveState } = copy
      ? { project: copy.project, state: 'shared' }
      : {
          project: { version: 1, contact: { name: '', verified: false }, steps: [] },
          state: 'empty',
        };
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw)
        return {
          project: normalizeProject(JSON.parse(raw), { allowDrafts: true }),
          state: 'recovered',
        };
    } catch {
      return { ...fallback, error: t('storage.recoveryError') };
    }
    return fallback;
  });
  const [project, setProject] = useState(initial.project);
  const [revision, setRevision] = useState(0);
  const [saveState, setSaveState] = useState<SaveState>(initial.state);
  const [error, setError] = useState(initial.error ?? '');
  useEffect(() => {
    if (!edited.current) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(project));
      setSaveState('saved');
    } catch {
      setSaveState('failed');
    }
    edited.current = false;
  }, [project, storageKey]);
  const update = useCallback((change: (value: Project) => Project) => {
    edited.current = true;
    setSaveState('saving');
    setError('');
    setProject(change);
  }, []);
  const updateStep = (id: string, change: Partial<Step>) =>
    update((project) => ({
      ...project,
      steps: project.steps.map((step) =>
        step.id === id ? ({ ...step, ...change } as Step) : step,
      ),
    }));
  const action = (id: string, type: 'up' | 'down' | 'copy' | 'delete') =>
    update((project) => {
      const steps = [...project.steps];
      const index = steps.findIndex((step) => step.id === id);
      if (index < 0) return project;
      if (type === 'delete') steps.splice(index, 1);
      if (type === 'copy') steps.splice(index + 1, 0, { ...clone(steps[index]), id: uid() });
      if (type === 'up' && index > 0)
        [steps[index - 1], steps[index]] = [steps[index], steps[index - 1]];
      if (type === 'down' && index < steps.length - 1)
        [steps[index + 1], steps[index]] = [steps[index], steps[index + 1]];
      return { ...project, steps };
    });
  const replace = (next: Project) => {
    update(() => next);
    setRevision((value) => value + 1);
  };
  return { project, revision, error, saveState, update, updateStep, action, replace };
}
