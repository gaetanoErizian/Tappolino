import { ballGrad } from '../../core/art';
import { dinoById, FRAME, type Dino, type DinoId, type Leg, type PieceId, type Pose, type Pt } from './dinos';

/**
 * Ossa dei dinosauri, generate dalla posa (dinos.ts): ogni pezzo del puzzle è un SVG con il suo riquadro
 * nel FRAME del dinosauro. Lo stesso modulo esporta le forme delle teste e gli aiuti geometrici
 * (tratti affusolati, curve morbide) usati anche per disegnare il dinosauro vivo (art.ts).
 * Niente Phaser: testabile.
 */

export const BONE = { hi: '#fffaf0', base: '#f2e1bd', dark: '#d2b183', line: '#9a7445', hole: '#6b4a2c' };

// ---------------------------------------------------------------------
// Geometria
// ---------------------------------------------------------------------

const f = (n: number): string => n.toFixed(1);

/** Curva morbida (Catmull-Rom → Bézier) che passa per i punti. */
export function smoothPath(pts: Pt[], closed = false): string {
  if (pts.length < 2) return '';
  const p = (i: number): Pt => (closed ? pts[(i + pts.length) % pts.length] : pts[Math.max(0, Math.min(pts.length - 1, i))]);
  let d = `M${f(pts[0].x)} ${f(pts[0].y)}`;
  const n = closed ? pts.length : pts.length - 1;
  for (let i = 0; i < n; i++) {
    const p0 = p(i - 1), p1 = p(i), p2 = p(i + 1), p3 = p(i + 2);
    const c1 = { x: p1.x + (p2.x - p0.x) / 6, y: p1.y + (p2.y - p0.y) / 6 };
    const c2 = { x: p2.x - (p3.x - p1.x) / 6, y: p2.y - (p3.y - p1.y) / 6 };
    d += ` C${f(c1.x)} ${f(c1.y)} ${f(c2.x)} ${f(c2.y)} ${f(p2.x)} ${f(p2.y)}`;
  }
  return closed ? d + ' Z' : d;
}

/** Punto a frazione t (0..1) lungo una spezzata. */
export function along(pts: Pt[], t: number): Pt {
  const segs = pts.slice(1).map((q, i) => Math.hypot(q.x - pts[i].x, q.y - pts[i].y));
  const tot = segs.reduce((a, b) => a + b, 0) || 1;
  let d = Math.max(0, Math.min(1, t)) * tot;
  for (let i = 0; i < segs.length; i++) {
    if (d <= segs[i] || i === segs.length - 1) {
      const k = segs[i] ? Math.min(1, d / segs[i]) : 0;
      return { x: pts[i].x + (pts[i + 1].x - pts[i].x) * k, y: pts[i].y + (pts[i + 1].y - pts[i].y) * k };
    }
    d -= segs[i];
  }
  return pts[pts.length - 1];
}

/** Sagoma affusolata lungo una spezzata (collo, coda): larghezza da w0 a w1, punta arrotondata. */
export function taper(pts: Pt[], w0: number, w1: number): string {
  const n = 9;
  const left: Pt[] = [], right: Pt[] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const c = along(pts, t), a = along(pts, Math.max(0, t - 0.02)), b = along(pts, Math.min(1, t + 0.02));
    const len = Math.hypot(b.x - a.x, b.y - a.y) || 1;
    const nx = -(b.y - a.y) / len, ny = (b.x - a.x) / len;
    const w = (w0 + (w1 - w0) * t) / 2;
    left.push({ x: c.x + nx * w, y: c.y + ny * w });
    right.push({ x: c.x - nx * w, y: c.y - ny * w });
  }
  const end = pts[pts.length - 1], pre = along(pts, 0.97);
  const len = Math.hypot(end.x - pre.x, end.y - pre.y) || 1;
  const tip = { x: end.x + ((end.x - pre.x) / len) * w1 * 0.5, y: end.y + ((end.y - pre.y) / len) * w1 * 0.5 };
  return smoothPath([...left, tip, ...right.reverse()], true);
}

