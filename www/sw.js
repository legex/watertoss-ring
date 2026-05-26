/* Waterful Ring Toss — Service Worker (Capacitor static bundle) */
const CACHE = 'waterful-v2';

const PRECACHE = [
  'index.html',
  'game.html',
  'leaderboard.html',
  'css/style.css',
  'js/game.js',
  'icons/icon.svg',
  'manifest.json',
  'config.js',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

// Local assets: cache-first. API calls go to a different origin and are not intercepted.
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then(cached => {
      const net = fetch(e.request).then(resp => {
        if (resp.ok) {
          caches.open(CACHE).then(c => c.put(e.request, resp.clone()));
        }
        return resp;
      }).catch(() => null);
      return cached || net;
    })
  );
});
