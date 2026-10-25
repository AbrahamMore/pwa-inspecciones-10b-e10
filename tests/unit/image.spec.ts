import assert from "node:assert/strict";
import { calcularTamano, comprimirACanvas, CALIDADES, type CanvasLike } from "../../src/lib/device/image";
import { validarPayload, LIMITES } from "../../src/lib/sync/validation";

// 1) Redimensionado: nunca agranda y conserva la proporción.
assert.deepEqual(calcularTamano(4000, 3000), { w: 800, h: 600 });
assert.deepEqual(calcularTamano(600, 400), { w: 600, h: 400 });
assert.deepEqual(calcularTamano(1000, 2000), { w: 400, h: 800 });

// 2) Compresión: baja la calidad hasta cumplir el límite; si nunca cabe, devuelve error (sin lanzar).
function falsoCanvas(tamanos: number[]): () => CanvasLike {
  return () => {
    let i = 0;
    const c: CanvasLike = {
      width: 0,
      height: 0,
      getContext: () => ({ drawImage() {} }),
      toDataURL: () => "data:image/jpeg;base64," + "A".repeat(tamanos[Math.min(i++, tamanos.length - 1)]),
    };
    return c;
  };
}
const ok = comprimirACanvas({}, 4000, 3000, falsoCanvas([700_000, 400_000]), 600_000);
assert.equal(ok.status, "ok");
assert.ok(CALIDADES.length >= 3);
const grande = comprimirACanvas({}, 4000, 3000, falsoCanvas([900_000]), 600_000);
assert.equal(grande.status, "error");
assert.equal(comprimirACanvas({}, 0, 0, falsoCanvas([10])).status, "error");
const sinCtx = comprimirACanvas({}, 10, 10, () => ({ width: 0, height: 0, getContext: () => null, toDataURL: () => "" }));
assert.equal(sinCtx.status, "unsupported");

// 3) La validación (cliente y API) acepta foto y ubicación y rechaza datos malos.
const base = { location: "Lab 1", date: "2026-10-24", inspector: "Ana", summary: "", findings: "ok" };
assert.deepEqual(validarPayload({ ...base, photo: "data:image/jpeg;base64,AAAA", geo: { lat: 18.46, lon: -97.39, precisionM: 30 } }), []);
assert.ok(validarPayload({ ...base, photo: "http://x/y.png" }).length > 0);
assert.ok(validarPayload({ ...base, photo: "data:image/jpeg;base64," + "A".repeat(LIMITES.photo) }).length > 0);
assert.ok(validarPayload({ ...base, geo: { lat: 999, lon: 0, precisionM: 1 } }).length > 0);

console.log("image.spec.ts: PASS");
