export type PersistenceResult = 'granted' | 'denied' | 'unsupported';

/**
 * Asks the browser to keep this site's data. Call it after the first successful save. A refusal is
 * normal, so it is a result and not an error. Show the result as text.
 */
export async function requestPersistence(): Promise<PersistenceResult> {
  if (
    typeof navigator === 'undefined' ||
    typeof navigator.storage?.persist !== 'function'
  ) {
    return 'unsupported';
  }
  return (await navigator.storage.persist()) ? 'granted' : 'denied';
}

export interface StorageUsage {
  usageBytes: number;
  quotaBytes: number;
}

/** Current usage and quota in bytes, or null when the browser cannot say. */
export async function getUsage(): Promise<StorageUsage | null> {
  if (
    typeof navigator === 'undefined' ||
    typeof navigator.storage?.estimate !== 'function'
  ) {
    return null;
  }
  const { usage, quota } = await navigator.storage.estimate();
  if (usage === undefined || quota === undefined) return null;
  return { usageBytes: usage, quotaBytes: quota };
}
