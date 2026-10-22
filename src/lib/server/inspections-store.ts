import type { ItemEntrante } from "../sync/validation";

export type Recibida = ItemEntrante & { receivedAt: string };
export type Resultado = "created" | "duplicate" | "updated";

// Almacén en memoria del "servidor" (datos sintéticos). Se cuelga de globalThis para que
// sobreviva a las recargas de módulos de Next en desarrollo. Se reinicia al reiniciar el servidor.
const g = globalThis as unknown as { __inspeccionesStore?: Map<string, Recibida> };
const almacen: Map<string, Recibida> = (g.__inspeccionesStore ??= new Map());

/**
 * Idempotente por clientId: reenviar el mismo registro NO crea un duplicado.
 * Si llega el mismo clientId con un updatedAt más nuevo, gana el más reciente (last-write-wins).
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
  if (Date.parse(item.updatedAt) > Date.parse(actual.updatedAt)) {
    guardar();
    return "updated";
  }
  return "duplicate";
}

export function listar(db: Map<string, Recibida> = almacen): Recibida[] {
  return Array.from(db.values());
}
