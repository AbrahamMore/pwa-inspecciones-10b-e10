import type { Recibida } from "./inspections-store";
import type { Recurso } from "../security/authz";

/** Lo que la política de autorización necesita saber de un registro guardado. */
export const recursoDe = (r: Recibida): Recurso => ({ ownerId: r.ownerId, location: r.payload.location });

/** Respuesta de detalle: el registro completo, sin el identificador interno del propietario. */
export function proyectarDetalle(r: Recibida) {
  const { ownerId: _ownerId, ...resto } = r;
  return resto;
}

/**
 * Respuesta de listado (minimización): sin la foto, que es pesada y sensible, y sin el propietario.
 * La foto solo se entrega en el detalle, y solo a quien puede ver ese registro.
 */
export function proyectarListado(r: Recibida) {
  const { ownerId: _ownerId, ...resto } = r;
  const { photo, ...payload } = resto.payload;
  return { ...resto, payload, tieneFoto: photo !== undefined };
}
