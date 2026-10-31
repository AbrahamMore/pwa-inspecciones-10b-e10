// Pruebas de seguridad (Semana 9). Son pruebas NEGATIVAS: demuestran que algo NO pasa.
// Cada bloque protege una amenaza de docs/threat-model.md. Todo usa datos sintéticos.
//
//   A  Identidad: sin identidad válida no se puede nada (denegar por defecto)
//   B  Autorización por rol (mínimo privilegio) sobre la política pura
//   C  API: un inspector no lee registros ajenos (IDOR) y no revela si existen
//   D  API: nadie sobrescribe registros ajenos reenviando su clientId
//   E  Validación en el servidor (el frontend no es la autoridad)
//   F  Minimización: el listado no entrega foto ni propietario
//   G  CSP y cabeceras de seguridad
//   H  Sin patrones de XSS en el código fuente
//   I  robots.txt no es control de acceso ni expone secretos
//   J  Borrado de datos locales

import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { NextRequest } from "next/server";
import { GET, POST } from "../src/app/api/inspecciones/route";
import { GET as GET_DETALLE } from "../src/app/api/inspecciones/[id]/route";
import { middleware } from "../src/middleware";
import {
  CABECERAS_BASE,
  MAX_BODY_BYTES,
  borrarDatosLocales,
  construirCSP,
  crearNonce,
  filtrarVisibles,
  obtenerActor,
  puede,
  validarItemSeguro,
  visitante,
  type Actor,
} from "../src/lib/security";
import { enqueueInspection } from "../src/lib/sync/queue";
import { readQueue } from "../src/lib/storage/schema";

const API = "http://localhost/api/inspecciones";
const LAB_REDES = "Laboratorio de Redes";
const LAB_SOFT = "Laboratorio de Software";

const como = (id: string, rol: string, alcance?: string): Record<string, string> => ({
  "x-demo-actor": id,
  "x-demo-rol": rol,
  ...(alcance ? { "x-demo-alcance": alcance } : {}),
});
const ANA = como("inspectora-ana", "inspector");
const BETO = como("inspector-beto", "inspector");
const SUP_REDES = como("supervisor-1", "supervisor", LAB_REDES);
const SUP_SOFT = como("supervisor-2", "supervisor", LAB_SOFT);

const registro = (clientId: string, extra: Record<string, unknown> = {}, payloadExtra: Record<string, unknown> = {}) => ({
  clientId,
  createdAt: "2026-10-30T10:00:00.000Z",
  updatedAt: "2026-10-30T10:00:00.000Z",
  payload: {
    location: LAB_REDES,
    date: "2026-10-30",
    inspector: "Técnica sintética",
    summary: "",
    findings: "Dos equipos sin conexión de red.",
    ...payloadExtra,
  },
  ...extra,
});
const post = (body: unknown, headers: Record<string, string> = {}) =>
  POST(new Request(API, { method: "POST", headers, body: typeof body === "string" ? body : JSON.stringify(body) }));
const lista = (headers: Record<string, string> = {}) => GET(new Request(API, { headers }));
const detalle = (id: string, headers: Record<string, string> = {}) =>
  GET_DETALLE(new Request(`${API}/${id}`, { headers }), { params: { id } });
const json = async (r: Response) => (await r.json()) as any;

// ---------------------------------------------------------------------------------------------
// A. Identidad: sin identidad válida => visitante => nada
// ---------------------------------------------------------------------------------------------
assert.equal(obtenerActor(undefined).rol, "visitante");
assert.equal(obtenerActor(new Request(API)).rol, "visitante", "sin cabeceras: visitante");
assert.equal(obtenerActor(new Request(API, { headers: como("inspectora-ana", "admin") })).rol, "visitante", "un rol inventado no se acepta");
assert.equal(obtenerActor(new Request(API, { headers: como("x", "inspector") })).rol, "visitante", "id demasiado corto");
assert.equal(obtenerActor(new Request(API, { headers: como("ana; DROP TABLE", "inspector") })).rol, "visitante", "id con caracteres no permitidos");
assert.deepEqual(obtenerActor(new Request(API, { headers: como("inspectora-ana", "inspector", LAB_REDES) })).alcance, [], "un inspector no puede darse alcance");
assert.deepEqual(obtenerActor(new Request(API, { headers: SUP_REDES })).alcance, [LAB_REDES]);

assert.equal((await post(registro("id-visitante-0001"))).status, 401, "visitante no puede crear");
assert.equal((await lista()).status, 401, "visitante no puede listar");
assert.equal((await detalle("id-visitante-0001")).status, 401, "visitante no puede ver detalle");

