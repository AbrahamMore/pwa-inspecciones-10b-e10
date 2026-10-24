import type { SyncStatus } from "../storage/schema";

/** Textos que ve el usuario para cada estado de sincronización (los usan el listado y el formulario). */
export const ETIQUETAS_SYNC: Record<SyncStatus, string> = {
  pending: "Pendiente de enviar",
  syncing: "Enviando…",
  synced: "Sincronizada",
  error: "Error: toca «Sincronizar ahora»",
};
