import { type DBSchema, type IDBPDatabase, openDB } from 'idb';

import { StorageError } from './errors';
import type { SavedAnalysis } from './schema';

export const DB_NAME = 'chromascope';
/** Raise by one for every schema change and add a step in `upgrade`. Never edit a shipped step. */
export const DB_VERSION = 1;

export interface ChromascopeDB extends DBSchema {
  analyses: {
    key: string;
    value: SavedAnalysis;
    indexes: { 'by-created-at': number };
  };
}

let dbPromise: Promise<IDBPDatabase<ChromascopeDB>> | null = null;
let blockedListener: (() => void) | null = null;

/** Called when an upgrade is waiting on another open tab. Show a "close other tabs" message. */
export function onUpgradeBlocked(listener: (() => void) | null): void {
  blockedListener = listener;
}

function forgetConnection(): void {
  dbPromise = null;
}

/**
 * Opens the database on first use. Call it from an event handler or effect, never at module top
 * level: the static build has no `indexedDB`.
 */
export function getDb(): Promise<IDBPDatabase<ChromascopeDB>> {
  if (typeof indexedDB === 'undefined') {
    return Promise.reject(
      new StorageError('unavailable', 'This browser has no IndexedDB.'),
    );
  }
  dbPromise ??= openDB<ChromascopeDB>(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion) {
      if (oldVersion < 1) {
        const store = db.createObjectStore('analyses', { keyPath: 'id' });
        store.createIndex('by-created-at', 'createdAt');
      }
    },
    blocked() {
      blockedListener?.();
    },
    blocking() {
      // Another tab wants a newer version. Close so it can upgrade; the next call reopens.
      const closing = dbPromise;
      forgetConnection();
      void closing?.then((db) => db.close());
    },
    terminated: forgetConnection,
  }).catch((error: unknown) => {
    forgetConnection();
    throw new StorageError(
      'unavailable',
      'Could not open the on-device database.',
      {
        cause: error,
      },
    );
  });
  return dbPromise;
}

/** Closes the connection. Used on unmount and between tests. */
export async function closeDb(): Promise<void> {
  const closing = dbPromise;
  forgetConnection();
  if (closing) (await closing).close();
}
