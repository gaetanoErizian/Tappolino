import { svgDoc, type SvgTex } from '../../core/textures';
import { lightGrad, ballGrad, blur, shade, starPath, roundButton, uid } from '../../core/art';
import { DINOS, FRAME, FLOOR, type Dino, type Leg } from './dinos';
import { HEADS, piecesOf, smoothPath, taper, plateSpots, platePath, wingPts, BONE } from './skeleton';

/**
 * Grafica 2.5D di Scavo dei Dinosauri (decisione 8): deserto al tramonto a piani, buca dello scavo,
 * terra da strofinare, ossa, dinosauri buffi e tondi. Tutto disegnato qui in SVG, originale.
 * Chiavi prefissate "di_".
 */

const f = (n: number): string => n.toFixed(1);
const G = (id: string, base: string, k = 0.4, vertical = false): string => lightGrad(id, shade(base, k), base, shade(base, -0.3), vertical);
const B = (id: string, base: string, k = 0.5): string => ballGrad(id, shade(base, k), base, shade(base, -0.32));
const shine = (cx: number, cy: number, rx: number, ry: number, rot = -25, op = 0.75): string =>
  `<ellipse cx="${f(cx)}" cy="${f(cy)}" rx="${f(rx)}" ry="${f(ry)}" transform="rotate(${rot} ${f(cx)} ${f(cy)})" fill="#fff" opacity="${op}"/>`;

/** Generatore pseudo-casuale con seme (disegni identici a ogni avvio). */
function rng(seed: number): () => number {
  let s = seed >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}

// =====================================================================
// Dinosauri vivi
// =====================================================================

interface Skin { base: string; light: string; dark: string; line: string; belly: string; far: string; farLine: string }
const skinOf = (d: Dino): Skin => ({
  base: d.color, light: shade(d.color, 0.45), dark: shade(d.color, -0.28), line: shade(d.color, -0.48),
  belly: shade(d.color, 0.62), far: shade(d.color, -0.2), farLine: shade(d.color, -0.55),
});

function legSvg(l: Leg, s: Skin, far: boolean): string {
  const g = uid('lg');
  const base = far ? s.far : s.base;
  const line = far ? s.farLine : s.line;
  const top = l.y, bot = l.y + l.len, w = l.w;
  const toes = [-0.1, 0.25, 0.6].map((k) => `<ellipse cx="${f(l.x + w * k + w * 0.15)}" cy="${f(bot - 6)}" rx="${f(w * 0.13)}" ry="${f(w * 0.1)}" fill="#fff6e0" stroke="${line}" stroke-width="2"/>`).join('');
  return `<defs>${lightGrad(g, far ? s.base : s.light, base, far ? s.farLine : s.dark)}</defs>
    <ellipse cx="${f(l.x)}" cy="${f(top + l.len * 0.16)}" rx="${f(w * 0.82)}" ry="${f(l.len * 0.34)}" fill="url(#${g})" stroke="${line}" stroke-width="4"/>
    <path d="M${f(l.x - w * 0.48)} ${f(top + l.len * 0.2)} L${f(l.x - w * 0.46)} ${f(bot - 14)} Q${f(l.x - w * 0.5)} ${f(bot + 4)} ${f(l.x)} ${f(bot + 2)} L${f(l.x + w * 0.62)} ${f(bot + 2)} Q${f(l.x + w * 0.95)} ${f(bot)} ${f(l.x + w * 0.75)} ${f(bot - 22)} L${f(l.x + w * 0.46)} ${f(bot - 30)} L${f(l.x + w * 0.48)} ${f(top + l.len * 0.2)} Z"
      fill="url(#${g})" stroke="${line}" stroke-width="4" stroke-linejoin="round"/>
    ${far ? '' : shine(l.x - w * 0.18, top + l.len * 0.1, w * 0.22, l.len * 0.1, -10, 0.45)}
    ${toes}`;
}

function armSvg(a: Leg, s: Skin): string {
  const elbow = { x: a.x + a.len * 0.35, y: a.y + a.len * 0.55 };
  const hand = { x: a.x + a.len * 0.82, y: a.y + a.len * 0.72 };
  const d = smoothPath([{ x: a.x, y: a.y }, elbow, hand]);
  return `<path d="${d}" stroke="${s.line}" stroke-width="${f(a.w + 8)}" fill="none" stroke-linecap="round"/>
    <path d="${d}" stroke="${s.base}" stroke-width="${f(a.w)}" fill="none" stroke-linecap="round"/>
    <path d="${d}" stroke="${s.light}" stroke-width="${f(a.w * 0.3)}" fill="none" stroke-linecap="round" transform="translate(-3 -4)" opacity=".7"/>
    <circle cx="${f(hand.x + 6)}" cy="${f(hand.y + 2)}" r="${f(a.w * 0.45)}" fill="${s.base}" stroke="${s.line}" stroke-width="3"/>`;
}

