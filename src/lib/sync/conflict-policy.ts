import type { QueuedInspection } from "../storage/schema";

export type ConflictResolution = "local" | "remote" | "merge-not-needed";

export interface RemoteVersion {
  clientId: string;
  updatedAt: string;
  payload: QueuedInspection["payload"];
}

/**
 * Política: last-write-wins por marca de tiempo.
 * Si el registro remoto es más reciente, gana el remoto; si el local es
 * más reciente, gana el local. Es una decisión explícita y documentada,
 * no un comportamiento accidental — ver docs/sync-policy.md para el trade-off.
 */
export function resolveConflict(
  local: QueuedInspection,
  remote: RemoteVersion
): ConflictResolution {
  if (local.clientId !== remote.clientId) {
    throw new Error("No se puede resolver un conflicto entre registros con clientId distinto");
  }

  const localTime = new Date(local.updatedAt).getTime();
  const remoteTime = new Date(remote.updatedAt).getTime();

  if (remoteTime > localTime) return "remote";
  if (localTime > remoteTime) return "local";
  return "merge-not-needed";
}