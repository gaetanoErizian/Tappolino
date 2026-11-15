import { svgDoc, type SvgTex } from '../../core/textures';
import { lightGrad, ballGrad, blur, roundButton, starPath, uid, shade } from '../../core/art';
import { dollTextures } from './dollArt';

/**
 * Grafica dell'Atelier delle Principesse (2.5D, tutta disegnata in codice SVG, originale).
 * Atelier rosa antico, oro e panna con specchio, manichini, lampadario e stoffe; i tre sfondi della sfilata
 * (castello, bosco incantato, festa da ballo); vetrine, pacchi regalo, cornici e pulsanti delle categorie.
 */

const GOLD = { l: '#fff3c4', b: '#e8b84a', d: '#a8741c', o: '#7a5212' };

function mirror(): SvgTex {
  const fr = uid('fr'), gl = uid('gl'), sh = uid('sh');
  let orn = '';
  for (let k = 0; k < 16; k++) {
    const a = (k / 16) * Math.PI * 2;
    orn += `<circle cx="${(260 + Math.cos(a) * 236).toFixed(1)}" cy="${(350 + Math.sin(a) * 326).toFixed(1)}" r="9" fill="${GOLD.l}" stroke="${GOLD.o}" stroke-width="2"/>`;
  }
  return { key: 'at_mirror', w: 520, h: 720, svg: svgDoc(520, 720, `<defs>${lightGrad(fr, GOLD.l, GOLD.b, GOLD.d)}
      <linearGradient id="${gl}" x1="0" y1="0" x2=".6" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset=".35" stop-color="#f6e6f0"/><stop offset=".7" stop-color="#e7cfe0"/><stop offset="1" stop-color="#d6b8cf"/></linearGradient>${blur(sh, 8)}</defs>
    <ellipse cx="268" cy="364" rx="246" ry="336" fill="#5a2a3a" opacity=".25" filter="url(#${sh})"/>
    <ellipse cx="260" cy="350" rx="246" ry="336" fill="url(#${fr})" stroke="${GOLD.o}" stroke-width="4"/>
    <ellipse cx="260" cy="350" rx="214" ry="302" fill="${GOLD.d}"/>
    <ellipse cx="260" cy="350" rx="206" ry="294" fill="url(#${gl})"/>
    <path d="M120 180 Q160 110 230 86" stroke="#fff" stroke-width="22" stroke-linecap="round" opacity=".7"/>
    <path d="M110 260 Q120 220 140 196" stroke="#fff" stroke-width="12" stroke-linecap="round" opacity=".5"/>
    <path d="M330 560 Q370 520 392 450" stroke="#fff" stroke-width="10" stroke-linecap="round" opacity=".35"/>
    ${orn}
    <path d="M200 20 Q260 -14 320 20 Q300 46 260 40 Q220 46 200 20 Z" fill="url(#${fr})" stroke="${GOLD.o}" stroke-width="3"/>
    <path d="M${starPath(260, 22, 16).slice(1)}" fill="#fff6c0" stroke="${GOLD.o}" stroke-width="2"/>`) };
}

function curtain(): SvgTex {
  const c = uid('cu'), t = uid('ct');
  return { key: 'at_curtain', w: 300, h: 980, svg: svgDoc(300, 980, `<defs>${lightGrad(c, '#fffaf0', '#f6e4cc', '#d9bc98')}${lightGrad(t, GOLD.l, GOLD.b, GOLD.d)}</defs>
    <path d="M0 0 H300 Q270 300 196 470 Q180 520 210 600 Q260 760 290 980 H0 Z" fill="url(#${c})" stroke="#c9a77c" stroke-width="3"/>
    <path d="M60 0 Q70 300 120 480 M140 0 Q150 280 176 470 M40 600 Q80 800 90 980 M150 600 Q190 800 210 980" stroke="#c9a77c" stroke-opacity=".55" stroke-width="5" fill="none"/>
    <path d="M100 0 Q110 300 150 480" stroke="#fff" stroke-opacity=".6" stroke-width="10" fill="none"/>
    <path d="M150 470 Q200 452 236 480 Q246 520 216 538 Q180 548 150 520 Z" fill="url(#${t})" stroke="${GOLD.o}" stroke-width="3"/>
    <path d="M228 530 L240 600 M214 536 L218 610" stroke="${GOLD.d}" stroke-width="6" stroke-linecap="round"/>
    <circle cx="240" cy="606" r="9" fill="url(#${t})" stroke="${GOLD.o}" stroke-width="2"/><circle cx="218" cy="616" r="9" fill="url(#${t})" stroke="${GOLD.o}" stroke-width="2"/>`) };
}

