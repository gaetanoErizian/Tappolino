import { wheelFrame as coreWheelFrame } from '../../core/wheels';
import { svgDoc, type SvgTex } from '../../core/textures';
import { lightGrad, ballGrad, blur, starPath, shade, roundButton } from '../../core/art';
import { WHEELS, STICKERS, TRACKS, REPAIRS, type Track, type RepairId } from './parts';
import { rng } from './track';

/**
 * Grafica dell'Officina dei Monster Truck: tutta originale, disegnata in SVG (stile 2.5D Tappolino:
 * luce dall'alto a sinistra, volume con sfumature, riflessi, ombre; bordi in una tonalità scura dello stesso colore).
 * La carrozzeria è in scala di grigi e si colora con il tint; riflessi, vetri e cromature stanno in una texture
 * separata sopra, così il colore non li spegne.
 */

/**
 * Riquadro della carrozzeria (420×240, muso a destra). Assi delle ruote, raggio della gomma e punto dell'adesivo
 * in coordinate della texture: in scena tutto si posiziona a mano (niente Container: Phaser 4 e rotazioni).
 */
export const TF = { w: 420, h: 240, cx: 210, cy: 120, axleY: 206, rearX: 110, frontX: 310, R: 84, stkX: 196, stkY: 140, smokeX: 352, smokeY: 96 } as const;
/** Lato della texture delle ruote (la gomma ha raggio TF.R). */
export const WHEEL_PX = 184;

// ---------------------------------------------------------------- truck

const BODY_PATH = 'M34 104 L150 104 L160 48 Q164 34 180 34 L254 34 Q268 34 275 46 L300 98 L380 102 Q404 104 406 128 L406 160 Q406 176 390 178 L382 178 A78 78 0 0 0 238 178 L182 178 A78 78 0 0 0 38 178 Q24 178 24 164 L24 114 Q24 104 34 104 Z';
const GLASS_PATH = 'M172 52 L250 52 Q257 52 261 59 L282 96 L172 96 Z';

/** Carrozzeria in scala di grigi (si colora con setTint). */
function bodyTex(): SvgTex {
  return {
    key: 'mt_body', w: TF.w, h: TF.h, svg: svgDoc(TF.w, TF.h, `<defs>${lightGrad('p', '#ffffff', '#f0f0f0', '#a6a6a6', true)}
      <linearGradient id="lo" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".25"/></linearGradient>
      <clipPath id="bc"><path d="${BODY_PATH}"/></clipPath></defs>
      <path d="${BODY_PATH}" fill="#6e6e6e" transform="translate(3 5)"/>
      <path d="${BODY_PATH}" fill="url(#p)" stroke="#5c5c5c" stroke-width="5" stroke-linejoin="round"/>
      <rect x="20" y="140" width="392" height="42" fill="url(#lo)" clip-path="url(#bc)"/>
      <path d="M150 106 V128 M300 100 V128" stroke="#7a7a7a" stroke-width="3"/>
      <path d="M162 100 L298 100" stroke="#9a9a9a" stroke-width="2"/>`),
  };
}

/** Vetri con il pilota, fari, cromature, luci sul tetto e riflessi: sopra la carrozzeria, senza colore. */
function bodyHiTex(): SvgTex {
  return {
    key: 'mt_body_hi', w: TF.w, h: TF.h, svg: svgDoc(TF.w, TF.h, `<defs>
      <linearGradient id="gl" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e6f6ff" stop-opacity=".55"/><stop offset=".5" stop-color="#8fd0ff" stop-opacity=".35"/><stop offset="1" stop-color="#3a7ac4" stop-opacity=".55"/></linearGradient>
      ${ballGrad('fc', '#ffe9d6', '#ffcfa8', '#e0956a')}${ballGrad('hm', '#ffffff', '#ffd23f', '#e08a00')}
      ${lightGrad('cr', '#ffffff', '#c9d2e0', '#6f7a90', true)}${ballGrad('hl', '#ffffff', '#fff3a0', '#ffb800')}
      <radialGradient id="sh" cx=".25" cy=".2" r=".6"><stop offset="0" stop-color="#fff" stop-opacity=".55"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
      <clipPath id="w"><path d="${GLASS_PATH}"/></clipPath></defs>
      <!-- interno della cabina e pilota con il casco -->
      <path d="${GLASS_PATH}" fill="#2b3550"/>
      <g clip-path="url(#w)">
        <rect x="190" y="84" width="60" height="20" rx="8" fill="#ff5a5f"/>
        <circle cx="222" cy="78" r="21" fill="url(#fc)"/>
        <path d="M199 74 Q200 50 222 50 Q244 50 246 74 L246 70 Q222 60 199 70 Z" fill="url(#hm)" stroke="#c78a00" stroke-width="2"/>
        <path d="M203 64 H241" stroke="#ff5a5f" stroke-width="5"/>
        <circle cx="228" cy="78" r="4" fill="#2b2140"/><circle cx="240" cy="78" r="4" fill="#2b2140"/>
        <circle cx="229.5" cy="76.5" r="1.4" fill="#fff"/><circle cx="241.5" cy="76.5" r="1.4" fill="#fff"/>
        <path d="M229 88 Q235 93 242 88" stroke="#2b2140" stroke-width="2.6" fill="none" stroke-linecap="round"/>
        <ellipse cx="222" cy="86" rx="5" ry="3" fill="#ff8f8f" opacity=".5"/>
        <path d="M252 96 Q262 84 274 92" stroke="#2b2140" stroke-width="5" fill="none" stroke-linecap="round"/>
        <circle cx="262" cy="88" r="9" fill="none" stroke="#3a3a46" stroke-width="5"/>
      </g>
      <path d="${GLASS_PATH}" fill="url(#gl)" stroke="#2b3550" stroke-width="4" stroke-linejoin="round"/>
      <path d="M180 60 L200 60 L186 90 L176 90 Z M246 60 L254 60 L234 92 L226 92 Z" fill="#fff" opacity=".45"/>
      <!-- luci sul tetto -->
      <rect x="182" y="22" width="68" height="13" rx="5" fill="#3a3a46"/>
      ${[194, 210, 226, 242].map((x) => `<circle cx="${x}" cy="28" r="5" fill="url(#hl)"/>`).join('')}
      <!-- scarichi cromati dietro la cabina -->
      <rect x="132" y="38" width="12" height="70" rx="5" fill="url(#cr)" stroke="#5a6480" stroke-width="2"/>
      <rect x="129" y="32" width="18" height="9" rx="3" fill="#5a6480"/>
      <!-- faro, fanale, paraurti, specchietto, maniglia -->
      <ellipse cx="398" cy="122" rx="9" ry="13" fill="url(#hl)" stroke="#b37a00" stroke-width="2"/>
      <rect x="22" y="112" width="10" height="20" rx="3" fill="#ff4a4a" stroke="#a82020" stroke-width="2"/>
      <rect x="396" y="148" width="22" height="22" rx="7" fill="url(#cr)" stroke="#5a6480" stroke-width="2"/>
      <rect x="6" y="148" width="22" height="22" rx="7" fill="url(#cr)" stroke="#5a6480" stroke-width="2"/>
      <rect x="282" y="78" width="14" height="16" rx="4" fill="#3a3a46"/>
      <rect x="236" y="110" width="22" height="7" rx="3.5" fill="#3a3a46" opacity=".7"/>
      <!-- riflessi della vernice (luce dall'alto a sinistra) -->
      <path d="M40 110 H144 M308 106 L378 108 M184 40 H250" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".7"/>
      <path d="${BODY_PATH}" fill="url(#sh)"/>`),
  };
}

