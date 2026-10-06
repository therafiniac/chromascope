import { beforeEach, describe, expect, it } from 'vitest';

import {
  fillStore,
  makeAnalysis,
  resetDatabase,
} from '../../test/storage-helpers';
import {
  deleteAnalysis,
  getAnalysis,
  listAnalyses,
  saveAnalysis,
} from './analyses';
import { getDb } from './db';
import { StorageError } from './errors';
import { MAX_ITEMS, MAX_THUMBNAIL_BYTES } from './schema';

beforeEach(resetDatabase);

describe('saveAnalysis', () => {
  it('stores a record that getAnalysis returns when the input is valid', async () => {
    const analysis = makeAnalysis(1, { name: 'Sunset' });

    await saveAnalysis(analysis);

    expect(await getAnalysis('analysis-1')).toEqual(analysis);
  });

  it('replaces the record when the id already exists', async () => {
    await saveAnalysis(makeAnalysis(1, { name: 'First' }));

    await saveAnalysis(makeAnalysis(1, { name: 'Second' }));

    expect((await getAnalysis('analysis-1'))?.name).toBe('Second');
  });

  it('rejects the record with kind invalid when the palette is empty', async () => {
    const result = saveAnalysis(makeAnalysis(1, { palette: [] }));

    await expect(result).rejects.toMatchObject({ kind: 'invalid' });
  });

  it('rejects the record with kind invalid when a color is not uppercase hex', async () => {
    const result = saveAnalysis(makeAnalysis(1, { palette: ['#aabbcc'] }));

    await expect(result).rejects.toMatchObject({ kind: 'invalid' });
  });

  it('rejects the record with kind invalid when the palette has more than 8 colors', async () => {
    const result = saveAnalysis(
      makeAnalysis(1, { palette: Array(9).fill('#112233') }),
    );

    await expect(result).rejects.toMatchObject({ kind: 'invalid' });
  });

  it('accepts a thumbnail of exactly the size limit', async () => {
    const thumbnail = {
      data: new ArrayBuffer(MAX_THUMBNAIL_BYTES),
      mimeType: 'image/png' as const,
    };

    await saveAnalysis(makeAnalysis(1, { thumbnail }));

    expect((await getAnalysis('analysis-1'))?.thumbnail.data.byteLength).toBe(
      MAX_THUMBNAIL_BYTES,
    );
  });

  it('rejects a thumbnail one byte over the size limit with kind invalid', async () => {
    const thumbnail = {
      data: new ArrayBuffer(MAX_THUMBNAIL_BYTES + 1),
      mimeType: 'image/png' as const,
    };

    await expect(
      saveAnalysis(makeAnalysis(1, { thumbnail })),
    ).rejects.toMatchObject({
      kind: 'invalid',
    });
  });

  it('refuses a new record with kind limit when the store holds the maximum', async () => {
    await fillStore(MAX_ITEMS);

    const result = saveAnalysis(makeAnalysis(MAX_ITEMS));

    await expect(result).rejects.toMatchObject({ kind: 'limit' });
    expect((await listAnalyses()).items).toHaveLength(MAX_ITEMS);
  });

  it('still replaces an existing record when the store holds the maximum', async () => {
    await fillStore(MAX_ITEMS);

    await saveAnalysis(makeAnalysis(0, { name: 'Renamed' }));

    expect((await getAnalysis('analysis-0'))?.name).toBe('Renamed');
  });
});

describe('getAnalysis', () => {
  it('returns undefined when the id is unknown', async () => {
    expect(await getAnalysis('missing')).toBeUndefined();
  });

  it('throws kind corrupt when the stored record is damaged', async () => {
    const db = await getDb();
    await db.put('analyses', { id: 'bad', createdAt: 1 } as never);

    const result = getAnalysis('bad');

    await expect(result).rejects.toMatchObject({ kind: 'corrupt' });
  });
});

describe('listAnalyses', () => {
  it('returns an empty list when nothing is saved', async () => {
    expect(await listAnalyses()).toEqual({ items: [], skipped: 0 });
  });

  it('returns the newest record first', async () => {
    await fillStore(3);

    const { items } = await listAnalyses();

    expect(items.map((item) => item.id)).toEqual([
      'analysis-2',
      'analysis-1',
      'analysis-0',
    ]);
  });

  it('skips and counts a damaged record when others are valid', async () => {
    await fillStore(2);
    const db = await getDb();
    await db.put('analyses', { id: 'bad', createdAt: 5_000 } as never);

    const { items, skipped } = await listAnalyses();

    expect(skipped).toBe(1);
    expect(items).toHaveLength(2);
  });
});

describe('deleteAnalysis', () => {
  it('removes the record when it exists', async () => {
    await fillStore(2);

    await deleteAnalysis('analysis-0');

    expect(await getAnalysis('analysis-0')).toBeUndefined();
    expect(await getAnalysis('analysis-1')).toBeDefined();
  });

  it('does nothing when the id is unknown', async () => {
    await expect(deleteAnalysis('missing')).resolves.toBeUndefined();
  });
});

describe('storage failures', () => {
  it('throws a StorageError with kind unavailable when indexedDB is missing', async () => {
    Object.defineProperty(globalThis, 'indexedDB', {
      value: undefined,
      configurable: true,
    });

    const result = listAnalyses();

    await expect(result).rejects.toBeInstanceOf(StorageError);
    await expect(result).rejects.toMatchObject({ kind: 'unavailable' });
  });
});
