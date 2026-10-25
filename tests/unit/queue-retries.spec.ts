import assert from "node:assert/strict";
import { clearQueue, readQueue } from "../../src/lib/storage/schema";
import { enqueueInspection, getPendingItems, syncQueue } from "../../src/lib/sync/queue";

const payload = (n: number) => ({
  location: `Laboratorio de prueba ${n}`,
  date: "2026-10-25",
  summary: "",
  inspector: "Técnica D",
  findings: `Hallazgo sintético ${n}`,
});

// 1) Cada registro recibe un clientId distinto (base de la idempotencia).
clearQueue();
for (let i = 0; i < 50; i++) enqueueInspection(payload(i));
assert.equal(new Set(readQueue().map((q) => q.clientId)).size, 50, "50 registros deben tener 50 clientId distintos");

// 2) Un fallo por excepción cuenta como intento fallido y conserva el mensaje del error.
clearQueue();
enqueueInspection(payload(1));
const r1 = await syncQueue(async () => {
  throw new Error("sin red");
});
assert.deepEqual(r1, { synced: 0, failed: 1 });
const tras1 = readQueue()[0];
assert.equal(tras1.status, "pending", "con menos de 3 intentos vuelve a pending");
assert.equal(tras1.attempts, 1);
assert.equal(tras1.lastError, "sin red");

// 3) Al tercer fallo pasa a error, pero SIGUE apareciendo en getPendingItems (para poder revisarlo).
await syncQueue(async () => ({ ok: false }));
await syncQueue(async () => ({ ok: false }));
assert.equal(readQueue()[0].status, "error");
assert.equal(getPendingItems().length, 1, "un registro en error sigue visible como pendiente de revisión");

// 4) Comportamiento real documentado: un registro en error SÍ se vuelve a intentar en la siguiente sincronización.
const r4 = await syncQueue(async () => ({ ok: true }));
assert.equal(r4.synced, 1);
assert.equal(readQueue()[0].status, "synced");
assert.equal(readQueue()[0].attempts, 4, "los intentos siguen contando: 3 fallidos + 1 exitoso");
assert.equal(getPendingItems().length, 0);

// 5) Un registro ya sincronizado NO se vuelve a enviar.
let llamadas = 0;
await syncQueue(async () => {
  llamadas++;
  return { ok: true };
});
assert.equal(llamadas, 0, "los registros synced se omiten");

// 6) Con varios registros, un fallo no impide enviar los demás.
clearQueue();
const a = enqueueInspection(payload(10));
const b = enqueueInspection(payload(11));
const r6 = await syncQueue(async (q) => ({ ok: q.clientId !== a.clientId }));
assert.deepEqual(r6, { synced: 1, failed: 1 });
const estados = Object.fromEntries(readQueue().map((q) => [q.clientId, q.status]));
assert.equal(estados[a.clientId], "pending");
assert.equal(estados[b.clientId], "synced");

console.log("queue-retries.spec.ts: PASS");