/** Dinosauro vivo, senza bocca né palpebre (sono texture a parte, animate). */
function dinoSvg(d: Dino): string {
  const p = d.pose, s = skinOf(d), b = p.body, h = p.head, hs = HEADS[d.id];
  const gb = uid('db'), gh = uid('dh'), ga = uid('da'), gt = uid('dt'), sh = uid('ds');
  const acc = d.accent;
  let o = `<defs>${B(gb, s.base, 0.45)}${ballGrad(gh, s.light, s.base, s.dark)}${B(ga, acc, 0.45)}${G(gt, s.base, 0.35)}${blur(sh, 10)}
    <radialGradient id="${gb}u" gradientUnits="userSpaceOnUse" cx="${f(b.x - b.rx * 0.32)}" cy="${f(b.y - b.ry * 0.42)}" r="${f(Math.max(b.rx, b.ry) * 1.3)}">
      <stop offset="0" stop-color="${shade(s.base, 0.45)}"/><stop offset=".5" stop-color="${s.base}"/><stop offset="1" stop-color="${shade(s.base, -0.32)}"/></radialGradient>
    <clipPath id="${gb}c"><ellipse cx="${b.x}" cy="${b.y}" rx="${b.rx + 4}" ry="${b.ry + 4}"/></clipPath>
    <radialGradient id="${gb}b" cx=".4" cy=".3" r=".8"><stop offset="0" stop-color="#fffdf2"/><stop offset="1" stop-color="${s.belly}"/></radialGradient></defs>`;
  // ombra a terra
  const feet = [...p.back, ...p.front].map((l) => l.x);
  const fx0 = Math.min(...feet, b.x) - 60, fx1 = Math.max(...feet, b.x) + 90;
  if (d.id === 'ptero') o += `<ellipse cx="${b.x}" cy="${FRAME.h - 34}" rx="150" ry="18" fill="#3a1d0e" opacity=".25" filter="url(#${sh})"/>`;
  else o += `<ellipse cx="${f((fx0 + fx1) / 2)}" cy="${GROUND_Y}" rx="${f((fx1 - fx0) / 2 + 40)}" ry="22" fill="#3a1d0e" opacity=".3" filter="url(#${sh})"/>`;

  // ali dello pterosauro (dietro a tutto)
  if (d.id === 'ptero') {
    for (const side of [-1, 1] as const) {
      const [shp, el, wr, tip] = wingPts(d, side);
      const hip = { x: b.x + side * b.rx * 0.2, y: b.y + b.ry * 0.45 };
      const scal = [0.25, 0.5, 0.75].map((t) => ({ x: tip.x + (hip.x - tip.x) * t, y: tip.y + (hip.y - tip.y) * t + 34 - Math.abs(t - 0.5) * 24 }));
      const mem = smoothPath([shp, el, wr, tip, ...scal, hip], true);
      o += `<path d="${mem}" fill="url(#${ga})" stroke="${shade(acc, -0.45)}" stroke-width="4" stroke-linejoin="round"/>
        <path d="${smoothPath([wr, scal[0]])} M${f(el.x)} ${f(el.y)} L${f(scal[1].x)} ${f(scal[1].y)}" stroke="${shade(acc, -0.3)}" stroke-width="3" fill="none" opacity=".6"/>
        <path d="${smoothPath([shp, el, wr, tip])}" stroke="${s.line}" stroke-width="16" fill="none" stroke-linecap="round"/>
        <path d="${smoothPath([shp, el, wr, tip])}" stroke="${s.base}" stroke-width="10" fill="none" stroke-linecap="round"/>`;
    }
  }
  // zampe del lato lontano
  for (const l of [...p.back, ...p.front].filter((x) => x.far)) o += legSvg(l, s, true);
  // placche dello stegosauro, cresta del rex (sporgono dal dorso)
  if (d.id === 'stego') for (const q of plateSpots(d)) {
    o += `<path d="${platePath(q.x, q.y + 4, q.s * 1.08)}" fill="url(#${ga})" stroke="${shade(acc, -0.45)}" stroke-width="4" stroke-linejoin="round"/>
      <path d="M${f(q.x - 10 * q.s)} ${f(q.y - 50 * q.s)} Q${f(q.x - 18 * q.s)} ${f(q.y - 20 * q.s)} ${f(q.x - 26 * q.s)} ${f(q.y)}" stroke="#fff" stroke-width="5" fill="none" opacity=".45" stroke-linecap="round"/>`;
  }
  if (d.id === 'rex' || d.id === 'para' || d.id === 'brachio') {
    for (let i = 0; i < 6; i++) {
      const a = Math.PI * (1.2 + (0.5 * i) / 5);
      const x = b.x + Math.cos(a) * b.rx * 0.98, y = b.y + Math.sin(a) * b.ry * 0.98;
      const r = 13 - Math.abs(i - 2.5) * 1.5;
      o += `<path d="M${f(x - r)} ${f(y + 6)} Q${f(x)} ${f(y - r * 2.2)} ${f(x + r)} ${f(y + 6)} Z" fill="${acc}" stroke="${shade(acc, -0.45)}" stroke-width="3"/>`;
    }
  }
  // coda
  const tailPts = [{ x: b.x - b.rx * 0.5, y: b.y - b.ry * 0.05 }, ...p.tail];
  const tw0 = d.id === 'ptero' ? 40 : b.ry * 1.25;
  o += `<path d="${taper(tailPts, tw0, d.id === 'ptero' ? 10 : 16)}" fill="url(#${gt})" stroke="${s.line}" stroke-width="5" stroke-linejoin="round"/>`;
  const te = p.tail[p.tail.length - 1];
  if (d.id === 'anky') {
    o += `<ellipse cx="${f(te.x + 4)}" cy="${f(te.y)}" rx="40" ry="32" fill="url(#${ga})" stroke="${shade(acc, -0.45)}" stroke-width="4"/>
      ${shine(te.x - 8, te.y - 12, 14, 7)}<ellipse cx="${f(te.x + 20)}" cy="${f(te.y + 8)}" rx="14" ry="12" fill="${shade(acc, 0.25)}" opacity=".6"/>`;
  }
  if (d.id === 'stego') {
    for (const [dx, dy, ex, ey] of [[40, -12, 70, -70], [16, -10, 0, -76]]) {
      o += `<path d="M${f(te.x + dx - 10)} ${f(te.y + dy + 6)} L${f(te.x + ex)} ${f(te.y + ey)} L${f(te.x + dx + 10)} ${f(te.y + dy + 6)} Z" fill="#fff3d6" stroke="${s.line}" stroke-width="3" stroke-linejoin="round"/>`;
    }
  }
  // collo
  const neckPts = [{ x: b.x + b.rx * 0.45, y: b.y - b.ry * 0.25 }, ...p.neck, { x: h.x - h.r * 0.3, y: h.y + h.r * 0.1 }];
  const neckD = taper(neckPts, p.neckW * 1.25, p.neckW * 0.85);
  o += `<path d="${neckD}" fill="url(#${gt})" stroke="${s.line}" stroke-width="5" stroke-linejoin="round"/>`;
  // corpo con pancia e macchie
  o += `<ellipse cx="${b.x}" cy="${b.y}" rx="${b.rx}" ry="${b.ry}" fill="url(#${gb}u)" stroke="${s.line}" stroke-width="5"/>`;
  o += `<ellipse cx="${f(b.x + b.rx * 0.18)}" cy="${f(b.y + b.ry * 0.38)}" rx="${f(b.rx * 0.66)}" ry="${f(b.ry * 0.5)}" fill="url(#${gb}b)" opacity=".95"/>`;
  for (let i = 0; i < 3; i++) {
    const y = b.y + b.ry * (0.22 + i * 0.18);
    o += `<path d="M${f(b.x - b.rx * 0.3 + i * 10)} ${f(y)} Q${f(b.x + b.rx * 0.2)} ${f(y + 10)} ${f(b.x + b.rx * 0.66 - i * 14)} ${f(y - 4)}" stroke="${shade(s.belly, -0.18)}" stroke-width="3" fill="none" opacity=".7"/>`;
  }
  const rr = rng(d.id.length * 97 + d.color.charCodeAt(1));
  if (d.id === 'anky') {
    for (let row = 0; row < 2; row++) for (let i = 0; i < 6 - row; i++) {
      const a = Math.PI * (1.12 + (0.76 * (i + row * 0.5)) / 5);
      const k = row ? 0.62 : 0.86;
      const x = b.x + Math.cos(a) * b.rx * k, y = b.y + Math.sin(a) * b.ry * k;
      o += `<ellipse cx="${f(x)}" cy="${f(y)}" rx="22" ry="15" fill="url(#${ga})" stroke="${shade(acc, -0.45)}" stroke-width="3"/>${shine(x - 6, y - 5, 7, 3.5, -15, 0.6)}`;
    }
  } else {
    for (let i = 0; i < 5; i++) {
      const a = Math.PI * (1.15 + rr() * 0.7);
      const k = 0.45 + rr() * 0.35;
      const x = b.x + Math.cos(a) * b.rx * k, y = b.y + Math.sin(a) * b.ry * k;
      o += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(9 + rr() * 9)}" fill="${d.id === 'brachio' ? acc : s.dark}" opacity="${d.id === 'brachio' ? 0.85 : 0.35}"/>`;
    }
  }
  o += shine(b.x - b.rx * 0.45, b.y - b.ry * 0.5, b.rx * 0.22, b.ry * 0.12, -20, 0.5);
  // il collo copre il bordo del corpo dove si attacca
  o += `<path d="${neckD}" fill="url(#${gb}u)" clip-path="url(#${gb}c)"/>`;
  if (d.id === 'brachio') for (let i = 1; i < 4; i++) {
    const q = p.neck[Math.min(p.neck.length - 1, i - 1)];
    o += `<circle cx="${f(q.x + 6)}" cy="${f(q.y - 4)}" r="${f(10 - i)}" fill="${acc}" opacity=".85"/>`;
  }
  // collare del triceratopo (dietro la testa)
  if (d.id === 'tricera') {
    o += `<g transform="translate(${h.x} ${h.y}) scale(${h.r})">
      <path d="M0.05 -0.5 C-0.2 -1.45 -1.35 -1.5 -1.5 -0.6 C-1.6 0.0 -1.2 0.45 -0.55 0.45 Z" fill="url(#${ga})" stroke="${shade(acc, -0.45)}" stroke-width=".05"/>
      ${[[-0.25, -1.18], [-0.75, -1.33], [-1.2, -1.05], [-1.42, -0.55], [-1.3, -0.05]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r=".13" fill="${shade(acc, -0.2)}" stroke="${shade(acc, -0.45)}" stroke-width=".04"/>`).join('')}
      <circle cx="-0.75" cy="-0.62" r=".16" fill="${shade(acc, 0.35)}"/><circle cx="-1.05" cy="-0.2" r=".1" fill="${shade(acc, 0.35)}"/></g>`;
  }
  // testa (unità del raggio)
  const lw = 5 / h.r;
  let back = '', front = '';
  if (d.id === 'ptero') back += `<path d="M-0.2 -0.45 C-0.6 -0.9 -1.2 -1.1 -1.5 -1.1 C-1.1 -0.75 -0.75 -0.35 -0.5 -0.05 Z" fill="url(#${ga})" stroke="${shade(acc, -0.45)}" stroke-width="${f(lw)}"/>`;
  if (d.id === 'para') back += `<path d="M0.0 -0.55 C-0.5 -0.95 -1.1 -1.15 -1.7 -1.1" stroke="${shade(acc, -0.45)}" stroke-width=".42" fill="none" stroke-linecap="round"/>
    <path d="M0.0 -0.55 C-0.5 -0.95 -1.1 -1.15 -1.7 -1.1" stroke="${acc}" stroke-width=".32" fill="none" stroke-linecap="round"/>
    <path d="M-0.15 -0.7 C-0.6 -1.02 -1.1 -1.2 -1.6 -1.18" stroke="#fff" stroke-width=".07" fill="none" stroke-linecap="round" opacity=".6"/>`;
  if (d.id === 'anky') back += `<path d="M-0.62 -0.42 L-1.05 -0.78 L-0.78 -0.2 Z M-0.55 0.36 L-0.98 0.62 L-0.7 0.12 Z" fill="#fff3d6" stroke="${s.line}" stroke-width="${f(lw * 0.8)}" stroke-linejoin="round"/>`;
  if (d.id === 'tricera') front += `<path d="M0.1 -0.58 Q0.45 -1.05 0.85 -1.4 Q0.62 -0.95 0.42 -0.55 Z" fill="#fff3d6" stroke="${s.line}" stroke-width="${f(lw * 0.8)}" stroke-linejoin="round"/>
    <path d="M1.0 -0.32 Q1.12 -0.6 1.25 -0.78 Q1.24 -0.5 1.2 -0.25 Z" fill="#fff3d6" stroke="${s.line}" stroke-width="${f(lw * 0.8)}" stroke-linejoin="round"/>`;
  if (d.id === 'pachy') {
    front += `<path d="M-0.72 -0.35 C-0.75 -0.85 -0.3 -1.0 0.05 -1.0 C0.5 -1.0 0.85 -0.75 0.88 -0.42 C0.4 -0.55 -0.3 -0.55 -0.72 -0.35 Z" fill="url(#${ga})" opacity=".95"/>
      ${[[-0.82, -0.25], [-0.7, -0.62], [-0.38, -0.92], [0.72, -0.6], [0.92, -0.22]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r=".1" fill="${acc}" stroke="${shade(acc, -0.45)}" stroke-width=".035"/>`).join('')}
      ${shine(-0.2, -0.8, 0.22, 0.09, -10, 0.7)}`;
  }
  const e = hs.eye;
  o += `<g transform="translate(${h.x} ${h.y}) scale(${h.r})">${back}
    <path d="${hs.d}" fill="url(#${gh})" stroke="${s.line}" stroke-width="${f(lw)}" stroke-linejoin="round"/>
    ${shine(-0.2, -0.55, 0.3, 0.13, -15, 0.55)}
    <ellipse cx="${f(e.x + 0.42)}" cy="${f(e.y + 0.42)}" rx=".2" ry=".12" fill="#ff7f8f" opacity=".55"/>
    <ellipse cx="${hs.nose.x}" cy="${hs.nose.y}" rx=".06" ry=".045" fill="${s.line}"/>
    ${front}
    <ellipse cx="${e.x}" cy="${e.y}" rx=".27" ry=".29" fill="#fff" stroke="${s.line}" stroke-width="${f(lw * 0.7)}"/>
    <circle cx="${f(e.x + 0.06)}" cy="${f(e.y + 0.03)}" r=".17" fill="#2b1d14"/>
    <circle cx="${f(e.x + 0.01)}" cy="${f(e.y - 0.05)}" r=".065" fill="#fff"/><circle cx="${f(e.x + 0.12)}" cy="${f(e.y + 0.1)}" r=".03" fill="#fff"/>
  </g>`;
  // zampe e braccine del lato vicino
  for (const l of [...p.back, ...p.front].filter((x) => !x.far)) o += legSvg(l, s, false);
  for (const a of p.arms ?? []) o += armSvg(a, s);
  return svgDoc(FRAME.w, FRAME.h, o);
}

