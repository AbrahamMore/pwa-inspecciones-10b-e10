# PWA de inspecciones de laboratorio — proyecto del equipo

Comiencen por `START_HERE.md` y lean `ACTIVIDAD-01.md`. Este es un proyecto acumulativo: un repositorio privado por equipo durante el curso. La Semana 1 consistió en arrancar, documentar y explicar la verificación. La Semana 2 construye el shell instalable con manifest, navegación y estados de carga, error y vacío.

## Entorno

Node.js 20.19 o posterior compatible, npm 10 o posterior, Git y cuenta de GitHub. No se requiere Make. Registren aquí las versiones usadas (`node --version`, `npm --version`) y cualquier dificultad de entorno que encuentren.

## Ejecución

```bash
npm ci
npm run dev
```

Abran `http://localhost:3000` y comprueben las tres inspecciones sintéticas. La pantalla pasa por un estado breve de carga antes de mostrarlas. Detengan el servidor con Ctrl+C.

## Verificación

```bash
npm run verify
```

Ejecuta comprobación de archivos, pruebas proporcionadas (incluyendo `tests/manifest.spec.ts` desde la Semana 2) y build; genera `reports/verification.json`. El reporte contiene resultados técnicos y documentos para revisión, no una calificación automática. `make verify` es equivalente. `bash public-tests/check.sh` es un check opcional de estructura.

GitHub Actions ejecuta la misma verificación y permite descargar el artefacto correspondiente a cada semana. El reporte local se excluye de Git: adjúntenlo en Classroom o descarguen el del SHA entregado desde Actions.

## Service Worker y modo offline (Semana 3)

El proyecto registra un service worker (`public/sw.js`) que permite abrir la app sin conexión, mostrando `public/offline.html` si la navegación falla por falta de red. La estrategia de caché completa está documentada en [`docs/cache-strategy.md`](docs/cache-strategy.md).

Para probarlo manualmente: `npm run dev`, abre la app una vez con conexión (para que se precachee), y luego simula sin conexión desde las DevTools del navegador (pestaña Network → Offline) y recarga.

## Trabajo y entrega en equipo

Inviten a los integrantes y al docente al mismo repositorio privado. Cada persona registra su evidencia en una sección de `evidence/individual.md`. Todos entregan en Classroom el mismo SHA final y enlaces, identificando su sección. El formato exacto está en el documento de cada actividad; no se requiere un pull request adicional ni una copia por alumno.

## Estructura y límites

- `src/app/`: pantalla Next.js, incluyendo estados de carga, error y vacío (Semana 2).
- `src/components/`: componentes compartidos, como el shell instalable (`app-shell.tsx`, Semana 2).
- `src/lib/data/`: inspecciones sintéticas.
- `public/manifest.webmanifest`: manifest de la PWA (Semana 2).
- `docs/`: requisitos y decisión del equipo.
- `evidence/`: evidencia propia de cada integrante.
- `tests/`: pruebas proporcionadas y agregadas por el equipo (`starter.spec.mjs`, `manifest.spec.ts`); no es una suite completa de comportamiento.

Registren aquí sus supuestos y limitaciones de ejecución. El proyecto ya cuenta con manifest, shell instalable y disponibilidad offline de la aplicación, pero aún no implementa sincronización — eso corresponde a semanas posteriores. No incluyan datos personales reales en el producto, archivos `.env` ni credenciales. La identificación de integrantes se conserva en el repositorio privado y Classroom.

## Renderizado CSR/SSR (Semana 4)

El listado de inspecciones (`/inspecciones`) usa interacción de cliente para la búsqueda y el filtrado local sin recargar la página. Next.js puede prerenderizar el HTML inicial del Client Component; en esta ruta ese HTML presenta el estado de carga y los resultados aparecen después de que se ejecuta la carga en el cliente. El detalle (`/inspecciones/[id]`) es un Server Component que resuelve la inspección en el servidor y usa `notFound()` cuando la ID no existe.

La decisión completa, con ventajas, costos, riesgos y limitaciones de las pruebas, está documentada en [`docs/rendering-decision.md`](docs/rendering-decision.md).

Para probarlo manualmente, ejecuta `npm run dev` y:

- abre `/inspecciones`;
- busca por nombre de laboratorio y comprueba el filtrado;
- abre el detalle de un resultado;
- prueba una ID inexistente, si corresponde.

En esta ejecución, `npm ci`, `npm test`, `npm run build`, `npm run verify` y `node scripts/verify.mjs --structure` finalizaron correctamente. `bash public-tests/check.sh` no pudo ejecutarse porque `bash` no está disponible en este entorno; su equivalente estructural con Node pasó. `npm run verify` consultó internamente `git rev-parse` y `git status` para generar su reporte; no ejecuté comandos Git directamente. No se ejecutó `make verify`, porque delega a ese mismo script.

## Semana 6 — Capacidades del dispositivo y notificaciones

- **Código:** `src/lib/device/camera.ts`, `src/lib/device/geolocation.ts`, `src/lib/notifications/client.ts`.
- **Documentación:** `docs/capabilities.md`, con permisos, fallbacks, decisiones y limitaciones.
- **Pruebas:** `tests/capabilities.spec.ts`.
- **Instalación:** `npm ci`.
- **Ejecución local:** `npm run dev` en `http://localhost:3000`.
- **Verificación:** `npm run verify`, que genera `reports/verification.json`, de acuerdo con el script existente.
- **Evidencia individual:** `evidence/individual.md`.



## Pruebas e integración continua (Semana 8)