function chandelier(): SvgTex {
  const g = uid('ch'), cr = uid('cr');
  let candles = '', drops = '';
  for (const x of [80, 150, 220, 290, 360]) {
    const y = x === 220 ? 150 : Math.abs(x - 220) === 70 ? 168 : 186;
    candles += `<rect x="${x - 9}" y="${y - 52}" width="18" height="52" rx="5" fill="#fffaf0" stroke="#d9c2ae" stroke-width="2"/>
      <path d="M${x} ${y - 78} Q${x + 10} ${y - 62} ${x} ${y - 54} Q${x - 10} ${y - 62} ${x} ${y - 78} Z" fill="#ffcf4a"/><path d="M${x} ${y - 70} Q${x + 4} ${y - 62} ${x} ${y - 58} Q${x - 4} ${y - 62} ${x} ${y - 70} Z" fill="#fff"/>
      <ellipse cx="${x}" cy="${y + 4}" rx="22" ry="8" fill="url(#${g})" stroke="${GOLD.o}" stroke-width="2"/>`;
  }
  for (let k = 0; k < 9; k++) {
    const x = 70 + k * 37.5, y = 230 + (k % 2) * 16;
    drops += `<path d="M${x} ${y - 20} V${y}" stroke="${GOLD.d}" stroke-width="2"/><path d="M${x} ${y} L${x + 8} ${y + 14} L${x} ${y + 28} L${x - 8} ${y + 14} Z" fill="url(#${cr})" stroke="#9ab8d0" stroke-width="1.5"/>`;
  }
  return { key: 'at_chandelier', w: 440, h: 300, svg: svgDoc(440, 300, `<defs>${lightGrad(g, GOLD.l, GOLD.b, GOLD.d)}
      <linearGradient id="${cr}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff"/><stop offset=".5" stop-color="#d6f0ff"/><stop offset="1" stop-color="#ffd6ec"/></linearGradient></defs>
    <path d="M220 0 V110" stroke="${GOLD.d}" stroke-width="6"/>
    <path d="M80 190 Q220 260 360 190 Q330 226 220 236 Q110 226 80 190 Z" fill="url(#${g})" stroke="${GOLD.o}" stroke-width="3"/>
    <path d="M80 190 Q90 140 150 168 M360 190 Q350 140 290 168 M150 168 Q170 120 220 150 Q270 120 290 168" stroke="url(#${g})" stroke-width="9" fill="none" stroke-linecap="round"/>
    <ellipse cx="220" cy="120" rx="30" ry="22" fill="url(#${g})" stroke="${GOLD.o}" stroke-width="3"/>
    ${drops}${candles}`) };
}

function pedestal(): SvgTex {
  const t = uid('pt'), s = uid('ps'), sh = uid('psh');
  return { key: 'at_pedestal', w: 480, h: 160, svg: svgDoc(480, 160, `<defs>${lightGrad(t, '#fff0f4', '#f6c6d2', '#dc94a8', true)}${lightGrad(s, GOLD.l, GOLD.b, GOLD.d, true)}${blur(sh, 6)}</defs>
    <ellipse cx="240" cy="132" rx="228" ry="24" fill="#3a1a2a" opacity=".28" filter="url(#${sh})"/>
    <path d="M20 66 V102 Q240 156 460 102 V66 Z" fill="url(#${s})" stroke="${GOLD.o}" stroke-width="3"/>
    <ellipse cx="240" cy="66" rx="220" ry="46" fill="url(#${t})" stroke="${GOLD.o}" stroke-width="3"/>
    <ellipse cx="240" cy="66" rx="180" ry="34" fill="none" stroke="#fff" stroke-opacity=".7" stroke-width="3" stroke-dasharray="2 10" stroke-linecap="round"/>
    <ellipse cx="170" cy="50" rx="70" ry="10" fill="#fff" opacity=".45"/>`) };
}