const GROUND_Y = 522;

/** Palpebra (grigia, colorata con il tint della pelle) e bocche, disegnate per una testa di raggio 88. */
function faceTextures(): SvgTex[] {
  const g = uid('li');
  return [
    { key: 'di_lid', w: 64, h: 64, svg: svgDoc(64, 64, `<defs>${ballGrad(g, '#ffffff', '#e6e6e6', '#b0b0b0')}</defs>
      <circle cx="32" cy="32" r="28" fill="url(#${g})" stroke="#555" stroke-width="3"/>
      <path d="M8 36 Q32 50 56 36" stroke="#333" stroke-width="4" fill="none" stroke-linecap="round"/>`) },
    // origine della bocca: (100/140, 30/100) = angolo della bocca sul muso
    { key: 'di_mouth_smile', w: 140, h: 100, svg: svgDoc(140, 100, `<path d="M26 22 Q66 52 108 26" stroke="#3a2418" stroke-width="7" fill="none" stroke-linecap="round"/>
      <path d="M22 16 Q24 24 30 26" stroke="#3a2418" stroke-width="5" fill="none" stroke-linecap="round"/>`) },
    { key: 'di_mouth_open', w: 140, h: 100, svg: svgDoc(140, 100, `<path d="M24 24 Q66 18 112 22 Q104 70 64 86 Q30 80 24 24 Z" fill="#7a1f2b" stroke="#3a2418" stroke-width="6" stroke-linejoin="round"/>
      <path d="M40 72 Q64 54 92 66 Q78 86 58 84 Z" fill="#ff7f95"/>
      <path d="M40 24 L46 40 L52 24 Z M86 22 L92 38 L98 22 Z" fill="#fff" stroke="#3a2418" stroke-width="2" stroke-linejoin="round"/>`) },
  ];
}

