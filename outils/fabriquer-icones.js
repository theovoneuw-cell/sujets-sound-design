#!/usr/bin/env node
/* Fabrique les icônes à partir d'un rendu PNG 1024×1024 du logo :
   - force la transparence hors du carré arrondi macOS (rayon 230/1024)
   - produit logo/logo-{16,32,64,128,256,512,1024}.png
   - assemble logo/SujetsSoundDesign.icns (icône macOS, Finder / Dock)
   Aucune dépendance : décodage et encodage PNG faits ici avec zlib.
   Usage : node outils/fabriquer-icones.js <rendu-1024.png> */
const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

/* ---------- PNG minimal (8 bits, RGB/RGBA, non entrelacé) ---------- */
const CRC = (() => { const t = []; for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
function crc32(buf) { let c = 0xffffffff; for (const b of buf) c = CRC[(c ^ b) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; }

function decodePNG(buf) {
  if (buf.readUInt32BE(0) !== 0x89504e47) throw new Error("pas un PNG");
  let p = 8, w, h, bpp, colorType, idat = [];
  while (p < buf.length) {
    const len = buf.readUInt32BE(p), type = buf.toString("ascii", p + 4, p + 8), data = buf.subarray(p + 8, p + 8 + len);
    if (type === "IHDR") {
      w = data.readUInt32BE(0); h = data.readUInt32BE(4); colorType = data[9];
      if (data[8] !== 8 || data[12] !== 0) throw new Error("PNG non géré (profondeur ou entrelacement)");
      bpp = { 2: 3, 6: 4 }[colorType]; if (!bpp) throw new Error("type de couleur non géré : " + colorType);
    } else if (type === "IDAT") idat.push(data);
    p += 12 + len;
  }
  const raw = zlib.inflateSync(Buffer.concat(idat)), stride = w * bpp, out = Buffer.alloc(w * h * 4);
  let prev = Buffer.alloc(stride), cur = Buffer.alloc(stride);
  for (let y = 0; y < h; y++) {
    const f = raw[y * (stride + 1)], line = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1));
    for (let i = 0; i < stride; i++) {
      const a = i >= bpp ? cur[i - bpp] : 0, b = prev[i], c = i >= bpp ? prev[i - bpp] : 0, x = line[i];
      let v;
      switch (f) {
        case 0: v = x; break;
        case 1: v = x + a; break;
        case 2: v = x + b; break;
        case 3: v = x + ((a + b) >> 1); break;
        case 4: { const pp = a + b - c, pa = Math.abs(pp - a), pb = Math.abs(pp - b), pc = Math.abs(pp - c); v = x + (pa <= pb && pa <= pc ? a : pb <= pc ? b : c); break; }
        default: throw new Error("filtre PNG inconnu " + f);
      }
      cur[i] = v & 0xff;
    }
    for (let x = 0; x < w; x++) {
      const s = x * bpp, d = (y * w + x) * 4;
      out[d] = cur[s]; out[d + 1] = cur[s + 1]; out[d + 2] = cur[s + 2]; out[d + 3] = bpp === 4 ? cur[s + 3] : 255;
    }
    [prev, cur] = [cur, prev];
  }
  return { w, h, data: out };
}

function encodePNG(img) {
  const { w, h, data } = img, stride = w * 4, raw = Buffer.alloc((stride + 1) * h);
  for (let y = 0; y < h; y++) { raw[y * (stride + 1)] = 0; data.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride); }
  const chunk = (type, d) => { const b = Buffer.alloc(12 + d.length); b.writeUInt32BE(d.length, 0); b.write(type, 4, "ascii"); d.copy(b, 8); b.writeUInt32BE(crc32(b.subarray(4, 8 + d.length)), 8 + d.length); return b; };
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 6;
  return Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), chunk("IHDR", ihdr), chunk("IDAT", zlib.deflateSync(raw, { level: 9 })), chunk("IEND", Buffer.alloc(0))]);
}

