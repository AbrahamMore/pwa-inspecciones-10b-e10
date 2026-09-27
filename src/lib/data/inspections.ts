export type InspectionStatus = "ok" | "attention";

export type Inspection = {
  id: string;
  location: string;
  date: string;
  inspector: string;
  status: InspectionStatus;
  statusLabel: string;
  findings: number;
  summary: string;
};

export const inspections: Inspection[] = [
  {
    id: "inspection-001",
    location: "Laboratorio de Redes",
    date: "2026-08-28",
    inspector: "Técnica A",
    status: "ok",
    statusLabel: "Sin incidencias",
    findings: 0,
    summary: "Revisión visual de cableado, ventilación y estaciones de trabajo."
  },
  {
    id: "inspection-002",
    location: "Laboratorio de Electrónica",
    date: "2026-08-27",
    inspector: "Técnico B",
    status: "attention",
    statusLabel: "Requiere atención",
    findings: 2,
    summary: "Se registraron dos observaciones sintéticas para seguimiento de mantenimiento."
  },
  {
    id: "inspection-003",
    location: "Laboratorio de Software",
    date: "2026-08-26",
    inspector: "Técnica C",
    status: "ok",
    statusLabel: "Sin incidencias",
    findings: 0,
    summary: "Comprobación de equipo, señalización y disponibilidad del espacio."
  }
];

// Agregar al final del archivo existente, conservando `inspections` y el tipo `Inspection`.

export function filtrarInspecciones(items: Inspection[], query: string): Inspection[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return items;
  return items.filter((item) =>
    item.location.toLowerCase().includes(normalized) ||
    item.summary.toLowerCase().includes(normalized)
  );
}

export async function getInspeccionById(id: string): Promise<Inspection | undefined> {
  // Simula una consulta asíncrona sobre el fixture sintético.
  return new Promise((resolve) => {
    setTimeout(() => resolve(inspections.find((item) => item.id === id)), 200);
  });
}
