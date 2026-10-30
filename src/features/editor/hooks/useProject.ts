import { useCallback, useEffect, useState, useRef } from 'react';
import type { Project, Step } from '../../../core/types';
import { createDefaultProject } from '../../../core/defaults';
import { clone, createStep, normalizeProject, projectStorageKey, uid } from '../../../core/project';
import { useSharedLink } from '../../sharing/useSharedLink';
import { prepareProjectImages } from '../../../core/images/sanitize';
export type SaveState = 'example' | 'recovered' | 'saving' | 'saved' | 'failed' | 'shared';
export function useProject() {
  const edited = useRef(false);
  const [storageKey] = useState(() => projectStorageKey(window.location));
  const [initial] = useState<{ project: Project; state: SaveState }>(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw)
        return {
          project: normalizeProject(JSON.parse(raw), { allowDrafts: true }),
          state: 'recovered',
        };
    } catch {
      /* Invalid or unavailable storage cannot confirm a saved draft. */
    }
    return { project: createDefaultProject(), state: 'example' };
  });
  const [project, setProject] = useState(initial.project);
  const [revision, setRevision] = useState(0),
    [error, setError] = useState(''),
    [saveState, setSaveState] = useState<SaveState>(initial.state);
  const hasWork = useRef(initial.state === 'recovered');
  const link = useSharedLink({
    current: () => ({ project, hasWork: hasWork.current }),
    accept: (shared, persist) => {
      hasWork.current = true;
      edited.current = persist;
      setProject(shared);
      setRevision((n) => n + 1);
      setSaveState(persist ? 'saving' : 'shared');
      setError('');
    },
  });
  // Also rewrite recovered drafts and synchronous automation loads. Preserve concurrent edits.
  useEffect(() => {
    let current = true;
    const avatar = project.contact.avatar;
    void prepareProjectImages(project).then((safe) => {
      if (current && safe.contact.avatar !== avatar) {
        setProject((value) =>
          value.contact.avatar === avatar
            ? { ...value, contact: { ...value.contact, avatar: safe.contact.avatar } }
            : value,
        );
      }
    });
    return () => {
      current = false;
    };
  }, [project.contact.avatar]);
  useEffect(() => {
    if (!edited.current) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(project));
      setSaveState('saved');
    } catch {
      setSaveState('failed');
    }
    edited.current = false;
  }, [project]);
  const update = useCallback((change: (value: Project) => Project) => {
    edited.current = true;
    hasWork.current = true;
    setSaveState('saving');
    setProject(change);
  }, []);
  const updateStep = (id: string, change: Partial<Step>) =>
    update((p) => ({
      ...p,
      steps: p.steps.map((s) => (s.id === id ? ({ ...s, ...change } as Step) : s)),
    }));
  const action = (id: string, type: 'up' | 'down' | 'copy' | 'delete') =>
    update((p) => {
      const steps = [...p.steps],
        index = steps.findIndex((s) => s.id === id);
      if (index < 0) return p;
      if (type === 'delete') steps.splice(index, 1);
      if (type === 'copy') steps.splice(index + 1, 0, { ...clone(steps[index]), id: uid() });
      if (type === 'up' && index > 0)
        [steps[index - 1], steps[index]] = [steps[index], steps[index - 1]];
      if (type === 'down' && index < steps.length - 1)
        [steps[index + 1], steps[index]] = [steps[index], steps[index + 1]];
      return { ...p, steps };
    });
  const add = (type: Step['type']) =>
    update((p) => ({ ...p, steps: [...p.steps, createStep(type)] }));
  const restore = () => {
    update(() => createDefaultProject());
    setRevision((n) => n + 1);
    setError('');
  };
  const replace = (project: Project) => {
    update(() => project);
    setRevision((n) => n + 1);
    setError('');
  };
  return {
    project,
    revision,
    loading: link.loading,
    hasDraft: hasWork.current,
    link,
    error,
    setError,
    saveState,
    update,
    updateStep,
    action,
    add,
    restore,
    replace,
  };
}