/** Stoffe arrotolate e rocchetto in primo piano (sfocati). */
function fabricFg(): SvgTex {
  const a = uid('fa'), b = uid('fb'), c = uid('fc'), f = uid('ff');
  return { key: 'at_fabric', w: 460, h: 320, svg: svgDoc(460, 320, `<defs>${lightGrad(a, '#ffd6e6', '#f29ab8', '#c4567e')}${lightGrad(b, '#fff3d0', '#f2cf7a', '#c49a3a')}${lightGrad(c, '#d8f0ea', '#8fd0c0', '#4a9a88')}${blur(f, 4)}</defs>
    <g filter="url(#${f})">
      <rect x="20" y="150" width="300" height="90" rx="44" fill="url(#${a})"/><ellipse cx="320" cy="195" rx="28" ry="45" fill="#c4567e"/><ellipse cx="320" cy="195" rx="10" ry="16" fill="#8a2f52"/>
      <rect x="70" y="80" width="270" height="80" rx="40" fill="url(#${b})"/><ellipse cx="340" cy="120" rx="26" ry="40" fill="#c49a3a"/>
      <rect x="0" y="230" width="380" height="90" rx="44" fill="url(#${c})"/><ellipse cx="380" cy="275" rx="28" ry="45" fill="#4a9a88"/>
      <path d="M90 170 Q160 180 230 170" stroke="#fff" stroke-opacity=".5" stroke-width="8" fill="none"/>
      <rect x="380" y="150" width="60" height="110" rx="10" fill="#ffd84a"/><rect x="370" y="140" width="80" height="18" rx="6" fill="#c49a3a"/><rect x="370" y="254" width="80" height="18" rx="6" fill="#c49a3a"/>
    </g>`) };
}

/** Vetrina di un capo: cuscino panna con cornice d'oro. */
function slotCard(key: string, glow: boolean): SvgTex {
  const g = uid('sl'), s = uid('ss'), fr = uid('sf');
  return { key, w: 220, h: 250, svg: svgDoc(220, 250, `<defs>${lightGrad(g, '#fffdf8', '#fbefe2', '#ecd2bc', true)}${lightGrad(fr, GOLD.l, GOLD.b, GOLD.d)}${blur(s, 5)}</defs>
    <rect x="18" y="26" width="190" height="214" rx="40" fill="#3a1a2a" opacity=".22" filter="url(#${s})"/>
    <rect x="10" y="10" width="200" height="224" rx="40" fill="url(#${fr})" stroke="${GOLD.o}" stroke-width="3"/>
    <rect x="20" y="20" width="180" height="204" rx="32" fill="url(#${g})"/>
    ${glow ? `<rect x="20" y="20" width="180" height="204" rx="32" fill="#ffb3d1" opacity=".55"/><rect x="24" y="24" width="172" height="196" rx="30" fill="none" stroke="#fff" stroke-width="5" stroke-dasharray="4 12" stroke-linecap="round"/>` : ''}
    <path d="M40 40 Q110 26 180 40" stroke="#fff" stroke-width="8" stroke-linecap="round" opacity=".8"/>`) };
}

/** Pacco regalo: un capo o un amico ancora da scoprire. */
function gift(): SvgTex {
  const b = uid('gb'), l = uid('gl'), r = uid('gr'), s = uid('gs');
  return { key: 'at_gift', w: 200, h: 210, svg: svgDoc(200, 210, `<defs>${lightGrad(b, '#ffd6e6', '#f28ab4', '#c4507e')}${lightGrad(l, '#ffe6f0', '#ff9cc4', '#d4609a')}${lightGrad(r, GOLD.l, GOLD.b, GOLD.d)}${blur(s, 5)}</defs>
    <ellipse cx="100" cy="198" rx="74" ry="10" fill="#3a1a2a" opacity=".3" filter="url(#${s})"/>
    <rect x="30" y="92" width="140" height="104" rx="12" fill="url(#${b})" stroke="#9c3a64" stroke-width="3"/>
    <rect x="22" y="70" width="156" height="34" rx="10" fill="url(#${l})" stroke="#9c3a64" stroke-width="3"/>
    <rect x="88" y="70" width="24" height="126" fill="url(#${r})" stroke="${GOLD.o}" stroke-width="2.5"/>
    <path d="M100 72 Q60 20 44 48 Q40 72 100 72 Z M100 72 Q140 20 156 48 Q160 72 100 72 Z" fill="url(#${r})" stroke="${GOLD.o}" stroke-width="3" stroke-linejoin="round"/>
    <circle cx="100" cy="70" r="12" fill="url(#${r})" stroke="${GOLD.o}" stroke-width="3"/>
    <path d="${starPath(60, 140, 10)}" fill="#fff" opacity=".7"/><path d="${starPath(144, 160, 8)}" fill="#fff" opacity=".7"/>
    <ellipse cx="54" cy="80" rx="18" ry="5" fill="#fff" opacity=".7"/>`) };
}

