import assert from "node:assert/strict";

// localStorage falso para controlar exactamente lo que "hay guardado" en el navegador.
const KEY = "inspecciones-sync-queue-v1";
let guardado: string | null = null;
(globalThis as Record<string, unknown>).localStorage = {
  getItem: (k: string) => (k === KEY ? guardado : null),
  setItem: (k: string, v: string) => {
    if (k === KEY) guardado = v;
  },
  removeItem: () => {},
};

const { readQueue, writeQueue, clearQueue } = await import("../../src/lib/storage/schema");

const item = {
  clientId: "11111111-2222-3333-4444-555555555555",
  payload: { location: "Lab", date: "2026-10-25", summary: "", inspector: "A", findings: "ok" },
  createdAt: "2026-10-25T10:00:00.000Z",
  updatedAt: "2026-10-25T10:00:00.000Z",
  status: "pending" as const,
  attempts: 0,
};

// 1) Sin nada guardado, la cola está vacía.
assert.deepEqual(readQueue(), []);

// 2) Lo que se escribe se lee igual (ida y vuelta).
writeQueue([item]);
assert.deepEqual(readQueue(), [item]);
assert.ok(guardado?.includes(item.clientId), "debe guardarse en la clave esperada");

// 3) Datos dañados en el almacenamiento NO deben romper la app: la cola se lee como vacía.
guardado = "{esto no es json";
assert.doesNotThrow(() => readQueue(), "un JSON dañado no debe lanzar una excepción");
assert.deepEqual(readQueue(), []);

// 4) Datos con forma inesperada (no es un arreglo) tampoco deben romper la app.
guardado = JSON.stringify({ hola: "mundo" });
assert.deepEqual(readQueue(), []);

// 5) Tras un dato dañado, la app se recupera al volver a escribir.
writeQueue([item]);
assert.deepEqual(readQueue(), [item]);

// 6) clearQueue deja la cola vacía.
clearQueue();
assert.deepEqual(readQueue(), []);

console.log("storage-schema.spec.ts: PASS");
