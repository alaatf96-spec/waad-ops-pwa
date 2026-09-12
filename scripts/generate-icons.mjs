import sharp from 'sharp';
import { mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, '../public/icons');
mkdirSync(outDir, { recursive: true });

const svg = (size, maskable = false) => {
  const pad = maskable ? size * 0.12 : 0;
  const inner = size - pad * 2;
  const r = Math.round(inner * 0.18);
  const font = Math.round(inner * 0.45);
  const cy = pad + inner * 0.66;
  return `
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" fill="#2A3077"/>
  <rect x="${pad}" y="${pad}" width="${inner}" height="${inner}" rx="${r}" fill="#2A3077"/>
  <circle cx="${size / 2}" cy="${size / 2}" r="${inner * 0.42}" fill="#1FC2F2" opacity="0.15"/>
  <text x="${size / 2}" y="${cy}" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-weight="700" font-size="${font}" fill="#1FC2F2">W</text>
  <rect x="${pad + inner * 0.2}" y="${pad + inner * 0.78}" width="${inner * 0.6}" height="${Math.max(4, inner * 0.06)}" rx="2" fill="#E4007E"/>
</svg>`;
};

async function write(name, size, maskable = false) {
  const buf = Buffer.from(svg(size, maskable));
  await sharp(buf).png().toFile(join(outDir, name));
  console.log('wrote', name);
}

await write('icon-192.png', 192);
await write('icon-512.png', 512);
await write('icon-maskable-512.png', 512, true);
console.log('icons done');
