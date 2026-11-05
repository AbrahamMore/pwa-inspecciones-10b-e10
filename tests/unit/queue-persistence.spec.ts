// El registro capturado sin conexión debe quedar ESCRITO en el almacenamiento del navegador, no solo en memoria.
// Hallazgo de la Semana 10: al inyectar un fallo que omitía writeQueue() en enqueueInspection(), las pruebas
// unitarias seguían pasando (en Node no hay localStorage y la cola vive en una variable que se comparte por
// referencia) y solo el smoke test lo detectó. Esta prueba usa un localStorage simulado para cerrar ese hueco.
import assert from "node:assert/strict";
import { enqueueInspection, syncQueue } from "../../src/lib/sync/queue";
import { readQueue, type QueuedInspection } from "../../src/lib/storage/schema";

const CLAVE = "inspecciones-sync-queue-v1";
const datos = new Map<string, string>();
(globalThis as unknown as { localStorage: Storage }).localStorage = {
  getItem: (k: string) => datos.get(k) ?? null,
  setItem: (k: string, v: string) => void datos.set(k, String(v)),
  removeItem: (k: string) => void datos.delete(k),
  clear: () => datos.clear(),
  key: (i: number) => [...datos.keys()][i] ?? null,
  get length() {
    return datos.size;
  },
} as Storage;

const payload = {
  location: "Laboratorio de Redes",
  date: "2026-11-04",
  summary: "Registro sintético",
  inspector: "Técnica de prueba",
  findings: "Sin novedades",
};

// 1) Encolar escribe en el almacenamiento (lo que sobrevive a cerrar y reabrir la app).
const item = enqueueInspection(payload);
const guardado = JSON.parse(datos.get(CLAVE) ?? "[]") as QueuedInspection[];
assert.equal(
  guardado.length,
  1,
  "el registro debe estar guardado en localStorage",
);
assert.equal(guardado[0].clientId, item.clientId);
assert.equal(guardado[0].status, "pending");

// 2) "Reabrir la app": se lee de nuevo desde el almacenamiento y el registro sigue ahí con el mismo clientId.
assert.equal(readQueue()[0].clientId, item.clientId);

// 3) Sincronizar actualiza el estado guardado y reenviar no duplica ni cambia el clientId.
const enviados: string[] = [];
await syncQueue(async (i) => (enviados.push(i.clientId), { ok: true }));
await syncQueue(async (i) => (enviados.push(i.clientId), { ok: true }));
assert.deepEqual(
  enviados,
  [item.clientId],
  "un registro ya sincronizado no se vuelve a enviar",
);
const despues = JSON.parse(datos.get(CLAVE) ?? "[]") as QueuedInspection[];
assert.equal(despues.length, 1);
assert.equal(despues[0].status, "synced");

console.log("queue-persistence.spec.ts: OK");
