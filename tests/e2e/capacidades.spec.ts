import { expect, test } from "@playwright/test";

/**
 * E2E de capacidades del dispositivo con cámara y ubicación SIMULADAS por el navegador de pruebas.
 * Comprueba que la foto y la ubicación se capturan, viajan con el registro y llegan al servidor.
 */
test.use({
  permissions: ["camera", "geolocation"],
  geolocation: { latitude: 18.4618, longitude: -97.3927, accuracy: 25 },
  launchOptions: {
    args: ["--use-fake-device-for-media-stream", "--use-fake-ui-for-media-stream"],
    ...(process.env.PW_CHROMIUM_PATH ? { executablePath: process.env.PW_CHROMIUM_PATH } : {}),
  },
});

test("foto y ubicación se capturan al pulsar los botones y llegan al servidor", async ({ page }) => {
  const lab = `Laboratorio Capacidades ${Date.now()}`;
  await page.goto("/inspecciones/nueva");

  // Nada se pide al cargar la página: la cámara no está abierta.
  await expect(page.locator("video")).toHaveCount(0);

  await page.getByRole("button", { name: "Tomar foto" }).click();
  await expect(page.locator("video")).toBeVisible();
  await page.waitForTimeout(1000); // deja que la cámara simulada produzca un fotograma
  await page.getByRole("button", { name: "Capturar" }).click();
  await expect(page.getByAltText("Foto adjunta a la inspección")).toBeVisible();
  await expect(page.locator("video")).toHaveCount(0); // la cámara se apaga al capturar

  await page.getByRole("button", { name: "Usar mi ubicación" }).click();
  await expect(page.getByText(/Ubicación aproximada: 18\.462, -97\.393/)).toBeVisible();

  await page.getByLabel("Laboratorio").fill(lab);
  await page.getByLabel("Responsable").fill("Técnica E2E");
  await page.getByLabel("Hallazgos").fill("Registro con foto y ubicación");
  await page.getByRole("button", { name: "Guardar inspección" }).click();
  await expect(page.getByText("Sincronizada")).toBeVisible({ timeout: 15_000 });

  const r = await page.request.get("/api/inspecciones");
  const { items } = (await r.json()) as { items: { payload: { location: string; photo?: string; geo?: { lat: number; lon: number } } }[] };
  const mio = items.filter((i) => i.payload.location === lab);
  expect(mio).toHaveLength(1);
  expect(mio[0].payload.photo).toMatch(/^data:image\/jpeg;base64,/);
  expect(mio[0].payload.geo).toMatchObject({ lat: 18.462, lon: -97.393 });

  // Quitar la foto y la ubicación antes de guardar es posible.
  await page.getByRole("button", { name: "Tomar foto" }).click();
  await page.waitForTimeout(800);
  await page.getByRole("button", { name: "Capturar" }).click();
  await page.getByRole("button", { name: "Quitar foto" }).click();
  await expect(page.getByAltText("Foto adjunta a la inspección")).toHaveCount(0);
});
