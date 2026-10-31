import assert from "node:assert/strict";
import { readFile, access } from "node:fs/promises";
import { resolve } from "node:path";
import vm from "node:vm";

const root = resolve(import.meta.dirname, "..", "..");

// 1) Cada ícono declarado en el manifest existe y es un PNG del tamaño declarado.
const manifest = JSON.parse(await readFile(resolve(root, "public/manifest.webmanifest"), "utf8"));
for (const icon of manifest.icons as { src: string; sizes: string }[]) {
  const buf = await readFile(resolve(root, "public", icon.src.replace(/^\//, "")));
  assert.equal(buf.subarray(1, 4).toString(), "PNG", `${icon.src} debe ser un PNG válido`);
  const [w, h] = icon.sizes.split("x").map(Number);
  assert.equal(buf.readUInt32BE(16), w, `${icon.src}: ancho distinto al declarado`);
  assert.equal(buf.readUInt32BE(20), h, `${icon.src}: alto distinto al declarado`);
}

// 2) Cada ruta tiene sus estados de carga/error/no encontrado.
for (const f of [
  "src/app/inspecciones/[id]/loading.tsx",
  "src/app/inspecciones/[id]/error.tsx",
  "src/app/inspecciones/[id]/not-found.tsx",
  "src/app/inspecciones/error.tsx",
]) {
  await assert.doesNotReject(access(resolve(root, f)), `Falta ${f}`);
}

// 3) Comportamiento real del service worker: se ejecuta sw.js con un entorno simulado.
const swCode = await readFile(resolve(root, "public/sw.js"), "utf8");
type Handler = (e: Record<string, unknown>) => void;
const handlers: Record<string, Handler> = {};
const stores = new Map<string, Map<string, unknown>>();
let online = true;
const key = (r: unknown) => (typeof r === "string" ? r : (r as { url: string }).url);
const fakeResponse = (body: string, ok = true) => ({ ok, body, clone() { return fakeResponse(body, ok); }, text: async () => body });
const origin = "http://localhost:3000";

const caches = {
  open: async (name: string) => {
    if (!stores.has(name)) stores.set(name, new Map());
    const s = stores.get(name)!;
    return {
      addAll: async (urls: string[]) => {
        for (const u of urls) {
          // La página de "nueva inspección" referencia un archivo de build, como hace el HTML real de Next.
          const html = u === "/inspecciones/nueva" ? '<script src="/_next/static/chunks/app/inspecciones/nueva/page-abc123.js" async></script>' : "";
          s.set(origin + u, fakeResponse("precache:" + u + html));
        }
      },
      add: async (u: string) => { s.set(key(u).startsWith("http") ? key(u) : origin + key(u), fakeResponse("build:" + u)); },
      match: async (r: unknown) => s.get(key(r).startsWith("http") ? key(r) : origin + key(r)),
      put: async (r: unknown, res: unknown) => { s.set(key(r), res); },
    };
  },
  match: async (r: unknown) => {
    const k = key(r).startsWith("http") ? key(r) : origin + key(r);
    for (const s of stores.values()) if (s.has(k)) return s.get(k);
    return undefined;
  },
  keys: async () => [...stores.keys()],
  delete: async (n: string) => stores.delete(n),
};
const sandbox = {
  self: { addEventListener: (t: string, h: Handler) => { handlers[t] = h; }, location: { origin }, skipWaiting: () => {} },
  caches,
  URL,
  fetch: async (r: unknown) => {
    if (!online) throw new TypeError("offline");
    return fakeResponse("red:" + key(r));
  },
};
vm.runInNewContext(swCode, sandbox);

async function dispatch(type: string, extra: Record<string, unknown> = {}) {
  let result: unknown;
  let pending: Promise<unknown> = Promise.resolve();
  handlers[type]({ ...extra, waitUntil: (p: Promise<unknown>) => { pending = p; }, respondWith: (p: Promise<unknown>) => { result = p; } });
  await pending;
  return result ? await result : undefined;
}
const nav = (path: string) => ({ request: { url: origin + path, method: "GET", mode: "navigate" } });

await dispatch("install");
const cacheName = [...stores.keys()][0];
assert.ok(stores.get(cacheName)!.has(origin + "/inspecciones"), "el listado debe quedar precacheado al instalar");
assert.ok(stores.get(cacheName)!.has(origin + "/icons/icon-192.png"), "los íconos deben quedar precacheados");
assert.ok(
  stores.get(cacheName)!.has(origin + "/_next/static/chunks/app/inspecciones/nueva/page-abc123.js"),
  "los archivos de build que referencian las páginas precacheadas también deben guardarse (si no, sin red la página no se hidrata)",
);

// Con red: responde de la red y guarda la copia de la página visitada.
const r1 = (await dispatch("fetch", nav("/inspecciones/1"))) as { body: string };
assert.equal(r1.body, "red:" + origin + "/inspecciones/1");
await new Promise((r) => setTimeout(r, 0));

// Sin red: la página ya visitada se sirve desde caché; una nunca visitada cae al fallback offline.
online = false;
const r2 = (await dispatch("fetch", nav("/inspecciones/1"))) as { body: string };
assert.equal(r2.body, "red:" + origin + "/inspecciones/1", "página visitada debe abrir sin red");
const r3 = (await dispatch("fetch", nav("/inspecciones/999"))) as { body: string };
assert.equal(r3.body, "precache:/offline.html", "página no visitada debe mostrar offline.html");

// Escrituras y API no se interceptan (la sincronización siempre va a la red).
for (const req of [
  { url: origin + "/api/inspecciones", method: "POST", mode: "cors" },
  { url: origin + "/api/inspecciones", method: "GET", mode: "cors" },
]) {
  let intercepted = false;
  handlers["fetch"]({ request: req, respondWith: () => { intercepted = true; } });
  assert.equal(intercepted, false, `no debe interceptar ${req.method} ${req.url}`);
}

console.log("pwa-integration.spec.ts: PASS");