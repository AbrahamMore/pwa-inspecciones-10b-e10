# Estrategia de pruebas — Semana 8 (pirámide de pruebas e integración continua)

Todas las pruebas usan **datos sintéticos**. No hay secretos, tokens ni datos personales en el repositorio.

## 1. Objetivo y flujo crítico

El flujo que más importa a una PWA de inspecciones de laboratorio es:

> Un técnico **captura una inspección sin conexión**, el registro **no se pierde**, y al volver la red se **sincroniza una sola vez** (sin duplicados), aunque haya reintentos, pestañas simultáneas o respuestas perdidas.

Cada nivel de la pirámide protege una parte distinta de ese flujo.

## 2. La pirámide

| Nivel | Carpeta | Qué prueba | Velocidad | Cómo corre |
|---|---|---|---|---|
| Unitarias | `tests/unit/` (15 archivos) | Lógica pura y aislada: cola de sincronización, reintentos, política de conflictos, validación, idempotencia del almacén, sincronizador, compresión de imagen, módulos de cámara / ubicación / notificaciones (con objetos simulados), registro del service worker, contratos del manifest y del `sw.js`, renderizado de rutas, reintentos agotados y lectura de un almacenamiento local dañado, textos de estado | Milisegundos | `npm run test:unit` |
| Integración | `tests/integration/` (5 archivos) | Varias piezas juntas **sin navegador**: cola → API real (handler `POST`/`GET`), conflictos a través de la API, envíos simultáneos del mismo registro, componentes de navegación y panel de dispositivo renderizados, precache del service worker contra los archivos reales | Segundos | `npm run test:integration` |
| E2E | `tests/e2e/` (7 pruebas, Playwright) | La app **construida en modo producción** en un Chromium real: recorrido solo con clics, apertura sin conexión, flujo crítico offline → sincronización, validación del formulario y fallback sin cámara, captura de foto y ubicación simuladas, y recuperación ante almacenamiento local dañado | ~25 s | `npm run test:e2e` |

La proporción es intencional: muchas pruebas baratas y precisas abajo, pocas y costosas arriba. Un fallo unitario señala la función exacta; un fallo E2E solo dice que *algo* del flujo se rompió, por eso se reserva para lo que ninguna otra capa puede comprobar (service worker real, `localStorage` real, eventos online/offline, navegación).

### Qué cubre cada nivel del flujo crítico

- **Captura y validación:** unitarias (`validation`, `image`) + E2E (formulario inválido no se encola).
- **Persistencia local y reintentos:** unitarias (`sync`) + integración (`sync-integration`: sin red queda pendiente, con red se envía; respuesta perdida y reintento).
- **Idempotencia / no duplicar:** unitarias (`inspections-store`), integración (`sync-integration`, `conflict-integration` con 6 envíos simultáneos) y E2E (recargar no duplica).
- **Conflictos (last-write-wins por `updatedAt`):** unitarias (`sync`) + integración (`conflict-integration`: un reenvío viejo no pisa lo nuevo).
- **Offline real y service worker:** unitarias (contratos de `sw.js`, registro, aviso de actualización) + E2E (la app abre sin red tras una primera visita).
- **Navegación integrada:** integración (`navigation`) + E2E (recorrido solo con clics).
- **Capacidades del dispositivo:** unitarias (módulos con objetos simulados) + integración (panel conectado al formulario, nada se pide al cargar) + E2E (sin cámara hay alternativa).

## 3. Decisiones técnicas y trade-offs

- **Sin framework de pruebas unitarias.** Se usan `node:assert` y `tsx`, con un ejecutor propio (`scripts/run-tests.mjs`) que corre cada archivo en su propio proceso y falla si alguno falla. Ventaja: cero dependencias nuevas y arranque rápido. Costo: sin *watch mode*, sin informes de cobertura y menos ayudas que Vitest/Jest. El ejecutor descubre los archivos por carpeta, para que una prueba nueva no pueda quedar olvidada fuera de la cadena de ejecución.
- **Playwright para E2E.** Controla offline (`setOffline`), service workers y permisos de forma fiable. Costo: descarga de navegador (~150 MB) y mayor tiempo. Alternativa descartada: pruebas con jsdom, que no tienen service worker ni red real.
- **Las E2E no forman parte de `npm run verify`.** `verify` es el comando que el curso ejecuta en limpio (`npm ci` + `verify`) y no instala navegadores; si incluyera E2E, fallaría en cualquier máquina sin Chromium. Por eso las E2E corren en un trabajo aparte de GitHub Actions (`e2e`), donde sí se instala el navegador, y localmente con `npm run test:e2e`.
- **E2E contra la build de producción** (`next build` + `next start`), no contra `next dev`: el service worker y el caché solo se comportan como en el despliegue real con la build.
- **Una sola instancia de pruebas E2E (`workers: 1`).** El "servidor" guarda en memoria y el service worker es compartido; correr en paralelo mezclaría estados. Los datos de cada prueba llevan un sufijo único (`Date.now()`) para no depender del orden.
- **Objetos simulados para cámara, ubicación y notificaciones.** Los diálogos reales de permisos no se pueden automatizar de forma fiable; se simulan las respuestas (`ok`, `denied`, `unsupported`, `error`) y se comprueba que la interfaz sigue usable.

