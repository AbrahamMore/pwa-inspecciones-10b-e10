import { defineConfig, devices } from "@playwright/test";

const PUERTO = 3100;
const enCI = !!process.env.CI;
// Si se define SMOKE_BASE_URL, el smoke test se ejecuta contra ESA dirección (un contenedor Docker, un
// despliegue de Vercel o un servidor ya levantado) y Playwright no construye ni arranca la app.
const urlExterna = process.env.SMOKE_BASE_URL?.replace(/\/+$/, "");

const lanzadorChromium = process.env.PW_CHROMIUM_PATH ? { executablePath: process.env.PW_CHROMIUM_PATH } : {};

export default defineConfig({
  testDir: "tests",
  // Las pruebas comparten el "servidor" en memoria y el service worker: se ejecutan de una en una.
  fullyParallel: false,
  workers: 1,
  retries: enCI ? 1 : 0,
  timeout: 60_000,
  reporter: enCI ? [["list"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: urlExterna ?? `http://localhost:${PUERTO}`,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    locale: "es-MX",
  },
  projects: [
    {
      // `npm run test:e2e`: flujo crítico completo contra la build de producción local.
      name: "chromium",
      testDir: "tests/e2e",
      use: { ...devices["Desktop Chrome"], launchOptions: lanzadorChromium },
    },
    {
      // `npm run smoke`: recorrido corto de la ruta crítica (tests/smoke.spec.ts), apto para una URL ya desplegada.
      name: "smoke",
      testDir: "tests",
      testMatch: "smoke.spec.ts",
      use: { ...devices["Desktop Chrome"], launchOptions: lanzadorChromium },
    },
  ],
  // Se prueba la versión de producción (service worker y caché solo se comportan igual que en el despliegue real).
  webServer: urlExterna
    ? undefined
    : {
        command: `npm run build && npx next start -p ${PUERTO}`,
        url: `http://localhost:${PUERTO}`,
        reuseExistingServer: !enCI,
        timeout: 240_000,
      },
});
