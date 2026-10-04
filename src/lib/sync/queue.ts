import { readQueue, writeQueue, type QueuedInspection } from "../storage/schema";

const MAX_ATTEMPTS = 3;

export function enqueueInspection(payload: QueuedInspection["payload"]): QueuedInspection {
  const now = new Date().toISOString();
  const item: QueuedInspection = {
    clientId: crypto.randomUUID(),
    payload,
    createdAt: now,
    updatedAt: now,
    status: "pending",
    attempts: 0
  };

  const queue = readQueue();
  queue.push(item);
  writeQueue(queue);
  return item;
}

export function getPendingItems(): QueuedInspection[] {
  return readQueue().filter((item) => item.status === "pending" || item.status === "error");
}

type SyncFn = (item: QueuedInspection) => Promise<{ ok: boolean }>;

export async function syncQueue(syncFn: SyncFn): Promise<{ synced: number; failed: number }> {
  const queue = readQueue();
  let synced = 0;
  let failed = 0;

  for (const item of queue) {
    if (item.status === "synced") continue;

    item.status = "syncing";
    item.attempts += 1;

    try {
      // clientId se reenvía sin cambios en cada intento: esa es la idempotencia.
      const result = await syncFn(item);
      if (!result.ok) throw new Error("El servidor rechazó el registro");

      item.status = "synced";
      item.updatedAt = new Date().toISOString();
      synced += 1;
    } catch (error) {
      item.status = item.attempts >= MAX_ATTEMPTS ? "error" : "pending";
      item.lastError = error instanceof Error ? error.message : "Error desconocido";
      failed += 1;
    }
  }

  writeQueue(queue);
  return { synced, failed };
}