// ---------------------------------------------------------------------
// Teste: sagome in unità del raggio della testa (muso verso destra)
// ---------------------------------------------------------------------

export interface HeadShape {
  /** contorno della testa */
  d: string;
  /** occhio (centro, unità del raggio) */
  eye: Pt;
  /** angolo della bocca */
  mouth: Pt;
  /** narice */
  nose: Pt;
  /** riga della mascella (cranio) */
  jaw: string;
}

export const HEADS: Record<DinoId, HeadShape> = {
  rex: {
    d: 'M-0.9 -0.15 C-0.95 -0.8 -0.2 -1.0 0.35 -0.8 C0.8 -0.65 1.25 -0.5 1.3 -0.1 C1.33 0.2 1.2 0.42 0.95 0.5 C0.6 0.62 -0.2 0.62 -0.55 0.5 C-0.85 0.4 -0.9 0.15 -0.9 -0.15 Z',
    eye: { x: 0.08, y: -0.36 }, mouth: { x: 0.9, y: 0.22 }, nose: { x: 1.05, y: -0.3 }, jaw: 'M-0.45 0.25 Q0.3 0.36 1.15 0.18',
  },
  pachy: {
    d: 'M-0.85 0.1 C-1.0 -0.6 -0.5 -1.05 0.05 -1.05 C0.6 -1.05 0.95 -0.7 0.95 -0.3 C1.2 -0.25 1.3 0.05 1.22 0.25 C1.12 0.5 0.8 0.58 0.45 0.58 C0 0.6 -0.5 0.55 -0.7 0.42 C-0.82 0.33 -0.85 0.22 -0.85 0.1 Z',
    eye: { x: 0.3, y: -0.12 }, mouth: { x: 0.85, y: 0.3 }, nose: { x: 1.05, y: 0.0 }, jaw: 'M-0.4 0.35 Q0.4 0.45 1.12 0.28',
  },
  tricera: {
    d: 'M-0.6 -0.1 C-0.6 -0.6 -0.1 -0.75 0.35 -0.65 C0.8 -0.55 1.2 -0.3 1.38 0.1 C1.42 0.3 1.25 0.45 1.05 0.45 C0.7 0.6 0.1 0.65 -0.3 0.55 C-0.55 0.45 -0.6 0.25 -0.6 -0.1 Z',
    eye: { x: 0.3, y: -0.26 }, mouth: { x: 0.98, y: 0.3 }, nose: { x: 1.12, y: -0.08 }, jaw: 'M-0.35 0.3 Q0.4 0.42 1.2 0.28',
  },
  ptero: {
    d: 'M-0.55 0.0 C-0.6 -0.45 -0.2 -0.6 0.15 -0.55 C0.6 -0.45 1.4 -0.15 1.9 0.12 C1.6 0.25 0.6 0.4 0.1 0.42 C-0.35 0.42 -0.55 0.3 -0.55 0.0 Z',
    eye: { x: 0.05, y: -0.18 }, mouth: { x: 1.0, y: 0.18 }, nose: { x: 1.3, y: 0.0 }, jaw: 'M-0.2 0.2 Q0.8 0.24 1.75 0.12',
  },
  anky: {
    d: 'M-0.8 0.0 C-0.85 -0.55 -0.3 -0.7 0.3 -0.65 C0.8 -0.6 1.15 -0.35 1.2 0.0 C1.25 0.35 1.0 0.55 0.6 0.58 C0.1 0.62 -0.5 0.58 -0.7 0.4 C-0.8 0.3 -0.8 0.15 -0.8 0.0 Z',
    eye: { x: 0.22, y: -0.22 }, mouth: { x: 0.85, y: 0.3 }, nose: { x: 1.0, y: -0.15 }, jaw: 'M-0.4 0.32 Q0.4 0.42 1.1 0.25',
  },
  para: {
    d: 'M-0.7 0.0 C-0.75 -0.55 -0.2 -0.75 0.3 -0.65 C0.7 -0.55 1.0 -0.4 1.3 -0.3 C1.55 -0.2 1.6 0.1 1.4 0.25 C1.1 0.4 0.4 0.55 -0.1 0.52 C-0.45 0.5 -0.7 0.3 -0.7 0.0 Z',
    eye: { x: 0.15, y: -0.27 }, mouth: { x: 1.1, y: 0.2 }, nose: { x: 1.3, y: -0.12 }, jaw: 'M-0.35 0.28 Q0.5 0.4 1.45 0.15',
  },
  stego: {
    d: 'M-0.8 0.0 C-0.8 -0.5 -0.2 -0.62 0.3 -0.55 C0.8 -0.45 1.2 -0.25 1.3 0.05 C1.35 0.3 1.1 0.45 0.7 0.48 C0.2 0.52 -0.4 0.5 -0.65 0.35 C-0.78 0.25 -0.8 0.12 -0.8 0.0 Z',
    eye: { x: 0.12, y: -0.17 }, mouth: { x: 0.88, y: 0.25 }, nose: { x: 1.1, y: -0.08 }, jaw: 'M-0.4 0.28 Q0.4 0.36 1.18 0.2',
  },
  brachio: {
    d: 'M-0.8 0.05 C-0.85 -0.45 -0.45 -0.6 -0.05 -0.6 C0.0 -1.05 0.55 -1.1 0.65 -0.6 C1.05 -0.5 1.3 -0.2 1.3 0.1 C1.3 0.4 1.0 0.55 0.6 0.55 C0.1 0.58 -0.45 0.55 -0.65 0.4 C-0.78 0.3 -0.8 0.18 -0.8 0.05 Z',
    eye: { x: 0.2, y: -0.2 }, mouth: { x: 0.88, y: 0.3 }, nose: { x: 0.3, y: -0.78 }, jaw: 'M-0.4 0.32 Q0.4 0.42 1.15 0.25',
  },
};

