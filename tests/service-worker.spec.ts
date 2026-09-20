import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");

const sw = await readFile(resolve(root, "public/sw.js"), "utf8");
const register = await readFile(resolve(root, "src/lib/pwa/register-service-worker.ts"), "utf8");

// El service worker debe manejar los tres eventos base de su ciclo de vida.
assert.match(sw, /addEventListener\(\s*["']install["']/, "sw.js debe escuchar 'install'");
assert.match(sw, /addEventListener\(\s*["']activate["']/, "sw.js debe escuchar 'activate'");
assert.match(sw, /addEventListener\(\s*["']fetch["']/, "sw.js debe escuchar 'fetch'");

// No debe forzar skipWaiting automáticamente al instalar (actualización segura):
// solo debe dispararse por un mensaje explícito.
const installBlock = sw.split('addEventListener("install"')[1]?.split('addEventListener("activate"')[0] ?? "";
assert.doesNotMatch(installBlock, /skipWaiting\(\)/, "install no debe llamar skipWaiting() automáticamente");
assert.match(sw, /addEventListener\(\s*["']message["']/, "debe permitir activar la nueva versión por mensaje explícito");

// El activate debe limpiar cachés viejos (versionado seguro).
assert.match(sw, /caches\.delete/, "activate debe eliminar cachés obsoletos");

// El registro debe apuntar exactamente al archivo del service worker.
assert.match(register, /register\(\s*["']\/sw\.js["']/, "register-service-worker.ts debe registrar /sw.js");
assert.match(register, /["']serviceWorker["']\s+in\s+navigator/, "debe verificar soporte del navegador antes de registrar");

console.log("service-worker.spec.ts: PASS");