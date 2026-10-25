import type { ItemEntrante } from "../sync/validation";
import { resolveConflict } from "../sync/conflict-policy";

export type Recibida = ItemEntrante & { receivedAt: string };
export type Resultado = "created" | "duplicate" | "updated";

// Almacén en memoria del "servidor" (datos sintéticos). Se cuelga de globalThis para que
// sobreviva a las recargas de módulos de Next en desarrollo. Se reinicia al reiniciar el servidor.
const g = globalThis as unknown as { __inspeccionesStore?: Map<string, Recibida> };
const almacen: Map<string, Recibida> = (g.__inspeccionesStore ??= new Map());

/**
 * Idempotente por clientId: reenviar el mismo registro NO crea un duplicado.
 * Si llega el mismo clientId con otra versión, decide la política de conflictos
 * (src/lib/sync/conflict-policy.ts): gana el updatedAt más reciente (last-write-wins).
 */
export function recibir(item: ItemEntrante, db: Map<string, Recibida> = almacen): Resultado {
  const actual = db.get(item.clientId);
  const guardar = () =>
    db.set(item.clientId, {
      clientId: item.clientId,
      payload: item.payload,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      receivedAt: new Date().toISOString(),
    });

  if (!actual) {
    guardar();
    return "created";
  }
  // "local" = la versión que llega del cliente es más nueva que la guardada.
  if (resolveConflict(item, actual) === "local") {
    guardar();
    return "updated";
  }
  return "duplicate"; // gana lo ya guardado, o es el mismo registro reenviado
}

export function listar(db: Map<string, Recibida> = almacen): Recibida[] {
  return Array.from(db.values());
}