/** Telaio, molle gialle e ammortizzatori: dietro le ruote. */
function chassisTex(): SvgTex {
  const spring = (x: number) => {
    let d = `M${x - 12} 150`;
    for (let i = 0; i < 6; i++) d += ` L${x + 12} ${156 + i * 9} L${x - 12} ${160 + i * 9}`;
    return `<rect x="${x - 6}" y="146" width="12" height="62" rx="5" fill="#5a6070"/><path d="${d}" fill="none" stroke="#ffd23f" stroke-width="6" stroke-linejoin="round"/>
      <path d="${d}" fill="none" stroke="#fff6b0" stroke-width="2" stroke-linejoin="round" transform="translate(-1 -2)" opacity=".7"/>`;
  };
  return {
    key: 'mt_chassis', w: TF.w, h: TF.h, svg: svgDoc(TF.w, TF.h, `<defs>${lightGrad('fr', '#8a92a6', '#4e5568', '#2c3140', true)}</defs>
      <rect x="62" y="176" width="296" height="20" rx="8" fill="url(#fr)" stroke="#232733" stroke-width="2"/>
      <path d="M110 206 L310 206" stroke="#3a4050" stroke-width="12" stroke-linecap="round"/>
      ${spring(TF.rearX)}${spring(TF.frontX)}
      <circle cx="${TF.rearX}" cy="${TF.axleY}" r="16" fill="#3a4050"/><circle cx="${TF.frontX}" cy="${TF.axleY}" r="16" fill="#3a4050"/>`),
  };
}

/** Ruota da monster truck: gomma scolpita con i tasselli e cerchio con lo stile scelto. */
/** Fotogrammi delle ruote: i raggi si ridisegnano sfasati di 10° (cerchi e tasselli si ripetono ogni 60°). */
export const WHEEL_FRAMES = 6;
export const WHEEL_STEP = 60 / WHEEL_FRAMES;

/** Fotogramma dei raggi per una ruota di raggio r che ha percorso dist (calcolo comune in core/wheels). */
export function wheelFrame(dist: number, r: number): number {
  return coreWheelFrame(dist, r, WHEEL_FRAMES, 60);
}

function wheelTex(w: (typeof WHEELS)[number], frame: number): SvgTex {
  const phase = frame * WHEEL_STEP;
  const c = WHEEL_PX / 2, R = TF.R;
  let lugs = '';
  for (let i = 0; i < 18; i++) {
    const a = (i * 360) / 18;
    lugs += `<rect x="${c - 11}" y="${c - R - 4}" width="22" height="20" rx="4" fill="#2a2a33" transform="rotate(${a} ${c} ${c})"/>`;
  }
  // cerchi tutti con simmetria di 60° (come i 18 tasselli): in gioco la ruota gira cambiando fotogramma (ogni 10°)
  let rimArt = '';
  const rr = 44;
  if (w.id === 'stella') {
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI) / 3 - Math.PI / 2;
      rimArt += `<path d="${starPath(c + Math.cos(a) * 27, c + Math.sin(a) * 27, 11, 0.45)}" fill="#fff6b0" stroke="${shade(w.hub, -0.2)}" stroke-width="1.5" stroke-linejoin="round"/>`;
    }
  } else if (w.id === 'fiamme') {
    for (let i = 0; i < 6; i++) {
      rimArt += `<path d="M${c} ${c} Q${c + 10} ${c - 18} ${c + 4} ${c - rr + 2} Q${c + 22} ${c - 24} ${c + 18} ${c - 6} Z" fill="${i % 2 ? '#ffd23f' : '#ffffff'}" opacity=".9" transform="rotate(${i * 60} ${c} ${c})"/>`;
    }
  } else if (w.id === 'arcobaleno') {
    ['#ff5e5e', '#ffb02e', '#ffe14a', '#4cd07a', '#4fa3ff'].forEach((col, i) => { rimArt += `<circle cx="${c}" cy="${c}" r="${rr - 3 - i * 6}" fill="${col}"/>`; });
    for (let i = 0; i < 6; i++) rimArt += `<rect x="${c - 3}" y="${c - rr + 4}" width="6" height="${rr - 8}" rx="3" fill="#ffffff" opacity=".85" transform="rotate(${i * 60} ${c} ${c})"/>`;
  } else {
    const wd = w.id === 'oro' ? 14 : 10;
    for (let i = 0; i < 6; i++) {
      rimArt += `<rect x="${c - wd / 2}" y="${c - rr + 6}" width="${wd}" height="${rr - 12}" rx="${wd / 2}" fill="${shade(w.rim, -0.35)}" transform="rotate(${i * 60} ${c} ${c})"/>`;
    }
  }
  return {
    key: `mt_wheel_${w.id}_${frame}`, w: WHEEL_PX, h: WHEEL_PX, svg: svgDoc(WHEEL_PX, WHEEL_PX, `<defs>
      ${ballGrad('ti', '#6a6a78', '#34343e', '#16161c')}${ballGrad('rim', shade(w.rim, 0.55), w.rim, shade(w.rim, -0.35))}
      ${ballGrad('hub', shade(w.hub, 0.5), w.hub, shade(w.hub, -0.4))}</defs>
      <g transform="rotate(${phase} ${c} ${c})">${lugs}
      <circle cx="${c}" cy="${c}" r="${R - 6}" fill="url(#ti)"/>
      <circle cx="${c}" cy="${c}" r="${R - 18}" fill="none" stroke="#4a4a56" stroke-width="3" stroke-dasharray="7 9"/>
      <circle cx="${c}" cy="${c}" r="${rr + 4}" fill="#202028"/>
      <circle cx="${c}" cy="${c}" r="${rr}" fill="url(#rim)" stroke="${shade(w.rim, -0.45)}" stroke-width="3"/>
      ${rimArt}
      <circle cx="${c}" cy="${c}" r="14" fill="url(#hub)" stroke="${shade(w.hub, -0.5)}" stroke-width="2"/>
      ${[0, 60, 120, 180, 240, 300].map((a) => `<circle cx="${c}" cy="${c - 20}" r="3" fill="#e8ecf4" transform="rotate(${a} ${c} ${c})"/>`).join('')}</g>`),
  };
}

/** Riflessi della ruota (luce dall'alto a sinistra): sopra la ruota e fermi mentre la ruota gira. */
function wheelShineTex(): SvgTex {
  const c = WHEEL_PX / 2, R = TF.R;
  return {
    key: 'mt_wheel_shine', w: WHEEL_PX, h: WHEEL_PX, svg: svgDoc(WHEEL_PX, WHEEL_PX, `<defs><radialGradient id="d" cx=".65" cy=".7" r=".6"><stop offset=".6" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".35"/></radialGradient></defs>
      <circle cx="${c}" cy="${c}" r="${R - 4}" fill="url(#d)"/>
      <path d="M${c - R + 16} ${c - 22} Q${c - R + 26} ${c - R + 28} ${c - 20} ${c - R + 14}" stroke="#fff" stroke-width="6" fill="none" stroke-linecap="round" opacity=".3"/>
      <ellipse cx="${c - 16}" cy="${c - 18}" rx="12" ry="7" fill="#fff" opacity=".55" transform="rotate(-35 ${c - 16} ${c - 18})"/>`),
  };
}

