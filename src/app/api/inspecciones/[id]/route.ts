import { obtenerPorId } from "../../../../lib/server/inspections-store";
import { proyectarDetalle, recursoDe } from "../../../../lib/server/inspections-access";
import { estaIdentificado, obtenerActor, puede } from "../../../../lib/security";

export const dynamic = "force-dynamic";

// Detalle de un registro por su clientId. La autorización se decide AQUÍ, en el servidor,
// y no depende de que la interfaz oculte enlaces. Si el registro no existe o no es tuyo,
// la respuesta es la misma (404): no se revela si el identificador existe.
export async function GET(request: Request, { params }: { params: { id: string } }) {
  const actor = obtenerActor(request);
  if (!estaIdentificado(actor)) {
    return Response.json({ ok: false, error: "Se requiere identificarse." }, { status: 401 });
  }
  const registro = obtenerPorId(params.id);
  if (!registro || !puede(actor, "ver", recursoDe(registro))) {
    return Response.json({ ok: false, error: "No encontrado." }, { status: 404 });
  }
  return Response.json({ item: proyectarDetalle(registro) });
}
