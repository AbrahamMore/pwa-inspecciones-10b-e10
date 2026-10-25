import assert from "node:assert/strict";
import { crearSincronizador } from "../../src/lib/sync/runner";

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

console.log("runner.spec.ts: PASS");
