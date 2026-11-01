// Detección de secretos en texto (tokens, claves privadas, contraseñas escritas en el código).
// Es una red de seguridad barata para no subir credenciales al repositorio: NO reemplaza
// revocar o rotar un secreto que ya se filtró (borrarlo del último commit no basta: queda en el historial).

export type HallazgoSecreto = { regla: string; linea: number };

const REGLAS: { regla: string; patron: RegExp }[] = [
  { regla: "Bloque de clave privada", patron: /-----BEGIN (?:RSA |EC |OPENSSH |DSA |PGP )?PRIVATE KEY(?: BLOCK)?-----/ },
  { regla: "Clave de acceso de AWS", patron: /\bAKIA[0-9A-Z]{16}\b/ },
  { regla: "Token de GitHub", patron: /\bgh[pousr]_[A-Za-z0-9]{36,}\b/ },
  { regla: "Token de Slack", patron: /\bxox[baprs]-[A-Za-z0-9-]{10,}\b/ },
  { regla: "Cabecera Authorization con credencial", patron: /authorization\s*[:=]\s*["']?(?:Bearer|Basic)\s+[A-Za-z0-9._~+/=-]{16,}/i },
  { regla: "Contraseña o secreto escrito en el código", patron: /\b(?:password|passwd|secret|api[_-]?key|token)\b\s*[:=]\s*["'][^"'\s]{8,}["']/i },
];

/** Devuelve qué regla se activó y en qué línea (nunca el valor encontrado, para no repetir el secreto en los logs). */
export function escanearSecretos(texto: string): HallazgoSecreto[] {
  const hallazgos: HallazgoSecreto[] = [];
  texto.split(/\r?\n/).forEach((linea, i) => {
    for (const { regla, patron } of REGLAS) {
      if (patron.test(linea)) hallazgos.push({ regla, linea: i + 1 });
    }
  });
  return hallazgos;
}
