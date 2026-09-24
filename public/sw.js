/**
 * Keeps the typesetting engine and fonts available offline and across cache
 * eviction. Those are several megabytes that never change once fetched, so
 * they are worth holding onto deliberately rather than leaving to the HTTP
 * cache.
 *
 * Nothing about a user's document is ever cached: only the application's own
 * immutable assets are.
 */
// Renamed on every build (vite.config.ts, swCacheName), so a deploy drops
// the previous build's fingerprinted files instead of keeping them forever.
const CACHE = 'md2pdf-v1';
/** Owned by src/typst/wasm-loader.ts, which keeps exactly one engine version. */
const ENGINE_CACHE = 'md2pdf-engine-v1';

/** Fingerprinted or otherwise immutable by construction. */
function isImmutable(url) {
  return (
    url.origin === self.location.origin &&
    (url.pathname.startsWith('/assets/') ||
      url.pathname.startsWith('/fonts/') ||
      url.pathname.endsWith('.wasm')) &&
    // The engine parts are joined and stored by the loader itself; caching
    // them here as well would keep a second 27 MB copy.
    !/\/assets\/typst-engine-/.test(url.pathname)
  );
}

/** One cache entry per page, whatever its query string. */
function pageKey(url) {
  return new Request(url.origin + url.pathname);
}

// No skipWaiting/clients.claim: a new worker takes over at the next visit,
// never in the middle of a page load. Taking over mid-load made Safari fail
// in-flight chunk imports ("Importing a module script failed."). HTML is
// network-first, so a deploy is still picked up at once.

self.addEventListener('activate', event => {
  event.waitUntil(
    (async () => {
      for (const key of await caches.keys()) {
        // Never the engine: deleting it would re-download 10 MB after every deploy.
        if (key !== CACHE && key !== ENGINE_CACHE) await caches.delete(key);
      }
      // Font files fetched before fonts were versioned (`?v=` in
      // src/typst/fonts.ts) are dead weight, several megabytes of it; the
      // engine and everything else stay cached.
      // Pages are network-first. With navigation preload the request goes out
      // while the worker is still starting, so a returning visit's HTML is
      // never held up by the worker it has to pass through.
      await self.registration.navigationPreload?.enable().catch(() => {});
      const cache = await caches.open(CACHE);
      for (const request of await cache.keys()) {
        const url = new URL(request.url);
        if (url.pathname.startsWith('/fonts/') && !url.search && !url.pathname.endsWith('.woff2')) {
          await cache.delete(request);
        }
      }
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

  // Everything else, including each language's page (/, /zh/, /ja/, ...)
  // and each landing page (/ja/chatgpt-to-pdf/, ...), stays network-first so
  // a deploy is picked up immediately, falling back to cache only when
  // offline. Pages are cached by path alone, so /?lang=en or a landing page
  // with ?utm_source= offline still finds the copy that was saved. The
  // trailing-slash redirect itself is never cached (response.redirected);
  // offline, /ja/chatgpt-to-pdf falls back to the saved /ja/chatgpt-to-pdf/.
  if (url.origin === self.location.origin) {
    const page = request.mode === 'navigate';
    event.respondWith(
      (async () => {
        try {
          const response = (page && (await event.preloadResponse)) || (await fetch(request));
          if (response.ok && !response.redirected) {
            const key = page ? pageKey(url) : request;
            (await caches.open(CACHE)).put(key, response.clone());
          }
          return response;
        } catch (error) {
          const hit =
            (await caches.match(page ? pageKey(url) : request)) ??
            (page && !url.pathname.endsWith('/') ? await caches.match(url.origin + url.pathname + '/') : undefined);
          if (hit) return hit;
          throw error;
        }
      })(),
    );
  }
});
