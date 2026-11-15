import { svgDoc, type SvgTex } from '../../core/textures';
import { lightGrad, ballGrad, blur, shade, starPath, roundButton, uid } from '../../core/art';
import { COLORS, COLOR_IDS, SHAPE_IDS, STATION_IDS, wagonW, type ShapeId, type StationId } from './logic';
import { animalTextures } from './animals';

/**
 * Grafica 2.5D di Treno degli Animali (decisione 8): stazioncina di campagna rossa e di legno sotto il cielo azzurro,
 * locomotiva a vapore rossa con i vagoni scoperti, biglietti con colori e forme, le tre stazioni da raggiungere
 * (fattoria, giungla, polo). Tutto disegnato qui in SVG, originale. Chiavi "tr_".
 */

const f = (n: number): string => n.toFixed(1);
const G = (id: string, base: string, k = 0.4, vertical = false): string => lightGrad(id, shade(base, k), base, shade(base, -0.28), vertical);
const V = (id: string, base: string, k = 0.35): string => lightGrad(id, shade(base, k), base, shade(base, -0.3), true);
const Bl = (id: string, base: string, k = 0.5): string => ballGrad(id, shade(base, k), base, shade(base, -0.3));
const shine = (cx: number, cy: number, rx: number, ry: number, rot = -25, op = 0.6): string =>
  `<ellipse cx="${f(cx)}" cy="${f(cy)}" rx="${f(rx)}" ry="${f(ry)}" transform="rotate(${rot} ${f(cx)} ${f(cy)})" fill="#fff" opacity="${op}"/>`;
const sh = (cx: number, cy: number, rx: number, ry: number, op = 0.28): string => {
  const id = uid('gs');
  return `<defs>${blur(id, Math.max(2, ry * 0.5))}</defs><ellipse cx="${f(cx)}" cy="${f(cy)}" rx="${f(rx)}" ry="${f(ry)}" fill="#1d2440" opacity="${op}" filter="url(#${id})"/>`;
};

/** Colori del gioco (brief: rosso, legno, cielo azzurro). */
export const RED = '#e2574c';
export const RED_DARK = '#a8352d';
export const WOOD = '#b9783f';
export const WOOD_DARK = '#7a4a24';
export const GOLD = '#ffc94a';
export const IRON = '#3d3449';

/** Generatore pseudo-casuale con seme (disegni identici a ogni avvio). */
function rng(seed: number): () => number {
  let s = seed >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}

// =====================================================================
// Locomotiva e vagoni
// =====================================================================

/** Locomotiva (vista di lato, guarda a destra). Rotaia a y = 330; ruote a parte (girano). */
export const LOCO = { w: 480, h: 340, rail: 330, wheels: [{ x: 108, r: 50 }, { x: 236, r: 50 }, { x: 382, r: 32 }], plate: { x: 96, y: 208 }, chimney: { x: 382, y: 36 }, whistle: { x: 300, y: 88 } };

function locoSvg(): string {
  const gr = uid('lr'), gb = uid('lb'), gc = uid('lc'), gch = uid('lch'), gg = uid('lg'), gw = uid('lw'), gi = uid('li'), gro = uid('lro'), gcc = uid('lcc');
  const R = LOCO.rail;
  let o = `<defs>${G(gr, RED, 0.38)}${V(gb, RED, 0.42)}${V(gro, '#9c2f2a', 0.3)}${V(gch, IRON, 0.35)}${Bl(gg, GOLD, 0.55)}${V(gi, IRON, 0.25)}${V(gcc, '#ffb52e', 0.4)}
    <linearGradient id="${gw}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e6f6ff"/><stop offset="1" stop-color="#9fd6f5"/></linearGradient>
    <radialGradient id="${gc}" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fff8c8"/><stop offset=".6" stop-color="#ffe066"/><stop offset="1" stop-color="#f0a500"/></radialGradient></defs>`;
  o += sh(240, R - 4, 230, 12, 0.3);
  // telaio
  o += `<rect x="20" y="248" width="424" height="38" rx="10" fill="url(#${gi})" stroke="#241c2c" stroke-width="4"/>
    <rect x="26" y="252" width="412" height="8" rx="4" fill="#fff" opacity=".12"/>`;
  // caldaia
  o += `<rect x="150" y="118" width="276" height="136" rx="40" fill="url(#${gb})" stroke="${RED_DARK}" stroke-width="5"/>
    <rect x="166" y="126" width="240" height="20" rx="10" fill="#fff" opacity=".28"/>`;
  for (const x of [214, 294, 368]) o += `<rect x="${x}" y="120" width="12" height="132" fill="url(#${gg})" stroke="#c48a10" stroke-width="2"/>`;
  // camera a fumo davanti e fanale
  o += `<rect x="414" y="122" width="34" height="128" rx="14" fill="url(#${gch})" stroke="#241c2c" stroke-width="4"/>
    <circle cx="446" cy="186" r="9" fill="url(#${gg})" stroke="#c48a10" stroke-width="2"/>
    <rect x="404" y="88" width="40" height="30" rx="8" fill="url(#${gch})" stroke="#241c2c" stroke-width="3"/>
    <circle cx="436" cy="103" r="12" fill="url(#${gc})" stroke="#c48a10" stroke-width="3"/>${shine(432, 99, 5, 3, -20, 0.9)}`;
  // comignolo a imbuto
  o += `<path d="M366 120 L370 74 Q348 58 350 36 H414 Q416 58 394 74 L398 120 Z" fill="url(#${gch})" stroke="#241c2c" stroke-width="4" stroke-linejoin="round"/>
    <rect x="344" y="28" width="76" height="14" rx="7" fill="url(#${gg})" stroke="#c48a10" stroke-width="3"/>
    <path d="M360 50 Q366 66 372 76" stroke="#fff" stroke-width="5" opacity=".25" fill="none" stroke-linecap="round"/>`;
  // duomo, fischietto, campana
  o += `<path d="M262 120 Q262 82 292 82 Q322 82 322 120 Z" fill="url(#${gg})" stroke="#c48a10" stroke-width="3.5"/>${shine(282, 94, 9, 5, -25, 0.8)}
    <rect x="186" y="98" width="14" height="22" rx="4" fill="url(#${gg})" stroke="#c48a10" stroke-width="2.5"/><path d="M180 98 H206" stroke="#c48a10" stroke-width="5" stroke-linecap="round"/>`;
  // cabina
  o += `<rect x="24" y="76" width="148" height="180" rx="12" fill="url(#${gr})" stroke="${RED_DARK}" stroke-width="5"/>
    <rect x="48" y="100" width="98" height="70" rx="12" fill="#fff6e4" stroke="${WOOD_DARK}" stroke-width="4"/>
    <rect x="58" y="110" width="78" height="52" rx="8" fill="url(#${gw})"/>
    <path d="M66 116 L86 116 L66 140 Z" fill="#fff" opacity=".7"/>
    <rect x="8" y="56" width="180" height="26" rx="13" fill="url(#${gro})" stroke="#6e1f1b" stroke-width="4"/>
    <rect x="18" y="60" width="150" height="7" rx="3.5" fill="#fff" opacity=".3"/>
    <rect x="34" y="84" width="132" height="8" rx="4" fill="#fff" opacity=".2"/>
    <circle cx="${LOCO.plate.x}" cy="${LOCO.plate.y}" r="34" fill="url(#${gg})" stroke="#c48a10" stroke-width="3"/>
    <circle cx="${LOCO.plate.x}" cy="${LOCO.plate.y}" r="27" fill="#fff6e4"/>`;
  // spazzaneve davanti e respingente
  o += `<path d="M440 262 L478 ${R - 2} L432 ${R - 2} Z" fill="url(#${gcc})" stroke="#b06a00" stroke-width="3.5" stroke-linejoin="round"/>
    <path d="M444 276 L462 ${R - 4} M440 290 L448 ${R - 4}" stroke="#b06a00" stroke-width="3"/>
    <rect x="444" y="244" width="22" height="14" rx="5" fill="url(#${gi})" stroke="#241c2c" stroke-width="2.5"/>
    <rect x="2" y="246" width="22" height="14" rx="5" fill="url(#${gi})" stroke="#241c2c" stroke-width="2.5"/>`;
  // scaletta
  o += `<path d="M30 286 V318 M54 286 V318 M30 300 H54 M30 314 H54" stroke="${IRON}" stroke-width="4" stroke-linecap="round"/>`;
  return svgDoc(LOCO.w, LOCO.h, o);
}

