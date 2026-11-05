#
# Imagen reproducible de la PWA de inspecciones (Semana 10). Tres etapas:
#   deps    → instala EXACTAMENTE lo que dice package-lock.json (npm ci)
#   build   → compila Next.js y fija en el artefacto la versión y el SHA del commit
#   runtime → solo lo necesario para ejecutar, sin herramientas de desarrollo y sin root
#
# Construir:  docker build --build-arg APP_COMMIT_SHA=$(git rev-parse HEAD) -t pwa-inspecciones:1.0.0 .
# Ejecutar:   docker run --rm -p 3000:3000 pwa-inspecciones:1.0.0
# Esta imagen solo empaqueta el SERVIDOR. No actualiza los service workers ya instalados en los
# navegadores (ver docs/release-process.md y docs/runbook.md).

# Misma versión de Node que .nvmrc y que GitHub Actions (hay una prueba que lo comprueba).
ARG NODE_VERSION=20.19.6

FROM node:${NODE_VERSION}-bookworm-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts --no-audit --no-fund

FROM node:${NODE_VERSION}-bookworm-slim AS build
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
# El .git no entra al contexto (.dockerignore): el SHA se pasa explícitamente al construir.
ARG APP_COMMIT_SHA=""
ENV APP_COMMIT_SHA=${APP_COMMIT_SHA}
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:${NODE_VERSION}-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts --no-audit --no-fund && npm cache clean --force
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/next.config.mjs ./next.config.mjs
# El usuario "node" ya existe en la imagen oficial: la app no necesita privilegios de root.
USER node
EXPOSE 3000
# Considera sana la app solo si /api/health responde 200 (no basta con que el proceso exista).
HEALTHCHECK --interval=15s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["sh", "-c", "exec node_modules/.bin/next start -H 0.0.0.0 -p ${PORT}"]
