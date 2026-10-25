import assert from "node:assert/strict";
import { recibir, type Recibida } from "../../src/lib/server/inspections-store";

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

// --- Servidor: idempotencia por clientId (el reenvío NO duplica) ---
const db = new Map<string, Recibida>();
assert.equal(recibir(item(), db), "created");
assert.equal(recibir(item(), db), "duplicate");
assert.equal(recibir(item(), db), "duplicate");
assert.equal(db.size, 1, "tres envíos del mismo clientId deben dejar un solo registro");
assert.equal(recibir({ ...item(), updatedAt: "2026-10-19T12:00:00.000Z", payload: { ...payload, findings: "Corregido" } }, db), "updated");
assert.equal(db.get(item().clientId)!.payload.findings, "Corregido", "last-write-wins: gana el más reciente");
assert.equal(recibir({ ...item(), updatedAt: "2026-10-19T09:00:00.000Z" }, db), "duplicate", "un reenvío más viejo no sobrescribe");

console.log("inspections-store.spec.ts: PASS");