/**
 * Ruota a raggi. Non si ruota (Phaser 4 taglia a triangoli le immagini ruotate): tre fotogrammi con i raggi
 * spostati di 15° si alternano mentre il treno avanza (8 raggi: il disegno si ripete ogni 45°).
 */
export const WHEEL_FRAMES = 3;
function wheelSvg(r: number, phase = 0): string {
  const g = uid('wh'), gh = uid('wc');
  const s = r * 2 + 8, c = s / 2;
  let spokes = '';
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4 + (phase * Math.PI) / 180;
    spokes += `<path d="M${f(c)} ${f(c)} L${f(c + Math.cos(a) * r * 0.72)} ${f(c + Math.sin(a) * r * 0.72)}" stroke="${RED_DARK}" stroke-width="${f(r * 0.12)}" stroke-linecap="round"/>`;
  }
  return svgDoc(s, s, `<defs>${Bl(g, '#4a4058', 0.35)}${Bl(gh, GOLD, 0.5)}</defs>
    <circle cx="${c}" cy="${c}" r="${r}" fill="url(#${g})" stroke="#1f1828" stroke-width="4"/>
    <circle cx="${c}" cy="${c}" r="${f(r * 0.78)}" fill="${RED}" stroke="${RED_DARK}" stroke-width="3"/>
    ${spokes}<circle cx="${c}" cy="${c}" r="${f(r * 0.26)}" fill="url(#${gh})" stroke="#c48a10" stroke-width="2.5"/>
    <ellipse cx="${f(c - r * 0.35)}" cy="${f(c - r * 0.45)}" rx="${f(r * 0.3)}" ry="${f(r * 0.12)}" transform="rotate(-35 ${f(c - r * 0.35)} ${f(c - r * 0.45)})" fill="#fff" opacity=".3"/>`);
}

/** Vagone scoperto: H texture, rotaia in basso; ruote a parte. Coordinate dei pezzi per il gioco. */
export const WAGON = { h: 236, rail: 230, rimY: 72, panelTop: 74, panelBottom: 190, plateY: 134, wheelR: 30, backrestY: 44 };

function wagonBack(cap: number): string {
  const W = wagonW(cap), g = uid('wb');
  let o = `<defs>${V(g, '#8a5530', 0.25)}</defs><rect x="16" y="22" width="${W - 32}" height="150" rx="16" fill="url(#${g})" stroke="#5a3418" stroke-width="4"/>`;
  for (let x = 40; x < W - 30; x += 34) o += `<path d="M${x} 28 V168" stroke="#5a3418" stroke-width="3" opacity=".35"/>`;
  o += `<rect x="22" y="26" width="${W - 44}" height="8" rx="4" fill="#fff" opacity=".18"/>`;
  return svgDoc(W, WAGON.h, o);
}

/** Fiancata in scala di grigi: si colora con setTint (rosso, giallo, blu, verde, viola). */
function wagonPanel(cap: number): string {
  const W = wagonW(cap), g = uid('wp');
  return svgDoc(W, WAGON.h, `<defs><linearGradient id="${g}" x1="0" y1="0" x2=".3" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset=".5" stop-color="#e8e8e8"/><stop offset="1" stop-color="#a9a9a9"/></linearGradient></defs>
    <rect x="8" y="${WAGON.panelTop}" width="${W - 16}" height="${WAGON.panelBottom - WAGON.panelTop}" rx="18" fill="url(#${g})"/>
    <rect x="26" y="${WAGON.panelTop + 16}" width="${W - 52}" height="${WAGON.panelBottom - WAGON.panelTop - 32}" rx="12" fill="none" stroke="#8a8a8a" stroke-width="4" opacity=".6"/>`);
}

/** Bordi di legno, telaio, ganci, borchie e riflessi (non si colorano). */
function wagonTrim(cap: number): string {
  const W = wagonW(cap), gw = uid('wt'), gi = uid('wi'), gg = uid('wg');
  let o = `<defs>${V(gw, WOOD, 0.4)}${V(gi, IRON, 0.25)}${Bl(gg, GOLD, 0.55)}</defs>
    ${sh(W / 2, WAGON.rail - 4, W / 2 - 20, 9, 0.28)}
    <rect x="8" y="${WAGON.panelTop}" width="${W - 16}" height="${WAGON.panelBottom - WAGON.panelTop}" rx="18" fill="none" stroke="#2b1d26" stroke-opacity=".35" stroke-width="5"/>
    <rect x="30" y="${WAGON.panelTop + 10}" width="${W - 60}" height="9" rx="4.5" fill="#fff" opacity=".45"/>
    <rect x="2" y="${WAGON.rimY - 12}" width="${W - 4}" height="22" rx="11" fill="url(#${gw})" stroke="${WOOD_DARK}" stroke-width="4"/>
    <rect x="12" y="${WAGON.rimY - 9}" width="${W - 24}" height="5" rx="2.5" fill="#fff" opacity=".35"/>
    <rect x="22" y="${WAGON.panelBottom - 4}" width="${W - 44}" height="24" rx="8" fill="url(#${gi})" stroke="#241c2c" stroke-width="3.5"/>
    <rect x="0" y="${WAGON.panelBottom + 2}" width="26" height="12" rx="5" fill="url(#${gi})" stroke="#241c2c" stroke-width="2.5"/>
    <rect x="${W - 26}" y="${WAGON.panelBottom + 2}" width="26" height="12" rx="5" fill="url(#${gi})" stroke="#241c2c" stroke-width="2.5"/>`;
  for (let x = 24; x <= W - 24; x += Math.max(40, (W - 48) / Math.round((W - 48) / 52))) o += `<circle cx="${f(x)}" cy="${WAGON.rimY - 1}" r="4" fill="url(#${gg})"/>`;
  return svgDoc(W, WAGON.h, o);
}

/** Schienale imbottito di un posto (si vede sopra il bordo finché nessuno ci si siede). */
function backrestSvg(): string {
  const g = uid('br');
  return svgDoc(116, 84, `<defs>${Bl(g, '#d24a5a', 0.45)}</defs><rect x="6" y="6" width="104" height="74" rx="30" fill="url(#${g})" stroke="#8a2234" stroke-width="4"/>
    <circle cx="40" cy="36" r="4" fill="#8a2234" opacity=".5"/><circle cx="76" cy="36" r="4" fill="#8a2234" opacity=".5"/>${shine(42, 20, 20, 6, -8, 0.5)}`);
}

/** Targa tonda del vagone (crema con cornice d'oro): sopra va la forma, il colore o il numero. */
function plateSvg(): string {
  const g = uid('pl'), gc = uid('pc');
  return svgDoc(124, 124, `<defs>${Bl(g, GOLD, 0.5)}<radialGradient id="${gc}" cx=".4" cy=".35" r=".7"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#f6e6c4"/></radialGradient></defs>
    <circle cx="62" cy="66" r="56" fill="#7a4a10" opacity=".35"/><circle cx="62" cy="62" r="56" fill="url(#${g})" stroke="#b07a10" stroke-width="3"/>
    <circle cx="62" cy="62" r="45" fill="url(#${gc})" stroke="#c9a060" stroke-width="2"/>${shine(44, 38, 14, 7, -30, 0.7)}`);
}