function dinoTextures(): SvgTex[] {
  return DINOS.map((d) => ({ key: `di_dino_${d.id}`, w: FRAME.w, h: FRAME.h, svg: dinoSvg(d) }));
}

/** Osso del puzzle e la sua "impronta" nella roccia (silhouette scura con bordo chiaro). */
function boneTextures(): SvgTex[] {
  const out: SvgTex[] = [];
  for (const d of DINOS) {
    for (const p of piecesOf(d.id)) {
      const pad = 6, w = p.w + pad * 2, h = p.h + pad * 2;
      const inner = `<g transform="translate(${pad - p.x} ${pad - p.y})">${p.svg}</g>`;
      out.push({ key: `di_bone_${d.id}_${p.id}`, w, h, svg: svgDoc(w, h, inner) });
      const fl = uid('im');
      out.push({ key: `di_ghost_${d.id}_${p.id}`, w, h, svg: svgDoc(w, h, `<defs><filter id="${fl}" x="-10%" y="-10%" width="120%" height="120%">
          <feFlood flood-color="#6b3a1c" flood-opacity=".55" result="c"/><feComposite in="c" in2="SourceAlpha" operator="in" result="s"/>
          <feMorphology in="SourceAlpha" operator="erode" radius="3" result="e"/><feOffset in="e" dx="2" dy="3" result="eo"/>
          <feFlood flood-color="#3b1d0b" flood-opacity=".45"/><feComposite in2="eo" operator="in" result="deep"/>
          <feMerge><feMergeNode in="s"/><feMergeNode in="deep"/></feMerge></filter></defs>
        <g filter="url(#${fl})">${inner}</g>`) });
    }
  }
  return out;
}

// =====================================================================
// Deserto al tramonto
// =====================================================================

function skyTex(): SvgTex {
  return { key: 'di_sky', w: 16, h: 512, svg: svgDoc(16, 512, `<defs><linearGradient id="s" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#5b4fa8"/><stop offset=".45" stop-color="#b46fae"/><stop offset=".72" stop-color="#ff8f7a"/>
    <stop offset=".9" stop-color="#ffbc86"/><stop offset="1" stop-color="#ffd896"/></linearGradient></defs><rect width="16" height="512" fill="url(#s)"/>`) };
}

