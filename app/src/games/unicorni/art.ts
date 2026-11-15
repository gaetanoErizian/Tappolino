import { svgDoc, type SvgTex } from '../../core/textures';
import { lightGrad, ballGrad, blur, starPath, roundButton, shade, uid } from '../../core/art';
import type { AccessoryId, HornId } from './salon';

/**
 * Grafica del Salone degli Unicorni: tutta originale, disegnata qui in SVG (stile 2.5D: luce dall'alto a sinistra,
 * ombre proprie e portate, bordi in una tonalità più scura dello stesso colore).
 *
 * L'unicorno è fatto a strati che combaciano: tutti i livelli "a tela intera" (manto, criniera, fango…) misurano
 * U.W × U.H e hanno l'appoggio degli zoccoli in (U.OX, U.OY). Le parti piccole (occhio, corno, accessori) hanno
 * un riquadro in coordinate della tela (PARTS, ACC_BOX). Manto e criniera sono disegnati in grigio chiaro e si colorano
 * con setTint; riflessi e guance in texture separate sopra (il tint li spegnerebbe).
 */

export const U = { W: 760, H: 660, OX: 380, OY: 630 } as const;

/** Riquadri (coordinate della tela) delle parti piccole dell'unicorno. */
export const PARTS = {
  eye: { x: 540, y: 160, w: 110, h: 110 },
  horn: { x: 552, y: 0, w: 100, h: 130 },
} as const;

/** Centro di ogni accessorio sulla tela dell'unicorno; per gli adesivi del manto, i posti in ordine. */
export const ACC_AT: Record<Exclude<AccessoryId, 'star' | 'heart'>, { x: number; y: number }> = {
  bow: { x: 474, y: 112 },
  crown: { x: 540, y: 96 },
  flower: { x: 486, y: 122 },
  necklace: { x: 496, y: 352 },
  glasses: { x: 578, y: 214 },
  wings: { x: 292, y: 292 },
};
export const STICKER_SPOTS = [
  { x: 318, y: 372 }, { x: 398, y: 440 }, { x: 300, y: 474 }, { x: 478, y: 462 }, { x: 420, y: 506 }, { x: 356, y: 520 },
];

const OUT = '#a39fbd';   // bordo delle parti da colorare (diventa una tonalità scura della tinta)

// numeri casuali ripetibili (frizz della criniera, fango)
function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const f1 = (v: number): string => v.toFixed(1);

/** Curva chiusa morbida che passa vicino ai punti (quadratiche tra i punti medi): blob di fango, ciuffi arruffati. */
function smoothClosed(pts: [number, number][]): string {
  const mid = (a: [number, number], b: [number, number]): [number, number] => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  const n = pts.length;
  let d = `M${f1(mid(pts[n - 1], pts[0])[0])} ${f1(mid(pts[n - 1], pts[0])[1])} `;
  for (let i = 0; i < n; i++) {
    const m = mid(pts[i], pts[(i + 1) % n]);
    d += `Q${f1(pts[i][0])} ${f1(pts[i][1])} ${f1(m[0])} ${f1(m[1])} `;
  }
  return d + 'Z';
}

// =====================================================================
// Sagoma dell'unicorno (manto)
// =====================================================================

const LEGS = {
  farBack: { x: 272, y: 468, w: 52, h: 150 },
  farFront: { x: 462, y: 468, w: 52, h: 150 },
  nearBack: { x: 206, y: 468, w: 60, h: 158 },
  nearFront: { x: 402, y: 468, w: 60, h: 158 },
};
const leg = (l: { x: number; y: number; w: number; h: number }) => `<rect x="${l.x}" y="${l.y}" width="${l.w}" height="${l.h}" rx="${l.w / 2 - 2}"/>`;
const BODY_SHAPES = [
  `<ellipse cx="355" cy="405" rx="192" ry="128"/>`,
  // groppa morbida
  `<ellipse cx="236" cy="372" rx="92" ry="98"/>`,
  `<path d="M408 352 C418 270 458 206 505 176 L600 232 C588 300 562 352 532 414 Z"/>`,
  `<path d="M478 152 Q460 84 492 58 Q516 94 512 150 Z"/>`,
  `<circle cx="548" cy="208" r="108"/>`,
  `<ellipse cx="632" cy="258" rx="80" ry="60"/>`,
  `<path d="M512 140 Q505 68 540 42 Q562 84 550 142 Z"/>`,
  leg(LEGS.nearBack),
  leg(LEGS.nearFront),
];
const FAR_LEGS = [leg(LEGS.farBack), leg(LEGS.farFront)];
/** Tutta la sagoma, per i clipPath (fango, stelle, ombre interne). */
const SILHOUETTE = [...FAR_LEGS, ...BODY_SHAPES].join('');

/** Gradiente comune del manto in coordinate della tela: niente cuciture tra le forme che si sovrappongono. */
function coatGrad(id: string, light: string, base: string, dark: string): string {
  return `<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="200" y1="90" x2="560" y2="640">
    <stop offset="0" stop-color="${light}"/><stop offset=".5" stop-color="${base}"/><stop offset="1" stop-color="${dark}"/></linearGradient>`;
}

function hoof(l: { x: number; y: number; w: number; h: number }, fill: string): string {
  const y = l.y + l.h - 30;
  return `<path d="M${l.x} ${y} Q${l.x + l.w / 2} ${y - 8} ${l.x + l.w} ${y} V${l.y + l.h - l.w / 2 + 6}
    Q${l.x + l.w} ${l.y + l.h} ${l.x + l.w - 10} ${l.y + l.h} H${l.x + 10} Q${l.x} ${l.y + l.h} ${l.x} ${l.y + l.h - l.w / 2 + 6} Z" fill="${fill}"/>`;
}

/** Manto in grigio chiaro (da colorare con setTint): sagoma, zampe, zoccoli, ombre interne, narice e sorriso. */
function coatSvg(): string {
  const g = uid('cg'), gf = uid('cf'), clip = uid('cl'), sh = uid('s'), sh2 = uid('s');
  return svgDoc(U.W, U.H, `<defs>${coatGrad(g, '#ffffff', '#f2f1f7', '#cecbdf')}${coatGrad(gf, '#e9e7f1', '#d6d3e3', '#aeaac3')}
      <clipPath id="${clip}">${BODY_SHAPES.join('')}</clipPath>${blur(sh, 16)}${blur(sh2, 9)}</defs>
    <g fill="${OUT}" stroke="${OUT}" stroke-width="10" stroke-linejoin="round">${FAR_LEGS.join('')}</g>
    <g fill="url(#${gf})">${FAR_LEGS.join('')}</g>
    ${hoof(LEGS.farBack, '#a29ebb')}${hoof(LEGS.farFront, '#a29ebb')}
    <g fill="${OUT}" stroke="${OUT}" stroke-width="11" stroke-linejoin="round">${BODY_SHAPES.join('')}</g>
    <g fill="url(#${g})">${BODY_SHAPES.join('')}</g>
    <g clip-path="url(#${clip})">
      <ellipse cx="350" cy="540" rx="230" ry="62" fill="#8e8aa8" opacity=".32" filter="url(#${sh})"/>
      <ellipse cx="510" cy="330" rx="74" ry="40" fill="#8e8aa8" opacity=".26" filter="url(#${sh})"/>
      <ellipse cx="236" cy="500" rx="40" ry="22" fill="#8e8aa8" opacity=".25" filter="url(#${sh2})"/>
      <ellipse cx="432" cy="500" rx="40" ry="22" fill="#8e8aa8" opacity=".25" filter="url(#${sh2})"/>
      <path d="M530 102 Q520 70 532 50" stroke="#c9c5da" stroke-width="7" fill="none" stroke-linecap="round"/>
    </g>
    ${hoof(LEGS.nearBack, '#b4b0ca')}${hoof(LEGS.nearFront, '#b4b0ca')}
    <path d="M524 120 Q526 84 538 62" stroke="#d7d3e6" stroke-width="8" fill="none" stroke-linecap="round"/>
    <ellipse cx="690" cy="250" rx="6" ry="9" fill="#8a86a3"/>
    <path d="M642 292 Q664 306 688 290" stroke="#8a86a3" stroke-width="6" fill="none" stroke-linecap="round"/>`);
}

