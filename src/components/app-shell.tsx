import React, { type ReactNode } from "react";
import Link from "next/link";

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="page-shell">
      <header className="hero">
        <p className="eyebrow">Proyecto integrador</p>
        <h1>Inspecciones de laboratorio</h1>
        <p className="lead">
          Registro de mantenimiento para trabajar con conectividad intermitente.
          Los datos mostrados son sintéticos.
        </p>
        <span className="status">PWA instalable · funciona sin conexión</span>
        <div className="hero-actions">
          <Link href="/inspecciones/nueva" className="btn btn-light">
            Registrar inspección
          </Link>
          <Link href="/inspecciones" className="btn btn-ghost">
            Ver inspecciones
          </Link>
        </div>
      </header>

      <main>{children}</main>

      <footer className="footer">
        <p>Aplicaciones Web Progresivas · Universidad Tecnológica de Tehuacán</p>
      </footer>
    </div>
  );
}