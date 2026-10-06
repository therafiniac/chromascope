export type StorageErrorKind =
  | 'unavailable' // IndexedDB is missing or the database could not be opened (for example private browsing)
  | 'quota' // the browser refused the write because storage is full
  | 'limit' // the app's own item cap is reached; the caller must ask the user what to delete
  | 'invalid' // the record to save failed validation
  | 'corrupt' // a stored record failed validation when read
  | 'failed'; // anything else

/** Typed storage failure. Callers map `kind` to a visible message; `cause` keeps the original for logs. */
export class StorageError extends Error {
  readonly kind: StorageErrorKind;

  constructor(
    kind: StorageErrorKind,
    message: string,
    options?: { cause?: unknown },
  ) {
    super(message, options);
    this.name = 'StorageError';
    this.kind = kind;
  }
}

/** Converts anything thrown inside a storage call into a StorageError. */
export function toStorageError(error: unknown): StorageError {
  if (error instanceof StorageError) return error;
  if (error instanceof DOMException && error.name === 'QuotaExceededError') {
    return new StorageError('quota', 'Storage is full.', { cause: error });
  }
  return new StorageError('failed', 'Saving or reading data failed.', {
    cause: error,
  });
}
