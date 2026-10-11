import { CapabilityResult, errorName } from "../device/types";

export type PermisoNotif = "default" | "granted" | "denied";

export type NotificationApiLike = {
  permission: PermisoNotif;
  requestPermission(): Promise<PermisoNotif>;
};
export type RegistrationLike = {
  showNotification(title: string, options?: { body?: string; tag?: string }): Promise<void>;
};
export type ServiceWorkerContainerLike = { ready: Promise<RegistrationLike> };

export type NotifEnv = {
  Notification?: NotificationApiLike;
  serviceWorker?: ServiceWorkerContainerLike;
};

function envActual(): NotifEnv {
  if (typeof window === "undefined") return {};
  return {
    Notification: (window as unknown as { Notification?: NotificationApiLike }).Notification,
    serviceWorker: typeof navigator !== "undefined" ? (navigator.serviceWorker as unknown as ServiceWorkerContainerLike | undefined) : undefined,
  };
}

/** Lee el permiso SIN pedirlo. Sirve para decidir qué botón mostrar. */
export function leerPermiso(env: NotifEnv = envActual()): PermisoNotif | "unsupported" {
  return env.Notification ? env.Notification.permission : "unsupported";
}

/** Pide permiso. Solo llamar desde un clic ("Activar recordatorios"), nunca al cargar. */
export async function pedirPermiso(env: NotifEnv = envActual()): Promise<CapabilityResult<"granted">> {
  if (!env.Notification) {
    return { status: "unsupported", reason: "Este navegador no soporta notificaciones. Los avisos se verán dentro de la app." };
  }
  if (env.Notification.permission === "denied") {
    return { status: "denied", reason: "Las notificaciones están bloqueadas. Puedes activarlas en la configuración del sitio." };
  }
  if (env.Notification.permission === "granted") return { status: "ok", data: "granted" };
  try {
    const r = await env.Notification.requestPermission();
    return r === "granted"
      ? { status: "ok", data: "granted" }
      : { status: "denied", reason: "No se concedió el permiso. La app sigue funcionando sin notificaciones." };
  } catch (e) {
    return { status: "error", reason: `No se pudo solicitar el permiso (${errorName(e)}).` };
  }
}

/**
 * Notificación LOCAL (sin servidor ni push) vía service worker.
 * Si no hay permiso no se muestra nada: nunca se pide permiso aquí.
 */
export async function mostrarRecordatorio(
  titulo: string,
  cuerpo: string,
  env: NotifEnv = envActual()
): Promise<CapabilityResult<"mostrada">> {
  if (!env.Notification || !env.serviceWorker) {
    return { status: "unsupported", reason: "Notificaciones no disponibles. Se mostrará un aviso dentro de la app." };
  }
  if (env.Notification.permission !== "granted") {
    return { status: "denied", reason: "Sin permiso de notificaciones." };
  }
  try {
    const reg = await env.serviceWorker.ready;
    await reg.showNotification(titulo, { body: cuerpo, tag: "recordatorio-inspeccion" });
    return { status: "ok", data: "mostrada" };
  } catch (e) {
    return { status: "error", reason: `No se pudo mostrar la notificación (${errorName(e)}).` };
  }
}