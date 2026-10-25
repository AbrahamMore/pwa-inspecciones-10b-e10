import React from "react";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { DevicePanel } from "../../src/components/device-panel";

// 1) El panel se renderiza con sus botones y el alternativo de archivo (cámara nativa); no pide nada al cargar.
const html = renderToStaticMarkup(React.createElement(DevicePanel, { onPhoto() {}, onGeo() {} }));
for (const texto of ["Tomar foto", "Adjuntar foto", "Usar mi ubicación", "Activar recordatorios"]) {
  assert.ok(html.includes(texto), `falta el botón: ${texto}`);
}
assert.ok(html.includes('type="file"') && html.includes('capture="environment"'), "falta el fallback de archivo");
assert.ok(!html.includes("<video"), "la cámara no debe abrirse sola");

// 2) Integración real: el formulario usa el panel, y las capacidades solo se piden desde clics.
const panel = readFileSync("src/components/device-panel.tsx", "utf8");
const form = readFileSync("src/app/inspecciones/nueva/page.tsx", "utf8");
assert.ok(form.includes("<DevicePanel"), "el formulario no usa el panel");
assert.ok(form.includes("mostrarRecordatorio"), "el formulario no usa recordatorios");
assert.ok(form.includes("photo") && form.includes("geo"), "el payload no incluye foto/ubicación");
const efectos = [...panel.matchAll(/useEffect\(\(\) => \{[\s\S]*?\}, \[[^\]]*\]\)/g)].map((m) => m[0]).join("\n");
for (const peligro of ["abrirCamara(", "obtenerUbicacion(", "pedirPermiso(", "requestPermission"]) {
  assert.ok(!efectos.includes(peligro), `${peligro} no debe llamarse al cargar`);
}

console.log("device-integration.spec.ts: PASS");