/** Adesivi da fiancata, con il bordo bianco da decalcomania. */
function stickerTex(id: string): SvgTex | null {
  const W = 170, H = 100;
  const edge = (d: string, fill: string, stroke: string) =>
    `<path d="${d}" fill="#fff" stroke="#fff" stroke-width="12" stroke-linejoin="round"/><path d="${d}" fill="${fill}" stroke="${stroke}" stroke-width="3" stroke-linejoin="round"/>`;
  let body = '';
  const defs = `${lightGrad('y', '#fff6b0', '#ffd23f', '#f08c00', true)}${lightGrad('r', '#ff9a9a', '#ff4a5a', '#c42a3a', true)}
    <linearGradient id="f" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ff3d2a"/><stop offset=".55" stop-color="#ff9a1e"/><stop offset="1" stop-color="#ffe14a"/></linearGradient>`;
  switch (id) {
    case 'stella': body = edge(starPath(85, 52, 42), 'url(#y)', '#e08a00'); break;
    case 'fulmine': body = edge('M96 6 L50 58 L80 58 L66 96 L124 38 L92 38 L108 6 Z', 'url(#y)', '#e08a00'); break;
    case 'fiamme': body = edge('M8 70 Q30 64 44 50 Q48 66 60 62 Q70 34 92 22 Q90 44 104 50 Q116 30 140 26 Q130 46 146 58 Q156 54 164 46 Q164 72 140 84 Q90 96 8 86 Z', 'url(#f)', '#c4361b'); break;
    case 'cuore': body = edge('M85 92 Q40 66 42 38 Q44 14 66 14 Q80 14 85 30 Q90 14 104 14 Q126 14 128 38 Q130 66 85 92 Z', 'url(#r)', '#a82030'); break;
    case 'sorriso': body = `${edge('M85 8 A44 44 0 1 1 84.9 8 Z', 'url(#y)', '#e08a00')}
      <ellipse cx="70" cy="42" rx="6" ry="9" fill="#2b2140"/><ellipse cx="100" cy="42" rx="6" ry="9" fill="#2b2140"/>
      <path d="M62 62 Q85 84 108 62" stroke="#2b2140" stroke-width="6" fill="none" stroke-linecap="round"/>`; break;
    case 'scacchi': {
      let sq = '';
      for (let i = 0; i < 8; i++) for (let j = 0; j < 3; j++) if ((i + j) % 2 === 0) sq += `<rect x="${18 + i * 17}" y="${26 + j * 17}" width="17" height="17" fill="#2b2140"/>`;
      body = `<rect x="12" y="20" width="148" height="63" rx="8" fill="#fff" stroke="#fff" stroke-width="12"/><rect x="18" y="26" width="136" height="51" fill="#ffffff" stroke="#2b2140" stroke-width="3"/>${sq}`;
      break;
    }
    default: return null;
  }
  return { key: `mt_stk_${id}`, w: W, h: H, svg: svgDoc(W, H, `<defs>${defs}</defs><g opacity=".98">${body}</g><ellipse cx="60" cy="24" rx="20" ry="6" fill="#fff" opacity=".35" transform="rotate(-12 60 24)"/>`) };
}

/** Truck piccolo per la strada in alto (grigio: si colora con il tint come il truck vero). */
function miniTex(): SvgTex {
  return {
    key: 'mt_mini', w: 140, h: 96, svg: svgDoc(140, 96, `<defs>${lightGrad('p', '#ffffff', '#d6d6d6', '#8c8c8c', true)}</defs>
      <path d="M14 40 H52 L56 18 Q58 12 66 12 H90 Q96 12 98 18 L106 38 H124 Q132 40 132 50 V58 H14 Z" fill="url(#p)" stroke="#5c5c5c" stroke-width="3"/>
      <path d="M64 20 H88 L96 38 H64 Z" fill="#cfefff" stroke="#5c5c5c" stroke-width="2"/>
      <circle cx="40" cy="70" r="22" fill="#2a2a33"/><circle cx="108" cy="70" r="22" fill="#2a2a33"/>
      <circle cx="40" cy="70" r="10" fill="#e0e4ec"/><circle cx="108" cy="70" r="10" fill="#e0e4ec"/>`),
  };
}

// ---------------------------------------------------------------- officina