/** Cornice dorata per i ritratti (centro trasparente). */
function frame(): SvgTex {
  const g = uid('fr'), s = uid('fs');
  let orn = '';
  for (const [x, y] of [[20, 20], [340, 20], [20, 300], [340, 300]]) orn += `<circle cx="${x}" cy="${y}" r="16" fill="url(#${g})" stroke="${GOLD.o}" stroke-width="3"/><path d="${starPath(x, y, 8)}" fill="#fff6c0"/>`;
  return { key: 'at_frame', w: 360, h: 320, svg: svgDoc(360, 320, `<defs>${lightGrad(g, GOLD.l, GOLD.b, GOLD.d)}${blur(s, 5)}</defs>
    <path d="M10 10 H350 V310 H10 Z M36 36 V284 H324 V36 Z" fill="#3a1a2a" opacity=".25" filter="url(#${s})" fill-rule="evenodd" transform="translate(4 8)"/>
    <path d="M8 8 H352 V312 H8 Z M34 34 V286 H326 V34 Z" fill="url(#${g})" stroke="${GOLD.o}" stroke-width="3" fill-rule="evenodd"/>
    <rect x="34" y="34" width="292" height="252" fill="none" stroke="${GOLD.d}" stroke-width="5"/>
    <path d="M20 18 H300" stroke="#fff" stroke-width="5" opacity=".6" stroke-linecap="round"/>
    ${orn}
    <path d="M150 0 Q180 -6 210 0 Q200 22 180 18 Q160 22 150 0 Z" fill="url(#${g})" stroke="${GOLD.o}" stroke-width="2.5" transform="translate(0 6)"/>`) };
}

// ---------------------------------------------------------------- sfondi della sfilata
function castle(): SvgTex {
  const w = uid('cw'), r = uid('cr'), d = uid('cd'), win = uid('cn');
  const tower = (x: number, y: number, wd: number, h: number) => `
    <rect x="${x - wd / 2}" y="${y}" width="${wd}" height="${h}" fill="url(#${w})" stroke="#c48a9a" stroke-width="3"/>
    <path d="M${x - wd / 2 - 14} ${y + 4} L${x} ${y - wd * 1.5} L${x + wd / 2 + 14} ${y + 4} Z" fill="url(#${r})" stroke="#3a4a9a" stroke-width="3" stroke-linejoin="round"/>
    <path d="M${x} ${y - wd * 1.5} V${y - wd * 1.5 - 44}" stroke="#a8741c" stroke-width="4"/><path d="M${x} ${y - wd * 1.5 - 44} L${x + 40} ${y - wd * 1.5 - 34} L${x} ${y - wd * 1.5 - 24} Z" fill="#ff6fae"/>
    <path d="M${x - 14} ${y + 70} Q${x} ${y + 46} ${x + 14} ${y + 70} V${y + 110} H${x - 14} Z" fill="url(#${win})" stroke="#a8741c" stroke-width="3"/>`;
  return { key: 'at_castle', w: 1000, h: 760, svg: svgDoc(1000, 760, `<defs>${lightGrad(w, '#fff8f4', '#f8dfe4', '#e2b4c0')}${lightGrad(r, '#a8c4ff', '#5a78e0', '#33489e')}${lightGrad(d, '#c48a5a', '#8a5a34', '#5a3618', true)}
      <linearGradient id="${win}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff6c0"/><stop offset="1" stop-color="#ffcf4a"/></linearGradient></defs>
    ${tower(140, 250, 120, 510)}${tower(860, 250, 120, 510)}
    <rect x="200" y="330" width="600" height="430" fill="url(#${w})" stroke="#c48a9a" stroke-width="3"/>
    ${[...Array(10)].map((_, i) => `<rect x="${206 + i * 60}" y="300" width="36" height="40" fill="url(#${w})" stroke="#c48a9a" stroke-width="3"/>`).join('')}
    ${tower(370, 150, 110, 200)}${tower(630, 150, 110, 200)}
    ${tower(500, 40, 150, 300)}
    <path d="M420 760 V600 Q500 520 580 600 V760 Z" fill="url(#${d})" stroke="#4a2810" stroke-width="4"/>
    <path d="M500 548 V760" stroke="#4a2810" stroke-width="3"/>
    ${[[280, 470], [720, 470], [280, 600], [720, 600]].map(([x, y]) => `<path d="M${x - 22} ${y + 40} V${y} Q${x} ${y - 26} ${x + 22} ${y} V${y + 40} Z" fill="url(#${win})" stroke="#a8741c" stroke-width="3"/>`).join('')}
    <path d="M220 360 H780" stroke="#fff" stroke-opacity=".6" stroke-width="6"/>
    <path d="M330 420 Q500 380 670 420" stroke="#ff8cc6" stroke-width="10" fill="none" stroke-linecap="round"/>
    ${[350, 420, 500, 580, 650].map((x, i) => `<path d="${starPath(x, 400 + (i % 2) * 14, 9)}" fill="#ffd84a"/>`).join('')}`) };
}

