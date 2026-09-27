"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LoadingState } from "../../components/loading-state";
import {
  inspections as syntheticInspections,
  filtrarInspecciones,
  type Inspection
} from "../../lib/data/inspections";

type LoadState = "loading" | "error" | "ready";

async function fetchInspections(): Promise<Inspection[]> {
  return new Promise((resolve) => setTimeout(() => resolve(syntheticInspections), 300));
}

export default function InspeccionesPage() {
  const [state, setState] = useState<LoadState>("loading");
  const [items, setItems] = useState<Inspection[]>([]);
  const [query, setQuery] = useState("");

  useEffect(() => {
    let active = true;
    fetchInspections()
      .then((result) => {
        if (!active) return;
        setItems(result);
        setState("ready");
      })
      .catch(() => {
        if (active) setState("error");
      });
    return () => {
      active = false;
    };
  }, []);

  if (state === "loading") return <LoadingState message="Cargando inspecciones…" />;

  if (state === "error") {
    return (
      <section role="alert" className="state-message">
        Ocurrió un error al cargar las inspecciones. Intenta de nuevo.
      </section>
    );
  }

  const filtered = filtrarInspecciones(items, query);

  return (
    <main className="page-shell">
      <h1>Inspecciones</h1>
      <label htmlFor="q">Buscar</label>
      <input
        id="q"
        type="text"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Laboratorio o hallazgo..."
      />

      {filtered.length === 0 ? (
        <p className="state-message">No hay resultados para esa búsqueda.</p>
      ) : (
        <ul className="inspection-grid">
          {filtered.map((item) => (
            <li key={item.id} className="inspection-card">
              <Link href={`/inspecciones/${item.id}`}>
                <h3>{item.location}</h3>
                <p>{item.summary}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}