function garageTextures(): SvgTex[] {
  // parete: pannelli color crema, fascia arancio, zoccolo con strisce gialle e grigie
  let panels = '';
  for (let i = 0; i < 4; i++) panels += `<rect x="${i * 256 + 6}" y="40" width="244" height="470" rx="10" fill="url(#pn)" stroke="#d8c8a8" stroke-width="3"/>
    ${[90, 180, 270, 360, 450].map((y) => `<circle cx="${i * 256 + 22}" cy="${y}" r="4" fill="#cdb894"/><circle cx="${i * 256 + 234}" cy="${y}" r="4" fill="#cdb894"/>`).join('')}`;
  let hazard = '';
  for (let i = 0; i < 22; i++) hazard += `<path d="M${i * 50 - 20} 640 L${i * 50 + 10} 640 L${i * 50 - 20} 700 L${i * 50 - 50} 700 Z" fill="#2f3340"/>`;
  const wall: SvgTex = {
    key: 'mt_gwall', w: 1024, h: 700, svg: svgDoc(1024, 700, `<defs>${lightGrad('pn', '#fff8ea', '#f6ead2', '#e6d4b2', true)}
      <linearGradient id="bd" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffb347"/><stop offset="1" stop-color="#f08a1e"/></linearGradient></defs>
      <rect width="1024" height="700" fill="#efe0c2"/>${panels}
      <rect y="520" width="1024" height="60" fill="url(#bd)"/><rect y="520" width="1024" height="8" fill="#fff" opacity=".35"/>
      <rect y="580" width="1024" height="60" fill="#c9cdd6"/><rect y="640" width="1024" height="60" fill="#ffcc1f"/>${hazard}`),
  };
  // porta aperta: si vede l'arena fuori con il pubblico
  let heads = '';
  const rr = rng(7);
  const shirt = ['#ff5e5e', '#4fa3ff', '#ffd23f', '#3cc46a', '#ff8a1e', '#b48cff', '#ffffff'];
  for (let row = 0; row < 3; row++) for (let i = 0; i < 18; i++) {
    const x = 40 + i * 32 + (row % 2) * 14 + rr() * 6, y = 300 + row * 40;
    heads += `<rect x="${x - 11}" y="${y + 6}" width="22" height="24" rx="8" fill="${shirt[Math.floor(rr() * shirt.length)]}" opacity=".85"/><circle cx="${x}" cy="${y}" r="10" fill="${['#f6d2b0', '#d9a07a', '#8a5a3a', '#f0c49a'][Math.floor(rr() * 4)]}" opacity=".9"/>`;
  }
  const door: SvgTex = {
    key: 'mt_gdoor', w: 640, h: 540, svg: svgDoc(640, 540, `<defs><linearGradient id="sk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5fb8ff"/><stop offset="1" stop-color="#ffe2a8"/></linearGradient>
      ${lightGrad('fr', '#9aa2b4', '#6a7286', '#454c5e', true)}${lightGrad('sh', '#e8ecf4', '#b9c0ce', '#8a92a6', true)}${blur('h', 2.5)}</defs>
      <rect x="30" y="40" width="580" height="500" fill="url(#sk)"/>
      <circle cx="500" cy="130" r="46" fill="#fff3a0" opacity=".9"/><circle cx="500" cy="130" r="34" fill="#ffe066"/>
      <g filter="url(#h)"><path d="M30 290 L120 250 L220 280 L330 240 L450 270 L610 236 V540 H30 Z" fill="#e0a070" opacity=".7"/></g>
      <rect x="30" y="286" width="580" height="160" fill="#8a92a6"/>
      ${[0, 1, 2].map((k) => `<rect x="30" y="${296 + k * 40}" width="580" height="6" fill="#b9c0ce"/>`).join('')}
      <g filter="url(#h)">${heads}</g>
      <rect x="30" y="446" width="580" height="94" fill="#f0a24a"/><rect x="30" y="446" width="580" height="10" fill="#ffc46a"/>
      <rect x="30" y="20" width="580" height="80" fill="url(#sh)"/>
      ${[0, 1, 2, 3].map((k) => `<rect x="30" y="${28 + k * 18}" width="580" height="4" fill="#8a92a6" opacity=".6"/>`).join('')}
      <rect x="0" y="0" width="40" height="540" fill="url(#fr)"/><rect x="600" y="0" width="40" height="540" fill="url(#fr)"/>
      <rect x="0" y="0" width="640" height="26" fill="url(#fr)"/>`),
  };
  // pannello degli attrezzi
  const tool = (x: number, y: number, kind: number) => kind === 0
    ? `<g transform="translate(${x} ${y})"><rect x="-6" y="-46" width="12" height="80" rx="6" fill="url(#mt)"/><path d="M-18 -60 Q-18 -76 0 -76 Q18 -76 18 -60 L8 -52 V-44 H-8 V-52 Z" fill="url(#mt)"/></g>`
    : kind === 1
      ? `<g transform="translate(${x} ${y})"><rect x="-7" y="-10" width="14" height="52" rx="6" fill="#ff5a5f"/><rect x="-22" y="-44" width="44" height="30" rx="6" fill="url(#mt)"/></g>`
      : `<g transform="translate(${x} ${y})"><rect x="-8" y="-6" width="16" height="48" rx="7" fill="#ffd23f"/><rect x="-3" y="-56" width="6" height="52" fill="url(#mt)"/></g>`;
  const board: SvgTex = {
    key: 'mt_pegboard', w: 520, h: 300, svg: svgDoc(520, 300, `<defs>${lightGrad('pb', '#d9a574', '#c48a56', '#9a6638', true)}${lightGrad('mt', '#ffffff', '#c9d2e0', '#7a869c')}</defs>
      <rect x="8" y="12" width="512" height="288" rx="14" fill="#7a5030" opacity=".35"/>
      <rect x="0" y="0" width="512" height="286" rx="14" fill="url(#pb)" stroke="#8a5a30" stroke-width="4"/>
      ${Array.from({ length: 60 }, (_, i) => `<circle cx="${30 + (i % 12) * 41}" cy="${30 + Math.floor(i / 12) * 56}" r="4" fill="#8a5a30" opacity=".6"/>`).join('')}
      ${tool(70, 170, 0)}${tool(150, 160, 1)}${tool(230, 170, 2)}${tool(310, 170, 0)}${tool(390, 160, 1)}${tool(460, 170, 2)}`),
  };
  // pavimento in cemento con le righe gialle
  const floor: SvgTex = {
    key: 'mt_gfloor', w: 1024, h: 420, svg: svgDoc(1024, 420, `<defs><linearGradient id="fl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9aa0aa"/><stop offset=".4" stop-color="#80868f"/><stop offset="1" stop-color="#5a6068"/></linearGradient></defs>
      <rect width="1024" height="420" fill="url(#fl)"/>
      ${[-3, -2, -1, 0, 1, 2, 3, 4].map((k) => `<path d="M${512 + k * 150} 0 L${512 + k * 420} 420" stroke="#6a7078" stroke-width="3" opacity=".6"/>`).join('')}
      <path d="M0 60 H1024 M0 170 H1024 M0 320 H1024" stroke="#6a7078" stroke-width="3" opacity=".5"/>
      <path d="M150 14 L60 410 M874 14 L964 410" stroke="#ffcc1f" stroke-width="14" opacity=".9"/>
      <ellipse cx="300" cy="250" rx="90" ry="20" fill="#3a3e48" opacity=".25"/><ellipse cx="760" cy="330" rx="60" ry="14" fill="#3a3e48" opacity=".2"/>
      <rect width="1024" height="10" fill="#4a5058" opacity=".6"/>`),
  };
  const lift: SvgTex = {
    key: 'mt_lift', w: 760, h: 120, svg: svgDoc(760, 120, `<defs>${lightGrad('l', '#ff9a8a', '#ef3b3b', '#a82020', true)}${blur('s', 8)}</defs>
      <ellipse cx="380" cy="104" rx="360" ry="16" fill="#1d2440" opacity=".35" filter="url(#s)"/>
      <rect x="40" y="38" width="680" height="34" rx="10" fill="#7a1a1a"/>
      <rect x="40" y="28" width="680" height="34" rx="10" fill="url(#l)"/>
      <rect x="40" y="28" width="680" height="8" rx="4" fill="#fff" opacity=".35"/>
      ${[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((k) => `<path d="M${60 + k * 52} 36 L${82 + k * 52} 58" stroke="#ffd23f" stroke-width="10"/>`).join('')}
      <rect x="110" y="70" width="40" height="40" fill="#5a6070"/><rect x="610" y="70" width="40" height="40" fill="#5a6070"/>`),
  };
  const tires: SvgTex = {
    key: 'mt_tires', w: 220, h: 280, svg: svgDoc(220, 280, `<defs>${lightGrad('t', '#5a5a66', '#34343e', '#1c1c22', true)}${blur('s', 6)}</defs>
      <ellipse cx="110" cy="264" rx="100" ry="14" fill="#1d2440" opacity=".35" filter="url(#s)"/>
      ${[0, 1, 2].map((k) => `<rect x="14" y="${186 - k * 78}" width="192" height="74" rx="30" fill="url(#t)"/>
        <ellipse cx="110" cy="${190 - k * 78}" rx="60" ry="12" fill="#16161c"/>
        <path d="M30 ${206 - k * 78} H190" stroke="#4a4a56" stroke-width="5" stroke-dasharray="10 8"/>`).join('')}
      <path d="M30 40 Q60 30 90 34" stroke="#fff" stroke-width="5" opacity=".25" fill="none" stroke-linecap="round"/>`),
  };
  const barrel: SvgTex = {
    key: 'mt_barrel', w: 140, h: 190, svg: svgDoc(140, 190, `<defs>${lightGrad('b', '#8ac4ff', '#2f7cf0', '#1a4ea8')}${blur('s', 5)}</defs>
      <ellipse cx="70" cy="178" rx="62" ry="10" fill="#1d2440" opacity=".35" filter="url(#s)"/>
      <rect x="14" y="20" width="112" height="156" rx="16" fill="url(#b)" stroke="#173f88" stroke-width="3"/>
      <rect x="14" y="58" width="112" height="10" fill="#173f88" opacity=".6"/><rect x="14" y="128" width="112" height="10" fill="#173f88" opacity=".6"/>
      <ellipse cx="70" cy="22" rx="56" ry="10" fill="#5aa0f0" stroke="#173f88" stroke-width="3"/>
      <path d="M34 36 V160" stroke="#fff" stroke-width="7" opacity=".35" stroke-linecap="round"/>`),
  };
  const lamp: SvgTex = {
    key: 'mt_lamp', w: 180, h: 160, svg: svgDoc(180, 160, `<defs>${lightGrad('l', '#ffcf7a', '#ff8a1e', '#c45a10', true)}</defs>
      <rect x="86" y="0" width="8" height="60" fill="#5a6070"/>
      <path d="M30 120 Q30 56 90 56 Q150 56 150 120 Z" fill="url(#l)" stroke="#a84a10" stroke-width="3"/>
      <ellipse cx="90" cy="120" rx="60" ry="12" fill="#fff6c4"/>
      <path d="M52 92 Q60 70 84 66" stroke="#fff" stroke-width="5" opacity=".5" fill="none" stroke-linecap="round"/>`),
  };
  const cart: SvgTex = {
    key: 'mt_toolbox', w: 260, h: 240, svg: svgDoc(260, 240, `<defs>${lightGrad('c', '#ff9a8a', '#ef3b3b', '#a82020')}${lightGrad('m', '#ffffff', '#c9d2e0', '#7a869c', true)}${blur('s', 6)}</defs>
      <ellipse cx="130" cy="228" rx="116" ry="10" fill="#1d2440" opacity=".35" filter="url(#s)"/>
      <rect x="20" y="30" width="220" height="170" rx="12" fill="url(#c)" stroke="#8a1a1a" stroke-width="3"/>
      ${[0, 1, 2].map((k) => `<rect x="34" y="${48 + k * 48}" width="192" height="38" rx="6" fill="#d62c2c" stroke="#8a1a1a" stroke-width="2"/><rect x="104" y="${62 + k * 48}" width="52" height="10" rx="5" fill="url(#m)"/>`).join('')}
      <rect x="20" y="22" width="220" height="16" rx="6" fill="url(#m)"/>
      <circle cx="50" cy="214" r="13" fill="#3a3e48"/><circle cx="210" cy="214" r="13" fill="#3a3e48"/>
      <path d="M40 44 H120" stroke="#fff" stroke-width="5" opacity=".35" stroke-linecap="round"/>`),
  };
  return [wall, door, board, floor, lift, tires, barrel, lamp, cart];
}