/** Riflessi, guance e lucido degli zoccoli (sopra il manto colorato, non tinti). */
function coatHlSvg(): string {
  const b = uid('b'), b2 = uid('b');
  const shine = (l: { x: number; y: number; w: number; h: number }) =>
    `<ellipse cx="${l.x + l.w * 0.32}" cy="${l.y + l.h - 16}" rx="7" ry="4" fill="#fff" opacity=".7"/>
     <rect x="${l.x + 12}" y="${l.y + 24}" width="10" height="${l.h - 70}" rx="5" fill="#fff" opacity=".2" filter="url(#${b2})"/>`;
  return svgDoc(U.W, U.H, `<defs>${blur(b, 12)}${blur(b2, 4)}</defs>
    <ellipse cx="280" cy="328" rx="96" ry="34" fill="#fff" opacity=".6" filter="url(#${b})"/>
    <ellipse cx="512" cy="146" rx="42" ry="22" fill="#fff" opacity=".65" filter="url(#${b})"/>
    <ellipse cx="612" cy="226" rx="30" ry="12" fill="#fff" opacity=".5" filter="url(#${b})"/>
    <ellipse cx="612" cy="270" rx="28" ry="17" fill="#ff7fb0" opacity=".45" filter="url(#${b2})"/>
    ${shine(LEGS.nearBack)}${shine(LEGS.nearFront)}`);
}

/** Manto stellato (unicorno della notte): stelline sopra il manto, ritagliate nella sagoma. */
function coatStarsSvg(): string {
  const clip = uid('cl');
  const r = rng(11);
  let stars = '';
  for (let i = 0; i < 26; i++) {
    const x = 170 + r() * 520, y = 120 + r() * 480, s = 5 + r() * 8;
    stars += `<path d="${starPath(x, y, s, 0.42)}" fill="${r() < 0.6 ? '#fff6c8' : '#ffffff'}" opacity="${f1(0.55 + r() * 0.4)}"/>`;
  }
  return svgDoc(U.W, U.H, `<defs><clipPath id="${clip}">${SILHOUETTE}</clipPath></defs><g clip-path="url(#${clip})">${stars}</g>`);
}

// =====================================================================
// Criniera e coda
// =====================================================================

interface Lock { x: number; y: number; len: number; w: number; ang: number; }
const LOCKS: Lock[] = [
  // criniera sul collo, dall'alto in basso
  { x: 500, y: 100, len: 96, w: 74, ang: 70 },
  { x: 492, y: 118, len: 122, w: 82, ang: 52 },
  { x: 478, y: 156, len: 132, w: 86, ang: 42 },
  { x: 462, y: 196, len: 136, w: 88, ang: 35 },
  { x: 446, y: 236, len: 130, w: 84, ang: 28 },
  { x: 432, y: 274, len: 116, w: 78, ang: 22 },
  { x: 420, y: 306, len: 92, w: 66, ang: 16 },
  // ciuffo sulla fronte
  { x: 538, y: 98, len: 82, w: 66, ang: -36 },
  { x: 556, y: 104, len: 66, w: 52, ang: -58 },
  // coda
  { x: 176, y: 340, len: 120, w: 82, ang: 72 },
  { x: 172, y: 352, len: 170, w: 96, ang: 44 },
  { x: 178, y: 372, len: 196, w: 102, ang: 22 },
  { x: 190, y: 392, len: 168, w: 88, ang: 6 },
];
// la radice della criniera lungo il collo (fascia che unisce le ciocche)
const MANE_ROOT = `<path d="M470 92 C498 76 534 82 552 100 C560 120 520 128 500 150 C476 200 450 260 428 332 C414 330 404 320 404 306 C420 230 440 160 470 92 Z"/>
  <path d="M150 350 C160 330 190 326 204 342 C206 366 196 384 180 392 C160 388 148 372 150 350 Z"/>`;

/** Da coordinate locali della ciocca (radice in 0,0, punta verso il basso) a coordinate della tela. */
function xf(l: Lock, x: number, y: number): string {
  const a = (l.ang * Math.PI) / 180, c = Math.cos(a), s = Math.sin(a);
  return `${f1(l.x + x * c - y * s)} ${f1(l.y + x * s + y * c)}`;
}

/**
 * Una ciocca a goccia con la punta arricciata, già in coordinate della tela: niente attributo transform,
 * così i gradienti in userSpaceOnUse (uno solo per tutta la criniera, anche l'arcobaleno) restano continui.
 */
function lockPath(l: Lock): string {
  const { len: L, w: W } = l;
  const P = (x: number, y: number) => xf(l, x, y);
  return `M${P(-W * 0.42, 0)} C${P(-W * 0.78, L * 0.32)} ${P(-W * 0.62, L * 0.78)} ${P(-W * 0.08, L)}
    C${P(W * 0.3, L * 1.02)} ${P(W * 0.52, L * 0.86)} ${P(W * 0.34, L * 0.72)}
    C${P(W * 0.2, L * 0.62)} ${P(W * 0.02, L * 0.74)} ${P(W * 0.06, L * 0.84)}
    C${P(W * 0.62, L * 0.6)} ${P(W * 0.6, L * 0.24)} ${P(W * 0.42, 0)} Z`;
}
const tr = (l: Lock) => `translate(${l.x} ${l.y}) rotate(${l.ang})`;
const strand = (l: Lock, k: number) =>
  `M${f1(-l.w * 0.12 * k)} ${f1(l.len * 0.08)} C${f1(-l.w * 0.34 * k)} ${f1(l.len * 0.4)} ${f1(-l.w * 0.2 * k)} ${f1(l.len * 0.66)} ${f1(l.w * 0.04)} ${f1(l.len * 0.8)}`;