// ---------------------------------------------------------------------------------------------
// B. Matriz de autorización (política pura)
// ---------------------------------------------------------------------------------------------
const ana: Actor = { id: "inspectora-ana", rol: "inspector", alcance: [] };
const sup: Actor = { id: "supervisor-1", rol: "supervisor", alcance: [LAB_REDES] };
const propio = { ownerId: "inspectora-ana", location: LAB_REDES };
const ajeno = { ownerId: "inspector-beto", location: LAB_REDES };
const sinDueno = { location: LAB_REDES };

assert.equal(puede(ana, "crear"), true);
assert.equal(puede(ana, "ver", propio), true);
assert.equal(puede(ana, "ver", ajeno), false, "inspector NO ve ajenos");
assert.equal(puede(ana, "ver", sinDueno), false, "registro sin dueño: denegado por defecto");
assert.equal(puede(ana, "aprobar", propio), false, "inspector NO aprueba");
assert.equal(puede(sup, "ver", ajeno), true, "supervisor ve dentro de su alcance");
assert.equal(puede(sup, "ver", { ownerId: "x-otro", location: LAB_SOFT }), false, "supervisor NO ve fuera de su alcance");
assert.equal(puede(sup, "aprobar", ajeno), true);
assert.equal(puede(sup, "aprobar", { ownerId: "x-otro", location: LAB_SOFT }), false);
for (const accion of ["crear", "ver", "aprobar"] as const) {
  assert.equal(puede(visitante(), accion, propio), false, `visitante no puede ${accion}`);
}
assert.deepEqual(
  filtrarVisibles(ana, [propio, ajeno], (r) => r),
  [propio],
  "filtrarVisibles solo deja lo que la política permite",
);

// ---------------------------------------------------------------------------------------------
// C. API: lectura de registros ajenos (IDOR)
// ---------------------------------------------------------------------------------------------
const idAna = "sec-ana-0000000001";
const idBeto = "sec-beto-000000001";
assert.equal((await post(registro(idAna), ANA)).status, 201);
assert.equal((await post(registro(idBeto, {}, { location: LAB_SOFT }), BETO)).status, 201);

const listaBeto = (await json(await lista(BETO))).items as { clientId: string }[];
assert.ok(listaBeto.some((i) => i.clientId === idBeto), "Beto ve el suyo");
assert.ok(!listaBeto.some((i) => i.clientId === idAna), "Beto NO ve el registro de Ana en el listado");

assert.equal((await detalle(idAna, ANA)).status, 200, "Ana ve el suyo");
const ajenoRes = await detalle(idAna, BETO);
assert.equal(ajenoRes.status, 404, "Beto pidiendo el id de Ana recibe 404");
const inexistenteRes = await detalle("sec-no-existe-0001", BETO);
assert.equal(inexistenteRes.status, 404);
assert.deepEqual(await json(ajenoRes), await json(inexistenteRes), "ajeno e inexistente son indistinguibles: no se revela si existe");

assert.equal((await detalle(idAna, SUP_REDES)).status, 200, "supervisor con alcance en Redes ve el registro de Redes");
assert.equal((await detalle(idAna, SUP_SOFT)).status, 404, "supervisor de Software NO ve un registro de Redes");
assert.equal((await detalle(idBeto, SUP_SOFT)).status, 200, "pero sí uno de su laboratorio");

// ---------------------------------------------------------------------------------------------
// D. API: no se sobrescribe un registro ajeno reenviando su clientId
// ---------------------------------------------------------------------------------------------
const intento = registro(idAna, { updatedAt: "2026-10-30T23:00:00.000Z" }, { findings: "Texto malicioso de Beto" });
assert.equal((await post(intento, BETO)).status, 403, "Beto no puede pisar el registro de Ana");
assert.equal((await json(await detalle(idAna, ANA))).item.payload.findings, "Dos equipos sin conexión de red.", "el registro de Ana quedó intacto");
assert.equal((await post(registro(idAna), ANA)).status, 200, "el reenvío legítimo de Ana sigue siendo idempotente");

// ---------------------------------------------------------------------------------------------
// E. Validación en el servidor
// ---------------------------------------------------------------------------------------------
// Campos extra: nunca se guardan ni se devuelven.
const idExtra = "sec-extra-00000001";
assert.equal((await post(registro(idExtra, { ownerId: "supervisor-1", admin: true }, { admin: true, rol: "supervisor" }), ANA)).status, 201);
const guardado = (await json(await detalle(idExtra, ANA))).item;
assert.equal(guardado.admin, undefined);
assert.equal(guardado.payload.admin, undefined);
assert.equal(guardado.payload.rol, undefined);
assert.equal(guardado.ownerId, undefined, "ni el ownerId interno se expone ni se acepta del cliente");
assert.equal((await detalle(idExtra, SUP_SOFT)).status, 404, "enviar ownerId falso no cambia quién es el dueño real");

