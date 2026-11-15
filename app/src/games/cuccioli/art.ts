import { svgDoc, type SvgTex } from '../../core/textures';
import { lightGrad, ballGrad, blur, shade, starPath, roundButton, uid } from '../../core/art';
import { PETS, TOOLS, type Pet, type ToolId } from './logic';

/**
 * Grafica 2.5D di Cuccioli dal Dottore (decisione 8): ambulatorio luminoso verde acqua e crema con la finestra
 * sul giardino, cuccioli tondi e buffi, strumenti del dottore (niente aghi: spugna, pinzette, cerotto, biberon,
 * copertina, fazzoletto, sciarpa), giardino della clinica. Tutto disegnato qui in SVG, originale. Chiavi "cu_".
 */

const f = (n: number): string => n.toFixed(1);
const G = (id: string, base: string, k = 0.4, vertical = false): string => lightGrad(id, shade(base, k), base, shade(base, -0.28), vertical);
const B = (id: string, base: string, k = 0.5): string => ballGrad(id, shade(base, k), base, shade(base, -0.3));
const shine = (cx: number, cy: number, rx: number, ry: number, rot = -25, op = 0.7): string =>
  `<ellipse cx="${f(cx)}" cy="${f(cy)}" rx="${f(rx)}" ry="${f(ry)}" transform="rotate(${rot} ${f(cx)} ${f(cy)})" fill="#fff" opacity="${op}"/>`;

/** Colori dell'ambulatorio (brief: verde acqua e crema). */
export const TEAL = '#4cc3a5';
export const TEAL_DARK = '#2a8f78';
export const CREAM = '#fff6e4';

/** Generatore pseudo-casuale con seme (disegni identici a ogni avvio). */
function rng(seed: number): () => number {
  let s = seed >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}

// =====================================================================
// Cuccioli: corpo seduto (con zampe davanti), testa, zampetta, coda
// Coordinate del cucciolo (logic.SPOTS): origine ai piedi, testa centrata a y = -390.
// =====================================================================

interface Skin { fur: string; light: string; dark: string; line: string; belly: string; accent: string; accentLine: string; leg: string; legLine: string }
const skinOf = (p: Pet): Skin => {
  const leg = p.id === 'panda' || p.id === 'fox' ? p.accent : p.id === 'lamb' ? p.belly : p.fur;
  return {
    fur: p.fur, light: shade(p.fur, 0.5), dark: shade(p.fur, -0.22), line: shade(p.fur, p.id === 'panda' || p.id === 'lamb' || p.id === 'bunny' ? -0.36 : -0.45),
    belly: p.belly, accent: p.accent, accentLine: shade(p.accent, -0.4), leg, legLine: shade(leg, -0.42),
  };
};

/** Corpo seduto: anche, pancia, zampe anteriori (le zampette sono texture a parte). 420×380, terra a y=370. */
export const BODY = { w: 420, h: 380, ground: 370 };

function bodySvg(p: Pet): string {
  const s = skinOf(p);
  const gb = uid('cb'), gl = uid('cl'), gh = uid('ch'), gbe = uid('cbe'), wl = uid('cw');
  const cx = 210, g = BODY.ground;
  let o = `<defs>
    <radialGradient id="${gb}" gradientUnits="userSpaceOnUse" cx="150" cy="130" r="300"><stop offset="0" stop-color="${s.light}"/><stop offset=".55" stop-color="${s.fur}"/><stop offset="1" stop-color="${s.dark}"/></radialGradient>
    ${G(gl, s.leg, 0.35)}${B(gh, p.id === 'panda' ? s.accent : s.fur, 0.4)}
    <radialGradient id="${gbe}" cx=".42" cy=".3" r=".8"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="${s.belly}"/></radialGradient>
    ${ballGrad(wl, '#ffffff', s.fur, shade(s.fur, -0.12))}</defs>`;
  const bodyD = `M${cx} 66 C300 66 344 168 352 252 C362 334 322 ${g - 6} ${cx} ${g - 6} C98 ${g - 6} 58 334 68 252 C76 168 120 66 ${cx} 66 Z`;
  // lana dell'agnellino: riccioli attorno al corpo
  if (p.id === 'lamb') {
    for (let i = 0; i < 16; i++) {
      const a = -Math.PI * 0.95 + (i / 15) * Math.PI * 1.9;
      const x = cx + Math.cos(a - Math.PI / 2) * 150, y = 220 + Math.sin(a - Math.PI / 2) * 140;
      o += `<circle cx="${f(x)}" cy="${f(y)}" r="38" fill="url(#${wl})" stroke="${s.line}" stroke-width="4"/>`;
    }
  }
  // anche (dietro alle zampe anteriori)
  for (const sx of [-1, 1]) {
    const hx = cx + sx * 112;
    o += `<ellipse cx="${hx}" cy="${g - 58}" rx="78" ry="62" fill="url(#${gh})" stroke="${s.line}" stroke-width="5"/>
      <ellipse cx="${hx + sx * 18}" cy="${g - 10}" rx="54" ry="20" fill="${p.id === 'panda' ? s.accent : s.leg}" stroke="${p.id === 'panda' ? s.accentLine : s.legLine}" stroke-width="4"/>`;
  }
  o += `<path d="${bodyD}" fill="url(#${gb})" stroke="${s.line}" stroke-width="5" stroke-linejoin="round"/>`;
  // macchie e motivi
  if (p.id === 'dog') o += `<ellipse cx="300" cy="170" rx="40" ry="46" fill="${s.accent}" opacity=".85"/>`;
  if (p.id === 'cat') for (const y of [130, 168]) o += `<path d="M86 ${y + 50} Q110 ${y + 40} 122 ${y + 58} M334 ${y + 50} Q310 ${y + 40} 298 ${y + 58}" stroke="${s.accent}" stroke-width="12" fill="none" stroke-linecap="round"/>`;
  if (p.id === 'panda') o += `<path d="M78 170 Q${cx} 100 342 170 L346 214 Q${cx} 150 74 214 Z" fill="${s.accent}"/>`;
  if (p.id === 'lamb') o += `<path d="${bodyD}" fill="url(#${wl})" opacity=".6"/>`;
  // pancia
  o += `<ellipse cx="${cx}" cy="250" rx="${p.id === 'lamb' ? 80 : 98}" ry="${p.id === 'lamb' ? 80 : 100}" fill="url(#${gbe})" opacity="${p.id === 'panda' || p.id === 'bunny' ? 0.6 : 0.95}"/>`;
  // zampe anteriori (colonne tonde fino alle zampette)
  for (const sx of [-1, 1]) {
    const lx = cx + sx * 72;
    o += `<path d="M${lx - 32} 196 Q${lx - 36} 300 ${lx - 30} ${g - 26} L${lx + 30} ${g - 26} Q${lx + 36} 300 ${lx + 32} 196 Q${lx} 176 ${lx - 32} 196 Z"
      fill="url(#${gl})" stroke="${s.legLine}" stroke-width="5" stroke-linejoin="round"/>
      ${shine(lx - 12, 236, 8, 26, -4, 0.45)}`;
  }
  o += shine(140, 120, 34, 18, -32, 0.55);
  return svgDoc(BODY.w, BODY.h, o);
}

/** Testa: 420×460, centro della testa a (210, 290) = punto (0, -390) del cucciolo. Occhi e bocca sono a parte. */
export const HEAD = { w: 420, h: 460, cx: 210, cy: 290 };

