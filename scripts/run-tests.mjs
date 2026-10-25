// Ejecuta todas las pruebas *.spec.ts / *.spec.mjs de las carpetas indicadas.
// Uso: node scripts/run-tests.mjs tests/unit tests/integration
// Cada archivo corre en su propio proceso (aislado); si uno falla, se reporta y el comando termina con error.
import { readdirSync, existsSync } from "node:fs";
import { resolve, join } from "node:path";
import { spawnSync } from "node:child_process";

const root = resolve(import.meta.dirname, "..");
const carpetas = process.argv.slice(2);
if (carpetas.length === 0) {
  console.error("Indica al menos una carpeta de pruebas.");
  process.exit(2);
}

let total = 0;
const fallidas = [];
for (const carpeta of carpetas) {
  const dir = resolve(root, carpeta);
  if (!existsSync(dir)) {
    console.error(`No existe la carpeta ${carpeta}`);
    process.exit(2);
  }
  const archivos = readdirSync(dir).filter((f) => /\.spec\.(ts|mjs)$/.test(f)).sort();
  if (archivos.length === 0) {
    console.error(`La carpeta ${carpeta} no tiene pruebas.`);
    process.exit(2);
  }
  console.log(`\n== ${carpeta} (${archivos.length} archivos)`);
  for (const archivo of archivos) {
    total++;
    const ruta = join(carpeta, archivo);
    const args = archivo.endsWith(".ts") ? ["--import", "tsx", ruta] : [ruta];
    const r = spawnSync(process.execPath, args, { cwd: root, encoding: "utf8" });
    if (r.status === 0) {
      process.stdout.write(r.stdout);
    } else {
      fallidas.push(ruta);
      process.stdout.write(r.stdout ?? "");
      process.stderr.write(r.stderr ?? "");
      console.error(`${archivo}: FAIL`);
    }
  }
}
console.log(`\n${total - fallidas.length}/${total} archivos de prueba pasaron.`);
if (fallidas.length) {
  console.error(`Fallaron: ${fallidas.join(", ")}`);
  process.exit(1);
}
