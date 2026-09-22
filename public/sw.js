/**
 * Keeps the typesetting engine and fonts available offline and across cache
 * eviction. Those are several megabytes that never change once fetched, so
 * they are worth holding onto deliberately rather than leaving to the HTTP
 * cache.
 *
 * Nothing about a user's document is ever cached: only the application's own
 * immutable assets are.
 */
const CACHE = 'md2pdf-v1';

/** Fingerprinted or otherwise immutable by construction. */
function isImmutable(url) {
  return (
    url.origin === self.location.origin &&
    (url.pathname.startsWith('/assets/') ||
      url.pathname.startsWith('/fonts/') ||
      url.pathname.endsWith('.wasm'))
  );
}

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', event => {
  event.waitUntil(
    (async () => {
      for (const key of await caches.keys()) {
        if (key !== CACHE) await caches.delete(key);
      }
      await self.clients.claim();
    })(),
  );
});

self.addEventListener('fetch', event => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  if (isImmutable(url)) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(CACHE);
        const hit = await cache.match(request);
        if (hit) return hit;
        const response = await fetch(request);
        if (response.ok) cache.put(request, response.clone());
        return response;
      })(),
    );
    return;
  }

  // Everything else stays network-first so a deploy is picked up immediately,
  // falling back to cache only when offline.
  if (url.origin === self.location.origin) {
    event.respondWith(
      (async () => {
        try {
          const response = await fetch(request);
          if (response.ok) (await caches.open(CACHE)).put(request, response.clone());
          return response;
        } catch (error) {
          const hit = await caches.match(request);
          if (hit) return hit;
          throw error;
        }
      })(),
    );
  }
});
