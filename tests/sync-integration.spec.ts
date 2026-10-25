import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { clearQueue, readQueue } from "../src/lib/storage/schema";
import { enqueueInspection, syncQueue } from "../src/lib/sync/queue";
import { crearSincronizador } from "../src/lib/sync/runner";
import { validarItem, validarPayload } from "../src/lib/sync/validation";
import { recibir, listar, type Recibida } from "../src/lib/server/inspections-store";
import { GET, POST } from "../src/app/api/inspecciones/route";

const payload = {
  location: "Laboratorio de Redes",
  date: "2026-10-19",
  inspector: "Técnica A",
  summary: "",
  findings: "Dos equipos sin conexión de red.",
};
const item = () => ({
  clientId: "11111111-2222-3333-4444-555555555555",
  payload,
  createdAt: "2026-10-19T10:00:00.000Z",
  updatedAt: "2026-10-19T10:00:00.000Z",
});
const post = (body: unknown) =>
  POST(new Request("http://localhost/api/inspecciones", { method: "POST", body: typeof body === "string" ? body : JSON.stringify(body) }));

// --- Validación (la usan el formulario y la API) ---
assert.deepEqual(validarPayload(payload), []);
assert.ok(validarPayload({ ...payload, location: "  " }).length > 0, "laboratorio vacío debe rechazarse");
assert.ok(validarPayload({ ...payload, date: "19/10/2026" }).length > 0, "fecha con formato inválido debe rechazarse");
assert.ok(validarPayload({ ...payload, findings: "x".repeat(1001) }).length > 0, "texto demasiado largo debe rechazarse");
assert.ok(validarPayload({ ...payload, photo: "no-es-imagen" }).length > 0, "foto inválida debe rechazarse");
assert.ok(validarPayload({ ...payload, geo: { lat: 200, lon: 0, precisionM: 5 } }).length > 0, "ubicación fuera de rango");
assert.deepEqual(validarPayload({ ...payload, photo: "data:image/jpeg;base64,AAAA", geo: { lat: 18.4, lon: -97.4, precisionM: 20 } }), []);
assert.ok(validarItem({ ...item(), clientId: "x" }).length > 0, "clientId corto debe rechazarse");

// --- Servidor: idempotencia por clientId (el reenvío NO duplica) ---
const db = new Map<string, Recibida>();
assert.equal(recibir(item(), db), "created");
assert.equal(recibir(item(), db), "duplicate");
assert.equal(recibir(item(), db), "duplicate");
assert.equal(db.size, 1, "tres envíos del mismo clientId deben dejar un solo registro");
assert.equal(recibir({ ...item(), updatedAt: "2026-10-19T12:00:00.000Z", payload: { ...payload, findings: "Corregido" } }, db), "updated");
assert.equal(db.get(item().clientId)!.payload.findings, "Corregido", "last-write-wins: gana el más reciente");
assert.equal(recibir({ ...item(), updatedAt: "2026-10-19T09:00:00.000Z" }, db), "duplicate", "un reenvío más viejo no sobrescribe");

// --- API real (route handler) ---
assert.equal((await post("{no es json")).status, 400);
assert.equal((await post({ ...item(), payload: { ...payload, location: "" } })).status, 422);
assert.equal((await post(item())).status, 201);
assert.equal((await post(item())).status, 200, "el reenvío responde 200 y no crea otro registro");
const lista = (await (await GET()).json()) as { items: unknown[] };
assert.equal(lista.items.length, 1);
assert.equal(listar().length, 1);

// --- Integración cola → API: offline, reconexión y respuesta perdida ---
clearQueue();
const creado = enqueueInspection({ ...payload, findings: "Prueba de integración" });
let red = false;
const enviar = async (q: typeof creado) => {
  if (!red) throw new TypeError("sin red");
  const r = await post({ clientId: q.clientId, payload: q.payload, createdAt: q.createdAt, updatedAt: q.updatedAt });
  return { ok: r.ok };
};
await syncQueue(enviar);
assert.equal(readQueue()[0].status, "pending", "sin red el registro queda pendiente, no se pierde");
red = true;
const antes = listar().length;
const r = await syncQueue(enviar);
assert.equal(r.synced, 1);
assert.equal(readQueue()[0].status, "synced");
assert.equal(listar().length, antes + 1, "al volver la red se crea exactamente un registro");

// Respuesta perdida: el servidor guarda, pero el cliente no se entera y reintenta.
clearQueue();
const dudoso = enqueueInspection({ ...payload, findings: "Respuesta perdida" });
let primera = true;
const antes2 = listar().length;
await syncQueue(async (q) => {
  await enviar(q);
  if (primera) {
    primera = false;
    throw new TypeError("se cayó la conexión antes de recibir la respuesta");
  }
  return { ok: true };
});
assert.equal(readQueue()[0].status, "pending");
await syncQueue(enviar);
assert.equal(readQueue()[0].status, "synced");
assert.equal(listar().length, antes2 + 1, "el reintento NO duplica el registro en el servidor");
assert.equal(readQueue()[0].clientId, dudoso.clientId, "el clientId no cambia entre intentos");

// --- Sincronizador: sin red no intenta; solo una sincronización a la vez ---
let llamadas = 0;
let liberar: () => void = () => {};
const sinRed = crearSincronizador({ isOnline: () => false, sync: async () => { llamadas++; return { synced: 0, failed: 0 }; } });
assert.deepEqual(await sinRed(), { status: "offline" });
assert.equal(llamadas, 0, "sin red no debe llamar a la sincronización");
const lento = crearSincronizador({
  isOnline: () => true,
  sync: () => new Promise((res) => { llamadas++; liberar = () => res({ synced: 1, failed: 0 }); }),
});
const p1 = lento();
assert.deepEqual(await lento(), { status: "busy" }, "una segunda llamada simultánea no debe duplicar el envío");
liberar();
assert.deepEqual(await p1, { status: "done", synced: 1, failed: 0 });
assert.equal(llamadas, 1);

// --- El formulario debe poder abrirse sin red ---
const sw = await readFile(resolve(import.meta.dirname, "..", "public/sw.js"), "utf8");
assert.match(sw, /"\/inspecciones\/nueva"/, "el service worker debe precachear la pantalla del formulario");

console.log("sync-integration.spec.ts: PASS");