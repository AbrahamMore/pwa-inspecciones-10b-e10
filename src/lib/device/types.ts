/**
 * Resultado común de las capacidades del dispositivo.
 * Nunca se lanzan excepciones hacia la UI: siempre se devuelve uno de 4 estados,
 * para que la pantalla pueda mostrar un mensaje o un fallback.
 */
export type CapabilityResult<T> =
  | { status: "ok"; data: T }
  | { status: "unsupported"; reason: string }
  | { status: "denied"; reason: string }
  | { status: "error"; reason: string };

/** Extrae el nombre de un error desconocido sin asumir su forma. */
export function errorName(e: unknown): string {
  if (e && typeof e === "object" && "name" in e) {
    return String((e as { name: unknown }).name);
  }
  return "UnknownError";
}