function sunTex(): SvgTex {
  return { key: 'di_sun', w: 520, h: 520, svg: svgDoc(520, 520, `<defs>
    <radialGradient id="g"><stop offset=".3" stop-color="#fff2b8" stop-opacity=".9"/><stop offset=".55" stop-color="#ffb36b" stop-opacity=".45"/><stop offset="1" stop-color="#ff7a6b" stop-opacity="0"/></radialGradient>
    ${ballGrad('s', '#fffbe6', '#ffd36b', '#ff9b4a')}</defs>
    <circle cx="260" cy="260" r="258" fill="url(#g)"/><circle cx="260" cy="260" r="118" fill="url(#s)"/>
    <path d="M150 300 H370 M170 330 H350" stroke="#ffb06b" stroke-width="10" stroke-linecap="round" opacity=".55"/>`) };
}

function mesasFar(): SvgTex {
  const w = 2000, h = 360;
  return { key: 'di_mesa_far', w, h, svg: svgDoc(w, h, `<defs>
    <linearGradient id="m" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c77a8e"/><stop offset="1" stop-color="#e3a08f"/></linearGradient>
    <linearGradient id="hz" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffd2b0" stop-opacity=".25"/><stop offset="1" stop-color="#ffd8b8" stop-opacity=".75"/></linearGradient></defs>
    <path d="M0 360 V250 L90 250 L110 150 L330 140 L350 250 L520 260 L560 200 L700 196 L730 262 L1000 268 L1040 120 L1120 110 L1300 116 L1330 240 L1500 250 L1530 170 L1640 165 L1680 250 L2000 255 V360 Z" fill="url(#m)"/>
    <path d="M110 150 L330 140 L336 170 L118 178 Z M1040 120 L1300 116 L1306 146 L1046 150 Z" fill="#f2b3a0" opacity=".7"/>
    <path d="M0 360 V250 L90 250 L110 150 L330 140 L350 250 L520 260 L560 200 L700 196 L730 262 L1000 268 L1040 120 L1120 110 L1300 116 L1330 240 L1500 250 L1530 170 L1640 165 L1680 250 L2000 255 V360 Z" fill="url(#hz)"/>
    <path d="M0 360 V300 Q300 270 600 300 Q900 330 1200 296 Q1500 266 2000 300 V360 Z" fill="#eeb497"/>`) };
}

function dunesMid(): SvgTex {
  const w = 2000, h = 300;
  const rocks = [[180, 150], [620, 172], [1380, 160], [1760, 150]].map(([x, y]) =>
    `<ellipse cx="${x}" cy="${y + 26}" rx="70" ry="12" fill="#8a4a2a" opacity=".25"/><path d="M${x - 60} ${y + 26} Q${x - 50} ${y - 20} ${x} ${y - 26} Q${x + 50} ${y - 20} ${x + 60} ${y + 26} Z" fill="url(#r)"/>
     <path d="M${x - 30} ${y - 10} Q${x} ${y - 24} ${x + 20} ${y - 14}" stroke="#ffd8a8" stroke-width="5" fill="none" opacity=".7" stroke-linecap="round"/>`).join('');
  return { key: 'di_dunes', w, h, svg: svgDoc(w, h, `<defs>
    <linearGradient id="d" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f2a35e"/><stop offset="1" stop-color="#d9773f"/></linearGradient>
    ${G('r', '#c4693b', 0.35)}</defs>
    <path d="M0 300 V150 Q260 80 520 140 Q780 200 1040 130 Q1300 60 1560 130 Q1800 190 2000 140 V300 Z" fill="url(#d)"/>
    <path d="M0 150 Q260 80 520 140 Q780 200 1040 130 Q1300 60 1560 130 Q1800 190 2000 140" stroke="#ffd09a" stroke-width="7" fill="none" opacity=".7"/>
    ${rocks}`) };
}

function tentTex(): SvgTex {
  const stripes = Array.from({ length: 7 }, (_, i) => {
    const x0 = 60 + i * 50, x1 = x0 + 25;
    return `<path d="M210 40 L${x0} 330 L${x1} 330 Z" fill="#fff4e0" opacity=".55"/>`;
  }).join('');
  return { key: 'di_tent', w: 440, h: 380, svg: svgDoc(440, 380, `<defs>${G('t', '#e86f4a', 0.3)}${G('t2', '#b8482c', 0.2)}${blur('b', 6)}
    <linearGradient id="in" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5a2a1c"/><stop offset="1" stop-color="#3a1810"/></linearGradient></defs>
    <ellipse cx="220" cy="346" rx="210" ry="20" fill="#3a1d0e" opacity=".35" filter="url(#b)"/>
    <path d="M210 40 L410 334 L320 334 Z" fill="url(#t2)"/>
    <path d="M210 40 L30 334 L330 334 Z" fill="url(#t)" stroke="#9a3a22" stroke-width="4" stroke-linejoin="round"/>
    ${stripes}
    <path d="M210 120 L150 334 L250 334 Z" fill="url(#in)"/>
    <path d="M210 120 L150 334 L176 334 Q196 230 210 120 Z" fill="#f6c19a"/>
    <path d="M210 40 V8" stroke="#7a4a2a" stroke-width="7" stroke-linecap="round"/>
    <path d="M210 10 L262 22 L210 36 Z" fill="#ffd14a" stroke="#d99a1a" stroke-width="3"/>
    <path d="M30 334 L4 362 M330 334 L370 364 M410 334 L436 360" stroke="#7a4a2a" stroke-width="4"/>`) };
}

function crateTex(): SvgTex {
  return { key: 'di_crate', w: 220, h: 190, svg: svgDoc(220, 190, `<defs>${G('w', '#c9853a', 0.35)}${G('w2', '#9a5f26', 0.2)}${blur('b', 5)}</defs>
    <ellipse cx="110" cy="176" rx="104" ry="12" fill="#3a1d0e" opacity=".35" filter="url(#b)"/>
    <path d="M20 56 L60 26 H204 L170 56 Z" fill="#e2a660" stroke="#7a4a1e" stroke-width="4" stroke-linejoin="round"/>
    <path d="M170 56 L204 26 V146 L170 176 Z" fill="url(#w2)" stroke="#7a4a1e" stroke-width="4" stroke-linejoin="round"/>
    <rect x="20" y="56" width="150" height="120" fill="url(#w)" stroke="#7a4a1e" stroke-width="4"/>
    <path d="M20 96 H170 M20 136 H170" stroke="#8a5523" stroke-width="4" opacity=".6"/>
    <path d="M28 64 L162 168 M162 64 L28 168" stroke="#a86a2c" stroke-width="10" opacity=".55"/>
    <path d="M30 66 H160" stroke="#ffe0b0" stroke-width="4" opacity=".6"/>
    <g transform="translate(70 34)"><path d="M0 10 Q30 -6 60 10" stroke="#f2e1bd" stroke-width="14" stroke-linecap="round" fill="none"/>
      <circle cx="-2" cy="4" r="9" fill="#fffaf0"/><circle cx="-2" cy="16" r="9" fill="#f2e1bd"/><circle cx="62" cy="4" r="9" fill="#fffaf0"/><circle cx="62" cy="16" r="9" fill="#f2e1bd"/></g>`) };
}

