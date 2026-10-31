// Content-Security-Policy y cabeceras de seguridad.
// La CSP es una capa adicional contra XSS: NO sustituye escapar el contenido (React lo hace por defecto)
// ni validar en el servidor. Los scripts se autorizan con un nonce por respuesta, sin 'unsafe-inline'.

export type OpcionesCSP = { nonce: string; dev?: boolean };

/** Valor aleatorio por respuesta (Web Crypto: funciona en el runtime de middleware y en Node 20). */
export function crearNonce(): string {
  return btoa(crypto.randomUUID());
}

export function construirCSP({ nonce, dev = false }: OpcionesCSP): string {
  const directivas: Record<string, string[]> = {
    "default-src": ["'self'"],
    // En desarrollo React necesita eval para el refresco en caliente; en producción no.
    // Sin 'strict-dynamic' a propósito: con él, cualquier script creado por código (createElement) se
    // considera de confianza aunque sea en línea y no lleve nonce. Aquí solo se aceptan archivos del
    // propio origen y los scripts en línea que llevan el nonce de la respuesta.
    "script-src": ["'self'", `'nonce-${nonce}'`, ...(dev ? ["'unsafe-eval'"] : [])],
    "style-src": ["'self'", ...(dev ? ["'unsafe-inline'"] : [])],
    // data: y blob: porque la foto capturada se previsualiza como data URL / blob.
    "img-src": ["'self'", "data:", "blob:"],
    "font-src": ["'self'"],
    "connect-src": ["'self'", ...(dev ? ["ws:", "wss:"] : [])],
    "media-src": ["'self'", "blob:"],
    "worker-src": ["'self'"],
    "manifest-src": ["'self'"],
    "object-src": ["'none'"],
    "base-uri": ["'self'"],
    "form-action": ["'self'"],
    "frame-ancestors": ["'none'"],
  };
  return Object.entries(directivas)
    .map(([nombre, valores]) => `${nombre} ${valores.join(" ")}`)
    .join("; ");
}

/** Cabeceras que se añaden a todas las respuestas de páginas y de la API. */
export const CABECERAS_BASE: Record<string, string> = {
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  // La app solo usa cámara y ubicación (y solo en su propio origen); el resto, desactivado.
  "Permissions-Policy": "camera=(self), geolocation=(self), microphone=(), payment=(), usb=()",
  "X-Frame-Options": "DENY",
};
