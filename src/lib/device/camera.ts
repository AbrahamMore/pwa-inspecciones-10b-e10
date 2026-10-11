import { CapabilityResult, errorName } from "./types";

export type MediaDevicesLike = {
  getUserMedia(c: { video: boolean | object; audio: boolean }): Promise<MediaStreamLike>;
};
export type MediaStreamLike = { getTracks(): { stop(): void }[] };

/**
 * Fallback: un <input type="file" capture> abre la cámara nativa (o la galería)
 * sin pedir permiso del navegador y funciona incluso donde getUserMedia no existe.
 */
export const CAMERA_FALLBACK_INPUT = { type: "file", accept: "image/*", capture: "environment" } as const;

/** Solicita la cámara trasera, solo video (sin micrófono). Llamar desde un clic. */
export async function abrirCamara(
  md: MediaDevicesLike | undefined = typeof navigator !== "undefined" ? (navigator.mediaDevices as unknown as MediaDevicesLike | undefined) : undefined
): Promise<CapabilityResult<MediaStreamLike>> {
  if (!md || typeof md.getUserMedia !== "function") {
    return { status: "unsupported", reason: "La cámara no está disponible aquí. Usa el botón de adjuntar foto." };
  }
  try {
    const stream = await md.getUserMedia({ video: { facingMode: "environment" }, audio: false });
    return { status: "ok", data: stream };
  } catch (e) {
    const n = errorName(e);
    if (n === "NotAllowedError" || n === "SecurityError") {
      return { status: "denied", reason: "Permiso de cámara denegado. Usa el botón de adjuntar foto." };
    }
    if (n === "NotFoundError" || n === "OverconstrainedError") {
      return { status: "unsupported", reason: "No se encontró una cámara en este dispositivo." };
    }
    return { status: "error", reason: "No se pudo abrir la cámara. Intenta de nuevo o adjunta una foto." };
  }
}

/** Libera la cámara (apaga el LED). Debe llamarse al cerrar la vista o al tomar la foto. */
export function cerrarCamara(stream: MediaStreamLike | null | undefined): number {
  if (!stream) return 0;
  const tracks = stream.getTracks();
  tracks.forEach((t) => t.stop());
  return tracks.length;
}