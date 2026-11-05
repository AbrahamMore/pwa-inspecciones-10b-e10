// Coherencia de los artefactos de release: la misma versión de Node en todas partes, un Dockerfile sin
// atajos peligrosos y un workflow que de verdad construye la imagen y prueba el SHA publicado.
// Son pruebas de texto: detectan que alguien rompa una decisión, no demuestran que Docker funcione
// (eso lo hace el job "smoke-docker" de GitHub Actions al construir y ejecutar la imagen).
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const leer = (ruta: string) => readFileSync(ruta, "utf8");
const dockerfile = leer("Dockerfile");
const workflow = leer(".github/workflows/academic-evaluation.yml");
const dockerignore = leer(".dockerignore")
  .split(/\r?\n/)
  .map((l) => l.trim());

// 1) Una sola versión de Node: .nvmrc = Dockerfile = GitHub Actions (todos los jobs).
const nvmrc = leer(".nvmrc").trim();
assert.match(
  nvmrc,
  /^\d+\.\d+\.\d+$/,
  ".nvmrc debe fijar una versión completa",
);
assert.equal(
  dockerfile.match(/^ARG NODE_VERSION=(\S+)/m)?.[1],
  nvmrc,
  "Dockerfile y .nvmrc usan versiones de Node distintas",
);
const versionesCI = [...workflow.matchAll(/node-version:\s*'?([\d.]+)'?/g)].map(
  (m) => m[1],
);
assert.ok(versionesCI.length >= 3, "cada job debe declarar su versión de Node");
for (const v of versionesCI)
  assert.equal(v, nvmrc, "el workflow usa otra versión de Node que .nvmrc");
const motor = JSON.parse(leer("package.json")).engines?.node as string;
assert.ok(
  motor?.includes(nvmrc.split(".")[0]),
  "engines.node debe ser compatible con la versión fijada",
);

// 2) Dockerfile: instalación del lockfile, artefacto con SHA, sin root, con health check.
assert.match(dockerfile, /RUN npm ci /, "debe instalar con npm ci (lockfile)");
assert.doesNotMatch(
  dockerfile,
  /npm install/,
  "npm install no respeta el lockfile",
);
assert.match(
  dockerfile,
  /ARG APP_COMMIT_SHA/,
  "el SHA debe poder entrar como argumento de build",
);
assert.match(
  dockerfile,
  /--omit=dev/,
  "la imagen final no debe llevar dependencias de desarrollo",
);
const etapaFinal = dockerfile.slice(dockerfile.lastIndexOf("FROM "));
assert.match(
  etapaFinal,
  /^USER node$/m,
  "la imagen final no debe ejecutarse como root",
);
assert.match(
  etapaFinal,
  /HEALTHCHECK[\s\S]*\/api\/health/,
  "debe comprobar /api/health",
);
assert.match(etapaFinal, /\nCMD /, "la imagen final debe arrancar el servidor");
assert.doesNotMatch(
  dockerfile,
  /^\s*(?:ENV|ARG)\s+\w*(?:SECRET|TOKEN|PASSWORD|API_?KEY)\w*/im,
  "no se declaran secretos en la imagen",
);
assert.doesNotMatch(
  dockerfile,
  /COPY[^\n]*\.env/,
  "no se copian archivos .env",
);

// 3) .dockerignore deja fuera historial, dependencias locales y secretos.
for (const entrada of [".git", "node_modules", ".next", ".env*"]) {
  assert.ok(
    dockerignore.includes(entrada),
    `.dockerignore debe excluir ${entrada}`,
  );
}

// 4) El workflow construye la imagen con el SHA real y compara lo publicado contra ese SHA.
assert.match(workflow, /smoke-docker:/, "falta el job smoke-docker");
assert.match(
  workflow,
  /docker build[^\n]*APP_COMMIT_SHA="\$\{\{ github\.sha \}\}"/,
  "la imagen debe llevar el SHA del commit evaluado",
);
assert.match(
  workflow,
  /SMOKE_EXPECTED_SHA:\s*\$\{\{ github\.sha \}\}/,
  "el smoke debe comparar contra el SHA evaluado",
);
assert.match(
  workflow,
  /SMOKE_BASE_URL:\s*http:\/\/localhost:3000/,
  "el smoke debe apuntar al contenedor",
);
assert.match(workflow, /npm run smoke/, "falta ejecutar el smoke test");

// 5) El service worker nunca guarda en caché la API de health (un health cacheado mentiría sobre la versión).
assert.match(
  leer("public/sw.js"),
  /pathname\.startsWith\("\/api\/"\)\)\s*return/,
  "sw.js debe dejar pasar /api/ sin caché",
);

console.log("release-integration.spec.ts: OK");