// =====================================================================
// Biglietti, forme, colori
// =====================================================================

/** Biglietto appeso al collo: cartoncino in scala di grigi (si colora) + laccetto e riflessi a parte. */
export const TICKET = { w: 160, h: 136, cy: 76 };

function ticketCard(): string {
  const g = uid('tc');
  return svgDoc(TICKET.w, TICKET.h, `<defs><linearGradient id="${g}" x1="0" y1="0" x2=".4" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset=".55" stop-color="#ececec"/><stop offset="1" stop-color="#b9b9b9"/></linearGradient></defs>
    <path d="M12 34 Q12 20 26 20 H134 Q148 20 148 34 V58 Q138 62 138 76 Q138 90 148 94 V118 Q148 132 134 132 H26 Q12 132 12 118 V94 Q22 90 22 76 Q22 62 12 58 Z" fill="url(#${g})"/>`);
}

function ticketTop(): string {
  return svgDoc(TICKET.w, TICKET.h, `<path d="M56 4 L80 22 L104 4" stroke="#6a4a3a" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M12 34 Q12 20 26 20 H134 Q148 20 148 34 V58 Q138 62 138 76 Q138 90 148 94 V118 Q148 132 134 132 H26 Q12 132 12 118 V94 Q22 90 22 76 Q22 62 12 58 Z" fill="none" stroke="#2b1d26" stroke-opacity=".4" stroke-width="4"/>
    <circle cx="80" cy="30" r="5" fill="#6a4a3a"/>
    <path d="M28 40 Q28 30 38 30 H90" stroke="#fff" stroke-width="7" stroke-linecap="round" fill="none" opacity=".6"/>`);
}

/** Le forme (tutte dello stesso blu: si riconoscono dalla forma, non dal colore). */
export const SHAPE_BLUE = '#2c62c4';

export function shapePath(s: ShapeId, c = 50, r = 40): string {
  switch (s) {
    case 'circle': return `M${c - r} ${c} A${r} ${r} 0 1 1 ${c + r} ${c} A${r} ${r} 0 1 1 ${c - r} ${c} Z`;
    case 'square': { const q = r * 0.86, k = 9; return `M${c - q + k} ${c - q} H${c + q - k} Q${c + q} ${c - q} ${c + q} ${c - q + k} V${c + q - k} Q${c + q} ${c + q} ${c + q - k} ${c + q} H${c - q + k} Q${c - q} ${c + q} ${c - q} ${c + q - k} V${c - q + k} Q${c - q} ${c - q} ${c - q + k} ${c - q} Z`; }
    case 'triangle': return `M${c} ${c - r} Q${c + 5} ${c - r} ${c + 8} ${c - r + 5} L${c + r + 2} ${c + r * 0.72} Q${c + r + 3} ${c + r * 0.84} ${c + r - 8} ${c + r * 0.84} H${c - r + 8} Q${c - r - 3} ${c + r * 0.84} ${c - r - 2} ${c + r * 0.72} L${c - 8} ${c - r + 5} Q${c - 5} ${c - r} ${c} ${c - r} Z`;
    case 'star': return starPath(c, c + 3, r * 1.12, 0.5);
    case 'heart': return `M${c} ${c + r * 0.9} Q${c - r * 1.2} ${c + r * 0.05} ${c - r * 1.02} ${c - r * 0.42} Q${c - r * 0.85} ${c - r * 0.95} ${c - r * 0.4} ${c - r * 0.9} Q${c - r * 0.1} ${c - r * 0.85} ${c} ${c - r * 0.45} Q${c + r * 0.1} ${c - r * 0.85} ${c + r * 0.4} ${c - r * 0.9} Q${c + r * 0.85} ${c - r * 0.95} ${c + r * 1.02} ${c - r * 0.42} Q${c + r * 1.2} ${c + r * 0.05} ${c} ${c + r * 0.9} Z`;
  }
}

function shapeSvg(s: ShapeId, col = SHAPE_BLUE): string {
  const g = uid('sh');
  return svgDoc(100, 100, `<defs>${G(g, col, 0.45)}</defs><path d="${shapePath(s, 52, 38)}" fill="${shade(col, -0.45)}" opacity=".4"/>
    <path d="${shapePath(s, 50, 38)}" fill="url(#${g})" stroke="${shade(col, -0.35)}" stroke-width="4" stroke-linejoin="round"/>${shine(36, 32, 10, 5, -30, 0.7)}`);
}

/** Pallina di colore (sulla targa dei vagoni nei viaggi dei colori). */
function colorDotSvg(col: string): string {
  const g = uid('cd');
  return svgDoc(100, 100, `<defs>${Bl(g, col, 0.55)}</defs><circle cx="52" cy="54" r="38" fill="${shade(col, -0.45)}" opacity=".4"/>
    <circle cx="50" cy="50" r="38" fill="url(#${g})" stroke="${shade(col, -0.35)}" stroke-width="4"/>${shine(37, 34, 12, 7, -30, 0.75)}`);
}

// =====================================================================
// Stemmi delle stazioni (cartello, locomotiva, album)
// =====================================================================

export const STATION_COLOR: Record<StationId, string> = { fattoria: '#e2574c', giungla: '#3dbb4f', polo: '#5ab4e8' };

function emblemSvg(id: StationId): string {
  const ring = STATION_COLOR[id], gr = uid('er'), gb = uid('eb');
  let icon = '';
  if (id === 'fattoria') {
    const g1 = uid('fb'), g2 = uid('fr');
    icon = `<defs>${G(g1, '#e8453c', 0.35)}${V(g2, '#8a3a2a', 0.3)}</defs>
      <rect x="44" y="110" width="72" height="8" rx="4" fill="#5fbf5a"/>
      <path d="M48 112 V72 L80 48 L112 72 V112 Z" fill="url(#${g1})" stroke="#9c2420" stroke-width="3.5" stroke-linejoin="round"/>
      <path d="M42 76 L80 44 L118 76" stroke="url(#${g2})" stroke-width="9" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
      <rect x="66" y="82" width="28" height="30" fill="#fff6e4" stroke="#9c2420" stroke-width="3"/><path d="M66 82 L94 112 M94 82 L66 112" stroke="#9c2420" stroke-width="3"/>
      <circle cx="80" cy="66" r="6" fill="#fff6e4" stroke="#9c2420" stroke-width="2.5"/>`;
  } else if (id === 'giungla') {
    const g1 = uid('gl'), g2 = uid('gt');
    icon = `<defs>${G(g1, '#3dbb4f', 0.4)}${V(g2, '#a8683a', 0.35)}</defs>
      <circle cx="108" cy="58" r="16" fill="#ffd84a"/>
      <path d="M78 120 Q74 92 84 66" stroke="url(#${g2})" stroke-width="11" fill="none" stroke-linecap="round"/>
      <path d="M84 64 Q60 48 40 64 Q62 58 84 66 Z M84 64 Q104 44 124 58 Q102 56 84 66 Z M84 64 Q72 40 52 42 Q70 50 84 66 Z M84 64 Q100 74 112 92 Q96 74 84 66 Z M84 64 Q66 74 56 94 Q70 76 84 66 Z" fill="url(#${g1})" stroke="#1f7a3a" stroke-width="3" stroke-linejoin="round"/>
      <circle cx="80" cy="70" r="5" fill="#8a5420"/><circle cx="90" cy="72" r="5" fill="#8a5420"/>`;
  } else {
    const g1 = uid('pi');
    icon = `<defs>${ballGrad(g1, '#ffffff', '#e6f4ff', '#a9d4f0')}</defs>
      <path d="M38 112 Q38 62 80 62 Q122 62 122 112 Z" fill="url(#${g1})" stroke="#6aa6d0" stroke-width="3.5"/>
      <path d="M46 94 H114 M42 78 H118 M60 64 V78 M100 64 V78 M70 78 V94 M92 78 V94 M56 94 V112 M104 94 V112" stroke="#9cc8e6" stroke-width="2.5"/>
      <path d="M68 112 V98 Q68 86 80 86 Q92 86 92 98 V112 Z" fill="#3d5f86"/>
      <path d="M118 36 V60 M108 42 L128 54 M128 42 L108 54" stroke="#ffffff" stroke-width="4" stroke-linecap="round"/>`;
  }
  return svgDoc(160, 160, `<defs>${Bl(gr, ring, 0.45)}<radialGradient id="${gb}" cx=".4" cy=".35" r=".7"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="${id === 'polo' ? '#d8eefb' : '#fbecc8'}"/></radialGradient></defs>
    <circle cx="80" cy="84" r="74" fill="#1d2440" opacity=".2"/><circle cx="80" cy="80" r="74" fill="url(#${gr})" stroke="${shade(ring, -0.4)}" stroke-width="4"/>
    <circle cx="80" cy="80" r="60" fill="url(#${gb})"/>${icon}${shine(52, 40, 18, 9, -30, 0.55)}`);
}

