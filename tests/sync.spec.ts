import assert from "node:assert/strict";
import { clearQueue, readQueue } from "../src/lib/storage/schema";
import { enqueueInspection, getPendingItems, syncQueue } from "../src/lib/sync/queue";
import { resolveConflict } from "../src/lib/sync/conflict-policy";

const samplePayload = {
  location: "Laboratorio de Redes",
  date: "2026-09-30",
  summary: "Switch dañado",
  inspector: "Técnico de prueba",
  findings: "Puerto 4 sin respuesta"
};

// 1. Encolar genera un clientId y queda en estado pending.
clearQueue();
const item = enqueueInspection(samplePayload);
assert.ok(item.clientId, "Debe generarse un clientId al encolar");
assert.equal(item.status, "pending", "Un registro nuevo debe quedar pending");
assert.equal(getPendingItems().length, 1, "Debe aparecer en los pendientes");

// 2. Sincronización exitosa: el item pasa a synced y ya no aparece como pendiente.
const resultadoExitoso = await syncQueue(async () => ({ ok: true }));
assert.equal(resultadoExitoso.synced, 1, "Debe reportar 1 registro sincronizado");
assert.equal(getPendingItems().length, 0, "Ya no debe haber pendientes tras sincronizar bien");

// 3. Idempotencia: el clientId no cambia entre reintentos.
clearQueue();
const item2 = enqueueInspection(samplePayload);
const clientIdOriginal = item2.clientId;

let intentos = 0;
await syncQueue(async (queued) => {
  intentos += 1;
  assert.equal(queued.clientId, clientIdOriginal, "El clientId debe mantenerse igual en cada intento");
  return { ok: false };
});
assert.equal(intentos, 1, "Debe haberse intentado sincronizar una vez");
const trasUnFallo = readQueue()[0];
assert.equal(trasUnFallo.status, "pending", "Con menos de 3 intentos, debe seguir pending para reintentar");
assert.equal(trasUnFallo.attempts, 1);

// 4. Tras MAX_ATTEMPTS fallos consecutivos, pasa a error y deja de reintentarse como pending.
await syncQueue(async () => ({ ok: false }));
await syncQueue(async () => ({ ok: false }));
const trasTresFallos = readQueue()[0];
assert.equal(trasTresFallos.status, "error", "Tras 3 intentos fallidos debe quedar en error");
assert.equal(trasTresFallos.attempts, 3);

// 5. Política de conflictos: gana el más reciente.
const base = enqueueInspection(samplePayload);
const remoteNewer = {
  clientId: base.clientId,
  updatedAt: new Date(Date.now() + 10000).toISOString(),
  payload: samplePayload
};
assert.equal(resolveConflict(base, remoteNewer), "remote", "El remoto más reciente debe ganar");

const remoteOlder = {
  clientId: base.clientId,
  updatedAt: new Date(Date.now() - 10000).toISOString(),
  payload: samplePayload
};
assert.equal(resolveConflict(base, remoteOlder), "local", "El local más reciente debe ganar");

const remoteSameTime = {
  clientId: base.clientId,
  updatedAt: base.updatedAt,
  payload: samplePayload
};
assert.equal(
  resolveConflict(base, remoteSameTime),
  "merge-not-needed",
  "Con timestamps iguales no hay conflicto real"
);

assert.throws(
  () => resolveConflict(base, { ...remoteNewer, clientId: "otro-id" }),
  "Debe rechazar comparar registros con clientId distinto"
);

console.log("sync.spec.ts: PASS");