function lanternTex(): SvgTex {
  return { key: 'di_lantern', w: 100, h: 150, svg: svgDoc(100, 150, `<defs>${ballGrad('l', '#fff8d0', '#ffd25a', '#f08a1a')}${G('m', '#5a6a7a', 0.4)}</defs>
    <path d="M30 22 Q50 -6 70 22" stroke="#4a5562" stroke-width="6" fill="none"/>
    <rect x="22" y="22" width="56" height="16" rx="6" fill="url(#m)"/>
    <rect x="28" y="38" width="44" height="74" rx="14" fill="url(#l)" stroke="#8a5a1a" stroke-width="3"/>
    <path d="M50 40 V110" stroke="#c97a1a" stroke-width="3" opacity=".5"/>
    <rect x="18" y="112" width="64" height="18" rx="7" fill="url(#m)"/>
    ${shine(40, 58, 7, 16, 0, 0.8)}`) };
}

function toolsTex(): SvgTex {
  // piccone e pala appoggiati, secchiello
  return { key: 'di_tools', w: 320, h: 300, svg: svgDoc(320, 300, `<defs>${G('wd', '#b9773a', 0.4)}${G('mt', '#8fa0b4', 0.5)}${G('bk', '#4fa6d8', 0.4)}${blur('b', 5)}</defs>
    <ellipse cx="170" cy="282" rx="150" ry="14" fill="#3a1d0e" opacity=".35" filter="url(#b)"/>
    <path d="M70 280 L130 40" stroke="#6a3e1a" stroke-width="18" stroke-linecap="round"/><path d="M70 280 L130 40" stroke="url(#wd)" stroke-width="12" stroke-linecap="round"/>
    <path d="M70 46 Q132 10 196 46 Q132 32 70 46 Z" fill="url(#mt)" stroke="#4a5562" stroke-width="4" stroke-linejoin="round"/>
    <path d="M150 270 L196 70" stroke="#6a3e1a" stroke-width="16" stroke-linecap="round"/><path d="M150 270 L196 70" stroke="url(#wd)" stroke-width="10" stroke-linecap="round"/>
    <path d="M176 60 L222 70 L206 132 Q186 140 168 124 Z" fill="url(#mt)" stroke="#4a5562" stroke-width="4" stroke-linejoin="round"/>
    <path d="M210 196 H300 L290 280 H220 Z" fill="url(#bk)" stroke="#2d6f96" stroke-width="4" stroke-linejoin="round"/>
    <ellipse cx="255" cy="196" rx="45" ry="12" fill="#2d6f96"/><ellipse cx="255" cy="194" rx="40" ry="8" fill="#b5703a"/>
    <path d="M214 198 Q255 140 296 198" stroke="#4a5562" stroke-width="4" fill="none"/>
    ${shine(232, 226, 8, 22, 0, 0.6)}`) };
}

function fgRock(): SvgTex {
  return { key: 'di_fg_rock', w: 560, h: 340, svg: svgDoc(560, 340, `<defs>${G('r', '#a5502c', 0.35)}${blur('b', 7)}</defs>
    <g filter="url(#b)"><path d="M20 340 Q30 180 140 130 Q240 60 340 110 Q480 150 540 340 Z" fill="url(#r)"/>
    <path d="M140 130 Q240 60 340 110" stroke="#f0a070" stroke-width="16" fill="none" opacity=".6"/>
    <path d="M60 340 Q120 250 230 270 Q330 290 380 340 Z" fill="#7a3418" opacity=".55"/></g>`) };
}

/** Terra che copre il fondo della buca (si toglie strofinando). */
function soilTex(): SvgTex {
  const { w, h } = FLOOR;
  const r = rng(42);
  let clumps = '', pebbles = '', cracks = '';
  for (let i = 0; i < 90; i++) {
    const x = r() * w, y = r() * h, rx = 30 + r() * 70, ry = rx * (0.35 + r() * 0.25);
    clumps += `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(rx)}" ry="${f(ry)}" fill="${r() < 0.5 ? '#9a5a2e' : '#c07a42'}" opacity="${f(0.25 + r() * 0.3)}"/>`;
  }
  for (let i = 0; i < 70; i++) {
    const x = r() * w, y = r() * h, s = 5 + r() * 12;
    const c = r() < 0.5 ? '#d8b48a' : '#8a6a52';
    pebbles += `<ellipse cx="${f(x + 2)}" cy="${f(y + 3)}" rx="${f(s)}" ry="${f(s * 0.7)}" fill="#4a2410" opacity=".35"/>
      <ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(s)}" ry="${f(s * 0.7)}" fill="${c}"/><ellipse cx="${f(x - s * 0.3)}" cy="${f(y - s * 0.25)}" rx="${f(s * 0.35)}" ry="${f(s * 0.2)}" fill="#fff" opacity=".45"/>`;
  }
  for (let i = 0; i < 14; i++) {
    const x = r() * w, y = r() * h;
    cracks += `<path d="M${f(x)} ${f(y)} l${f(20 + r() * 30)} ${f(-8 + r() * 16)} l${f(16 + r() * 24)} ${f(-10 + r() * 20)} m${f(-30)} ${f(2)} l${f(-8)} ${f(18)}" stroke="#6a3418" stroke-width="3" fill="none" opacity=".45" stroke-linecap="round"/>`;
  }
  return { key: 'di_soil', w, h, svg: svgDoc(w, h, `<defs>
    <linearGradient id="s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#b8743f"/><stop offset="1" stop-color="#9c5c30"/></linearGradient>
    <radialGradient id="v" cx=".45" cy=".4" r=".75"><stop offset=".6" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#3a1808" stop-opacity=".35"/></radialGradient></defs>
    <rect width="${w}" height="${h}" fill="url(#s)"/>${clumps}${cracks}${pebbles}
    <rect width="${w}" height="${h}" fill="url(#v)"/>`) };
}

