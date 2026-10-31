import { expect, test, type Page } from "@playwright/test";
import { cabecerasActorDemo } from "../../src/lib/security/actor";

/**
 * E2E de seguridad (Semana 9) contra la build de producción:
 *  - la CSP con nonce llega en las respuestas y NO rompe la app (ni siquiera offline desde caché);
 *  - la API rechaza lo que no debe;
 *  - el usuario puede borrar los datos locales.
 * Todos los datos son sintéticos.
 */

const COLA = "inspecciones-sync-queue-v1";

/** Registra violaciones de CSP del navegador para comprobar que la política no bloquea nada legítimo. */
async function vigilarCsp(page: Page) {
  const consola: string[] = [];
  page.on("console", (m) => {
    if (/Content Security Policy|Refused to/i.test(m.text())) consola.push(m.text());
  });
  await page.addInitScript(() => {
    (window as unknown as { __csp: string[] }).__csp = [];
    document.addEventListener("securitypolicyviolation", (e) =>
      (window as unknown as { __csp: string[] }).__csp.push(`${e.violatedDirective} ${e.blockedURI}`),
    );
  });
  return async () => {
    const eventos = await page.evaluate(() => (window as unknown as { __csp?: string[] }).__csp ?? []);
    return [...consola, ...eventos];
  };
}

test("las respuestas llevan CSP con nonce y cabeceras de seguridad", async ({ page }) => {
  const respuesta = await page.goto("/");
  const h = respuesta!.headers();
  const csp = h["content-security-policy"];
  expect(csp).toMatch(/script-src 'self' 'nonce-[^']+'(;|$)/);
  expect(csp).not.toMatch(/script-src[^;]*unsafe-inline/);
  expect(csp).toContain("object-src 'none'");
  expect(csp).toContain("frame-ancestors 'none'");
  expect(h["x-content-type-options"]).toBe("nosniff");
  expect(h["referrer-policy"]).toBe("strict-origin-when-cross-origin");

  // El nonce cambia en cada respuesta.
  const otra = await page.goto("/inspecciones");
  expect(otra!.headers()["content-security-policy"]).not.toBe(csp);
});

test("un script o manejador en línea inyectado se bloquea (la CSP funciona en el navegador real)", async ({ page }) => {
  await page.goto("/");
  const resultado = await page.evaluate(
    () =>
      new Promise<{ ejecutado: boolean; violacion: string }>((resolve) => {
        let violacion = "";
        document.addEventListener("securitypolicyviolation", (e) => (violacion = e.violatedDirective));
        const s = document.createElement("script");
        s.textContent = "window.__inyectado = true";
        document.body.appendChild(s);
        // Carga típica de XSS: un manejador de evento en línea dentro de HTML inyectado.
        const caja = document.createElement("div");
        caja.innerHTML = '<img src="x" onerror="window.__inyectado = true">';
        document.body.appendChild(caja);
        setTimeout(() => resolve({ ejecutado: (window as unknown as { __inyectado?: boolean }).__inyectado === true, violacion }), 400);
      }),
  );
  expect(resultado.ejecutado, "el script en línea no debe ejecutarse").toBe(false);
  expect(resultado.violacion).toMatch(/^script-src/);
});

test("la CSP no bloquea nada al recorrer, capturar y sincronizar", async ({ page }) => {
  const violaciones = await vigilarCsp(page);
  const lab = `Laboratorio Seguridad ${Date.now()}`;
  await page.goto("/");
  await page.getByRole("link", { name: "Ver inspecciones" }).click();
  await page.getByRole("link", { name: "+ Nueva inspección" }).click();
  await page.getByLabel("Laboratorio").fill(lab);
  await page.getByLabel("Responsable").fill("Técnica E2E");
  await page.getByLabel("Hallazgos").fill("<b>Urgente</b> se muestra como texto, no como HTML");
  await page.getByRole("button", { name: "Guardar inspección" }).click();
  await expect(page.getByText("Sincronizada")).toBeVisible({ timeout: 15_000 });

  // El HTML escrito por el usuario se muestra literal (React escapa): no hay negritas.
  await page.getByRole("navigation", { name: "Principal" }).getByRole("link", { name: "Inspecciones", exact: true }).click();
  await expect(page.getByText("<b>Urgente</b> se muestra como texto, no como HTML")).toBeVisible();
  await expect(page.locator("b", { hasText: "Urgente" })).toHaveCount(0);

  expect(await violaciones()).toEqual([]);
});

