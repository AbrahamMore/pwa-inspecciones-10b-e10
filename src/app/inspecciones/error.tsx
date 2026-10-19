"use client";

import React from "react";

// Límite de error del listado de inspecciones.
export default function ErrorListado({ reset }: { error: Error; reset: () => void }) {
  return (
    <section role="alert" className="state-message">
      <p>Ocurrió un error en el listado de inspecciones.</p>
      <button type="button" onClick={() => reset()}>
        Reintentar
      </button>
    </section>
  );
}