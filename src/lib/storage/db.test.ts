import { beforeEach, describe, expect, it } from 'vitest';

import { resetDatabase } from '../../test/storage-helpers';
import { DB_NAME, DB_VERSION, closeDb, getDb } from './db';

beforeEach(resetDatabase);

describe('getDb', () => {
  it('creates the analyses store and its index when the database is new', async () => {
    const db = await getDb();

    expect(db.version).toBe(DB_VERSION);
    expect(Array.from(db.objectStoreNames)).toEqual(['analyses']);
    expect(Array.from(db.transaction('analyses').store.indexNames)).toEqual([
      'by-created-at',
    ]);
  });

  it('returns the same connection when called twice', async () => {
    expect(await getDb()).toBe(await getDb());
  });

  it('opens a fresh connection when called after closeDb', async () => {
    const first = await getDb();

    await closeDb();

    expect(await getDb()).not.toBe(first);
  });

  it('uses the chromascope database name', async () => {
    expect((await getDb()).name).toBe(DB_NAME);
  });
});
