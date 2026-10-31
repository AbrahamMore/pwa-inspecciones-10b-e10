// Identidad del solicitante (SIMULADA, solo para demostrar y probar la autorización).
//
// IMPORTANTE: este proyecto no tiene autenticación real (fuera de alcance desde la Semana 1).
// Aquí el "actor" se lee de cabeceras de demostración que el CLIENTE envía y que, por tanto,
// cualquiera puede falsificar. Sirve para ejercitar y probar la política de autorización
// (src/lib/security/authz.ts), NO para proteger datos reales. En un sistema real, obtenerActor()
// leería una sesión firmada en el servidor y el resto del módulo no cambiaría.

export type Rol = "inspector" | "supervisor" | "visitante";

export type Actor = {
  id: string;
  rol: Rol;
  /** Laboratorios que un supervisor puede revisar. Vacío para los demás roles. */
  alcance: string[];
};

export const CABECERA_ACTOR = "x-demo-actor";
export const CABECERA_ROL = "x-demo-rol";
export const CABECERA_ALCANCE = "x-demo-alcance";

const ID_VALIDO = /^[A-Za-z0-9_-]{3,40}$/;
const ROLES_CON_IDENTIDAD: readonly Rol[] = ["inspector", "supervisor"];
const MAX_ALCANCE = 10;
const MAX_LARGO_LAB = 80;

/** Sin identidad válida: no puede hacer nada (denegar por defecto). */
export const visitante = (): Actor => ({ id: "", rol: "visitante", alcance: [] });

export function estaIdentificado(actor: Actor): boolean {
  return actor.rol !== "visitante";
}

/** Lee el actor de las cabeceras de demostración. Cualquier dato faltante o inválido => visitante. */
export function obtenerActor(request?: Request): Actor {
  if (!request) return visitante();
  const id = request.headers.get(CABECERA_ACTOR) ?? "";
  const rol = request.headers.get(CABECERA_ROL) ?? "";
  if (!ID_VALIDO.test(id) || !ROLES_CON_IDENTIDAD.includes(rol as Rol)) return visitante();

  const alcance =
    rol === "supervisor"
      ? (request.headers.get(CABECERA_ALCANCE) ?? "")
          .split(",")
          .map((s) => s.trim())
          .filter((s) => s.length > 0 && s.length <= MAX_LARGO_LAB)
          .slice(0, MAX_ALCANCE)
      : [];
  return { id, rol: rol as Rol, alcance };
}

/** Actor que usa esta app en el navegador (un técnico de demostración). */
export const ACTOR_DEMO_NAVEGADOR = { id: "tecnico-demo", rol: "inspector" as const };

/** Cabeceras que el cliente añade a sus peticiones a la API. */
export function cabecerasActorDemo(): Record<string, string> {
  return { [CABECERA_ACTOR]: ACTOR_DEMO_NAVEGADOR.id, [CABECERA_ROL]: ACTOR_DEMO_NAVEGADOR.rol };
}