/** Occhio e bocca del dinosauro nel suo FRAME (per le palpebre e la bocca animate). */
export function faceOf(id: DinoId): { eye: Pt; eyeR: number; mouth: Pt; s: number } {
  const { head } = dinoById(id).pose;
  const h = HEADS[id];
  return {
    eye: { x: head.x + h.eye.x * head.r, y: head.y + h.eye.y * head.r },
    eyeR: head.r * 0.27,
    mouth: { x: head.x + h.mouth.x * head.r, y: head.y + h.mouth.y * head.r },
    s: head.r / 88,
  };
}

/** Riquadro (unità del raggio) delle aggiunte alla testa: collare, corna, creste. */
export const HEAD_EXTRA: Partial<Record<DinoId, { x0: number; y0: number; x1: number; y1: number }>> = {
  tricera: { x0: -1.6, y0: -1.55, x1: 1.45, y1: 0.66 },
  ptero: { x0: -1.55, y0: -1.15, x1: 1.95, y1: 0.45 },
  para: { x0: -1.9, y0: -1.3, x1: 1.6, y1: 0.56 },
  anky: { x0: -1.1, y0: -0.85, x1: 1.25, y1: 0.7 },
  pachy: { x0: -1.05, y0: -1.2, x1: 1.3, y1: 0.62 },
  brachio: { x0: -0.85, y0: -1.12, x1: 1.32, y1: 0.6 },
};

// ---------------------------------------------------------------------
// Disegno delle ossa
// ---------------------------------------------------------------------

interface Box { x0: number; y0: number; x1: number; y1: number }

/** Un pezzo in costruzione: SVG e riquadro che lo contiene. */
class Piece {
  svg = '';
  bb: Box = { x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity };
  constructor(readonly far = false) {}
  add(svg: string, x0: number, y0: number, x1: number, y1: number): void {
    this.svg += svg;
    this.bb = { x0: Math.min(this.bb.x0, x0), y0: Math.min(this.bb.y0, y0), x1: Math.max(this.bb.x1, x1), y1: Math.max(this.bb.y1, y1) };
  }
  pts(pts: Pt[], pad: number): [number, number, number, number] {
    return [Math.min(...pts.map((p) => p.x)) - pad, Math.min(...pts.map((p) => p.y)) - pad, Math.max(...pts.map((p) => p.x)) + pad, Math.max(...pts.map((p) => p.y)) + pad];
  }
}

