"use client";

import { useEffect, useState } from "react";
import { AppShell } from "../components/app-shell";
import { inspections as syntheticInspections, type Inspection } from "../lib/data/inspections";

type LoadState = "loading" | "error" | "empty" | "ready";

// Simula una carga asíncrona sobre los datos sintéticos locales.
// En una semana posterior esto se conectará a almacenamiento real (offline/sincronización).
async function fetchInspections(): Promise<Inspection[]> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(syntheticInspections), 400);
  });
}

export default function HomePage() {
  const [state, setState] = useState<LoadState>("loading");
  const [data, setData] = useState<Inspection[]>([]);

  useEffect(() => {
    let active = true;

    fetchInspections()
      .then((result) => {
        if (!active) return;
        if (result.length === 0) {
          setState("empty");
        } else {
          setData(result);
          setState("ready");
        }
      })
      .catch(() => {
        if (active) setState("error");
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <AppShell>
      {state === "loading" && (
        <p role="status" className="state-message">
          Cargando inspecciones...
        </p>
      )}

      {state === "error" && (
        <p role="alert" className="state-message">
          Ocurrió un error al cargar las inspecciones. Intenta de nuevo más tarde.
        </p>
      )}

      {state === "empty" && (
        <p className="state-message">No hay inspecciones registradas todavía.</p>
      )}

      {state === "ready" && (
        <section aria-labelledby="inspections-heading" className="content-section">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Datos de demostración</p>
              <h2 id="inspections-heading">Inspecciones recientes</h2>
            </div>
            <span className="count">{data.length} registros</span>
          </div>

          <div className="inspection-grid">
            {data.map((inspection) => (
              <article className="inspection-card" key={inspection.id}>
                <div className="card-topline">
                  <span className={`badge badge-${inspection.status}`}>{inspection.statusLabel}</span>
                  <span className="muted">{inspection.date}</span>
                </div>
                <h3>{inspection.location}</h3>
                <p>{inspection.summary}</p>
                <dl>
                  <div>
                    <dt>Responsable</dt>
                    <dd>{inspection.inspector}</dd>
                  </div>
                  <div>
                    <dt>Hallazgos</dt>
                    <dd>{inspection.findings}</dd>
                  </div>
                </dl>
              </article>
            ))}
          </div>
        </section>
      )}
    </AppShell>
  );
}