import { NextResponse } from "next/server";
import { obtenerInfoVersion } from "../../../lib/release";

// Debe responder en cada petición (es la señal que usan el smoke test y el HEALTHCHECK de Docker).
export const dynamic = "force-dynamic";

/**
 * Comprobación de salud y de identidad de la versión. Es pública a propósito: no revela datos,
 * solo el número de versión y el commit que ya son públicos en el repositorio.
 */
export function GET() {
  const { version, commit } = obtenerInfoVersion();
  return NextResponse.json(
    { status: "ok", version, commit },
    { headers: { "Cache-Control": "no-store" } },
  );
}