const OL = 3.5; // spessore del contorno

/** Tratto d'osso: contorno, corpo, ombra in basso a destra e riflesso in alto a sinistra. */
function boneStroke(pc: Piece, pts: Pt[], w: number, smooth = true): void {
  const d = smooth ? smoothPath(pts) : `M${pts.map((p) => `${f(p.x)} ${f(p.y)}`).join(' L')}`;
  const base = pc.far ? BONE.dark : BONE.base;
  pc.add(`<path d="${d}" stroke="${BONE.line}" stroke-width="${f(w + OL * 2)}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="${d}" stroke="${base}" stroke-width="${f(w)}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="${d}" stroke="${pc.far ? '#b48f5f' : BONE.dark}" stroke-width="${f(w * 0.32)}" fill="none" stroke-linecap="round" transform="translate(${f(w * 0.16)} ${f(w * 0.18)})" opacity=".8"/>
    <path d="${d}" stroke="${BONE.hi}" stroke-width="${f(w * 0.26)}" fill="none" stroke-linecap="round" transform="translate(${f(-w * 0.15)} ${f(-w * 0.17)})" opacity="${pc.far ? 0.35 : 0.85}"/>`,
  ...pc.pts(pts, w / 2 + OL + 1));
}

let gradN = 0;
/** Pomello rotondo (vertebre, articolazioni). */
function knob(pc: Piece, x: number, y: number, r: number): void {
  const g = `bk${++gradN}`;
  pc.add(`<defs>${ballGrad(g, BONE.hi, pc.far ? BONE.dark : BONE.base, pc.far ? '#a8854f' : BONE.dark)}</defs>
    <circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="url(#${g})" stroke="${BONE.line}" stroke-width="${OL}"/>`,
  x - r - OL, y - r - OL, x + r + OL, y + r + OL);
}

/** Osso lungo a "osso di cane": fusto più due pomelli doppi alle estremità. */
function longBone(pc: Piece, a: Pt, b: Pt, w: number): void {
  const len = Math.hypot(b.x - a.x, b.y - a.y) || 1;
  const nx = -(b.y - a.y) / len, ny = (b.x - a.x) / len;
  for (const p of [a, b]) for (const s of [-1, 1]) knob(pc, p.x + nx * w * 0.38 * s, p.y + ny * w * 0.38 * s, w * 0.5);
  boneStroke(pc, [a, b], w * 0.9, false);
}

/** Vertebra: pomello con una piccola spina verso l'alto. */
function vertebra(pc: Piece, x: number, y: number, r: number, up: Pt = { x: 0, y: -1 }): void {
  boneStroke(pc, [{ x, y }, { x: x + up.x * r * 1.4, y: y + up.y * r * 1.4 }], r * 0.7, false);
  knob(pc, x, y, r);
}

/** Catena di vertebre lungo una spezzata, con raggio che va da r0 a r1. */
function chain(pc: Piece, pts: Pt[], r0: number, r1: number, n: number, spines = true): void {
  for (let i = 0; i < n; i++) {
    const t = n === 1 ? 0 : i / (n - 1);
    const p = along(pts, t), q = along(pts, Math.min(1, t + 0.05)), o = along(pts, Math.max(0, t - 0.05));
    const len = Math.hypot(q.x - o.x, q.y - o.y) || 1;
    const up = { x: (q.y - o.y) / len, y: -(q.x - o.x) / len };
    const upward = up.y > 0 ? { x: -up.x, y: -up.y } : up;
    const r = r0 + (r1 - r0) * t;
    if (spines) vertebra(pc, p.x, p.y, r, upward); else knob(pc, p.x, p.y, r);
  }
}

// ---------------------------------------------------------------------
// I pezzi
// ---------------------------------------------------------------------

