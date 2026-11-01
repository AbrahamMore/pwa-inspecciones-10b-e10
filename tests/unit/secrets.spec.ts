// Pruebas del escáner de secretos y de que el repositorio no contiene ninguno.
// Los "secretos" de prueba se arman en tiempo de ejecución (concatenando) para que este archivo
// no contenga ningún valor con forma de credencial y el escáner no se marque a sí mismo.
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { extname, join } from "node:path";
import { spawnSync } from "node:child_process";
import { escanearSecretos } from "../../src/lib/security/secrets";

const regla = (texto: string) => escanearSecretos(texto).map((h) => h.regla);

// 1) Detecta cada tipo de secreto sintético.
assert.deepEqual(regla("-----BEGIN " + "PRIVATE KEY-----"), ["Bloque de clave privada"]);
assert.deepEqual(regla("-----BEGIN " + "RSA PRIVATE KEY-----"), ["Bloque de clave privada"]);
assert.deepEqual(regla("clave = AKIA" + "IOSFODNN7EXAMPLE"), ["Clave de acceso de AWS"]);
assert.deepEqual(regla("const t = 'ghp_" + "a".repeat(36) + "'"), ["Token de GitHub"]);
assert.deepEqual(regla("slack: xox" + "b-1234567890-abcdefghij"), ["Token de Slack"]);
assert.ok(regla("Authorization: Bea" + "rer abcdefghijklmnop1234").includes("Cabecera Authorization con credencial"));
assert.ok(regla('const pass' + 'word = "hunter2hunter2";').includes("Contraseña o secreto escrito en el código"));
assert.ok(regla("API_" + "KEY: 'abcdefgh12345678'").includes("Contraseña o secreto escrito en el código"));

// 2) Informa la línea y NUNCA el valor.
const h = escanearSecretos("línea 1\nlínea 2\nclave = AKIA" + "IOSFODNN7EXAMPLE");
assert.equal(h.length, 1);
assert.equal(h[0].linea, 3);
assert.ok(!JSON.stringify(h).includes("IOSFODNN7"), "el hallazgo no debe repetir el secreto");

// 3) No marca texto normal (falsos positivos que importan en este proyecto).
for (const normal of [
  "La contraseña se pide al usuario en la pantalla de inicio.",
  'const password = "";',
  "token: undefined",
  "const secreto = 'corto'",
  "El campo token se guarda aparte.",
  "Authorization: Bearer",
]) {
  assert.deepEqual(escanearSecretos(normal), [], `falso positivo: ${normal}`);
}

// 4) El repositorio no contiene secretos ni archivos de credenciales.
const SIN_TEXTO = new Set([".png", ".jpg", ".jpeg", ".webp", ".ico", ".gif", ".zip", ".woff", ".woff2"]);
const IGNORAR = new Set(["node_modules", ".next", ".git", "reports", "playwright-report", "test-results"]);
function recorrer(dir: string): string[] {
  return readdirSync(dir).flatMap((n) => {
    if (IGNORAR.has(n)) return [];
    const r = join(dir, n);
    return statSync(r).isDirectory() ? recorrer(r) : [r];
  });
}
const git = spawnSync("git", ["ls-files"], { encoding: "utf8" });
const archivos = (git.status === 0 ? git.stdout.split("\n").filter(Boolean) : recorrer("."))
  .filter((f) => !SIN_TEXTO.has(extname(f).toLowerCase()) && f !== "package-lock.json");

const hallazgos: string[] = [];
for (const f of archivos) {
  let texto: string;
  try {
    texto = readFileSync(f, "utf8");
  } catch {
    continue; // archivo borrado o ilegible
  }
  for (const x of escanearSecretos(texto)) hallazgos.push(`${f}:${x.linea} (${x.regla})`);
}
assert.deepEqual(hallazgos, [], `posibles secretos en el repositorio:\n${hallazgos.join("\n")}`);

const prohibidos = archivos.filter((f) => /(^|\/)\.env(\.|$)/.test(f) && !f.endsWith(".env.example"));
assert.deepEqual(prohibidos, [], "no debe haber archivos .env versionados (solo .env.example)");
assert.deepEqual(archivos.filter((f) => /\.(pem|key|p12|pfx)$/i.test(f)), [], "no debe haber claves o certificados versionados");

// 5) El .gitignore protege los .env y el código no usa variables públicas para secretos.
assert.match(readFileSync(".gitignore", "utf8"), /^\.env\*$/m, ".gitignore debe ignorar .env*");
const fuentes = archivos.filter((f) => f.startsWith("src/") && /\.(ts|tsx)$/.test(f));
for (const f of fuentes) {
  assert.ok(!/NEXT_PUBLIC_/.test(readFileSync(f, "utf8")), `${f} usa una variable NEXT_PUBLIC_: lo que va ahí es público`);
}

console.log("secrets.spec.ts: PASS");
