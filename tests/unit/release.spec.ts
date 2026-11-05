// Pruebas de la identidad de la release: versión SemVer + SHA, y la ruta /api/health que la publica.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { GET } from "../../src/app/api/health/route";
import {
  COMMIT_DESCONOCIDO,
  normalizarCommit,
  normalizarVersion,
  obtenerInfoVersion,
} from "../../src/lib/release";

const SHA = "1dec1fbcb17ee3fef827e7a7516061de3e6f3e4d";

// 1) Solo se acepta un SHA completo; todo lo demás se descarta (nunca se muestra texto arbitrario en pantalla).
assert.equal(normalizarCommit(SHA), SHA);
assert.equal(
  normalizarCommit(`  ${SHA.toUpperCase()}\n`),
  SHA,
  "se normaliza a minúsculas y sin espacios",
);
for (const malo of [
  "",
  "1dec1fb",
  SHA.slice(0, 39),
  SHA + "0",
  "<script>alert(1)</script>",
  "g".repeat(40),
  null,
  undefined,
]) {
  assert.equal(
    normalizarCommit(malo as string | null | undefined),
    COMMIT_DESCONOCIDO,
    `debe descartar ${String(malo)}`,
  );
}

// 2) Versión SemVer válida o "0.0.0" (así una versión mal escrita salta a la vista en el smoke test).
assert.equal(normalizarVersion("1.0.0"), "1.0.0");
assert.equal(normalizarVersion("1.2.3-rc.1"), "1.2.3-rc.1");
for (const mala of ["", "1.0", "v1.0.0", "1.0.0; rm -rf /", undefined, null]) {
  assert.equal(
    normalizarVersion(mala as string | null | undefined),
    "0.0.0",
    `debe descartar ${String(mala)}`,
  );
}

// 3) La información combinada incluye el SHA corto solo para mostrar.
assert.deepEqual(obtenerInfoVersion({ version: "1.0.0", commit: SHA }), {
  version: "1.0.0",
  commit: SHA,
  commitCorto: "1dec1fb",
});
assert.deepEqual(obtenerInfoVersion({}), {
  version: "0.0.0",
  commit: COMMIT_DESCONOCIDO,
  commitCorto: COMMIT_DESCONOCIDO,
});

// 4) /api/health: 200, estado ok, identidad de la versión y sin caché.
const respuesta = GET();
assert.equal(respuesta.status, 200);
assert.equal(respuesta.headers.get("cache-control"), "no-store");
const cuerpo = (await respuesta.json()) as {
  status: string;
  version: string;
  commit: string;
};
assert.equal(cuerpo.status, "ok");
assert.match(cuerpo.version, /^\d+\.\d+\.\d+/);
assert.ok(
  cuerpo.commit === COMMIT_DESCONOCIDO || /^[0-9a-f]{40}$/.test(cuerpo.commit),
);
assert.deepEqual(
  Object.keys(cuerpo).sort(),
  ["commit", "status", "version"],
  "no debe exponer nada más",
);

// 5) La versión de package.json y la del lockfile no pueden separarse (npm ci fallaría o describiría otra release).
const paquete = JSON.parse(readFileSync("package.json", "utf8"));
const lock = JSON.parse(readFileSync("package-lock.json", "utf8"));
assert.equal(
  lock.version,
  paquete.version,
  "package-lock.json (version) no coincide con package.json",
);
assert.equal(
  lock.packages[""].version,
  paquete.version,
  "package-lock.json (raíz) no coincide con package.json",
);
assert.equal(
  normalizarVersion(paquete.version),
  paquete.version,
  "package.json debe tener una versión SemVer",
);

console.log("release.spec.ts: OK");
