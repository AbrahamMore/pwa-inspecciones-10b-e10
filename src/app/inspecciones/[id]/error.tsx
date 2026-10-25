"use client";

import React from "react";

// Límite de error de la ruta: se muestra si el Server Component lanza una excepción.
export default function ErrorDetalle({ reset }: { error: Error; reset: () => void }) {
  return (
    <section role="alert" className="state-message">
      <p>No se pudo cargar el detalle de la inspección.</p>
      <button type="button" onClick={() => reset()}>
        Reintentar
      </button>
    </section>
  );
}