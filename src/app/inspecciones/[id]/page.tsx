import React from "react";

import { notFound } from "next/navigation";
import { getInspeccionById } from "../../../lib/data/inspections";

type PageProps = {
  params: { id: string };
};

export default async function DetalleInspeccionPage({ params }: PageProps) {
  const inspeccion = await getInspeccionById(params.id);

  if (!inspeccion) {
    notFound();
  }

  return (
    <main className="page-shell">
      <article className="inspection-card">
        <span className={`badge badge-${inspeccion!.status}`}>{inspeccion!.statusLabel}</span>
        <h1>{inspeccion!.location}</h1>
        <p className="muted">{inspeccion!.date}</p>
        <p>{inspeccion!.summary}</p>
        <dl>
          <div>
            <dt>Responsable</dt>
            <dd>{inspeccion!.inspector}</dd>
          </div>
          <div>
            <dt>Hallazgos</dt>
            <dd>{inspeccion!.findings}</dd>
          </div>
        </dl>
      </article>
    </main>
  );
}