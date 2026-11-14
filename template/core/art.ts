import { svgDoc, type SvgTex } from './textures';

/**
 * Grafica comune a tutti i giochi Tappolino — stile 2.5D (decisione 7):
 * volume con sfumature, luce fissa dall'alto a sinistra, riflessi, ombra propria e ombra portata.
 * Niente tinte piatte né contorni neri spessi: i bordi sono una tonalità più scura dello stesso colore.
 */
export const OUT = '#3a2a52';

let gid = 0;
/** id univoco per gradienti/filtri dentro un singolo SVG. */
export const uid = (p = 'g'): string => `${p}${++gid}`;

/** Gradiente lineare "luce in alto a sinistra": chiaro → base → scuro. */
export function lightGrad(id: string, light: string, base: string, dark: string, vertical = false): string {
  const [x2, y2] = vertical ? ['0', '1'] : ['0.75', '1'];
  return `<linearGradient id="${id}" x1="0" y1="0" x2="${x2}" y2="${y2}">
    <stop offset="0" stop-color="${light}"/><stop offset=".45" stop-color="${base}"/><stop offset="1" stop-color="${dark}"/></linearGradient>`;
}

/** Gradiente radiale con punto luce spostato in alto a sinistra (sfere, cerchi). */
export function ballGrad(id: string, light: string, base: string, dark: string): string {
  return `<radialGradient id="${id}" cx=".35" cy=".3" r=".75">
    <stop offset="0" stop-color="${light}"/><stop offset=".5" stop-color="${base}"/><stop offset="1" stop-color="${dark}"/></radialGradient>`;
}

/** Filtro sfocatura (ombre morbide, primo piano). */
export const blur = (id: string, sd: number): string =>
  `<filter id="${id}" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="${sd}"/></filter>`;

/** Ombra portata ellittica morbida. */
export function groundShadow(cx: number, cy: number, rx: number, ry: number, opacity = 0.28): string {
  const f = uid('sh');
  return `<defs>${blur(f, Math.max(2, ry * 0.45))}</defs><ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="#1d2440" opacity="${opacity}" filter="url(#${f})"/>`;
}

export function starPath(cx: number, cy: number, r: number, inner = 0.48): string {
  let d = '';
  for (let i = 0; i < 10; i++) {
    const rr = i % 2 === 0 ? r : r * inner;
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    d += `${i ? 'L' : 'M'}${(cx + rr * Math.cos(a)).toFixed(1)} ${(cy + rr * Math.sin(a)).toFixed(1)} `;
  }
  return d + 'Z';
}

// Icone bianche con leggera ombra propria (viewBox 100×100).
const ICON_FILL = `fill="#ffffff"`;
const ICONS: Record<string, string> = {
  play: `<path d="M40 27 L76 50 L40 73 Z" ${ICON_FILL} stroke="#ffffff" stroke-width="8" stroke-linejoin="round"/>`,
  next: `<path d="M24 42 H52 V28 L78 50 L52 72 V58 H24 Z" ${ICON_FILL} stroke="#ffffff" stroke-width="4" stroke-linejoin="round"/>`,
  back: `<path d="M76 42 H48 V28 L22 50 L48 72 V58 H76 Z" ${ICON_FILL} stroke="#ffffff" stroke-width="4" stroke-linejoin="round"/>`,
  home: `<path d="M50 20 L84 50 H73 V77 H58 V61 H42 V77 H27 V50 H16 Z" ${ICON_FILL} stroke="#ffffff" stroke-width="3" stroke-linejoin="round"/>`,
  soundOn: `<path d="M20 40 H35 L54 23 V77 L35 60 H20 Z" ${ICON_FILL} stroke="#ffffff" stroke-width="3" stroke-linejoin="round"/>
    <path d="M64 36 Q72 50 64 64 M73 27 Q88 50 73 73" fill="none" stroke="#ffffff" stroke-width="8" stroke-linecap="round"/>`,
  soundOff: `<path d="M20 40 H35 L54 23 V77 L35 60 H20 Z" ${ICON_FILL} stroke="#ffffff" stroke-width="3" stroke-linejoin="round"/>
    <path d="M64 38 L84 62 M84 38 L64 62" stroke="#ffffff" stroke-width="9" stroke-linecap="round"/>`,
  lock: `<path d="M35 46 V35 Q35 20 50 20 Q65 20 65 35 V46" fill="none" stroke="#ffffff" stroke-width="9"/>
    <rect x="26" y="44" width="48" height="36" rx="9" ${ICON_FILL}/>
    <circle cx="50" cy="61" r="6" fill="#8a94a8"/>`,
};

