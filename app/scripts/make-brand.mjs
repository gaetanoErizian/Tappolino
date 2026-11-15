// Genera il marchio Tappolino in src/core/brand/: la mascotte "Tappo" (un ditino con il cappello a tappo,
// in piedi sulle onde del tocco) e la scritta a lettere-adesivo in rilievo, con una stella al posto del puntino della "i".
// Carattere di base: Fredoka (OFL 1.1). Uso, dalla cartella app/:  npm run brand
import opentype from 'opentype.js';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const INK = '#2b2140';
const font = opentype.parse(readFileSync('node_modules/@fontsource/fredoka/files/fredoka-latin-700-normal.woff').buffer);

function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => Math.round(amt >= 0 ? c + (255 - c) * amt : c * (1 + amt)));
  return '#' + ch.map((c) => Math.max(0, Math.min(255, c)).toString(16).padStart(2, '0')).join('');
}
function starPath(cx, cy, r, inner = 0.5, pts = 5) {
  let d = '';
  for (let i = 0; i < pts * 2; i++) {
    const rr = i % 2 === 0 ? r : r * inner;
    const a = -Math.PI / 2 + (i * Math.PI) / pts;
    d += `${i ? 'L' : 'M'}${(cx + rr * Math.cos(a)).toFixed(1)} ${(cy + rr * Math.sin(a)).toFixed(1)} `;
  }
  return d + 'Z';
}
const sparkle = (x, y, s, c) =>
  `<path d="M${x} ${y - s} Q${x + s * 0.18} ${y - s * 0.18} ${x + s} ${y} Q${x + s * 0.18} ${y + s * 0.18} ${x} ${y + s} Q${x - s * 0.18} ${y + s * 0.18} ${x - s} ${y} Q${x - s * 0.18} ${y - s * 0.18} ${x} ${y - s} Z" fill="${c}" stroke="${INK}" stroke-width="${Math.max(2.5, s * 0.16)}" stroke-linejoin="round"/>`;

// ---------- Scritta ----------
const COLORS = ['#ff5a5f', '#ff9f1c', '#ffc800', '#35c46a', '#36a9f0', '#8a5cf6', '#ff5e9a', '#17b8a6', '#ff5a5f'];
const BOUNCE = [0, -9, 7, -6, 9, -11, 3, -5, 7];
const TILT = [-5, 3, -3, 4, -2, 3, -4, 2, -3];

