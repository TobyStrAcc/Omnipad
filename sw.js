/* Action Tracker — Service Worker
 *
 * Strategy:
 *  - HTML / main app shell: NETWORK-FIRST (always tries fresh, falls back to cache offline)
 *  - Static assets (icons, manifest): STALE-WHILE-REVALIDATE
 *  - On activate: prune old caches and claim all clients immediately.
 *
 * The page registers this file as sw.js?v=<APP_VERSION>, so every release changes
 * the script URL (which the browser treats as an update) and the cache name.
 * Nothing in this file needs editing per release.
 */
const CACHE_VERSION = 'omnipad-' + (new URL(self.location.href).searchParams.get('v') || 'dev');
const APP_SHELL = [
  './',
  './action-tracker.html',
  './manifest.webmanifest',
  './icon.png',
  './icon.svg',
  './icon-maskable.svg'
];
const HTML_PATTERNS = [/\/$/, /\.html$/];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Allow the page to ask the waiting SW to take over immediately.
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});

function isHTMLRequest(req) {
  if (req.mode === 'navigate') return true;
  if (req.destination === 'document') return true;
  const url = new URL(req.url);
  return HTML_PATTERNS.some((re) => re.test(url.pathname));
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  if (isHTMLRequest(req)) {
    // Network-first for HTML
    event.respondWith(
      fetch(req).then((res) => {
        if (res && res.ok) {
          const copy = res.clone();
          caches.open(CACHE_VERSION).then((c) => c.put(req, copy));
        }
        return res;
      }).catch(() =>
        caches.match(req).then((cached) => cached || caches.match('./action-tracker.html'))
      )
    );
    return;
  }

  // Stale-while-revalidate for static assets
  event.respondWith(
    caches.match(req).then((cached) => {
      const fetchPromise = fetch(req).then((res) => {
        if (res && res.ok) {
          const copy = res.clone();
          caches.open(CACHE_VERSION).then((c) => c.put(req, copy));
        }
        return res;
      }).catch(() => cached);
      return cached || fetchPromise;
    })
  );
});