/** Pulsante 3D "a caramella": spessore sotto, sfumatura radiale, riflesso lucido, icona in rilievo. */
export function roundButton(key: string, color: string, icon: string, size = 180, dark?: string, light?: string): SvgTex {
  const g = uid('b'), r = uid('r'), sh = uid('s'), ish = uid('i');
  const d = dark ?? shade(color, -0.32);
  const l = light ?? shade(color, 0.35);
  const body = `<defs>${ballGrad(g, l, color, d)}
      <linearGradient id="${r}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".85"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
      ${blur(sh, 3)}<filter id="${ish}" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="3" stdDeviation="2" flood-color="${shade(color, -0.55)}" flood-opacity=".55"/></filter></defs>
    <ellipse cx="50" cy="96" rx="36" ry="6" fill="#1d2440" opacity=".25" filter="url(#${sh})"/>
    <circle cx="50" cy="54" r="44" fill="${d}"/>
    <circle cx="50" cy="49" r="44" fill="url(#${g})"/>
    <circle cx="50" cy="49" r="43" fill="none" stroke="${shade(color, -0.45)}" stroke-opacity=".35" stroke-width="2"/>
    <ellipse cx="42" cy="24" rx="26" ry="13" fill="url(#${r})" opacity=".75"/>
    <g transform="translate(14 13) scale(.72)" filter="url(#${ish})">${ICONS[icon] ?? icon}</g>`;
  return { key, w: size, h: Math.round(size * 1.05), svg: svgDoc(size, Math.round(size * 1.05), body, 100, 105) };
}

/** Schiarisce (amt>0) o scurisce (amt<0) un colore #rrggbb. */
export function shade(hex: string, amt: number): string {
  const n = parseInt(hex.slice(1), 16);
  const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) =>
    Math.round(amt >= 0 ? c + (255 - c) * amt : c * (1 + amt)));
  return '#' + ch.map((c) => Math.max(0, Math.min(255, c)).toString(16).padStart(2, '0')).join('');
}

export function starSvg(size: number, empty = false): string {
  const g = uid('st');
  if (empty) {
    return svgDoc(size, size, `<path d="${starPath(45, 47, 40)}" fill="#ffffff" fill-opacity=".35" stroke="#ffffff" stroke-opacity=".9" stroke-width="5" stroke-linejoin="round"/>`, 90, 90);
  }
  return svgDoc(size, size, `<defs>${lightGrad(g, '#fff6b0', '#ffcf2e', '#f08c00')}</defs>
    <path d="${starPath(46, 50, 40)}" fill="#c76a00" opacity=".55"/>
    <path d="${starPath(45, 47, 40)}" fill="url(#${g})" stroke="#e08a00" stroke-width="2.5" stroke-linejoin="round"/>
    <path d="${starPath(45, 47, 22)}" fill="#fff" opacity=".18"/>
    <ellipse cx="34" cy="32" rx="9" ry="5" transform="rotate(-30 34 32)" fill="#fff" opacity=".85"/>`, 90, 90);
}

