import { getDb } from './db';
import { StorageError, toStorageError } from './errors';
import { MAX_ITEMS, type SavedAnalysis, savedAnalysisSchema } from './schema';

export interface AnalysisList {
  /** Newest first, at most MAX_ITEMS. */
  items: SavedAnalysis[];
  /** Stored records that failed validation and were left out. Tell the user. */
  skipped: number;
}

/** Lists saved analyses, newest first. Invalid records are skipped and counted, never thrown. */
export async function listAnalyses(): Promise<AnalysisList> {
  try {
    const db = await getDb();
    const items: SavedAnalysis[] = [];
    let skipped = 0;
    let cursor = await db
      .transaction('analyses')
      .store.index('by-created-at')
      .openCursor(null, 'prev');
    while (cursor && items.length + skipped < MAX_ITEMS) {
      const parsed = savedAnalysisSchema.safeParse(cursor.value);
      if (parsed.success) items.push(parsed.data);
      else skipped += 1;
      cursor = await cursor.continue();
    }
    return { items, skipped };
  } catch (error) {
    throw toStorageError(error);
  }
}

/** Returns one analysis, or undefined when the id is unknown. Throws `corrupt` if the record is invalid. */
export async function getAnalysis(
  id: string,
): Promise<SavedAnalysis | undefined> {
  try {
    const record: unknown = await (await getDb()).get('analyses', id);
    if (record === undefined) return undefined;
    const parsed = savedAnalysisSchema.safeParse(record);
    if (!parsed.success) {
      throw new StorageError('corrupt', 'A saved analysis is damaged.', {
        cause: parsed.error,
      });
    }
    return parsed.data;
  } catch (error) {
    throw toStorageError(error);
  }
}

/**
 * Saves or replaces one analysis. Throws `invalid` for a bad record, `limit` when MAX_ITEMS is
 * reached (replacing an existing id is still allowed), and `quota` when the browser is full.
 */
export async function saveAnalysis(analysis: SavedAnalysis): Promise<void> {
  const parsed = savedAnalysisSchema.safeParse(analysis);
  if (!parsed.success) {
    throw new StorageError('invalid', 'The analysis cannot be saved.', {
      cause: parsed.error,
    });
  }
  try {
    const db = await getDb();
    // Count and write in one transaction, so two tabs cannot both slip past the cap.
    const tx = db.transaction('analyses', 'readwrite');
    const replacing = (await tx.store.getKey(parsed.data.id)) !== undefined;
    if (!replacing && (await tx.store.count()) >= MAX_ITEMS) {
      // Nothing was written, so let the transaction finish. Aborting would reject `tx.done` unhandled.
      await tx.done;
      throw new StorageError(
        'limit',
        `You can keep up to ${MAX_ITEMS} saved analyses.`,
      );
    }
    await tx.store.put(parsed.data);
    await tx.done;
  } catch (error) {
    throw toStorageError(error);
  }
}

/** Deletes one analysis. Unknown ids are ignored. */
export async function deleteAnalysis(id: string): Promise<void> {
  try {
    await (await getDb()).delete('analyses', id);
  } catch (error) {
    throw toStorageError(error);
  }
}
