# Estrategia de caché — Service Worker

Archivo: `public/sw.js`. Registro: `src/lib/pwa/register-service-worker.ts` y `src/components/sw-register.tsx`.

## Versionado

El caché usa un nombre versionado: `inspecciones-lab-v3` (`CACHE_VERSION = "v3"`). Cuando se publica una versión nueva del service worker se incrementa la versión. Durante `activate`, el service worker elimina todos los cachés cuyo nombre sea distinto del actual, para que las versiones viejas no ocupen espacio ni sirvan contenido obsoleto.

## Qué se precachea al instalar

Lo mínimo para que la app abra y se pueda usar sin conexión:

- `/` — portada.
- `/inspecciones` — listado.
- `/inspecciones/nueva` — formulario de captura.
- `/manifest.webmanifest` — necesario para que la app siga siendo instalable.
- `/icons/icon-192.png` y `/icons/icon-512.png` — íconos de la app.
- `/offline.html` — página de respaldo cuando no hay red.

## Estrategia según tipo de petición

| Petición | Estrategia | Por qué |
|---|---|---|
| Navegación (cargar una página) | **Red primero.** Si la respuesta es correcta, se guarda una copia en el caché. Si la red falla, se sirve la última copia guardada; si esa página nunca se visitó, se sirve `/offline.html`. | Se prioriza contenido actualizado, pero cualquier página visitada sigue disponible sin conexión. |
| Recursos estáticos (JS, CSS, íconos) | **Caché primero, con actualización en segundo plano.** Se responde de inmediato desde el caché y se refresca la copia para la siguiente carga. | Cambian poco entre visitas; se prioriza la velocidad. |
| Peticiones que no son GET, de otro origen o a `/api/` | **No se interceptan.** Pasan directo a la red. | La sincronización (`POST /api/inspecciones`) nunca debe servirse desde un caché: debe llegar al servidor o fallar para que la cola la reintente. |

Consecuencia: el detalle de una inspección (`/inspecciones/[id]`) solo está disponible sin conexión si se visitó antes con conexión; no se precachea.

## Actualización segura

El service worker nuevo se instala pero **no toma control automáticamente**: `install` no llama `skipWaiting()`. Así no se interrumpe a una persona que esté a medio registrar una inspección.

La activación solo ocurre por una acción explícita del usuario:

1. Cuando hay una versión nueva esperando, la app muestra un aviso: *"Hay una versión nueva de la app. Tus registros guardados no se pierden."* con los botones **Actualizar** y **Después**.
2. Al pulsar **Actualizar**, la página envía el mensaje `SKIP_WAITING` al service worker nuevo.
3. Cuando el nuevo service worker toma el control (`controllerchange`), la página se recarga **una sola vez**.

El aviso aparece solo cuando ya existía un service worker anterior controlando la página; en la primera instalación no hay nada que actualizar. También aparece si la persona recarga y la versión nueva ya estaba esperando.

Los registros capturados sin conexión **no se pierden** al actualizar porque viven en `localStorage` (cola de sincronización), no en el caché del service worker.

## Registro del service worker

El registro se hace desde un componente de cliente. Si la página ya terminó de cargar, se registra de inmediato; si todavía carga, se espera al evento `load`. (Antes se esperaba siempre a `load`, que ya había ocurrido cuando React hidrataba, y el service worker nunca se registraba; ese fallo se corrigió durante la integración de la app.)

## Cómo se verifica

- `tests/unit/service-worker.spec.ts` y `tests/unit/offline.spec.ts`: eventos del ciclo de vida, que `install` no llame `skipWaiting()`, que `activate` borre cachés viejos y que exista el fallback offline.
- `tests/unit/sw-register.spec.ts` y `tests/unit/sw-update.spec.ts`: registro inmediato o tras `load`, aviso de actualización, `SKIP_WAITING` solo tras la acción del usuario y recarga una sola vez.
- `tests/integration/pwa-integration.spec.ts`: el precache apunta a archivos que existen.
- `tests/e2e/flujo-critico.spec.ts`: la app abre sin conexión después de una primera visita (Chromium real).
- Prueba manual: ver `docs/protocolo-manual-offline.md`.

## Limitaciones

- Solo se precachean las pantallas principales; los detalles de inspección y otras páginas dependen de que se hayan visitado.
- No se cachean respuestas de la API: los datos de la portada son sintéticos y locales, y lo capturado se guarda en `localStorage`, no en el caché.
- La actualización del caché depende de que cambie `CACHE_VERSION` o el contenido de `sw.js`; no hay purga selectiva de archivos.
- El comportamiento solo se ha probado en Chromium.