/** Roccia chiara del fondo, a strati (si vede dove la terra è stata tolta). */
function rockTex(): SvgTex {
  const { w, h } = FLOOR;
  const r = rng(7);
  let strata = '', dots = '';
  for (let i = 0; i < 9; i++) {
    const y = 30 + i * 58 + r() * 10;
    const pts = Array.from({ length: 9 }, (_, k) => ({ x: (k * w) / 8, y: y + Math.sin(k * 1.3 + i) * 10 }));
    strata += `<path d="${smoothPath(pts)}" stroke="${i % 2 ? '#d99a5e' : '#f7d3a0'}" stroke-width="${f(6 + r() * 10)}" fill="none" opacity=".55"/>`;
  }
  for (let i = 0; i < 120; i++) dots += `<circle cx="${f(r() * w)}" cy="${f(r() * h)}" r="${f(1.5 + r() * 3)}" fill="${r() < 0.5 ? '#c58a52' : '#fff1d8'}" opacity=".6"/>`;
  return { key: 'di_rock', w, h, svg: svgDoc(w, h, `<defs>
    <linearGradient id="r" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f0c48a"/><stop offset="1" stop-color="#e2ad70"/></linearGradient></defs>
    <rect width="${w}" height="${h}" fill="url(#r)"/>${strata}${dots}`) };
}

// =====================================================================
// Oggetti e interfaccia
// =====================================================================

function brushTex(): SvgTex {
  // origine sulle setole: (40, 100) su 220×140
  return { key: 'di_brush', w: 220, h: 140, svg: svgDoc(220, 140, `<defs>${G('h', '#d08a3c', 0.4)}${G('m', '#b8c4d0', 0.5)}${blur('b', 4)}</defs>
    <ellipse cx="80" cy="128" rx="70" ry="8" fill="#3a1d0e" opacity=".25" filter="url(#b)"/>
    <path d="M100 66 L206 14" stroke="#7a4218" stroke-width="22" stroke-linecap="round"/>
    <path d="M100 66 L206 14" stroke="url(#h)" stroke-width="16" stroke-linecap="round"/>
    <path d="M104 60 L200 13" stroke="#ffd9a0" stroke-width="4" stroke-linecap="round" opacity=".7"/>
    <path d="M82 54 L110 86 L96 96 L68 66 Z" fill="url(#m)" stroke="#5a6672" stroke-width="3" stroke-linejoin="round"/>
    <path d="M70 66 L96 96 Q70 122 30 118 Q16 100 24 82 Q46 70 70 66 Z" fill="#f2d28a" stroke="#a8803a" stroke-width="3" stroke-linejoin="round"/>
    <path d="M60 76 L36 108 M72 84 L50 116 M84 92 L66 118" stroke="#c9a352" stroke-width="3" stroke-linecap="round"/>`) };
}

function treasureTextures(): SvgTex[] {
  let spiral = '';
  for (let i = 0; i < 40; i++) {
    const a = i * 0.42, r = 4 + i * 1.25;
    spiral += `${i ? 'L' : 'M'}${f(60 + Math.cos(a) * r)} ${f(60 + Math.sin(a) * r)} `;
  }
  return [
    { key: 'di_tr_ammonite', w: 120, h: 120, svg: svgDoc(120, 120, `<defs>${ballGrad('a', '#fff0e0', '#d9a2c0', '#9a5a7a')}</defs>
      <circle cx="60" cy="60" r="54" fill="url(#a)" stroke="#7a3a5a" stroke-width="4"/>
      <path d="${spiral}" stroke="#8a4a6a" stroke-width="5" fill="none" stroke-linecap="round"/>
      ${shine(42, 36, 14, 7, -30, 0.8)}`) },
    { key: 'di_tr_amber', w: 120, h: 120, svg: svgDoc(120, 120, `<defs>${ballGrad('a', '#fff2b0', '#ffb02e', '#c86a00')}</defs>
      <path d="M60 6 L104 34 L110 78 L72 114 L24 104 L8 56 L30 18 Z" fill="url(#a)" stroke="#a85a00" stroke-width="4" stroke-linejoin="round"/>
      <path d="${starPath(60, 62, 20)}" fill="#fff" opacity=".7"/>${shine(40, 34, 14, 7, -30, 0.85)}`) },
    { key: 'di_tr_shell', w: 120, h: 120, svg: svgDoc(120, 120, `<defs>${G('a', '#ffb3a0', 0.5)}</defs>
      <path d="M60 110 L14 52 Q20 10 60 8 Q100 10 106 52 Z" fill="url(#a)" stroke="#c65a46" stroke-width="4" stroke-linejoin="round"/>
      ${[-36, -18, 0, 18, 36].map((dx) => `<path d="M60 108 L${60 + dx * 1.2} 14" stroke="#e0806a" stroke-width="4"/>`).join('')}
      <path d="M44 104 H76 L70 116 H50 Z" fill="#e0806a"/>${shine(44, 30, 12, 6, -30, 0.8)}`) },
  ];
}

