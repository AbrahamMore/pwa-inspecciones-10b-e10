import assert from "node:assert/strict";
import { ETIQUETAS_SYNC } from "../../src/lib/sync/labels";
import { leerPermiso } from "../../src/lib/notifications/client";

// Cada estado de la cola tiene un texto propio para la persona usuaria.
const estados = ["pending", "syncing", "synced", "error"] as const;
for (const e of estados) assert.ok(ETIQUETAS_SYNC[e].trim().length > 0, `falta el texto de ${e}`);
assert.equal(new Set(estados.map((e) => ETIQUETAS_SYNC[e])).size, 4, "los 4 estados deben verse distintos");
assert.match(ETIQUETAS_SYNC.error, /Sincronizar ahora/, "el error debe decir qué hacer");

// Leer el permiso de notificaciones NO debe pedirlo.
let pedidos = 0;
const notif = (permission: "default" | "granted" | "denied") => ({
  permission,
  requestPermission: async () => {
    pedidos++;
    return permission;
  },
});
assert.equal(leerPermiso({ Notification: notif("granted") }), "granted");
assert.equal(leerPermiso({ Notification: notif("denied") }), "denied");
assert.equal(leerPermiso({ Notification: notif("default") }), "default");
assert.equal(leerPermiso({}), "unsupported");
assert.equal(pedidos, 0, "leer el permiso nunca debe abrir el diálogo");

console.log("labels.spec.ts: PASS");
