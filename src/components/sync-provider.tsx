"use client";

import React, { createContext, useContext, type ReactNode } from "react";
import { useInspectionSync } from "../lib/sync/use-inspection-sync";

type SyncValue = ReturnType<typeof useInspectionSync>;

const SyncContext = createContext<SyncValue | null>(null);

/**
 * Mantiene UNA sola instancia de la sincronización para toda la app.
 * Así los registros pendientes se envían al volver la red desde cualquier pantalla,
 * no solo desde el formulario.
 */
export function SyncProvider({ children }: { children: ReactNode }) {
  const sync = useInspectionSync();
  return <SyncContext.Provider value={sync}>{children}</SyncContext.Provider>;
}

export function useSync(): SyncValue {
  const value = useContext(SyncContext);
  if (!value) throw new Error("useSync debe usarse dentro de <SyncProvider>");
  return value;
}
