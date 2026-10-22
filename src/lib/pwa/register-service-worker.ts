type WorkerLike = {
  state: string;
  addEventListener(type: "statechange", listener: () => void): void;
};
type RegistrationLike = {
  installing: WorkerLike | null;
  addEventListener(type: "updatefound", listener: () => void): void;
};
export type SwEnv = {
  serviceWorker: {
    controller: unknown;
    register(url: string): Promise<RegistrationLike>;
  };
  readyState: string;
  onLoad(callback: () => void): void;
};

function envActual(): SwEnv | null {
  if (typeof window === "undefined") return null;
  if (!("serviceWorker" in navigator)) return null;
  return {
    serviceWorker: navigator.serviceWorker as unknown as SwEnv["serviceWorker"],
    readyState: document.readyState,
    onLoad: (callback) => window.addEventListener("load", callback, { once: true }),
  };
}

export function registerServiceWorker(env: SwEnv | null = envActual()): void {
  if (!env) return;

  const registrar = () => {
    env.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing;
          if (!newWorker) return;

          newWorker.addEventListener("statechange", () => {
            if (newWorker.state === "installed" && env.serviceWorker.controller) {
              // Hay una versión nueva lista, pero no la activamos sola:
              // se necesita una acción explícita (actualización segura).
              console.info("Nueva versión disponible. Recarga la página para actualizar.");
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
