import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolveConflict } from "../../src/lib/sync/conflict-policy";
import { recibir, listar, type Recibida } from "../../src/lib/server/inspections-store";
import { POST } from "../../src/app/api/inspecciones/route";
import { cabecerasActorDemo } from "../../src/lib/security/actor";

const payload = { location: "Laboratorio de Cómputo", date: "2026-10-24", inspector: "Ana", summary: "", findings: "Original" };
const id = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee";
const v = (updatedAt: string, findings = "Original") => ({
  clientId: id,
  payload: { ...payload, findings },
  createdAt: "2026-10-24T10:00:00.000Z",
  updatedAt,
});
const post = (body: unknown) =>
  POST(new Request("http://localhost/api/inspecciones", { method: "POST", headers: cabecerasActorDemo(), body: JSON.stringify(body) }));

// 1) La política decide por updatedAt y solo necesita clientId + updatedAt.
assert.equal(resolveConflict({ clientId: id, updatedAt: "2026-10-24T12:00:00Z" }, { clientId: id, updatedAt: "2026-10-24T10:00:00Z" }), "local");
assert.equal(resolveConflict({ clientId: id, updatedAt: "2026-10-24T09:00:00Z" }, { clientId: id, updatedAt: "2026-10-24T10:00:00Z" }), "remote");
assert.equal(resolveConflict({ clientId: id, updatedAt: "2026-10-24T10:00:00Z" }, { clientId: id, updatedAt: "2026-10-24T10:00:00Z" }), "merge-not-needed");
assert.throws(() => resolveConflict({ clientId: "a", updatedAt: "2026-10-24T10:00:00Z" }, { clientId: "b", updatedAt: "2026-10-24T10:00:00Z" }));

// 2) El servidor usa esa misma política (una sola fuente de verdad).
const db = new Map<string, Recibida>();
assert.equal(recibir(v("2026-10-24T10:00:00.000Z"), db), "created");
assert.equal(recibir(v("2026-10-24T10:00:00.000Z"), db), "duplicate", "misma versión: no duplica");
assert.equal(recibir(v("2026-10-24T09:00:00.000Z", "Vieja"), db), "duplicate", "versión más vieja: no sobrescribe");
assert.equal(db.get(id)!.payload.findings, "Original");
assert.equal(recibir(v("2026-10-24T11:00:00.000Z", "Corregida"), db), "updated", "versión más nueva: gana");
assert.equal(db.get(id)!.payload.findings, "Corregida");
assert.equal(db.size, 1);
const store = readFileSync("src/lib/server/inspections-store.ts", "utf8");
assert.ok(store.includes("resolveConflict("), "el servidor debe usar resolveConflict");

// 3) Envíos simultáneos del mismo registro (dos pestañas sincronizando a la vez) → un solo registro.
const antes = listar().length;
const respuestas = await Promise.all(Array.from({ length: 6 }, () => post(v("2026-10-24T10:00:00.000Z"))));
assert.equal(respuestas.filter((r) => r.status === 201).length, 1, "solo uno crea");
assert.equal(respuestas.filter((r) => r.status === 200).length, 5, "los demás se reconocen como reenvío");
assert.equal(listar().length, antes + 1);

// 4) Un reenvío tardío con datos viejos no pisa la versión nueva (por la API).
await post(v("2026-10-24T11:00:00.000Z", "Nueva"));
await post(v("2026-10-24T09:00:00.000Z", "Atrasada"));
assert.equal(listar().find((x) => x.clientId === id)!.payload.findings, "Nueva");

console.log("conflict-integration.spec.ts: PASS");
