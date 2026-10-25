import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { clearQueue, readQueue } from "../../src/lib/storage/schema";
import { enqueueInspection, syncQueue } from "../../src/lib/sync/queue";
import { listar } from "../../src/lib/server/inspections-store";
import { GET, POST } from "../../src/app/api/inspecciones/route";

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

// --- El formulario debe poder abrirse sin red ---
const sw = await readFile(resolve(import.meta.dirname, "..", "..", "public/sw.js"), "utf8");
assert.match(sw, /"\/inspecciones\/nueva"/, "el service worker debe precachear la pantalla del formulario");

console.log("sync-integration.spec.ts: PASS");