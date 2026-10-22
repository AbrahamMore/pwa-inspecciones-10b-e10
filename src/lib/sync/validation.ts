import type { QueuedInspection } from "../storage/schema";

export type Payload = QueuedInspection["payload"];

export type ItemEntrante = {
  clientId: string;
  payload: Payload;
  createdAt: string;
  updatedAt: string;
};

export const LIMITES = { location: 80, inspector: 80, summary: 300, findings: 1000, photo: 600_000 };

const texto = (v: unknown): v is string => typeof v === "string";
const fechaIso = (v: unknown) => texto(v) && !Number.isNaN(Date.parse(v));

/** Valida el contenido capturado. Se usa en el formulario (cliente) y en la API (servidor). */
export function validarPayload(p: unknown): string[] {
  if (!p || typeof p !== "object") return ["El registro no es válido."];
  const o = p as Record<string, unknown>;
  const errores: string[] = [];

  const requerido = (campo: "location" | "inspector" | "findings", etiqueta: string) => {
    const v = o[campo];
    if (!texto(v) || v.trim() === "") errores.push(`${etiqueta} es obligatorio.`);
    else if (v.length > LIMITES[campo]) errores.push(`${etiqueta} supera ${LIMITES[campo]} caracteres.`);
  };
  requerido("location", "El laboratorio");
  requerido("inspector", "El responsable");
  requerido("findings", "Los hallazgos");

  if (!texto(o.date) || !/^\d{4}-\d{2}-\d{2}$/.test(o.date)) errores.push("La fecha no es válida.");
  if (!texto(o.summary)) errores.push("El resumen debe ser texto.");
  else if (o.summary.length > LIMITES.summary) errores.push(`El resumen supera ${LIMITES.summary} caracteres.`);

  if (o.photo !== undefined) {
    if (!texto(o.photo) || !o.photo.startsWith("data:image/")) errores.push("La foto no es una imagen válida.");
    else if (o.photo.length > LIMITES.photo) errores.push("La foto es demasiado grande.");
  }
  if (o.geo !== undefined) {
    const g = o.geo as Record<string, unknown> | null;
    const ok =
      g && typeof g === "object" &&
      typeof g.lat === "number" && Math.abs(g.lat) <= 90 &&
      typeof g.lon === "number" && Math.abs(g.lon) <= 180 &&
      typeof g.precisionM === "number" && g.precisionM >= 0;
    if (!ok) errores.push("La ubicación no es válida.");
  }
  return errores;
}

/** Valida el sobre completo que envía el cliente (clientId, fechas y payload). */
export function validarItem(body: unknown): string[] {
  if (!body || typeof body !== "object") return ["El cuerpo no es un objeto."];
  const o = body as Record<string, unknown>;
  const errores: string[] = [];
  if (!texto(o.clientId) || o.clientId.length < 8 || o.clientId.length > 64) errores.push("clientId inválido.");
  if (!fechaIso(o.createdAt)) errores.push("createdAt inválido.");
  if (!fechaIso(o.updatedAt)) errores.push("updatedAt inválido.");
  return [...errores, ...validarPayload(o.payload)];
}