// Foto: solo jpeg/png/webp en base64. SVG (puede llevar script) y otros esquemas se rechazan.
const svg = "data:image/svg+xml;base64,PHN2ZyBvbmxvYWQ9ImFsZXJ0KDEpIi8+";
assert.equal((await post(registro("sec-svg-000000001", {}, { photo: svg }), ANA)).status, 422, "foto SVG rechazada");
assert.equal((await post(registro("sec-js-0000000001", {}, { photo: "javascript:alert(1)" }), ANA)).status, 422);
assert.equal((await post(registro("sec-http-00000001", {}, { photo: "https://ejemplo.invalid/a.jpg" }), ANA)).status, 422);
assert.equal((await post(registro("sec-jpg-0000000001", {}, { photo: "data:image/jpeg;base64,/9j/4AAQSkZJRg==" }), ANA)).status, 201, "JPEG válido aceptado");

// clientId: solo letras, números, guion y guion bajo.
for (const malo of ["../../etc/passwd", "<script>alert(1)</script>", "id con espacios 123", "a".repeat(65), "corto"]) {
  assert.equal((await post(registro(malo), ANA)).status, 422, `clientId inválido rechazado: ${malo.slice(0, 20)}`);
}

// Rangos y longitudes.
assert.equal((await post(registro("sec-geo-0000000001", {}, { geo: { lat: 999, lon: 0, precisionM: 5 } }), ANA)).status, 422, "latitud fuera de rango");
assert.equal((await post(registro("sec-long-000000001", {}, { findings: "x".repeat(1001) }), ANA)).status, 422, "hallazgos demasiado largos");
assert.equal((await post(registro("sec-fecha-00000001", {}, { date: "30/10/2026" }), ANA)).status, 422, "fecha con formato inválido");
assert.equal((await post(registro("sec-vacio-00000001", {}, { location: "   " }), ANA)).status, 422, "laboratorio vacío");

// Forma y tamaño del cuerpo.
assert.equal((await post("{no es json", ANA)).status, 400, "JSON inválido");
assert.equal((await post("x".repeat(MAX_BODY_BYTES + 10), ANA)).status, 413, "cuerpo demasiado grande");
const declarado = new Request(API, { method: "POST", headers: { ...ANA, "content-length": String(MAX_BODY_BYTES + 1) }, body: "{}" });
assert.equal((await POST(declarado)).status, 413, "Content-Length declarado demasiado grande: se rechaza antes de leer");

// Caracteres de control se eliminan; el HTML se guarda como TEXTO (se escapa al mostrar: ver bloque H).
const idTexto = "sec-texto-00000001";
assert.equal((await post(registro(idTexto, {}, { findings: "ho\u0000l\u0007a <b>Urgente</b>" }), ANA)).status, 201);
assert.equal((await json(await detalle(idTexto, ANA))).item.payload.findings, "hola <b>Urgente</b>");

// La función de validación por sí sola también rechaza entradas que no son objetos.
assert.ok(validarItemSeguro(null).errores.length > 0);
assert.ok(validarItemSeguro([]).errores.length > 0);
assert.ok(validarItemSeguro("texto").errores.length > 0);

// ---------------------------------------------------------------------------------------------
// F. Minimización en el listado
// ---------------------------------------------------------------------------------------------
const items = (await json(await lista(ANA))).items as any[];
const conFoto = items.find((i) => i.clientId === "sec-jpg-0000000001");
assert.ok(conFoto, "el registro con foto aparece en el listado de su dueña");
assert.equal(conFoto.payload.photo, undefined, "el listado NO entrega la foto");
assert.equal(conFoto.tieneFoto, true);
assert.ok(items.every((i) => i.ownerId === undefined), "el listado no expone el propietario interno");
assert.ok((await json(await detalle("sec-jpg-0000000001", ANA))).item.payload.photo.startsWith("data:image/jpeg"), "la foto sí llega en el detalle");

// ---------------------------------------------------------------------------------------------
// G. CSP y cabeceras
// ---------------------------------------------------------------------------------------------
const csp = construirCSP({ nonce: "abc123" });
const directiva = (nombre: string, politica = csp) =>
  politica.split("; ").find((d) => d.startsWith(nombre + " "))?.slice(nombre.length + 1) ?? "";
