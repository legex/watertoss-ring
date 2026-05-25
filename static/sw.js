/* Waterful Ring Toss — Service Worker */
const CACHE = 'waterful-v1';

const PRECACHE = [
  '/',
  '/game',
  '/leaderboard',
  '/static/css/style.css',
  '/static/js/game.js',
  '/static/icons/icon.svg',
  '/manifest.json',
];

// Install: pre-cache all static shell assets
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

// Activate: delete old caches
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

// Fetch strategy:
//   API calls  → network-first (live scores), graceful offline fallback
//   Everything else → cache-first, update cache in background
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  if (url.pathname.startsWith('/api/')) {
    e.respondWith(
      fetch(e.request).catch(() =>
        new Response(
          JSON.stringify({ error: 'offline', offline: true }),
          { headers: { 'Content-Type': 'application/json' } }
        )
      )
    );
    return;
  }

  e.respondWith(
    caches.match(e.request).then(cached => {
      // Kick off a background network refresh
      const net = fetch(e.request).then(resp => {
        if (resp.ok && e.request.method === 'GET') {
          caches.open(CACHE).then(c => c.put(e.request, resp.clone()));
        }
        return resp;
      }).catch(() => null);

      return cached || net;
    })
  );
});
