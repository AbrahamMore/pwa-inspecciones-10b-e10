.PHONY: verify test test-unit test-integration test-e2e build

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
