import * as THREE from "three";

/**
 * OKAP CITY — bibliyotèk materyèl ak teksti PBR ki jenere an kòd.
 * Tout teksti yo fèt ak Canvas (pa gen okenn fichye ekstèn, pa gen copyright).
 */

/* ------------------------------------------------------------------ *
 * Zouti debaz
 * ------------------------------------------------------------------ */

export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function makeCanvas(size: number, h = size) {
  const c = document.createElement("canvas");
  c.width = size;
  c.height = h;
  const ctx = c.getContext("2d");
  if (!ctx) throw new Error("2D context pa disponib");
  return { c, ctx };
}

function hash2(x: number, y: number, seed: number) {
  let h = Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263) ^ Math.imul(seed | 0, 2246822519);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

export function valueNoise(x: number, y: number, seed = 1) {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;
  const u = xf * xf * (3 - 2 * xf);
  const v = yf * yf * (3 - 2 * yf);
  const a = hash2(xi, yi, seed);
  const b = hash2(xi + 1, yi, seed);
  const c = hash2(xi, yi + 1, seed);
  const d = hash2(xi + 1, yi + 1, seed);
  return (a * (1 - u) + b * u) * (1 - v) + (c * (1 - u) + d * u) * v;
}

export function fbm(x: number, y: number, octaves = 4, seed = 1) {
  let sum = 0;
  let amp = 0.5;
  let freq = 1;
  let norm = 0;
  for (let i = 0; i < octaves; i++) {
    sum += valueNoise(x * freq, y * freq, seed + i * 17) * amp;
    norm += amp;
    amp *= 0.5;
    freq *= 2;
  }
  return sum / norm;
}

/** Konvèti yon canvas wotè (grayscale) an nòmal map. */
export function normalFromHeight(height: HTMLCanvasElement, strength = 1.6, repeat = 1): THREE.CanvasTexture {
  const { c, ctx } = makeCanvas(height.width, height.height);
  const src = height.getContext("2d")!.getImageData(0, 0, height.width, height.height).data;
  const out = ctx.createImageData(height.width, height.height);
  const w = height.width;
  const h = height.height;
  const at = (x: number, y: number) => {
    const xx = (x + w) % w;
    const yy = (y + h) % h;
    return src[(yy * w + xx) * 4] / 255;
  };
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const dx = (at(x + 1, y) - at(x - 1, y)) * strength;
      const dy = (at(x, y + 1) - at(x, y - 1)) * strength;
      const len = Math.hypot(dx, dy, 1);
      const i = (y * w + x) * 4;
      out.data[i] = ((-dx / len) * 0.5 + 0.5) * 255;
      out.data[i + 1] = ((-dy / len) * 0.5 + 0.5) * 255;
      out.data[i + 2] = (1 / len) * 0.5 * 255 + 127;
      out.data[i + 3] = 255;
    }
  }
  ctx.putImageData(out, 0, 0);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repeat, repeat);
  t.anisotropy = 4;
  return t;
}

export function texFrom(
  canvas: HTMLCanvasElement,
  repeat = 1,
  srgb = true,
): THREE.CanvasTexture {
  const t = new THREE.CanvasTexture(canvas);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repeat, repeat);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  t.generateMipmaps = true;
  t.minFilter = THREE.LinearMipmapLinearFilter;
  return t;
}

/* ------------------------------------------------------------------ *
 * Penti teksti yo
 * ------------------------------------------------------------------ */