export function wordmark(size = 200) {
  const chars = ['T', 'a', 'p', 'p', 'o', 'l', 'ı', 'n', 'o'];
  const hasDotless = font.charToGlyph('ı').index !== 0;
  if (!hasDotless) chars[6] = 'i';
  let x = 0;
  const letters = [];
  const scale = size / font.unitsPerEm;
  chars.forEach((ch, i) => {
    const g = font.charToGlyph(ch);
    const adv = g.advanceWidth * scale;
    const p = g.getPath(0, 0, size);
    const bb = p.getBoundingBox();
    const cx = (bb.x1 + bb.x2) / 2, cy = (bb.y1 + bb.y2) / 2;
    letters.push({ d: p.toPathData(1), x, i, cx, cy, bb, ch });
    x += adv + size * 0.012;
  });
  const width = x - size * 0.012;
  const defs = [], white = [], outline = [], fill = [], extra = [];
  letters.forEach((L) => {
    const c = COLORS[L.i], id = `w${L.i}`;
    const tr = `translate(${L.x.toFixed(1)} ${BOUNCE[L.i]}) rotate(${TILT[L.i]} ${L.cx.toFixed(1)} ${L.cy.toFixed(1)})`;
    const depth = size * 0.055;
    defs.push(`<linearGradient id="${id}" x1="0" y1="0" x2="0.35" y2="1"><stop offset="0" stop-color="${shade(c, 0.45)}"/><stop offset=".5" stop-color="${c}"/><stop offset="1" stop-color="${shade(c, -0.18)}"/></linearGradient>
      <path id="${id}p" d="${L.d}"/><clipPath id="${id}c"><use href="#${id}p"/></clipPath>`);
    white.push(`<g transform="${tr}"><use href="#${id}p" stroke="#fff" stroke-width="${size * 0.2}" stroke-linejoin="round" fill="#fff"/><use href="#${id}p" transform="translate(0 ${depth})" stroke="#fff" stroke-width="${size * 0.2}" stroke-linejoin="round" fill="#fff"/></g>`);
    outline.push(`<g transform="${tr}"><use href="#${id}p" stroke="${INK}" stroke-width="${size * 0.075}" stroke-linejoin="round" fill="${INK}"/><use href="#${id}p" transform="translate(0 ${depth})" stroke="${INK}" stroke-width="${size * 0.075}" stroke-linejoin="round" fill="${INK}"/></g>`);
    fill.push(`<g transform="${tr}"><use href="#${id}p" transform="translate(0 ${depth})" fill="${shade(c, -0.42)}"/><use href="#${id}p" fill="url(#${id})"/>
      <g clip-path="url(#${id}c)"><ellipse cx="${(L.bb.x1 + (L.bb.x2 - L.bb.x1) * 0.3).toFixed(1)}" cy="${(L.bb.y1 + (L.bb.y2 - L.bb.y1) * 0.16).toFixed(1)}" rx="${((L.bb.x2 - L.bb.x1) * 0.42).toFixed(1)}" ry="${size * 0.07}" fill="#fff" opacity=".42" transform="rotate(-12 ${L.cx.toFixed(1)} ${L.cy.toFixed(1)})"/></g></g>`);
    if (L.ch === 'ı') {
      // Il puntino della "i" è una stella.
      const sx = L.x + L.cx + size * 0.03, sy = L.bb.y1 + BOUNCE[L.i] - size * 0.27;
      extra.push({ sx, sy });
    }
  });
  let star = '', starWhite = '';
  extra.forEach(({ sx, sy }) => {
    const r = size * 0.175;
    defs.push(`<linearGradient id="wst" x1="0" y1="0" x2="0.4" y2="1"><stop offset="0" stop-color="#fff6b0"/><stop offset=".5" stop-color="#ffd23f"/><stop offset="1" stop-color="#f59a00"/></linearGradient>`);
    starWhite = `<path d="${starPath(sx, sy, r)}" fill="#fff" stroke="#fff" stroke-width="${size * 0.15}" stroke-linejoin="round" transform="rotate(12 ${sx} ${sy})"/>`;
    star = `<g transform="rotate(12 ${sx} ${sy})"><path d="${starPath(sx, sy + size * 0.03, r, 0.56)}" fill="${INK}" stroke="${INK}" stroke-width="${size * 0.03}" stroke-linejoin="round"/>
      <path d="${starPath(sx, sy, r, 0.56)}" fill="url(#wst)" stroke="${INK}" stroke-width="${size * 0.028}" stroke-linejoin="round"/>
      <ellipse cx="${sx - r * 0.25}" cy="${sy - r * 0.2}" rx="${r * 0.22}" ry="${r * 0.12}" fill="#fff" opacity=".8" transform="rotate(-30 ${sx} ${sy})"/></g>`;
  });
  const body = `<defs>${defs.join('')}</defs>${white.join('')}${starWhite}${outline.join('')}${fill.join('')}${star}`;
  // Riquadro: le lettere hanno la linea di base a y=0.
  return { body, width, top: -size * 0.98, bottom: size * 0.42 };
}

