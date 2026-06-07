const CACHE_NAME = "ptla-practice-v13";

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
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});
