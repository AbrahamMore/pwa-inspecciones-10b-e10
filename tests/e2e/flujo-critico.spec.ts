import { expect, test, type Page } from "@playwright/test";
import { cabecerasActorDemo } from "../../src/lib/security/actor";

/**
 * E2E del flujo crítico de la PWA: capturar una inspección SIN conexión, no perderla,
 * y sincronizarla UNA sola vez al volver la red. Se ejecuta contra la build de producción.
 * Todos los datos son sintéticos.
 */

const COLA = "inspecciones-sync-queue-v1";

async function activarServiceWorker(page: Page) {
  await page.goto("/");
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload(); // la primera carga no está controlada por el service worker
  await expect(page.getByRole("navigation", { name: "Principal" })).toBeVisible();
}

async function irOffline(page: Page) {
  await page.context().setOffline(true);
  await page.evaluate(() => window.dispatchEvent(new Event("offline")));
}

async function volverOnline(page: Page) {
  await page.context().setOffline(false);
  await page.evaluate(() => window.dispatchEvent(new Event("online")));
}

const nav = (page: Page, nombre: string) => page.getByRole("navigation", { name: "Principal" }).getByRole("link", { name: nombre, exact: true });

async function registros(page: Page, laboratorio: string) {
  const r = await page.request.get("/api/inspecciones", { headers: cabecerasActorDemo() });
  const { items } = (await r.json()) as { items: { payload: { location: string } }[] };
  return items.filter((i) => i.payload.location === laboratorio);
}

async function llenarFormulario(page: Page, laboratorio: string, hallazgo: string) {
  await page.getByLabel("Laboratorio").fill(laboratorio);
  await page.getByLabel("Responsable").fill("Técnica E2E");
  await page.getByLabel("Hallazgos").fill(hallazgo);
  await page.getByRole("button", { name: "Guardar inspección" }).click();
}

test("se puede recorrer toda la app solo con clics, sin escribir URLs", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Ver inspecciones" }).click();
  await expect(page).toHaveURL(/\/inspecciones$/);
  await page.getByRole("link", { name: "+ Nueva inspección" }).click();
  await expect(page).toHaveURL(/\/inspecciones\/nueva$/);
  await nav(page, "Inicio").click();
  await expect(page).toHaveURL(/\/$/);
  // Detalle de una inspección sintética desde la tarjeta de la portada.
  await page.getByRole("link", { name: /Laboratorio/ }).first().click();
  await expect(page).toHaveURL(/\/inspecciones\/inspection-\d+/);
});

test("la app abre sin conexión después de una primera visita", async ({ page }) => {
  await activarServiceWorker(page);
  await page.goto("/inspecciones/nueva");
  await irOffline(page);
  await page.reload();
  await expect(page.getByRole("heading", { name: "Nueva inspección" })).toBeVisible();
  await expect(page.getByText("Sin conexión").first()).toBeVisible();
  await volverOnline(page);
});

test("flujo crítico: captura offline, no se pierde y sincroniza una sola vez", async ({ page }) => {
  const lab = `Laboratorio E2E ${Date.now()}`;
  await activarServiceWorker(page);
  await nav(page, "Nueva inspección").click();

  await irOffline(page);
  await llenarFormulario(page, lab, "Equipo sin red (prueba E2E)");
  await expect(page.getByText("Pendiente de enviar")).toBeVisible();
  await expect(page.getByText("1 por enviar")).toBeVisible();
  expect(await registros(page, lab).catch(() => [])).toHaveLength(0); // aún no llegó al servidor

  // El registro sobrevive a cambiar de pantalla y está en el listado.
  await nav(page, "Inspecciones").click();
  await expect(page.getByText("Capturadas en este dispositivo")).toBeVisible();
  await expect(page.getByText(lab)).toBeVisible();

  // Vuelve la red: se envía solo, desde cualquier pantalla.
  await volverOnline(page);
  await expect(page.getByText("Sincronizada")).toBeVisible({ timeout: 15_000 });
  await expect.poll(async () => (await registros(page, lab)).length).toBe(1);

  // Recargar y volver a sincronizar NO duplica (idempotencia por clientId).
  await page.reload();
  await page.waitForTimeout(1000);
  expect(await registros(page, lab)).toHaveLength(1);
  const cola = await page.evaluate((k) => JSON.parse(localStorage.getItem(k) ?? "[]").length, COLA);
  expect(cola).toBeGreaterThanOrEqual(1);
});

test("el formulario valida antes de guardar y no encola registros inválidos", async ({ page }) => {
  await page.goto("/inspecciones/nueva");
  await page.getByRole("button", { name: "Guardar inspección" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "obligatorio" })).toBeVisible();
  const cola = await page.evaluate((k) => JSON.parse(localStorage.getItem(k) ?? "[]").length, COLA);
  expect(cola).toBe(0);
});

test("sin permiso o sin cámara hay alternativa y el formulario sigue usable", async ({ page }) => {
  await page.goto("/inspecciones/nueva");
  await page.evaluate(() => {
    // Simula un dispositivo sin cámara.
    Object.defineProperty(navigator, "mediaDevices", { value: undefined, configurable: true });
  });
  await page.getByRole("button", { name: "Tomar foto" }).click();
  await expect(page.getByRole("status").filter({ hasText: "cámara" })).toBeVisible();
  await expect(page.locator("input[type=file][capture]")).toHaveCount(1); // alternativa: adjuntar archivo
  await expect(page.getByRole("button", { name: "Guardar inspección" })).toBeEnabled();
});
