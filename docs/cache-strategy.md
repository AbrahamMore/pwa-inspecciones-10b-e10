# Estrategia de caché — Service Worker

## Versionado

El caché usa un nombre versionado (`inspecciones-lab-v1`). Al publicar una nueva versión del service worker, se incrementa `CACHE_VERSION` en `public/sw.js`. Durante `activate`, el service worker elimina cualquier caché con nombre distinto al actual, evitando que versiones viejas ocupen espacio indefinidamente.

## Qué se precachea al instalar

- `/` — la pantalla principal.
- `/manifest.webmanifest` — necesario para que la app siga siendo instalable sin conexión.
- `/offline.html` — página de respaldo cuando no hay red.

## Estrategia según tipo de petición

**Navegación (cargar una página completa):** red primero; si falla, se responde con `/offline.html` desde caché. Se prioriza contenido actualizado porque el usuario espera ver la información más reciente al abrir la app.

**Recursos estáticos (JS, CSS, íconos):** caché primero, con actualización en segundo plano. Estos archivos cambian poco entre visitas, así que se sirven de inmediato desde caché para velocidad, y se refrescan en segundo plano para la próxima carga.

## Actualización segura

El service worker nuevo se instala pero **no toma control automáticamente** (`self.skipWaiting()` no se llama en `install`). Esto evita interrumpir una sesión en curso — por ejemplo, si un técnico está a medio registrar un hallazgo offline y la caché cambiara de golpe, podría perder ese progreso. La activación de la nueva versión solo ocurre cuando la página envía explícitamente un mensaje `SKIP_WAITING` al service worker (mecanismo ya implementado; la interfaz para que el usuario dispare ese mensaje se agregará en una semana posterior).

## Limitaciones y alcance futuro

- Esta semana no se cachean respuestas de una API real, porque el proyecto aún usa datos sintéticos locales (no hay llamadas de red que interceptar más allá de la navegación y los recursos estáticos).

- El guardado de datos creados sin conexión (registros de inspección) sigue pendiente como RF-04 de `docs/requirements.md`; el caché del service worker resuelve la disponibilidad de la app offline, no el almacenamiento de datos nuevos generados sin conexión — eso requiere IndexedDB o similar, fuera del alcance de esta semana.