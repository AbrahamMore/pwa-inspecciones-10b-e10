# Changelog

Formato: [SemVer](https://semver.org/lang/es/). Cada versión corresponde a un SHA; el SHA no se escribe aquí (cambiaría el commit): se consulta en `GET /api/health`, en la etiqueta Git `vX.Y.Z` y en `evidence/individual.md`.

## 1.0.0 — Semana 10

Primera release identificable de la PWA de inspecciones de laboratorio (datos sintéticos).

- Versión y commit publicados: `GET /api/health` y pie de página de la app.
- `Dockerfile` reproducible (Node 20.19.6, `npm ci`, usuario no root, `HEALTHCHECK`).
- Smoke test `tests/smoke.spec.ts` y trabajo `smoke-docker` en GitHub Actions.
- `docs/release-process.md` y `docs/runbook.md`.