// ---------- Mascotte "Tappo" (riquadro 300×340) ----------
export function mascot() {
  const teeth = 9, x0 = 80, x1 = 220, yTop = 108, yMid = 124, yTip = 138;
  let skirt = `M${x0} ${yTop} L${x0} ${yMid} `;
  const step = (x1 - x0) / teeth;
  for (let i = 0; i < teeth; i++) skirt += `L${(x0 + step * (i + 0.5)).toFixed(1)} ${yTip} L${(x0 + step * (i + 1)).toFixed(1)} ${yMid} `;
  skirt += `L${x1} ${yTop} Z`;
  return `<defs>
    <radialGradient id="mb" cx=".34" cy=".26" r=".85"><stop offset="0" stop-color="#ffc0ab"/><stop offset=".5" stop-color="#ff6b5e"/><stop offset="1" stop-color="#cf3b3b"/></radialGradient>
    <linearGradient id="mc" x1="0" y1="0" x2=".5" y2="1"><stop offset="0" stop-color="#fff6b0"/><stop offset=".5" stop-color="#ffd23f"/><stop offset="1" stop-color="#f59a00"/></linearGradient>
    <linearGradient id="ms" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffc21f"/><stop offset="1" stop-color="#e88600"/></linearGradient>
    <radialGradient id="mr" cx=".5" cy=".5" r=".5"><stop offset=".55" stop-color="#36a9f0" stop-opacity="0"/><stop offset=".8" stop-color="#36a9f0" stop-opacity=".55"/><stop offset="1" stop-color="#36a9f0" stop-opacity="0"/></radialGradient>
  </defs>
  <!-- onde del tocco -->
  <ellipse cx="150" cy="306" rx="140" ry="30" fill="url(#mr)"/>
  <ellipse cx="150" cy="306" rx="96" ry="19" fill="none" stroke="#36a9f0" stroke-width="7" opacity=".75"/>
  <ellipse cx="150" cy="306" rx="60" ry="11" fill="#1d2440" opacity=".28"/>
  <g transform="rotate(-6 150 200)" fill="#fff" stroke="#fff" stroke-width="24" stroke-linejoin="round" stroke-linecap="round">
    <rect x="85" y="92" width="130" height="204" rx="65"/><path d="M86 112 Q88 58 150 54 Q212 58 214 112 Z"/><path d="${skirt}"/>
    <ellipse cx="124" cy="296" rx="25" ry="13"/><ellipse cx="178" cy="296" rx="25" ry="13"/>
    <path d="M90 200 Q52 196 40 150" fill="none" stroke-width="42"/><path d="M210 208 Q246 220 250 262" fill="none" stroke-width="42"/>
  </g>
  <g transform="rotate(-6 150 200)">
    <!-- piedi -->
    <ellipse cx="124" cy="296" rx="25" ry="13" fill="#cf3b3b" stroke="${INK}" stroke-width="7"/>
    <ellipse cx="178" cy="296" rx="25" ry="13" fill="#cf3b3b" stroke="${INK}" stroke-width="7"/>
    <!-- braccia -->
    <path d="M90 200 Q52 196 40 150" fill="none" stroke="${INK}" stroke-width="26" stroke-linecap="round"/>
    <path d="M90 200 Q52 196 40 150" fill="none" stroke="#ff6b5e" stroke-width="13" stroke-linecap="round"/>
    <path d="M210 208 Q246 220 250 262" fill="none" stroke="${INK}" stroke-width="26" stroke-linecap="round"/>
    <path d="M210 208 Q246 220 250 262" fill="none" stroke="#e85550" stroke-width="13" stroke-linecap="round"/>
    <!-- corpo: un ditino -->
    <rect x="85" y="92" width="130" height="204" rx="65" fill="url(#mb)" stroke="${INK}" stroke-width="8"/>
    <ellipse cx="118" cy="150" rx="16" ry="40" fill="#fff" opacity=".28" transform="rotate(8 118 150)"/>
    <!-- pancia-polpastrello con impronta -->
    <ellipse cx="150" cy="243" rx="41" ry="40" fill="#ffe1d6"/>
    <path d="M124 250 Q150 208 176 250 M132 259 Q150 230 168 259 M141 266 Q150 251 159 266" fill="none" stroke="#ff9c8c" stroke-width="5.5" stroke-linecap="round"/>
    <!-- viso -->
    <ellipse cx="127" cy="166" rx="18" ry="21" fill="#fff" stroke="${INK}" stroke-width="5"/>
    <ellipse cx="173" cy="166" rx="18" ry="21" fill="#fff" stroke="${INK}" stroke-width="5"/>
    <circle cx="131" cy="169" r="10" fill="${INK}"/><circle cx="177" cy="169" r="10" fill="${INK}"/>
    <circle cx="135" cy="164" r="4" fill="#fff"/><circle cx="181" cy="164" r="4" fill="#fff"/>
    <ellipse cx="106" cy="194" rx="11" ry="7" fill="#ff8fb0" opacity=".8"/>
    <ellipse cx="194" cy="194" rx="11" ry="7" fill="#ff8fb0" opacity=".8"/>
    <path d="M131 194 Q150 220 169 194 Z" fill="#7a1f2b" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/>
    <path d="M141 204 Q150 213 159 204 Q150 199 141 204 Z" fill="#ff7a90"/>
    <!-- cappello a tappo -->
    <path d="${skirt}" fill="url(#ms)" stroke="${INK}" stroke-width="8" stroke-linejoin="round"/>
    <path d="M86 112 Q88 58 150 54 Q212 58 214 112 Z" fill="url(#mc)" stroke="${INK}" stroke-width="8" stroke-linejoin="round"/>
    <ellipse cx="120" cy="78" rx="20" ry="8" fill="#fff" opacity=".75" transform="rotate(-28 120 78)"/>
    <path d="${starPath(152, 86, 17)}" fill="#ff5e9a" stroke="${INK}" stroke-width="4.5" stroke-linejoin="round"/>
  </g>
  ${sparkle(34, 96, 17, '#ffd23f')}${sparkle(268, 132, 13, '#36a9f0')}${sparkle(252, 44, 10, '#ff5e9a')}`;
}