function skull(pc: Piece, d: Dino, withNeck: boolean): void {
  const { head, neck, neckW } = d.pose;
  const hs = HEADS[d.id];
  const r = head.r;
  if (withNeck) {
    // vertebre fitte fino a infilarsi sotto il cranio: il collo deve "attaccare" la testa al corpo
    const pts = [neck[0], ...neck.slice(1), { x: head.x - r * 0.45, y: head.y + r * 0.3 }];
    const len = pts.slice(1).reduce((s, q, i) => s + Math.hypot(q.x - pts[i].x, q.y - pts[i].y), 0);
    chain(pc, pts, neckW * 0.24, neckW * 0.2, Math.max(3, Math.round(len / 24) + 1));
  }
  const sw = OL / r;
  const g = `sk${++gradN}`;
  let back = '', front = '';
  const tr = `transform="translate(${f(head.x)} ${f(head.y)}) scale(${f(r)})"`;
  const boneFill = `fill="url(#${g})" stroke="${BONE.line}" stroke-width="${f(sw)}" stroke-linejoin="round"`;
  if (d.id === 'tricera') {
    back += `<path d="M0.05 -0.5 C-0.2 -1.45 -1.35 -1.5 -1.5 -0.6 C-1.6 0.0 -1.2 0.45 -0.55 0.45 Z" ${boneFill}/>
      ${[[-0.25, -1.18], [-0.75, -1.33], [-1.2, -1.05], [-1.42, -0.55], [-1.3, -0.05]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r=".12" ${boneFill}/>`).join('')}
      <ellipse cx="-0.75" cy="-0.6" rx=".26" ry=".2" fill="${BONE.hole}" opacity=".75"/>`;
    front += `<path d="M0.1 -0.58 Q0.45 -1.05 0.85 -1.4 Q0.62 -0.95 0.42 -0.55 Z" ${boneFill}/>
      <path d="M1.0 -0.32 Q1.12 -0.6 1.25 -0.78 Q1.24 -0.5 1.2 -0.25 Z" ${boneFill}/>`;
  } else if (d.id === 'ptero') {
    back += `<path d="M-0.2 -0.45 C-0.6 -0.9 -1.2 -1.1 -1.5 -1.1 C-1.1 -0.75 -0.75 -0.35 -0.5 -0.05 Z" ${boneFill}/>`;
  } else if (d.id === 'para') {
    back += `<path d="M0.0 -0.55 C-0.5 -0.95 -1.1 -1.15 -1.7 -1.1" stroke="${BONE.line}" stroke-width="${f(0.34 + sw * 2)}" fill="none" stroke-linecap="round"/>
      <path d="M0.0 -0.55 C-0.5 -0.95 -1.1 -1.15 -1.7 -1.1" stroke="${BONE.base}" stroke-width=".34" fill="none" stroke-linecap="round"/>
      <path d="M-0.1 -0.65 C-0.55 -1.0 -1.1 -1.18 -1.65 -1.16" stroke="${BONE.hi}" stroke-width=".08" fill="none" stroke-linecap="round" opacity=".8"/>`;
  } else if (d.id === 'anky') {
    back += `<path d="M-0.62 -0.42 L-1.05 -0.78 L-0.78 -0.2 Z" ${boneFill}/><path d="M-0.55 0.36 L-0.98 0.62 L-0.7 0.12 Z" ${boneFill}/>`;
  } else if (d.id === 'pachy') {
    front += [[-0.82, -0.25], [-0.7, -0.62], [-0.38, -0.92], [0.72, -0.6], [0.92, -0.22]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r=".1" ${boneFill}/>`).join('');
  }
  const teeth = Array.from({ length: 5 }, (_, i) => {
    const x = 0.25 + i * ((hs.mouth.x + 0.2 - 0.25) / 5);
    return `<path d="M${f(x - 0.06)} ${f(hs.mouth.y + 0.02)} L${f(x)} ${f(hs.mouth.y + 0.14)} L${f(x + 0.06)} ${f(hs.mouth.y + 0.02)} Z" fill="${BONE.hi}" stroke="${BONE.line}" stroke-width="${f(sw * 0.6)}"/>`;
  }).join('');
  const body = `<defs>${ballGrad(g, BONE.hi, BONE.base, BONE.dark)}</defs><g ${tr}>${back}
    <path d="${hs.d}" ${boneFill}/>
    <path d="${hs.d}" fill="${BONE.hi}" opacity=".35" transform="translate(-0.06 -0.08) scale(.86)"/>
    ${d.id === 'ptero' || d.id === 'para' ? '' : teeth}
    <path d="${hs.jaw}" stroke="${BONE.line}" stroke-width="${f(sw * 1.4)}" fill="none" stroke-linecap="round"/>
    <circle cx="${hs.eye.x}" cy="${hs.eye.y}" r=".23" fill="${BONE.hole}"/><circle cx="${hs.eye.x}" cy="${hs.eye.y + 0.04}" r=".15" fill="#3d2814"/>
    <ellipse cx="${f(hs.eye.x - 0.42)}" cy="${f(hs.eye.y + 0.18)}" rx=".14" ry=".1" fill="${BONE.hole}" opacity=".7"/>
    <ellipse cx="${hs.nose.x}" cy="${hs.nose.y}" rx=".08" ry=".06" fill="${BONE.hole}"/>
    ${front}</g>`;
  const ex = HEAD_EXTRA[d.id] ?? { x0: -0.95, y0: -1.02, x1: 1.35, y1: 0.64 };
  pc.add(body, head.x + ex.x0 * r - OL, head.y + ex.y0 * r - OL, head.x + ex.x1 * r + OL, head.y + ex.y1 * r + OL);
}

