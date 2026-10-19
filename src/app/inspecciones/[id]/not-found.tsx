import React from "react";
import Link from "next/link";

// Se muestra cuando la página del detalle llama notFound() (ID inexistente).
export default function NoEncontrada() {
  return (
    <section role="status" className="state-message">
      <p>Esa inspección no existe o ya no está disponible.</p>
      <Link href="/inspecciones">Volver al listado</Link>
    </section>
  );
}