function uiTextures(): SvgTex[] {
  const albumIcon = `<path d="M14 28 Q32 20 50 30 Q68 20 86 28 V80 Q68 72 50 82 Q32 72 14 80 Z" fill="#ffffff"/>
    <path d="M50 30 V82" stroke="#c9853a" stroke-width="4"/>
    <g transform="translate(22 50) scale(.5)"><path d="M10 16 H40" stroke="#c9853a" stroke-width="10" stroke-linecap="round"/><circle cx="8" cy="10" r="7" fill="#c9853a"/><circle cx="8" cy="22" r="7" fill="#c9853a"/><circle cx="42" cy="10" r="7" fill="#c9853a"/><circle cx="42" cy="22" r="7" fill="#c9853a"/></g>
    <path d="${starPath(68, 52, 10)}" fill="#ffc800"/>`;
  const boneIcon = (fill: string, line: string) => `<path d="M18 22 H62" stroke="${line}" stroke-width="18" stroke-linecap="round"/>
    <circle cx="14" cy="14" r="11" fill="${fill}" stroke="${line}" stroke-width="3"/><circle cx="14" cy="30" r="11" fill="${fill}" stroke="${line}" stroke-width="3"/>
    <circle cx="66" cy="14" r="11" fill="${fill}" stroke="${line}" stroke-width="3"/><circle cx="66" cy="30" r="11" fill="${fill}" stroke="${line}" stroke-width="3"/>
    <path d="M18 22 H62" stroke="${fill}" stroke-width="12" stroke-linecap="round"/>`;
  return [
    roundButton('di_btn_album', '#c9853a', albumIcon, 170),
    { key: 'di_bone_icon', w: 80, h: 44, svg: svgDoc(80, 44, `${boneIcon(BONE.base, BONE.line)}<path d="M20 18 H58" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".8"/>`) },
    { key: 'di_bone_slot', w: 80, h: 44, svg: svgDoc(80, 44, boneIcon('#7a4a2a', '#5a3018').replace(/<circle/g, '<circle opacity=".55"').replace(/<path/g, '<path opacity=".55"')) },
    { key: 'di_hud', w: 120, h: 120, svg: svgDoc(120, 120, `<defs>${B('h', '#fff3dc', 0.4)}</defs><circle cx="60" cy="64" r="54" fill="#6a3a1c" opacity=".25"/><circle cx="60" cy="58" r="54" fill="url(#h)" stroke="#c9853a" stroke-width="5"/>`) },
    { key: 'di_tray', w: 1480, h: 170, svg: svgDoc(1480, 170, `<defs>${G('w', '#c98a4a', 0.35, true)}${blur('b', 8)}</defs>
      <rect x="20" y="40" width="1440" height="130" rx="30" fill="#3a1d0e" opacity=".3" filter="url(#b)"/>
      <rect x="10" y="14" width="1460" height="140" rx="32" fill="#8a5022"/>
      <rect x="10" y="6" width="1460" height="136" rx="32" fill="url(#w)" stroke="#7a4218" stroke-width="5"/>
      <path d="M40 54 H1440 M40 98 H1440" stroke="#a8692e" stroke-width="4" opacity=".5"/>
      <path d="M50 18 H1430" stroke="#ffe0b4" stroke-width="5" opacity=".6" stroke-linecap="round"/>
      ${[60, 1420].map((x) => `<circle cx="${x}" cy="74" r="9" fill="#5a3418"/><circle cx="${x - 2}" cy="72" r="4" fill="#d9a066"/>`).join('')}`) },
    { key: 'di_photo', w: 300, h: 330, svg: svgDoc(300, 330, `<defs>${blur('b', 6)}
      <linearGradient id="p" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffd9a0"/><stop offset="1" stop-color="#f2a35e"/></linearGradient></defs>
      <rect x="14" y="18" width="276" height="306" rx="12" fill="#3a1d0e" opacity=".3" filter="url(#b)"/>
      <rect x="8" y="8" width="284" height="306" rx="12" fill="#fffdf6" stroke="#e8d8bc" stroke-width="3"/>
      <rect x="26" y="26" width="248" height="208" rx="6" fill="url(#p)"/>
      <path d="M26 190 Q150 160 274 196 V234 H26 Z" fill="#d9773f" opacity=".6"/>`) },
    { key: 'di_rays', w: 640, h: 640, svg: svgDoc(640, 640, `<defs><radialGradient id="r"><stop offset="0" stop-color="#fff6d0" stop-opacity=".95"/><stop offset="1" stop-color="#fff6d0" stop-opacity="0"/></radialGradient></defs>
      <g fill="url(#r)">${Array.from({ length: 14 }, (_, i) => { const a = (i / 14) * Math.PI * 2, b2 = a + 0.14;
        return `<path d="M320 320 L${f(320 + Math.cos(a) * 320)} ${f(320 + Math.sin(a) * 320)} L${f(320 + Math.cos(b2) * 320)} ${f(320 + Math.sin(b2) * 320)} Z"/>`; }).join('')}</g>
      <circle cx="320" cy="320" r="150" fill="url(#r)"/>`) },
    { key: 'di_note', w: 70, h: 80, svg: svgDoc(70, 80, `<defs>${B('n', '#7a5cf6', 0.5)}</defs>
      <path d="M44 8 V56" stroke="#4a2fa8" stroke-width="8" stroke-linecap="round"/><path d="M44 8 Q60 14 64 30 Q54 20 44 22" fill="#4a2fa8"/>
      <ellipse cx="30" cy="58" rx="18" ry="14" fill="url(#n)" stroke="#4a2fa8" stroke-width="3"/>`) },
    { key: 'di_egg', w: 200, h: 240, svg: svgDoc(200, 240, `<defs>${ballGrad('e', '#fffdf2', '#f2e6c8', '#c9b48a')}${blur('b', 6)}</defs>
      <ellipse cx="100" cy="226" rx="70" ry="10" fill="#3a1d0e" opacity=".3" filter="url(#b)"/>
      <path d="M100 10 Q170 20 180 130 Q182 220 100 222 Q18 220 20 130 Q30 20 100 10 Z" fill="url(#e)" stroke="#a88a5a" stroke-width="4"/>
      ${[[70, 70, 14], [128, 110, 18], [80, 160, 12], [140, 176, 10], [60, 122, 9]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#9be07a" opacity=".8"/>`).join('')}
      ${shine(64, 56, 16, 30, -20, 0.7)}`) },
  ];
}

export function gameTextures(): SvgTex[] {
  return [
    skyTex(), sunTex(), mesasFar(), dunesMid(), tentTex(), crateTex(), lanternTex(), toolsTex(), fgRock(), soilTex(), rockTex(),
    brushTex(), ...treasureTextures(), ...uiTextures(), ...faceTextures(), ...dinoTextures(), ...boneTextures(),
  ];
}
