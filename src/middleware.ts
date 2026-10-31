import { NextResponse, type NextRequest } from "next/server";
import { CABECERAS_BASE, construirCSP, crearNonce } from "./lib/security/headers";

// Añade a cada página y respuesta de la API una CSP con nonce (distinto en cada respuesta)
// y las cabeceras de seguridad base. Next.js lee el nonce de la CSP de la PETICIÓN y se lo pone
// a sus propios scripts; por eso el layout es dinámico (ver src/app/layout.tsx).
export function middleware(request: NextRequest) {
  const nonce = crearNonce();
  const csp = construirCSP({ nonce, dev: process.env.NODE_ENV !== "production" });

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", csp);
  for (const [nombre, valor] of Object.entries(CABECERAS_BASE)) response.headers.set(nombre, valor);
  return response;
}

export const config = {
  // No se aplica a recursos estáticos: el service worker, la página offline (tiene un estilo en línea),
  // íconos y los archivos de build. Esos archivos no ejecutan scripts de la página.
  matcher: ["/((?!_next/static|_next/image|icons/|sw\\.js|offline\\.html|favicon\\.ico|robots\\.txt).*)"],
};
