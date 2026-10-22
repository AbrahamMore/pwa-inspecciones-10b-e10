export type SyncOutcome =
  | { status: "offline" }
  | { status: "busy" }
  | { status: "done"; synced: number; failed: number };

type Deps = {
  isOnline: () => boolean;
  sync: () => Promise<{ synced: number; failed: number }>;
};

/**
 * Crea un sincronizador con dos protecciones:
 * - Sin red no intenta enviar (no gasta reintentos del registro).
 * - Una sola sincronización a la vez, aunque el evento "online" y un clic coincidan.
 */
export function crearSincronizador(deps: Deps): () => Promise<SyncOutcome> {
  let ocupado = false;
  return async () => {
    if (!deps.isOnline()) return { status: "offline" };
    if (ocupado) return { status: "busy" };
    ocupado = true;
    try {
      const r = await deps.sync();
      return { status: "done", ...r };
    } finally {
      ocupado = false;
    }
  };
}
