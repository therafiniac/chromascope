// Chromascope service worker. The two placeholders below are replaced after
// `astro build` by scripts/build-precache.mjs. Do not edit them by hand.
const BUILD_VERSION = '__BUILD_VERSION__';
const PRECACHE_URLS = /* __PRECACHE_URLS__ */ [];
const CACHE_PREFIX = 'chromascope-';
const CACHE_NAME = `${CACHE_PREFIX}${BUILD_VERSION}`;
const OFFLINE_FALLBACK = '/404.html';

self.addEventListener('install', (event) => {
  // `reload` bypasses the HTTP cache so a new build never precaches stale files.
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) =>
        cache.addAll(
          PRECACHE_URLS.map((url) => new Request(url, { cache: 'reload' })),
        ),
      ),
  );
  // No skipWaiting() here: the page asks for it after the user accepts the update prompt.
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((names) =>
        Promise.all(
          names
            .filter(
              (name) => name.startsWith(CACHE_PREFIX) && name !== CACHE_NAME,
            )
            .map((name) => caches.delete(name)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  if (new URL(request.url).origin !== self.location.origin) return;
  event.respondWith(respond(request));
});

async function respond(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request, { ignoreSearch: true });
  if (cached) return cached;
  try {
    return await fetch(request);
  } catch (error) {
    if (request.mode === 'navigate') {
      const fallback = await cache.match(OFFLINE_FALLBACK);
      if (fallback) return fallback;
    }
    throw error;
  }
}
