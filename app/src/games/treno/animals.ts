import { svgDoc, type SvgTex } from '../../core/textures';
import { lightGrad, ballGrad, blur, shade, uid } from '../../core/art';
import { ANIMAL_IDS, type AnimalId } from './logic';

/**
 * I 15 animali viaggiatori, tondi e buffi, seduti (stile 2.5D: luce dall'alto a sinistra, bordi in una tonalità
 * scura dello stesso colore, riflessi). Tutti originali, disegnati qui in SVG. Due espressioni per animale:
 * normale e felice (occhi a mezzaluna, bocca aperta). Chiavi "tr_an_<id>" e "tr_an_<id>_happy".
 *
 * Coordinate (260×320): piedi a y = 310, testa centrata in (130, 132).
 */
export const AN = { w: 260, h: 320, ground: 310, headY: 132 };
/** Dove appendere il biglietto (petto) e dove sta il muso, in coordinate della texture. */
export const CHEST = { x: 130, y: 238 };

const f = (n: number): string => n.toFixed(1);
const B = (id: string, base: string, k = 0.5): string => ballGrad(id, shade(base, k), base, shade(base, -0.28));
const G = (id: string, base: string, k = 0.4): string => lightGrad(id, shade(base, k), base, shade(base, -0.26));
const shine = (cx: number, cy: number, rx: number, ry: number, rot = -28, op = 0.55): string =>
  `<ellipse cx="${f(cx)}" cy="${f(cy)}" rx="${f(rx)}" ry="${f(ry)}" transform="rotate(${rot} ${f(cx)} ${f(cy)})" fill="#fff" opacity="${op}"/>`;
const INK = '#2b1d26';

interface Part { defs: string; back: string; body: string; head: string; front: string }
const part = (): Part => ({ defs: '', back: '', body: '', head: '', front: '' });

// ------------------------------------------------------------------ pezzi comuni
/** Corpo seduto: piedi, pancia, braccini. */
function body(p: Part, fur: string, line: string, belly?: string, opts: { cy?: number; rx?: number; ry?: number; feet?: string; arms?: string } = {}): void {
  const g = uid('bd'), gb = uid('bl'), gf = uid('ft');
  const cy = opts.cy ?? 240, rx = opts.rx ?? 80, ry = opts.ry ?? 68;
  const feet = opts.feet ?? fur, arms = opts.arms ?? fur;
  p.defs += `<radialGradient id="${g}" gradientUnits="userSpaceOnUse" cx="100" cy="${cy - 40}" r="${rx * 1.5}"><stop offset="0" stop-color="${shade(fur, 0.45)}"/><stop offset=".55" stop-color="${fur}"/><stop offset="1" stop-color="${shade(fur, -0.2)}"/></radialGradient>${B(gf, feet, 0.4)}`;
  if (belly) p.defs += `<radialGradient id="${gb}" cx=".42" cy=".3" r=".8"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="${belly}"/></radialGradient>`;
  const fl = shade(feet, -0.4);
  p.body += `<ellipse cx="96" cy="${AN.ground - 10}" rx="30" ry="15" fill="url(#${gf})" stroke="${fl}" stroke-width="4"/>
    <ellipse cx="164" cy="${AN.ground - 10}" rx="30" ry="15" fill="url(#${gf})" stroke="${fl}" stroke-width="4"/>
    <ellipse cx="130" cy="${cy}" rx="${rx}" ry="${ry}" fill="url(#${g})" stroke="${line}" stroke-width="5"/>`;
  if (belly) p.body += `<ellipse cx="130" cy="${cy + 10}" rx="${rx * 0.62}" ry="${ry * 0.68}" fill="url(#${gb})"/>`;
  const al = shade(arms, -0.4), ga = uid('ar');
  p.defs += B(ga, arms, 0.35);
  p.front += `<ellipse cx="${130 - rx + 14}" cy="${cy + 6}" rx="20" ry="30" fill="url(#${ga})" stroke="${al}" stroke-width="4"/>
    <ellipse cx="${130 + rx - 14}" cy="${cy + 6}" rx="20" ry="30" fill="url(#${ga})" stroke="${al}" stroke-width="4"/>`;
}

/** Testa tonda con il riflesso. */
function head(p: Part, fur: string, line: string, rx = 86, ry = 80, cy = AN.headY): void {
  const g = uid('hd');
  p.defs += `<radialGradient id="${g}" gradientUnits="userSpaceOnUse" cx="${130 - rx * 0.35}" cy="${cy - ry * 0.45}" r="${Math.max(rx, ry) * 1.35}"><stop offset="0" stop-color="${shade(fur, 0.5)}"/><stop offset=".55" stop-color="${fur}"/><stop offset="1" stop-color="${shade(fur, -0.2)}"/></radialGradient>`;
  p.head += `<ellipse cx="130" cy="${cy}" rx="${rx}" ry="${ry}" fill="url(#${g})" stroke="${line}" stroke-width="5"/>`;
}

