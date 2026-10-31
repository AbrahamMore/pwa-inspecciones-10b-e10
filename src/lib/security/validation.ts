// Validación y saneamiento de lo que llega a la API. El frontend NO es la autoridad:
// cualquiera puede enviar una petición HTTP directa saltándose el formulario.

import { validarItem, type ItemEntrante } from "../sync/validation";

/** Tamaño máximo del cuerpo (foto de hasta 600 000 caracteres + textos + sobre). */
export const MAX_BODY_BYTES = 800_000;

const CLIENT_ID = /^[A-Za-z0-9_-]{8,64}$/;
// Solo imágenes de mapa de bits en base64. Se excluye a propósito image/svg+xml (puede contener script).
const FOTO = /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/]+={0,2}$/;
// Caracteres de control (se conservan salto de línea y tabulador).
const CONTROL = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;

const limpiar = (v: unknown) => (typeof v === "string" ? v.replace(CONTROL, "") : v);
const esObjeto = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);

/**
 * Lista blanca: se queda solo con los campos conocidos y quita caracteres de control.
 * Un campo extra enviado por un atacante nunca se guarda ni se devuelve después.
 * Si la entrada no es un objeto, se devuelve igual para que el validador la rechace.
 */
export function normalizarItem(body: unknown): unknown {
  if (!esObjeto(body)) return body;
  const out: Record<string, unknown> = {
    clientId: body.clientId,
    createdAt: body.createdAt,
    updatedAt: body.updatedAt,
  };
  const p = body.payload;
  if (!esObjeto(p)) {
    out.payload = p;
    return out;
  }
  const payload: Record<string, unknown> = {
    location: limpiar(p.location),
    date: p.date,
    summary: limpiar(p.summary),
    inspector: limpiar(p.inspector),
    findings: limpiar(p.findings),
  };
  if (p.photo !== undefined) payload.photo = p.photo;
  if (p.geo !== undefined) {
    const g = p.geo;
    payload.geo = esObjeto(g) ? { lat: g.lat, lon: g.lon, precisionM: g.precisionM } : g;
  }
  out.payload = payload;
  return out;
}

export type ResultadoValidacion = { errores: string[]; item?: ItemEntrante };

/** Normaliza y valida. Si no hay errores, `item` es lo único que debe guardarse. */
export function validarItemSeguro(body: unknown): ResultadoValidacion {
  const normal = normalizarItem(body);
  const errores = validarItem(normal);

  if (esObjeto(normal)) {
    if (typeof normal.clientId === "string" && !CLIENT_ID.test(normal.clientId)) {
      errores.push("clientId inválido (solo letras, números, guion y guion bajo; 8 a 64 caracteres).");
    }
    const foto = esObjeto(normal.payload) ? normal.payload.photo : undefined;
    if (typeof foto === "string" && !FOTO.test(foto)) {
      errores.push("La foto debe ser una imagen JPEG, PNG o WebP en base64.");
    }
  }
  const unicos = Array.from(new Set(errores));
  return unicos.length > 0 ? { errores: unicos } : { errores: [], item: normal as ItemEntrante };
}

export type LecturaJson = { ok: true; body: unknown } | { ok: false; status: 400 | 413; error: string };

/**
 * Lee el cuerpo como JSON con un tope de tamaño. Responde 413 si es demasiado grande y 400 si no es JSON.
 * Límite conocido: se lee el texto completo antes de medirlo cuando no hay Content-Length;
 * el tope real en producción también lo impone la plataforma de despliegue.
 */
export async function leerJsonLimitado(request: Request, maxBytes = MAX_BODY_BYTES): Promise<LecturaJson> {
  const declarado = Number(request.headers.get("content-length") ?? 0);
  if (Number.isFinite(declarado) && declarado > maxBytes) {
    return { ok: false, status: 413, error: "El cuerpo es demasiado grande." };
  }
  const texto = await request.text();
  if (texto.length > maxBytes) return { ok: false, status: 413, error: "El cuerpo es demasiado grande." };
  try {
    return { ok: true, body: JSON.parse(texto) };
  } catch {
    return { ok: false, status: 400, error: "JSON inválido" };
  }
}