// =====================================================================
// Stazioncina di campagna e paesaggio
// =====================================================================

/** Colline a profilo periodico (si ripetono senza giunte: servono anche al viaggio che scorre). */
function hillsSvg(w: number, h: number, top: string, bottom: string, amp: number, base: number, seed: number, trees = 0, treeCol = '#4fae55', res = 1): string {
  const r = rng(seed), g = uid('hl');
  const k1 = 2, k2 = 3, k3 = 5, p1 = r() * 6, p2 = r() * 6, p3 = r() * 6;
  const y = (x: number) => base - amp * (0.55 * Math.sin((x / w) * Math.PI * 2 * k1 + p1) + 0.3 * Math.sin((x / w) * Math.PI * 2 * k2 + p2) + 0.15 * Math.sin((x / w) * Math.PI * 2 * k3 + p3));
  let d = `M0 ${h} L0 ${f(y(0))}`;
  for (let x = 0; x <= w; x += 20) d += ` L${x} ${f(y(x))}`;
  d += ` L${w} ${h} Z`;
  let tr = '';
  for (let i = 0; i < trees; i++) {
    const x = ((i + 0.5) / trees) * w + (r() - 0.5) * 60, yy = y(x) + 6, s = 0.7 + r() * 0.5;
    tr += `<path d="M${f(x)} ${f(yy)} V${f(yy - 30 * s)}" stroke="${shade(treeCol, -0.45)}" stroke-width="${f(5 * s)}"/><circle cx="${f(x)}" cy="${f(yy - 36 * s)}" r="${f(18 * s)}" fill="${treeCol}"/><circle cx="${f(x - 5 * s)}" cy="${f(yy - 41 * s)}" r="${f(7 * s)}" fill="#fff" opacity=".18"/>`;
  }
  return svgDoc(w * res, h * res, `<defs><linearGradient id="${g}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${top}"/><stop offset="1" stop-color="${bottom}"/></linearGradient></defs><path d="${d}" fill="url(#${g})"/>${tr}`, w, h);
}

