import { CapabilityResult } from "./types";
import { LIMITES } from "../sync/validation";

/** Lado máximo de la foto guardada. 800 px bastan para evidencia y mantienen el archivo pequeño. */
export const MAX_LADO = 800;
/** Calidades JPEG que se prueban de mayor a menor hasta que la foto cabe en el límite. */
export const CALIDADES = [0.7, 0.5, 0.35, 0.2];

export type CanvasLike = {
  width: number;
  height: number;
  getContext(tipo: "2d"): { drawImage(src: unknown, x: number, y: number, w: number, h: number): void } | null;
  toDataURL(tipo: string, calidad: number): string;
};

/** Reduce proporcionalmente para que el lado mayor no pase de `max` (nunca agranda). */
export function calcularTamano(ancho: number, alto: number, max: number = MAX_LADO): { w: number; h: number } {
  const mayor = Math.max(ancho, alto);
  if (mayor <= max) return { w: ancho, h: alto };
  const f = max / mayor;
  return { w: Math.round(ancho * f), h: Math.round(alto * f) };
}

/**
 * Dibuja la fuente en un canvas reducido y la exporta como JPEG.
 * La foto va a localStorage (cola offline), por eso se comprime hasta cumplir el límite de la API.
 */
export function comprimirACanvas(
  fuente: unknown,
  ancho: number,
  alto: number,
  crearCanvas: () => CanvasLike,
  maxChars: number = LIMITES.photo
): CapabilityResult<string> {
  if (!ancho || !alto) return { status: "error", reason: "La imagen no tiene tamaño válido." };
  const { w, h } = calcularTamano(ancho, alto);
  const canvas = crearCanvas();
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return { status: "unsupported", reason: "No se pudo procesar la imagen en este navegador." };
  ctx.drawImage(fuente, 0, 0, w, h);
  for (const q of CALIDADES) {
    const url = canvas.toDataURL("image/jpeg", q);
    if (url.length <= maxChars) return { status: "ok", data: url };
  }
  return { status: "error", reason: "La foto es demasiado grande. Intenta con otra." };
}

function canvasDelNavegador(): CanvasLike {
  return document.createElement("canvas") as unknown as CanvasLike;
}

/** Comprime un archivo elegido por el usuario (galería o cámara nativa). Solo en el navegador. */
export async function comprimirArchivo(file: File): Promise<CapabilityResult<string>> {
  if (typeof document === "undefined") return { status: "unsupported", reason: "Solo disponible en el navegador." };
  if (!file.type.startsWith("image/")) return { status: "error", reason: "El archivo no es una imagen." };
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((ok, fallo) => {
      const i = new Image();
      i.onload = () => ok(i);
      i.onerror = () => fallo(new Error("imagen"));
      i.src = url;
    });
    return comprimirACanvas(img, img.naturalWidth, img.naturalHeight, canvasDelNavegador);
  } catch {
    return { status: "error", reason: "No se pudo leer la imagen." };
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** Toma un fotograma del video de la cámara y lo comprime. */
export function comprimirVideo(video: HTMLVideoElement): CapabilityResult<string> {
  return comprimirACanvas(video, video.videoWidth, video.videoHeight, canvasDelNavegador);
}
