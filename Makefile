.PHONY: verify test test-unit test-integration test-e2e build docker-build docker-run smoke smoke-url

verify:
	npm run verify

test:
	npm test

test-unit:
	npm run test:unit

test-integration:
	npm run test:integration

# Requiere Chromium: npx playwright install chromium (solo la primera vez)
test-e2e:
	npm run test:e2e

build:
	npm run build

# --- Release (Semana 10) ---
# Construye la imagen con el SHA actual dentro del artefacto.
docker-build:
	docker build --build-arg APP_COMMIT_SHA=$$(git rev-parse HEAD) -t pwa-inspecciones:local .

docker-run:
	docker run --rm -p 3000:3000 pwa-inspecciones:local

# Smoke contra la app local (construye y levanta la versión de producción). Requiere Chromium.
smoke:
	npm run smoke

# Smoke contra una URL ya levantada: make smoke-url URL=http://localhost:3000
smoke-url:
	SMOKE_BASE_URL=$(URL) npm run smoke
