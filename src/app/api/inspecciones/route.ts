import { listar, recibir } from "../../../lib/server/inspections-store";
import { proyectarListado, recursoDe } from "../../../lib/server/inspections-access";
import {
  estaIdentificado,
  filtrarVisibles,
  leerJsonLimitado,
  obtenerActor,
  puede,
  validarItemSeguro,
} from "../../../lib/security";

// Siempre dinámica: nunca se prerenderiza ni se cachea.
export const dynamic = "force-dynamic";

const sinIdentidad = () => Response.json({ ok: false, error: "Se requiere identificarse." }, { status: 401 });

export async function POST(request: Request) {
  // 1) Quién eres  2) qué puedes hacer  3) tamaño y forma de lo que envías.
  const actor = obtenerActor(request);
  if (!estaIdentificado(actor)) return sinIdentidad();
  if (!puede(actor, "crear")) return Response.json({ ok: false, error: "No tienes permiso." }, { status: 403 });

  const lectura = await leerJsonLimitado(request);
  if (!lectura.ok) return Response.json({ ok: false, error: lectura.error }, { status: lectura.status });

  const { errores, item } = validarItemSeguro(lectura.body);
  if (!item) return Response.json({ ok: false, errores }, { status: 422 });

  const outcome = recibir(item, undefined, actor.id);
  if (outcome === "forbidden") {
    return Response.json({ ok: false, error: "No tienes permiso sobre ese registro." }, { status: 403 });
  }
  // 201 la primera vez; 200 si era un reenvío (idempotencia): en ambos casos el cliente lo da por recibido.
  return Response.json({ ok: true, outcome }, { status: outcome === "created" ? 201 : 200 });
}

export async function GET(request: Request) {
  const actor = obtenerActor(request);
  if (!estaIdentificado(actor)) return sinIdentidad();
  // Mínimo privilegio: cada actor recibe solo los registros que la política le permite ver.
  const visibles = filtrarVisibles(actor, listar(), recursoDe);
  return Response.json({ items: visibles.map(proyectarListado) });
}