function hills(key: string, top: string, bottom: string, opacity = 1): SvgTex {
  const g = uid('hl');
  return { key, w: 2400, h: 420, svg: svgDoc(2400, 420, `<defs><linearGradient id="${g}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${top}"/><stop offset="1" stop-color="${bottom}"/></linearGradient></defs>
    <path d="M0 420 V220 Q200 80 420 180 Q640 60 900 170 Q1120 40 1380 160 Q1600 70 1840 170 Q2100 60 2400 200 V420 Z" fill="url(#${g})" opacity="${opacity}"/>`) };
}

function hedge(): SvgTex {
  const g = uid('hg');
  let b = '';
  for (let i = 0; i < 9; i++) b += `<circle cx="${40 + i * 70}" cy="${70 + (i % 2) * 10}" r="${52 + (i % 3) * 6}" fill="url(#${g})" stroke="#2f6e2a" stroke-width="3"/>`;
  for (let i = 0; i < 7; i++) b += `<circle cx="${70 + i * 82}" cy="${60 + (i % 2) * 12}" r="9" fill="${i % 2 ? '#ff8fbf' : '#fff'}" stroke="#c4467e" stroke-width="1.5"/>`;
  const base = uid('hb');
  return { key: 'at_hedge', w: 640, h: 200, svg: svgDoc(640, 200, `<defs>${ballGrad(g, '#b8f0a0', '#5fbf5a', '#2f8a3a')}${lightGrad(base, '#6cc45f', '#4aa64a', '#2f7a34', true)}</defs>
    <path d="M10 196 V96 Q10 70 40 70 H600 Q630 70 630 96 V196 Z" fill="url(#${base})" stroke="#2f6e2a" stroke-width="3"/>${b}`) };
}

function rosesFg(): SvgTex {
  const g = uid('rg'), f = uid('rf');
  let r = '';
  for (const [x, y, s] of [[90, 200, 46], [200, 150, 52], [320, 210, 44], [150, 280, 50], [280, 300, 46], [400, 280, 40]]) {
    r += `<circle cx="${x}" cy="${y}" r="${s}" fill="#ff7fb0"/><path d="M${x - s * 0.5} ${y} Q${x} ${y - s * 0.7} ${x + s * 0.5} ${y} Q${x} ${y + s * 0.4} ${x - s * 0.5} ${y} Z" fill="#ffb8d4"/><circle cx="${x}" cy="${y}" r="${s * 0.22}" fill="#e0508a"/>`;
  }
  return { key: 'at_roses', w: 500, h: 420, svg: svgDoc(500, 420, `<defs>${ballGrad(g, '#a8e890', '#4aa64a', '#2a6e2a')}${blur(f, 6)}</defs>
    <g filter="url(#${f})"><ellipse cx="250" cy="330" rx="250" ry="140" fill="url(#${g})"/>${r}</g>`) };
}