assert.equal(directiva("default-src"), "'self'");
assert.equal(directiva("script-src"), "'self' 'nonce-abc123'");
assert.ok(!directiva("script-src").includes("strict-dynamic"), "sin 'strict-dynamic': no se confía en scripts creados por código");
assert.ok(!directiva("script-src").includes("unsafe-inline"), "sin 'unsafe-inline' en scripts");
assert.ok(!directiva("script-src").includes("unsafe-eval"), "sin 'unsafe-eval' en producción");
assert.equal(directiva("object-src"), "'none'");
assert.equal(directiva("base-uri"), "'self'");
assert.equal(directiva("frame-ancestors"), "'none'");
assert.equal(directiva("form-action"), "'self'");
assert.equal(directiva("connect-src"), "'self'", "la app solo habla con su propio origen");
assert.ok(!/(^|\s)\*(\s|;|$)/.test(csp) && !csp.includes("https:"), "sin comodines ni https: abierto");
assert.ok(directiva("script-src", construirCSP({ nonce: "n", dev: true })).includes("'unsafe-eval'"), "eval solo en desarrollo");
assert.ok(crearNonce().length >= 16 && crearNonce() !== crearNonce(), "el nonce es único por respuesta");
assert.equal(CABECERAS_BASE["X-Content-Type-Options"], "nosniff");
assert.equal(CABECERAS_BASE["X-Frame-Options"], "DENY");
assert.match(CABECERAS_BASE["Permissions-Policy"], /microphone=\(\)/, "el micrófono no se usa y queda desactivado");

// El middleware realmente aplica la CSP, con un nonce distinto en cada respuesta.
const r1 = middleware(new NextRequest("http://localhost/"));
const r2 = middleware(new NextRequest("http://localhost/"));
const csp1 = r1.headers.get("content-security-policy") ?? "";
// (En pruebas el middleware corre en modo desarrollo, donde además se permite 'unsafe-eval'.)
assert.match(csp1, /script-src 'self' 'nonce-[^']+'( 'unsafe-eval')?(;|$)/);
assert.notEqual(csp1, r2.headers.get("content-security-policy"), "cada respuesta lleva otro nonce");
assert.equal(r1.headers.get("x-content-type-options"), "nosniff");
assert.match(readFileSync("src/app/layout.tsx", "utf8"), /dynamic = "force-dynamic"/, "el layout es dinámico para poder llevar el nonce");

// ---------------------------------------------------------------------------------------------
// H. Sin patrones de XSS en el código fuente (contrato barato; frágil ante refactors: ver docs/threat-model.md)
// ---------------------------------------------------------------------------------------------
function archivos(dir: string): string[] {
  return readdirSync(dir).flatMap((nombre) => {
    const ruta = join(dir, nombre);
    return statSync(ruta).isDirectory() ? archivos(ruta) : /\.(ts|tsx|js)$/.test(nombre) ? [ruta] : [];
  });
}
const peligrosos = /dangerouslySetInnerHTML|\.innerHTML\s*=|\.outerHTML\s*=|insertAdjacentHTML|document\.write\(|\beval\(|new Function\(/;
for (const ruta of archivos("src")) {
  assert.ok(!peligrosos.test(readFileSync(ruta, "utf8")), `${ruta} usa un patrón que interpreta texto como código`);
}

// ---------------------------------------------------------------------------------------------
// I. robots.txt
// ---------------------------------------------------------------------------------------------
assert.ok(existsSync("public/robots.txt"), "falta public/robots.txt");
const robots = readFileSync("public/robots.txt", "utf8");
assert.match(robots, /^User-agent: \*$/m);
assert.match(robots, /^Disallow: \/api\/$/m);
assert.ok(!/\.env|secret|token|password|clave/i.test(robots.replace(/^#.*$/gm, "")), "robots.txt no debe listar rutas sensibles ni secretos");
assert.match(robots, /NO es un control de acceso/, "queda dicho que robots.txt no protege nada");

// ---------------------------------------------------------------------------------------------
// J. Borrado de datos locales
// ---------------------------------------------------------------------------------------------
enqueueInspection({ location: LAB_REDES, date: "2026-10-30", inspector: "Técnica sintética", summary: "", findings: "Pendiente local" });
assert.ok(readQueue().length > 0);
const caches = new Map([["inspecciones-lab-v3", 1], ["otra", 2]]);
const falsoCacheStorage = { keys: async () => [...caches.keys()], delete: async (n: string) => caches.delete(n) };
const resumen = await borrarDatosLocales({ cacheStorage: falsoCacheStorage });
assert.deepEqual(readQueue(), [], "la cola local queda vacía");
assert.equal(resumen.cachesBorradas, 0, "por defecto no se tocan las cachés (no guardan datos privados)");
const resumen2 = await borrarDatosLocales({ cacheStorage: falsoCacheStorage, incluirCaches: true });
assert.equal(resumen2.cachesBorradas, 2);
assert.equal(caches.size, 0);

console.log("security.spec.ts: PASS");
