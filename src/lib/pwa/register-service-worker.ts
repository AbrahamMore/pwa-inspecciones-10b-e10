export function registerServiceWorker(): void {
  if (typeof window === "undefined") return;
  if (!("serviceWorker" in navigator)) return;

  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing;
          if (!newWorker) return;

          newWorker.addEventListener("statechange", () => {
            if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
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
  });
}