function maneShapes(fill: string, strandColor: string): string {
  const locks = LOCKS.map((l) => `<path d="${lockPath(l)}"/>`).join('');
  const strands = LOCKS.map((l) => `<g transform="${tr(l)}"><path d="${strand(l, 1)}"/><path d="${strand(l, -0.6)}" opacity=".6"/></g>`).join('');
  return `<g fill="${OUT}" stroke="${OUT}" stroke-width="10" stroke-linejoin="round">${MANE_ROOT}${locks}</g>
    <g fill="${fill}">${MANE_ROOT}${locks}</g>
    <g fill="none" stroke="${strandColor}" stroke-width="5" stroke-linecap="round" opacity=".8">${strands}</g>`;
}
const maneGrad = (id: string, light: string, base: string, dark: string) =>
  `<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="140" y1="60" x2="520" y2="560">
    <stop offset="0" stop-color="${light}"/><stop offset=".45" stop-color="${base}"/><stop offset="1" stop-color="${dark}"/></linearGradient>`;

/** Criniera pettinata in grigio (da colorare). */
function maneSvg(): string {
  const g = uid('m');
  return svgDoc(U.W, U.H, `<defs>${maneGrad(g, '#ffffff', '#e9e7f0', '#b4b0c8')}</defs>${maneShapes(`url(#${g})`, '#c3bfd6')}`);
}

/** Criniera arcobaleno (non tinta): ogni ciocca del suo colore, con la sua luce dall'alto a sinistra. */
function maneRainbowSvg(): string {
  const cols = ['#ff8fb1', '#ffb36b', '#ffe073', '#8ee39a', '#74c8ff', '#b892ff', '#ff9ad6'];
  const order = [0, 1, 2, 3, 4, 5, 6, 6, 5, 4, 3, 1, 0];  // collo dall'alto, ciuffo, coda
  let defs = '', locks = '', strands = '';
  LOCKS.forEach((l, i) => {
    const c = cols[order[i] % cols.length], id = uid('rb');
    defs += lightGrad(id, shade(c, 0.45), c, shade(c, -0.18));
    locks += `<path d="${lockPath(l)}" fill="url(#${id})"/>`;
    strands += `<g transform="${tr(l)}"><path d="${strand(l, 1)}"/><path d="${strand(l, -0.6)}" opacity=".6"/></g>`;
  });
  const root = uid('rr');
  return svgDoc(U.W, U.H, `<defs>${defs}${lightGrad(root, '#ffd6ec', '#ffb0d6', '#e58cc0')}</defs>
    <g fill="#b08fd0" stroke="#b08fd0" stroke-width="10" stroke-linejoin="round">${MANE_ROOT}${LOCKS.map((l) => `<path d="${lockPath(l)}"/>`).join('')}</g>
    <g fill="url(#${root})">${MANE_ROOT}</g>${locks}
    <g fill="none" stroke="#ffffff" stroke-width="5" stroke-linecap="round" opacity=".7">${strands}</g>`);
}

/** Riflessi lucidi della criniera pettinata (sopra, non tinti). */
function maneHlSvg(): string {
  const b = uid('b');
  const hl = LOCKS.map((l) => `<g transform="${tr(l)}"><ellipse cx="${f1(-l.w * 0.22)}" cy="${f1(l.len * 0.3)}" rx="${f1(l.w * 0.12)}" ry="${f1(l.len * 0.18)}" fill="#fff" opacity=".7"/></g>`).join('');
  return svgDoc(U.W, U.H, `<defs>${blur(b, 3)}</defs><g filter="url(#${b})">${hl}</g>`);
}

/** Criniera arruffata (grigio un po' spento, da colorare): ciocche gonfie e frastagliate, nodi. Copre tutta quella pettinata. */
function maneMessySvg(): string {
  const g = uid('mm');
  const r = rng(7);
  const frizz = LOCKS.map((l) => {
    const cy = l.len * 0.5, rx = l.w * 0.7, ry = l.len * 0.64;
    const n = 26;
    const pts: [number, number][] = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const k = i % 2 ? 0.84 + r() * 0.06 : 1.04 + r() * 0.12;
      const [px, py] = xf(l, Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k).split(' ').map(Number);
      pts.push([px, py]);
    }
    return `<path d="${smoothClosed(pts)}"/>`;
  }).join('');
  const root = `<path d="M462 70 L486 84 L500 64 L516 84 L540 70 L548 96 L572 100 L552 124 L520 136 L500 170 L470 240 L444 320 L430 350 L410 334 L392 312 L412 240 L440 150 Z"/>
    <path d="M136 344 L154 322 L170 334 L190 316 L214 340 L208 372 L184 404 L154 396 Z"/>`;
  // ciocche ribelli: tratti curvi che si incrociano in direzioni diverse (capelli aggrovigliati)
  let knots = '';
  for (const l of LOCKS) {
    for (let k = 0; k < 3; k++) {
      const x = (r() - 0.5) * l.w * 0.6, y = l.len * (0.2 + r() * 0.6), s = 16 + r() * 12, a = r() * Math.PI;
      const dx = Math.cos(a) * s, dy = Math.sin(a) * s, bend = (r() - 0.5) * s * 1.4;
      knots += `<path transform="${tr(l)}" d="M${f1(x - dx)} ${f1(y - dy)} Q${f1(x - dy * 0.3 + bend)} ${f1(y + dx * 0.3)} ${f1(x + dx)} ${f1(y + dy)}"/>`;
    }
  }
  return svgDoc(U.W, U.H, `<defs>${maneGrad(g, '#f1eff6', '#d8d5e3', '#a6a2bc')}</defs>
    <g fill="#948fb0" stroke="#948fb0" stroke-width="10" stroke-linejoin="round">${root}${frizz}</g>
    <g fill="url(#${g})">${root}${frizz}</g>
    <g fill="none" stroke="#8f8aac" stroke-width="4.5" stroke-linecap="round" opacity=".7">${knots}</g>`);
}

// =====================================================================
// Fango, schiuma, occhi, corno
// =====================================================================

function mudSvg(): string {
  const clip = uid('cl'), g = uid('mg');
  const r = rng(23);
  const spots: [number, number, number][] = [
    [246, 380, 46], [330, 468, 40], [222, 452, 30], [310, 352, 32], [398, 470, 42], [484, 430, 30], [372, 400, 24],
    [650, 222, 22], [520, 246, 24], [236, 572, 28], [430, 590, 26], [296, 540, 20], [490, 540, 20], [150, 420, 22],
  ];
  const blobs = spots.map(([x, y, s]) => {
    const n = 9;
    const pts: [number, number][] = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2, k = 0.78 + r() * 0.4;
      pts.push([x + Math.cos(a) * s * k * 1.25, y + Math.sin(a) * s * k * 0.85]);
    }
    const drip = r() < 0.6 ? `<path d="M${f1(x - s * 0.25)} ${y} C${f1(x - s * 0.28)} ${f1(y + s * 1.0)} ${f1(x + s * 0.12)} ${f1(y + s * 1.0)} ${f1(x + s * 0.12)} ${y} Z" fill="url(#${g})"/>
      <circle cx="${f1(x - s * 0.07)}" cy="${f1(y + s * 1.05)}" r="${f1(s * 0.2)}" fill="url(#${g})"/>` : '';
    const dots = Array.from({ length: 2 }, () => {
      const a = r() * Math.PI * 2, rr = s * (1.45 + r() * 0.5);
      return `<circle cx="${f1(x + Math.cos(a) * rr)}" cy="${f1(y + Math.sin(a) * rr * 0.8)}" r="${f1(3 + r() * 4)}" fill="#9a6a3c"/>`;
    }).join('');
    return `${drip}<path d="${smoothClosed(pts)}" fill="url(#${g})" stroke="#6e4524" stroke-width="2" stroke-opacity=".5"/>${dots}
      <ellipse cx="${f1(x - s * 0.38)}" cy="${f1(y - s * 0.3)}" rx="${f1(s * 0.34)}" ry="${f1(s * 0.15)}" fill="#f1d3ad" opacity=".75"/>
      <circle cx="${f1(x + s * 0.3)}" cy="${f1(y + s * 0.15)}" r="${f1(s * 0.12)}" fill="#f1d3ad" opacity=".45"/>`;
  }).join('');
  return svgDoc(U.W, U.H, `<defs><clipPath id="${clip}">${SILHOUETTE}</clipPath>${lightGrad(g, '#c99764', '#a0703f', '#6e4524')}</defs>
    <g clip-path="url(#${clip})">${blobs}</g>`);
}