Estrategia completa (pirámide, trade-offs, fallos encontrados y límites): [`docs/test-strategy.md`](docs/test-strategy.md).

| Nivel | Carpeta | Qué comprueba | Comando |
|---|---|---|---|
| Unitarias | `tests/unit/` | Lógica aislada: cola, reintentos, conflictos, validación, idempotencia, módulos de dispositivo, service worker | `npm run test:unit` |
| Integración | `tests/integration/` | Piezas juntas sin navegador: cola → API real, conflictos, componentes de navegación y de dispositivo | `npm run test:integration` |
| E2E | `tests/e2e/` | Flujo crítico en un Chromium real contra la build de producción (Playwright) | `npm run test:e2e` |

Todas las pruebas usan datos sintéticos.

### Setup

```bash
node --version      # Node 20.19 o posterior
npm ci
npx playwright install chromium   # solo la primera vez (descarga el navegador, ~200 MB)
```

### Ejecución y verificación

```bash
npm run verify        # estructura + unitarias + integración + build -> reports/verification.json (equivalente: make verify)
npm run test:e2e      # construye la app, la levanta en producción (puerto 3100) y ejecuta las pruebas E2E
```

`npm run verify` **no incluye** las E2E a propósito: debe funcionar con solo `npm ci`, sin navegador instalado. Las E2E se ejecutan con `npm run test:e2e` y en el trabajo `e2e` de GitHub Actions.

### Integración continua

`.github/workflows/academic-evaluation.yml` se ejecuta en cada `push` y `pull_request`:

1. `verify`: `npm ci` → pruebas unitarias → pruebas de integración → `npm run verify` (estructura, pruebas y build).
2. `e2e` (si `verify` pasó): instala Chromium y ejecuta Playwright; guarda el reporte HTML y las trazas como artefacto.

### Evidencia

El commit SHA, el enlace a la ejecución de Actions y la sección individual de cada integrante están en `evidence/individual.md`.

### Límites

Solo se prueba en Chromium; no se mide la cobertura en porcentaje; la cámara real y los diálogos de permisos no se automatizan (se simulan); el servidor de sincronización guarda en memoria. Detalle en `docs/test-strategy.md`, sección 5.

## Seguridad y privacidad (Semana 9)

Modelo de amenazas: [`docs/threat-model.md`](docs/threat-model.md). Inventario de datos: [`docs/privacy-data-inventory.md`](docs/privacy-data-inventory.md). Todo usa datos sintéticos; no hay secretos, tokens ni datos personales en el repositorio.

### Qué se implementó

| Control | Dónde | Amenaza que reduce |
|---|---|---|
| Autorización por rol en la API (mínimo privilegio, denegar por defecto) | `src/lib/security/authz.ts`, `src/lib/security/actor.ts`, `src/app/api/inspecciones/**` | Un inspector lee o pisa registros de otro (IDOR) |
| Validación y lista blanca de campos en el servidor | `src/lib/security/validation.ts` | Datos fuera de rango, campos extra, foto SVG, `clientId` raro, cuerpos enormes |
| Minimización: el listado no entrega foto ni propietario | `src/lib/server/inspections-access.ts` | Exposición innecesaria de datos |
| CSP con nonce y cabeceras de seguridad | `src/middleware.ts`, `src/lib/security/headers.ts` | XSS, clickjacking, sniffing de tipos |
| Borrar datos de este dispositivo | `src/lib/security/local-data.ts`, `src/components/borrar-datos-locales.tsx` | Datos privados que quedan en un equipo compartido o perdido |
| `robots.txt` | `public/robots.txt` | Solo orienta a rastreadores; **no** es control de acceso |

**La identidad es simulada.** El proyecto no tiene autenticación real (quedó fuera de alcance desde la Semana 1). El "actor" se lee de cabeceras de demostración (`x-demo-actor`, `x-demo-rol`, `x-demo-alcance`) que el cliente envía y que cualquiera puede falsificar. Sirven para ejercitar y probar la política de autorización, **no** para proteger datos reales. En un sistema real, `obtenerActor()` leería una sesión firmada en el servidor y el resto no cambiaría.

### Setup, ejecución y verificación

```bash
node --version                      # Node 20.19 o posterior
npm ci
npm run verify                      # estructura + starter + seguridad + unitarias + integración + build (equivalente: make verify)
npm run test:security               # solo las pruebas negativas de seguridad (tests/security.spec.ts)
npx playwright install chromium     # solo la primera vez
npm run test:e2e                    # incluye tests/e2e/seguridad.spec.ts (CSP real en el navegador)
```

Las pruebas de seguridad también corren en GitHub Actions (trabajo `verify`, paso "Pruebas de seguridad").

### Evidencia

El commit SHA, la ejecución de Actions y la sección individual de cada integrante están en `evidence/individual.md`.

### Límites y compromisos

- La CSP exige páginas dinámicas (un nonce distinto por respuesta): se pierde el prerenderizado estático. Para no romper el modo sin conexión, el service worker precachea también los archivos de build de cada página (`docs/cache-strategy.md`).
- `style-src` no permite estilos en línea en producción; el estilo de `public/offline.html` es en línea y por eso esa página queda fuera del middleware (no ejecuta scripts).
- Algunas pruebas de seguridad leen el código fuente como texto (por ejemplo, que no haya `dangerouslySetInnerHTML`): son baratas pero frágiles ante refactors.
- La autenticación real, el límite de peticiones (rate limit) y la persistencia real del servidor siguen fuera de alcance.
