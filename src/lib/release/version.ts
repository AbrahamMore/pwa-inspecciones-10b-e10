/**
 * Identidad de la versión publicada: número SemVer (package.json) + SHA completo del commit.
 * Los valores se fijan en el BUILD (next.config.mjs → NEXT_PUBLIC_APP_VERSION / NEXT_PUBLIC_APP_COMMIT),
 * por eso el mismo artefacto siempre responde lo mismo. El SHA nunca se escribe en un archivo del repositorio:
 * cambiaría el commit que describe.
 */

export const COMMIT_DESCONOCIDO = "desconocido";
const SHA_COMPLETO = /^[0-9a-f]{40}$/;
const SEMVER = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/;

export type InfoVersion = {
  /** Número de versión SemVer, por ejemplo "1.0.0". */
  version: string;
  /** SHA completo (40 hex) o "desconocido" si el build no pudo averiguarlo. */
  commit: string;
  /** Primeros 7 caracteres, solo para mostrar en pantalla. */
  commitCorto: string;
};

/** Acepta solo un SHA completo; cualquier otra cosa se descarta (no se muestra texto arbitrario). */
export function normalizarCommit(valor: string | null | undefined): string {
  const limpio = (valor ?? "").trim().toLowerCase();
  return SHA_COMPLETO.test(limpio) ? limpio : COMMIT_DESCONOCIDO;
}

export function normalizarVersion(valor: string | null | undefined): string {
  const limpio = (valor ?? "").trim();
  return SEMVER.test(limpio) ? limpio : "0.0.0";
}

export function obtenerInfoVersion(
  // process.env.NEXT_PUBLIC_* se escribe literal para que Next lo sustituya al compilar.
  entrada: { version?: string | null; commit?: string | null } = {
    version: process.env.NEXT_PUBLIC_APP_VERSION,
    commit: process.env.NEXT_PUBLIC_APP_COMMIT,
  },
): InfoVersion {
  const commit = normalizarCommit(entrada.commit);
  return {
    version: normalizarVersion(entrada.version),
    commit,
    commitCorto: commit === COMMIT_DESCONOCIDO ? COMMIT_DESCONOCIDO : commit.slice(0, 7),
  };
}