function tree(): SvgTex {
  const t = uid('tt'), l = uid('tl');
  return { key: 'at_tree', w: 520, h: 1000, svg: svgDoc(520, 1000, `<defs>${lightGrad(t, '#c49a6a', '#8a5a34', '#4a2810')}${ballGrad(l, '#b8f0a0', '#4aa64a', '#1f5e2a')}</defs>
    <path d="M220 1000 Q236 700 214 470 L306 470 Q284 700 300 1000 Z" fill="url(#${t})" stroke="#3a1e08" stroke-width="3"/>
    <path d="M250 640 Q300 600 340 610 M240 760 Q200 720 170 730" stroke="#3a1e08" stroke-width="3" fill="none" opacity=".5"/>
    <circle cx="260" cy="300" r="200" fill="url(#${l})" stroke="#1f4a22" stroke-width="3"/>
    <circle cx="120" cy="400" r="120" fill="url(#${l})" stroke="#1f4a22" stroke-width="3"/>
    <circle cx="400" cy="400" r="120" fill="url(#${l})" stroke="#1f4a22" stroke-width="3"/>
    <circle cx="260" cy="150" r="130" fill="url(#${l})" stroke="#1f4a22" stroke-width="3"/>
    ${[[160, 260], [320, 220], [380, 380], [140, 420], [250, 380], [220, 120]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="10" fill="#fff6c0" opacity=".85"/>`).join('')}
    <ellipse cx="200" cy="140" rx="50" ry="20" fill="#fff" opacity=".2"/>`) };
}

function mushroom(): SvgTex {
  const c = uid('mc'), s = uid('ms');
  return { key: 'at_mushroom', w: 220, h: 200, svg: svgDoc(220, 200, `<defs>${ballGrad(c, '#ffb8c8', '#ff5e7a', '#c42a4a')}${lightGrad(s, '#fffaf0', '#f6e4cc', '#d9bc98')}</defs>
    <ellipse cx="110" cy="188" rx="60" ry="10" fill="#1d2440" opacity=".25"/>
    <path d="M86 186 Q80 130 92 104 H128 Q140 130 134 186 Z" fill="url(#${s})" stroke="#bfa27c" stroke-width="3"/>
    <path d="M14 110 Q20 20 110 16 Q200 20 206 110 Q110 126 14 110 Z" fill="url(#${c})" stroke="#9c1c3a" stroke-width="3"/>
    <circle cx="70" cy="66" r="14" fill="#fff"/><circle cx="130" cy="48" r="11" fill="#fff"/><circle cx="160" cy="88" r="12" fill="#fff"/><circle cx="96" cy="96" r="8" fill="#fff"/>`) };
}

function fernFg(): SvgTex {
  const f = uid('nf');
  let leaves = '';
  for (let k = 0; k < 7; k++) {
    const a = -150 + k * 20, len = 300 - Math.abs(k - 3) * 30;
    leaves += `<ellipse cx="${len / 2}" cy="0" rx="${len / 2}" ry="${34 - Math.abs(k - 3) * 3}" fill="${k % 2 ? '#3f9a4a' : '#56b85a'}" transform="translate(260 420) rotate(${a})"/>`;
  }
  return { key: 'at_ferns', w: 520, h: 440, svg: svgDoc(520, 440, `<defs>${blur(f, 6)}</defs><g filter="url(#${f})">${leaves}</g>`) };
}

function garland(): SvgTex {
  const cols = ['#ff8cc6', '#ffd04d', '#8fd3ff', '#b58cf0', '#79e0a6'];
  let flags = '';
  for (let i = 0; i < 12; i++) {
    const x = 40 + i * 80, y = 30 + Math.sin((i / 11) * Math.PI) * 60;
    flags += `<path d="M${x - 30} ${y} L${x + 30} ${y} L${x} ${y + 64} Z" fill="${cols[i % 5]}" stroke="${shade(cols[i % 5], -0.35)}" stroke-width="2.5" stroke-linejoin="round"/><path d="M${x - 20} ${y + 6} L${x - 4} ${y + 6}" stroke="#fff" stroke-width="4" opacity=".6"/>`;
  }
  return { key: 'at_garland', w: 960, h: 170, svg: svgDoc(960, 170, `<path d="M0 26 Q480 130 960 26" stroke="#a8741c" stroke-width="4" fill="none"/>${flags}`) };
}

function balloons(): SvgTex {
  const f = uid('bf');
  let b = '';
  for (const [x, y, c] of [[110, 140, '#ff8cc6'], [230, 110, '#ffd04d'], [170, 250, '#8fd3ff'], [300, 230, '#b58cf0']] as const) {
    const g = uid('bb');
    b += `<defs>${ballGrad(g, shade(c, 0.5), c, shade(c, -0.3))}</defs><path d="M${x} ${y + 92} Q${x + 20} ${y + 200} ${x - 10} ${y + 360}" stroke="#a8741c" stroke-width="3" fill="none"/>
      <ellipse cx="${x}" cy="${y}" rx="76" ry="90" fill="url(#${g})"/><path d="M${x - 8} ${y + 88} L${x + 8} ${y + 88} L${x} ${y + 100} Z" fill="${shade(c, -0.3)}"/><ellipse cx="${x - 26}" cy="${y - 36}" rx="16" ry="26" fill="#fff" opacity=".55" transform="rotate(-25 ${x - 26} ${y - 36})"/>`;
  }
  return { key: 'at_balloons', w: 400, h: 620, svg: svgDoc(400, 620, `<defs>${blur(f, 4)}</defs><g filter="url(#${f})">${b}</g>`) };
}

function ballWindow(): SvgTex {
  const g = uid('bw'), fr = uid('bf');
  return { key: 'at_window', w: 300, h: 560, svg: svgDoc(300, 560, `<defs>
      <linearGradient id="${g}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a2f7a"/><stop offset=".6" stop-color="#6a4fb0"/><stop offset="1" stop-color="#e88ac0"/></linearGradient>${lightGrad(fr, GOLD.l, GOLD.b, GOLD.d)}</defs>
    <path d="M20 560 V160 Q150 -30 280 160 V560 Z" fill="url(#${fr})" stroke="${GOLD.o}" stroke-width="3"/>
    <path d="M40 540 V170 Q150 10 260 170 V540 Z" fill="url(#${g})"/>
    <path d="M150 40 V540 M40 300 H260" stroke="${GOLD.b}" stroke-width="8"/>
    ${[[80, 120], [210, 150], [100, 230], [230, 260], [180, 90]].map(([x, y]) => `<path d="${starPath(x, y, 7)}" fill="#fff6c0"/>`).join('')}
    <circle cx="90" cy="200" r="22" fill="#fff6c0"/><circle cx="98" cy="194" r="20" fill="#4f4196"/>`) };
}

// ---------------------------------------------------------------- miniature degli sfondi (scelta e galleria)
function thumb(bg: 'castle' | 'forest' | 'party'): SvgTex {
  let body = '';
  if (bg === 'castle') {
    body = `<defs><linearGradient id="s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8fd3ff"/><stop offset="1" stop-color="#ffe2ec"/></linearGradient></defs>
      <rect width="300" height="220" fill="url(#s)"/><circle cx="250" cy="44" r="22" fill="#fff3a0"/>
      <path d="M0 170 Q80 120 160 150 Q230 120 300 150 V220 H0 Z" fill="#b8e4a8"/>
      <rect x="90" y="80" width="120" height="90" fill="#f8dfe4" stroke="#c48a9a" stroke-width="3"/>
      <rect x="70" y="60" width="34" height="110" fill="#f8dfe4" stroke="#c48a9a" stroke-width="3"/><rect x="196" y="60" width="34" height="110" fill="#f8dfe4" stroke="#c48a9a" stroke-width="3"/>
      <path d="M64 62 L87 22 L110 62 Z M190 62 L213 22 L236 62 Z" fill="#5a78e0" stroke="#33489e" stroke-width="3"/>
      <rect x="130" y="50" width="40" height="50" fill="#f8dfe4" stroke="#c48a9a" stroke-width="3"/><path d="M124 52 L150 6 L176 52 Z" fill="#5a78e0" stroke="#33489e" stroke-width="3"/>
      <path d="M134 170 V140 Q150 124 166 140 V170 Z" fill="#8a5a34"/>
      <path d="M120 220 L136 170 H164 L180 220 Z" fill="#e0508a"/>`;
  } else if (bg === 'forest') {
    body = `<defs><linearGradient id="s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c8f0d8"/><stop offset="1" stop-color="#7fcf8a"/></linearGradient></defs>
      <rect width="300" height="220" fill="url(#s)"/>
      <path d="M120 0 L160 0 L230 220 L60 220 Z" fill="#fffbe0" opacity=".5"/>
      <rect x="30" y="80" width="26" height="140" fill="#8a5a34"/><circle cx="43" cy="70" r="56" fill="#3f9a4a"/>
      <rect x="240" y="70" width="26" height="150" fill="#8a5a34"/><circle cx="253" cy="60" r="58" fill="#2f8a3a"/>
      <path d="M0 200 Q150 170 300 200 V220 H0 Z" fill="#4aa64a"/>
      <path d="M110 200 Q114 180 120 172 H136 Q142 180 140 200 Z" fill="#fff6e6"/><path d="M96 176 Q128 140 160 176 Z" fill="#ff5e7a"/>
      ${[[90, 110], [200, 90], [160, 140], [70, 160], [220, 150]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="5" fill="#fff6a0"/>`).join('')}`;
  } else {
    body = `<defs><linearGradient id="s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5a3f9a"/><stop offset="1" stop-color="#e88ac0"/></linearGradient></defs>
      <rect width="300" height="220" fill="url(#s)"/>
      <path d="M0 160 H300 V220 H0 Z" fill="#fff0f6"/>${[...Array(6)].map((_, i) => `<rect x="${i * 50}" y="${160 + (i % 2) * 30}" width="50" height="30" fill="#f2b8d0"/>`).join('')}
      <path d="M0 20 Q150 70 300 20" stroke="#a8741c" stroke-width="3" fill="none"/>
      ${[...Array(7)].map((_, i) => `<path d="M${20 + i * 44} ${22 + Math.sin((i / 6) * Math.PI) * 24} l14 0 l-7 18 Z" fill="${['#ff8cc6', '#ffd04d', '#8fd3ff', '#79e0a6'][i % 4]}"/>`).join('')}
      <ellipse cx="50" cy="110" rx="26" ry="32" fill="#ff8cc6"/><ellipse cx="250" cy="100" rx="26" ry="32" fill="#ffd04d"/><ellipse cx="270" cy="130" rx="22" ry="28" fill="#8fd3ff"/>
      <circle cx="150" cy="70" r="26" fill="#ffd04d" opacity=".9"/><circle cx="150" cy="70" r="40" fill="#fff6c0" opacity=".3"/>`;
  }
  return { key: `at_thumb_${bg}`, w: 300, h: 220, svg: svgDoc(300, 220, body) };
}

// ---------------------------------------------------------------- icone delle categorie
const TAB_ICON: Record<string, string> = {
  dress: `<path d="M38 18 Q50 26 62 18 L66 40 Q64 48 60 52 L80 86 Q50 96 20 86 L40 52 Q36 48 34 40 Z" fill="#fff" stroke="#fff" stroke-width="4" stroke-linejoin="round"/>`,
  head: `<path d="M20 72 L16 30 L36 48 L50 20 L64 48 L84 30 L80 72 Z" fill="#fff" stroke="#fff" stroke-width="5" stroke-linejoin="round"/><circle cx="50" cy="16" r="6" fill="#fff"/>`,
  feet: `<path d="M18 60 Q20 46 40 46 Q50 46 56 54 L80 58 Q92 62 88 74 Q60 80 24 76 Q14 72 18 60 Z" fill="#fff" stroke="#fff" stroke-width="4" stroke-linejoin="round"/><path d="M80 74 V84" stroke="#fff" stroke-width="7" stroke-linecap="round"/>`,
  extra: `<path d="${starPath(56, 44, 26)}" fill="#fff"/><path d="M42 58 L20 84" stroke="#fff" stroke-width="9" stroke-linecap="round"/>`,
  gallery: `<rect x="16" y="22" width="68" height="58" rx="6" fill="none" stroke="#fff" stroke-width="8"/><path d="M26 72 L44 50 L56 62 L64 54 L76 72 Z" fill="#fff"/><circle cx="66" cy="38" r="7" fill="#fff"/>`,
};
export const TAB_COLOR: Record<string, string> = { dress: '#ee6fa8', head: '#e8a826', feet: '#9a6be0', extra: '#2fb8a8' };

export function gameTextures(): SvgTex[] {
  return [
    ...dollTextures(),
    mirror(), curtain(), chandelier(), pedestal(), fabricFg(), gift(), frame(),
    slotCard('at_slot', false), slotCard('at_slot_on', true),
    castle(), hills('at_hills', '#cfe0f4', '#e9f0f8', 0.95), hills('at_hills_near', '#a8dc90', '#7cc46a'), hedge(), rosesFg(),
    tree(), mushroom(), fernFg(), hills('at_forest_far', '#8fc8a0', '#c8ead4', 0.9),
    garland(), balloons(), ballWindow(),
    thumb('castle'), thumb('forest'), thumb('party'),
    ...(['dress', 'head', 'feet', 'extra'] as const).map((c) => roundButton(`at_tab_${c}`, TAB_COLOR[c], TAB_ICON[c], 170)),
    roundButton('at_btn_gallery', '#e8a826', TAB_ICON.gallery, 170),
  ];
}
