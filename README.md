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