const svg = (w, h, body, vb) => `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="${vb ?? `0 0 ${w} ${h}`}">${body}</svg>`;
const shadow = `<filter id="ds" x="-10%" y="-10%" width="120%" height="130%"><feDropShadow dx="0" dy="10" stdDeviation="9" flood-color="#1d2440" flood-opacity=".28"/></filter>`;

export function logoHorizontal() {
  const wm = wordmark(200);
  const pad = 40, mH = 340, mW = 300, mScale = 1.0;
  const h = mH * mScale + pad * 2;
  const wx = pad + mW * mScale - 6, wy = pad + 252;
  const w = wx + wm.width + pad + 10;
  return svg(Math.round(w), Math.round(h), `<defs>${shadow}</defs><g filter="url(#ds)"><g transform="translate(${wx} ${wy})">${wm.body}</g></g><g transform="translate(${pad} ${pad}) scale(${mScale})">${mascot()}</g>`);
}
export function logoStacked() {
  const wm = wordmark(200);
  const pad = 40, mScale = 0.95;
  const w = wm.width + pad * 2 + 20;
  const mX = (w - 300 * mScale) / 2;
  const wy = pad + 340 * mScale + 150;
  const h = wy + 110 + pad;
  return svg(Math.round(w), Math.round(h), `<defs>${shadow}</defs><g transform="translate(${mX} ${pad}) scale(${mScale})">${mascot()}</g><g filter="url(#ds)"><g transform="translate(${pad + 10} ${wy})">${wm.body}</g></g>`);
}
export const markOnly = () => svg(300, 340, mascot());

export function wordmarkOnly() {
  const wm = wordmark(200);
  const pad = 46;
  const w = wm.width + pad * 2, h = 330 + pad;
  return svg(Math.round(w), Math.round(h), `<g transform="translate(${pad} ${pad + 226})">${wm.body}</g>`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const out = 'src/core/brand';
  mkdirSync(out, { recursive: true });
  const files = { 'mark.svg': markOnly(), 'wordmark.svg': wordmarkOnly(), 'logo.svg': logoHorizontal(), 'logo-stacked.svg': logoStacked() };
  for (const [name, content] of Object.entries(files)) {
    writeFileSync(`${out}/${name}`, content + '\n');
    const m = /width="(\d+)" height="(\d+)"/.exec(content);
    console.log('✓', name, `${m[1]}×${m[2]}`, `${(content.length / 1024).toFixed(1)} kB`);
  }
}