export function paintAsphalt(size = 256, seed = 3) {
  const { c, ctx } = makeCanvas(size);
  const rand = mulberry32(seed);
  ctx.fillStyle = "#3a3b40";
  ctx.fillRect(0, 0, size, size);
  const img = ctx.getImageData(0, 0, size, size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      const n = fbm(x * 0.09, y * 0.09, 4, seed) * 0.55 + fbm(x * 0.5, y * 0.5, 2, seed + 9) * 0.45;
      const g = 46 + n * 46;
      const warm = 1 + (rand() - 0.5) * 0.06;
      img.data[i] = g * warm;
      img.data[i + 1] = g * 0.97;
      img.data[i + 2] = g * 0.95;
      img.data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  // degoute lwil ak fant
  ctx.globalAlpha = 0.14;
  for (let i = 0; i < 26; i++) {
    ctx.strokeStyle = i % 3 === 0 ? "#14161a" : "#6a6d73";
    ctx.lineWidth = 1 + rand() * 2.5;
    ctx.beginPath();
    let x = rand() * size;
    let y = rand() * size;
    ctx.moveTo(x, y);
    for (let k = 0; k < 6; k++) {
      x += (rand() - 0.5) * 40;
      y += (rand() - 0.5) * 40;
      ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  return c;
}

export function paintConcrete(size = 256, seed = 5) {
  const { c, ctx } = makeCanvas(size);
  const rand = mulberry32(seed);
  ctx.fillStyle = "#cfc7ba";
  ctx.fillRect(0, 0, size, size);
  const img = ctx.getImageData(0, 0, size, size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      const n = fbm(x * 0.06, y * 0.06, 4, seed) * 0.6 + rand() * 0.4;
      const base = 176 + n * 44;
      img.data[i] = base * 1.02;
      img.data[i + 1] = base * 0.99;
      img.data[i + 2] = base * 0.94;
      img.data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  // twou vidaj + tach imidite
  ctx.strokeStyle = "rgba(90,86,78,0.55)";
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, size - 2, size - 2);
  ctx.strokeStyle = "rgba(110,104,94,0.4)";
  ctx.beginPath();
  ctx.moveTo(size / 2, 0);
  ctx.lineTo(size / 2, size);
  ctx.stroke();
  ctx.globalAlpha = 0.12;
  for (let i = 0; i < 18; i++) {
    ctx.fillStyle = i % 2 ? "#6b6355" : "#8d8677";
    const r = 8 + rand() * 30;
    ctx.beginPath();
    ctx.arc(rand() * size, rand() * size, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  return c;
}

export function paintStucco(size = 256, seed = 11) {
  const { c, ctx } = makeCanvas(size);
  const rand = mulberry32(seed);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, size, size);
  const img = ctx.getImageData(0, 0, size, size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      const n = fbm(x * 0.22, y * 0.22, 3, seed) * 0.7 + rand() * 0.3;
      const base = 205 + n * 50;
      img.data[i] = base;
      img.data[i + 1] = base * 0.995;
      img.data[i + 2] = base * 0.985;
      img.data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  ctx.globalAlpha = 0.1;
  for (let i = 0; i < 22; i++) {
    ctx.fillStyle = "#3b3630";
    ctx.beginPath();
    ctx.arc(rand() * size, size - rand() * size * 0.4, 6 + rand() * 22, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  return c;
}

export function paintRoofTiles(size = 256, seed = 21) {
  const { c, ctx } = makeCanvas(size);
  const rand = mulberry32(seed);
  ctx.fillStyle = "#9d4423";
  ctx.fillRect(0, 0, size, size);
  const rows = 8;
  const cols = 8;
  const rh = size / rows;
  const cw = size / cols;
  for (let r = 0; r < rows; r++) {
    for (let k = 0; k < cols; k++) {
      const x = k * cw + (r % 2 ? cw / 2 : 0);
      const y = r * rh;
      const shade = 0.82 + rand() * 0.4;
      const g = ctx.createLinearGradient(x, y, x, y + rh);
      g.addColorStop(0, `rgb(${Math.floor(196 * shade)},${Math.floor(93 * shade)},${Math.floor(56 * shade)})`);
      g.addColorStop(1, `rgb(${Math.floor(126 * shade)},${Math.floor(54 * shade)},${Math.floor(30 * shade)})`);
      ctx.fillStyle = g;
      ctx.beginPath();
      const rr = cw * 0.5;
      ctx.moveTo(x, y + rh);
      ctx.lineTo(x, y + rr);
      ctx.quadraticCurveTo(x + rr * 0.5, y - rr * 0.15, x + rr * 1.0, y + rr);
      ctx.lineTo(x + rr, y + rh);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = "rgba(70,30,18,0.5)";
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }
  ctx.globalAlpha = 0.16;
  for (let i = 0; i < 16; i++) {
    ctx.fillStyle = i % 2 ? "#2f5d3a" : "#4a4033";
    ctx.beginPath();
    ctx.arc(rand() * size, rand() * size, 4 + rand() * 16, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  return c;
}

export function paintWood(size = 256, seed = 31) {
  const { c, ctx } = makeCanvas(size);
  const rand = mulberry32(seed);
  const planks = 6;
  const pw = size / planks;
  for (let p = 0; p < planks; p++) {
    const shade = 0.78 + rand() * 0.4;
    ctx.fillStyle = `rgb(${Math.floor(146 * shade)},${Math.floor(105 * shade)},${Math.floor(68 * shade)})`;
    ctx.fillRect(p * pw, 0, pw - 1, size);
    ctx.strokeStyle = "rgba(58,40,24,0.55)";
    ctx.lineWidth = 1.4;
    ctx.strokeRect(p * pw + 0.5, 0.5, pw - 2, size - 1);
    for (let i = 0; i < 22; i++) {
      ctx.strokeStyle = `rgba(90,62,36,${0.08 + rand() * 0.18})`;
      ctx.lineWidth = 0.6 + rand() * 1.6;
      ctx.beginPath();
      const y = rand() * size;
      ctx.moveTo(p * pw, y);
      ctx.bezierCurveTo(p * pw + pw * 0.3, y + (rand() - 0.5) * 12, p * pw + pw * 0.7, y + (rand() - 0.5) * 12, (p + 1) * pw, y + (rand() - 0.5) * 6);
      ctx.stroke();
    }
    if (rand() < 0.5) {
      ctx.fillStyle = "rgba(45,32,20,0.6)";
      ctx.beginPath();
      ctx.arc(p * pw + pw * 0.5, rand() * size, 2 + rand() * 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  return c;
}

export function paintSand(size = 256, seed = 41) {
  const { c, ctx } = makeCanvas(size);
  const rand = mulberry32(seed);
  ctx.fillStyle = "#ddc08a";
  ctx.fillRect(0, 0, size, size);
  const img = ctx.getImageData(0, 0, size, size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      const ripple = Math.sin((x + fbm(x * 0.05, y * 0.05, 2, seed) * 40) * 0.35) * 0.5 + 0.5;
      const grain = rand() * 0.5 + fbm(x * 0.8, y * 0.8, 2, seed + 5) * 0.5;
      const base = 176 + ripple * 18 + grain * 34;
      img.data[i] = base * 1.06;
      img.data[i + 1] = base * 0.98;
      img.data[i + 2] = base * 0.78;
      img.data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return c;
}

export function paintGrass(size = 256, seed = 51) {
  const { c, ctx } = makeCanvas(size);
  const rand = mulberry32(seed);
  ctx.fillStyle = "#4c6b3c";
  ctx.fillRect(0, 0, size, size);
  const img = ctx.getImageData(0, 0, size, size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      const n = fbm(x * 0.07, y * 0.07, 4, seed) * 0.65 + rand() * 0.35;
      img.data[i] = 52 + n * 66;
      img.data[i + 1] = 88 + n * 74;
      img.data[i + 2] = 44 + n * 44;
      img.data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  ctx.globalAlpha = 0.35;
  for (let i = 0; i < 900; i++) {
    ctx.strokeStyle = i % 3 === 0 ? "#31502b" : i % 3 === 1 ? "#7a9a4c" : "#5c7f3c";
    ctx.lineWidth = 0.8;
    const x = rand() * size;
    const y = rand() * size;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + (rand() - 0.5) * 3, y - 3 - rand() * 5);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  return c;
}

export function paintDirt(size = 256, seed = 61) {
  const { c, ctx } = makeCanvas(size);
  const rand = mulberry32(seed);
  ctx.fillStyle = "#7d6a4f";
  ctx.fillRect(0, 0, size, size);
  const img = ctx.getImageData(0, 0, size, size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      const n = fbm(x * 0.09, y * 0.09, 4, seed) * 0.6 + rand() * 0.4;
      img.data[i] = 118 + n * 58;
      img.data[i + 1] = 101 + n * 50;
      img.data[i + 2] = 74 + n * 38;
      img.data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  ctx.globalAlpha = 0.3;
  for (let i = 0; i < 120; i++) {
    ctx.fillStyle = i % 2 ? "#5e503a" : "#9c8a6a";
    ctx.beginPath();
    ctx.arc(rand() * size, rand() * size, 1 + rand() * 3, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  return c;
}

export function paintRock(size = 256, seed = 71) {
  const { c, ctx } = makeCanvas(size);
  const rand = mulberry32(seed);
  const img = ctx.createImageData(size, size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      const n = fbm(x * 0.05, y * 0.05, 5, seed) * 0.75 + fbm(x * 0.4, y * 0.4, 2, seed + 3) * 0.25;
      const v = 84 + n * 92;
      img.data[i] = v * 0.99;
      img.data[i + 1] = v * 0.97;
      img.data[i + 2] = v * 0.93;
      img.data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  ctx.globalAlpha = 0.25;
  for (let i = 0; i < 40; i++) {
    ctx.strokeStyle = "#3c3a36";
    ctx.lineWidth = 0.8 + rand() * 2;
    ctx.beginPath();
    ctx.moveTo(rand() * size, rand() * size);
    ctx.lineTo(rand() * size, rand() * size);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  return c;
}

export function paintMetal(size = 256, seed = 81) {
  const { c, ctx } = makeCanvas(size);
  const rand = mulberry32(seed);
  ctx.fillStyle = "#b9bcc0";
  ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < 600; i++) {
    ctx.strokeStyle = `rgba(${180 + rand() * 60},${180 + rand() * 60},${190 + rand() * 60},0.18)`;
    ctx.lineWidth = 0.5 + rand();
    ctx.beginPath();
    const y = rand() * size;
    ctx.moveTo(0, y);
    ctx.lineTo(size, y + (rand() - 0.5) * 4);
    ctx.stroke();
  }
  ctx.globalAlpha = 0.2;
  for (let i = 0; i < 30; i++) {
    ctx.fillStyle = i % 2 ? "#6b4a2f" : "#8c5a2b";
    ctx.beginPath();
    ctx.arc(rand() * size, rand() * size, 3 + rand() * 14, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  return c;
}

export function paintPalmBark(size = 128, seed = 91) {
  const { c, ctx } = makeCanvas(size);
  const rand = mulberry32(seed);
  ctx.fillStyle = "#8a7350";
  ctx.fillRect(0, 0, size, size);
  for (let r = 0; r < 16; r++) {
    const y = (r / 16) * size;
    const shade = 0.7 + rand() * 0.6;
    ctx.fillStyle = `rgba(${Math.floor(120 * shade)},${Math.floor(99 * shade)},${Math.floor(66 * shade)},0.9)`;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(size, y + 2);
    ctx.lineTo(size, y + size / 16);
    ctx.lineTo(0, y + size / 16 - 1);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "rgba(60,48,32,0.5)";
    ctx.beginPath();
    ctx.moveTo(0, y + size / 16);
    ctx.lineTo(size, y + size / 16);
    ctx.stroke();
  }
  return c;
}

export function paintFrond(size = 256, seed = 101) {
  const { c, ctx } = makeCanvas(size);
  const rand = mulberry32(seed);
  ctx.clearRect(0, 0, size, size);
  ctx.translate(size / 2, size / 2);
  const leaves = 26;
  for (let i = 0; i < leaves; i++) {
    const a = -Math.PI * 0.5 + (i / (leaves - 1) - 0.5) * 2.4;
    const len = size * (0.36 + rand() * 0.14);
    ctx.save();
    ctx.rotate(a);
    const g = ctx.createLinearGradient(0, 0, len, 0);
    g.addColorStop(0, "#1f5130");
    g.addColorStop(0.6, "#2f7a45");
    g.addColorStop(1, "#4c9a52");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(len * 0.5, -len * 0.16, len, -len * 0.02);
    ctx.quadraticCurveTo(len * 0.5, len * 0.1, 0, 0);
    ctx.fill();
    ctx.restore();
  }
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  return c;
}

export function paintLeafAlpha(size = 128, seed = 111) {
  const { c, ctx } = makeCanvas(size);
  const rand = mulberry32(seed);
  ctx.clearRect(0, 0, size, size);
  for (let i = 0; i < 60; i++) {
    const x = rand() * size;
    const y = rand() * size;
    const r = 5 + rand() * 16;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    const tone = 60 + rand() * 70;
    g.addColorStop(0, `rgba(${30 + tone * 0.4},${90 + tone},${50 + tone * 0.4},1)`);
    g.addColorStop(1, "rgba(20,60,30,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  return c;
}

export function paintFabricStripes(size = 128, seed = 121, colors = ["#e63946", "#f1faee"]) {
  const { c, ctx } = makeCanvas(size);
  const bands = 8;
  for (let i = 0; i < bands; i++) {
    ctx.fillStyle = colors[i % colors.length];
    ctx.fillRect((i * size) / bands, 0, size / bands, size);
  }
  const img = ctx.getImageData(0, 0, size, size);
  const rand = mulberry32(seed);
  for (let i = 0; i < img.data.length; i += 4) {
    const n = (rand() - 0.5) * 22;
    img.data[i] += n;
    img.data[i + 1] += n;
    img.data[i + 2] += n;
  }
  ctx.putImageData(img, 0, 0);
  return c;
}

export function paintGraffiti(size = 512, seed = 131) {
  const { c, ctx } = makeCanvas(size);
  const base = paintStucco(size, seed);
  ctx.drawImage(base, 0, 0);
  ctx.save();
  ctx.translate(size * 0.5, size * 0.58);
  ctx.rotate(-0.06);
  ctx.font = `bold ${Math.floor(size * 0.3)}px "Segoe UI", Arial, sans-serif`;
  ctx.textAlign = "center";
  ctx.lineWidth = size * 0.02;
  ctx.strokeStyle = "rgba(10,20,40,0.65)";
  ctx.fillStyle = "#1d4ed8";
  ctx.fillText("OKAP", 0, 0);
  ctx.strokeText("OKAP", 0, 0);
  ctx.font = `bold ${Math.floor(size * 0.11)}px "Segoe UI", Arial, sans-serif`;
  ctx.fillStyle = "#d21034";
  ctx.fillText("VIV PI BÈL", 0, size * 0.13);
  // kouwòn
  ctx.beginPath();
  const cy = -size * 0.24;
  ctx.moveTo(-size * 0.13, cy + size * 0.06);
  ctx.lineTo(-size * 0.05, cy - size * 0.03);
  ctx.lineTo(0, cy + size * 0.03);
  ctx.lineTo(size * 0.05, cy - size * 0.03);
  ctx.lineTo(size * 0.13, cy + size * 0.06);
  ctx.closePath();
  ctx.fillStyle = "#d4a017";
  ctx.fill();
  ctx.restore();
  return c;
}

export function paintSign(text: string, bg = "#1b6b4a", fg = "#ffffff", size = 256) {
  const { c, ctx } = makeCanvas(size, Math.floor(size / 2));
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, size, size / 2);
  ctx.strokeStyle = "#f6f3ea";
  ctx.lineWidth = 6;
  ctx.strokeRect(6, 6, size - 12, size / 2 - 12);
  ctx.fillStyle = fg;
  ctx.font = `bold ${Math.floor(size * 0.18)}px "Segoe UI", Arial, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, size / 2, size / 4);
  return c;
}

/* ------------------------------------------------------------------ *
 * Materyèl PBR chaje yon sèl fwa
 * ------------------------------------------------------------------ */

const _cache = new Map<string, THREE.Material>();

function proc(
  key: string,
  colorMap: HTMLCanvasElement,
  opts: {
    repeat?: number;
    color?: number;
    roughness?: number;
    metalness?: number;
    normalStrength?: number;
    transparent?: boolean;
    opacity?: number;
    side?: THREE.Side;
    envIntensity?: number;
    emissive?: number;
    emissiveIntensity?: number;
  } = {},
) {
  const hit = _cache.get(key);
  if (hit) return hit as THREE.MeshStandardMaterial;
  const repeat = opts.repeat ?? 1;
  const map = texFrom(colorMap, repeat);
  const normalMap = normalFromHeight(colorMap, opts.normalStrength ?? 1.1, repeat);
  const mat = new THREE.MeshStandardMaterial({
    map,
    normalMap,
    color: opts.color ?? 0xffffff,
    roughness: opts.roughness ?? 0.85,
    metalness: opts.metalness ?? 0.05,
    transparent: opts.transparent ?? false,
    opacity: opts.opacity ?? 1,
    side: opts.side ?? THREE.FrontSide,
    emissive: opts.emissive ?? 0x000000,
    emissiveIntensity: opts.emissiveIntensity ?? 1,
    envMapIntensity: opts.envIntensity ?? 0.55,
  });
  _cache.set(key, mat);
  return mat;
}

export interface MaterialKit {
  asphalt: THREE.MeshStandardMaterial;
  concrete: THREE.MeshStandardMaterial;
  sidewalk: THREE.MeshStandardMaterial;
  sand: THREE.MeshStandardMaterial;
  grass: THREE.MeshStandardMaterial;
  dirt: THREE.MeshStandardMaterial;
  rock: THREE.MeshStandardMaterial;
  roof: THREE.MeshStandardMaterial;
  wood: THREE.MeshStandardMaterial;
  metal: THREE.MeshStandardMaterial;
  palmBark: THREE.MeshStandardMaterial;
  stucco(): THREE.MeshStandardMaterial;
  wall(color: number): THREE.MeshStandardMaterial;
  painted(color: number, roughness?: number): THREE.MeshStandardMaterial;
  glass(): THREE.MeshStandardMaterial;
  frond(): THREE.MeshStandardMaterial;
  ivy(): THREE.MeshStandardMaterial;
  awning(colors?: [string, string]): THREE.MeshStandardMaterial;
  graffiti: THREE.MeshStandardMaterial;
  sign(text: string, bg?: string, fg?: string): THREE.MeshStandardMaterial;
  windowLit(): THREE.MeshStandardMaterial;
  tire(): THREE.MeshStandardMaterial;
}

export const MAT: MaterialKit = {
  asphalt: proc("asphalt", paintAsphalt(256), { repeat: 6, roughness: 0.92, normalStrength: 1.2 }),
  concrete: proc("concrete", paintConcrete(256), { repeat: 3, roughness: 0.9 }),
  sidewalk: proc("sidewalk", paintConcrete(256, 17), { repeat: 5, color: 0xe9e4da, roughness: 0.88 }),
  sand: proc("sand", paintSand(256), { repeat: 30, roughness: 1, normalStrength: 1.5 }),
  grass: proc("grass", paintGrass(256), { repeat: 34, roughness: 1, normalStrength: 1.2 }),
  dirt: proc("dirt", paintDirt(256), { repeat: 26, roughness: 1 }),
  rock: proc("rock", paintRock(256), { repeat: 4, roughness: 1, normalStrength: 1.8 }),
  roof: proc("roof", paintRoofTiles(256), { repeat: 3, roughness: 0.75, normalStrength: 1.6 }),
  wood: proc("wood", paintWood(256), { repeat: 2, roughness: 0.8 }),
  metal: proc("metal", paintMetal(256), { repeat: 2, roughness: 0.35, metalness: 0.75 }),
  palmBark: proc("palmBark", paintPalmBark(128), { repeat: 2, roughness: 0.95 }),
  stucco: () => proc("stucco", paintStucco(256), { repeat: 3, roughness: 0.92 }),
  wall: (color: number) => proc(`wall-${color}`, paintStucco(256), { repeat: 3, color, roughness: 0.9 }),
  painted: (color: number, roughness = 0.55) => proc(`paint-${color}-${roughness}`, paintMetal(128), { repeat: 2, color, roughness, metalness: 0.35 }),
  glass: () =>
    proc("glass", paintConcrete(64, 3), {
      repeat: 1,
      color: 0x9fc6d8,
      roughness: 0.06,
      metalness: 0.3,
      transparent: true,
      opacity: 0.5,
      envIntensity: 1.5,
    }),
  frond: () => {
    const hit = _cache.get("frond") as THREE.MeshStandardMaterial | undefined;
    if (hit) return hit;
    const map = texFrom(paintFrond(256), 1);
    const m = new THREE.MeshStandardMaterial({
      map,
      transparent: true,
      alphaTest: 0.35,
      side: THREE.DoubleSide,
      roughness: 0.8,
      metalness: 0,
      envMapIntensity: 0.3,
    });
    _cache.set("frond", m);
    return m;
  },
  ivy: () => {
    const hit = _cache.get("ivy") as THREE.MeshStandardMaterial | undefined;
    if (hit) return hit;
    const m = new THREE.MeshStandardMaterial({
      map: texFrom(paintLeafAlpha(128), 1),
      transparent: true,
      alphaTest: 0.3,
      depthWrite: true,
      side: THREE.DoubleSide,
      roughness: 0.9,
      envMapIntensity: 0.3,
    });
    _cache.set("ivy", m);
    return m;
  },
  awning: (colors: [string, string] = ["#e63946", "#f1faee"]) =>
    proc(`awning-${colors.join()}`, paintFabricStripes(128, 121, colors), { repeat: 3, roughness: 0.7, side: THREE.DoubleSide }),
  graffiti: proc("graffiti", paintGraffiti(512), { repeat: 1, roughness: 0.9 }),
  sign: (text: string, bg = "#1b6b4a", fg = "#ffffff") => proc(`sign-${text}-${bg}`, paintSign(text, bg, fg, 256), { repeat: 1, roughness: 0.4 }),
  windowLit: () =>
    proc("windowLit", paintStucco(64, 7), {
      repeat: 1,
      color: 0x2a2118,
      emissive: 0xffb45c,
      emissiveIntensity: 0.9,
      roughness: 0.3,
      metalness: 0.2,
    }),
  tire: () => {
    const hit = _cache.get("tire") as THREE.MeshStandardMaterial | undefined;
    if (hit) return hit;
    const m = new THREE.MeshStandardMaterial({ color: 0x14161a, roughness: 0.95, metalness: 0.02 });
    _cache.set("tire", m);
    return m;
  },
};

export function clearMaterialCache() {
  _cache.clear();
}

/* ------------------------------------------------------------------ *
 * API teksti foto (public/textures/*.png) — soti nan pase fotoreyalis la
 * ------------------------------------------------------------------ */

const loader = new THREE.TextureLoader();
const cache = new Map<string, THREE.Texture>();
const matCache = new Map<string, THREE.Material>();

function tex(path: string, repeat = 2, wrap = true) {
  const key = `${path}:${repeat}:${wrap}`;
  if (cache.has(key)) return cache.get(key)!;
  const t = loader.load(path);
  if (wrap) {
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(repeat, repeat);
  } else {
    t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
  }
  t.colorSpace = THREE.SRGBColorSpace;
  cache.set(key, t);
  return t;
}

export function std(color: number | string, extras: Partial<THREE.MeshStandardMaterialParameters> = {}) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: 0.82,
    metalness: 0.04,
    ...extras,
  });
}

export function stucco(color: number) {
  return std(color, { map: tex("/textures/stucco.png", 3), roughness: 0.9 });
}

export function roofMat() {
  return std(0xc36f3c, { map: tex("/textures/roof.png", 4), roughness: 0.75 });
}

export function asphalt() {
  return std(0x6a6d72, { map: tex("/textures/asphalt.png", 8), roughness: 0.95 });
}

export function grass() {
  return std(0x6a9a4e, { map: tex("/textures/grass.png", 10), roughness: 1 });
}

export function sand() {
  return std(0xe4c57a, { map: tex("/textures/sand.png", 6), roughness: 1 });
}

export function wood() {
  return std(0x6b4226, { map: tex("/textures/wood.png", 2), roughness: 0.7 });
}

export function glass() {
  return new THREE.MeshStandardMaterial({
    color: 0x7ec8e3,
    roughness: 0.12,
    metalness: 0.35,
    transparent: true,
    opacity: 0.55,
  });
}

export function photoMat(path: string, fog = true) {
  const key = `basic:${path}:${fog}`;
  if (matCache.has(key)) return matCache.get(key) as THREE.MeshBasicMaterial;
  const m = new THREE.MeshBasicMaterial({ map: tex(path, 1, false), fog });
  matCache.set(key, m);
  return m;
}

export function photoStd(path: string) {
  const key = `std:${path}`;
  if (matCache.has(key)) return matCache.get(key) as THREE.MeshStandardMaterial;
  const m = new THREE.MeshStandardMaterial({
    map: tex(path, 1, false),
    roughness: 0.72,
    metalness: 0.05,
  });
  matCache.set(key, m);
  return m;
}

export const PLATE = {
  city: "/textures/plates/city-horizon.png",
  cream: "/textures/plates/house-cream.png",
  blue: "/textures/plates/house-blue.png",
  coast: "/textures/plates/coast-sunset.png",
  harbor: "/textures/plates/harbor-bay.png",
  hills: "/textures/plates/harbor-hills.png",
};
