import { useCallback, useEffect, useState, useRef } from 'react';
import type { Project, Step } from '../../../core/types';
import { createDefaultProject } from '../../../core/defaults';
import { clone, createStep, normalizeProject, projectStorageKey, uid } from '../../../core/project';
import { prepareProjectImages } from '../../../core/images/sanitize';
import { prepareAttachments } from '../../../core/images/prepare-attachments';
import { t } from '../../../i18n';
export type SaveState = 'example' | 'recovered' | 'saving' | 'saved' | 'failed' | 'shared';
export function useProject() {
  const edited = useRef(false);
  const [storageKey] = useState(() => projectStorageKey(window.location));
  const [initial] = useState<{
    project: Project;
    state: SaveState;
    pending?: Project;
    error?: string;
  }>(() => {
    let hasAttachments = false;
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const input = JSON.parse(raw);
        hasAttachments =
          !!input && typeof input === 'object' && Object.hasOwn(input, 'attachments');
        const project = normalizeProject(input, { allowDrafts: true });
        return project.attachments?.length
          ? { project: createDefaultProject(), state: 'example', pending: project }
          : { project, state: 'recovered' };
      }
    } catch {
      /* Invalid or unavailable storage cannot confirm a saved draft. */
    }
    return {
      project: createDefaultProject(),
      state: 'example',
      ...(hasAttachments ? { error: t('attachments.recoveryError') } : {}),
    };
  });
  const [project, setProject] = useState(initial.project);
  const [loading, setLoading] = useState(!!initial.pending);
  const [revision, setRevision] = useState(0),
    [error, setError] = useState(initial.error ?? ''),
    [saveState, setSaveState] = useState<SaveState>(initial.state);
  const hasWork = useRef(initial.state === 'recovered');
  useEffect(() => {
    if (!initial.pending) return;
    let current = true;
    void prepareAttachments(initial.pending).then(
      (safe) => {
        if (!current) return;
        hasWork.current = true;
        setProject(safe);
        setSaveState('recovered');
        setRevision((value) => value + 1);
        setLoading(false);
      },
      () => {
        if (!current) return;
        setError(t('attachments.recoveryError'));
        setLoading(false);
      },
    );
    return () => {
      current = false;
    };
  }, [initial]);
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
    loading,
    hasDraft: hasWork.current,
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