function ribs(pc: Piece, d: Dino, withArms: boolean): void {
  const { body: b, arms } = d.pose;
  // costole sotto la colonna
  const n = d.id === 'ptero' ? 3 : 5;
  for (let k = 0; k < n; k++) {
    const t = k / (n - 1);
    const x = b.x + b.rx * (-0.55 + 1.05 * t);
    const top = b.y - b.ry * 0.78 * Math.sqrt(Math.max(0, 1 - ((x - b.x) / b.rx) ** 2));
    const bot = b.y + b.ry * 0.62 * Math.sqrt(Math.max(0, 1 - ((x - b.x) / (b.rx * 1.05)) ** 2));
    boneStroke(pc, [{ x, y: top }, { x: x + b.rx * 0.16, y: (top + bot) / 2 }, { x: x + b.rx * 0.06, y: bot }], Math.max(10, b.ry * 0.12));
  }
  // bacino e scapola
  const hip = { x: b.x - b.rx * 0.55, y: b.y - b.ry * 0.05 };
  pc.add(`<ellipse cx="${f(hip.x)}" cy="${f(hip.y)}" rx="${f(b.rx * 0.3)}" ry="${f(b.ry * 0.36)}" fill="${BONE.base}" stroke="${BONE.line}" stroke-width="${OL}"/>
    <ellipse cx="${f(hip.x - b.rx * 0.05)}" cy="${f(hip.y - b.ry * 0.08)}" rx="${f(b.rx * 0.16)}" ry="${f(b.ry * 0.16)}" fill="${BONE.hi}" opacity=".7"/>
    <circle cx="${f(hip.x + b.rx * 0.08)}" cy="${f(hip.y + b.ry * 0.1)}" r="${f(b.ry * 0.1)}" fill="${BONE.hole}" opacity=".7"/>`,
  hip.x - b.rx * 0.3 - OL, hip.y - b.ry * 0.36 - OL, hip.x + b.rx * 0.3 + OL, hip.y + b.ry * 0.36 + OL);
  // colonna vertebrale sopra
  const spine = Array.from({ length: 7 }, (_, i) => {
    const a = Math.PI * (1.08 + (0.84 * i) / 6);
    return { x: b.x + Math.cos(a) * b.rx * 0.9, y: b.y + Math.sin(a) * b.ry * 0.82 };
  });
  chain(pc, spine, b.ry * 0.13, b.ry * 0.13, 8);
  if (withArms) for (const a of arms ?? []) arm(pc, a);
}

