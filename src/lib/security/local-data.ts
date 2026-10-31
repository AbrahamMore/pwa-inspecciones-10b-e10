// Borrado de datos locales (privacidad en el dispositivo).
// Lo privado que la PWA deja en el dispositivo es la cola de inspecciones (localStorage):
// nombre del responsable, hallazgos, foto y ubicación aproximada. Las cachés del service worker
// solo guardan el "shell" público y páginas con datos sintéticos; nunca respuestas de /api/.

import { clearQueue } from "../storage/schema";

type CacheStorageMinimo = { keys(): Promise<string[]>; delete(nombre: string): Promise<boolean> };

export type ResumenBorrado = { colaBorrada: boolean; cachesBorradas: number };

/**
 * Borra la cola local. Con `incluirCaches` también borra las cachés del service worker
 * (la app necesitará conexión una vez para volver a abrir sin red).
 */
export async function borrarDatosLocales(
  opciones: { cacheStorage?: CacheStorageMinimo; incluirCaches?: boolean } = {},
): Promise<ResumenBorrado> {
  clearQueue();
  let cachesBorradas = 0;
  if (opciones.incluirCaches && opciones.cacheStorage) {
    const nombres = await opciones.cacheStorage.keys();
    for (const nombre of nombres) {
      if (await opciones.cacheStorage.delete(nombre)) cachesBorradas += 1;
    }
  }
  return { colaBorrada: true, cachesBorradas };
}
