import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");

const manifestRaw = await readFile(resolve(root, "public/manifest.webmanifest"), "utf8");
const manifest = JSON.parse(manifestRaw);

const layout = await readFile(resolve(root, "src/app/layout.tsx"), "utf8");

// El manifest debe tener los campos mínimos que exige un shell instalable.
assert.ok(manifest.name, "El manifest debe declarar 'name'");
assert.ok(manifest.short_name, "El manifest debe declarar 'short_name'");
assert.equal(manifest.start_url, "/", "start_url debe apuntar a la raíz");
assert.equal(manifest.display, "standalone", "display debe ser 'standalone' para comportarse como app instalada");

// Debe traer al menos un ícono de 192x192 y uno de 512x512.
assert.ok(Array.isArray(manifest.icons) && manifest.icons.length > 0, "Debe existir al menos un ícono");
const sizes = manifest.icons.map((icon: { sizes: string }) => icon.sizes);
assert.ok(sizes.includes("192x192"), "Debe existir un ícono de 192x192");
assert.ok(sizes.includes("512x512"), "Debe existir un ícono de 512x512");

// El layout debe enlazar el manifest para que el navegador lo detecte.
assert.match(layout, /manifest:\s*["']\/manifest\.webmanifest["']/, "layout.tsx debe referenciar /manifest.webmanifest");

console.log("manifest.spec.ts: PASS");
