import type { ReactNode } from "react";

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="page-shell">
      <header className="hero">
        <p className="eyebrow">Proyecto integrador · Semana 2</p>
        <h1>Inspecciones de laboratorio</h1>
        <p className="lead">
          Registro de mantenimiento para trabajar con conectividad intermitente.
          Los datos mostrados son sintéticos.
        </p>
        <span className="status">Shell instalable · PWA offline aún no implementada</span>
      </header>

      <main>{children}</main>

      <footer className="footer">
        <p>Aplicaciones Web Progresivas · Universidad Tecnológica de Tehuacán</p>
      </footer>
    </div>
  );
}