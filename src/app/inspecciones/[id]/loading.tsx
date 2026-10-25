import React from "react";
import { LoadingState } from "../../../components/loading-state";

// Next.js muestra este componente mientras el Server Component del detalle resuelve los datos.
export default function Loading() {
  return <LoadingState message="Cargando detalle de la inspección…" />;
}