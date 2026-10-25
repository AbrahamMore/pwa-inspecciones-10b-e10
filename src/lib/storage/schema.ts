export type SyncStatus = "pending" | "syncing" | "synced" | "error";

export interface QueuedInspection {
  clientId: string;
  payload: {
    location: string;
    date: string;
    summary: string;
    inspector: string;
    findings: string;
    // Evidencia opcional (Semana 6): foto comprimida como data URL y ubicación aproximada.
    photo?: string;
    geo?: { lat: number; lon: number; precisionM: number };
  };
  createdAt: string;
  updatedAt: string;
  status: SyncStatus;
  attempts: number;
  lastError?: string;
}

const STORAGE_KEY = "inspecciones-sync-queue-v1";

// Adaptador en memoria para entornos sin localStorage (servidor, pruebas en Node).
let memoryStore: QueuedInspection[] = [];

function hasLocalStorage(): boolean {
  return typeof localStorage !== "undefined";
}

export function readQueue(): QueuedInspection[] {
  if (!hasLocalStorage()) return memoryStore;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const data: unknown = raw ? JSON.parse(raw) : [];
    // Si el dato está dañado o no es una lista, la app arranca con la cola vacía en vez de romperse.
    return Array.isArray(data) ? (data as QueuedInspection[]) : [];
  } catch {
    return [];
  }
}

export function writeQueue(queue: QueuedInspection[]): void {
  if (!hasLocalStorage()) {
    memoryStore = queue;
    return;
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
}

export function clearQueue(): void {
  writeQueue([]);
}
