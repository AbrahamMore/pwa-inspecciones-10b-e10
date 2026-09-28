# ADR-002 — Decisión de renderizado CSR/SSR

## Estado

Aceptada para la implementación actual de Semana 4.

## Contexto

El listado de inspecciones (`/inspecciones`) permite buscar por laboratorio o hallazgo y actualizar los resultados sin recargar la página. El detalle (`/inspecciones/[id]`) debe presentar los datos de una inspección concreta al abrir directamente su URL y responder de forma controlada cuando el identificador no existe.

## Decisión

`/inspecciones` usa un Client Component, indicado por `"use client"`, para gestionar el estado de búsqueda (`query`) y filtrar localmente con `filtrarInspecciones`. La función `fetchInspections` devuelve los fixtures sintéticos después de una espera simulada; un `useEffect` actualiza el estado y la interfaz muestra carga, error o resultados. El filtrado busca en el nombre del laboratorio y el resumen.

`/inspecciones/[id]` es un Server Component asíncrono: espera `getInspeccionById` y renderiza el detalle con los datos del fixture. Si no encuentra la ID, llama a `notFound()` de `next/navigation`.

En Next.js App Router, que una ruta use un Client Component no significa que el HTML inicial necesariamente se genere solo en el navegador: Next.js puede prerenderizar el componente. En este listado, ese HTML inicial representa el estado de carga; la obtención local de los fixtures y el filtrado interactivo ocurren en el cliente tras ejecutarse el efecto.

## Consecuencias

**Listado (CSR para datos e interacción):** el filtrado es inmediato y local, sin una solicitud al servidor por cada cambio de búsqueda. A cambio, la lista completa aparece después de la carga simulada y depende de que JavaScript se ejecute. La interfaz inicial puede mostrar el estado de carga prerenderizado por Next.js.

**Detalle (Server Component):** el servidor resuelve el dato antes de producir la salida del detalle, y `notFound()` maneja una ID inexistente dentro del enrutamiento de Next.js. La función de datos simula una espera de 200 ms sobre fixtures locales; una fuente real podría añadir latencia de servidor.

## Riesgo de hydration mismatch

La página de detalle no tiene `"use client"` y no usa `Date.now()` ni `Math.random()`. La fecha visible proviene de `inspeccion.date`, un valor fijo del fixture. Los Server Components no se hidratan como Client Components. No se identifica en esta ruta una fuente de contenido variable entre renderizados; esto no equivale a una prueba automatizada general de hydration para toda la aplicación.

## Evidencia y limitaciones

- `tests/rendering.spec.ts` comprueba el filtrado con búsqueda vacía, coincidente y sin coincidencias; la consulta de una ID existente e inexistente; el marcado accesible de `LoadingState`; y el HTML del detalle para una ID existente.
- Para la ID inexistente, la prueba invoca directamente la función de página y comprueba que la llamada a `notFound()` provoque un rechazo. No es una prueba E2E ni comprueba una respuesta HTTP 404 real en un navegador.
- La búsqueda en el input no se prueba como interacción de interfaz en un navegador; se prueba la función pura `filtrarInspecciones`. El proyecto no tiene Playwright configurado.
- `fetchInspections` siempre resuelve con el fixture actual, por lo que el estado de error del listado está implementado pero no se ejercita con un fallo real de fuente de datos.
- No se ha documentado una medición de rendimiento. TTFB y tiempo hasta contenido visible quedan pendientes de medir y registrar con herramientas del navegador; no se atribuye aquí ningún valor.