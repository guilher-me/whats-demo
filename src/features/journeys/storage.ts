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
}

export const libraryKey = (location: Location) => projectStorageKey(location) + ':library';

export function readLegacy(key: string) {
  const raw = localStorage.getItem(key);
  return raw ? normalizeProject(JSON.parse(raw), { allowDrafts: true }) : undefined;
}

export function readLocalLibrary(key: string): Library {
  return JSON.parse(localStorage.getItem(key) ?? '{"items":[]}') as Library;
}

type WriteMode = 'save' | 'migrate' | 'activate';

function writeLocal(key: string, journey: Journey, mode: WriteMode) {
  const current = readLocalLibrary(key);
  if (mode === 'save') {
    current.items = [...current.items.filter((item) => item.id !== journey.id), journey];
  } else if (mode === 'migrate' && !current.items.some((item) => item.id === journey.id)) {
    current.items.push(journey);
  }
  if (mode !== 'migrate') current.active = journey.id;
  localStorage.setItem(key, JSON.stringify(current));
}

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
      const active = transaction.objectStore('settings').get('active');
      transaction.oncomplete = () => resolve({ items: items.result, active: active.result });
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
          if (mode === 'save') items.put(journey);
          if (mode === 'migrate') {
            const existing = items.getKey(journey.id);
            existing.onsuccess = () => {
              if (existing.result === undefined) items.add(journey);
            };
          } else transaction.objectStore('settings').put(journey.id, 'active');
          transaction.oncomplete = () => resolve();
          transaction.onabort = () => reject(transaction.error);
        }),
    );
  };

  return { indexed, read, write };
}
