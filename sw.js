const CACHE = 'papa-gift-v10';
const ASSETS = [
  './',
  './index.html',
  './table.html',
  './styles.css',
  './sky.js',
  './landing.js',
  './player.js',
  './manifest.json',
  './PAPA.jpeg',
  './PAPA2.jpeg',
  './papa3.jpeg',
  './papa4.jpeg',
  './papa5.jpeg',
  './papa3.mp3',
  './शुक्रिया पापा (Duet Version).mp3'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((r) => r || fetch(e.request).catch(() => caches.match('./index.html')))
  );
});
