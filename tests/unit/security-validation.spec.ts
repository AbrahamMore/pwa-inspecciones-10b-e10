// Casos límite de la validación del servidor (src/lib/security/validation.ts).
// Complementa el bloque E de tests/security.spec.ts, que prueba lo mismo a través de la API.
import assert from "node:assert/strict";
import { MAX_BODY_BYTES, leerJsonLimitado, normalizarItem, validarItemSeguro } from "../../src/lib/security/validation";

const payload = (extra: Record<string, unknown> = {}) => ({
  location: "Laboratorio de Redes",
  date: "2026-10-30",
  inspector: "Técnica sintética",
  summary: "",
  findings: "Equipo sin red.",
  ...extra,
});
const item = (clientId = "abcdefgh", extra: Record<string, unknown> = {}, p: Record<string, unknown> = payload()) => ({
  clientId,
  createdAt: "2026-10-30T10:00:00.000Z",
  updatedAt: "2026-10-30T10:00:00.000Z",
  payload: p,
  ...extra,
});
const errores = (body: unknown) => validarItemSeguro(body).errores;

// 1) Un registro válido pasa y solo conserva los campos conocidos.
const ok = validarItemSeguro(item());
assert.deepEqual(ok.errores, []);
assert.deepEqual(Object.keys(ok.item as object).sort(), ["clientId", "createdAt", "payload", "updatedAt"]);

// 2) Claves peligrosas como "__proto__": no se copian y no contaminan los objetos.
const malicioso = JSON.parse(
  '{"__proto__":{"contaminado":true},"clientId":"abcdefgh","createdAt":"2026-10-30T10:00:00.000Z","updatedAt":"2026-10-30T10:00:00.000Z",' +
    '"payload":{"__proto__":{"contaminado":true},"constructor":{"x":1},"location":"Lab","date":"2026-10-30","inspector":"T","summary":"","findings":"ok"}}',
);
const normal = normalizarItem(malicioso) as { payload: Record<string, unknown> };
assert.equal(Object.prototype.hasOwnProperty.call(normal, "__proto__"), false);
assert.equal(Object.prototype.hasOwnProperty.call(normal.payload, "__proto__"), false);
assert.equal(Object.prototype.hasOwnProperty.call(normal.payload, "constructor"), false);
assert.equal(({} as Record<string, unknown>).contaminado, undefined, "Object.prototype no debe contaminarse");
assert.deepEqual(errores(malicioso), []);

// 3) Forma incorrecta: se rechaza con errores, nunca lanza una excepción.
for (const raro of [null, undefined, 42, "texto", true, [], [1, 2], { payload: [] }, { payload: "x" }, { clientId: "abcdefgh" }]) {
  assert.ok(errores(raro).length > 0, `debe rechazar ${JSON.stringify(raro)}`);
}

// 4) clientId: los límites exactos (8 a 64 caracteres, solo letras, números, guion y guion bajo).
assert.deepEqual(errores(item("a".repeat(8))), []);
assert.deepEqual(errores(item("a".repeat(64))), []);
assert.deepEqual(errores(item("Ab1-_" + "x".repeat(5))), []);
assert.ok(errores(item("a".repeat(7))).length > 0, "7 caracteres: muy corto");
assert.ok(errores(item("a".repeat(65))).length > 0, "65 caracteres: muy largo");
for (const malo of ["con espacios", "con/barra1", "con.punto1", "acentó-id1", "id;drop--1", "id\nsalto12"]) {
  assert.ok(errores(item(malo)).length > 0, `clientId inválido: ${JSON.stringify(malo)}`);
}

// 5) Foto: solo jpeg/png/webp en base64 y con contenido.
const foto = (photo: unknown) => errores(item("abcdefgh", {}, payload({ photo })));
assert.deepEqual(foto("data:image/jpeg;base64,/9j/4AAQ"), []);
assert.deepEqual(foto("data:image/png;base64,iVBORw0KGgo="), []);
assert.deepEqual(foto("data:image/webp;base64,UklGRg=="), []);
for (const mala of [
  "data:image/svg+xml;base64,PHN2Zz4=",
  "data:image/gif;base64,R0lGODlh",
  "data:image/png;base64,", // sin contenido
  "data:image/png;base64,abc def", // con espacio
  "data:image/PNG;base64,iVBORw0KGgo=", // el tipo debe ir en minúsculas
  "data:text/html;base64,PHNjcmlwdD4=",
  "https://ejemplo.invalid/foto.jpg",
  42,
]) {
  assert.ok(foto(mala).length > 0, `foto inválida: ${String(mala).slice(0, 30)}`);
}

// 6) Ubicación: los campos extra se descartan y los valores fuera de rango se rechazan.
const conGeo = validarItemSeguro(item("abcdefgh", {}, payload({ geo: { lat: 18.462, lon: -97.393, precisionM: 20, direccion: "Calle Falsa 123" } })));
assert.deepEqual(conGeo.errores, []);
assert.deepEqual((conGeo.item as { payload: { geo: object } }).payload.geo, { lat: 18.462, lon: -97.393, precisionM: 20 }, "se descarta el campo extra");
for (const geo of [{ lat: 90.1, lon: 0, precisionM: 1 }, { lat: 0, lon: 180.1, precisionM: 1 }, { lat: 0, lon: 0, precisionM: -1 }, { lat: "18", lon: 0, precisionM: 1 }, null, "x"]) {
  assert.ok(errores(item("abcdefgh", {}, payload({ geo }))).length > 0, `ubicación inválida: ${JSON.stringify(geo)}`);
}

// 7) Caracteres de control: se eliminan; salto de línea y tabulador se conservan.
const limpio = validarItemSeguro(item("abcdefgh", {}, payload({ findings: "a\u0000b\u0007c\td\ne\u007Ff" })));
assert.equal((limpio.item as { payload: { findings: string } }).payload.findings, "abc\td\nef");
// Un texto que solo tenía caracteres de control queda vacío y se rechaza como obligatorio.
assert.ok(errores(item("abcdefgh", {}, payload({ location: "\u0000\u0001" }))).length > 0);

// 8) El HTML se conserva como TEXTO (se escapa al mostrar), no se interpreta ni se borra.
const html = validarItemSeguro(item("abcdefgh", {}, payload({ findings: "<b>Urgente</b> & <script>x</script>" })));
assert.equal((html.item as { payload: { findings: string } }).payload.findings, "<b>Urgente</b> & <script>x</script>");

// 9) Lectura del cuerpo con tope de tamaño.
const req = (body: string, headers: Record<string, string> = {}) => new Request("http://localhost/api", { method: "POST", headers, body });
const justo = "{" + '"a":"' + "x".repeat(MAX_BODY_BYTES - 8) + '"}';
assert.equal(justo.length, MAX_BODY_BYTES);
assert.equal((await leerJsonLimitado(req(justo))).ok, true, "un cuerpo del tamaño máximo exacto se acepta");
const pasado = await leerJsonLimitado(req(justo + " "));
assert.ok(!pasado.ok && pasado.status === 413, "un byte de más: 413");
const roto = await leerJsonLimitado(req("{no es json"));
assert.ok(!roto.ok && roto.status === 400, "JSON roto: 400");
assert.equal((await leerJsonLimitado(req("{}", { "content-length": "abc" }))).ok, true, "un Content-Length no numérico se ignora y se mide el texto real");
const declarado = await leerJsonLimitado(req("{}", { "content-length": String(MAX_BODY_BYTES + 1) }));
assert.ok(!declarado.ok && declarado.status === 413, "Content-Length mayor al tope: 413 sin leer el cuerpo");

console.log("security-validation.spec.ts: PASS");
