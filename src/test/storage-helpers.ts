import { IDBFactory } from 'fake-indexeddb';

import { closeDb } from '../lib/storage/db';
import { MAX_ITEMS, type SavedAnalysis } from '../lib/storage/schema';
import { saveAnalysis } from '../lib/storage/analyses';

/** Gives the next test an empty database. */
export async function resetDatabase(): Promise<void> {
  await closeDb();
  Object.defineProperty(globalThis, 'indexedDB', {
    value: new IDBFactory(),
    configurable: true,
    writable: true,
  });
}

export function makeAnalysis(
  index: number,
  overrides: Partial<SavedAnalysis> = {},
): SavedAnalysis {
  return {
    id: `analysis-${index}`,
    schemaVersion: 1,
    createdAt: 1_000 + index,
    palette: ['#112233', '#AABBCC'],
    thumbnail: { data: new ArrayBuffer(16), mimeType: 'image/jpeg' },
    ...overrides,
  };
}

/** Saves `count` analyses with ids analysis-0 to analysis-<count-1>. */
export async function fillStore(count: number): Promise<void> {
  for (let index = 0; index < count; index += 1) {
    await saveAnalysis(makeAnalysis(index));
  }
}

export { MAX_ITEMS };
