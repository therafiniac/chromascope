import { afterEach, describe, expect, it, vi } from 'vitest';

import { getUsage, requestPersistence } from './persist';

afterEach(() => {
  vi.unstubAllGlobals();
});

function stubStorage(storage: unknown) {
  vi.stubGlobal('navigator', { storage });
}

describe('requestPersistence', () => {
  it('returns unsupported when the browser has no persist API', async () => {
    stubStorage(undefined);

    expect(await requestPersistence()).toBe('unsupported');
  });

  it('returns granted when the browser grants persistence', async () => {
    stubStorage({ persist: () => Promise.resolve(true) });

    expect(await requestPersistence()).toBe('granted');
  });

  it('returns denied when the browser refuses persistence', async () => {
    stubStorage({ persist: () => Promise.resolve(false) });

    expect(await requestPersistence()).toBe('denied');
  });
});

describe('getUsage', () => {
  it('returns null when the browser has no estimate API', async () => {
    stubStorage({});

    expect(await getUsage()).toBeNull();
  });

  it('returns null when the estimate lacks usage or quota', async () => {
    stubStorage({ estimate: () => Promise.resolve({}) });

    expect(await getUsage()).toBeNull();
  });

  it('returns usage and quota in bytes when the browser reports them', async () => {
    stubStorage({ estimate: () => Promise.resolve({ usage: 10, quota: 100 }) });

    expect(await getUsage()).toEqual({ usageBytes: 10, quotaBytes: 100 });
  });
});