/** Occhi (aperti o felici), guanciotte. */
function face(happy: boolean, eyeY = 124, dx = 34, cheekY = 156, cheeks = '#ff8fa8', eye = INK): string {
  let o = '';
  for (const s of [-1, 1]) {
    const x = 130 + s * dx;
    o += happy
      ? `<path d="M${x - 13} ${eyeY + 4} Q${x} ${eyeY - 12} ${x + 13} ${eyeY + 4}" stroke="${eye}" stroke-width="6" fill="none" stroke-linecap="round"/>`
      : `<ellipse cx="${x}" cy="${eyeY}" rx="11" ry="14" fill="${eye}"/><circle cx="${x - 3.5}" cy="${eyeY - 5}" r="4.5" fill="#fff"/><circle cx="${x + 4}" cy="${eyeY + 5}" r="2" fill="#fff" opacity=".8"/>`;
  }
  if (cheeks) o += `<ellipse cx="${130 - dx - 18}" cy="${cheekY}" rx="13" ry="8" fill="${cheeks}" opacity=".45"/><ellipse cx="${130 + dx + 18}" cy="${cheekY}" rx="13" ry="8" fill="${cheeks}" opacity=".45"/>`;
  return o;
}

/** Bocca: sorriso o bocca aperta felice (con la linguetta). */
function mouth(happy: boolean, y: number, w = 16, col = INK): string {
  if (!happy) return `<path d="M${130 - w} ${y} Q${130 - w / 2} ${y + 10} 130 ${y + 2} Q${130 + w / 2} ${y + 10} ${130 + w} ${y}" stroke="${col}" stroke-width="4.5" fill="none" stroke-linecap="round"/>`;
  return `<path d="M${130 - w} ${y - 2} Q130 ${y + 30} ${130 + w} ${y - 2} Z" fill="#7a2a3a" stroke="${col}" stroke-width="4" stroke-linejoin="round"/>
    <ellipse cx="130" cy="${y + 13}" rx="${w * 0.5}" ry="6" fill="#ff8fa8"/>`;
}

/** Becco (uccelli), aperto quando sono felici. */
function beak(happy: boolean, y: number, col: string, w = 20, h = 22): string {
  const l = shade(col, -0.35), g = uid('bk');
  const top = `<path d="M${130 - w} ${y} Q130 ${y - 10} ${130 + w} ${y} Q${130 + 4} ${y + h * (happy ? 0.55 : 0.9)} 130 ${y + h * (happy ? 0.6 : 1)} Q${130 - 4} ${y + h * (happy ? 0.55 : 0.9)} ${130 - w} ${y} Z" fill="url(#${g})" stroke="${l}" stroke-width="3.5" stroke-linejoin="round"/>`;
  const low = happy ? `<path d="M${130 - w * 0.8} ${y + 8} Q130 ${y + h + 12} ${130 + w * 0.8} ${y + 8} Z" fill="${shade(col, -0.1)}" stroke="${l}" stroke-width="3.5" stroke-linejoin="round"/><ellipse cx="130" cy="${y + 13}" rx="${w * 0.4}" ry="5" fill="#ff8fa8"/>` : '';
  return `<defs>${lightGrad(g, shade(col, 0.45), col, shade(col, -0.2))}</defs>${low}${top}`;
}

/** Muso ovale chiaro con le narici (mucca, cavallo, maialino...). */
function muzzle(cy: number, rx: number, ry: number, col: string, nostril: string, gap = 18): string {
  const g = uid('mz');
  return `<defs>${B(g, col, 0.45)}</defs><ellipse cx="130" cy="${cy}" rx="${rx}" ry="${ry}" fill="url(#${g})" stroke="${shade(col, -0.35)}" stroke-width="4"/>
    <ellipse cx="${130 - gap}" cy="${cy - 2}" rx="6" ry="8.5" fill="${nostril}"/><ellipse cx="${130 + gap}" cy="${cy - 2}" rx="6" ry="8.5" fill="${nostril}"/>
    ${shine(130 - rx * 0.35, cy - ry * 0.45, rx * 0.3, ry * 0.18, -15, 0.5)}`;
}

/** Nasino a goccia rovesciata. */
const nose = (y: number, col = '#3a2626', w = 14): string =>
  `<path d="M${130 - w} ${y - 6} Q130 ${y - 12} ${130 + w} ${y - 6} Q${130 + 6} ${y + 9} 130 ${y + 10} Q${130 - 6} ${y + 9} ${130 - w} ${y - 6} Z" fill="${col}"/><ellipse cx="${130 - 4}" cy="${y - 5}" rx="4" ry="2.5" fill="#fff" opacity=".6"/>`;

