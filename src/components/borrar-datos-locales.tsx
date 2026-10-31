"use client";

import { useState } from "react";
import { borrarDatosLocales } from "../lib/security/local-data";

// Permite al usuario borrar los datos de inspecciones guardados en este dispositivo
// (útil en un equipo compartido o antes de entregarlo). Los registros ya sincronizados
// siguen en el servidor; los pendientes se pierden, por eso se pide confirmación.
export function BorrarDatosLocales() {
  const [error, setError] = useState(false);

  async function borrar() {
    const ok = window.confirm(
      "Se borrarán de este dispositivo los registros guardados, incluidos los que aún no se han sincronizado. ¿Continuar?",
    );
    if (!ok) return;
    try {
      await borrarDatosLocales();
      window.location.reload();
    } catch {
      setError(true);
    }
  }

  return (
    <section aria-labelledby="privacidad" className="content-section">
      <h2 id="privacidad">Privacidad en este dispositivo</h2>
      <p className="muted">
        Las inspecciones capturadas (incluidas fotos y ubicación aproximada) se guardan aquí hasta sincronizarse.
      </p>
      <button type="button" className="btn-borrar" onClick={borrar}>
        Borrar datos de este dispositivo
      </button>
      {error && (
        <p role="status" className="state-message">
          No se pudieron borrar los datos. Intenta de nuevo.
        </p>
      )}
    </section>
  );
}