/** Attrezzi e guasti in officina. */
function repairTextures(): SvgTex[] {
  const icon = (id: RepairId): string => {
    switch (id) {
      case 'ruota': return `<circle cx="60" cy="58" r="30" fill="#34343e"/><circle cx="60" cy="58" r="14" fill="#c9d2e0"/><circle cx="60" cy="58" r="5" fill="#7a869c"/>`;
      case 'gomma': return `<rect x="38" y="44" width="16" height="48" rx="5" fill="#ef3b3b"/><rect x="30" y="34" width="32" height="12" rx="5" fill="#3a3e48"/><path d="M54 82 Q80 92 86 64" stroke="#3a3e48" stroke-width="6" fill="none" stroke-linecap="round"/><path d="M78 40 Q86 30 96 34" stroke="#8fd0ff" stroke-width="6" fill="none" stroke-linecap="round"/>`;
      case 'fango': return `<path d="M60 26 Q84 56 84 70 Q84 92 60 92 Q36 92 36 70 Q36 56 60 26 Z" fill="#4fb8ff" stroke="#1a7ac4" stroke-width="3"/><ellipse cx="51" cy="64" rx="6" ry="10" fill="#fff" opacity=".7"/>`;
      default: return `<g transform="rotate(-40 60 60)"><rect x="54" y="40" width="12" height="56" rx="6" fill="#9aa6c4"/><path d="M42 30 Q42 14 60 14 Q78 14 78 30 L68 38 V46 H52 V38 Z" fill="#c9d2e0" stroke="#7a869c" stroke-width="2"/></g>`;
    }
  };
  const bubbles = REPAIRS.map((id): SvgTex => ({
    key: `mt_need_${id}`, w: 120, h: 132, svg: svgDoc(120, 132, `<defs>${ballGrad('b', '#ffffff', '#f4f7ff', '#cfd8ee')}${blur('s', 4)}</defs>
      <ellipse cx="62" cy="124" rx="24" ry="5" fill="#1d2440" opacity=".25" filter="url(#s)"/>
      <path d="M60 4 A52 52 0 1 1 59.9 4 Z M50 104 L60 124 L72 104 Z" fill="url(#b)" stroke="#ff8a1e" stroke-width="5" stroke-linejoin="round"/>
      ${icon(id)}`),
  }));
  return [
    ...bubbles,
    {
      key: 'mt_mud', w: 110, h: 90, svg: svgDoc(110, 90, `<defs>${ballGrad('m', '#b98a5a', '#8a5a30', '#5a3618')}</defs>
        <path d="M20 40 Q14 18 36 20 Q44 4 62 14 Q86 8 88 30 Q104 40 90 56 Q94 76 72 70 Q66 88 52 74 Q46 86 40 72 Q16 76 20 58 Q4 50 20 40 Z" fill="url(#m)"/>
        <circle cx="96" cy="20" r="6" fill="#8a5a30"/><circle cx="12" cy="72" r="5" fill="#8a5a30"/>
        <ellipse cx="44" cy="30" rx="10" ry="5" fill="#d8b08a" opacity=".6"/>`),
    },
    {
      key: 'mt_smoke', w: 120, h: 100, svg: svgDoc(120, 100, `<defs>${ballGrad('s', '#ffffff', '#c9ced8', '#8a92a6')}</defs>
        <circle cx="40" cy="60" r="28" fill="url(#s)"/><circle cx="70" cy="44" r="32" fill="url(#s)"/><circle cx="86" cy="66" r="24" fill="url(#s)"/>`),
    },
    {
      key: 'mt_pump', w: 120, h: 200, svg: svgDoc(120, 200, `<defs>${lightGrad('p', '#ff9a8a', '#ef3b3b', '#a82020')}${lightGrad('m', '#ffffff', '#c9d2e0', '#7a869c')}</defs>
        <rect x="20" y="180" width="80" height="14" rx="6" fill="#3a3e48"/>
        <rect x="42" y="60" width="36" height="124" rx="12" fill="url(#p)" stroke="#8a1a1a" stroke-width="3"/>
        <rect x="56" y="10" width="8" height="56" fill="url(#m)"/>
        <rect x="24" y="4" width="72" height="16" rx="8" fill="#3a3e48"/>
        <path d="M78 160 Q110 160 112 120" stroke="#3a3e48" stroke-width="7" fill="none" stroke-linecap="round"/>
        <path d="M48 72 V170" stroke="#fff" stroke-width="5" opacity=".4" stroke-linecap="round"/>`),
    },
    {
      key: 'mt_jack', w: 180, h: 110, svg: svgDoc(180, 110, `<defs>${lightGrad('j', '#fff0a0', '#ffcc1f', '#c78a00')}</defs>
        <rect x="10" y="84" width="160" height="20" rx="8" fill="url(#j)" stroke="#a87000" stroke-width="3"/>
        <path d="M40 86 L90 30 L140 86" fill="none" stroke="#c78a00" stroke-width="12" stroke-linejoin="round"/>
        <path d="M40 86 L90 30 L140 86" fill="none" stroke="#ffe066" stroke-width="6" stroke-linejoin="round"/>
        <rect x="70" y="16" width="40" height="18" rx="5" fill="#5a6070"/>
        <circle cx="166" cy="94" r="8" fill="#3a3e48"/><circle cx="14" cy="94" r="8" fill="#3a3e48"/>`),
    },
    {
      key: 'mt_wrench', w: 180, h: 70, svg: svgDoc(180, 70, `<defs>${lightGrad('w', '#ffffff', '#c9d2e0', '#6f7a90', true)}</defs>
        <rect x="40" y="26" width="120" height="18" rx="9" fill="url(#w)" stroke="#5a6480" stroke-width="2"/>
        <path d="M6 20 Q6 4 26 4 Q46 4 50 22 L50 48 Q46 66 26 66 Q6 66 6 50 L26 46 L26 24 Z" fill="url(#w)" stroke="#5a6480" stroke-width="2"/>
        <circle cx="160" cy="35" r="16" fill="url(#w)" stroke="#5a6480" stroke-width="2"/><circle cx="160" cy="35" r="7" fill="#5a6480"/>
        <path d="M60 30 H140" stroke="#fff" stroke-width="4" opacity=".6" stroke-linecap="round"/>`),
    },
    {
      key: 'mt_bubble', w: 60, h: 60, svg: svgDoc(60, 60, `<circle cx="30" cy="30" r="26" fill="#bfe8ff" fill-opacity=".35" stroke="#ffffff" stroke-width="3"/>
        <ellipse cx="21" cy="20" rx="7" ry="4" fill="#fff" opacity=".9" transform="rotate(-35 21 20)"/>`),
    },
  ];
}

// ---------------------------------------------------------------- arena e piste

const FAR: Record<Track['id'], { col: string; haze: string; path: (r: () => number) => string }> = {
  arena: { col: '#d79a6a', haze: '#ffd9b0', path: () => mesas([[0, 210], [150, 150], [260, 150], [300, 210], [520, 220], [600, 120], [760, 120], [800, 200], [1024, 210]]) },
  dune: { col: '#e8b864', haze: '#fff0c8', path: () => `M0 220 Q120 120 260 190 Q380 250 520 160 Q660 80 800 180 Q920 250 1024 220 V360 H0 Z` },
  cantiere: { col: '#a6aebf', haze: '#eef2f8', path: () => cranes() },
  canyon: { col: '#c0603c', haze: '#ffc89a', path: () => mesas([[0, 120], [120, 120], [140, 60], [300, 60], [330, 160], [460, 170], [480, 40], [640, 40], [700, 150], [860, 150], [880, 80], [1000, 80], [1024, 120]]) },
  notte: { col: '#2a2660', haze: '#55408f', path: () => skyline() },
};

function mesas(pts: Array<[number, number]>): string {
  return `M${pts.map(([x, y]) => `${x} ${y}`).join(' L')} V360 H0 Z`;
}

function cranes(): string {
  let d = 'M0 230 Q200 200 400 230 T800 220 T1024 230 V360 H0 Z';
  for (const [x, w, h] of [[120, 120, 120], [430, 90, 160], [700, 140, 100]] as const) d += ` M${x} 230 V${230 - h} H${x + w} V230 Z`;
  // gru: torre e braccio
  d += ' M560 230 V30 H572 V230 Z M480 40 H760 V52 H480 Z M740 52 V120 H744 V52 Z';
  d += ' M880 230 V70 H890 V230 Z M830 76 H1000 V86 H830 Z';
  return d;
}

function skyline(): string {
  let d = 'M0 360 V250';
  let x = 0;
  const r = rng(3);
  while (x < 1024) {
    const w = 50 + Math.floor(r() * 70), h = 90 + Math.floor(r() * 150);
    const nx = Math.min(1024, x + w);
    d += ` H${x} V${250 - h} H${nx} V250`;
    x = nx + 6;
  }
  return d + ' H1024 V360 Z';
}