test("la CSP tampoco bloquea la app cuando abre sin conexión desde caché", async ({ page }) => {
  const violaciones = await vigilarCsp(page);
  await page.goto("/");
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload(); // ahora la controla el service worker
  await page.goto("/inspecciones/nueva");
  await page.context().setOffline(true);
  await page.evaluate(() => window.dispatchEvent(new Event("offline")));
  await page.reload();
  await expect(page.getByRole("heading", { name: "Nueva inspección" })).toBeVisible();
  // Si la página cacheada se hubiera servido sin su CSP/nonce, la hidratación fallaría y el aviso no aparecería.
  await expect(page.getByText("Sin conexión").first()).toBeVisible();
  expect(await violaciones()).toEqual([]);
  await page.context().setOffline(false);
});

test("la API rechaza sin identidad y no entrega registros ajenos", async ({ page }) => {
  await page.goto("/");
  expect((await page.request.get("/api/inspecciones")).status()).toBe(401);
  expect((await page.request.post("/api/inspecciones", { data: {} })).status()).toBe(401);

  const id = `e2e-seg-${Date.now()}`.padEnd(12, "0");
  const dueno = cabecerasActorDemo();
  const otro = { "x-demo-actor": "inspector-otro", "x-demo-rol": "inspector" };
  const cuerpo = {
    clientId: id,
    createdAt: "2026-10-30T10:00:00.000Z",
    updatedAt: "2026-10-30T10:00:00.000Z",
    payload: { location: "Laboratorio de Redes", date: "2026-10-30", inspector: "Técnica", summary: "", findings: "Registro de seguridad" },
  };
  expect((await page.request.post("/api/inspecciones", { headers: dueno, data: cuerpo })).status()).toBe(201);
  expect((await page.request.get(`/api/inspecciones/${id}`, { headers: dueno })).status()).toBe(200);
  expect((await page.request.get(`/api/inspecciones/${id}`, { headers: otro })).status()).toBe(404);
  const listaOtro = (await (await page.request.get("/api/inspecciones", { headers: otro })).json()) as { items: { clientId: string }[] };
  expect(listaOtro.items.some((i) => i.clientId === id)).toBe(false);
});

test("el usuario puede borrar los datos guardados en el dispositivo", async ({ page }) => {
  const lab = `Laboratorio Borrado ${Date.now()}`;
  await page.goto("/inspecciones/nueva");
  await page.getByLabel("Laboratorio").fill(lab);
  await page.getByLabel("Responsable").fill("Técnica E2E");
  await page.getByLabel("Hallazgos").fill("Dato local que se va a borrar");
  await page.getByRole("button", { name: "Guardar inspección" }).click();
  await expect(page.getByText("Sincronizada")).toBeVisible({ timeout: 15_000 });
  expect(await page.evaluate((k) => JSON.parse(localStorage.getItem(k) ?? "[]").length, COLA)).toBeGreaterThanOrEqual(1);

  await page.getByRole("navigation", { name: "Principal" }).getByRole("link", { name: "Inspecciones", exact: true }).click();
  page.once("dialog", (d) => d.accept());
  await page.getByRole("button", { name: "Borrar datos de este dispositivo" }).click();

  await expect(page.getByText("Aún no has registrado inspecciones")).toBeVisible();
  expect(await page.evaluate((k) => JSON.parse(localStorage.getItem(k) ?? "[]").length, COLA)).toBe(0);
});