/** Stazioncina di legno dipinta di rosso, tetto di tegole di legno, orologio, cassette di fiori. */
function stationSvg(): string {
  const gw = uid('sw'), gr = uid('sr'), gd = uid('sd'), gwin = uid('swn'), gc = uid('sc'), gg = uid('sg');
  let o = `<defs>${G(gw, RED, 0.3)}${V(gr, '#8a4a2a', 0.35)}${V(gd, WOOD, 0.35)}${Bl(gg, GOLD, 0.5)}
    <linearGradient id="${gwin}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e6f6ff"/><stop offset="1" stop-color="#8ccbf0"/></linearGradient>
    <radialGradient id="${gc}" cx=".4" cy=".35" r=".7"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#f3e6c8"/></radialGradient></defs>`;
  o += sh(380, 590, 360, 14, 0.3);
  // camino
  o += `<rect x="520" y="70" width="54" height="110" fill="#c7584a" stroke="#7a2a22" stroke-width="4"/><rect x="512" y="62" width="70" height="18" rx="5" fill="#9c3a30" stroke="#7a2a22" stroke-width="3"/>`;
  // muro di assi rosse
  o += `<rect x="70" y="220" width="620" height="370" fill="url(#${gw})" stroke="${RED_DARK}" stroke-width="5"/>`;
  for (let y = 246; y < 590; y += 26) o += `<path d="M72 ${y} H688" stroke="${RED_DARK}" stroke-width="2.5" opacity=".35"/>`;
  o += `<rect x="70" y="560" width="620" height="30" fill="${WOOD}" stroke="${WOOD_DARK}" stroke-width="4"/>`;
  // frontone con l'orologio
  o += `<path d="M250 230 L380 120 L510 230 Z" fill="url(#${gw})" stroke="${RED_DARK}" stroke-width="5" stroke-linejoin="round"/>
    <circle cx="380" cy="186" r="38" fill="url(#${gg})" stroke="#b07a10" stroke-width="3"/><circle cx="380" cy="186" r="30" fill="url(#${gc})"/>
    <path d="M380 186 V164 M380 186 L396 192" stroke="#3a2a3a" stroke-width="5" stroke-linecap="round"/><circle cx="380" cy="186" r="4" fill="#3a2a3a"/>`;
  // tetto di legno (falde) con lo sporto
  o += `<path d="M20 240 L180 150 H310 L250 240 Z" fill="url(#${gr})" stroke="#5a2a14" stroke-width="5" stroke-linejoin="round"/>
    <path d="M740 240 L580 150 H450 L510 240 Z" fill="url(#${gr})" stroke="#5a2a14" stroke-width="5" stroke-linejoin="round"/>
    <path d="M240 238 L380 108 L520 238" stroke="url(#${gd})" stroke-width="18" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
  for (let i = 1; i < 4; i++) o += `<path d="M${20 + i * 46} ${240 - i * 22} L${240 - i * 14} ${240 - i * 22}" stroke="#5a2a14" stroke-width="2.5" opacity=".4"/><path d="M${740 - i * 46} ${240 - i * 22} L${520 + i * 14} ${240 - i * 22}" stroke="#5a2a14" stroke-width="2.5" opacity=".4"/>`;
  o += `<rect x="14" y="236" width="732" height="16" rx="8" fill="${WOOD}" stroke="${WOOD_DARK}" stroke-width="4"/>`;
  // finestre con le cassette di fiori, porta
  const win = (x: number) => {
    let w = `<rect x="${x}" y="300" width="110" height="120" rx="8" fill="#fff6e4" stroke="${WOOD_DARK}" stroke-width="4"/>
      <rect x="${x + 10}" y="310" width="90" height="100" rx="5" fill="url(#${gwin})"/><path d="M${x + 55} 310 V410 M${x + 10} 360 H${x + 100}" stroke="#fff6e4" stroke-width="7"/>
      <path d="M${x + 16} 318 L${x + 44} 318 L${x + 16} 350 Z" fill="#fff" opacity=".6"/>
      <rect x="${x - 6}" y="424" width="122" height="30" rx="6" fill="url(#${gd})" stroke="${WOOD_DARK}" stroke-width="3"/>`;
    for (let k = 0; k < 5; k++) w += `<circle cx="${x + 8 + k * 24}" cy="418" r="11" fill="#3dbb4f"/><circle cx="${x + 8 + k * 24}" cy="412" r="8" fill="${['#ffc61a', '#ff8fb0', '#fff6e4', '#ff6b5a', '#9a5fd8'][k]}"/><circle cx="${x + 8 + k * 24}" cy="412" r="3" fill="#ffe680"/>`;
    return w;
  };
  o += win(120) + win(530);
  o += `<path d="M320 590 V340 Q320 300 380 300 Q440 300 440 340 V590 Z" fill="url(#${gd})" stroke="${WOOD_DARK}" stroke-width="5"/>
    <path d="M380 304 V590" stroke="${WOOD_DARK}" stroke-width="4" opacity=".5"/><circle cx="364" cy="460" r="7" fill="${GOLD}"/><circle cx="396" cy="460" r="7" fill="${GOLD}"/>
    <path d="M336 340 Q340 318 362 314" stroke="#fff" stroke-width="5" fill="none" opacity=".3" stroke-linecap="round"/>`;
  // insegna con il trenino
  o += `<rect x="250" y="252" width="260" height="38" rx="10" fill="#fff6e4" stroke="${WOOD_DARK}" stroke-width="4"/>
    <g transform="translate(330 256)"><rect x="0" y="12" width="40" height="16" rx="4" fill="${RED}"/><rect x="28" y="2" width="14" height="14" fill="${RED}"/><rect x="8" y="4" width="8" height="10" fill="${IRON}"/>
    <circle cx="10" cy="28" r="5" fill="${IRON}"/><circle cx="32" cy="28" r="5" fill="${IRON}"/>
    <rect x="48" y="12" width="30" height="16" rx="4" fill="#2f86e8"/><circle cx="54" cy="28" r="5" fill="${IRON}"/><circle cx="72" cy="28" r="5" fill="${IRON}"/>
    <path d="M${f(100)} 4 L${f(104)} 14 L${f(114)} 15 L${f(106)} 21 L${f(109)} 31 L${f(100)} 25 L${f(91)} 31 L${f(94)} 21 L${f(86)} 15 L${f(96)} 14 Z" fill="${GOLD}"/></g>`;
  return svgDoc(760, 600, o);
}

function treeSvg(col = '#4fae55'): string {
  const gt = uid('tt'), gl = uid('tl');
  return svgDoc(300, 380, `<defs>${V(gt, '#a8683a', 0.35)}${Bl(gl, col, 0.5)}</defs>${sh(150, 366, 90, 12)}
    <path d="M134 370 Q138 280 128 220 H172 Q162 280 166 370 Z" fill="url(#${gt})" stroke="#5a3418" stroke-width="4"/>
    <circle cx="96" cy="180" r="70" fill="url(#${gl})" stroke="${shade(col, -0.4)}" stroke-width="4"/>
    <circle cx="204" cy="180" r="70" fill="url(#${gl})" stroke="${shade(col, -0.4)}" stroke-width="4"/>
    <circle cx="150" cy="120" r="88" fill="url(#${gl})" stroke="${shade(col, -0.4)}" stroke-width="4"/>
    <circle cx="150" cy="200" r="62" fill="url(#${gl})"/>
    ${shine(118, 76, 30, 15, -30, 0.35)}<circle cx="190" cy="140" r="9" fill="#e8453c"/><circle cx="110" cy="190" r="9" fill="#e8453c"/><circle cx="164" cy="210" r="8" fill="#e8453c"/>`);
}

function bushSvg(col = '#5cbf5a'): string {
  const g = uid('bu');
  return svgDoc(260, 150, `<defs>${Bl(g, col, 0.45)}</defs>${sh(130, 138, 110, 10)}
    <circle cx="70" cy="96" r="48" fill="url(#${g})" stroke="${shade(col, -0.4)}" stroke-width="4"/><circle cx="190" cy="96" r="48" fill="url(#${g})" stroke="${shade(col, -0.4)}" stroke-width="4"/>
    <circle cx="130" cy="74" r="62" fill="url(#${g})" stroke="${shade(col, -0.4)}" stroke-width="4"/><rect x="40" y="96" width="180" height="44" rx="22" fill="url(#${g})"/>
    <circle cx="96" cy="70" r="7" fill="#fff6e4"/><circle cx="160" cy="92" r="7" fill="#ff8fb0"/><circle cx="196" cy="74" r="6" fill="#fff6e4"/>`);
}

function fenceSvg(): string {
  const g = uid('fe');
  let o = `<defs>${V(g, '#fff6e4', 0.4)}</defs><rect x="0" y="50" width="640" height="14" rx="5" fill="url(#${g})" stroke="#b0946a" stroke-width="3"/><rect x="0" y="86" width="640" height="14" rx="5" fill="url(#${g})" stroke="#b0946a" stroke-width="3"/>`;
  for (let x = 14; x < 640; x += 52) o += `<path d="M${x} 118 V30 L${x + 12} 16 L${x + 24} 30 V118 Z" fill="url(#${g})" stroke="#b0946a" stroke-width="3" stroke-linejoin="round"/>`;
  return svgDoc(640, 120, o);
}

/** Lampione del marciapiede. */
function lampSvg(): string {
  const g = uid('lp'), gl = uid('ll');
  return svgDoc(120, 430, `<defs>${V(g, '#2f6a5a', 0.35)}<radialGradient id="${gl}" cx=".5" cy=".45" r=".6"><stop offset="0" stop-color="#fffbe0"/><stop offset="1" stop-color="#ffd24a"/></radialGradient></defs>
    ${sh(60, 420, 40, 8)}<rect x="40" y="396" width="40" height="22" rx="6" fill="url(#${g})" stroke="#173a30" stroke-width="3"/>
    <rect x="52" y="100" width="16" height="300" rx="6" fill="url(#${g})" stroke="#173a30" stroke-width="3"/>
    <path d="M30 98 H90 L80 34 H40 Z" fill="url(#${gl})" stroke="#173a30" stroke-width="4" stroke-linejoin="round"/>
    <path d="M60 34 V98 M34 66 H86" stroke="#173a30" stroke-width="3" opacity=".6"/>
    <path d="M26 36 L60 10 L94 36 Z" fill="url(#${g})" stroke="#173a30" stroke-width="4" stroke-linejoin="round"/><circle cx="60" cy="8" r="6" fill="${GOLD}"/>`);
}

function benchSvg(): string {
  const g = uid('be'), gi = uid('bi');
  return svgDoc(300, 160, `<defs>${V(g, WOOD, 0.4)}${V(gi, IRON, 0.3)}</defs>${sh(150, 150, 130, 9)}
    <rect x="30" y="20" width="240" height="22" rx="8" fill="url(#${g})" stroke="${WOOD_DARK}" stroke-width="3"/><rect x="30" y="50" width="240" height="22" rx="8" fill="url(#${g})" stroke="${WOOD_DARK}" stroke-width="3"/>
    <rect x="16" y="90" width="268" height="24" rx="8" fill="url(#${g})" stroke="${WOOD_DARK}" stroke-width="3"/>
    <path d="M44 18 V150 M256 18 V150" stroke="url(#${gi})" stroke-width="12" stroke-linecap="round"/>`);
}

/** Cartello della destinazione (sopra va lo stemma della stazione). */
function signpostSvg(): string {
  const g = uid('sp');
  return svgDoc(220, 340, `<defs>${V(g, WOOD, 0.4)}</defs>${sh(110, 330, 50, 8)}
    <rect x="98" y="120" width="24" height="212" rx="6" fill="url(#${g})" stroke="${WOOD_DARK}" stroke-width="3"/>
    <rect x="14" y="14" width="192" height="150" rx="20" fill="url(#${g})" stroke="${WOOD_DARK}" stroke-width="5"/>
    <rect x="26" y="26" width="168" height="126" rx="14" fill="#fff6e4" stroke="${WOOD_DARK}" stroke-width="3"/>
    <path d="M138 140 H186 L198 152 L186 164 H138 Z" fill="${RED}" stroke="${RED_DARK}" stroke-width="3"/>`);
}

/** Binario visto un po' dall'alto: massicciata, traversine, rotaia lucida. Si ripete ogni 256. */
export const RAIL = { w: 256, h: 92, top: 10 };

function railSvg(): string {
  const gb = uid('rb'), gs = uid('rs'), gr = uid('rr');
  let o = `<defs><linearGradient id="${gb}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#b9a68c"/><stop offset="1" stop-color="#8f7d66"/></linearGradient>${V(gs, '#8a5530', 0.3)}
    <linearGradient id="${gr}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#eef2f7"/><stop offset=".4" stop-color="#a9b2c2"/><stop offset="1" stop-color="#5f6a7c"/></linearGradient></defs>
    <rect x="0" y="22" width="256" height="70" fill="url(#${gb})"/>`;
  const r = rng(9);
  for (let i = 0; i < 40; i++) o += `<circle cx="${f(r() * 256)}" cy="${f(30 + r() * 58)}" r="${f(2 + r() * 3)}" fill="${r() > 0.5 ? '#cdbca2' : '#7a6a56'}" opacity=".7"/>`;
  for (let x = 0; x < 256; x += 64) o += `<path d="M${x + 6} 30 H${x + 50} L${x + 58} 58 H${x - 2} Z" fill="url(#${gs})" stroke="#5a3418" stroke-width="3" stroke-linejoin="round"/>`;
  o += `<rect x="0" y="10" width="256" height="16" fill="url(#${gr})"/><rect x="0" y="26" width="256" height="4" fill="#3d4352" opacity=".6"/><rect x="0" y="12" width="256" height="3" fill="#fff" opacity=".7"/>`;
  return svgDoc(RAIL.w, RAIL.h, o);
}

/** Palo del telegrafo (scorre veloce durante il viaggio). */
function poleSvg(): string {
  const g = uid('po');
  return svgDoc(110, 440, `<defs>${V(g, '#9a6a3a', 0.35)}</defs><rect x="48" y="20" width="14" height="420" rx="5" fill="url(#${g})" stroke="#5a3418" stroke-width="3"/>
    <rect x="12" y="44" width="86" height="12" rx="4" fill="url(#${g})" stroke="#5a3418" stroke-width="3"/><circle cx="22" cy="40" r="6" fill="#e6f0ff"/><circle cx="88" cy="40" r="6" fill="#e6f0ff"/>`);
}

/** Sbuffo di vapore. */
function puffSvg(): string {
  const g = uid('pf');
  return svgDoc(130, 100, `<defs><radialGradient id="${g}" cx=".4" cy=".35" r=".7"><stop offset="0" stop-color="#ffffff"/><stop offset=".7" stop-color="#eef3f8"/><stop offset="1" stop-color="#c9d6e4"/></radialGradient></defs>
    <circle cx="40" cy="60" r="32" fill="url(#${g})"/><circle cx="76" cy="44" r="38" fill="url(#${g})"/><circle cx="96" cy="66" r="28" fill="url(#${g})"/><ellipse cx="66" cy="72" rx="50" ry="22" fill="url(#${g})"/>`);
}

/** Cespugli fioriti sfocati in primo piano. */
function fgBushSvg(col: string, flower: string): string {
  const g = uid('fg'), b = uid('fb');
  return svgDoc(520, 300, `<defs>${Bl(g, col, 0.35)}${blur(b, 5)}</defs><g filter="url(#${b})">
    <circle cx="120" cy="200" r="110" fill="url(#${g})"/><circle cx="300" cy="170" r="130" fill="url(#${g})"/><circle cx="440" cy="220" r="90" fill="url(#${g})"/>
    <circle cx="110" cy="140" r="16" fill="${flower}"/><circle cx="250" cy="100" r="18" fill="${flower}"/><circle cx="350" cy="130" r="15" fill="#fff6e4"/><circle cx="430" cy="170" r="16" fill="${flower}"/></g>`);
}

// =====================================================================
// Le tre stazioni da raggiungere
// =====================================================================

/** Fienile rosso con il silo. */
function barnSvg(): string {
  const gw = uid('bw'), gr = uid('br'), gs = uid('bs'), gss = uid('bss');
  return svgDoc(560, 460, `<defs>${G(gw, '#e2574c', 0.3)}${V(gr, '#7a3a2a', 0.35)}${G(gs, '#c9d2dc', 0.4)}${Bl(gss, '#9aa8b8', 0.4)}</defs>${sh(280, 446, 260, 12)}
    <rect x="400" y="120" width="110" height="320" fill="url(#${gs})" stroke="#6a7686" stroke-width="4"/><path d="M400 120 Q455 60 510 120 Z" fill="url(#${gss})" stroke="#6a7686" stroke-width="4"/>
    <path d="M400 180 H510 M400 240 H510 M400 300 H510 M400 360 H510" stroke="#6a7686" stroke-width="3" opacity=".5"/>
    <path d="M40 440 V220 L110 130 H330 L400 220 V440 Z" fill="url(#${gw})" stroke="#9c2420" stroke-width="5" stroke-linejoin="round"/>
    <path d="M24 226 L104 120 H336 L416 226" stroke="url(#${gr})" stroke-width="20" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M60 236 H380" stroke="#fff6e4" stroke-width="10"/>
    <rect x="150" y="300" width="140" height="140" fill="#fff6e4" stroke="#9c2420" stroke-width="4"/><rect x="160" y="310" width="120" height="130" fill="#b8382f"/>
    <path d="M160 310 L280 440 M280 310 L160 440" stroke="#fff6e4" stroke-width="10"/>
    <rect x="186" y="170" width="68" height="56" fill="#fff6e4" stroke="#9c2420" stroke-width="4"/><rect x="194" y="178" width="52" height="40" fill="#ffd77a"/>
    <path d="M60 300 H140 M300 300 H380" stroke="#9c2420" stroke-width="3" opacity=".35"/>`);
}

function haystackSvg(): string {
  const g = uid('hy');
  let o = `<defs>${Bl(g, '#f2c24a', 0.45)}</defs>${sh(130, 190, 120, 10)}<path d="M20 190 Q20 60 130 40 Q240 60 240 190 Z" fill="url(#${g})" stroke="#b0861a" stroke-width="4"/>`;
  const r = rng(4);
  for (let i = 0; i < 26; i++) { const x = 40 + r() * 180, y = 70 + r() * 110; o += `<path d="M${f(x)} ${f(y)} l${f(-8 + r() * 16)} ${f(14 + r() * 8)}" stroke="#c9961e" stroke-width="3" stroke-linecap="round"/>`; }
  return svgDoc(260, 200, o);
}

function sunflowerSvg(): string {
  const gp = uid('sfp'), gc = uid('sfc');
  let pet = '';
  for (let i = 0; i < 12; i++) { const a = (i * Math.PI) / 6; pet += `<ellipse cx="${f(60 + Math.cos(a) * 30)}" cy="${f(60 + Math.sin(a) * 30)}" rx="16" ry="9" transform="rotate(${f((a * 180) / Math.PI)} ${f(60 + Math.cos(a) * 30)} ${f(60 + Math.sin(a) * 30)})" fill="url(#${gp})" stroke="#c48a00" stroke-width="2"/>`; }
  return svgDoc(120, 320, `<defs>${G(gp, '#ffd02a', 0.4)}${Bl(gc, '#8a5420', 0.35)}</defs><path d="M60 80 Q66 200 58 320" stroke="#3a9a3f" stroke-width="10" fill="none"/>
    <path d="M62 190 Q96 170 108 186 Q86 200 62 196 Z M58 240 Q24 222 12 238 Q34 252 58 246 Z" fill="#4fae55" stroke="#2a7a33" stroke-width="2"/>
    ${pet}<circle cx="60" cy="60" r="22" fill="url(#${gc})" stroke="#5a3418" stroke-width="3"/>`);
}

function palmSvg(): string {
  const gt = uid('pt'), gl = uid('pl');
  let trunk = '';
  for (let i = 0; i < 9; i++) trunk += `<path d="M${f(196 + i * 3)} ${f(600 - i * 54)} Q${f(214 + i * 3)} ${f(588 - i * 54)} ${f(232 + i * 3)} ${f(600 - i * 54)}" stroke="#7a4a24" stroke-width="4" fill="none" opacity=".5"/>`;
  const leaf = (d: string) => `<path d="${d}" fill="url(#${gl})" stroke="#1f7a3a" stroke-width="4" stroke-linejoin="round"/>`;
  return svgDoc(440, 620, `<defs>${V(gt, '#b07a44', 0.35)}${G(gl, '#3dbb4f', 0.45)}</defs>${sh(220, 608, 90, 10)}
    <path d="M196 612 Q186 360 220 120 L250 124 Q232 360 246 612 Z" fill="url(#${gt})" stroke="#6a3c1c" stroke-width="4"/>${trunk}
    ${leaf('M232 120 Q120 60 20 150 Q110 110 232 136 Z')}${leaf('M232 120 Q340 50 430 150 Q340 104 232 136 Z')}
    ${leaf('M232 116 Q170 10 80 20 Q170 50 228 128 Z')}${leaf('M232 116 Q300 0 400 30 Q300 50 236 128 Z')}
    ${leaf('M232 124 Q150 150 110 250 Q170 170 236 134 Z')}${leaf('M232 124 Q320 160 350 260 Q290 170 228 134 Z')}
    <circle cx="220" cy="140" r="16" fill="#8a5420"/><circle cx="244" cy="146" r="16" fill="#8a5420"/><circle cx="232" cy="160" r="15" fill="#7a4a1a"/>`);
}

function leavesSvg(): string {
  const g = uid('lv'), b = uid('lb');
  const leaf = (x: number, y: number, s: number, flip: number) =>
    `<g transform="translate(${x} ${y}) scale(${s * flip} ${s})"><path d="M0 0 Q-60 -150 30 -260 Q120 -150 0 0 Z" fill="url(#${g})" stroke="#1f6a33" stroke-width="5"/><path d="M0 0 Q20 -130 30 -250" stroke="#1f6a33" stroke-width="4" fill="none"/></g>`;
  return svgDoc(600, 420, `<defs>${G(g, '#2f9a48', 0.4)}${blur(b, 4)}</defs><g filter="url(#${b})">${leaf(120, 420, 1.3, -1)}${leaf(260, 420, 1.5, 1)}${leaf(420, 420, 1.2, 1)}${leaf(520, 420, 1.0, -1)}
    <circle cx="200" cy="200" r="22" fill="#ff5a7a"/><circle cx="200" cy="200" r="8" fill="#ffd23a"/><circle cx="470" cy="230" r="20" fill="#ff8a2a"/><circle cx="470" cy="230" r="7" fill="#ffd23a"/></g>`);
}

function iglooSvg(): string {
  const g = uid('ig');
  return svgDoc(440, 280, `<defs>${ballGrad(g, '#ffffff', '#e8f4ff', '#a9d0ee')}</defs>${sh(220, 266, 210, 12)}
    <path d="M30 264 Q30 40 220 40 Q410 40 410 264 Z" fill="url(#${g})" stroke="#6aa6d0" stroke-width="5"/>
    <path d="M60 200 H380 M44 140 H396 M90 90 H350 M140 40 V90 M300 40 V90 M120 90 V140 M220 90 V140 M320 90 V140 M80 140 V200 M180 140 V200 M270 140 V200 M360 140 V200" stroke="#a9cde8" stroke-width="4"/>
    <path d="M150 264 V200 Q150 150 220 150 Q290 150 290 200 V264 Z" fill="url(#${g})" stroke="#6aa6d0" stroke-width="5"/>
    <path d="M178 264 V214 Q178 180 220 180 Q262 180 262 214 V264 Z" fill="#3d5f86"/>${shine(140, 90, 60, 20, -20, 0.5)}`);
}

function snowPineSvg(): string {
  const g = uid('sp'), gt = uid('st');
  const tier = (y: number, w: number) => `<path d="M${110 - w} ${y} L110 ${y - 110} L${110 + w} ${y} Q110 ${y + 14} ${110 - w} ${y} Z" fill="url(#${g})" stroke="#1f5a4a" stroke-width="4" stroke-linejoin="round"/>
    <path d="M${110 - w * 0.7} ${y - 30} Q110 ${y - 70} ${110 + w * 0.7} ${y - 30} L110 ${y - 108} Z" fill="#fff" opacity=".92"/>`;
  return svgDoc(220, 370, `<defs>${G(g, '#2f8a6a', 0.35)}${V(gt, '#8a5a30', 0.3)}</defs>${sh(110, 358, 70, 9)}<rect x="96" y="300" width="28" height="60" fill="url(#${gt})"/>
    ${tier(320, 100)}${tier(230, 80)}${tier(140, 58)}`);
}

/** Paesaggio lontano di ogni stazione (con la foschia). Texture a metà risoluzione: si mostra con scala 2. */
function farSvg(id: StationId): string {
  const W = 2400, H = 460, r = rng(id.length * 7);
  let o = '';
  if (id === 'fattoria') {
    o += hillsBody(W, H, '#bfe6a8', '#9fd48a', 70, 250, 3);
    for (let i = 0; i < 7; i++) { const x = 150 + i * 330; o += `<path d="M${x} ${300 + (i % 2) * 20} h220 l40 120 h-300 Z" fill="${i % 2 ? '#e8d27a' : '#9fd06a'}" opacity=".75"/>`; }
    o += hillsBody(W, H, '#8fd078', '#6fbf5a', 40, 360, 5);
  } else if (id === 'giungla') {
    o += `<path d="M0 260 L300 90 L520 240 L800 60 L1100 250 L1400 110 L1700 250 L2000 80 L2400 260 V460 H0 Z" fill="#9ed8b4"/>`;
    o += `<path d="M1180 140 Q1196 300 1186 360" stroke="#e8fbff" stroke-width="26" fill="none" opacity=".85"/><ellipse cx="1186" cy="364" rx="60" ry="16" fill="#fff" opacity=".7"/>`;
    for (let i = 0; i < 26; i++) { const x = i * 96 + r() * 40, y = 300 + r() * 50, s = 50 + r() * 40; o += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(s)}" fill="${i % 2 ? '#4fae6a' : '#3f9a5a'}"/>`; }
    o += `<rect x="0" y="330" width="${W}" height="130" fill="#3f9a5a"/>`;
  } else {
    o += `<path d="M0 300 L220 120 L400 260 L640 80 L900 280 L1180 140 L1420 290 L1700 100 L1980 280 L2200 160 L2400 300 V460 H0 Z" fill="#cfe6f7"/>
      <path d="M220 120 L180 154 L230 150 L262 170 L280 150 Z M640 80 L600 120 L660 110 L700 136 Z M1180 140 L1140 176 L1196 168 L1230 186 Z M1700 100 L1660 140 L1716 130 L1750 156 Z" fill="#ffffff"/>`;
    o += `<rect x="0" y="330" width="${W}" height="60" fill="#7fc4ea"/>`;
    for (let i = 0; i < 8; i++) { const x = 100 + i * 300 + r() * 60, w = 70 + r() * 70; o += `<path d="M${f(x)} 352 L${f(x + w * 0.3)} ${f(300 - r() * 30)} L${f(x + w * 0.7)} ${f(310 - r() * 20)} L${f(x + w)} 352 Z" fill="#f4fbff" stroke="#a9d4f0" stroke-width="3"/>`; }
    o += `<rect x="0" y="380" width="${W}" height="80" fill="#e8f4fc"/>`;
  }
  return svgDoc(W / 2, H / 2, o, W, H);
}