function trackTextures(t: Track): SvgTex[] {
  const [top, bottom] = t.sky;
  const far = FAR[t.id];
  let lights = '';
  if (t.id === 'notte') {
    const r = rng(9);
    for (let i = 0; i < 90; i++) lights += `<rect x="${(r() * 1010).toFixed(0)}" y="${(40 + r() * 200).toFixed(0)}" width="6" height="8" fill="#ffd86a" opacity="${(0.4 + r() * 0.6).toFixed(2)}"/>`;
  }
  return [
    {
      key: `mt_sky_${t.id}`, w: 16, h: 1080, svg: svgDoc(16, 1080, `<defs><linearGradient id="s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${top}"/><stop offset=".75" stop-color="${bottom}"/><stop offset="1" stop-color="${bottom}"/></linearGradient></defs><rect width="16" height="1080" fill="url(#s)"/>`),
    },
    {
      key: `mt_far_${t.id}`, w: 1024, h: 360, svg: svgDoc(1024, 360, `<defs><linearGradient id="f" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${shade(far.col, 0.12)}"/><stop offset="1" stop-color="${far.col}"/></linearGradient>
        <linearGradient id="hz" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${far.haze}" stop-opacity="0"/><stop offset="1" stop-color="${far.haze}" stop-opacity=".75"/></linearGradient></defs>
        <path d="${far.path(rng(1))}" fill="url(#f)"/>${lights}<rect width="1024" height="360" fill="url(#hz)"/>`),
    },
  ];
}

/** Tribune con il pubblico: normale e mentre esulta (braccia alzate, bandierine). Ripetibili in orizzontale. */
function standsTex(cheer: boolean): SvgTex {
  const r = rng(21);
  const shirts = ['#ff5e5e', '#4fa3ff', '#ffd23f', '#3cc46a', '#ff8a1e', '#b48cff', '#ffffff', '#ff6fb5'];
  const skins = ['#f6d2b0', '#d9a07a', '#8a5a3a', '#f0c49a', '#b97a52'];
  let crowd = '';
  for (let row = 0; row < 4; row++) {
    const y = 74 + row * 52;
    for (let i = 0; i < 26; i++) {
      const x = 22 + i * 39 + (row % 2) * 19;
      if (x > 1010) continue;
      const sh = shirts[Math.floor(r() * shirts.length)], sk = skins[Math.floor(r() * skins.length)];
      const up = cheer && r() < 0.8;
      const flag = r() < 0.12;
      const jump = cheer ? -6 - Math.floor(r() * 8) : 0;
      crowd += `<g transform="translate(${x} ${y + jump})">
        ${up ? `<path d="M-12 16 L-20 -8 M12 16 L20 -8" stroke="${sk}" stroke-width="7" stroke-linecap="round"/>` : ''}
        <rect x="-14" y="8" width="28" height="30" rx="10" fill="${sh}"/>
        <circle cx="0" cy="0" r="13" fill="${sk}"/>
        <path d="M-6 -1 h.1 M6 -1 h.1" stroke="#2b2140" stroke-width="4" stroke-linecap="round"/>
        ${cheer ? '<ellipse cx="0" cy="6" rx="4" ry="3.5" fill="#7a2a2a"/>' : '<path d="M-4 5 Q0 8 4 5" stroke="#2b2140" stroke-width="2" fill="none" stroke-linecap="round"/>'}
        ${flag ? `<path d="M16 ${up ? -40 : 4} V${up ? 10 : 40}" stroke="#5a6070" stroke-width="3"/><path d="M16 ${up ? -40 : 4} L44 ${up ? -32 : 12} L16 ${up ? -24 : 20} Z" fill="${['#ffd23f', '#ff8a1e', '#4fa3ff'][i % 3]}"/>` : ''}
      </g>`;
    }
  }
  let rails = '';
  for (let k = 0; k < 4; k++) rails += `<rect x="0" y="${104 + k * 52}" width="1024" height="12" fill="#9aa2b4"/><rect x="0" y="${104 + k * 52}" width="1024" height="4" fill="#d8dde8"/>`;
  let banners = '';
  for (let i = 0; i < 8; i++) banners += `<rect x="${i * 128 + 4}" y="270" width="120" height="30" fill="${i % 2 ? '#ffcc1f' : '#ff8a1e'}"/>${[0, 1, 2].map((k) => `<path d="${starPath(i * 128 + 34 + k * 30, 285, 9)}" fill="#fff" opacity=".85"/>`).join('')}`;
  return {
    key: cheer ? 'mt_stands_cheer' : 'mt_stands', w: 1024, h: 300, svg: svgDoc(1024, 300, `<defs>${lightGrad('st', '#c9ced8', '#9aa2b4', '#6a7286', true)}</defs>
      <path d="M0 40 H1024 V300 H0 Z" fill="url(#st)"/>
      <rect x="0" y="30" width="1024" height="16" fill="#6a7286"/>
      ${rails}${crowd}${banners}`),
  };
}

/** Barriera a bordo pista: gomme colorate e pannelli a strisce. */
function fenceTex(): SvgTex {
  let s = '';
  for (let i = 0; i < 8; i++) {
    const x = i * 128;
    s += `<rect x="${x + 2}" y="20" width="124" height="66" rx="8" fill="${i % 2 ? '#ffffff' : '#ff8a1e'}" stroke="#c4621a" stroke-width="3"/>
      <path d="M${x + 14} 32 L${x + 46} 32 L${x + 24} 76 L${x - 8} 76 Z M${x + 74} 32 L${x + 106} 32 L${x + 84} 76 L${x + 52} 76 Z" fill="${i % 2 ? '#ffcc1f' : '#ffffff'}" opacity=".85"/>`;
  }
  for (let i = 0; i < 16; i++) s += `<ellipse cx="${i * 64 + 32}" cy="96" rx="32" ry="18" fill="#2a2a33"/><ellipse cx="${i * 64 + 32}" cy="94" rx="14" ry="7" fill="#4a4a56"/>`;
  return { key: 'mt_fence', w: 1024, h: 120, svg: svgDoc(1024, 120, `<rect x="0" y="10" width="1024" height="10" fill="#5a6070"/>${s}`) };
}