function earsSvg(p: Pet, s: Skin, front: boolean): string {
  const ge = uid('ce'), gi = uid('ci');
  const defs = `<defs>${G(ge, p.ears === 'floppy' || p.id === 'panda' ? s.accent : s.fur, 0.35)}${G(gi, shade(p.belly, -0.05), 0.2)}</defs>`;
  const L = (d: string, fill: string, stroke: string, w = 5) => `<path d="${d}" fill="${fill}" stroke="${stroke}" stroke-width="${w}" stroke-linejoin="round"/>`;
  const mirror = (svg: string) => `${svg}<g transform="translate(420 0) scale(-1 1)">${svg}</g>`;
  switch (p.ears) {
    case 'floppy':
      return front ? defs + mirror(L('M104 186 C42 196 30 330 74 372 C104 398 136 330 128 206 Z', `url(#${ge})`, s.accentLine) + shine(70, 260, 8, 30, 8, 0.4)) : '';
    case 'pointy':
      return front ? '' : defs + mirror(L('M88 230 Q74 120 96 84 Q150 110 186 176 Z', `url(#${ge})`, s.line) + L('M104 200 Q98 136 108 112 Q140 134 160 172 Z', '#ffc2d0', '#e895ab', 3));
    case 'long':
      return front ? '' : defs + mirror(`<g transform="rotate(-12 150 120)">${L('M150 196 C112 196 104 40 150 0 C196 40 188 196 150 196 Z', `url(#${ge})`, s.line)}${L('M150 176 C128 176 124 60 150 30 C176 60 172 176 150 176 Z', '#ffc8da', '#eea0bc', 3)}</g>`);
    case 'round':
      return front ? '' : defs + mirror(`<circle cx="96" cy="180" r="54" fill="url(#${ge})" stroke="${p.id === 'panda' ? s.accentLine : s.line}" stroke-width="5"/>
        ${p.id === 'panda' ? '' : `<circle cx="100" cy="184" r="28" fill="${p.belly}" opacity=".9"/>`}`);
    case 'big':
      return front ? '' : defs + mirror(L('M74 250 Q40 110 70 52 Q146 82 190 170 Z', `url(#${ge})`, s.line) + L('M88 220 Q70 128 86 90 Q130 116 160 168 Z', '#fff6ea', '#e9d8c4', 3) + L('M70 52 Q86 62 98 70 Q78 84 66 96 Q64 70 70 52 Z', s.accent, s.accentLine, 3));
    case 'pig':
      return front ? defs + mirror(L('M96 200 Q70 128 84 100 Q140 116 168 168 Q132 168 118 214 Z', `url(#${ge})`, s.line) + L('M106 186 Q92 140 98 124 Q132 136 150 166 Z', '#ffd0dc', '#eaa3b5', 3)) : '';
    case 'lamb':
      return front ? '' : defs + mirror(`<g transform="rotate(20 70 300)">${L('M140 290 C100 268 40 270 26 300 C40 330 100 330 140 306 Z', `url(#${ge})`, s.line)}${L('M120 292 C94 280 60 282 48 300 C60 316 94 318 120 304 Z', '#ffd6c8', '#e6b3a3', 3)}</g>`);
  }
}

function headSvg(p: Pet): string {
  const s = skinOf(p);
  const { cx, cy } = HEAD;
  const gh = uid('chd'), gs = uid('csn'), gn = uid('cno'), wl = uid('cwl');
  const face = p.id === 'lamb' ? p.belly : s.fur;
  let o = `<defs>
    <radialGradient id="${gh}" gradientUnits="userSpaceOnUse" cx="${cx - 60}" cy="${cy - 70}" r="230"><stop offset="0" stop-color="${shade(face, 0.5)}"/><stop offset=".55" stop-color="${face}"/><stop offset="1" stop-color="${shade(face, -0.24)}"/></radialGradient>
    <radialGradient id="${gs}" cx=".4" cy=".3" r=".8"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="${p.id === 'pig' ? shade(p.nose, 0.4) : p.belly}"/></radialGradient>
    ${B(gn, p.nose, 0.45)}${ballGrad(wl, '#ffffff', p.fur, shade(p.fur, -0.12))}</defs>`;
  o += earsSvg(p, s, false);
  // testa
  const rx = p.id === 'bunny' || p.id === 'cat' ? 140 : 150, ry = 134;
  o += `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="url(#${gh})" stroke="${shade(face, -0.42)}" stroke-width="5"/>`;
  if (p.id === 'fox') o += `<path d="M${cx - rx + 8} ${cy + 10} Q${cx - 60} ${cy + 10} ${cx} ${cy + 40} Q${cx + 60} ${cy + 10} ${cx + rx - 8} ${cy + 10} Q${cx + 110} ${cy + 120} ${cx} ${cy + 132} Q${cx - 110} ${cy + 120} ${cx - rx + 8} ${cy + 10} Z" fill="#fff6ea"/>`;
  if (p.id === 'cat') for (const dx of [-26, 0, 26]) o += `<path d="M${cx + dx - 9} ${cy - 128} L${cx + dx} ${cy - 82} L${cx + dx + 9} ${cy - 128} Z" fill="${s.accent}"/>`;
  if (p.id === 'panda') for (const sx of [-1, 1]) o += `<ellipse cx="${cx + sx * 60}" cy="${cy - 4}" rx="42" ry="52" transform="rotate(${sx * -28} ${cx + sx * 60} ${cy - 4})" fill="${s.accent}"/>`;
  if (p.id === 'dog') o += `<ellipse cx="${cx + 64}" cy="${cy - 12}" rx="44" ry="42" fill="${s.accent}" opacity=".8"/>`;
  // ciuffo di lana dell'agnellino
  if (p.id === 'lamb') {
    for (const [x, y, r] of [[-70, -104, 40], [-24, -128, 44], [28, -128, 44], [74, -102, 40], [0, -96, 40]]) {
      o += `<circle cx="${cx + x}" cy="${cy + y}" r="${r}" fill="url(#${wl})" stroke="${s.line}" stroke-width="4"/>`;
    }
  }
  // guance
  for (const sx of [-1, 1]) o += `<ellipse cx="${cx + sx * 96}" cy="${cy + 52}" rx="30" ry="18" fill="#ff8fa8" opacity=".42"/>`;
  // muso e naso
  if (p.id === 'pig') {
    o += `<ellipse cx="${cx}" cy="${cy - 18}" rx="56" ry="40" fill="url(#${gs})" stroke="${shade(p.nose, -0.3)}" stroke-width="5"/>
      <ellipse cx="${cx - 18}" cy="${cy - 16}" rx="9" ry="14" fill="${shade(p.nose, -0.45)}"/><ellipse cx="${cx + 18}" cy="${cy - 16}" rx="9" ry="14" fill="${shade(p.nose, -0.45)}"/>
      ${shine(cx - 26, cy - 40, 14, 7, -15, 0.7)}`;
  } else {
    const sr = p.id === 'cat' || p.id === 'bunny' ? [52, 38] : [72, 50];
    o += `<ellipse cx="${cx}" cy="${cy + 40}" rx="${sr[0]}" ry="${sr[1]}" fill="url(#${gs})" opacity="${p.id === 'panda' || p.id === 'bunny' ? 0.8 : 1}"/>`;
    const nw = p.id === 'cat' || p.id === 'bunny' ? 14 : 24;
    o += `<path d="M${cx - nw} ${cy + 12} Q${cx} ${cy + 2} ${cx + nw} ${cy + 12} Q${cx + nw * 0.8} ${cy + 30} ${cx} ${cy + 36} Q${cx - nw * 0.8} ${cy + 30} ${cx - nw} ${cy + 12} Z" fill="url(#${gn})" stroke="${shade(p.nose, -0.4)}" stroke-width="3"/>
      ${shine(cx - nw * 0.35, cy + 12, nw * 0.35, 4, -10, 0.85)}`;
    if (p.id === 'cat' || p.id === 'fox' || p.id === 'bunny') {
      for (const sx of [-1, 1]) {
        o += `<path d="M${cx + sx * 46} ${cy + 36} L${cx + sx * 112} ${cy + 26} M${cx + sx * 46} ${cy + 48} L${cx + sx * 114} ${cy + 54}" stroke="${shade(face, -0.5)}" stroke-width="3" stroke-linecap="round" opacity=".55"/>`;
      }
    }
  }
  o += earsSvg(p, s, true);
  o += shine(cx - 70, cy - 78, 34, 16, -30, 0.55);
  return svgDoc(HEAD.w, HEAD.h, o);
}

function pawSvg(p: Pet): string {
  const s = skinOf(p);
  const g = uid('cp');
  return svgDoc(120, 90, `<defs>${B(g, s.leg, 0.45)}</defs>
    <ellipse cx="60" cy="48" rx="50" ry="34" fill="url(#${g})" stroke="${s.legLine}" stroke-width="5"/>
    <path d="M44 58 L44 76 M60 60 L60 80 M76 58 L76 76" stroke="${s.legLine}" stroke-width="4" stroke-linecap="round" opacity=".6"/>
    ${shine(44, 34, 14, 7, -20, 0.6)}`);
}

/** Coda: base in (30, 170) del riquadro 200×200 (origine 0.15, 0.85), punta in alto a destra. */
function tailSvg(p: Pet): string {
  const s = skinOf(p);
  const g = uid('ct');
  let o = `<defs>${B(g, s.fur, 0.45)}</defs>`;
  const stroke = (d: string, w: number, col = s.fur) =>
    `<path d="${d}" stroke="${s.line}" stroke-width="${w + 10}" fill="none" stroke-linecap="round"/><path d="${d}" stroke="${col}" stroke-width="${w}" fill="none" stroke-linecap="round"/>
     <path d="${d}" stroke="${s.light}" stroke-width="${w * 0.3}" fill="none" stroke-linecap="round" transform="translate(-4 -3)" opacity=".7"/>`;
  switch (p.tail) {
    case 'wag': o += stroke('M30 170 Q120 170 140 70', 30); break;
    case 'cat': o += stroke('M30 170 C140 176 110 70 160 36', 26) + `<path d="M150 52 Q160 30 168 34" stroke="${s.accent}" stroke-width="22" stroke-linecap="round" fill="none"/>`; break;
    case 'puff': o += `<circle cx="56" cy="148" r="44" fill="url(#${g})" stroke="${s.line}" stroke-width="5"/>${shine(42, 130, 14, 8)}`; break;
    case 'stub': o += `<circle cx="48" cy="152" r="30" fill="${p.id === 'panda' ? s.accent : `url(#${g})`}" stroke="${p.id === 'panda' ? s.accentLine : s.line}" stroke-width="5"/>`; break;
    case 'bushy':
      o += `<path d="M30 170 C70 196 170 150 176 70 C180 30 140 18 120 40 C120 110 80 140 30 150 Z" fill="url(#${g})" stroke="${s.line}" stroke-width="5" stroke-linejoin="round"/>
        <path d="M176 70 C180 30 140 18 120 40 C124 60 120 80 114 96 C140 100 170 92 176 70 Z" fill="#fff6ea" stroke="${s.line}" stroke-width="4"/>`;
      break;
    case 'curl':
      o += `<path d="M30 168 Q70 170 82 140 Q92 110 66 108 Q44 110 52 130 Q60 146 82 136" stroke="${s.line}" stroke-width="18" fill="none" stroke-linecap="round"/>
        <path d="M30 168 Q70 170 82 140 Q92 110 66 108 Q44 110 52 130 Q60 146 82 136" stroke="${s.fur}" stroke-width="10" fill="none" stroke-linecap="round"/>`;
      break;
    case 'fluff':
      for (const [x, y, r] of [[50, 152, 30], [74, 128, 28], [44, 124, 24]]) o += `<circle cx="${x}" cy="${y}" r="${r}" fill="url(#${g})" stroke="${s.line}" stroke-width="4"/>`;
      break;
  }
  return svgDoc(200, 200, o);
}

// =====================================================================
// Occhi, bocche (comuni a tutti i cuccioli)
// =====================================================================

function faceTextures(): SvgTex[] {
  const ge = uid('ey'), INK = '#2b1d26';
  return [
    { key: 'cu_eye', w: 60, h: 72, svg: svgDoc(60, 72, `<defs><radialGradient id="${ge}" cx=".4" cy=".35" r=".7"><stop offset="0" stop-color="#5a4466"/><stop offset="1" stop-color="${INK}"/></radialGradient></defs>
      <ellipse cx="30" cy="38" rx="22" ry="28" fill="url(#${ge})"/><ellipse cx="22" cy="26" rx="8" ry="10" fill="#fff"/><circle cx="37" cy="48" r="4.5" fill="#fff" opacity=".85"/>`) },
    { key: 'cu_eye_closed', w: 60, h: 40, svg: svgDoc(60, 40, `<path d="M8 12 Q30 34 52 12" stroke="${INK}" stroke-width="7" fill="none" stroke-linecap="round"/>`) },
    { key: 'cu_eye_happy', w: 60, h: 40, svg: svgDoc(60, 40, `<path d="M8 30 Q30 4 52 30" stroke="${INK}" stroke-width="7" fill="none" stroke-linecap="round"/>`) },
    { key: 'cu_eye_sleepy', w: 60, h: 72, svg: svgDoc(60, 72, `<path d="M8 40 Q30 34 52 40 Q50 64 30 64 Q10 64 8 40 Z" fill="${INK}"/><ellipse cx="22" cy="48" rx="5" ry="4" fill="#fff"/>
      <path d="M10 40 Q30 34 50 40" stroke="${INK}" stroke-width="4" fill="none" stroke-linecap="round"/>`) },
    { key: 'cu_mouth_smile', w: 90, h: 50, svg: svgDoc(90, 50, `<path d="M14 14 Q28 36 45 18 Q62 36 76 14" stroke="${INK}" stroke-width="6" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`) },
    { key: 'cu_mouth_open', w: 90, h: 70, svg: svgDoc(90, 70, `<path d="M12 12 Q45 22 78 12 Q76 60 45 62 Q14 60 12 12 Z" fill="#7a2a3a" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/>
      <path d="M26 46 Q45 34 64 46 Q60 60 45 60 Q30 60 26 46 Z" fill="#ff7f98"/>`) },
    { key: 'cu_mouth_o', w: 60, h: 64, svg: svgDoc(60, 64, `<ellipse cx="30" cy="32" rx="20" ry="25" fill="#7a2a3a" stroke="${INK}" stroke-width="5"/><ellipse cx="30" cy="46" rx="11" ry="7" fill="#ff7f98"/>`) },
    { key: 'cu_mouth_wavy', w: 90, h: 40, svg: svgDoc(90, 40, `<path d="M14 20 Q22 12 30 20 Q38 28 46 20 Q54 12 62 20 Q70 28 76 20" stroke="${INK}" stroke-width="5" fill="none" stroke-linecap="round"/>`) },
  ];
}

// =====================================================================
// Guai sul cucciolo e cure
// =====================================================================

function ailmentTextures(): SvgTex[] {
  const out: SvgTex[] = [];
  { // fango sulla zampetta
    const g = uid('md'), r = rng(5);
    let o = `<defs>${B(g, '#8a5a32', 0.3)}</defs>`;
    for (let i = 0; i < 7; i++) {
      const x = 30 + r() * 80, y = 30 + r() * 46, rr = 14 + r() * 16;
      o += `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(rr)}" ry="${f(rr * 0.8)}" fill="url(#${g})"/>`;
    }
    o += `<circle cx="18" cy="70" r="9" fill="#8a5a32"/><circle cx="126" cy="40" r="8" fill="#8a5a32"/><circle cx="130" cy="78" r="6" fill="#8a5a32"/>${shine(52, 40, 10, 5, -20, 0.6)}${shine(90, 56, 7, 4, -20, 0.5)}`;
    out.push({ key: 'cu_mud', w: 144, h: 100, svg: svgDoc(144, 100, o) });
  }
  { // spina (piccola, verde-marrone, che spunta in alto)
    const g = uid('th');
    out.push({ key: 'cu_thorn', w: 70, h: 90, svg: svgDoc(70, 90, `<defs>${lightGrad(g, '#b9d77a', '#7a9a3a', '#4a6420')}</defs>
      <path d="M26 86 L35 6 L46 86 Z" fill="url(#${g})" stroke="#3e5418" stroke-width="3" stroke-linejoin="round"/>${shine(32, 50, 3, 14, 0, 0.6)}`) });
  }
  out.push({ key: 'cu_ouch', w: 80, h: 60, svg: svgDoc(80, 60, `<defs><radialGradient id="ou"><stop offset="0" stop-color="#ffd0dc"/><stop offset=".6" stop-color="#ff9db5" stop-opacity=".8"/><stop offset="1" stop-color="#ff9db5" stop-opacity="0"/></radialGradient></defs>
    <ellipse cx="40" cy="30" rx="36" ry="26" fill="url(#ou)"/>`) });
  out.push({ key: 'cu_plaster', w: 130, h: 64, svg: plasterSvg(130, 64) });
  { // sciarpa al collo (davanti) con il lembo che scende
    const g = uid('sc');
    const stripes = [0, 1, 2, 3, 4, 5, 6].map((i) => `<rect x="${20 + i * 34}" y="0" width="16" height="150" fill="#fff6e4" opacity=".9"/>`).join('');
    out.push({ key: 'cu_scarf', w: 280, h: 170, svg: svgDoc(280, 170, `<defs>${lightGrad(g, '#ff8a8d', '#ff5a5f', '#c8343a', true)}
      <clipPath id="${g}c"><path d="M18 30 Q140 76 262 30 L258 70 Q140 116 22 70 Z M160 70 L200 70 L214 160 L170 164 Z"/></clipPath></defs>
      <path d="M18 30 Q140 76 262 30 L258 70 Q140 116 22 70 Z M160 70 L200 70 L214 160 L170 164 Z" fill="url(#${g})" stroke="#a82a30" stroke-width="5" stroke-linejoin="round"/>
      <g clip-path="url(#${g}c)">${stripes}</g>
      <path d="M172 164 L170 172 M184 164 L183 172 M196 162 L196 170 M208 161 L209 169" stroke="#c8343a" stroke-width="5" stroke-linecap="round"/>
      ${shine(80, 54, 30, 6, 12, 0.55)}`) });
  }
  out.push({ key: 'cu_blanket', w: 440, h: 270, svg: blanketSvg(440, 270) });
  { // fazzoletto sul naso
    const g = uid('ts');
    out.push({ key: 'cu_tissue', w: 150, h: 120, svg: svgDoc(150, 120, `<defs>${lightGrad(g, '#ffffff', '#f4f8ff', '#cfdcee')}</defs>
      <path d="M14 40 Q30 6 74 14 Q120 4 138 40 Q150 76 120 104 Q78 120 32 104 Q2 80 14 40 Z" fill="url(#${g})" stroke="#a9bcd6" stroke-width="4" stroke-linejoin="round"/>
      <path d="M44 30 Q60 50 50 80 M100 28 Q88 56 104 86" stroke="#c6d4e8" stroke-width="4" fill="none" stroke-linecap="round"/>`) });
  }
  out.push({ key: 'cu_rednose', w: 90, h: 70, svg: svgDoc(90, 70, `<defs><radialGradient id="rn"><stop offset="0" stop-color="#ff5a6a" stop-opacity=".9"/><stop offset="1" stop-color="#ff5a6a" stop-opacity="0"/></radialGradient></defs>
    <ellipse cx="45" cy="35" rx="44" ry="34" fill="url(#rn)"/>`) });
  { // fiocco di neve
    let o = '';
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI) / 3, x = 24 + Math.cos(a) * 20, y = 24 + Math.sin(a) * 20;
      const bx = 24 + Math.cos(a) * 12, by = 24 + Math.sin(a) * 12;
      o += `<path d="M24 24 L${f(x)} ${f(y)} M${f(bx)} ${f(by)} L${f(bx + Math.cos(a + 0.9) * 7)} ${f(by + Math.sin(a + 0.9) * 7)} M${f(bx)} ${f(by)} L${f(bx + Math.cos(a - 0.9) * 7)} ${f(by + Math.sin(a - 0.9) * 7)}"/>`;
    }
    out.push({ key: 'cu_snow', w: 48, h: 48, svg: svgDoc(48, 48, `<g stroke="#4aa6e0" stroke-width="6" stroke-linecap="round">${o}</g><g stroke="#ffffff" stroke-width="2.5" stroke-linecap="round">${o}</g>`) });
  }
  out.push({ key: 'cu_bubble', w: 56, h: 56, svg: svgDoc(56, 56, `<defs><radialGradient id="bu" cx=".5" cy=".5" r=".5"><stop offset=".7" stop-color="#ffffff" stop-opacity=".08"/><stop offset=".92" stop-color="#bfe9ff" stop-opacity=".7"/><stop offset="1" stop-color="#ffc8f0" stop-opacity=".8"/></radialGradient></defs>
    <circle cx="28" cy="28" r="26" fill="url(#bu)"/><ellipse cx="19" cy="17" rx="8" ry="5" transform="rotate(-35 19 17)" fill="#fff" opacity=".9"/>`) });
  out.push({ key: 'cu_zzz', w: 64, h: 64, svg: svgDoc(64, 64, `<path d="M12 12 H52 L16 52 H54" stroke="#6a4fc4" stroke-width="16" fill="none" stroke-linejoin="round" stroke-linecap="round"/>
    <path d="M12 12 H52 L16 52 H54" stroke="#d9cbff" stroke-width="8" fill="none" stroke-linejoin="round" stroke-linecap="round"/>`) });
  { // fumetto del pensiero (dentro si mette il biberon)
    const g = uid('tb');
    out.push({ key: 'cu_thought', w: 220, h: 190, svg: svgDoc(220, 190, `<defs>${lightGrad(g, '#ffffff', '#ffffff', '#e4eef5', true)}${blur(g + 'b', 4)}</defs>
      <ellipse cx="116" cy="82" rx="94" ry="70" fill="#1d2440" opacity=".14" filter="url(#${g}b)"/>
      <g fill="url(#${g})" stroke="#b8cbd8" stroke-width="4"><circle cx="70" cy="70" r="46"/><circle cx="130" cy="56" r="52"/><circle cx="170" cy="94" r="38"/><circle cx="110" cy="108" r="44"/><circle cx="60" cy="112" r="32"/></g>
      <g fill="url(#${g})"><ellipse cx="112" cy="84" rx="80" ry="48"/></g>
      <circle cx="34" cy="160" r="14" fill="#fff" stroke="#b8cbd8" stroke-width="4"/><circle cx="16" cy="182" r="7" fill="#fff" stroke="#b8cbd8" stroke-width="3"/>`) });
  }
  { // impronta di zampa (particelle della festa)
    const g = uid('pp');
    out.push({ key: 'cu_pawprint', w: 64, h: 64, svg: svgDoc(64, 64, `<defs>${ballGrad(g, '#ffffff', '#f0f0f0', '#cfcfcf')}</defs>
      <ellipse cx="32" cy="42" rx="16" ry="13" fill="url(#${g})"/><circle cx="14" cy="26" r="7" fill="url(#${g})"/><circle cx="26" cy="15" r="7" fill="url(#${g})"/>
      <circle cx="39" cy="15" r="7" fill="url(#${g})"/><circle cx="51" cy="26" r="7" fill="url(#${g})"/>`) });
  }
  return out;
}

function plasterSvg(w: number, h: number): string {
  const g = uid('pl');
  const dots = [0, 1, 2].flatMap((i) => [0, 1].map((j) => `<circle cx="${f(w * 0.39 + i * w * 0.11)}" cy="${f(h * 0.36 + j * h * 0.28)}" r="2.6" fill="#ffffff" opacity=".7"/>`)).join('');
  return svgDoc(w, h, `<defs>${lightGrad(g, '#a7f0dc', TEAL, TEAL_DARK, true)}</defs>
    <rect x="3" y="5" width="${w - 6}" height="${h - 10}" rx="${(h - 10) / 2}" fill="url(#${g})" stroke="${TEAL_DARK}" stroke-width="4"/>
    <rect x="${w * 0.32}" y="${h * 0.18}" width="${w * 0.36}" height="${h * 0.64}" rx="8" fill="${CREAM}" stroke="#e0cfa8" stroke-width="2"/>
    ${dots}
    <path d="${starPath(w * 0.15, h * 0.5, h * 0.2)}" fill="#ffe066"/><path d="${starPath(w * 0.85, h * 0.5, h * 0.2)}" fill="#ffb3d9"/>
    ${shine(w * 0.2, h * 0.26, w * 0.08, h * 0.06, -8, 0.6)}`);
}

function blanketSvg(w: number, h: number): string {
  const g = uid('bk');
  let checks = '';
  for (let x = 0; x < w; x += 44) checks += `<rect x="${x}" y="0" width="22" height="${h}" fill="#ffffff" opacity=".28"/>`;
  for (let y = 0; y < h; y += 44) checks += `<rect x="0" y="${y}" width="${w}" height="22" fill="#ffffff" opacity=".22"/>`;
  const d = `M${w * 0.1} 34 Q${w / 2} 4 ${w * 0.9} 34 Q${w - 6} ${h * 0.6} ${w - 14} ${h - 20} Q${w / 2} ${h + 4} 14 ${h - 20} Q6 ${h * 0.6} ${w * 0.1} 34 Z`;
  return svgDoc(w, h, `<defs>${lightGrad(g, '#d9c8ff', '#a98cf0', '#6f55c0')}<clipPath id="${g}c"><path d="${d}"/></clipPath></defs>
    <path d="${d}" fill="url(#${g})" stroke="#5a44a8" stroke-width="5" stroke-linejoin="round"/>
    <g clip-path="url(#${g}c)">${checks}</g>
    <path d="M${w * 0.1} 34 Q${w / 2} 4 ${w * 0.9} 34 Q${w / 2} 62 ${w * 0.1} 34 Z" fill="#fff3a8" stroke="#d6b84a" stroke-width="4"/>
    <path d="M${w * 0.3} ${h - 14} Q${w * 0.34} ${h * 0.5} ${w * 0.3} 60 M${w * 0.7} ${h - 14} Q${w * 0.66} ${h * 0.5} ${w * 0.7} 60" stroke="#5a44a8" stroke-width="4" fill="none" opacity=".35"/>`);
}

// =====================================================================
// Strumenti del dottore (vassoio) — circa 180×180
// =====================================================================

function toolSvg(id: ToolId): SvgTex {
  const W = 190, H = 190;
  const g = uid('tl'), g2 = uid('tl2'), sh = uid('tls');
  const shadow = `<defs>${blur(sh, 5)}</defs><ellipse cx="95" cy="174" rx="64" ry="10" fill="#1d2440" opacity=".22" filter="url(#${sh})"/>`;
  let o = shadow;
  switch (id) {
    case 'sponge':
      o += `<defs>${lightGrad(g, '#fff4a0', '#ffd23f', '#e0a400')}</defs>
        <path d="M30 70 Q30 52 48 52 H146 Q162 52 162 70 V140 Q162 158 146 158 H48 Q30 158 30 140 Z" fill="#d49400" stroke="#a87400" stroke-width="5"/>
        <path d="M30 62 Q30 44 48 44 H146 Q162 44 162 62 V126 Q162 144 146 144 H48 Q30 144 30 126 Z" fill="url(#${g})" stroke="#a87400" stroke-width="5"/>
        ${[[60, 70, 9], [100, 64, 7], [134, 84, 10], [76, 112, 8], [120, 120, 7], [52, 100, 5]].map(([x, y, r]) => `<ellipse cx="${x}" cy="${y}" rx="${r}" ry="${r * 0.8}" fill="#e0a400" opacity=".75"/>`).join('')}
        <circle cx="70" cy="36" r="16" fill="#e8f7ff" stroke="#9fd8f5" stroke-width="3" opacity=".9"/><circle cx="96" cy="26" r="11" fill="#e8f7ff" stroke="#9fd8f5" stroke-width="3" opacity=".9"/>
        <circle cx="118" cy="38" r="8" fill="#e8f7ff" stroke="#9fd8f5" stroke-width="3" opacity=".9"/>${shine(64, 32, 5, 3)}${shine(52, 58, 22, 6, -6, 0.5)}`;
      break;
    case 'tweezers':
      o += `<defs>${lightGrad(g, '#ffffff', '#cfd8e6', '#8a96aa')}${lightGrad(g2, '#a7f0dc', TEAL, TEAL_DARK)}</defs>
        <path d="M84 18 Q95 10 106 18 L120 150 Q118 162 110 158 L95 60 L80 158 Q72 162 70 150 Z" fill="url(#${g})" stroke="#6a7488" stroke-width="5" stroke-linejoin="round"/>
        <path d="M78 60 L74 104 Q80 110 86 104 L88 62 Z M112 60 L116 104 Q110 110 104 104 L102 62 Z" fill="url(#${g2})" stroke="${TEAL_DARK}" stroke-width="3"/>
        ${shine(90, 30, 4, 10, -10, 0.9)}`;
      break;
    case 'plaster':
      o += `<g transform="rotate(-18 95 95)"><g transform="translate(18 64)">${plasterSvg(154, 70).replace(/^<svg[^>]*>|<\/svg>$/g, '')}</g></g>`;
      break;
    case 'bottle':
      o += `<defs>${lightGrad(g, '#ffffff', '#f6fbff', '#d6e6f2')}${lightGrad(g2, '#a7f0dc', TEAL, TEAL_DARK, true)}</defs>
        <path d="M84 28 Q95 6 106 28 L108 44 H82 Z" fill="#ffd9b8" stroke="#d9a07a" stroke-width="4" stroke-linejoin="round"/>
        <rect x="68" y="42" width="54" height="22" rx="8" fill="url(#${g2})" stroke="${TEAL_DARK}" stroke-width="4"/>
        <path d="M70 64 H120 L126 148 Q126 164 110 164 H80 Q64 164 64 148 Z" fill="url(#${g})" stroke="#9fb4c6" stroke-width="5" stroke-linejoin="round"/>
        <path d="M68 100 H122 L125 148 Q125 160 110 160 H80 Q66 160 66 148 Z" fill="#ffffff" stroke="#e6eef5" stroke-width="2"/>
        <path d="M110 84 H118 M110 104 H120 M110 124 H121" stroke="#9fb4c6" stroke-width="3" stroke-linecap="round"/>
        ${shine(80, 96, 5, 24, -4, 0.8)}`;
      break;
    case 'blanket':
      o += `<g transform="translate(14 54) scale(.37)">${blanketFold()}</g>`;
      break;
    case 'tissue':
      o += `<defs>${lightGrad(g, '#a7f0dc', TEAL, TEAL_DARK)}${lightGrad(g2, '#ffffff', '#f4f8ff', '#cfdcee')}</defs>
        <path d="M34 92 L156 92 L150 160 Q150 166 144 166 H46 Q40 166 40 160 Z" fill="url(#${g})" stroke="${TEAL_DARK}" stroke-width="5" stroke-linejoin="round"/>
        <path d="M34 92 L52 76 H138 L156 92 Z" fill="#7ddcc3" stroke="${TEAL_DARK}" stroke-width="5" stroke-linejoin="round"/>
        <ellipse cx="95" cy="86" rx="30" ry="7" fill="#1c6a58"/>
        <path d="M70 88 Q60 40 84 26 Q96 50 100 30 Q120 20 128 44 Q122 70 118 88 Z" fill="url(#${g2})" stroke="#a9bcd6" stroke-width="4" stroke-linejoin="round"/>
        <path d="${starPath(70, 128, 14)}" fill="#ffe066"/><path d="${starPath(120, 128, 14)}" fill="#ffffff" opacity=".8"/>`;
      break;
    case 'scarf':
      o += `<defs>${lightGrad(g, '#ff8a8d', '#ff5a5f', '#c8343a', true)}</defs>
        <ellipse cx="88" cy="104" rx="60" ry="46" fill="url(#${g})" stroke="#a82a30" stroke-width="5"/>
        <ellipse cx="88" cy="104" rx="38" ry="28" fill="none" stroke="#fff6e4" stroke-width="10" opacity=".9"/>
        <ellipse cx="88" cy="104" rx="16" ry="11" fill="#c8343a" stroke="#a82a30" stroke-width="4"/>
        <path d="M130 120 L160 136 L150 168 L124 150 Z" fill="url(#${g})" stroke="#a82a30" stroke-width="5" stroke-linejoin="round"/>
        <path d="M140 132 L134 158" stroke="#fff6e4" stroke-width="7"/>
        <path d="M150 168 L148 178 M140 163 L136 173 M130 156 L125 165" stroke="#c8343a" stroke-width="5" stroke-linecap="round"/>
        ${shine(60, 78, 18, 8, -25, 0.6)}`;
      break;
  }
  return { key: `cu_tool_${id}`, w: W, h: H, svg: svgDoc(W, H, o) };
}

/** Copertina piegata (icona dello strumento), disegnata in 440×300. */
function blanketFold(): string {
  const g = uid('bf');
  let checks = '';
  for (let x = 20; x < 420; x += 44) checks += `<rect x="${x}" y="40" width="22" height="240" fill="#ffffff" opacity=".28"/>`;
  return `<defs>${lightGrad(g, '#d9c8ff', '#a98cf0', '#6f55c0')}<clipPath id="${g}c"><rect x="20" y="40" width="400" height="230" rx="40"/></clipPath></defs>
    <rect x="20" y="150" width="400" height="120" rx="40" fill="#5a44a8"/>
    <rect x="20" y="40" width="400" height="200" rx="40" fill="url(#${g})" stroke="#5a44a8" stroke-width="12"/>
    <g clip-path="url(#${g}c)">${checks}</g>
    <path d="M20 150 H420" stroke="#5a44a8" stroke-width="10" opacity=".6"/>
    <rect x="20" y="40" width="400" height="34" rx="17" fill="#fff3a8" stroke="#d6b84a" stroke-width="8"/>
    <ellipse cx="110" cy="96" rx="70" ry="18" fill="#fff" opacity=".35"/>`;
}

// =====================================================================
// Ambulatorio (sfondo a piani)
// =====================================================================

function clinicTextures(): SvgTex[] {
  const out: SvgTex[] = [];
  { // vista del giardino dalla finestra (piano lontano)
    const gs = uid('ws'), gh = uid('wh'), gt = uid('wt'), fog = uid('wf');
    let trees = '';
    for (const [x, y, r] of [[120, 250, 56], [210, 262, 44], [470, 246, 60], [560, 258, 46]]) {
      trees += `<rect x="${x - 7}" y="${y}" width="14" height="60" fill="#8a6a4a"/><circle cx="${x}" cy="${y - 10}" r="${r}" fill="url(#${gt})"/>`;
    }
    out.push({ key: 'cu_view', w: 660, h: 440, svg: svgDoc(660, 440, `<defs>${lightGrad(gs, '#bfe8ff', '#8fd3ff', '#8fd3ff', true)}${lightGrad(gh, '#c6efb0', '#8fd47a', '#5fae52', true)}${B(gt, '#6fc45f', 0.4)}
      <linearGradient id="${fog}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff" stop-opacity=".0"/><stop offset=".6" stop-color="#e8f6ff" stop-opacity=".45"/><stop offset="1" stop-color="#ffffff" stop-opacity=".1"/></linearGradient></defs>
      <rect width="660" height="440" fill="url(#${gs})"/>
      <circle cx="520" cy="90" r="46" fill="#fff3a0"/><circle cx="520" cy="90" r="70" fill="#fff3a0" opacity=".3"/>
      <g fill="#ffffff" opacity=".9"><ellipse cx="150" cy="96" rx="60" ry="22"/><ellipse cx="190" cy="82" rx="40" ry="24"/></g>
      <path d="M0 270 Q160 200 330 250 Q480 290 660 220 V440 H0 Z" fill="#a8dca0"/>
      ${trees}
      <path d="M0 320 Q200 280 400 316 Q540 340 660 300 V440 H0 Z" fill="url(#${gh})"/>
      ${[...Array(14)].map((_, i) => `<circle cx="${20 + i * 47}" cy="${352 + (i % 3) * 22}" r="7" fill="${['#ff8fb0', '#fff36a', '#ffffff'][i % 3]}"/>`).join('')}
      <rect width="660" height="440" fill="url(#${fog})"/>`) });
  }
  { // cornice della finestra con davanzale (piano del muro)
    const gf = uid('wf'), gl = uid('wg');
    out.push({ key: 'cu_window', w: 740, h: 540, svg: svgDoc(740, 540, `<defs>${lightGrad(gf, '#ffffff', '#f7fbfa', '#d2e6e0')}${lightGrad(gl, '#ffffff', '#ffffff', '#ffffff')}</defs>
      <path d="M40 30 H700 V490 H40 Z M80 70 V450 H660 V70 Z" fill="url(#${gf})" fill-rule="evenodd" stroke="#a9cfc5" stroke-width="5"/>
      <rect x="80" y="70" width="580" height="380" fill="none" stroke="#c7e2db" stroke-width="10"/>
      <rect x="362" y="70" width="16" height="380" fill="url(#${gf})" stroke="#a9cfc5" stroke-width="3"/>
      <path d="M100 90 L180 90 L110 180 Z M392 90 L460 90 L400 170 Z" fill="#ffffff" opacity=".35"/>
      <path d="M20 486 H720 Q730 486 728 498 L720 520 H20 L12 498 Q10 486 20 486 Z" fill="#e9f4f1" stroke="#a9cfc5" stroke-width="5"/>
      <rect x="22" y="514" width="696" height="12" rx="6" fill="#1d2440" opacity=".12"/>`) });
  }
  { // tenda (a sinistra; a destra si capovolge)
    const g = uid('ct');
    let stripes = '';
    for (let x = 18; x < 200; x += 40) stripes += `<path d="M${x} 0 Q${x + 8} 300 ${x - 6} 600" stroke="${TEAL}" stroke-width="12" fill="none" opacity=".55"/>`;
    out.push({ key: 'cu_curtain', w: 200, h: 620, svg: svgDoc(200, 620, `<defs>${lightGrad(g, '#ffffff', CREAM, '#ead8b4')}<clipPath id="${g}c"><path d="M0 0 H190 Q160 160 130 300 Q110 380 150 440 Q170 520 120 610 H0 Z"/></clipPath></defs>
      <path d="M0 0 H190 Q160 160 130 300 Q110 380 150 440 Q170 520 120 610 H0 Z" fill="url(#${g})" stroke="#d8c39a" stroke-width="4"/>
      <g clip-path="url(#${g}c)">${stripes}<path d="M40 0 Q60 300 30 610 M100 0 Q100 280 80 610" stroke="#d8c39a" stroke-width="4" fill="none" opacity=".6"/></g>
      <path d="M100 404 Q150 380 172 420 Q150 446 100 430 Z" fill="${TEAL}" stroke="${TEAL_DARK}" stroke-width="4"/>`) });
  }
  { // mensola con barattoli, asciugamani, pianta (piano medio)
    const gw = uid('sh'), gj = uid('sj'), gp = uid('sp'), gt = uid('st'), gl = uid('sl');
    const jar = (x: number, h: number, lid: string, fill: string) => `<rect x="${x}" y="${170 - h}" width="64" height="${h}" rx="12" fill="url(#${gj})" stroke="#a9c3d0" stroke-width="4"/>
      <rect x="${x + 6}" y="${190 - h * 0.6}" width="52" height="${h * 0.6 - 26}" rx="8" fill="${fill}"/>
      <rect x="${x - 4}" y="${158 - h}" width="72" height="20" rx="8" fill="${lid}" stroke="${shade(lid, -0.35)}" stroke-width="3"/>${shine(x + 16, 196 - h, 5, 16, -4, 0.8)}`;
    out.push({ key: 'cu_shelf', w: 560, h: 260, svg: svgDoc(560, 260, `<defs>${lightGrad(gw, '#ffffff', '#f3ece0', '#d6c8ae', true)}${lightGrad(gj, '#ffffff', '#eef7fb', '#d0e2ec')}${lightGrad(gp, '#ffb08a', '#ff7f5a', '#d8573a')}
      ${B(gt, '#7ccf6a', 0.4)}${lightGrad(gl, '#a7f0dc', TEAL, TEAL_DARK, true)}${blur(gw + 'b', 5)}</defs>
      <rect x="20" y="198" width="520" height="22" rx="8" fill="#1d2440" opacity=".18" filter="url(#${gw}b)"/>
      ${jar(40, 110, TEAL, '#ffffff')}${jar(122, 84, '#ffb3d9', '#ffe7a0')}
      <rect x="214" y="122" width="120" height="26" rx="12" fill="url(#${gl})" stroke="${TEAL_DARK}" stroke-width="3"/>
      <rect x="208" y="146" width="132" height="26" rx="12" fill="${CREAM}" stroke="#d8c39a" stroke-width="3"/>
      <rect x="216" y="98" width="116" height="26" rx="12" fill="#ffd6e6" stroke="#e7a1bd" stroke-width="3"/>
      <path d="M384 172 L398 112 H470 L484 172 Z" fill="url(#${gp})" stroke="#b8452c" stroke-width="4"/>
      <circle cx="412" cy="88" r="34" fill="url(#${gt})"/><circle cx="456" cy="80" r="40" fill="url(#${gt})"/><circle cx="436" cy="52" r="30" fill="url(#${gt})"/>
      <rect x="10" y="170" width="540" height="24" rx="10" fill="url(#${gw})" stroke="#c9b893" stroke-width="4"/>
      <path d="M70 194 V230 L100 194 M490 194 V230 L460 194" stroke="#c9b893" stroke-width="10" fill="none" stroke-linejoin="round"/>`) });
  }
  { // quadretto con impronta e cuore (niente scritte, niente croci)
    const g = uid('po'), gh = uid('ph');
    out.push({ key: 'cu_poster', w: 260, h: 320, svg: svgDoc(260, 320, `<defs>${lightGrad(g, '#a7f0dc', TEAL, TEAL_DARK)}${B(gh, '#ff7fa8', 0.5)}${blur(g + 'b', 6)}</defs>
      <rect x="22" y="26" width="226" height="286" rx="20" fill="#1d2440" opacity=".2" filter="url(#${g}b)"/>
      <rect x="10" y="10" width="236" height="290" rx="20" fill="url(#${g})" stroke="${TEAL_DARK}" stroke-width="5"/>
      <rect x="30" y="30" width="196" height="250" rx="12" fill="${CREAM}"/>
      <g transform="translate(64 60) scale(2)"><ellipse cx="32" cy="42" rx="16" ry="13" fill="${TEAL}"/><circle cx="14" cy="26" r="7" fill="${TEAL}"/><circle cx="26" cy="15" r="7" fill="${TEAL}"/><circle cx="39" cy="15" r="7" fill="${TEAL}"/><circle cx="51" cy="26" r="7" fill="${TEAL}"/></g>
      <path d="M128 262 Q84 234 86 208 Q88 190 106 190 Q120 190 128 204 Q136 190 150 190 Q168 190 170 208 Q172 234 128 262 Z" fill="url(#${gh})" stroke="#c4245f" stroke-width="3"/>`) });
  }
  { // lettino da visita: piano imbottito verde acqua, mobile crema con cassetti
    const gt = uid('tt'), gf = uid('tf'), gb = uid('tb'), gk = uid('tk');
    out.push({ key: 'cu_table', w: 1000, h: 330, svg: svgDoc(1000, 330, `<defs>${lightGrad(gt, '#b8f5e4', '#6fd8bc', '#3fb497', true)}${lightGrad(gf, '#4cc3a5', '#33a88b', '#23826b', true)}
      ${lightGrad(gb, '#ffffff', CREAM, '#e6d4b0', true)}${B(gk, '#ffc800', 0.5)}${blur(gt + 'b', 8)}</defs>
      <ellipse cx="500" cy="318" rx="430" ry="16" fill="#1d2440" opacity=".25" filter="url(#${gt}b)"/>
      <rect x="110" y="96" width="780" height="210" rx="16" fill="url(#${gb})" stroke="#c9b893" stroke-width="5"/>
      <rect x="140" y="128" width="340" height="70" rx="14" fill="#fffaf0" stroke="#d8c7a0" stroke-width="4"/><rect x="520" y="128" width="340" height="70" rx="14" fill="#fffaf0" stroke="#d8c7a0" stroke-width="4"/>
      <rect x="140" y="216" width="340" height="70" rx="14" fill="#fffaf0" stroke="#d8c7a0" stroke-width="4"/><rect x="520" y="216" width="340" height="70" rx="14" fill="#fffaf0" stroke="#d8c7a0" stroke-width="4"/>
      ${[[310, 163], [690, 163], [310, 251], [690, 251]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="13" fill="url(#${gk})" stroke="#c49a00" stroke-width="3"/>`).join('')}
      <path d="M40 44 Q40 20 70 20 H930 Q960 20 960 44 V84 Q960 104 936 104 H64 Q40 104 40 84 Z" fill="url(#${gf})" stroke="#1f7a64" stroke-width="5"/>
      <path d="M40 34 Q40 6 74 6 H926 Q960 6 960 34 V56 Q960 78 930 78 H70 Q40 78 40 56 Z" fill="url(#${gt})" stroke="#1f7a64" stroke-width="5"/>
      <path d="M90 22 H560" stroke="#ffffff" stroke-width="9" stroke-linecap="round" opacity=".6"/>
      ${[200, 360, 520, 680, 840].map((x) => `<circle cx="${x}" cy="44" r="6" fill="#2a9a7e" opacity=".5"/>`).join('')}`) });
  }
  { // vassoio degli strumenti (in primo piano)
    const g = uid('ty'), gi = uid('ti');
    out.push({ key: 'cu_tray', w: 1600, h: 220, svg: svgDoc(1600, 220, `<defs>${lightGrad(g, '#a7f0dc', TEAL, TEAL_DARK, true)}${lightGrad(gi, '#ffffff', CREAM, '#efe0bf', true)}${blur(g + 'b', 10)}</defs>
      <rect x="40" y="70" width="1530" height="150" rx="60" fill="#1d2440" opacity=".25" filter="url(#${g}b)"/>
      <rect x="20" y="40" width="1560" height="170" rx="60" fill="${TEAL_DARK}"/>
      <rect x="20" y="20" width="1560" height="170" rx="60" fill="url(#${g})" stroke="#1f7a64" stroke-width="5"/>
      <rect x="54" y="44" width="1492" height="122" rx="44" fill="url(#${gi})" stroke="#e0cfa8" stroke-width="4"/>
      <path d="M110 52 H900" stroke="#ffffff" stroke-width="8" stroke-linecap="round" opacity=".7"/>`) });
  }
  { // lampada a soffitto
    const g = uid('lp');
    out.push({ key: 'cu_lamp', w: 240, h: 340, svg: svgDoc(240, 340, `<defs>${lightGrad(g, '#a7f0dc', TEAL, TEAL_DARK)}</defs>
      <rect x="116" y="0" width="8" height="200" fill="#8aa6a0"/>
      <path d="M40 300 Q40 200 120 196 Q200 200 200 300 Z" fill="url(#${g})" stroke="#1f7a64" stroke-width="5"/>
      <ellipse cx="120" cy="300" rx="80" ry="16" fill="#fff6c8" stroke="#1f7a64" stroke-width="4"/>
      ${shine(86, 236, 18, 30, 20, 0.5)}`) });
  }
  { // pianta in vaso sfocata (primo piano)
    const g = uid('fp'), gp = uid('fv');
    let leaves = '';
    const r = rng(11);
    for (let i = 0; i < 9; i++) {
      const a = -Math.PI / 2 + (i - 4) * 0.33, len = 260 + r() * 140;
      const x2 = 210 + Math.cos(a) * len, y2 = 440 + Math.sin(a) * len;
      leaves += `<path d="M210 440 Q${f((210 + x2) / 2 + 60 * Math.sin(a))} ${f((440 + y2) / 2)} ${f(x2)} ${f(y2)} Q${f((210 + x2) / 2 - 60 * Math.sin(a))} ${f((440 + y2) / 2 + 20)} 210 440 Z" fill="url(#${g})"/>`;
    }
    out.push({ key: 'cu_fg_plant', w: 420, h: 640, svg: svgDoc(420, 640, `<defs>${lightGrad(g, '#9be08a', '#4caa4a', '#2d7a34')}${lightGrad(gp, '#ffffff', CREAM, '#d9c39a')}${blur('fb', 6)}</defs>
      <g filter="url(#fb)">${leaves}<path d="M110 440 H310 L290 630 H130 Z" fill="url(#${gp})" stroke="#c9b893" stroke-width="6"/>
      <rect x="96" y="420" width="228" height="44" rx="16" fill="${TEAL}" stroke="${TEAL_DARK}" stroke-width="6"/></g>`) });
  }
  return out;
}

// =====================================================================
// Giardino della clinica (collezione)
// =====================================================================

function gardenTextures(): SvgTex[] {
  const out: SvgTex[] = [];
  { // colline lontane nella foschia
    const g = uid('gh'), gt = uid('gt');
    let trees = '';
    for (let i = 0; i < 12; i++) trees += `<circle cx="${80 + i * 180 + (i % 2) * 40}" cy="${220 - (i % 3) * 16}" r="${30 + (i % 3) * 8}" fill="url(#${gt})"/>`;
    out.push({ key: 'cu_hills', w: 2200, h: 380, svg: svgDoc(2200, 380, `<defs>${lightGrad(g, '#e2f6da', '#c6e9ba', '#addba0', true)}${B(gt, '#b8e2ac', 0.3)}</defs>
      <path d="M0 220 Q300 120 640 190 Q980 260 1300 160 Q1700 60 2200 200 V380 H0 Z" fill="url(#${g})"/>${trees}
      <path d="M0 220 Q300 120 640 190 Q980 260 1300 160 Q1700 60 2200 200 V380 H0 Z" fill="#eef9ff" opacity=".3"/>`) });
  }
  { // albero tondo
    const g = uid('gtr'), gk = uid('gtk');
    out.push({ key: 'cu_tree', w: 380, h: 520, svg: svgDoc(380, 520, `<defs>${B(g, '#5cbf5a', 0.45)}${lightGrad(gk, '#c49a6c', '#9a6b42', '#6a4428')}${blur(g + 's', 8)}</defs>
      <ellipse cx="190" cy="500" rx="120" ry="16" fill="#1d4020" opacity=".25" filter="url(#${g}s)"/>
      <path d="M172 500 Q176 380 166 300 H214 Q204 380 208 500 Z" fill="url(#${gk})" stroke="#5a3a22" stroke-width="5"/>
      <circle cx="120" cy="230" r="100" fill="url(#${g})"/><circle cx="260" cy="230" r="100" fill="url(#${g})"/><circle cx="190" cy="140" r="120" fill="url(#${g})"/><circle cx="190" cy="280" r="90" fill="url(#${g})"/>
      ${[[130, 200], [240, 160], [210, 280], [110, 280], [280, 260]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="12" fill="#ff7f9a"/>`).join('')}
      ${shine(140, 90, 40, 20, -30, 0.35)}`) });
  }
  { // staccionata
    const g = uid('gf');
    let o = `<defs>${lightGrad(g, '#ffffff', '#f6f2ea', '#d8cfbd')}</defs><rect x="0" y="70" width="640" height="22" rx="8" fill="url(#${g})" stroke="#c4b89e" stroke-width="4"/><rect x="0" y="122" width="640" height="22" rx="8" fill="url(#${g})" stroke="#c4b89e" stroke-width="4"/>`;
    for (let x = 20; x < 640; x += 80) o += `<path d="M${x} 170 V40 L${x + 22} 14 L${x + 44} 40 V170 Z" fill="url(#${g})" stroke="#c4b89e" stroke-width="4" stroke-linejoin="round"/>`;
    out.push({ key: 'cu_fence', w: 640, h: 180, svg: svgDoc(640, 180, o) });
  }
  { // un lato della clinica: muro crema, tetto verde acqua, porta tonda, insegna con impronta e cuore
    const gw = uid('cw'), gr = uid('cr'), gd = uid('cd'), gh = uid('chh');
    out.push({ key: 'cu_clinic', w: 620, h: 640, svg: svgDoc(620, 640, `<defs>${lightGrad(gw, '#ffffff', CREAM, '#e6d4b0')}${lightGrad(gr, '#a7f0dc', TEAL, TEAL_DARK, true)}${lightGrad(gd, '#ffd28a', '#f2a654', '#c27a2c')}${B(gh, '#ff7fa8', 0.5)}${blur(gw + 'b', 10)}</defs>
      <rect x="40" y="610" width="560" height="26" rx="13" fill="#1d4020" opacity=".25" filter="url(#${gw}b)"/>
      <rect x="40" y="200" width="540" height="420" fill="url(#${gw})" stroke="#c9b893" stroke-width="6"/>
      <path d="M0 220 L310 30 L620 220 Z" fill="url(#${gr})" stroke="#1f7a64" stroke-width="6" stroke-linejoin="round"/>
      <path d="M0 220 H620 V250 H0 Z" fill="${TEAL_DARK}"/>
      <circle cx="310" cy="140" r="58" fill="${CREAM}" stroke="#1f7a64" stroke-width="6"/>
      <g transform="translate(278 100) scale(1)"><ellipse cx="32" cy="42" rx="16" ry="13" fill="${TEAL}"/><circle cx="14" cy="26" r="7" fill="${TEAL}"/><circle cx="26" cy="15" r="7" fill="${TEAL}"/><circle cx="39" cy="15" r="7" fill="${TEAL}"/><circle cx="51" cy="26" r="7" fill="${TEAL}"/></g>
      <path d="M310 186 Q292 174 293 164 Q294 156 302 156 Q308 156 310 162 Q312 156 318 156 Q326 156 327 164 Q328 174 310 186 Z" fill="url(#${gh})"/>
      <path d="M230 620 V420 Q230 340 310 340 Q390 340 390 420 V620 Z" fill="url(#${gd})" stroke="#9a5a1c" stroke-width="6"/>
      <circle cx="310" cy="420" r="34" fill="#bfe8ff" stroke="#9a5a1c" stroke-width="5"/><circle cx="364" cy="520" r="10" fill="#ffc800" stroke="#c49a00" stroke-width="3"/>
      ${[100, 470].map((x) => `<rect x="${x}" y="320" width="110" height="120" rx="10" fill="#bfe8ff" stroke="#c9b893" stroke-width="6"/><path d="M${x + 55} 320 V440" stroke="#ffffff" stroke-width="6"/>
        <rect x="${x - 10}" y="440" width="130" height="34" rx="10" fill="${TEAL}" stroke="${TEAL_DARK}" stroke-width="4"/>
        ${[0, 1, 2, 3].map((k) => `<circle cx="${x + 10 + k * 30}" cy="436" r="12" fill="${['#ff8fb0', '#fff36a', '#ffffff', '#ff8fb0'][k]}"/>`).join('')}`).join('')}`) });
  }
  { // fiori (tre colori) e cespuglio
    const flower = (key: string, petal: string) => {
      const g = uid('fl');
      let p = '';
      for (let i = 0; i < 5; i++) {
        const a = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
        p += `<ellipse cx="${f(30 + Math.cos(a) * 14)}" cy="${f(28 + Math.sin(a) * 14)}" rx="11" ry="11" fill="url(#${g})"/>`;
      }
      return { key, w: 60, h: 90, svg: svgDoc(60, 90, `<defs>${B(g, petal, 0.5)}</defs><path d="M30 40 Q34 64 30 88" stroke="#4caa4a" stroke-width="5" fill="none"/>
        <ellipse cx="40" cy="66" rx="10" ry="5" fill="#5cbf5a" transform="rotate(-30 40 66)"/>${p}<circle cx="30" cy="28" r="8" fill="#ffd23f" stroke="#e0a400" stroke-width="2"/>`) };
    };
    out.push(flower('cu_flower_a', '#ff8fb0'), flower('cu_flower_b', '#ffffff'), flower('cu_flower_c', '#b58cf0'));
    const g = uid('bs');
    out.push({ key: 'cu_bush', w: 320, h: 180, svg: svgDoc(320, 180, `<defs>${B(g, '#5cbf5a', 0.4)}</defs>
      <circle cx="80" cy="110" r="66" fill="url(#${g})"/><circle cx="170" cy="86" r="80" fill="url(#${g})"/><circle cx="250" cy="116" r="60" fill="url(#${g})"/><rect x="40" y="120" width="250" height="56" rx="28" fill="url(#${g})"/>`) });
  }
  { // cuccia vuota (posto per un cucciolo da conoscere)
    const g = uid('cs'), gi = uid('csi');
    out.push({ key: 'cu_cushion', w: 260, h: 140, svg: svgDoc(260, 140, `<defs>${lightGrad(g, '#a7f0dc', TEAL, TEAL_DARK, true)}${ballGrad(gi, '#ffffff', CREAM, '#e6d4b0')}${blur(g + 'b', 6)}</defs>
      <ellipse cx="130" cy="122" rx="116" ry="16" fill="#1d4020" opacity=".25" filter="url(#${g}b)"/>
      <ellipse cx="130" cy="84" rx="122" ry="50" fill="url(#${g})" stroke="#1f7a64" stroke-width="5"/>
      <ellipse cx="130" cy="78" rx="88" ry="30" fill="url(#${gi})" stroke="#d8c39a" stroke-width="4"/>
      <ellipse cx="96" cy="64" rx="30" ry="8" fill="#fff" opacity=".6"/>`) });
  }
  { // palla a spicchi
    const g = uid('bl');
    out.push({ key: 'cu_ball', w: 110, h: 110, svg: svgDoc(110, 110, `<defs>${ballGrad(g, '#ffffff', '#ffffff', '#d8dfe8')}<clipPath id="${g}c"><circle cx="55" cy="55" r="48"/></clipPath></defs>
      <circle cx="55" cy="55" r="48" fill="url(#${g})" stroke="#9aa8ba" stroke-width="4"/>
      <g clip-path="url(#${g}c)" opacity=".9"><path d="M55 0 Q20 55 55 110 L30 110 Q0 55 30 0 Z" fill="#ff5a5f"/><path d="M55 0 Q90 55 55 110 L80 110 Q110 55 80 0 Z" fill="#36a9f0"/></g>
      <circle cx="55" cy="55" r="48" fill="url(#${g})" opacity=".35"/>${shine(38, 32, 14, 8, -30, 0.85)}`) });
  }
  { // erba alta sfocata (primo piano)
    const g = uid('fg');
    let blades = '';
    const r = rng(17);
    for (let i = 0; i < 26; i++) {
      const x = 10 + i * 23 + r() * 10, h = 120 + r() * 120, bend = (r() - 0.5) * 60;
      blades += `<path d="M${f(x - 12)} 260 Q${f(x + bend * 0.4)} ${f(260 - h * 0.6)} ${f(x + bend)} ${f(260 - h)} Q${f(x + bend * 0.2 + 8)} ${f(260 - h * 0.5)} ${f(x + 12)} 260 Z" fill="url(#${g})"/>`;
    }
    out.push({ key: 'cu_fg_grass', w: 620, h: 260, svg: svgDoc(620, 260, `<defs>${lightGrad(g, '#9be08a', '#4caa4a', '#2d7a34', true)}${blur('gb', 5)}</defs><g filter="url(#gb)">${blades}</g>`) });
  }
  return out;
}

// =====================================================================
// Pulsanti e pastiglie
// =====================================================================

/** Icona "giardino" per il pulsante (albero e fiore, viewBox 100×100). */
const GARDEN_ICON = `<circle cx="40" cy="38" r="22" fill="#ffffff"/><circle cx="58" cy="30" r="18" fill="#ffffff"/><rect x="44" y="50" width="10" height="34" rx="4" fill="#ffffff"/>
  <path d="M14 84 H86" stroke="#ffffff" stroke-width="8" stroke-linecap="round"/><circle cx="76" cy="66" r="9" fill="#ffffff"/>`;

function uiTextures(): SvgTex[] {
  const g = uid('bd');
  return [
    roundButton('cu_btn_garden', '#5fbf6a', GARDEN_ICON, 230),
    { key: 'cu_badge', w: 130, h: 130, svg: svgDoc(130, 130, `<defs>${ballGrad(g, '#ffffff', CREAM, '#ead8b4')}${blur(g + 'b', 4)}</defs>
      <ellipse cx="65" cy="118" rx="44" ry="8" fill="#1d2440" opacity=".2" filter="url(#${g}b)"/>
      <circle cx="65" cy="64" r="56" fill="url(#${g})" stroke="${TEAL}" stroke-width="8"/>`) },
  ];
}

// =====================================================================
// Tutte le texture del gioco
// =====================================================================

export function petTextures(): SvgTex[] {
  return PETS.flatMap((p) => [
    { key: `cu_${p.id}_body`, w: BODY.w, h: BODY.h, svg: bodySvg(p) },
    { key: `cu_${p.id}_head`, w: HEAD.w, h: HEAD.h, svg: headSvg(p) },
    { key: `cu_${p.id}_paw`, w: 120, h: 90, svg: pawSvg(p) },
    { key: `cu_${p.id}_tail`, w: 200, h: 200, svg: tailSvg(p) },
  ]);
}

export function gameTextures(): SvgTex[] {
  return [
    ...petTextures(), ...faceTextures(), ...ailmentTextures(),
    ...TOOLS.map(toolSvg), ...clinicTextures(), ...gardenTextures(), ...uiTextures(),
  ];
}
