"use client";

import React, { useEffect, useState } from "react";
import { registerServiceWorker } from "../lib/pwa/register-service-worker";

export function SwRegister() {
  const [activar, setActivar] = useState<(() => void) | null>(null);

  useEffect(() => {
    // setActivar(() => fn) guarda la función; sin el envoltorio React la ejecutaría como actualizador.
    registerServiceWorker(undefined, (fn) => setActivar(() => fn));
  }, []);

  if (!activar) return null;

  return (
    <div className="update-banner" role="status">
      <span>Hay una versión nueva de la app. Tus registros guardados no se pierden.</span>
      <button type="button" onClick={activar}>
        Actualizar
      </button>
      <button type="button" className="update-later" onClick={() => setActivar(null)}>
        Después
      </button>
    </div>
  );
}
