import { describe, expect, it } from 'vitest';

import { StorageError, toStorageError } from './errors';

describe('toStorageError', () => {
  it('maps a QuotaExceededError to kind quota', () => {
    const error = toStorageError(
      new DOMException('full', 'QuotaExceededError'),
    );

    expect(error.kind).toBe('quota');
  });

  it('returns the same error when it is already a StorageError', () => {
    const original = new StorageError('limit', 'cap');

    expect(toStorageError(original)).toBe(original);
  });

  it('maps an unknown error to kind failed and keeps the cause', () => {
    const cause = new Error('boom');

    const error = toStorageError(cause);

    expect(error.kind).toBe('failed');
    expect(error.cause).toBe(cause);
  });
});