function arm(pc: Piece, a: Leg): void {
  const elbow = { x: a.x + a.len * 0.35, y: a.y + a.len * 0.55 };
  const hand = { x: a.x + a.len * 0.8, y: a.y + a.len * 0.75 };
  longBone(pc, { x: a.x, y: a.y }, elbow, a.w * 0.62);
  boneStroke(pc, [elbow, hand], a.w * 0.5, false);
  for (const s of [-1, 1]) boneStroke(pc, [hand, { x: hand.x + a.w * 0.5, y: hand.y + s * a.w * 0.3 + a.w * 0.2 }], a.w * 0.26, false);
}

function leg(pc: Piece, l: Leg): void {
  const knee = { x: l.x + l.w * 0.35, y: l.y + l.len * 0.48 };
  const ankle = { x: l.x - l.w * 0.05, y: l.y + l.len * 0.88 };
  longBone(pc, { x: l.x, y: l.y }, knee, l.w * 0.5);
  longBone(pc, knee, ankle, l.w * 0.42);
  for (const k of [-1, 0, 1]) boneStroke(pc, [ankle, { x: ankle.x + l.w * (0.45 + k * 0.12), y: ankle.y + l.len * 0.1 + k * 4 }], l.w * 0.2, false);
}

function legs(pc: Piece, list: Leg[]): void {
  for (const l of list.filter((x) => x.far)) leg(new FarProxy(pc), l);
  for (const l of list.filter((x) => !x.far)) leg(pc, l);
}

/** Disegna su un pezzo come "lato lontano" (ossa più scure). */
class FarProxy extends Piece {
  constructor(private target: Piece) { super(true); }
  override add(svg: string, x0: number, y0: number, x1: number, y1: number): void { this.target.add(svg, x0, y0, x1, y1); }
}

function tail(pc: Piece, d: Dino): void {
  const { tail: t, tailW, body: b } = d.pose;
  const pts = [{ x: b.x - b.rx * 0.78, y: t[0].y - 6 }, ...t];
  const n = Math.max(4, Math.round(Math.hypot(t[t.length - 1].x - pts[0].x, t[t.length - 1].y - pts[0].y) / 30));
  chain(pc, pts, tailW * 0.22, tailW * 0.1, n);
  if (d.id === 'anky') {
    const e = t[t.length - 1];
    for (const [dx, dy, r] of [[-10, -16, 24], [-12, 18, 22], [14, -12, 22], [14, 14, 24], [0, 0, 26]]) knob(pc, e.x + dx, e.y + dy, r);
  }
  if (d.id === 'stego') {
    const e = t[t.length - 1];
    for (const [dx, dy, ex, ey] of [[0, -6, 34, -60], [-26, -2, -20, -66], [6, 6, 56, 30], [-18, 8, -4, 50]]) {
      boneStroke(pc, [{ x: e.x + dx, y: e.y + dy }, { x: e.x + ex, y: e.y + ey }], 13, false);
    }
  }
}

/** Placche dello stegosauro: profilo dei punti lungo il dorso. */
export function plateSpots(d: Dino): { x: number; y: number; s: number }[] {
  const b = d.pose.body;
  return Array.from({ length: 6 }, (_, i) => {
    const a = Math.PI * (1.18 + (0.66 * i) / 5);
    const s = 1 - Math.abs(i - 2.6) * 0.16;
    return { x: b.x + Math.cos(a) * b.rx * 0.92, y: b.y + Math.sin(a) * b.ry * 0.95, s };
  });
}

export function platePath(x: number, y: number, s: number): string {
  const h = 78 * s, w = 46 * s;
  return `M${f(x - w)} ${f(y + 6)} Q${f(x - w * 0.9)} ${f(y - h * 0.6)} ${f(x)} ${f(y - h)} Q${f(x + w * 0.9)} ${f(y - h * 0.6)} ${f(x + w)} ${f(y + 6)} Z`;
}

