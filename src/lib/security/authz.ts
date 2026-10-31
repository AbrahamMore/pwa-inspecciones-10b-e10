// Política de autorización por rol (mínimo privilegio). Función pura: fácil de probar.
//
//   Rol         crear propia   ver ajenas             aprobar
//   inspector   sí             no (solo las suyas)    no
//   supervisor  sí             sí, dentro de su alcance   sí, dentro de su alcance
//   visitante   no             no                     no
//
// Todo lo que no esté permitido explícitamente está denegado.

import type { Actor } from "./actor";

export type Accion = "crear" | "ver" | "aprobar";

/** Lo mínimo que la política necesita saber del registro. */
export type Recurso = { ownerId?: string; location: string };

export function puede(actor: Actor, accion: Accion, recurso?: Recurso): boolean {
  switch (actor.rol) {
    case "inspector":
      if (accion === "crear") return true;
      if (accion === "ver") return !!recurso && recurso.ownerId !== undefined && recurso.ownerId === actor.id;
      return false;
    case "supervisor": {
      if (accion === "crear") return true;
      if (!recurso) return false;
      const enAlcance = actor.alcance.includes(recurso.location);
      if (accion === "aprobar") return enAlcance;
      return enAlcance || (recurso.ownerId !== undefined && recurso.ownerId === actor.id);
    }
    default:
      return false;
  }
}

/** Devuelve solo los elementos que el actor puede ver. */
export function filtrarVisibles<T>(actor: Actor, items: T[], aRecurso: (item: T) => Recurso): T[] {
  return items.filter((item) => puede(actor, "ver", aRecurso(item)));
}
