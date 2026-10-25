import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { AppNav } from "../../src/components/app-nav";
import { SyncProvider } from "../../src/components/sync-provider";
import { AppShell } from "../../src/components/app-shell";

const root = resolve(import.meta.dirname, "..", "..");

// La navegación global lleva a las tres pantallas principales y muestra el estado de conexión.
const nav = renderToStaticMarkup(createElement(SyncProvider, null, createElement(AppNav)));
for (const href of ["/", "/inspecciones", "/inspecciones/nueva"]) {
  assert.ok(nav.includes(`href="${href}"`), `la navegación debe enlazar ${href}`);
}
assert.match(nav, /aria-label="Principal"/, "la navegación debe estar etiquetada para lectores de pantalla");
assert.match(nav, /Con conexión|Sin conexión/, "debe mostrarse el estado de conexión");

// La portada ofrece las acciones principales (el usuario no tiene que conocer las URL).
const portada = renderToStaticMarkup(createElement(AppShell, null, "contenido"));
assert.ok(portada.includes('href="/inspecciones/nueva"'), "la portada debe enlazar el formulario");
assert.ok(portada.includes('href="/inspecciones"'), "la portada debe enlazar el listado");

// El layout monta la navegación y la sincronización global en todas las pantallas.
const layout = await readFile(resolve(root, "src/app/layout.tsx"), "utf8");
assert.match(layout, /<SyncProvider>/, "layout.tsx debe envolver la app con SyncProvider");
assert.match(layout, /<AppNav\s*\/>/, "layout.tsx debe incluir la navegación");

// El listado muestra lo capturado en el dispositivo.
const listado = await readFile(resolve(root, "src/app/inspecciones/page.tsx"), "utf8");
assert.match(listado, /useSync\(\)/, "el listado debe leer las inspecciones capturadas");

console.log("navigation.spec.ts: PASS");
