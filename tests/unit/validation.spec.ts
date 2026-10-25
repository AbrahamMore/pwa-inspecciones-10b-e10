import assert from "node:assert/strict";
import { validarItem, validarPayload } from "../../src/lib/sync/validation";

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

// --- Validación (la usan el formulario y la API) ---
assert.deepEqual(validarPayload(payload), []);
assert.ok(validarPayload({ ...payload, location: "  " }).length > 0, "laboratorio vacío debe rechazarse");
assert.ok(validarPayload({ ...payload, date: "19/10/2026" }).length > 0, "fecha con formato inválido debe rechazarse");
assert.ok(validarPayload({ ...payload, findings: "x".repeat(1001) }).length > 0, "texto demasiado largo debe rechazarse");
assert.ok(validarPayload({ ...payload, photo: "no-es-imagen" }).length > 0, "foto inválida debe rechazarse");
assert.ok(validarPayload({ ...payload, geo: { lat: 200, lon: 0, precisionM: 5 } }).length > 0, "ubicación fuera de rango");
assert.deepEqual(validarPayload({ ...payload, photo: "data:image/jpeg;base64,AAAA", geo: { lat: 18.4, lon: -97.4, precisionM: 20 } }), []);
assert.ok(validarItem({ ...item(), clientId: "x" }).length > 0, "clientId corto debe rechazarse");

// Redacción: el mensaje concuerda en número (fallo encontrado por la prueba E2E: "Los hallazgos es obligatorio").
assert.ok(validarPayload({ ...payload, findings: "" }).includes("Los hallazgos son obligatorios."));
assert.ok(validarPayload({ ...payload, location: "" }).includes("El laboratorio es obligatorio."));

console.log("validation.spec.ts: PASS");