/** Orecchie ai lati (ellissi inclinate) con l'interno colorato. */
function sideEars(p: Part, fur: string, line: string, inner: string, y: number, dx = 82, rx = 30, ry = 17, tilt = 20): void {
  const g = uid('er');
  p.defs += B(g, fur, 0.4);
  for (const s of [-1, 1]) {
    const x = 130 + s * dx;
    p.back += `<g transform="rotate(${-s * tilt} ${x} ${y})"><ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="url(#${g})" stroke="${line}" stroke-width="4.5"/>
      <ellipse cx="${x + s * 3}" cy="${y + 1}" rx="${rx * 0.6}" ry="${ry * 0.5}" fill="${inner}"/></g>`;
  }
}

/** Orecchie tonde in alto (orso, scimmia, leone). */
function roundEars(p: Part, fur: string, line: string, inner: string, y: number, dx: number, r: number): void {
  const g = uid('re');
  p.defs += B(g, fur, 0.4);
  for (const s of [-1, 1]) {
    const x = 130 + s * dx;
    p.back += `<circle cx="${x}" cy="${y}" r="${r}" fill="url(#${g})" stroke="${line}" stroke-width="4.5"/><circle cx="${x + s * 2}" cy="${y + 2}" r="${r * 0.55}" fill="${inner}"/>`;
  }
}

/** Ali o pinne ai lati del corpo. */
function wings(p: Part, col: string, line: string, cy = 236, dx = 70, rx = 24, ry = 46, tilt = 18): void {
  const g = uid('wg');
  p.defs += G(g, col, 0.35);
  for (const s of [-1, 1]) {
    const x = 130 + s * dx;
    p.front += `<ellipse cx="${x}" cy="${cy}" rx="${rx}" ry="${ry}" transform="rotate(${-s * tilt} ${x} ${cy})" fill="url(#${g})" stroke="${line}" stroke-width="4"/>`;
  }
}

function clip(id: string, shape: string): string { return `<clipPath id="${id}">${shape}</clipPath>`; }

// ------------------------------------------------------------------ gli animali
type Draw = (happy: boolean) => Part;