## 4. Fallos encontrados (y qué los encontró)

| Fallo | Cómo se encontró | Corrección |
|---|---|---|
| El service worker **nunca se registraba**: el registro esperaba el evento `load`, que ya había pasado cuando React hidrataba | Prueba en navegador real (la app no abría offline) | Registrar de inmediato si `document.readyState === "complete"`; `sw-register.spec.ts` |
| La portada **no tenía forma de llegar** a las pantallas nuevas y la sincronización solo existía en el formulario | Recorrido manual solo con clics → hoy es la prueba E2E 1 | Barra de navegación + sincronización global; `navigation.spec.ts` y E2E |
| El mensaje de validación decía *"Los hallazgos es obligatorio"* | Escribiendo la prueba E2E del formulario inválido | Concordancia de número en `validation.ts`; asserts en `validation.spec.ts` |
| La **actualización segura** del service worker solo escribía en la consola; el usuario nunca podía activarla | Revisión del criterio de actualización segura al documentar | Aviso "Actualizar / Después" en la interfaz; `sw-update.spec.ts` |
| La política de conflictos existía pero **el servidor no la usaba** (tenía su propia comparación de fechas) | Revisión de integración | El almacén usa `resolveConflict`; `conflict-integration.spec.ts` |
| Un selector de la prueba E2E (`getByRole("alert")`) era ambiguo porque Next.js añade su propio `role="alert"` | Primera ejecución E2E (falló) | Filtrar por texto |
| El almacenamiento local dañado (JSON inválido) hacía que readQueue lanzara una excepción y la app no cargara bien | storage-schema.spec.ts (falló antes de la corrección) y datos-danados.spec.ts | readQueue captura el error y devuelve una cola vacía; la app se recupera al volver a guardar |

**Comprobación de que las pruebas detectan fallos (mutación manual):** se rompió a propósito la idempotencia del almacén (guardar con un identificador distinto en cada envío). Fallaron `inspections-store.spec.ts`, `conflict-integration.spec.ts` y `sync-integration.spec.ts`; al revertir, volvieron a pasar. Se comprobó también que `run-tests.mjs` termina con error si un archivo falla.

## 5. Límites conocidos (lo que estas pruebas NO prueban)

- **Solo Chromium.** No se probó Firefox ni Safari, que tratan distinto los service workers y las notificaciones.
- **Sin dispositivo físico ni diálogos reales de permisos.** La cámara y la ubicación en E2E usan dispositivos simulados por el navegador de pruebas; la ejecución de una prueba manual con cámara real en un dispositivo físico no está acreditada en esta evidencia.
- **Sin medición de cobertura.** No hay herramienta de cobertura instalada; la cobertura se razona por flujo (sección 2), no se mide en porcentaje.
- **Algunas pruebas leen el código fuente como texto** (por ejemplo, comprobar que `install` no llama `skipWaiting`). Son contratos baratos y útiles, pero frágiles ante refactors y no sustituyen una prueba de comportamiento.
- **El servidor es en memoria** (se reinicia con el servidor y no se comparte entre instancias). Las pruebas de idempotencia validan la lógica, no la persistencia real de una base de datos.
- **Una espera fija de 1 s** en la prueba E2E de "recargar no duplica" deja tiempo a que un reenvío indebido ocurra; es una fuente posible de intermitencia. Se aceptó porque la alternativa (sondear el servidor) no puede probar la *ausencia* de un evento.
- **Sin pruebas de carga ni de accesibilidad automatizada** (Axe/Lighthouse) en CI.

## 6. Integración continua

El archivo `.github/workflows/academic-evaluation.yml` se ejecuta en cada `push` y `pull_request` (y manualmente con `workflow_dispatch`) y tiene dos trabajos:

1. **`verify`:** `npm ci` → `npm run test:unit` → `npm run test:integration` → `npm run verify` (estructura, pruebas y build). Sube `reports/verification.json` como artefacto.
2. **`e2e`** (solo si `verify` pasó): `npm ci` → instala Chromium → `npm run test:e2e`. Sube el reporte HTML y las trazas de Playwright como artefacto, también cuando falla, para poder inspeccionar el fallo.

Se usa Node 20.19.6 con caché de npm y permisos mínimos (`contents: read`). Las pruebas no necesitan secretos.

## 7. Cómo ejecutar todo en local

```bash
npm ci
npm run test:unit
npm run test:integration
npm run verify            # equivalente: make verify
npx playwright install chromium   # solo la primera vez
npm run test:e2e
```
