type WorkerLike = {
  state: string;
  addEventListener(type: "statechange", listener: () => void): void;
  postMessage?(mensaje: unknown): void;
};
type RegistrationLike = {
  installing: WorkerLike | null;
  waiting?: WorkerLike | null;
  addEventListener(type: "updatefound", listener: () => void): void;
};
export type SwEnv = {
  serviceWorker: {
    controller: unknown;
    register(url: string): Promise<RegistrationLike>;
    addEventListener?(type: "controllerchange", listener: () => void): void;
  };
  readyState: string;
  onLoad(callback: () => void): void;
  /** Recarga la página (se inyecta para poder probarlo sin navegador). */
  recargar?: () => void;
};

/** Se llama cuando hay una versión nueva esperando. `activar` la pone en marcha y recarga. */
export type AlHaberActualizacion = (activar: () => void) => void;

function envActual(): SwEnv | null {
  if (typeof window === "undefined") return null;
  if (!("serviceWorker" in navigator)) return null;
  return {
    serviceWorker: navigator.serviceWorker as unknown as SwEnv["serviceWorker"],
    readyState: document.readyState,
    onLoad: (callback) => window.addEventListener("load", callback, { once: true }),
    recargar: () => window.location.reload(),
  };
}

export function registerServiceWorker(env: SwEnv | null = envActual(), alHaberActualizacion?: AlHaberActualizacion): void {
  if (!env) return;

  // Actualización segura: la versión nueva se instala pero espera. Solo se activa cuando el usuario
  // lo decide (botón "Actualizar"): se le envía SKIP_WAITING y, al cambiar el control, se recarga una vez.
  const avisar = (worker: WorkerLike) => {
    if (!alHaberActualizacion) return;
    alHaberActualizacion(() => {
      let recargado = false;
      env.serviceWorker.addEventListener?.("controllerchange", () => {
        if (recargado) return;
        recargado = true;
        env.recargar?.();
      });
      worker.postMessage?.("SKIP_WAITING");
    });
  };

  const registrar = () => {
    env.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        // Caso: el usuario recargó y la versión nueva ya estaba esperando.
        if (registration.waiting && env.serviceWorker.controller) avisar(registration.waiting);

        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing;
          if (!newWorker) return;

          newWorker.addEventListener("statechange", () => {
            if (newWorker.state === "installed" && env.serviceWorker.controller) {
              avisar(newWorker);
            }
          });
        });
      })
      .catch((error) => {
        console.error("No se pudo registrar el service worker:", error);
      });
  };

  // Si la página ya terminó de cargar (lo normal cuando React ejecuta este código
  // tras hidratar), el evento "load" ya pasó y esperarlo significaría no registrar nunca.
  if (env.readyState === "complete") registrar();
  else env.onLoad(registrar);
}
