import React from "react";
import { obtenerInfoVersion } from "../lib/release";

/** Pie de página con la versión y el commit publicados, para poder preguntar "¿qué versión ves?" en un incidente. */
export function VersionBadge() {
  const { version, commitCorto } = obtenerInfoVersion();
  return (
    <footer className="version-badge" aria-label="Versión de la aplicación">
      <span data-testid="app-version">Versión {version}</span>
      <span aria-hidden="true"> · </span>
      <span data-testid="app-commit">commit {commitCorto}</span>
    </footer>
  );
}
