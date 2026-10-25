import { expect, test } from "@playwright/test";

const COLA = "inspecciones-sync-queue-v1";

test("si el almacenamiento local está dañado, la app abre y se recupera", async ({ page }) => {
  await page.goto("/");
  await page.evaluate((k) => localStorage.setItem(k, "{esto no es json"), COLA);

  const errores: string[] = [];
  page.on("pageerror", (e) => errores.push(e.message));

  await page.goto("/inspecciones/nueva");
  await expect(page.getByRole("heading", { name: "Nueva inspección" })).toBeVisible();
  await expect(page.getByText("Aún no has guardado inspecciones en este dispositivo.")).toBeVisible();

  // Se puede seguir capturando: el dato dañado se reemplaza al guardar.
  const lab = `Laboratorio Recuperado ${Date.now()}`;
  await page.getByLabel("Laboratorio").fill(lab);
  await page.getByLabel("Responsable").fill("Técnica E2E");
  await page.getByLabel("Hallazgos").fill("Después de datos dañados");
  await page.getByRole("button", { name: "Guardar inspección" }).click();
  await expect(page.getByText("Sincronizada")).toBeVisible({ timeout: 15_000 });

  expect(errores, "no debe haber errores de JavaScript sin atender").toEqual([]);
});
