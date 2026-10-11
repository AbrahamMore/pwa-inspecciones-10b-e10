import { CapabilityResult } from "./types";

export type Ubicacion = { lat: number; lon: number; precisionM: number };

/** Subconjunto de navigator.geolocation que usamos (permite inyectar un falso en pruebas). */
export type GeolocationLike = {
  getCurrentPosition(
    ok: (p: { coords: { latitude: number; longitude: number; accuracy: number } }) => void,
    err: (e: { code: number }) => void,
    opts?: { enableHighAccuracy?: boolean; timeout?: number; maximumAge?: number }
  ): void;
};

/** Redondea a 3 decimales (~110 m): suficiente para "en qué laboratorio estoy" y menos invasivo. */
export function redondear(n: number): number {
  return Math.round(n * 1000) / 1000;
}

/**
 * Pide UNA lectura de ubicación. Debe llamarse desde un clic del usuario,
 * nunca al cargar la página. Sin watchPosition: no hay seguimiento continuo.
 */
export function obtenerUbicacion(
  geo: GeolocationLike | undefined = typeof navigator !== "undefined" ? navigator.geolocation : undefined
): Promise<CapabilityResult<Ubicacion>> {
  if (!geo) {
    return Promise.resolve({ status: "unsupported", reason: "Este dispositivo no ofrece geolocalización. Escribe el laboratorio manualmente." });
  }
  return new Promise((resolve) => {
    geo.getCurrentPosition(
      (p) =>
        resolve({
          status: "ok",
          data: { lat: redondear(p.coords.latitude), lon: redondear(p.coords.longitude), precisionM: Math.round(p.coords.accuracy) },
        }),
      (e) => {
        if (e.code === 1) resolve({ status: "denied", reason: "Permiso de ubicación denegado. Puedes continuar sin ubicación." });
        else resolve({ status: "error", reason: "No se pudo obtener la ubicación. Intenta de nuevo o continúa sin ella." });
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 60000 }
    );
  });
}