function propTextures(): SvgTex[] {
  return [
    {
      key: 'mt_cone', w: 90, h: 110, svg: svgDoc(90, 110, `<defs>${lightGrad('c', '#ffb36a', '#ff6a1e', '#c4400a')}</defs>
        <rect x="6" y="94" width="78" height="12" rx="4" fill="#3a3e48"/>
        <path d="M45 6 L72 96 H18 Z" fill="url(#c)" stroke="#a8380a" stroke-width="3" stroke-linejoin="round"/>
        <path d="M33 46 H57 L61 60 H29 Z M26 70 H64 L67 82 H23 Z" fill="#fff"/>
        <path d="M40 16 L30 88" stroke="#fff" stroke-width="4" opacity=".35"/>`),
    },
    {
      key: 'mt_cactus', w: 120, h: 180, svg: svgDoc(120, 180, `<defs>${lightGrad('c', '#9be07a', '#4cb04a', '#2a7a30')}</defs>
        <path d="M48 176 V30 Q48 10 60 10 Q72 10 72 30 V176 Z M48 100 H30 Q18 100 18 86 V58 Q18 50 26 50 Q34 50 34 58 V84 H48 Z M72 80 H90 V44 Q90 36 98 36 Q106 36 106 44 V82 Q106 96 92 96 H72 Z" fill="url(#c)" stroke="#2a6a2a" stroke-width="3" stroke-linejoin="round"/>
        <path d="M56 24 V170" stroke="#c8f0a8" stroke-width="4" opacity=".6"/>
        <circle cx="60" cy="10" r="8" fill="#ff6fb5"/>`),
    },
    {
      key: 'mt_rock', w: 170, h: 110, svg: svgDoc(170, 110, `<defs>${ballGrad('r', '#e8b08a', '#b9774a', '#7a4426')}</defs>
        <path d="M10 104 Q8 60 40 42 Q60 10 100 20 Q150 26 160 70 Q166 96 156 104 Z" fill="url(#r)" stroke="#6a3a20" stroke-width="3"/>
        <path d="M44 50 Q64 26 96 28" stroke="#fff" stroke-width="5" opacity=".35" fill="none" stroke-linecap="round"/>`),
    },
    {
      key: 'mt_post', w: 120, h: 380, svg: svgDoc(120, 380, `<defs>${lightGrad('p', '#c9ced8', '#7a8296', '#4a5266', true)}${ballGrad('l', '#ffffff', '#fff3a0', '#ffb800')}</defs>
        <rect x="54" y="40" width="12" height="340" fill="url(#p)"/>
        <rect x="14" y="14" width="92" height="40" rx="10" fill="#4a5266"/>
        ${[30, 60, 90].map((x) => `<circle cx="${x}" cy="34" r="12" fill="url(#l)"/>`).join('')}`),
    },
    {
      key: 'mt_box', w: 110, h: 100, svg: svgDoc(110, 100, `<defs>${lightGrad('b', '#f6d2a0', '#d9a066', '#a8743e')}</defs>
        <rect x="8" y="8" width="96" height="88" rx="6" fill="#8a5a2a" opacity=".5"/>
        <rect x="4" y="4" width="96" height="88" rx="6" fill="url(#b)" stroke="#8a5a2a" stroke-width="3"/>
        <rect x="42" y="4" width="20" height="88" fill="#c9e0f0" opacity=".55"/>
        <path d="M20 60 L32 46 L44 60 M32 46 V76" stroke="#8a5a2a" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M70 52 h.1 M84 52 h.1" stroke="#5a3618" stroke-width="7" stroke-linecap="round"/>
        <path d="M70 64 Q77 72 84 64" stroke="#5a3618" stroke-width="4" fill="none" stroke-linecap="round"/>
        <path d="M10 12 H94" stroke="#fff" stroke-width="5" opacity=".45" stroke-linecap="round"/>`),
    },
    {
      key: 'mt_chip', w: 36, h: 28, svg: svgDoc(36, 28, `<path d="M3 6 L30 2 L33 22 L6 26 Z" fill="#d9a066" stroke="#8a5a2a" stroke-width="2"/>`),
    },
    {
      key: 'mt_fg', w: 300, h: 140, svg: svgDoc(300, 140, `<defs>${blur('b', 7)}</defs><g filter="url(#b)">
        <ellipse cx="80" cy="110" rx="70" ry="40" fill="#ffffff"/><ellipse cx="170" cy="100" rx="60" ry="46" fill="#e8e8e8"/><ellipse cx="240" cy="118" rx="50" ry="30" fill="#d0d0d0"/>
        <circle cx="120" cy="76" r="18" fill="#ffffff"/></g>`),
    },
    {
      key: 'mt_finish', w: 560, h: 560, svg: svgDoc(560, 560, (() => {
        let sq = '';
        for (let i = 0; i < 14; i++) for (let j = 0; j < 3; j++) sq += `<rect x="${60 + i * 31.4}" y="${40 + j * 28}" width="31.4" height="28" fill="${(i + j) % 2 ? '#2b2140' : '#ffffff'}"/>`;
        return `<defs>${lightGrad('p', '#ffffff', '#c9d2e0', '#7a869c')}${blur('s', 6)}</defs>
          <ellipse cx="60" cy="548" rx="40" ry="8" fill="#1d2440" opacity=".3" filter="url(#s)"/><ellipse cx="500" cy="548" rx="40" ry="8" fill="#1d2440" opacity=".3" filter="url(#s)"/>
          <rect x="44" y="30" width="30" height="520" rx="10" fill="url(#p)" stroke="#5a6480" stroke-width="3"/>
          <rect x="486" y="30" width="30" height="520" rx="10" fill="url(#p)" stroke="#5a6480" stroke-width="3"/>
          <rect x="56" y="34" width="448" height="92" rx="6" fill="#2b2140"/>${sq}
          <path d="M60 44 H500" stroke="#fff" stroke-width="5" opacity=".35"/>
          <path d="M74 22 L118 10 L74 -2 Z" fill="#ff5e5e" transform="translate(0 12)"/><path d="M516 22 L560 10 L516 -2 Z" fill="#ffd23f" transform="translate(-16 12)"/>
          <circle cx="59" cy="22" r="10" fill="#ffd23f"/><circle cx="501" cy="22" r="10" fill="#ffd23f"/>`;
      })()),
    },
    {
      key: 'mt_moon', w: 200, h: 200, svg: svgDoc(200, 200, `<defs>${ballGrad('m', '#ffffff', '#fff3c4', '#e0c878')}
        <radialGradient id="g"><stop offset=".5" stop-color="#fff3c4" stop-opacity=".5"/><stop offset="1" stop-color="#fff3c4" stop-opacity="0"/></radialGradient></defs>
        <circle cx="100" cy="100" r="98" fill="url(#g)"/><circle cx="100" cy="100" r="54" fill="url(#m)"/>
        <circle cx="84" cy="88" r="9" fill="#e8d496" opacity=".7"/><circle cx="118" cy="118" r="12" fill="#e8d496" opacity=".6"/><circle cx="114" cy="80" r="5" fill="#e8d496" opacity=".6"/>`),
    },
    {
      key: 'mt_flood', w: 180, h: 300, svg: svgDoc(180, 300, `<defs>${lightGrad('p', '#c9ced8', '#7a8296', '#4a5266', true)}${ballGrad('l', '#ffffff', '#fffbe0', '#ffd86a')}</defs>
        <rect x="84" y="90" width="12" height="210" fill="url(#p)"/>
        <rect x="16" y="8" width="148" height="90" rx="10" fill="#3a3e52"/>
        ${[0, 1].map((r) => [0, 1, 2].map((c) => `<circle cx="${46 + c * 44}" cy="${32 + r * 42}" r="17" fill="url(#l)"/>`).join('')).join('')}`),
    },
    {
      key: 'mt_nightsky', w: 512, h: 520, svg: svgDoc(512, 520, (() => {
        const r = rng(17);
        let d = '';
        for (let i = 0; i < 70; i++) d += `<circle cx="${(4 + r() * 504).toFixed(1)}" cy="${(4 + r() * 512).toFixed(1)}" r="${(0.8 + r() * 1.8).toFixed(2)}" fill="#fff" opacity="${(0.4 + r() * 0.6).toFixed(2)}"/>`;
        return d;
      })()),
    },
  ];
}

/** Cartolina di una pista (collezione): cielo, sfondo lontano, terreno con un trampolino. */
function cardTex(t: Track): SvgTex {
  const far = FAR[t.id];
  const [g0, g1, g2] = t.ground;
  return {
    key: `mt_card_${t.id}`, w: 440, h: 300, svg: svgDoc(440, 300, `<defs>
      <linearGradient id="s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${t.sky[0]}"/><stop offset="1" stop-color="${t.sky[1]}"/></linearGradient>
      <linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${g0}"/><stop offset=".4" stop-color="${g1}"/><stop offset="1" stop-color="${g2}"/></linearGradient>
      <clipPath id="c"><rect x="10" y="10" width="420" height="280" rx="26"/></clipPath>${blur('b', 6)}</defs>
      <rect x="16" y="18" width="420" height="280" rx="26" fill="#2b2140" opacity=".3" filter="url(#b)"/>
      <g clip-path="url(#c)">
        <rect x="10" y="10" width="420" height="280" fill="url(#s)"/>
        ${t.id === 'notte' ? '<circle cx="350" cy="70" r="26" fill="#fff3c4"/>' : '<circle cx="350" cy="70" r="30" fill="#fff3a0" opacity=".9"/>'}
        <g transform="translate(10 60) scale(.43 .5)"><path d="${far.path(rng(1))}" fill="${far.col}" opacity=".85"/></g>
        <path d="M10 220 Q90 196 160 220 L250 220 Q300 220 320 168 L326 168 L332 222 Q380 228 430 214 V290 H10 Z" fill="url(#g)"/>
        <path d="M10 220 Q90 196 160 220 L250 220 Q300 220 320 168 L326 168" fill="none" stroke="${t.edge}" stroke-width="6"/>
        <g transform="translate(70 150)"><rect x="0" y="16" width="70" height="26" rx="8" fill="#ff8a1e"/><path d="M26 16 L32 2 H54 L62 16 Z" fill="#ff8a1e"/><path d="M34 6 H52 L57 16 H32 Z" fill="#cfefff"/>
          <circle cx="16" cy="46" r="16" fill="#2a2a33"/><circle cx="58" cy="46" r="16" fill="#2a2a33"/><circle cx="16" cy="46" r="6" fill="#c9d2e0"/><circle cx="58" cy="46" r="6" fill="#c9d2e0"/></g>
        <path d="M20 30 Q60 18 110 24" stroke="#fff" stroke-width="8" opacity=".3" fill="none" stroke-linecap="round"/>
      </g>
      <rect x="10" y="10" width="420" height="280" rx="26" fill="none" stroke="#ffffff" stroke-width="10"/>`),
  };
}

