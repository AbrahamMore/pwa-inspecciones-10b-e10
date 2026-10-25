import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { registerServiceWorker, type SwEnv } from "../../src/lib/pwa/register-service-worker";

const tick = () => new Promise((r) => setTimeout(r, 0));

type Handler = () => void;
function escenario(opts: { controller: boolean; yaEsperando?: boolean }) {
  const mensajes: unknown[] = [];
  let recargas = 0;
  const handlers: Record<string, Handler> = {};
  const worker = {
    state: "installing",
    listeners: [] as Handler[],
    addEventListener(_t: "statechange", l: Handler) { this.listeners.push(l); },
    postMessage(m: unknown) { mensajes.push(m); },
  };
  let alUpdateFound: Handler = () => {};
  const registration = {
    installing: worker as typeof worker | null,
    waiting: opts.yaEsperando ? ({ ...worker, state: "installed" } as typeof worker) : null,
    addEventListener: (_t: "updatefound", l: Handler) => { alUpdateFound = l; },
  };
  const env: SwEnv = {
    serviceWorker: {
      controller: opts.controller ? {} : null,
      register: async () => registration,
      addEventListener: (t, l) => { handlers[t] = l; },
    },
    readyState: "complete",
    onLoad: () => {},
    recargar: () => { recargas++; },
  };
  return { env, worker, mensajes, handlers, recargas: () => recargas, disparar: () => alUpdateFound(), registration };
}

// 1) Hay controlador previo y se instala una versión nueva: se avisa, pero NO se activa sola.
{
  const s = escenario({ controller: true });
  let activar: (() => void) | null = null;
  registerServiceWorker(s.env, (fn) => { activar = fn; });
  await tick();
  s.disparar();
  s.worker.state = "installed";
  s.worker.listeners.forEach((l) => l());
  assert.ok(activar, "debe avisar que hay una versión nueva");
  assert.deepEqual(s.mensajes, [], "no debe activarse sin acción del usuario");
  // 2) El usuario pulsa "Actualizar": se envía SKIP_WAITING y, al cambiar el control, se recarga UNA vez.
  (activar as unknown as () => void)();
  assert.deepEqual(s.mensajes, ["SKIP_WAITING"]);
  s.handlers["controllerchange"]();
  s.handlers["controllerchange"]();
  assert.equal(s.recargas(), 1, "debe recargar una sola vez");
}

// 3) Primera instalación (sin controlador previo): no hay nada que actualizar, no se muestra aviso.
{
  const s = escenario({ controller: false });
  let avisos = 0;
  registerServiceWorker(s.env, () => { avisos++; });
  await tick();
  s.disparar();
  s.worker.state = "installed";
  s.worker.listeners.forEach((l) => l());
  assert.equal(avisos, 0, "la primera instalación no es una actualización");
}

// 4) Si al recargar ya había una versión esperando, también se avisa.
{
  const s = escenario({ controller: true, yaEsperando: true });
  let avisos = 0;
  registerServiceWorker(s.env, () => { avisos++; });
  await tick();
  assert.equal(avisos, 1);
}

// 5) Integración real: el aviso está en la interfaz y el service worker sigue sin saltarse la espera por sí solo.
const comp = readFileSync("src/components/sw-register.tsx", "utf8");
assert.ok(comp.includes("Actualizar") && comp.includes("registerServiceWorker(undefined"), "el componente debe mostrar el aviso");
const sw = readFileSync("public/sw.js", "utf8");
const install = sw.slice(sw.indexOf('addEventListener("install"'), sw.indexOf('addEventListener("activate"'));
assert.ok(!install.includes("skipWaiting()"), "install no debe saltarse la espera");
assert.ok(sw.includes('"SKIP_WAITING"'), "el service worker debe aceptar SKIP_WAITING");

console.log("sw-update.spec.ts: PASS");
