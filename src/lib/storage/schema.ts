export type SyncStatus = "pending" | "syncing" | "synced" | "error";

export interface QueuedInspection {
  clientId: string;
  payload: {
    location: string;
    date: string;
    summary: string;
    inspector: string;
    findings: string;
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
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? (JSON.parse(raw) as QueuedInspection[]) : [];
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