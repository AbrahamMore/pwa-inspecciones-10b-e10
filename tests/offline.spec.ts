import assert from "node:assert/strict";
import { readFile, access } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");

const sw = await readFile(resolve(root, "public/sw.js"), "utf8");

await assert.doesNotReject(
  access(resolve(root, "public/offline.html")),
  "Debe existir public/offline.html como página de fallback offline"
);

assert.match(sw, /OFFLINE_URL\s*=\s*["']\/offline\.html["']/, "sw.js debe definir OFFLINE_URL apuntando a /offline.html");
assert.match(sw, /mode\s*===\s*["']navigate["']/, "sw.js debe distinguir peticiones de navegación");
assert.match(sw, /caches\.match\(\s*OFFLINE_URL\s*\)/, "debe responder con OFFLINE_URL cuando falla la red en navegación");

console.log("offline.spec.ts: PASS");
