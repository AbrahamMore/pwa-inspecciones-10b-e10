import assert from "node:assert/strict";
import { obtenerUbicacion, redondear } from "../src/lib/device/geolocation";
import { abrirCamara, cerrarCamara, CAMERA_FALLBACK_INPUT } from "../src/lib/device/camera";
import { leerPermiso, pedirPermiso, mostrarRecordatorio } from "../src/lib/notifications/client";

// --- Geolocalización ---
assert.equal((await obtenerUbicacion(null as never)).status, "unsupported");
assert.equal((await obtenerUbicacion({ getCurrentPosition: (_ok, err) => err({ code: 1 }) })).status, "denied");
assert.equal((await obtenerUbicacion({ getCurrentPosition: (_ok, err) => err({ code: 3 }) })).status, "error");
const g = await obtenerUbicacion({
  getCurrentPosition: (ok) => ok({ coords: { latitude: 18.46789, longitude: -97.39234, accuracy: 20.4 } }),
});
assert.deepEqual(g, { status: "ok", data: { lat: 18.468, lon: -97.392, precisionM: 20 } });
assert.equal(redondear(1.23456), 1.235, "la ubicación se redondea (minimización de datos)");

// --- Cámara ---
assert.equal((await abrirCamara({} as never)).status, "unsupported");
const denied = await abrirCamara({ getUserMedia: async () => { throw { name: "NotAllowedError" }; } });
assert.equal(denied.status, "denied");
const nocam = await abrirCamara({ getUserMedia: async () => { throw { name: "NotFoundError" }; } });
assert.equal(nocam.status, "unsupported");
let pedido: { video: unknown; audio: boolean } | undefined;
let detenidas = 0;
const stream = { getTracks: () => [{ stop: () => detenidas++ }, { stop: () => detenidas++ }] };
const okCam = await abrirCamara({ getUserMedia: async (c) => { pedido = c; return stream; } });
assert.equal(okCam.status, "ok");
assert.equal(pedido?.audio, false, "no se pide micrófono (permiso mínimo)");
assert.equal(cerrarCamara(stream), 2);
assert.equal(detenidas, 2, "al cerrar se detienen todas las pistas");
assert.equal(cerrarCamara(null), 0);
assert.equal(CAMERA_FALLBACK_INPUT.capture, "environment", "existe fallback con input file");

// --- Notificaciones ---
assert.equal(leerPermiso({}), "unsupported");
assert.equal((await pedirPermiso({})).status, "unsupported");
let solicitudes = 0;
const mk = (permission: "default" | "granted" | "denied", resp: "granted" | "denied" = "granted") => ({
  permission,
  requestPermission: async () => { solicitudes++; return resp; },
});
assert.equal((await pedirPermiso({ Notification: mk("denied") })).status, "denied");
assert.equal(solicitudes, 0, "si ya está bloqueado no se vuelve a preguntar");
assert.equal((await pedirPermiso({ Notification: mk("default", "denied") })).status, "denied");
assert.equal((await pedirPermiso({ Notification: mk("default", "granted") })).status, "ok");
assert.equal((await pedirPermiso({ Notification: mk("granted") })).status, "ok");

let mostradas: string[] = [];
const sw = { ready: Promise.resolve({ showNotification: async (t: string) => { mostradas.push(t); } }) };
assert.equal((await mostrarRecordatorio("x", "y", { Notification: mk("default"), serviceWorker: sw })).status, "denied");
assert.equal(mostradas.length, 0, "sin permiso no se muestra nada");
assert.equal((await mostrarRecordatorio("x", "y", { Notification: mk("granted") })).status, "unsupported");
assert.equal((await mostrarRecordatorio("Revisar", "Lab Redes", { Notification: mk("granted"), serviceWorker: sw })).status, "ok");
assert.deepEqual(mostradas, ["Revisar"]);

console.log("capabilities.spec.ts: PASS");
