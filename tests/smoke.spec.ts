import { expect, test, type Page } from "@playwright/test";
import { cabecerasActorDemo } from "../src/lib/security/actor";

/**
 * SMOKE TEST de release (Semana 10): seis minutos, o menos, para saber si la versión publicada sirve.
 * No sustituye a la suite E2E: recorre solo el camino crítico y se puede apuntar a cualquier URL
 * (contenedor Docker, despliegue de Vercel, servidor local) con SMOKE_BASE_URL.
 *
 *   SMOKE_BASE_URL         dirección a probar (si falta, Playwright construye y levanta la app local)
 *   SMOKE_EXPECTED_SHA     SHA completo que DEBE estar publicado (si se define, se compara)
 *   SMOKE_EXPECTED_VERSION versión SemVer que DEBE estar publicada (opcional)
 *
 * Solo datos sintéticos. Cada ejecución crea registros con un laboratorio único para no depender de otros.
 */

const COLA = "inspecciones-sync-queue-v1";
const SHA = /^[0-9a-f]{40}$/;
const SEMVER = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/;

const nav = (page: Page, nombre: string) =>
  page
    .getByRole("navigation", { name: "Principal" })
    .getByRole("link", { name: nombre, exact: true });

async function activarServiceWorker(page: Page) {
  await page.goto("/");
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload(); // la primera carga no está controlada por el service worker
  await expect(
    page.getByRole("navigation", { name: "Principal" }),
  ).toBeVisible();
}

async function irOffline(page: Page) {
  await page.context().setOffline(true);
  await page.evaluate(() => window.dispatchEvent(new Event("offline")));
}

async function volverOnline(page: Page) {
  await page.context().setOffline(false);
  await page.evaluate(() => window.dispatchEvent(new Event("online")));
}

async function registrosEnServidor(page: Page, laboratorio: string) {
  const r = await page.request.get("/api/inspecciones", {
    headers: cabecerasActorDemo(),
  });
  expect(r.status()).toBe(200);
  const { items } = (await r.json()) as {
    items: { payload: { location: string } }[];
  };
  return items.filter((i) => i.payload.location === laboratorio);
}

async function llenarFormulario(
  page: Page,
  laboratorio: string,
  hallazgo: string,
) {
  await page.getByLabel("Laboratorio").fill(laboratorio);
  await page.getByLabel("Responsable").fill("Técnica smoke");
  await page.getByLabel("Hallazgos").fill(hallazgo);
  await page.getByRole("button", { name: "Guardar inspección" }).click();
}

test("01 · la URL abre y el servidor está sano", async ({ page }) => {
  const errores: string[] = [];
  page.on("pageerror", (e) => errores.push(e.message));

  const respuesta = await page.goto("/");
  expect(respuesta?.status()).toBe(200);
  await expect(
    page.getByRole("navigation", { name: "Principal" }),
  ).toBeVisible();

  const salud = await page.request.get("/api/health");
  expect(salud.status()).toBe(200);
  expect((await salud.json()).status).toBe("ok");
  expect(errores, "la portada no debe lanzar errores de JavaScript").toEqual(
    [],
  );
});

test("02 · la navegación carga las rutas principales", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Ver inspecciones" }).click();
  await expect(page).toHaveURL(/\/inspecciones$/);
  await page.getByRole("link", { name: "+ Nueva inspección" }).click();
  await expect(page).toHaveURL(/\/inspecciones\/nueva$/);
  await expect(
    page.getByRole("heading", { name: "Nueva inspección" }),
  ).toBeVisible();
  await nav(page, "Inicio").click();
  await page
    .getByRole("link", { name: /Laboratorio/ })
    .first()
    .click();
  await expect(page).toHaveURL(/\/inspecciones\/inspection-\d+/);
});

test("03 · el formulario guarda y el registro llega al servidor", async ({
  page,
}) => {
  const lab = `Laboratorio SMOKE ${Date.now()}`;
  await page.goto("/inspecciones/nueva");
  await llenarFormulario(page, lab, "Registro sintético de smoke (con red)");
  await expect(page.getByText("Sincronizada")).toBeVisible({ timeout: 15_000 });
  await expect
    .poll(async () => (await registrosEnServidor(page, lab)).length)
    .toBe(1);
});

test("04 y 05 · sin red conserva el registro y al volver sincroniza una sola vez", async ({
  page,
}) => {
  const lab = `Laboratorio SMOKE OFFLINE ${Date.now()}`;
  await activarServiceWorker(page);
  await nav(page, "Nueva inspección").click();
  await expect(
    page.getByRole("heading", { name: "Nueva inspección" }),
  ).toBeVisible(); // la navegación terminó

  await irOffline(page);
  await llenarFormulario(page, lab, "Registro sintético de smoke (sin red)");
  await expect(page.getByText("Pendiente de enviar")).toBeVisible();
  expect(await registrosEnServidor(page, lab).catch(() => [])).toHaveLength(0); // aún no llegó

  // Sigue ahí después de navegar: está guardado en el dispositivo, no solo en pantalla.
  await nav(page, "Inspecciones").click();
  await expect(page.getByText(lab)).toBeVisible();

  await volverOnline(page);
  await expect(page.getByText("Sincronizada")).toBeVisible({ timeout: 15_000 });
  await expect
    .poll(async () => (await registrosEnServidor(page, lab)).length)
    .toBe(1);

  // Recargar y reintentar no duplica (idempotencia por clientId).
  await page.reload();
  await page.waitForTimeout(1000);
  expect(await registrosEnServidor(page, lab)).toHaveLength(1);
  const cola = await page.evaluate(
    (k) => JSON.parse(localStorage.getItem(k) ?? "[]").length,
    COLA,
  );
  expect(cola).toBeGreaterThanOrEqual(1);
});

test("06 · la versión publicada se puede identificar y coincide con la esperada", async ({
  page,
}) => {
  const salud = await page.request.get("/api/health");
  const { version, commit } = (await salud.json()) as {
    version: string;
    commit: string;
  };
  expect(version).toMatch(SEMVER);
  expect(
    commit === "desconocido" || SHA.test(commit),
    `commit inválido: ${commit}`,
  ).toBe(true);

  // La pantalla muestra lo mismo que la API (quien ve la app puede decir qué versión ve).
  await page.goto("/");
  await expect(page.getByTestId("app-version")).toHaveText(
    `Versión ${version}`,
  );
  if (commit !== "desconocido")
    await expect(page.getByTestId("app-commit")).toHaveText(
      `commit ${commit.slice(0, 7)}`,
    );

  const esperadoSha = process.env.SMOKE_EXPECTED_SHA?.trim().toLowerCase();
  if (esperadoSha)
    expect(commit, "el SHA publicado no es el que se quería publicar").toBe(
      esperadoSha,
    );
  const esperadaVersion = process.env.SMOKE_EXPECTED_VERSION?.trim();
  if (esperadaVersion) expect(version).toBe(esperadaVersion);
});

test("07 · el service worker se sirve sin caché larga (una versión mala sigue siendo recuperable)", async ({
  page,
}) => {
  const r = await page.request.get("/sw.js");
  expect(r.status()).toBe(200);
  expect(r.headers()["content-type"]).toMatch(/javascript/);
  const control = (r.headers()["cache-control"] ?? "").toLowerCase();
  expect(
    control,
    "sw.js no debe cachearse por tiempo: el navegador no vería la versión corregida",
  ).not.toMatch(/immutable|max-age=([1-9]\d*)/);
  expect(await r.text()).toMatch(/const CACHE_VERSION = "v\d+"/);
});