function hillsBody(w: number, h: number, top: string, bottom: string, amp: number, base: number, seed: number): string {
  // corpo di hillsSvg senza il documento (per comporre più piani in una texture)
  const s = hillsSvg(w, h, top, bottom, amp, base, seed);
  return s.slice(s.indexOf('>') + 1, s.lastIndexOf('</svg>'));
}

// =====================================================================
// Pulsanti e album
// =====================================================================

const ALBUM_ICON = `<path d="M18 30 L38 22 L62 30 L82 22 V72 L62 80 L38 72 L18 80 Z" fill="#ffffff" stroke="#ffffff" stroke-width="4" stroke-linejoin="round"/>
  <path d="M38 22 V72 M62 30 V80" stroke="#c9d6e4" stroke-width="3"/>
  <path d="M26 64 Q40 44 52 54 Q64 64 74 40" stroke="#e2574c" stroke-width="5" fill="none" stroke-dasharray="7 6" stroke-linecap="round"/>
  <circle cx="74" cy="38" r="7" fill="#e2574c"/>`;

/** Bollino dell'album dietro ogni animale. */
function stickerSvg(): string {
  const g = uid('sk');
  return svgDoc(170, 170, `<defs><radialGradient id="${g}" cx=".4" cy=".35" r=".7"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#f3ead8"/></radialGradient></defs>
    <circle cx="85" cy="90" r="78" fill="#1d2440" opacity=".18"/><circle cx="85" cy="85" r="78" fill="url(#${g})" stroke="#e0c99a" stroke-width="5"/>${shine(60, 46, 22, 10, -30, 0.6)}`);
}