/** Un ciuffo di bolle di schiuma (timbro del modo "paint"). */
function foamSvg(): string {
  const g = uid('fb');
  const bubbles: [number, number, number][] = [[40, 46, 26], [66, 34, 18], [24, 26, 14], [66, 64, 15], [44, 70, 11]];
  return svgDoc(90, 90, `<defs><radialGradient id="${g}" cx=".38" cy=".32" r=".7"><stop offset="0" stop-color="#ffffff"/>
      <stop offset=".7" stop-color="#f3f8ff"/><stop offset="1" stop-color="#c9dcf2"/></radialGradient></defs>
    ${bubbles.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="url(#${g})" stroke="#b9cde8" stroke-width="1.5"/>
      <ellipse cx="${f1(x - r * 0.35)}" cy="${f1(y - r * 0.38)}" rx="${f1(r * 0.28)}" ry="${f1(r * 0.17)}" fill="#fff"/>
      <circle cx="${f1(x + r * 0.4)}" cy="${f1(y + r * 0.35)}" r="${f1(r * 0.12)}" fill="#ffd6f0" opacity=".8"/>`).join('')}`);
}

function eyeSvg(kind: 'open' | 'closed' | 'happy'): string {
  const { x: ox, y: oy, w, h } = PARTS.eye;
  const g = uid('e');
  const lashes = (y: number) => `<path d="M612 ${y} q14 -10 20 -24 M618 ${y + 10} q16 -4 26 -14 M604 ${y - 6} q8 -14 8 -28" stroke="#3a2a52" stroke-width="5" fill="none" stroke-linecap="round"/>`;
  let body = '';
  if (kind === 'open') {
    body = `<defs><linearGradient id="${g}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2b1d40"/><stop offset=".55" stop-color="#4a2f73"/><stop offset="1" stop-color="#9a72e6"/></linearGradient></defs>
      <ellipse cx="592" cy="214" rx="26" ry="34" fill="url(#${g})" stroke="#2b1d40" stroke-width="3"/>
      <ellipse cx="582" cy="200" rx="10" ry="12" fill="#fff"/><circle cx="602" cy="232" r="5" fill="#fff" opacity=".9"/>
      ${lashes(196)}`;
  } else if (kind === 'closed') {
    body = `<path d="M566 214 Q592 232 618 214" stroke="#3a2a52" stroke-width="6" fill="none" stroke-linecap="round"/>
      <path d="M572 222 l-6 10 M592 226 l0 12 M610 222 l6 10" stroke="#3a2a52" stroke-width="4" stroke-linecap="round"/>`;
  } else {
    body = `<path d="M566 224 Q592 194 618 224" stroke="#3a2a52" stroke-width="7" fill="none" stroke-linecap="round"/>${lashes(200)}`;
  }
  return svgDoc(w, h, `<g transform="translate(${-ox} ${-oy})">${body}</g>`);
}

const HORNS: Record<HornId, [string, string, string, string]> = {
  gold: ['#fff4b8', '#ffd04d', '#e09a12', '#c98610'],
  pearl: ['#ffffff', '#f2ecff', '#c7b8ee', '#a995dc'],
  rose: ['#ffe6f1', '#ffaed2', '#e66fa6', '#cf5a92'],
};
function hornSvg(id: HornId): string {
  const { x: ox, y: oy, w, h } = PARTS.horn;
  const [l, b, d, line] = HORNS[id];
  const g = uid('h'), c = uid('c');
  const shape = 'M566 120 Q575 70 618 8 Q622 72 614 126 Q590 134 566 120 Z';
  let bands = '';
  for (let i = 0; i < 6; i++) {
    const y = 112 - i * 18;
    bands += `<path d="M550 ${y} Q590 ${y + 4} 640 ${y - 24}" stroke="${line}" stroke-width="5" fill="none" opacity=".55"/>`;
  }
  return svgDoc(w, h, `<g transform="translate(${-ox} ${-oy})"><defs>${lightGrad(g, l, b, d)}<clipPath id="${c}"><path d="${shape}"/></clipPath></defs>
    <path d="${shape}" fill="url(#${g})" stroke="${line}" stroke-width="3" stroke-linejoin="round"/>
    <g clip-path="url(#${c})">${bands}<path d="M576 112 Q584 66 612 18" stroke="#fff" stroke-width="5" fill="none" opacity=".7" stroke-linecap="round"/></g></g>`);
}

// =====================================================================
// Accessori (ognuno centrato sul suo punto della tela: ACC_AT / STICKER_SPOTS)
// =====================================================================

export const ACC_SIZE: Record<AccessoryId, [number, number]> = {
  bow: [140, 100], star: [64, 64], heart: [60, 56], crown: [130, 96], necklace: [190, 130], flower: [104, 104], glasses: [150, 100], wings: [210, 180],
};

function accessorySvg(id: AccessoryId): string {
  const [w, h] = ACC_SIZE[id];
  const g = uid('a'), g2 = uid('a'), b = uid('b');
  switch (id) {
    case 'bow': return svgDoc(w, h, `<defs>${ballGrad(g, '#ffd3ea', '#ff74b4', '#d43f86')}${blur(b, 3)}</defs>
      <path d="M62 54 L40 92 L52 92 L60 80 L66 94 L76 92 Z M78 54 L100 92 L88 92 L80 80 L74 94 L64 92 Z" fill="#e0559a" stroke="#b8347a" stroke-width="2.5" stroke-linejoin="round"/>
      <path d="M70 50 C46 12 10 18 12 50 C14 80 48 82 70 50 Z M70 50 C94 12 130 18 128 50 C126 80 92 82 70 50 Z" fill="url(#${g})" stroke="#b8347a" stroke-width="3" stroke-linejoin="round"/>
      <path d="M30 40 Q40 32 52 42 M110 40 Q100 32 88 42" stroke="#fff" stroke-width="4" fill="none" opacity=".55" stroke-linecap="round"/>
      <ellipse cx="70" cy="50" rx="15" ry="16" fill="#ff8cc6" stroke="#b8347a" stroke-width="3"/><ellipse cx="65" cy="45" rx="5" ry="4" fill="#fff" opacity=".8"/>`);
    case 'star': return svgDoc(w, h, `<defs>${lightGrad(g, '#fff6b0', '#ffcf2e', '#f08c00')}</defs>
      <path d="${starPath(32, 34, 28)}" fill="#c76a00" opacity=".45"/><path d="${starPath(32, 32, 28)}" fill="url(#${g})" stroke="#e08a00" stroke-width="2.5" stroke-linejoin="round"/>
      <ellipse cx="25" cy="22" rx="6" ry="3.5" transform="rotate(-30 25 22)" fill="#fff" opacity=".85"/>`);
    case 'heart': return svgDoc(w, h, `<defs>${ballGrad(g, '#ffc2da', '#ff5e9a', '#d42a6c')}</defs>
      <path d="M30 52 Q4 34 6 18 Q8 4 20 4 Q28 4 30 14 Q32 4 40 4 Q52 4 54 18 Q56 34 30 52 Z" fill="url(#${g})" stroke="#c4245f" stroke-width="2.5"/>
      <ellipse cx="17" cy="15" rx="5" ry="3.5" transform="rotate(-35 17 15)" fill="#fff" opacity=".85"/>`);
    case 'crown': return svgDoc(w, h, `<defs>${lightGrad(g, '#fff6b8', '#ffd04d', '#d98f10')}${ballGrad(g2, '#ffe0f2', '#ff5ea8', '#b8236e')}</defs>
      <path d="M14 82 L10 30 L38 54 L64 10 L90 54 L118 30 L114 82 Q64 94 14 82 Z" fill="url(#${g})" stroke="#c07a0c" stroke-width="3" stroke-linejoin="round"/>
      <path d="M16 72 Q64 84 112 72" stroke="#c07a0c" stroke-width="3" fill="none"/>
      <circle cx="64" cy="62" r="11" fill="url(#${g2})" stroke="#9c1c5c" stroke-width="2"/><circle cx="34" cy="68" r="7" fill="#7fe0d6" stroke="#2f9c94" stroke-width="2"/>
      <circle cx="94" cy="68" r="7" fill="#b58cf0" stroke="#7752b8" stroke-width="2"/>
      <circle cx="10" cy="28" r="6" fill="#fff4b8" stroke="#c07a0c" stroke-width="2"/><circle cx="64" cy="10" r="7" fill="#fff4b8" stroke="#c07a0c" stroke-width="2"/><circle cx="118" cy="28" r="6" fill="#fff4b8" stroke="#c07a0c" stroke-width="2"/>
      <path d="M26 40 L30 70" stroke="#fff" stroke-width="4" opacity=".6" stroke-linecap="round"/><ellipse cx="60" cy="57" rx="4" ry="3" fill="#fff"/>`);
    case 'necklace': {
      let pearls = '';
      for (let i = 0; i <= 12; i++) {
        const t = i / 12;
        const x = 18 + t * 150, y = 22 + Math.sin(t * Math.PI) * 62 + t * 18;
        pearls += `<circle cx="${f1(x)}" cy="${f1(y)}" r="8.5" fill="url(#${g})" stroke="#c9b6d8" stroke-width="1.5"/><circle cx="${f1(x - 2.5)}" cy="${f1(y - 3)}" r="2.6" fill="#fff"/>`;
      }
      return svgDoc(w, h, `<defs>${ballGrad(g, '#ffffff', '#f6eefc', '#cdbbe0')}${ballGrad(g2, '#ffc2da', '#ff5e9a', '#d42a6c')}</defs>${pearls}
        <path d="M96 100 Q76 88 78 76 Q80 66 89 66 Q95 66 96 73 Q97 66 103 66 Q112 66 114 76 Q116 88 96 100 Z" transform="translate(-4 10)" fill="url(#${g2})" stroke="#c4245f" stroke-width="2.5"/>`);
    }
    case 'flower': {
      let petals = '';
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * 360;
        petals += `<ellipse cx="52" cy="28" rx="16" ry="25" transform="rotate(${a} 52 52)" fill="url(#${g})" stroke="#d4569a" stroke-width="2.5"/>`;
      }
      return svgDoc(w, h, `<defs>${ballGrad(g, '#fff0f8', '#ffb3da', '#ef7cb8')}${ballGrad(g2, '#fff6b0', '#ffcf2e', '#f08c00')}</defs>${petals}
        <circle cx="52" cy="52" r="15" fill="url(#${g2})" stroke="#e08a00" stroke-width="2.5"/><circle cx="47" cy="47" r="4" fill="#fff" opacity=".85"/>`);
    }
    case 'glasses': return svgDoc(w, h, `<defs><linearGradient id="${g}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#bff3ff" stop-opacity=".85"/>
        <stop offset="1" stop-color="#b58cf0" stop-opacity=".75"/></linearGradient></defs>
      <path d="M8 40 Q30 36 52 46" stroke="#ff5ea8" stroke-width="7" fill="none" stroke-linecap="round"/>
      <path d="M94 88 Q56 66 56 42 Q58 20 78 20 Q90 20 94 32 Q98 20 110 20 Q132 20 132 42 Q132 66 94 88 Z" fill="url(#${g})" stroke="#ff5ea8" stroke-width="7" stroke-linejoin="round"/>
      <path d="M72 36 Q78 30 86 34" stroke="#fff" stroke-width="5" fill="none" stroke-linecap="round"/>`);
    case 'wings': {
      const feathers = [[0, 150], [1, 128], [2, 104], [3, 80]].map(([i, len]) =>
        `<path d="M150 150 Q${150 - len * 0.6} ${f1(110 - i * 26)} ${f1(150 - len)} ${f1(118 - i * 30)} Q${150 - len * 0.5} ${f1(150 - i * 14)} 150 158 Z" fill="url(#${g})" stroke="#c7a6e8" stroke-width="3" stroke-linejoin="round"/>`).join('');
      return svgDoc(w, h, `<defs>${lightGrad(g, '#ffffff', '#f6efff', '#d9c6f6')}${blur(b, 3)}</defs>
        <ellipse cx="150" cy="160" rx="34" ry="14" fill="#3a2a52" opacity=".15" filter="url(#${b})"/>${feathers}
        <path d="M70 90 Q100 96 130 120" stroke="#ffe7a8" stroke-width="5" fill="none" stroke-linecap="round"/>
        <path d="${starPath(56, 40, 12)}" fill="#ffe36a" stroke="#f0a500" stroke-width="2"/>`);
    }
  }
}

// =====================================================================
// Attrezzi del salone
// =====================================================================

function spongeSvg(): string {
  const g = uid('sp');
  const holes = [[40, 40, 7], [74, 32, 5], [104, 46, 8], [58, 64, 6], [92, 70, 5], [124, 62, 4], [30, 70, 4]]
    .map(([x, y, r]) => `<ellipse cx="${x}" cy="${y}" rx="${r}" ry="${r * 0.7}" fill="#e39a2b" opacity=".75"/>`).join('');
  return svgDoc(160, 110, `<defs>${lightGrad(g, '#fff3a6', '#ffd24d', '#f0a428')}</defs>
    <path d="M14 30 Q12 10 36 12 L128 10 Q150 10 148 32 L146 84 Q146 100 126 100 L32 100 Q12 100 12 82 Z" fill="#e8962a"/>
    <path d="M12 26 Q10 6 34 8 L126 6 Q148 6 146 28 L144 76 Q144 92 124 92 L30 92 Q10 92 10 76 Z" fill="url(#${g})" stroke="#d9891e" stroke-width="3"/>
    ${holes}<path d="M26 20 Q70 14 120 16" stroke="#fff" stroke-width="5" fill="none" opacity=".7" stroke-linecap="round"/>`);
}

function showerSvg(): string {
  const g = uid('sh'), g2 = uid('sh');
  let holes = '';
  for (let i = 0; i < 7; i++) holes += `<circle cx="${62 + i * 14}" cy="112" r="3.5" fill="#2d8f9a"/>`;
  return svgDoc(220, 140, `<defs>${lightGrad(g, '#e9fbff', '#8fdbe6', '#3fa9b8')}${lightGrad(g2, '#ffffff', '#d6dbe8', '#9aa3b8', true)}</defs>
    <path d="M220 30 Q170 22 150 40" stroke="#8fd6df" stroke-width="16" fill="none" stroke-linecap="round"/>
    <path d="M220 30 Q170 22 150 40" stroke="#c9f1f6" stroke-width="5" fill="none" stroke-linecap="round" opacity=".8"/>
    <rect x="128" y="30" width="34" height="40" rx="10" fill="url(#${g2})" stroke="#8a93aa" stroke-width="2.5"/>
    <path d="M50 78 Q50 58 74 56 L136 56 Q160 58 160 78 L164 106 Q166 118 152 118 L58 118 Q44 118 46 106 Z" fill="url(#${g})" stroke="#2f97a6" stroke-width="3"/>
    <rect x="50" y="104" width="112" height="14" rx="7" fill="#57bfcc"/>${holes}
    <path d="M64 70 Q100 64 140 68" stroke="#fff" stroke-width="5" fill="none" opacity=".75" stroke-linecap="round"/>`);
}

function brushSvg(): string {
  const g = uid('br'), g2 = uid('br');
  let bristles = '';
  for (let i = 0; i < 9; i++) bristles += `<rect x="${102 + i * 11}" y="64" width="6" height="40" rx="3" fill="${i % 2 ? '#f4eaff' : '#ffffff'}" stroke="#c9b8e6" stroke-width="1.2"/>`;
  return svgDoc(220, 120, `<defs>${lightGrad(g, '#ffe0ef', '#ff9ccb', '#d9629e', true)}${lightGrad(g2, '#ffffff', '#f2e9ff', '#c7b3ea', true)}</defs>
    ${bristles}
    <path d="M94 40 Q94 26 110 26 L196 26 Q212 26 212 40 L212 60 Q212 70 200 70 L106 70 Q94 70 94 60 Z" fill="url(#${g})" stroke="#c4528c" stroke-width="3"/>
    <path d="M10 46 Q10 36 22 36 L98 40 L98 56 L22 60 Q10 60 10 50 Z" fill="url(#${g2})" stroke="#a991d6" stroke-width="3"/>
    <path d="M108 34 Q150 30 200 34" stroke="#fff" stroke-width="5" fill="none" opacity=".75" stroke-linecap="round"/>
    <path d="${starPath(150, 48, 10)}" fill="#ffe36a" stroke="#f0a500" stroke-width="2"/>`);
}

/** Pennello magico: manico + punta in grigio (si colora con il colore scelto). */
function wandSvg(tip: boolean): string {
  const g = uid('w');
  if (tip) {
    return svgDoc(220, 80, `<defs>${lightGrad(g, '#ffffff', '#ececf4', '#b9b6cc')}</defs>
      <path d="M150 40 Q178 16 214 38 Q212 44 214 46 Q178 66 150 40 Z" fill="url(#${g})" stroke="#a39fbd" stroke-width="3"/>
      <path d="M164 34 Q184 26 204 36" stroke="#fff" stroke-width="4" fill="none" opacity=".8" stroke-linecap="round"/>`);
  }
  return svgDoc(220, 80, `<defs>${lightGrad(g, '#fff6c8', '#ffd04d', '#d98f10', true)}</defs>
    <path d="M12 34 Q12 28 18 28 L140 32 L140 48 L18 52 Q12 52 12 46 Z" fill="#b58cf0" stroke="#7752b8" stroke-width="3"/>
    <rect x="134" y="28" width="22" height="24" rx="5" fill="url(#${g})" stroke="#c07a0c" stroke-width="2.5"/>
    <path d="M22 34 L132 36" stroke="#fff" stroke-width="3" opacity=".6" stroke-linecap="round"/>
    <path d="${starPath(26, 40, 10)}" fill="#ffe36a" stroke="#f0a500" stroke-width="2"/>`);
}

/** Barattolo di colore: vasetto di vetro (sopra) e colore in grigio (sotto, da colorare); l'arcobaleno a parte. */
function potSvg(part: 'paint' | 'glass' | 'rainbow'): string {
  const g = uid('p');
  if (part === 'paint' || part === 'rainbow') {
    const fill = part === 'rainbow'
      ? `<linearGradient id="${g}" x1="0" y1="0" x2="1" y2="0">${['#ff8a9c', '#ffb36b', '#ffe073', '#8ee39a', '#74c8ff', '#b892ff'].map((c, i) => `<stop offset="${f1(i / 5)}" stop-color="${c}"/>`).join('')}</linearGradient>`
      : lightGrad(g, '#ffffff', '#e4e2ec', '#a9a5c0');
    return svgDoc(140, 140, `<defs>${fill}</defs>
      <path d="M26 58 Q70 48 114 58 L110 118 Q108 130 94 130 L46 130 Q32 130 30 118 Z" fill="url(#${g})"/>
      <path d="M26 58 Q70 70 114 58 Q70 46 26 58 Z" fill="#fff" opacity=".35"/>
      <path d="M70 46 Q84 36 80 22 Q96 34 88 52 Z" fill="url(#${g})"/>`);
  }
  return svgDoc(140, 140, `<path d="M22 40 L118 40 L114 120 Q112 134 96 134 L44 134 Q28 134 26 120 Z" fill="#dff6ff" fill-opacity=".22" stroke="#9fc3e8" stroke-width="4"/>
    <rect x="16" y="28" width="108" height="20" rx="8" fill="#ffe9f4" stroke="#e57aab" stroke-width="3"/>
    <path d="M36 56 L34 112" stroke="#fff" stroke-width="7" opacity=".7" stroke-linecap="round"/>
    <path d="M100 60 L99 80" stroke="#fff" stroke-width="4" opacity=".5" stroke-linecap="round"/>`);
}

function dropSvg(): string {
  const g = uid('d');
  return svgDoc(24, 34, `<defs>${ballGrad(g, '#ffffff', '#9fe3ff', '#3fa9e0')}</defs><path d="M12 2 Q22 18 22 23 Q22 32 12 32 Q2 32 2 23 Q2 18 12 2 Z" fill="url(#${g})"/>
    <ellipse cx="8.5" cy="20" rx="2.5" ry="4" fill="#fff" opacity=".9"/>`);
}

function tuftSvg(): string {
  return svgDoc(40, 40, `<path d="M6 34 Q10 14 20 8 Q16 22 22 30 Q26 14 34 10 Q30 26 24 36 Z" fill="#ffffff" opacity=".9"/>`);
}

// =====================================================================
// Scenario: salone tra le nuvole
// =====================================================================

function platformSvg(): string {
  const g = uid('pl'), g2 = uid('pl'), b = uid('b');
  return svgDoc(720, 220, `<defs>${lightGrad(g, '#c9fbf6', '#6fd8d0', '#2f9e98', true)}${lightGrad(g2, '#fff6c8', '#ffd04d', '#d98f10', true)}${blur(b, 10)}</defs>
    <ellipse cx="360" cy="176" rx="340" ry="38" fill="#3a2a52" opacity=".2" filter="url(#${b})"/>
    <path d="M30 86 L30 132 Q360 216 690 132 L690 86 Z" fill="url(#${g})"/>
    <path d="M30 132 Q360 216 690 132" stroke="#25807b" stroke-width="5" fill="none"/>
    <ellipse cx="360" cy="86" rx="330" ry="68" fill="#e9fffb"/>
    <ellipse cx="360" cy="86" rx="330" ry="68" fill="none" stroke="url(#${g2})" stroke-width="12"/>
    <ellipse cx="360" cy="90" rx="270" ry="48" fill="#bdf2ec" opacity=".7"/>
    ${[0, 1, 2, 3, 4, 5, 6, 7].map((i) => { const a = (i / 8) * Math.PI * 2; return `<path d="${starPath(360 + Math.cos(a) * 200, 90 + Math.sin(a) * 34, 9)}" fill="#ffffff" opacity=".8"/>`; }).join('')}
    <path d="M110 58 Q360 18 610 58" stroke="#fff" stroke-width="6" fill="none" opacity=".75" stroke-linecap="round"/>`);
}

function mirrorSvg(): string {
  const g = uid('mi'), g2 = uid('mi');
  const bulbs = Array.from({ length: 10 }, (_, i) => {
    const a = Math.PI + (i / 9) * Math.PI;
    return `<circle cx="${f1(160 + Math.cos(a) * 150)}" cy="${f1(200 + Math.sin(a) * 186)}" r="11" fill="#fff8d6" stroke="#f2c14d" stroke-width="3"/>`;
  }).join('');
  return svgDoc(320, 440, `<defs>${lightGrad(g, '#fff6c8', '#ffd04d', '#d98f10')}<linearGradient id="${g2}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#f5fdff"/><stop offset=".5" stop-color="#cfe9ff"/><stop offset="1" stop-color="#d9c8ff"/></linearGradient></defs>
    <ellipse cx="160" cy="226" rx="148" ry="200" fill="url(#${g})" stroke="#c07a0c" stroke-width="4"/>
    <ellipse cx="160" cy="226" rx="120" ry="170" fill="url(#${g2})" stroke="#e4a52a" stroke-width="4"/>
    <path d="M90 120 L150 70 M84 180 L180 96" stroke="#fff" stroke-width="16" opacity=".55" stroke-linecap="round"/>
    ${bulbs}<path d="${starPath(160, 26, 20)}" fill="#ffe36a" stroke="#f0a500" stroke-width="3"/>`);
}

function curtainSvg(): string {
  const g = uid('cu'), g2 = uid('cu');
  let folds = '';
  for (let i = 0; i < 5; i++) folds += `<path d="M${30 + i * 46} 40 Q${44 + i * 46} 400 ${20 + i * 40} 760" stroke="#2f8f95" stroke-width="7" fill="none" opacity=".35"/>`;
  return svgDoc(300, 820, `<defs>${lightGrad(g, '#b8f4ef', '#6fd2cf', '#2f9ea2')}${lightGrad(g2, '#ffe2f0', '#ff9fcb', '#e0609d', true)}</defs>
    <path d="M0 30 L270 30 Q230 300 170 440 Q140 520 200 800 L0 800 Z" fill="url(#${g})"/>${folds}
    <path d="M150 430 Q200 400 230 452 Q196 480 150 470 Z" fill="url(#${g2})" stroke="#c94a88" stroke-width="3"/>
    <rect x="0" y="0" width="300" height="46" rx="18" fill="url(#${g2})" stroke="#c94a88" stroke-width="3"/>
    ${[30, 90, 150, 210, 270].map((x) => `<circle cx="${x}" cy="23" r="9" fill="#fff6c8" stroke="#e4a52a" stroke-width="3"/>`).join('')}`);
}

function shelfSvg(): string {
  const g = uid('sf');
  const bottle = (x: number, y: number, c: string, h: number) => {
    const bg = uid('bt');
    return `<defs>${lightGrad(bg, shade(c, 0.5), c, shade(c, -0.3))}</defs>
      <rect x="${x - 26}" y="${y - h}" width="52" height="${h}" rx="16" fill="url(#${bg})" stroke="${shade(c, -0.35)}" stroke-width="3"/>
      <rect x="${x - 12}" y="${y - h - 22}" width="24" height="24" rx="6" fill="#fff" stroke="${shade(c, -0.35)}" stroke-width="3"/>
      <rect x="${x - 18}" y="${y - h * 0.6}" width="36" height="${h * 0.32}" rx="6" fill="#fff" opacity=".85"/>
      <path d="${starPath(x, y - h * 0.44, 8)}" fill="${c}"/>
      <rect x="${x - 18}" y="${y - h + 10}" width="8" height="${h * 0.5}" rx="4" fill="#fff" opacity=".55"/>`;
  };
  return svgDoc(340, 300, `<defs>${lightGrad(g, '#fff4fa', '#ffd2e6', '#e7a3c3', true)}</defs>
    ${bottle(70, 120, '#ff8cc6', 84)}${bottle(150, 120, '#4fd3cf', 100)}${bottle(232, 120, '#b58cf0', 76)}
    <rect x="10" y="118" width="320" height="26" rx="10" fill="url(#${g})" stroke="#d98bb0" stroke-width="3"/>
    ${bottle(100, 260, '#ffd04d', 70)}${bottle(250, 260, '#79e0a6', 92)}
    <path d="M180 260 Q200 210 222 260 Z" fill="#ffffff" stroke="#c9b8e6" stroke-width="3"/>
    <rect x="10" y="258" width="320" height="26" rx="10" fill="url(#${g})" stroke="#d98bb0" stroke-width="3"/>`);
}

function lampSvg(): string {
  const g = uid('la');
  return svgDoc(120, 300, `<defs>${ballGrad(g, '#ffffff', '#fff2a8', '#ffc94d')}</defs>
    <path d="M60 0 V190" stroke="#e7b8d6" stroke-width="5"/>
    <path d="${starPath(60, 236, 56)}" fill="url(#${g})" stroke="#f0a500" stroke-width="4" stroke-linejoin="round"/>
    <ellipse cx="44" cy="216" rx="12" ry="7" fill="#fff" opacity=".9"/>`);
}

function rainbowSvg(): string {
  const cols = ['#ff9aa8', '#ffc07a', '#ffe58a', '#a6eba6', '#8fd2ff', '#c5a6ff'];
  const arcs = cols.map((c, i) => {
    const r = 640 - i * 56;
    return `<path d="M${700 - r} 720 A${r} ${r} 0 0 1 ${700 + r} 720" stroke="${c}" stroke-width="58" fill="none"/>`;
  }).join('');
  return svgDoc(1400, 760, `${arcs}<path d="M88 720 A612 612 0 0 1 1312 720" stroke="#fff" stroke-width="8" fill="none" opacity=".45"/>`);
}

function polaroidSvg(): string {
  const b = uid('b');
  return svgDoc(320, 360, `<defs>${blur(b, 6)}</defs>
    <rect x="16" y="20" width="292" height="330" rx="10" fill="#3a2a52" opacity=".22" filter="url(#${b})"/>
    <rect x="10" y="10" width="292" height="330" rx="10" fill="#fffdf8" stroke="#e8dccb" stroke-width="2"/>`);
}

function photoBgSvg(): string {
  const g = uid('pb');
  const cols = ['#ff9aa8', '#ffc07a', '#ffe58a', '#a6eba6', '#8fd2ff', '#c5a6ff'];
  const arcs = cols.map((c, i) => `<path d="M${-10 + i * 18} 270 A${150 - i * 18} ${150 - i * 18} 0 0 1 ${290 - i * 18} 270" stroke="${c}" stroke-width="18" fill="none"/>`).join('');
  return svgDoc(260, 250, `<defs><linearGradient id="${g}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e7dcff"/><stop offset="1" stop-color="#ffd9ec"/></linearGradient></defs>
    <rect width="260" height="250" fill="url(#${g})"/><g transform="translate(-10 0)">${arcs}</g>
    <ellipse cx="60" cy="56" rx="40" ry="18" fill="#fff" opacity=".8"/><ellipse cx="210" cy="40" rx="30" ry="14" fill="#fff" opacity=".7"/>`);
}

function raysSvg(): string {
  let r = '';
  for (let i = 0; i < 16; i++) {
    const a1 = (i / 16) * Math.PI * 2, a2 = a1 + Math.PI / 22;
    r += `<path d="M300 300 L${f1(300 + Math.cos(a1) * 300)} ${f1(300 + Math.sin(a1) * 300)} L${f1(300 + Math.cos(a2) * 300)} ${f1(300 + Math.sin(a2) * 300)} Z" fill="#fff" opacity=".35"/>`;
  }
  return svgDoc(600, 600, r);
}

function badgeSvg(): string {
  const g = uid('bg');
  return svgDoc(130, 130, `<defs>${ballGrad(g, '#ffffff', '#f6efff', '#d8c6f6')}</defs>
    <circle cx="65" cy="70" r="56" fill="#b49ad8" opacity=".5"/><circle cx="65" cy="65" r="56" fill="url(#${g})" stroke="#c7a6e8" stroke-width="4"/>
    <ellipse cx="50" cy="38" rx="22" ry="10" fill="#fff" opacity=".8"/>`);
}

/** Icone dei pulsanti tondi (viewBox 100×100, bianche). */
const ICON_CAMERA = `<rect x="16" y="32" width="68" height="48" rx="10" fill="#fff"/><rect x="36" y="22" width="28" height="14" rx="4" fill="#fff"/>
  <circle cx="50" cy="56" r="15" fill="none" stroke="#b58cf0" stroke-width="6"/><circle cx="72" cy="42" r="4" fill="#b58cf0"/>`;
const ICON_ALBUM = `<rect x="18" y="20" width="52" height="60" rx="5" fill="#fff" transform="rotate(-10 44 50)"/>
  <rect x="32" y="22" width="52" height="60" rx="5" fill="#fff" stroke="#b58cf0" stroke-width="3"/>
  <rect x="38" y="28" width="40" height="34" rx="3" fill="#b58cf0" opacity=".55"/><path d="${starPath(58, 45, 10)}" fill="#fff"/>`;

/** Tutte le texture del gioco (rasterizzate all'apertura, nel loader Tappolino). */
export function gameTextures(): SvgTex[] {
  const list: SvgTex[] = [
    { key: 'un_coat', w: U.W, h: U.H, svg: coatSvg() },
    { key: 'un_coat_hl', w: U.W, h: U.H, svg: coatHlSvg() },
    { key: 'un_coat_stars', w: U.W, h: U.H, svg: coatStarsSvg() },
    { key: 'un_mane', w: U.W, h: U.H, svg: maneSvg() },
    { key: 'un_mane_rainbow', w: U.W, h: U.H, svg: maneRainbowSvg() },
    { key: 'un_mane_hl', w: U.W, h: U.H, svg: maneHlSvg() },
    { key: 'un_mane_messy', w: U.W, h: U.H, svg: maneMessySvg() },
    { key: 'un_mud', w: U.W, h: U.H, svg: mudSvg() },
    { key: 'un_foam', w: 90, h: 90, svg: foamSvg() },
    { key: 'un_eye_open', w: PARTS.eye.w, h: PARTS.eye.h, svg: eyeSvg('open') },
    { key: 'un_eye_closed', w: PARTS.eye.w, h: PARTS.eye.h, svg: eyeSvg('closed') },
    { key: 'un_eye_happy', w: PARTS.eye.w, h: PARTS.eye.h, svg: eyeSvg('happy') },
    ...(['gold', 'pearl', 'rose'] as HornId[]).map((h) => ({ key: `un_horn_${h}`, w: PARTS.horn.w, h: PARTS.horn.h, svg: hornSvg(h) })),
    ...(Object.keys(ACC_SIZE) as AccessoryId[]).map((id) => ({ key: `un_acc_${id}`, w: ACC_SIZE[id][0], h: ACC_SIZE[id][1], svg: accessorySvg(id) })),
    { key: 'un_sponge', w: 160, h: 110, svg: spongeSvg() },
    { key: 'un_shower', w: 220, h: 140, svg: showerSvg() },
    { key: 'un_brush', w: 220, h: 120, svg: brushSvg() },
    { key: 'un_wand', w: 220, h: 80, svg: wandSvg(false) },
    { key: 'un_wand_tip', w: 220, h: 80, svg: wandSvg(true) },
    { key: 'un_pot_paint', w: 140, h: 140, svg: potSvg('paint') },
    { key: 'un_pot_rainbow', w: 140, h: 140, svg: potSvg('rainbow') },
    { key: 'un_pot_glass', w: 140, h: 140, svg: potSvg('glass') },
    { key: 'un_drop', w: 24, h: 34, svg: dropSvg() },
    { key: 'un_tuft', w: 40, h: 40, svg: tuftSvg() },
    { key: 'un_platform', w: 720, h: 220, svg: platformSvg() },
    { key: 'un_mirror', w: 320, h: 440, svg: mirrorSvg() },
    { key: 'un_curtain', w: 300, h: 820, svg: curtainSvg() },
    { key: 'un_shelf', w: 340, h: 300, svg: shelfSvg() },
    { key: 'un_lamp', w: 120, h: 300, svg: lampSvg() },
    { key: 'un_rainbow', w: 1400, h: 760, svg: rainbowSvg() },
    { key: 'un_polaroid', w: 320, h: 360, svg: polaroidSvg() },
    { key: 'un_photo_bg', w: 260, h: 250, svg: photoBgSvg() },
    { key: 'un_rays', w: 600, h: 600, svg: raysSvg() },
    { key: 'un_badge', w: 130, h: 130, svg: badgeSvg() },
    roundButton('un_btn_photo', '#b58cf0', ICON_CAMERA, 200),
    roundButton('un_btn_album', '#4fc9c4', ICON_ALBUM, 200),
  ];
  return list;
}
