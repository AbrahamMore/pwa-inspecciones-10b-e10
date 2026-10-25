"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSync } from "./sync-provider";

const ENLACES = [
  { href: "/", etiqueta: "Inicio" },
  { href: "/inspecciones", etiqueta: "Inspecciones" },
  { href: "/inspecciones/nueva", etiqueta: "Nueva inspección" },
];

/** Navegación principal visible en todas las pantallas, con estado de conexión y pendientes. */
export function AppNav() {
  const pathname = usePathname();
  const { online, items } = useSync();
  const pendientes = items.filter((i) => i.status !== "synced").length;

  return (
    <header className="topbar">
      <nav aria-label="Principal" className="topbar-nav">
        <Link href="/" className="topbar-brand">
          Inspecciones UTT
        </Link>
        <ul className="topbar-links">
          {ENLACES.map((e) => (
            <li key={e.href}>
              <Link href={e.href} aria-current={pathname === e.href ? "page" : undefined}>
                {e.etiqueta}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <div className="topbar-status" role="status">
        <span className={`sync-pill ${online ? "sync-online" : "sync-offline"}`}>
          {online ? "Con conexión" : "Sin conexión"}
        </span>
        {pendientes > 0 && <span className="sync-pill sync-pending">{pendientes} por enviar</span>}
      </div>
    </header>
  );
}
