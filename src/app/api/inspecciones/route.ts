import { listar, recibir } from "../../../lib/server/inspections-store";
import { validarItem, type ItemEntrante } from "../../../lib/sync/validation";

// Siempre dinámica: nunca se prerenderiza ni se cachea.
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: "JSON inválido" }, { status: 400 });
  }

  const errores = validarItem(body);
  if (errores.length > 0) {
    return Response.json({ ok: false, errores }, { status: 422 });
  }

  const outcome = recibir(body as ItemEntrante);
  // 201 la primera vez; 200 si era un reenvío (idempotencia): en ambos casos el cliente lo da por recibido.
  return Response.json({ ok: true, outcome }, { status: outcome === "created" ? 201 : 200 });
}

export async function GET() {
  return Response.json({ items: listar() });
}
