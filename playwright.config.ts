import { defineConfig, devices } from "@playwright/test";

const PUERTO = 3100;
const enCI = !!process.env.CI;

export default defineConfig({
  testDir: "tests/e2e",
  // Las pruebas comparten el "servidor" en memoria y el service worker: se ejecutan de una en una.
  fullyParallel: false,
  workers: 1,
  retries: enCI ? 1 : 0,
  timeout: 60_000,
  reporter: enCI ? [["list"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: `http://localhost:${PUERTO}`,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    locale: "es-MX",
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        // Permite usar un Chromium ya instalado (por ejemplo en un entorno sin descarga de navegadores).
        launchOptions: process.env.PW_CHROMIUM_PATH ? { executablePath: process.env.PW_CHROMIUM_PATH } : {},
      },
    },
  ],
  // Se prueba la versión de producción (service worker y caché solo se comportan igual que en el despliegue real).
  webServer: {
    command: `npm run build && npx next start -p ${PUERTO}`,
    url: `http://localhost:${PUERTO}`,
    reuseExistingServer: !enCI,
    timeout: 240_000,
  },
});
