import assert from "node:assert/strict";
import { registerServiceWorker, type SwEnv } from "../../src/lib/pwa/register-service-worker";

const tick = () => new Promise((r) => setTimeout(r, 0));
const fakeSw = (calls: string[]): SwEnv["serviceWorker"] => ({
  controller: null,
  register: async (url: string) => {
    calls.push(url);
    return { installing: null, addEventListener: () => {} };
  },
});

// Página ya cargada (caso real tras hidratar): debe registrar de inmediato, sin esperar "load".
const calls1: string[] = [];
let esperoLoad = false;
registerServiceWorker({ serviceWorker: fakeSw(calls1), readyState: "complete", onLoad: () => { esperoLoad = true; } });
await tick();
assert.deepEqual(calls1, ["/sw.js"], "con la página cargada debe registrar /sw.js de inmediato");
assert.equal(esperoLoad, false, "no debe quedarse esperando un evento load que ya pasó");

// Página aún cargando: espera al evento load y entonces registra.
const calls2: string[] = [];
let dispararLoad: () => void = () => {};
registerServiceWorker({ serviceWorker: fakeSw(calls2), readyState: "loading", onLoad: (cb) => { dispararLoad = cb; } });
await tick();
assert.equal(calls2.length, 0, "mientras carga no debe registrar todavía");
dispararLoad();
await tick();
assert.deepEqual(calls2, ["/sw.js"]);

// Navegador sin soporte: no lanza errores.
assert.doesNotThrow(() => registerServiceWorker(null));

console.log("sw-register.spec.ts: PASS");