function plates(pc: Piece, d: Dino): void {
  for (const p of plateSpots(d)) {
    const g = `pl${++gradN}`;
    pc.add(`<defs>${ballGrad(g, BONE.hi, BONE.base, BONE.dark)}</defs><path d="${platePath(p.x, p.y, p.s)}" fill="url(#${g})" stroke="${BONE.line}" stroke-width="${OL}" stroke-linejoin="round"/>
      <path d="M${f(p.x)} ${f(p.y - 70 * p.s)} L${f(p.x)} ${f(p.y)}" stroke="${BONE.dark}" stroke-width="3" opacity=".7"/>`,
    p.x - 46 * p.s - OL, p.y - 78 * p.s - OL, p.x + 46 * p.s + OL, p.y + 6 + OL);
  }
}

/** Ala dello pterosauro: punti spalla → gomito → polso → punta, per lato (-1 sinistra, 1 destra). */
export function wingPts(d: Dino, side: -1 | 1): Pt[] {
  const b = d.pose.body;
  const sh = { x: b.x + side * b.rx * 0.55, y: b.y - b.ry * 0.5 };
  return [sh, { x: sh.x + side * 100, y: sh.y - 30 }, { x: sh.x + side * 190, y: sh.y - 40 }, { x: sh.x + side * 330, y: sh.y - 95 }];
}

function wing(pc: Piece, d: Dino, side: -1 | 1): void {
  const [sh, el, wr, tip] = wingPts(d, side);
  longBone(pc, sh, el, 26);
  longBone(pc, el, wr, 22);
  boneStroke(pc, [wr, { x: (wr.x + tip.x) / 2, y: (wr.y + tip.y) / 2 - 18 }, tip], 15);
  for (const k of [0, 1, 2]) boneStroke(pc, [wr, { x: wr.x + side * (10 + k * 8), y: wr.y - 30 + k * 6 }], 8, false);
}

export interface BonePiece {
  id: PieceId;
  /** riquadro nel FRAME del dinosauro */
  x: number; y: number; w: number; h: number;
  /** centro nel FRAME */
  cx: number; cy: number;
  /** contenuto SVG in coordinate del FRAME */
  svg: string;
}

const cache = new Map<DinoId, BonePiece[]>();

/** I pezzi dello scheletro di un dinosauro, nell'ordine di montaggio. */
export function piecesOf(id: DinoId): BonePiece[] {
  const hit = cache.get(id);
  if (hit) return hit;
  const d = dinoById(id);
  const has = (p: PieceId) => d.pieces.includes(p);
  const pose: Pose = d.pose;
  const out: BonePiece[] = d.pieces.map((pid) => {
    const pc = new Piece();
    switch (pid) {
      case 'skull': skull(pc, d, !has('neck')); break;
      case 'neck': chain(pc, [...pose.neck, { x: pose.head.x - pose.head.r * 0.6, y: pose.head.y + pose.head.r * 0.25 }], pose.neckW * 0.24, pose.neckW * 0.18, 9); break;
      case 'ribs': ribs(pc, d, !has('arms')); break;
      case 'arms': for (const a of pose.arms ?? []) arm(pc, a); break;
      case 'tail': tail(pc, d); break;
      case 'legs': legs(pc, [...pose.back, ...pose.front]); break;
      case 'front': legs(pc, pose.front); break;
      case 'back': legs(pc, pose.back); break;
      case 'plates': plates(pc, d); break;
      case 'wingL': wing(pc, d, -1); break;
      case 'wingR': wing(pc, d, 1); break;
    }
    const bb = pc.bb;
    const x = Math.floor(bb.x0), y = Math.floor(bb.y0), w = Math.ceil(bb.x1) - x, h = Math.ceil(bb.y1) - y;
    return { id: pid, x, y, w, h, cx: x + w / 2, cy: y + h / 2, svg: pc.svg };
  });
  cache.set(id, out);
  return out;
}

/** Il pezzo è tutto dentro il FRAME (controllo dei test). */
export const insideFrame = (p: BonePiece): boolean => p.x >= 0 && p.y >= 0 && p.x + p.w <= FRAME.w && p.y + p.h <= FRAME.h;
