import type { QueuedInspection } from "../storage/schema";
import { cabecerasActorDemo } from "../security/actor";

/**
 * Envía un registro de la cola a la API. Si no hay red, fetch lanza un error y la cola
 * lo deja pendiente. Se manda el mismo clientId en cada intento (idempotencia).
 */
export async function enviarAlServidor(item: QueuedInspection): Promise<{ ok: boolean }> {
  const response = await fetch("/api/inspecciones", {
    method: "POST",
    // Identidad de demostración (ver src/lib/security/actor.ts: no es autenticación real).
    headers: { "Content-Type": "application/json", ...cabecerasActorDemo() },
    body: JSON.stringify({
      clientId: item.clientId,
      payload: item.payload,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    }),
  });
  return { ok: response.ok };
}
