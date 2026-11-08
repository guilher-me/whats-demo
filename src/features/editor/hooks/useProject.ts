import { useCallback, useEffect, useState, useRef } from 'react';
import type { Project, Step } from '../../../core/types';
import { clone, projectStorageKey, uid } from '../../../core/project';
import { t } from '../../../i18n';
import { loadSharedProject } from '../../../core/codec';
import {
  journeyStorage,
  libraryKey,
  readLegacy,
  readLocalLibrary,
  type Journey,
  type Library,
} from '../../journeys/storage';
import { setJourneyAddress } from '../../journeys/live-link';

export type SaveState = 'empty' | 'recovered' | 'saving' | 'saved' | 'failed' | 'shared';
export interface SharedCopy {
  project: Project;
  token: string;
}

interface Initialization {
  journey: Journey;
  items: Journey[];
  ready: boolean;
  failed?: boolean;
  migrations?: Journey[];
}

function emptyProject(): Project {
  return { version: 1, contact: { name: '', verified: false }, steps: [] };
}

function newJourney(project = emptyProject(), source?: string): Journey {
  return { id: uid(), title: '', updatedAt: Date.now(), project, source };
}

function draftEntry<T>(drafts: Record<string, T> | undefined, id: string, value?: T) {
  if (value !== undefined) return { ...drafts, [id]: value };
  if (!drafts || !Object.hasOwn(drafts, id)) return drafts;
  const next = { ...drafts };
  delete next[id];
  return Object.keys(next).length ? next : undefined;
}

