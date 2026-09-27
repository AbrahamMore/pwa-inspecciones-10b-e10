import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  inspections,
  filtrarInspecciones,
  getInspeccionById
} from "../src/lib/data/inspections";
import { LoadingState } from "../src/components/loading-state";
import DetalleInspeccionPage from "../src/app/inspecciones/[id]/page";

// 1. Filtrado real: debe reducir resultados con una búsqueda válida.
const filtradoTodo = filtrarInspecciones(inspections, "");
assert.equal(filtradoTodo.length, inspections.length, "Sin query debe devolver todos los items");

const primerItem = inspections[0];
const palabraClave = primerItem.location.split(" ")[0].toLowerCase();
const filtrado = filtrarInspecciones(inspections, palabraClave);
assert.ok(filtrado.length > 0, "Debe encontrar al menos un resultado con una palabra real del fixture");
assert.ok(
  filtrado.every((item) => item.location.toLowerCase().includes(palabraClave)),
  "Todos los resultados filtrados deben contener la palabra buscada"
);

const filtradoVacio = filtrarInspecciones(inspections, "xyzxyzxyz-no-existe");
assert.equal(filtradoVacio.length, 0, "Una búsqueda sin coincidencias debe devolver vacío (empty state)");

// 2. getInspeccionById: comportamiento real de la ruta SSR.
const encontrada = await getInspeccionById(primerItem.id);
assert.ok(encontrada, "Debe encontrar una inspección con un ID real del fixture");
assert.equal(encontrada?.location, primerItem.location);

const noEncontrada = await getInspeccionById("id-que-no-existe");
assert.equal(noEncontrada, undefined, "Debe devolver undefined para un ID inexistente");

// 3. LoadingState: contrato de accesibilidad real, no solo texto.
const loadingHtml = renderToStaticMarkup(createElement(LoadingState));
assert.match(loadingHtml, /aria-busy="true"/, "LoadingState debe exponer aria-busy");
assert.match(loadingHtml, /Cargando/, "LoadingState debe mostrar un mensaje de carga entendible");

// 4. Ruta de detalle SSR: contenido real con un ID válido.
const htmlDetalle = renderToStaticMarkup(
  await DetalleInspeccionPage({ params: { id: primerItem.id } })
);
assert.match(htmlDetalle, new RegExp(primerItem.location), "El detalle debe mostrar el laboratorio correcto");

// 5. Ruta de detalle SSR con ID inexistente: debe activar notFound().
await assert.rejects(
  () => DetalleInspeccionPage({ params: { id: "id-que-no-existe" } }),
  "Un ID inexistente debe disparar notFound()"
);

console.log("rendering.spec.ts: PASS");
