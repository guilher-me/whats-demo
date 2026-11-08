import { normalizeProject, projectStorageKey } from '../../core/project';
import type { FlowDefinition, Project } from '../../core/types';
import type { JourneyDiagnostic } from '../flows/diagnostics';

export type CodeDraft = { base: string; text: string };
export type FlowDraft = { text: string; visual?: FlowDefinition; issues: JourneyDiagnostic[] };
export type AnswersDraft = { text: string; error: string };
export interface Journey {
  id: string;
  title: string;
  updatedAt: number;
  project: Project;
  source?: string;
  code?: CodeDraft;
  flows?: Record<string, FlowDraft>;
  answers?: Record<string, AnswersDraft>;
}

export interface Library {
  items: Journey[];
  active?: string;
  deleted?: string[];
}

export const libraryKey = (location: Location) => projectStorageKey(location) + ':library';

export function readLegacy(key: string) {
  const raw = localStorage.getItem(key);
  return raw ? normalizeProject(JSON.parse(raw), { allowDrafts: true }) : undefined;
}

export function readLocalLibrary(key: string): Library {
  return JSON.parse(localStorage.getItem(key) ?? '{"items":[]}') as Library;
}

export type WriteMode = 'save' | 'migrate' | 'activate' | 'rename';

function renamed(journey: Journey, current?: Journey) {
  return { ...(current ?? journey), title: journey.title, updatedAt: journey.updatedAt };
}

function writeLocal(key: string, journey: Journey, mode: WriteMode) {
  const current = readLocalLibrary(key);
  if (current.deleted?.includes(journey.id)) throw new Error('Journey was deleted');
  const existing = current.items.find((item) => item.id === journey.id);
  if (mode === 'save' || mode === 'rename') {
    const next = mode === 'rename' ? renamed(journey, existing) : journey;
    current.items = [...current.items.filter((item) => item.id !== journey.id), next];
  } else if (mode === 'migrate' && !existing) {
    current.items.push(journey);
  }
  if (mode === 'save' || mode === 'activate') current.active = journey.id;
  localStorage.setItem(key, JSON.stringify(current));
}

const deletedKey = (id: string) => 'deleted:' + id;

function openDatabase(key: string) {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(key, 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore('journeys', { keyPath: 'id' });
      request.result.createObjectStore('settings');
    };
    request.onsuccess = () => {
      const database = request.result;
      database.onversionchange = () => database.close();
      resolve(database);
    };
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(new Error('Journey database is blocked'));
  });
}

export function journeyStorage(key: string) {
  let database: Promise<IDBDatabase> | undefined;
  const open = () =>
    (database ??= openDatabase(key).catch((error: unknown) => {
      database = undefined;
      throw error;
    }));
  const indexed = typeof indexedDB !== 'undefined';

  const read = async () => {
    if (!indexed) return readLocalLibrary(key);
    const db = await open();
    return new Promise<Library>((resolve, reject) => {
      const transaction = db.transaction(['journeys', 'settings']);
      const items = transaction.objectStore('journeys').getAll();
      const settings = transaction.objectStore('settings');
      const active = settings.get('active');
      const keys = settings.getAllKeys();
      transaction.oncomplete = () =>
        resolve({
          items: items.result,
          active: active.result,
          deleted: keys.result.flatMap((key) =>
            typeof key === 'string' && key.startsWith('deleted:') ? [key.slice(8)] : [],
          ),
        });
      transaction.onabort = () => reject(transaction.error);
    });
  };

  const write = (journey: Journey, mode: WriteMode) => {
    if (!indexed) return writeLocal(key, journey, mode);
    return open().then(
      (db) =>
        new Promise<void>((resolve, reject) => {
          const transaction = db.transaction(['journeys', 'settings'], 'readwrite');
          const items = transaction.objectStore('journeys');
          const settings = transaction.objectStore('settings');
          const deleted = settings.getKey(deletedKey(journey.id));
          deleted.onsuccess = () => {
            if (deleted.result !== undefined) {
              transaction.abort();
              return;
            }
            if (mode === 'save') items.put(journey);
            if (mode === 'migrate' || mode === 'rename') {
              const existing = items.get(journey.id);
              existing.onsuccess = () => {
                if (mode === 'rename') items.put(renamed(journey, existing.result));
                else if (existing.result === undefined) items.add(journey);
              };
            }
            if (mode === 'save' || mode === 'activate') settings.put(journey.id, 'active');
          };
          transaction.oncomplete = () => resolve();
          transaction.onabort = () => reject(transaction.error);
        }),
    );
  };

  const remove = async (id: string, replacement?: string) => {
    if (!indexed) {
      const library = readLocalLibrary(key);
      library.items = library.items.filter((item) => item.id !== id);
      library.deleted = [...new Set([...(library.deleted ?? []), id])];
      if (!library.active || library.active === id) library.active = replacement;
      localStorage.setItem(key, JSON.stringify(library));
      return;
    }
    const db = await open();
    return new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(['journeys', 'settings'], 'readwrite');
      transaction.objectStore('journeys').delete(id);
      const settings = transaction.objectStore('settings');
      // Keep IDs from pending writes and legacy migrations from restoring a deleted item.
      settings.put(true, deletedKey(id));
      const active = settings.get('active');
      active.onsuccess = () => {
        if (active.result && active.result !== id) return;
        if (replacement) settings.put(replacement, 'active');
        else settings.delete('active');
      };
      transaction.oncomplete = () => resolve();
      transaction.onabort = () => reject(transaction.error);
    });
  };

  return { indexed, read, write, remove };
}