export function useProject(copy?: SharedCopy, localId?: string) {
  const [storage] = useState(() => journeyStorage(libraryKey(location)));
  const [seed] = useState(() => newJourney(copy?.project, copy?.token));
  const [initial] = useState<Initialization>(() => {
    if (storage.indexed) return { journey: seed, items: [], ready: false };
    try {
      return initialize(readLocalLibrary(libraryKey(location)));
    } catch {
      return { journey: seed, items: [], ready: true, failed: true };
    }
  });
  const current = useRef(initial.journey);
  const [journey, setJourney] = useState(initial.journey);
  const [items, setItems] = useState<Journey[]>(initial.items);
  const [ready, setReady] = useState(initial.ready);
  const [live, setLive] = useState(!copy || !!localId);
  const [revision, setRevision] = useState(0);
  const [saveState, setSaveState] = useState<SaveState>(
    initial.failed
      ? 'failed'
      : initial.items.length && initial.journey !== seed
        ? 'recovered'
        : copy
          ? 'shared'
          : 'empty',
  );
  const [error, setError] = useState('');
  const pending = useRef(new Map<string, symbol>());
  const outcomes = useRef(new Map<string, SaveState>());

  function initialize(library: Library) {
    const base = projectStorageKey(location);
    const items = [...library.items];
    let local = items.find((item) => item.id === 'legacy-local');
    const migrations: Journey[] = [];
    let failed = false;
    if (!local) {
      try {
        const legacy = readLegacy(base);
        if (legacy) {
          local = { ...newJourney(legacy), id: 'legacy-local' };
          items.push(local);
          migrations.push(local);
        }
      } catch {
        failed = true;
      }
    }
    let selected = localId ? items.find((item) => item.id === localId) : undefined;
    if (!selected && copy) {
      selected = items.find((item) => item.source === copy.token);
      if (!selected) {
        try {
          const legacy = readLegacy(base + ':copy:' + copy.token);
          if (legacy) {
            selected = { ...newJourney(legacy, copy.token), id: 'legacy-copy:' + copy.token };
            items.push(selected);
            migrations.push(selected);
          }
        } catch {
          failed = true;
        }
      }
    }
    if (!selected && !copy) selected = items.find((item) => item.id === library.active) ?? local;
    return { journey: selected ?? seed, items, ready: true, failed, migrations };
  }

  const persist = useCallback(
    (next: Journey, mode: 'save' | 'migrate' | 'activate' = 'save') => {
      const operation = Symbol();
      pending.current.set(next.id, operation);
      if (current.current.id === next.id) setSaveState('saving');
      const finish = (status: SaveState) => {
        if (pending.current.get(next.id) !== operation) return;
        pending.current.delete(next.id);
        outcomes.current.set(next.id, status);
        if (current.current.id === next.id) setSaveState(status);
      };
      try {
        const write = storage.write(next, mode);
        const success = mode === 'migrate' ? 'recovered' : 'saved';
        if (write)
          void write.then(
            () => finish(success),
            () => finish('failed'),
          );
        else finish(success);
      } catch {
        finish('failed');
      }
    },
    [storage],
  );

  useEffect(() => {
    let active = true;
    const load = (result: Initialization) => {
      if (!active) return;
      current.current = result.journey;
      setJourney(result.journey);
      setItems(result.items);
      setSaveState(
        result.failed
          ? 'failed'
          : result.journey !== seed
            ? 'recovered'
            : copy
              ? 'shared'
              : 'empty',
      );
      if (result.failed) setError(t('storage.recoveryError'));
      for (const item of result.migrations ?? []) persist(item, 'migrate');
      setReady(true);
    };
    if (storage.indexed) {
      void storage.read().then(
        (library) => load(initialize(library)),
        () => {
          load({ ...initialize({ items: [] }), failed: true, migrations: [] });
        },
      );
    } else {
      for (const item of initial.migrations ?? []) persist(item, 'migrate');
    }
    return () => {
      active = false;
    };
  }, [storage]);

  const change = useCallback(
    (operation: (value: Journey) => Journey) => {
      const next = { ...operation(current.current), updatedAt: Date.now() };
      setLive(true);
      current.current = next;
      setJourney(next);
      setItems((items) => [...items.filter((item) => item.id !== next.id), next]);
      setError('');
      persist(next);
    },
    [persist],
  );

  const update = useCallback(
    (operation: (value: Project) => Project) =>
      change((journey) => ({ ...journey, project: operation(journey.project) })),
    [change],
  );

  const updateStep = (id: string, patch: Partial<Step>) =>
    change((item) => ({
      ...item,
      project: {
        ...item.project,
        steps: item.project.steps.map((step) =>
          step.id === id ? ({ ...step, ...patch } as Step) : step,
        ),
      },
      flows: 'flow' in patch ? draftEntry(item.flows, id) : item.flows,
      answers:
        'answers' in patch && !('flow' in patch) ? draftEntry(item.answers, id) : item.answers,
    }));

  const action = (id: string, type: 'up' | 'down' | 'copy' | 'delete') =>
    change((item) => {
      const steps = [...item.project.steps];
      const index = steps.findIndex((step) => step.id === id);
      if (index < 0) return item;
      if (type === 'delete') steps.splice(index, 1);
      if (type === 'copy') steps.splice(index + 1, 0, { ...clone(steps[index]), id: uid() });
      if (type === 'up' && index > 0)
        [steps[index - 1], steps[index]] = [steps[index], steps[index - 1]];
      if (type === 'down' && index < steps.length - 1)
        [steps[index + 1], steps[index]] = [steps[index], steps[index + 1]];
      return {
        ...item,
        project: { ...item.project, steps },
        flows: type === 'delete' ? draftEntry(item.flows, id) : item.flows,
        answers: type === 'delete' ? draftEntry(item.answers, id) : item.answers,
      };
    });

  const replace = (project: Project) => {
    change((journey) => ({
      ...journey,
      project,
      code: undefined,
      flows: undefined,
      answers: undefined,
    }));
    setRevision((value) => value + 1);
  };

  const select = (next: Journey) => {
    if (current.current.id === next.id) return;
    setLive(true);
    current.current = next;
    setJourney(next);
    setItems((items) => [...items.filter((item) => item.id !== next.id), next]);
    setRevision((value) => value + 1);
    setError('');
    try {
      setJourneyAddress(next.id, '');
    } catch {
      // A storage or history failure leaves the active journey available in this tab.
    }
    persist(
      next,
      items.some((item) => item.id === next.id) &&
        !pending.current.has(next.id) &&
        outcomes.current.get(next.id) !== 'failed'
        ? 'activate'
        : 'save',
    );
  };

  const setFlowDraft = (id: string, draft?: NonNullable<Journey['flows']>[string]) => {
    if (draft || Object.hasOwn(current.current.flows ?? {}, id)) {
      change((item) => ({ ...item, flows: draftEntry(item.flows, id, draft) }));
    }
  };
  const setAnswersDraft = (id: string, draft?: NonNullable<Journey['answers']>[string]) => {
    if (draft || Object.hasOwn(current.current.answers ?? {}, id)) {
      change((item) => ({ ...item, answers: draftEntry(item.answers, id, draft) }));
    }
  };

  return {
    project: journey.project,
    journey,
    items,
    ready,
    live,
    revision,
    error,
    saveState,
    update,
    updateStep,
    action,
    replace,
    select,
    rename: (title: string) => change((item) => ({ ...item, title })),
    create: () => select(newJourney()),
    duplicate: (item: Journey) =>
      select({
        ...clone(item),
        id: uid(),
        source: undefined,
        title: t('journeys.copyTitle', { title: item.title.trim() || t('journeys.untitled') }),
        updatedAt: Date.now(),
      }),
    restore: async () => {
      const { source, id } = current.current;
      if (!source) return;
      try {
        const original =
          source === copy?.token
            ? copy.project
            : await loadSharedProject({ token: source, legacy: false });
        if (current.current.id === id) replace(original);
      } catch (failure) {
        if (current.current.id === id) setError((failure as Error).message);
      }
    },
    setCodeDraft: (code: Journey['code']) => {
      if (code || current.current.code) change((item) => ({ ...item, code }));
    },
    setFlowDraft,
    setAnswersDraft,
  };
}
