const CACHE_VERSION = "v3";
const CACHE_NAME = `inspecciones-lab-${CACHE_VERSION}`;
const OFFLINE_URL = "/offline.html";

// Shell mínimo para que la app abra sin red: inicio, listado, manifest e íconos.
const PRECACHE_ASSETS = [
  "/",
  "/inspecciones",
  "/inspecciones/nueva",
  "/manifest.webmanifest",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  OFFLINE_URL,
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_ASSETS))
  );
  // No se invoca el método de activación inmediata aquí a propósito: la nueva versión se
  // instala pero espera, para no interrumpir una sesión en curso
  // (actualización segura). La activación la dispara el usuario.
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    )
  );
});

// Permite que la página, tras confirmación del usuario, dispare la
// activación de la versión nueva ya instalada.
self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Solo se cachean lecturas (GET) del mismo origen; escrituras y la API de sync pasan directo.
  if (request.method !== "GET") return;
  const url = new URL(request.url, self.location.origin);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) return;

  // Navegación (cargar una página): red primero. Cada página visitada se guarda,
  // así que sin red se sirve la última copia; si nunca se visitó, el fallback offline.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() =>
          caches.match(request).then((cached) => cached || caches.match(OFFLINE_URL))
        )
    );
    return;
  }

  // Otros recursos (JS, CSS, íconos): caché primero, con actualización en segundo plano.
  event.respondWith(
    caches.match(request).then((cached) => {
      const fetchPromise = fetch(request)
        .then((response) => {
          if (response && response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => cached);

      return cached || fetchPromise;
    })
  );
});