const ART: Record<AnimalId, Draw> = {
  // ======================= fattoria
  cow: (h) => {
    const p = part(), fur = '#fbf6ec', line = '#9c8a7a', spot = '#5b4038';
    const ch = uid('cc'), cb = uid('cb');
    p.defs += clip(ch, `<ellipse cx="130" cy="${AN.headY}" rx="86" ry="80"/>`) + clip(cb, `<ellipse cx="130" cy="240" rx="80" ry="68"/>`);
    // corna e orecchie
    const gh = uid('hn');
    p.defs += lightGrad(gh, '#fffbe8', '#f2dfb0', '#c9ac70');
    p.back += `<path d="M78 76 Q60 40 74 26 Q86 44 98 66 Z" fill="url(#${gh})" stroke="#a88a52" stroke-width="4" stroke-linejoin="round"/>
      <path d="M182 76 Q200 40 186 26 Q174 44 162 66 Z" fill="url(#${gh})" stroke="#a88a52" stroke-width="4" stroke-linejoin="round"/>`;
    sideEars(p, fur, line, '#f7b9c4', 104, 88, 32, 16, 18);
    body(p, fur, line, undefined, { feet: '#6b5042', arms: fur });
    p.body += `<g clip-path="url(#${cb})"><ellipse cx="78" cy="216" rx="34" ry="28" fill="${spot}"/><ellipse cx="190" cy="268" rx="30" ry="24" fill="${spot}"/></g>`;
    head(p, fur, line);
    p.head += `<g clip-path="url(#${ch})"><ellipse cx="190" cy="84" rx="36" ry="30" fill="${spot}"/><ellipse cx="62" cy="150" rx="22" ry="26" fill="${spot}"/></g>
      <path d="M116 56 Q124 40 132 54 Q138 40 146 56" stroke="${spot}" stroke-width="7" fill="none" stroke-linecap="round"/>`;
    p.head += face(h, 116, 36, 146, '#ff8fa8') + muzzle(170, 56, 34, '#f7b9c4', '#b5566b', 20) + mouth(h, 186, 14, '#8a3048');
    // campanellino
    const gb = uid('bell');
    p.defs += B(gb, '#ffc94a', 0.5);
    p.front += `<path d="M84 212 Q130 232 176 212" stroke="#c8382f" stroke-width="9" fill="none" stroke-linecap="round"/>
      <path d="M118 222 Q118 206 130 206 Q142 206 142 222 L146 234 H114 Z" fill="url(#${gb})" stroke="#b07a10" stroke-width="3"/><circle cx="130" cy="236" r="4" fill="#8a5a10"/>`;
    return p;
  },
  pig: (h) => {
    const p = part(), fur = '#f9b0c0', line = '#d0708a';
    const ge = uid('pe');
    p.defs += G(ge, fur, 0.35);
    p.back += `<path d="M62 92 L52 38 L104 62 Z" fill="url(#${ge})" stroke="${line}" stroke-width="4.5" stroke-linejoin="round"/>
      <path d="M198 92 L208 38 L156 62 Z" fill="url(#${ge})" stroke="${line}" stroke-width="4.5" stroke-linejoin="round"/>
      <path d="M66 80 L60 50 L90 64 Z" fill="#f08aa2"/><path d="M194 80 L200 50 L170 64 Z" fill="#f08aa2"/>`;
    body(p, fur, line, '#ffd6df');
    head(p, fur, line);
    const gs = uid('sn');
    p.defs += B(gs, '#f590a8', 0.4);
    p.head += face(h, 116, 38, 150) + `<ellipse cx="130" cy="160" rx="36" ry="26" fill="url(#${gs})" stroke="${line}" stroke-width="4"/>
      <ellipse cx="118" cy="160" rx="6" ry="9" fill="#b14a66"/><ellipse cx="142" cy="160" rx="6" ry="9" fill="#b14a66"/>${shine(116, 147, 10, 5, -10, 0.6)}` + mouth(h, 192, 16, '#a33a58');
    return p;
  },
  sheep: (h) => {
    const p = part(), wool = '#fffaf0', wl = '#c9b9a6', face_ = '#f4d9c2', fl = '#b08868';
    const gw = uid('wo');
    p.defs += ballGrad(gw, '#ffffff', wool, '#e9dfcf');
    sideEars(p, face_, fl, '#f2b5a8', 128, 92, 30, 14, 10);
    // lana del corpo
    let wb = '';
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      wb += `<circle cx="${f(130 + Math.cos(a) * 64)}" cy="${f(240 + Math.sin(a) * 44)}" r="28" fill="url(#${gw})" stroke="${wl}" stroke-width="4"/>`;
    }
    p.body += `<ellipse cx="96" cy="300" rx="22" ry="13" fill="#6b5042"/><ellipse cx="164" cy="300" rx="22" ry="13" fill="#6b5042"/>${wb}<ellipse cx="130" cy="244" rx="70" ry="56" fill="url(#${gw})"/>`;
    p.front += `<ellipse cx="66" cy="246" rx="16" ry="24" fill="${face_}" stroke="${fl}" stroke-width="4"/><ellipse cx="194" cy="246" rx="16" ry="24" fill="${face_}" stroke="${fl}" stroke-width="4"/>`;
    head(p, face_, fl, 70, 76, 140);
    let crown = '';
    for (const [x, y, r] of [[86, 82, 28], [114, 66, 30], [146, 66, 30], [174, 82, 28], [100, 96, 22], [160, 96, 22], [130, 84, 26]] as const) {
      crown += `<circle cx="${x}" cy="${y}" r="${r}" fill="url(#${gw})" stroke="${wl}" stroke-width="4"/>`;
    }
    p.head += crown + face(h, 136, 30, 166, '#ff8fa8') + nose(170, '#8a5a4a', 12) + mouth(h, 186, 14, '#7a4a3a');
    return p;
  },
  hen: (h) => {
    const p = part(), fur = '#fffaf0', line = '#c9b49a';
    const gc = uid('cm');
    p.defs += B(gc, '#ef3b36', 0.4);
    p.back += `<path d="M98 62 Q96 30 116 34 Q120 14 138 24 Q152 10 162 30 Q178 30 170 56 Z" fill="url(#${gc})" stroke="#a8221f" stroke-width="4" stroke-linejoin="round"/>`;
    body(p, fur, line, '#fff3d8', { feet: '#ffb02e', arms: fur, cy: 236, rx: 86, ry: 72 });
    head(p, fur, line, 78, 76, 136);
    p.head += face(h, 126, 32, 156, '#ff8fa8') + beak(h, 148, '#ffb02e', 18, 22)
      + (h ? '' : `<path d="M122 172 Q130 196 138 172 Z" fill="#ef3b36" stroke="#a8221f" stroke-width="3"/>`);
    wings(p, '#f3e6cc', '#c9b49a', 238, 74, 24, 46, 14);
    return p;
  },
  horse: (h) => {
    const p = part(), fur = '#c07a42', line = '#7a4422', mane = '#5a3420';
    const ge = uid('he');
    p.defs += G(ge, fur, 0.35);
    p.back += `<path d="M70 92 L68 34 L106 70 Z" fill="url(#${ge})" stroke="${line}" stroke-width="4.5" stroke-linejoin="round"/>
      <path d="M190 92 L192 34 L154 70 Z" fill="url(#${ge})" stroke="${line}" stroke-width="4.5" stroke-linejoin="round"/>
      <path d="M76 80 L76 50 L96 70 Z" fill="#e8b48a"/><path d="M184 80 L184 50 L164 70 Z" fill="#e8b48a"/>`;
    body(p, fur, line, '#e6b58a', { feet: '#5a3420' });
    head(p, fur, line, 76, 84, 128);
    const gm = uid('mn');
    p.defs += B(gm, mane, 0.35);
    p.head += `<path d="M100 56 Q108 26 132 34 Q156 22 162 54 Q150 46 140 60 Q132 44 120 62 Q112 48 100 56 Z" fill="url(#${gm})" stroke="#3a2214" stroke-width="4" stroke-linejoin="round"/>
      <path d="M124 66 Q130 60 136 66 L134 110 Q130 116 126 110 Z" fill="#fff4e4" opacity=".9"/>`
      + face(h, 112, 36, 140, '#ff9e80') + muzzle(170, 54, 38, '#ecc9a0', '#6a3a22', 20) + mouth(h, 188, 16, '#6a3a22');
    return p;
  },
  // ======================= giungla
  monkey: (h) => {
    const p = part(), fur = '#9b6236', line = '#5e3618', skin = '#f4d2a8';
    roundEars(p, fur, line, skin, 128, 90, 30);
    body(p, fur, line, '#e9c08e');
    head(p, fur, line, 84, 80);
    const gf = uid('mf');
    p.defs += B(gf, skin, 0.4);
    p.head += `<path d="M130 92 Q112 70 92 82 Q70 98 82 126 Q62 150 80 176 Q100 204 130 204 Q160 204 180 176 Q198 150 178 126 Q190 98 168 82 Q148 70 130 92 Z" fill="url(#${gf})" stroke="#c4935e" stroke-width="4"/>
      <path d="M118 52 Q126 30 134 50 Q142 34 146 54" stroke="${line}" stroke-width="7" fill="none" stroke-linecap="round"/>`
      + face(h, 122, 28, 160, '#ff8f7a') + `<ellipse cx="122" cy="156" rx="4.5" ry="3.5" fill="${line}"/><ellipse cx="138" cy="156" rx="4.5" ry="3.5" fill="${line}"/>` + mouth(h, 174, 22, line);
    return p;
  },
  elephant: (h) => {
    const p = part(), fur = '#a9b8cf', line = '#5f7090';
    const ge = uid('ee');
    p.defs += B(ge, fur, 0.35);
    for (const s of [-1, 1]) {
      const x = 130 + s * 80;
      p.back += `<path d="M${x - s * 30} 70 Q${x + s * 46} 50 ${x + s * 44} 128 Q${x + s * 40} 196 ${x - s * 20} 182 Q${x - s * 46} 130 ${x - s * 30} 70 Z" fill="url(#${ge})" stroke="${line}" stroke-width="5" stroke-linejoin="round"/>
        <path d="M${x - s * 14} 88 Q${x + s * 28} 78 ${x + s * 26} 128 Q${x + s * 22} 170 ${x - s * 8} 162 Q${x - s * 24} 128 ${x - s * 14} 88 Z" fill="#f2c1cc" opacity=".85"/>`;
    }
    body(p, fur, line, '#d6e0ec');
    head(p, fur, line, 80, 78);
    const gt = uid('tr');
    p.defs += G(gt, fur, 0.3);
    // proboscide che si arriccia in su (felice: più in alto)
    const tip = h ? 'Q176 166 168 148 Q160 138 152 150' : 'Q170 196 162 184 Q156 174 148 184';
    p.head += face(h, 116, 34, 150, '#ff9ab0')
      + `<path d="M112 140 Q110 188 128 206 ${tip} Q140 170 148 140 Z" fill="url(#${gt})" stroke="${line}" stroke-width="5" stroke-linejoin="round"/>
        <path d="M120 162 Q130 166 140 162 M122 178 Q131 182 140 177" stroke="${line}" stroke-width="3" fill="none" opacity=".6" stroke-linecap="round"/>`
      + (h ? `<path d="M100 196 Q112 214 124 200" stroke="${INK}" stroke-width="4.5" fill="none" stroke-linecap="round"/>` : '');
    return p;
  },
  giraffe: (h) => {
    const p = part(), fur = '#f7c64f', line = '#b07a1e', spot = '#c9822e';
    const cb = uid('gc'), cn = uid('gn'), chd = uid('gh');
    p.defs += clip(cb, `<ellipse cx="130" cy="254" rx="76" ry="58"/>`) + clip(cn, `<rect x="104" y="120" width="52" height="120"/>`) + clip(chd, `<ellipse cx="130" cy="108" rx="66" ry="64"/>`);
    // corna (ossiconi) e orecchie
    p.back += `<path d="M106 54 L102 18 M154 54 L158 18" stroke="${spot}" stroke-width="12" stroke-linecap="round"/>
      <circle cx="102" cy="16" r="11" fill="#8a5420"/><circle cx="158" cy="16" r="11" fill="#8a5420"/>`;
    sideEars(p, fur, line, '#f2b5a8', 76, 72, 26, 12, 22);
    body(p, fur, line, undefined, { cy: 254, rx: 76, ry: 58, feet: '#8a5420' });
    p.body += `<g clip-path="url(#${cb})"><circle cx="80" cy="232" r="20" fill="${spot}"/><circle cx="130" cy="216" r="16" fill="${spot}"/><circle cx="182" cy="236" r="20" fill="${spot}"/><circle cx="104" cy="282" r="16" fill="${spot}"/><circle cx="160" cy="280" r="18" fill="${spot}"/></g>`;
    // collo
    const gn = uid('nk');
    p.defs += lightGrad(gn, shade(fur, 0.4), fur, shade(fur, -0.15));
    p.body += `<path d="M104 236 L106 130 L154 130 L156 236 Z" fill="url(#${gn})" stroke="${line}" stroke-width="5" stroke-linejoin="round"/>
      <g clip-path="url(#${cn})"><circle cx="116" cy="170" r="12" fill="${spot}"/><circle cx="146" cy="196" r="12" fill="${spot}"/><circle cx="120" cy="222" r="10" fill="${spot}"/></g>
      <path d="M154 140 Q166 170 156 210" stroke="#a0581e" stroke-width="7" fill="none" stroke-linecap="round" opacity=".6"/>`;
    head(p, fur, line, 66, 64, 108);
    p.head += `<g clip-path="url(#${chd})"><circle cx="74" cy="70" r="14" fill="${spot}" opacity=".85"/><circle cx="188" cy="88" r="12" fill="${spot}" opacity=".85"/></g>`
      + face(h, 100, 28, 128, '#ff9e80') + muzzle(142, 44, 28, '#fbe0ac', '#8a5420', 15) + mouth(h, 158, 13, '#8a5420');
    return p;
  },
  lion: (h) => {
    const p = part(), fur = '#f4b54c', line = '#b46a1c', mane = '#d9772b';
    const gm = uid('lm');
    p.defs += B(gm, mane, 0.35);
    let mn = '';
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * Math.PI * 2;
      mn += `<circle cx="${f(130 + Math.cos(a) * 88)}" cy="${f(AN.headY + Math.sin(a) * 82)}" r="34" fill="url(#${gm})" stroke="#9a4e1a" stroke-width="4"/>`;
    }
    p.back += mn;
    roundEars(p, fur, line, '#ffd9a8', 64, 62, 20);
    body(p, fur, line, '#ffe4b0', { feet: fur });
    head(p, fur, line, 76, 72);
    const gz = uid('lz');
    p.defs += B(gz, '#fff1d0', 0.4);
    p.head += face(h, 120, 32, 150, '#ff8f7a')
      + `<ellipse cx="114" cy="162" rx="22" ry="17" fill="url(#${gz})"/><ellipse cx="146" cy="162" rx="22" ry="17" fill="url(#${gz})"/>`
      + nose(150, '#8a4a2a', 14) + mouth(h, 176, 14, '#8a4a2a')
      + `<path d="M102 104 Q114 96 122 104 M138 104 Q146 96 158 104" stroke="${line}" stroke-width="4" fill="none" stroke-linecap="round" opacity=".7"/>`;
    // ciuffo della coda
    p.back += `<path d="M206 286 Q238 270 232 238" stroke="${line}" stroke-width="10" fill="none" stroke-linecap="round"/><circle cx="232" cy="232" r="14" fill="url(#${gm})" stroke="#9a4e1a" stroke-width="3"/>`;
    return p;
  },
  parrot: (h) => {
    const p = part(), fur = '#e8453c', line = '#9c2420';
    const gc = uid('pc');
    p.defs += G(gc, '#ffc61a', 0.3);
    p.back += `<path d="M112 62 Q100 22 120 12 Q126 40 132 58 Q138 26 158 20 Q156 48 146 64 Z" fill="url(#${gc})" stroke="#c48a00" stroke-width="4" stroke-linejoin="round"/>
      <path d="M118 296 L104 318 L130 304 L156 318 L142 296 Z" fill="#2f86e8" stroke="#1d5aa8" stroke-width="3" stroke-linejoin="round"/>`;
    body(p, fur, line, '#ffb3a8', { feet: '#7a7a8a', cy: 236, rx: 82, ry: 70 });
    head(p, fur, line, 76, 74, 132);
    p.head += `<ellipse cx="96" cy="126" rx="22" ry="26" fill="#fffaf0" opacity=".95"/><ellipse cx="164" cy="126" rx="22" ry="26" fill="#fffaf0" opacity=".95"/>`
      + face(h, 124, 34, 160, '') + beak(h, 144, '#f3ead8', 20, 30);
    // ali: blu e verde con la punta gialla
    const gw = uid('pw');
    p.defs += lightGrad(gw, '#7fd38a', '#3dbb4f', '#1f7a6a', true);
    for (const s of [-1, 1]) {
      const x = 130 + s * 72;
      p.front += `<path d="M${x} 196 Q${x + s * 30} 230 ${x + s * 10} 290 Q${x - s * 16} 266 ${x - s * 14} 220 Z" fill="url(#${gw})" stroke="#1f6a5a" stroke-width="4" stroke-linejoin="round"/>
        <path d="M${x + s * 4} 262 Q${x + s * 10} 280 ${x + s * 10} 290 Q${x - s * 6} 276 ${x - s * 8} 262 Z" fill="#2f86e8"/>`;
    }
    return p;
  },
  // ======================= polo
  penguin: (h) => {
    const p = part(), fur = '#3d5a8c', line = '#1f3358', white = '#ffffff';
    const gw = uid('pw');
    p.defs += `<radialGradient id="${gw}" cx=".42" cy=".3" r=".8"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#e2ecf7"/></radialGradient>`;
    body(p, fur, line, undefined, { feet: '#ff9a2e', cy: 236, rx: 84, ry: 74 });
    p.body += `<ellipse cx="130" cy="248" rx="58" ry="58" fill="url(#${gw})"/>`;
    head(p, fur, line, 80, 76, 130);
    p.head += `<path d="M130 112 Q106 84 84 104 Q66 124 82 156 Q100 188 130 186 Q160 188 178 156 Q194 124 176 104 Q154 84 130 112 Z" fill="${white}" opacity=".97"/>`
      + face(h, 132, 30, 160, '#ff9ab0') + beak(h, 150, '#ff9a2e', 16, 20);
    wings(p, fur, line, 238, 82, 20, 50, 22);
    p.front += `<path d="M92 200 Q130 218 168 200" stroke="#ffc61a" stroke-width="14" fill="none" stroke-linecap="round"/><path d="M156 206 L162 240" stroke="#ffc61a" stroke-width="12" stroke-linecap="round"/>
      <path d="M100 204 Q130 218 160 204" stroke="#e8453c" stroke-width="3" fill="none" stroke-dasharray="8 8"/>`;
    return p;
  },
  polarbear: (h) => {
    const p = part(), fur = '#f6f3ea', line = '#a9b4c2';
    roundEars(p, fur, line, '#e4d6cc', 66, 64, 22);
    body(p, fur, line, '#ffffff', { feet: fur });
    head(p, fur, line, 84, 78);
    const gz = uid('bz');
    p.defs += B(gz, '#ffffff', 0.2);
    p.head += face(h, 120, 34, 152, '#ff9ab0') + `<ellipse cx="130" cy="164" rx="40" ry="30" fill="url(#${gz})" stroke="#d2d8e2" stroke-width="3"/>`
      + nose(152, '#2f2f3a', 15) + mouth(h, 178, 14, '#4a4a5a');
    p.front += `<path d="M86 202 Q130 218 174 202" stroke="#3dbb4f" stroke-width="12" fill="none" stroke-linecap="round"/><path d="M164 206 L170 238" stroke="#3dbb4f" stroke-width="11" stroke-linecap="round"/>
      <path d="M94 206 Q130 220 166 206" stroke="#fff" stroke-width="3" fill="none" stroke-dasharray="6 8" opacity=".7"/>`;
    return p;
  },
  seal: (h) => {
    const p = part(), fur = '#aab7c8', line = '#5f6f86';
    body(p, fur, line, '#e6edf5', { feet: fur, cy: 244, rx: 84, ry: 64 });
    // pinne posteriori al posto dei piedi
    p.body += `<path d="M76 296 Q50 316 70 318 Q96 316 104 300 Z" fill="${shade(fur, -0.15)}" stroke="${line}" stroke-width="4"/><path d="M184 296 Q210 316 190 318 Q164 316 156 300 Z" fill="${shade(fur, -0.15)}" stroke="${line}" stroke-width="4"/>`;
    head(p, fur, line, 82, 76, 136);
    const gz = uid('sz');
    p.defs += B(gz, '#f4f8fc', 0.2);
    p.head += `<circle cx="84" cy="96" r="7" fill="${shade(fur, -0.18)}"/><circle cx="178" cy="110" r="6" fill="${shade(fur, -0.18)}"/><circle cx="166" cy="82" r="5" fill="${shade(fur, -0.18)}"/>`
      + face(h, 122, 36, 156, '#ff9ab0')
      + `<ellipse cx="114" cy="162" rx="24" ry="18" fill="url(#${gz})"/><ellipse cx="146" cy="162" rx="24" ry="18" fill="url(#${gz})"/>
        <circle cx="104" cy="160" r="2.6" fill="${line}"/><circle cx="112" cy="168" r="2.6" fill="${line}"/><circle cx="148" cy="168" r="2.6" fill="${line}"/><circle cx="156" cy="160" r="2.6" fill="${line}"/>
        <path d="M88 158 L58 150 M88 166 L58 170 M172 158 L202 150 M172 166 L202 170" stroke="${line}" stroke-width="2.5" stroke-linecap="round" opacity=".7"/>`
      + nose(150, '#2f2f3a', 12) + mouth(h, 182, 12, '#3a4252');
    wings(p, shade(fur, -0.08), line, 248, 80, 18, 40, 30);
    return p;
  },
  walrus: (h) => {
    const p = part(), fur = '#b88660', line = '#6e4628';
    body(p, fur, line, '#d8b08c', { feet: shade(fur, -0.15), cy: 244, rx: 88, ry: 66 });
    head(p, fur, line, 86, 78, 134);
    const gz = uid('wz');
    p.defs += B(gz, '#e6c49e', 0.35);
    p.head += face(h, 112, 34, 140, '#ff9e80')
      // zanne (dietro i baffi)
      + `<path d="M108 170 Q104 210 112 226 Q120 212 120 172 Z" fill="#fffdf4" stroke="#c9b48a" stroke-width="3.5" stroke-linejoin="round"/>
        <path d="M152 170 Q156 210 148 226 Q140 212 140 172 Z" fill="#fffdf4" stroke="#c9b48a" stroke-width="3.5" stroke-linejoin="round"/>
        <ellipse cx="110" cy="158" rx="28" ry="22" fill="url(#${gz})" stroke="${line}" stroke-width="3.5"/><ellipse cx="150" cy="158" rx="28" ry="22" fill="url(#${gz})" stroke="${line}" stroke-width="3.5"/>
        <circle cx="98" cy="160" r="2.6" fill="${line}"/><circle cx="108" cy="168" r="2.6" fill="${line}"/><circle cx="152" cy="168" r="2.6" fill="${line}"/><circle cx="162" cy="160" r="2.6" fill="${line}"/>`
      + nose(142, '#4a2a1a', 12) + (h ? `<path d="M118 178 Q130 196 142 178 Z" fill="#7a2a3a"/>` : '');
    wings(p, shade(fur, -0.1), line, 248, 84, 18, 40, 30);
    return p;
  },
  puffin: (h) => {
    const p = part(), fur = '#24242c', line = '#0e0e14';
    body(p, fur, line, undefined, { feet: '#ff6a2e', cy: 238, rx: 82, ry: 72 });
    const gw = uid('fw');
    p.defs += `<radialGradient id="${gw}" cx=".42" cy=".3" r=".8"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#dfe3ea"/></radialGradient>`;
    p.body += `<ellipse cx="130" cy="256" rx="54" ry="48" fill="url(#${gw})"/>`;
    head(p, fur, line, 80, 74, 128);
    // maschera chiara sulle guance, cappuccio nero sopra
    p.head += `<path d="M66 128 Q70 92 130 96 Q190 92 194 128 Q192 176 130 184 Q68 176 66 128 Z" fill="url(#${gw})"/>
      <circle cx="${130 - 32}" cy="120" r="17" fill="none" stroke="#ff6a2e" stroke-width="4"/><circle cx="${130 + 32}" cy="120" r="17" fill="none" stroke="#ff6a2e" stroke-width="4"/>`
      + face(h, 120, 32, 156, '#ff9ab0');
    // becco grande a strisce (rosso-arancio, giallo, grigio-blu)
    const gb = uid('pb');
    p.defs += lightGrad(gb, '#ff9a5a', '#ff4a1e', '#c8301a', true);
    const open = h ? 10 : 0;
    p.head += `<path d="M96 146 Q130 124 164 146 Q160 ${184 + open} 130 ${204 + open} Q100 ${184 + open} 96 146 Z" fill="url(#${gb})" stroke="#9a2a12" stroke-width="4" stroke-linejoin="round"/>
      <path d="M100 152 Q130 134 160 152" stroke="#ffd23a" stroke-width="8" fill="none" stroke-linecap="round"/>
      <path d="M98 146 Q130 126 162 146" stroke="#6f7f9a" stroke-width="7" fill="none" stroke-linecap="round"/>
      <path d="M110 176 Q130 166 150 176" stroke="#ffd23a" stroke-width="4" fill="none" stroke-linecap="round" opacity=".8"/>
      ${h ? `<path d="M114 ${184 + open} Q130 ${192 + open} 146 ${184 + open}" stroke="#6a1a0a" stroke-width="4" fill="none" stroke-linecap="round"/>` : ''}`;
    wings(p, fur, line, 236, 80, 20, 48, 22);
    return p;
  },
};

/** SVG di un animale seduto (felice o no), con l'ombra propria sotto la testa. */
export function animalSvg(id: AnimalId, happy = false): string {
  const p = ART[id](happy);
  const sh = uid('ash');
  const headShadow = `<defs>${blur(sh, 6)}</defs><ellipse cx="136" cy="214" rx="64" ry="12" fill="#1d2440" opacity=".18" filter="url(#${sh})"/>`;
  // braccini davanti al corpo, testa sopra a tutto (con un'ombra morbida sul petto)
  return svgDoc(AN.w, AN.h, `<defs>${p.defs}</defs>${p.back}${p.body}${headShadow}${p.front}${p.head}`);
}

export function animalTextures(): SvgTex[] {
  return ANIMAL_IDS.flatMap((id) => [
    { key: `tr_an_${id}`, w: AN.w, h: AN.h, svg: animalSvg(id, false) },
    { key: `tr_an_${id}_happy`, w: AN.w, h: AN.h, svg: animalSvg(id, true) },
  ]);
}