// ---------------------------------------------------------------- interfaccia

/** Riquadro per le scelte in officina, con il colore della categoria. */
function slotTex(): SvgTex {
  return {
    key: 'mt_slot', w: 150, h: 150, svg: svgDoc(150, 150, `<defs>${lightGrad('s', '#ffffff', '#fff6e6', '#f0dcb8', true)}${blur('b', 4)}</defs>
      <rect x="10" y="14" width="130" height="130" rx="30" fill="#7a5030" opacity=".3" filter="url(#b)"/>
      <rect x="8" y="6" width="130" height="130" rx="30" fill="url(#s)" stroke="#f0a24a" stroke-width="5"/>
      <path d="M30 22 H100" stroke="#fff" stroke-width="7" stroke-linecap="round" opacity=".9"/>`),
  };
}

/** Macchia di vernice in grigio (colorata con il tint) e il suo riflesso. */
function swatchTex(): SvgTex[] {
  const d = 'M60 12 Q86 10 96 32 Q118 40 108 64 Q116 92 88 96 Q72 116 52 102 Q24 108 22 82 Q2 66 18 44 Q22 18 46 20 Q50 12 60 12 Z';
  return [
    { key: 'mt_swatch', w: 120, h: 120, svg: svgDoc(120, 120, `<defs>${ballGrad('g', '#ffffff', '#d6d6d6', '#8c8c8c')}</defs><path d="${d}" fill="url(#g)" stroke="#6e6e6e" stroke-width="3"/>`) },
    { key: 'mt_swatch_hi', w: 120, h: 120, svg: svgDoc(120, 120, `<ellipse cx="46" cy="38" rx="16" ry="9" fill="#fff" opacity=".8" transform="rotate(-30 46 38)"/><circle cx="34" cy="56" r="5" fill="#fff" opacity=".6"/>`) },
    { key: 'mt_stk_nessuno', w: 120, h: 120, svg: svgDoc(120, 120, `<circle cx="60" cy="60" r="40" fill="none" stroke="#c9b08a" stroke-width="8" stroke-dasharray="14 10"/>`) },
  ];
}

function hudTextures(): SvgTex[] {
  let dots = '';
  for (let i = 0; i < 17; i++) dots += `<rect x="${66 + i * 41}" y="31" width="20" height="8" rx="4" fill="#ffffff" opacity=".75"/>`;
  return [
    {
      key: 'mt_track', w: 820, h: 70, svg: svgDoc(820, 70, `<rect x="4" y="12" width="812" height="46" rx="23" fill="#3a2a1e" opacity=".5"/>
        <rect x="4" y="12" width="812" height="46" rx="23" fill="none" stroke="#ffd9a0" stroke-width="3" opacity=".7"/>${dots}`),
    },
    {
      key: 'mt_flag', w: 110, h: 120, svg: svgDoc(110, 120, (() => {
        let sq = '';
        for (let i = 0; i < 5; i++) for (let j = 0; j < 4; j++) if ((i + j) % 2 === 0) sq += `<rect x="${20 + i * 16}" y="${12 + j * 14}" width="16" height="14" fill="#2b2140"/>`;
        return `<rect x="10" y="6" width="8" height="110" rx="4" fill="#c9d2e0" stroke="#5a6480" stroke-width="2"/>
          <rect x="20" y="12" width="80" height="56" fill="#fff" stroke="#2b2140" stroke-width="3"/>${sq}`;
      })()),
    },
  ];
}

const ICON_GO = (() => {
  let sq = '';
  for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) if ((i + j) % 2 === 0) sq += `<rect x="${34 + i * 12}" y="${24 + j * 12}" width="12" height="12" fill="#2b8a4a"/>`;
  return `<rect x="26" y="18" width="6" height="66" rx="3" fill="#ffffff"/><rect x="34" y="24" width="48" height="36" fill="#ffffff"/>${sq}`;
})();
const ICON_TRACKS = `<path d="M14 72 Q30 40 50 60 Q70 80 86 40" fill="none" stroke="#ffffff" stroke-width="10" stroke-linecap="round"/>
  <path d="M14 72 Q30 40 50 60 Q70 80 86 40" fill="none" stroke="#c4621a" stroke-width="3" stroke-dasharray="6 6" stroke-linecap="round"/>
  <rect x="76" y="14" width="5" height="32" fill="#fff"/><path d="M81 14 L98 20 L81 26 Z" fill="#fff"/>`;
const ICON_GARAGE = `<g transform="rotate(-40 50 50)"><rect x="43" y="34" width="14" height="58" rx="7" fill="#ffffff"/>
  <path d="M30 26 Q30 8 50 8 Q70 8 70 26 L60 34 V42 H40 V34 Z" fill="#ffffff"/><rect x="45" y="16" width="10" height="14" fill="#e08a00"/></g>`;
const ICON_WHEEL = `<circle cx="50" cy="50" r="34" fill="#ffffff"/><circle cx="50" cy="50" r="17" fill="#3a3e48"/><circle cx="50" cy="50" r="7" fill="#ffffff"/>
  ${[0, 45, 90, 135, 180, 225, 270, 315].map((a) => `<rect x="45" y="12" width="10" height="9" rx="2" fill="#3a3e48" transform="rotate(${a} 50 50)"/>`).join('')}`;
const ICON_PAINT = `<path d="M24 40 L60 26 L76 58 L40 74 Z" fill="#ffffff"/><path d="M60 26 Q74 20 82 36" stroke="#ffffff" stroke-width="6" fill="none"/>
  <path d="M74 56 Q86 70 80 82 Q72 90 68 80 Q66 70 74 56 Z" fill="#ffe066"/><path d="M28 44 L58 32" stroke="#4fa3ff" stroke-width="8"/>`;
const ICON_STICKER = `<path d="${starPath(50, 52, 36)}" fill="#ffffff" stroke="#ffffff" stroke-width="6" stroke-linejoin="round"/><path d="M70 72 L86 86 L86 70 Z" fill="#ffd9a0"/>`;

/** Tutte le texture del gioco (rasterizzate all'apertura del gioco, una volta sola). */
export function gameTextures(): SvgTex[] {
  return [
    bodyTex(), bodyHiTex(), chassisTex(), miniTex(),
    ...WHEELS.flatMap((w) => Array.from({ length: WHEEL_FRAMES }, (_, k) => wheelTex(w, k))), wheelShineTex(),
    ...STICKERS.map(stickerTex).filter((x): x is SvgTex => !!x),
    ...garageTextures(),
    ...repairTextures(),
    ...TRACKS.flatMap(trackTextures),
    ...TRACKS.map(cardTex),
    standsTex(false), standsTex(true), fenceTex(),
    ...propTextures(),
    slotTex(), ...swatchTex(), ...hudTextures(),
    roundButton('mt_btn_go', '#35c46a', ICON_GO, 260),
    roundButton('mt_btn_tracks', '#ff8a1e', ICON_TRACKS, 200),
    roundButton('mt_btn_garage', '#ffb81f', ICON_GARAGE, 200),
    roundButton('mt_cat_wheel', '#5a6478', ICON_WHEEL, 170),
    roundButton('mt_cat_color', '#2f7cf0', ICON_PAINT, 170),
    roundButton('mt_cat_sticker', '#ff6fb5', ICON_STICKER, 170),
  ];
}
