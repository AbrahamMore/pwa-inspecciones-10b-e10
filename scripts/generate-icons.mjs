// Genera los íconos PNG de la PWA sin dependencias externas (solo Node).
// Uso: node scripts/generate-icons.mjs
import { deflateSync } from "node:zlib";
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const BG = [15, 23, 42, 255]; // #0f172a (mismo theme_color del manifest)
const FG = [56, 189, 248, 255]; // #38bdf8

// Tabla CRC32 requerida por el formato PNG.
const CRC = new Uint32Array(256).map((_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
function crc32(buf) {
  let c = 0xffffffff;
  for (const b of buf) c = CRC[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}

// Distancia de un punto a un segmento (para dibujar la palomita con grosor).
function distSeg(px, py, ax, ay, bx, by) {
  const dx = bx - ax, dy = by - ay;
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

function png(size) {
  const raw = Buffer.alloc((size * 4 + 1) * size);
  const thick = 0.075;
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0; // filtro "none"
    for (let x = 0; x < size; x++) {
      const nx = (x + 0.5) / size, ny = (y + 0.5) / size;
      // Palomita (check) dentro de la zona segura del 80% central (requisito de "maskable").
      const d = Math.min(
        distSeg(nx, ny, 0.3, 0.52, 0.44, 0.67),
        distSeg(nx, ny, 0.44, 0.67, 0.72, 0.35)
      );
      const c = d <= thick ? FG : BG;
      raw.set(c, y * (size * 4 + 1) + 1 + x * 4);
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // 8 bits por canal
  ihdr[9] = 6; // RGBA
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

const out = resolve(import.meta.dirname, "..", "public", "icons");
mkdirSync(out, { recursive: true });
for (const [name, size] of [
  ["icon-192.png", 192],
  ["icon-512.png", 512],
  ["icon-maskable-512.png", 512],
]) {
  writeFileSync(resolve(out, name), png(size));
  console.log("generado public/icons/" + name);
}