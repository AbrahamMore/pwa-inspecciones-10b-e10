import "./globals.css";
import type { Metadata, Viewport } from "next";
import { SwRegister } from "../components/sw-register";
import { SyncProvider } from "../components/sync-provider";
import { AppNav } from "../components/app-nav";

// Las páginas se generan en cada petición para poder llevar el nonce de la CSP (src/middleware.ts).
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Inspecciones de laboratorio",
  description: "Proyecto base de Aplicaciones Web Progresivas",
  manifest: "/manifest.webmanifest",
  icons: { icon: "/icons/icon-192.png", apple: "/icons/icon-192.png" },
};

export const viewport: Viewport = {
  themeColor: "#0f172a",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es-MX">
      <body>
        <SwRegister />
        <SyncProvider>
          <AppNav />
          {children}
        </SyncProvider>
      </body>
    </html>
  );
}
