const CACHE_NAME = "ptla-practice-v10.1";

const urlsToCache = [
  "/PTLA-Prep/",
  "/PTLA-Prep/index.html",
  "/PTLA-Prep/style.css",
  "/PTLA-Prep/app.js",
  "/PTLA-Prep/banco_preguntas_ptla.json",
  "/PTLA-Prep/icon-512.png",
  "/PTLA-Prep/manifest.json"
];

self.addEventListener("install", event => {
  self.skipWaiting();

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  event.respondWith(
    fetch(event.request)
      .then(response => {
        return response;
      })
      .catch(() => {
        return caches.match(event.request);
      })
  );
});
