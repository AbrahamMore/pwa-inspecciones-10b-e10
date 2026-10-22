"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { readQueue, type QueuedInspection } from "../storage/schema";
import { enqueueInspection, syncQueue } from "./queue";
import { enviarAlServidor } from "./client-sync";
import { crearSincronizador } from "./runner";

/** Conecta la cola de sincronización con la interfaz: estado de red, lista y envío automático. */
export function useInspectionSync() {
  const [items, setItems] = useState<QueuedInspection[]>([]);
  const [online, setOnline] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const run = useMemo(
    () =>
      crearSincronizador({
        isOnline: () => navigator.onLine,
        sync: () => syncQueue(enviarAlServidor),
      }),
    []
  );

  const refresh = useCallback(() => setItems([...readQueue()].reverse()), []);

  const sincronizar = useCallback(async () => {
    setSyncing(true);
    try {
      await run();
    } finally {
      setSyncing(false);
      refresh();
    }
  }, [run, refresh]);

  useEffect(() => {
    setOnline(navigator.onLine);
    refresh();
    const alVolverLaRed = () => {
      setOnline(true);
      void sincronizar();
    };
    const alPerderLaRed = () => setOnline(false);
    window.addEventListener("online", alVolverLaRed);
    window.addEventListener("offline", alPerderLaRed);
    void sincronizar(); // al abrir la pantalla, envía lo que haya quedado pendiente
    return () => {
      window.removeEventListener("online", alVolverLaRed);
      window.removeEventListener("offline", alPerderLaRed);
    };
  }, [refresh, sincronizar]);

  const agregar = useCallback(
    (payload: QueuedInspection["payload"]) => {
      const item = enqueueInspection(payload);
      refresh();
      void sincronizar();
      return item;
    },
    [refresh, sincronizar]
  );

  return { items, online, syncing, agregar, sincronizar };
}