/* ---------- traitements ---------- */
// alpha = couverture du carré arrondi, lissée sur 4×4 sous-pixels
function masquer(img, rayon) {
  const { w, h, data } = img, r = rayon;
  const dedans = (x, y) => {
    const cx = x < r ? r : x > w - r ? w - r : x, cy = y < r ? r : y > h - r ? h - r : y;
    return (x - cx) ** 2 + (y - cy) ** 2 <= r * r;
  };
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if (x > r && x < w - r && y > r && y < h - r) continue;
    let n = 0;
    for (let sy = 0; sy < 4; sy++) for (let sx = 0; sx < 4; sx++) if (dedans(x + (sx + .5) / 4, y + (sy + .5) / 4)) n++;
    const i = (y * w + x) * 4, a = n / 16;
    data[i + 3] = Math.round(data[i + 3] * a);
    if (a === 0) data[i] = data[i + 1] = data[i + 2] = 0;
  }
  return img;
}

// réduction par moyenne de blocs (l'entrée est un multiple exact de la sortie), alpha prémultiplié
function reduire(img, taille) {
  const k = img.w / taille; if (!Number.isInteger(k)) throw new Error("facteur non entier");
  const out = Buffer.alloc(taille * taille * 4);
  for (let y = 0; y < taille; y++) for (let x = 0; x < taille; x++) {
    let r = 0, g = 0, b = 0, a = 0;
    for (let sy = 0; sy < k; sy++) for (let sx = 0; sx < k; sx++) {
      const i = ((y * k + sy) * img.w + x * k + sx) * 4, al = img.data[i + 3] / 255;
      r += img.data[i] * al; g += img.data[i + 1] * al; b += img.data[i + 2] * al; a += al;
    }
    const o = (y * taille + x) * 4;
    if (a > 0) { out[o] = Math.round(r / a); out[o + 1] = Math.round(g / a); out[o + 2] = Math.round(b / a); }
    out[o + 3] = Math.round(a / (k * k) * 255);
  }
  return { w: taille, h: taille, data: out };
}

// conteneur ICNS : les entrées sont des PNG, types selon la taille
const ICNS_TYPES = { 16: "icp4", 32: "icp5", 64: "icp6", 128: "ic07", 256: "ic08", 512: "ic09", 1024: "ic10" };
function icns(entrees) {
  const parts = [];
  for (const [taille, png] of entrees) {
    const type = ICNS_TYPES[taille]; if (!type) continue;
    const h = Buffer.alloc(8); h.write(type, 0, "ascii"); h.writeUInt32BE(8 + png.length, 4);
    parts.push(h, png);
  }
  const body = Buffer.concat(parts), head = Buffer.alloc(8); head.write("icns", 0, "ascii"); head.writeUInt32BE(8 + body.length, 4);
  return Buffer.concat([head, body]);
}

/* ---------- main ---------- */
const src = process.argv[2];
if (!src) { console.error("usage : node outils/fabriquer-icones.js <rendu-1024.png>"); process.exit(1); }
const dossier = path.join(__dirname, "..", "logo");
const base = decodePNG(fs.readFileSync(src));
if (base.w !== 1024 || base.h !== 1024) throw new Error("le rendu doit faire 1024×1024, reçu " + base.w + "×" + base.h);
masquer(base, 230);

const entrees = [];
for (const t of [1024, 512, 256, 128, 64, 32, 16]) {
  const img = t === 1024 ? base : reduire(base, t), png = encodePNG(img);
  fs.writeFileSync(path.join(dossier, `logo-${t}.png`), png);
  entrees.push([t, png]);
}
fs.writeFileSync(path.join(dossier, "SujetsSoundDesign.icns"), icns(entrees));
const coin = base.data[3], centre = base.data[(512 * 1024 + 512) * 4 + 3];
console.log(`icônes écrites dans logo/ — alpha coin ${coin}, alpha centre ${centre}`);
