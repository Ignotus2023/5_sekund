// Generates simple placeholder PNG icons for the PWA.
// Solid purple background with a centered white "5".
// Replace with real icons before publishing.

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const BG = [124, 58, 237];   // brand purple
const FG = [255, 255, 255];  // white text

// Minimal 5x7 font for the digit "5"
const GLYPH_5 = [
  '11111',
  '10000',
  '11110',
  '00001',
  '00001',
  '10001',
  '01110',
];

function makeImage(size) {
  const buf = Buffer.alloc(size * size * 4);
  // background
  for (let i = 0; i < size * size; i++) {
    buf[i * 4 + 0] = BG[0];
    buf[i * 4 + 1] = BG[1];
    buf[i * 4 + 2] = BG[2];
    buf[i * 4 + 3] = 255;
  }
  // draw rounded-corner effect by making outer pixels transparent
  const r = Math.floor(size * 0.18);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const cx = x < r ? r - x : x >= size - r ? x - (size - 1 - r) : 0;
      const cy = y < r ? r - y : y >= size - r ? y - (size - 1 - r) : 0;
      if (cx > 0 && cy > 0 && Math.sqrt(cx * cx + cy * cy) > r) {
        const i = (y * size + x) * 4;
        buf[i + 3] = 0;
      }
    }
  }
  // draw glyph centered
  const gh = GLYPH_5.length;
  const gw = GLYPH_5[0].length;
  const scale = Math.floor(size * 0.55 / gh);
  const totalW = gw * scale;
  const totalH = gh * scale;
  const startX = Math.floor((size - totalW) / 2);
  const startY = Math.floor((size - totalH) / 2);
  for (let gy = 0; gy < gh; gy++) {
    for (let gx = 0; gx < gw; gx++) {
      if (GLYPH_5[gy][gx] !== '1') continue;
      for (let dy = 0; dy < scale; dy++) {
        for (let dx = 0; dx < scale; dx++) {
          const px = startX + gx * scale + dx;
          const py = startY + gy * scale + dy;
          if (px < 0 || py < 0 || px >= size || py >= size) continue;
          const i = (py * size + px) * 4;
          buf[i + 0] = FG[0];
          buf[i + 1] = FG[1];
          buf[i + 2] = FG[2];
          buf[i + 3] = 255;
        }
      }
    }
  }
  return buf;
}

function crc32(buf) {
  let c;
  const table = [];
  for (let n = 0; n < 256; n++) {
    c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c;
  }
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) crc = table[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function encodePNG(width, height, rgba) {
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;   // bit depth
  ihdr[9] = 6;   // color type RGBA
  ihdr[10] = 0;  // compression
  ihdr[11] = 0;  // filter
  ihdr[12] = 0;  // interlace
  const raw = Buffer.alloc(height * (1 + width * 4));
  for (let y = 0; y < height; y++) {
    raw[y * (1 + width * 4)] = 0;
    rgba.copy(raw, y * (1 + width * 4) + 1, y * width * 4, (y + 1) * width * 4);
  }
  const idat = zlib.deflateSync(raw);
  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

const out = path.join(__dirname, '..', 'public');
fs.mkdirSync(out, { recursive: true });
for (const size of [192, 512]) {
  const data = makeImage(size);
  const png = encodePNG(size, size, data);
  fs.writeFileSync(path.join(out, `pwa-${size}x${size}.png`), png);
  console.log(`wrote pwa-${size}x${size}.png (${png.length} bytes)`);
}