function flakeSvg(): string {
  return svgDoc(30, 30, `<path d="M15 2 V28 M3 8 L27 22 M27 8 L3 22" stroke="#fff" stroke-width="4" stroke-linecap="round"/><circle cx="15" cy="15" r="4" fill="#fff"/>`);
}

function leafSvg(): string {
  return svgDoc(40, 24, `<path d="M2 12 Q20 -4 38 12 Q20 28 2 12 Z" fill="#fff"/><path d="M4 12 H34" stroke="#ccc" stroke-width="2"/>`);
}

// =====================================================================
// Elenco texture
// =====================================================================

export function gameTextures(): SvgTex[] {
  const list: SvgTex[] = [
    { key: 'tr_loco', w: LOCO.w, h: LOCO.h, svg: locoSvg() },
    { key: 'tr_backrest', w: 116, h: 84, svg: backrestSvg() },
    { key: 'tr_plate', w: 124, h: 124, svg: plateSvg() },
    { key: 'tr_ticket', w: TICKET.w, h: TICKET.h, svg: ticketCard() },
    { key: 'tr_ticket_top', w: TICKET.w, h: TICKET.h, svg: ticketTop() },
    { key: 'tr_station', w: 760, h: 600, svg: stationSvg() },
    { key: 'tr_hills_far', w: 1200, h: 180, svg: hillsSvg(2400, 360, '#cfe9d6', '#b5dcc4', 60, 200, 3, 18, '#a5d2b0', 0.5) },
    { key: 'tr_hills', w: 1200, h: 150, svg: hillsSvg(2400, 300, '#9ddc84', '#78c860', 40, 150, 11, 12, '#4fae55', 0.5) },
    { key: 'tr_tree', w: 300, h: 380, svg: treeSvg() },
    { key: 'tr_bush', w: 260, h: 150, svg: bushSvg() },
    { key: 'tr_fence', w: 640, h: 120, svg: fenceSvg() },
    { key: 'tr_lamp', w: 120, h: 430, svg: lampSvg() },
    { key: 'tr_bench', w: 300, h: 160, svg: benchSvg() },
    { key: 'tr_signpost', w: 220, h: 340, svg: signpostSvg() },
    { key: 'tr_rail', w: RAIL.w, h: RAIL.h, svg: railSvg() },
    { key: 'tr_pole', w: 110, h: 440, svg: poleSvg() },
    { key: 'tr_puff', w: 130, h: 100, svg: puffSvg() },
    { key: 'tr_fg_bush', w: 520, h: 300, svg: fgBushSvg('#5cbf5a', '#ff8fb0') },
    { key: 'tr_fg_snow', w: 520, h: 300, svg: fgBushSvg('#e6f2fb', '#ffffff') },
    { key: 'tr_barn', w: 560, h: 460, svg: barnSvg() },
    { key: 'tr_haystack', w: 260, h: 200, svg: haystackSvg() },
    { key: 'tr_sunflower', w: 120, h: 320, svg: sunflowerSvg() },
    { key: 'tr_palm', w: 440, h: 620, svg: palmSvg() },
    { key: 'tr_leaves', w: 600, h: 420, svg: leavesSvg() },
    { key: 'tr_igloo', w: 440, h: 280, svg: iglooSvg() },
    { key: 'tr_snowpine', w: 220, h: 370, svg: snowPineSvg() },
    { key: 'tr_jungle_bush', w: 260, h: 150, svg: bushSvg('#2f9a48') },
    { key: 'tr_sticker', w: 170, h: 170, svg: stickerSvg() },
    { key: 'tr_flake', w: 30, h: 30, svg: flakeSvg() },
    { key: 'tr_leaf', w: 40, h: 24, svg: leafSvg() },
    roundButton('tr_btn_album', '#f2a01e', ALBUM_ICON, 200),
  ];
  for (const c of [1, 2, 3, 4, 5]) {
    const W = wagonW(c);
    list.push(
      { key: `tr_wagon_back_${c}`, w: W, h: WAGON.h, svg: wagonBack(c) },
      { key: `tr_wagon_panel_${c}`, w: W, h: WAGON.h, svg: wagonPanel(c) },
      { key: `tr_wagon_trim_${c}`, w: W, h: WAGON.h, svg: wagonTrim(c) },
    );
  }
  for (let k = 0; k < WHEEL_FRAMES; k++) {
    const ph = (k * 45) / WHEEL_FRAMES;
    list.push(
      { key: `tr_wheel_big_${k}`, w: 108, h: 108, svg: wheelSvg(50, ph) },
      { key: `tr_wheel_${k}`, w: 72, h: 72, svg: wheelSvg(32, ph) },
      { key: `tr_wheel_wagon_${k}`, w: 68, h: 68, svg: wheelSvg(30, ph) },
    );
  }
  for (const s of SHAPE_IDS) list.push({ key: `tr_shape_${s}`, w: 100, h: 100, svg: shapeSvg(s) });
  for (const c of COLOR_IDS) list.push({ key: `tr_dot_${c}`, w: 100, h: 100, svg: colorDotSvg(COLORS[c]) });
  for (const s of STATION_IDS) list.push({ key: `tr_emb_${s}`, w: 160, h: 160, svg: emblemSvg(s) }, { key: `tr_far_${s}`, w: 1200, h: 230, svg: farSvg(s) });
  return [...list, ...animalTextures()];
}