export function commonTextures(): SvgTex[] {
  const hg = uid('h'), hs = uid('hs');
  return [
    roundButton('btn_play', '#35c46a', 'play', 300),
    roundButton('btn_next', '#35c46a', 'next', 240),
    roundButton('btn_home', '#ffb81f', 'home', 150),
    roundButton('btn_back', '#ffb81f', 'back', 150),
    roundButton('btn_sound_on', '#36a9f0', 'soundOn', 130),
    roundButton('btn_sound_off', '#9aa5b8', 'soundOff', 130),
    roundButton('btn_lock', '#8a94a8', 'lock', 110),
    {
      key: 'hand', w: 130, h: 170, svg: svgDoc(130, 170, `<defs>${lightGrad(hg, '#ffe9d6', '#ffcfa8', '#e8a27a')}${blur(hs, 4)}</defs>
      <path d="M52 76 V24 Q52 12 64 12 Q76 12 76 24 V70 Q78 60 90 62 Q100 64 100 76 Q104 68 114 72 Q124 76 122 90 V118
        Q122 156 88 166 H68 Q42 166 32 142 L14 106 Q8 94 18 88 Q28 84 36 94 L52 112 Z" fill="#7a4a3a" opacity=".35" filter="url(#${hs})"/>
      <path d="M48 70 V18 Q48 6 60 6 Q72 6 72 18 V64 Q74 54 86 56 Q96 58 96 70 Q100 62 110 66 Q120 70 118 84 V112
        Q118 150 84 160 H64 Q38 160 28 136 L10 100 Q4 88 14 82 Q24 78 32 88 L48 106 Z"
        fill="url(#${hg})" stroke="#c98763" stroke-width="3" stroke-linejoin="round"/>
      <path d="M72 66 V86 M96 72 V88" stroke="#d99a76" stroke-width="4" stroke-linecap="round"/>
      <ellipse cx="57" cy="20" rx="5" ry="9" fill="#fff" opacity=".65"/>`),
    },
    { key: 'star', w: 90, h: 90, svg: starSvg(90) },
    { key: 'star_empty', w: 90, h: 90, svg: starSvg(90, true) },
    { key: 'heart', w: 80, h: 72, svg: (() => {
      const g = uid('hr');
      return svgDoc(80, 72, `<defs>${ballGrad(g, '#ffc2da', '#ff5e9a', '#d42a6c')}</defs>
        <path d="M40 66 Q6 44 8 22 Q10 6 26 6 Q36 6 40 18 Q44 6 54 6 Q70 6 72 22 Q74 44 40 66 Z" fill="url(#${g})" stroke="#c4245f" stroke-width="2"/>
        <ellipse cx="22" cy="20" rx="7" ry="4.5" transform="rotate(-35 22 20)" fill="#fff" opacity=".85"/>`);
    })() },
    { key: 'dot', w: 32, h: 32, svg: svgDoc(32, 32, `<defs><radialGradient id="d"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient></defs><circle cx="16" cy="16" r="15" fill="url(#d)"/>`) },
    { key: 'confetti', w: 26, h: 16, svg: svgDoc(26, 16, `<defs><linearGradient id="c" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#c8c8c8"/></linearGradient></defs><rect x="1" y="1" width="24" height="14" rx="4" fill="url(#c)"/>`) },
    { key: 'sparkle', w: 60, h: 60, svg: svgDoc(60, 60, `<defs><radialGradient id="s"><stop offset="0" stop-color="#fff"/><stop offset=".6" stop-color="#fff" stop-opacity=".9"/><stop offset="1" stop-color="#fff" stop-opacity=".2"/></radialGradient></defs>
      <path d="M30 2 Q34 26 58 30 Q34 34 30 58 Q26 34 2 30 Q26 26 30 2 Z" fill="url(#s)"/>`) },
    { key: 'glow', w: 160, h: 160, svg: svgDoc(160, 160, `<defs><radialGradient id="g"><stop offset="0" stop-color="#fff" stop-opacity="1"/>
      <stop offset=".4" stop-color="#fff" stop-opacity=".45"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient></defs><circle cx="80" cy="80" r="80" fill="url(#g)"/>`) },
    { key: 'shadow', w: 200, h: 60, svg: svgDoc(200, 60, `<defs><radialGradient id="s"><stop offset="0" stop-color="#1d2440" stop-opacity=".45"/>
      <stop offset="1" stop-color="#1d2440" stop-opacity="0"/></radialGradient></defs><ellipse cx="100" cy="30" rx="100" ry="30" fill="url(#s)"/>`) },
  ];
}
