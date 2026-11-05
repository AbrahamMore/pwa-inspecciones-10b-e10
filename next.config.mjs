import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";

// Identidad de la release, fijada al compilar: versión (package.json) + SHA completo del commit.
// Orden de búsqueda del SHA: variable explícita (Docker: --build-arg), GitHub Actions, Vercel y, por último, git local.
// Si ninguna existe (por ejemplo, un build sin .git) queda vacío y la app muestra "desconocido" en vez de inventar nada.
const { version } = JSON.parse(
  readFileSync(new URL("./package.json", import.meta.url), "utf8"),
);

function commitDelBuild() {
  const delEntorno =
    process.env.APP_COMMIT_SHA ||
    process.env.GITHUB_SHA ||
    process.env.VERCEL_GIT_COMMIT_SHA;
  if (delEntorno) return delEntorno;
  try {
    return execSync("git rev-parse HEAD", {
      stdio: ["ignore", "pipe", "ignore"],
    })
      .toString()
      .trim();
  } catch {
    return "";
  }
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_APP_VERSION: version,
    NEXT_PUBLIC_APP_COMMIT: commitDelBuild(),
  },
};

export default nextConfig;
