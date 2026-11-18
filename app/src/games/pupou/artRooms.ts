import { svgDoc, type SvgTex } from '../../core/textures';
import { lightGrad, ballGrad, blur, starPath } from '../../core/art';

/**
 * Stanze e mobili di Pupou. Gli sfondi sono 1300×750 e si mostrano ingranditi ×2 centrati sull'area di design
 * (coprono anche gli schermi molto larghi o molto alti); il pavimento comincia a y=500 (y=790 nell'area di design).
 * I mobili sono sprite nitidi a parte: toccarli fa partire le attività.
 */
const T = (key: string, w: number, h: number, body: string, vbW = w, vbH = h): SvgTex => ({ key, w, h, svg: svgDoc(w, h, body, vbW, vbH) });
const BW = 1300, BH = 750, FLOOR = 500;
const rep = (n: number, f: (i: number) => string): string => [...Array(n)].map((_, i) => f(i)).join('');
const floorShade = `<linearGradient id="fs" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1d2440" stop-opacity=".22"/><stop offset=".25" stop-color="#1d2440" stop-opacity="0"/><stop offset="1" stop-color="#1d2440" stop-opacity=".18"/></linearGradient>`;
const windowAt = (x: number, y: number, w: number, h: number, sky: string, extra: string): string => `<rect x="${x - 10}" y="${y - 10}" width="${w + 20}" height="${h + 20}" rx="10" fill="#fff" stroke="#c9b893" stroke-width="4"/>
  <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${sky}"/>${extra}<rect x="${x + w / 2 - 4}" y="${y}" width="8" height="${h}" fill="#fff"/><rect x="${x}" y="${y + h / 2 - 4}" width="${w}" height="8" fill="#fff"/>
  <rect x="${x - 22}" y="${y + h + 8}" width="${w + 44}" height="14" rx="6" fill="#f3e4c4" stroke="#c9b893" stroke-width="3"/>`;

function kitchenBg(): string {
  return `<defs><linearGradient id="w" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff4cf"/><stop offset="1" stop-color="#ffdf9a"/></linearGradient>
    <linearGradient id="sk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8fd3ff"/><stop offset="1" stop-color="#d8f2ff"/></linearGradient>${floorShade}${lightGrad('sh', '#e8b878', '#c98a48', '#9a6428', true)}</defs>
    <rect width="${BW}" height="${FLOOR}" fill="url(#w)"/>
    <g stroke="#ffcf7a" stroke-width="10" opacity=".35">${rep(22, (i) => `<path d="M${i * 62 + 10} 0 V330"/>`)}</g>
    <rect y="330" width="${BW}" height="170" fill="#fdfdf6"/><g stroke="#bfe0ea" stroke-width="3">${rep(33, (i) => `<path d="M${i * 42} 330 V500"/>`)}${rep(4, (i) => `<path d="M0 ${330 + i * 42} H${BW}"/>`)}</g>
    <rect y="322" width="${BW}" height="12" fill="#ff9a3c"/>
    ${windowAt(540, 70, 220, 170, 'url(#sk)', `<circle cx="712" cy="112" r="22" fill="#fff3a0"/><g fill="#fff"><circle cx="590" cy="170" r="20"/><circle cx="618" cy="160" r="26"/><circle cx="650" cy="174" r="18"/></g><path d="M540 240 Q600 196 660 220 Q720 200 760 240 Z" fill="#8fd47a"/>`)}
    <path d="M522 56 H778 V96 Q746 116 714 96 Q682 116 650 96 Q618 116 586 96 Q554 116 522 96 Z" fill="#f2553d" stroke="#b82a1a" stroke-width="3"/>
    <g><rect x="150" y="212" width="280" height="16" rx="6" fill="url(#sh)" stroke="#8a5a22" stroke-width="3"/>
      <rect x="176" y="146" width="50" height="66" rx="10" fill="#bfe8ff" stroke="#6fb4dc" stroke-width="3"/><rect x="172" y="136" width="58" height="14" rx="6" fill="#f2553d"/><circle cx="201" cy="186" r="14" fill="#ff8a2a"/>
      <rect x="250" y="156" width="46" height="56" rx="10" fill="#fff0c0" stroke="#d9a54a" stroke-width="3"/><rect x="246" y="146" width="54" height="14" rx="6" fill="#35c46a"/>
      <rect x="322" y="136" width="56" height="76" rx="10" fill="#ffd0e4" stroke="#d96a9a" stroke-width="3"/><rect x="318" y="126" width="64" height="14" rx="6" fill="#7a6ff0"/></g>
    <g><rect x="870" y="212" width="280" height="16" rx="6" fill="url(#sh)" stroke="#8a5a22" stroke-width="3"/>
      <ellipse cx="930" cy="176" rx="40" ry="38" fill="#fff" stroke="#9fb4d6" stroke-width="3"/><ellipse cx="930" cy="176" rx="24" ry="22" fill="#e4eefc"/>
      <ellipse cx="1016" cy="182" rx="34" ry="32" fill="#fff" stroke="#9fb4d6" stroke-width="3"/><ellipse cx="1016" cy="182" rx="20" ry="18" fill="#e4eefc"/>
      <path d="M1072 212 V160 Q1072 148 1086 148 H1114 Q1128 148 1128 160 V212 Z" fill="#8fd6c8" stroke="#3f9a8a" stroke-width="3"/><path d="M1128 166 Q1150 168 1148 186 Q1146 200 1128 198" fill="none" stroke="#3f9a8a" stroke-width="6"/></g>
    <rect y="${FLOOR}" width="${BW}" height="${BH - FLOOR}" fill="#ffe9c4"/>
    <g fill="#ffb96a">${rep(4, (r) => rep(11, (c) => `<rect x="${c * 130 + (r % 2) * 65 - 30}" y="${FLOOR + r * 65}" width="65" height="65"/>`))}</g>
    <rect y="${FLOOR}" width="${BW}" height="${BH - FLOOR}" fill="url(#fs)"/><rect y="${FLOOR - 6}" width="${BW}" height="12" fill="#c98a48"/>`;
}

function bathBg(): string {
  return `<defs><linearGradient id="w" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d4f6f4"/><stop offset="1" stop-color="#9fe0de"/></linearGradient>
    <radialGradient id="mi" cx=".35" cy=".3" r=".9"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#bfe4f5"/></radialGradient>${floorShade}${blur('b', 6)}</defs>
    <rect width="${BW}" height="${FLOOR}" fill="url(#w)"/>
    <g stroke="#fff" stroke-width="4" opacity=".75">${rep(27, (i) => `<path d="M${i * 50} 0 V500"/>`)}${rep(10, (i) => `<path d="M0 ${i * 50 + 20} H${BW}"/>`)}</g>
    <path d="M0 300 ${rep(14, () => `q25 -24 50 0 q25 24 50 0 `)} V352 H0 Z" fill="#5fc4d8" opacity=".55"/>
    <circle cx="650" cy="176" r="104" fill="#ffd98a" stroke="#d9a54a" stroke-width="5"/><circle cx="650" cy="176" r="88" fill="url(#mi)" stroke="#9fc8dc" stroke-width="4"/>
    <path d="M596 136 L642 112 M610 168 L634 154" stroke="#fff" stroke-width="10" stroke-linecap="round" opacity=".9"/>
    <g><rect x="170" y="230" width="240" height="14" rx="6" fill="#fff" stroke="#8fc4d0" stroke-width="3"/>
      <rect x="196" y="160" width="40" height="70" rx="12" fill="#ff9ccb" stroke="#c95a92" stroke-width="3"/><rect x="206" y="142" width="20" height="22" rx="5" fill="#fff" stroke="#c95a92" stroke-width="3"/>
      <rect x="260" y="176" width="46" height="54" rx="10" fill="#ffd84a" stroke="#c9960e" stroke-width="3"/><rect x="272" y="160" width="22" height="20" rx="5" fill="#36a9f0"/>
      <path d="M334 230 V186 Q334 170 352 170 Q370 170 370 186 V230 Z" fill="#b8a4f5" stroke="#6f5ac4" stroke-width="3"/></g>
    <g><rect x="900" y="150" width="240" height="12" rx="6" fill="#c8ccd8" stroke="#8a94a8" stroke-width="3"/>
      <path d="M930 156 H1010 V290 Q970 302 930 290 Z" fill="#ff8fb0" stroke="#c95a80" stroke-width="3"/><path d="M930 250 H1010 M930 266 H1010" stroke="#fff" stroke-width="6" opacity=".8"/>
      <path d="M1040 156 H1110 V260 Q1075 270 1040 260 Z" fill="#8fd6f5" stroke="#3f96c4" stroke-width="3"/><path d="M1040 226 H1110" stroke="#fff" stroke-width="6" opacity=".8"/></g>
    <rect y="${FLOOR}" width="${BW}" height="${BH - FLOOR}" fill="#eafaff"/>
    <g fill="#9fdcf0">${rep(5, (r) => rep(14, (c) => `<rect x="${c * 100 + (r % 2) * 50 - 30}" y="${FLOOR + r * 50}" width="50" height="50" rx="4"/>`))}</g>
    <rect y="${FLOOR}" width="${BW}" height="${BH - FLOOR}" fill="url(#fs)"/><rect y="${FLOOR - 6}" width="${BW}" height="12" fill="#5fc4d8"/>
    <ellipse cx="650" cy="602" rx="250" ry="62" fill="#1d2440" opacity=".18" filter="url(#b)"/><ellipse cx="650" cy="594" rx="246" ry="60" fill="#ffb3d1" stroke="#e07aa6" stroke-width="5"/><ellipse cx="650" cy="594" rx="196" ry="42" fill="none" stroke="#fff" stroke-width="6" stroke-dasharray="14 12" opacity=".8"/>`;
}

function bedroomBg(): string {
  return `<defs><linearGradient id="w" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c9c2ff"/><stop offset="1" stop-color="#a59cf0"/></linearGradient>
    <linearGradient id="sk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a2f7a"/><stop offset="1" stop-color="#6a5fc4"/></linearGradient>${floorShade}${blur('b', 6)}${ballGrad('mo', '#ffffff', '#fff3b0', '#ffd84a')}</defs>
    <rect width="${BW}" height="${FLOOR}" fill="url(#w)"/>
    <g fill="#fff7c0" opacity=".7">${rep(40, (i) => `<path d="${starPath(40 + (i % 10) * 132 + (Math.floor(i / 10) % 2) * 66, 50 + Math.floor(i / 10) * 118, 10 + (i % 3) * 3)}"/>`)}</g>
    <rect y="412" width="${BW}" height="88" fill="#8a7fe0"/><rect y="404" width="${BW}" height="10" fill="#fff" opacity=".8"/>
    ${windowAt(540, 70, 220, 170, 'url(#sk)', `<circle cx="700" cy="124" r="34" fill="url(#mo)"/><circle cx="716" cy="114" r="30" fill="#39388f" opacity=".0"/><g fill="#fff">${rep(7, (i) => `<circle cx="${560 + i * 26}" cy="${96 + ((i * 37) % 110)}" r="${2 + (i % 2)}"/>`)}</g>`)}
    <g><rect x="210" y="130" width="150" height="130" rx="10" fill="#fff6e2" stroke="#c98a48" stroke-width="8"/><path d="${starPath(285, 196, 42)}" fill="#ffcf2e" stroke="#e08a00" stroke-width="3"/></g>
    <g><rect x="930" y="120" width="170" height="150" rx="10" fill="#fff6e2" stroke="#c98a48" stroke-width="8"/><path d="M950 250 L990 190 L1020 226 L1048 176 L1084 250 Z" fill="#8fd47a"/><circle cx="1058" cy="156" r="14" fill="#ffd84a"/></g>
    <rect y="${FLOOR}" width="${BW}" height="${BH - FLOOR}" fill="#d9a86a"/>
    <g stroke="#b8843f" stroke-width="3">${rep(5, (i) => `<path d="M0 ${FLOOR + i * 50} H${BW}"/>`)}${rep(40, (i) => `<path d="M${i * 110 + (i % 2) * 55 - 20} ${FLOOR + (i % 5) * 50} v50"/>`)}</g>
    <rect y="${FLOOR}" width="${BW}" height="${BH - FLOOR}" fill="url(#fs)"/><rect y="${FLOOR - 6}" width="${BW}" height="12" fill="#fff6e2"/>
    <ellipse cx="650" cy="604" rx="260" ry="64" fill="#1d2440" opacity=".2" filter="url(#b)"/><ellipse cx="650" cy="596" rx="256" ry="62" fill="#5fc4b8" stroke="#2f9488" stroke-width="5"/>
    <ellipse cx="650" cy="596" rx="190" ry="42" fill="#8fe0d4"/><ellipse cx="650" cy="596" rx="110" ry="22" fill="#5fc4b8"/>`;
}

function schoolBg(): string {
  const flags = ['#f2553d', '#ffd23a', '#35c46a', '#36a9f0', '#b06af0', '#ff8a2a'];
  return `<defs><linearGradient id="w" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e2f7e6"/><stop offset="1" stop-color="#b9e8c4"/></linearGradient>${floorShade}</defs>
    <rect width="${BW}" height="${FLOOR}" fill="url(#w)"/><rect y="400" width="${BW}" height="100" fill="#8fd0a4"/><rect y="392" width="${BW}" height="10" fill="#fff" opacity=".85"/>
    <path d="M0 40 Q650 90 1300 40" fill="none" stroke="#8a94a8" stroke-width="4"/>
    ${rep(21, (i) => { const x = 20 + i * 63; const y = 42 + 46 * (1 - Math.pow((x - 650) / 650, 2)); return `<path d="M${x - 22} ${y} H${x + 22} L${x} ${y + 46} Z" fill="${flags[i % 6]}" stroke="#fff" stroke-width="2"/>`; })}
    <g><circle cx="1010" cy="220" r="64" fill="#fff" stroke="#f2553d" stroke-width="10"/>${rep(12, (i) => `<circle cx="${1010 + 48 * Math.cos((i * Math.PI) / 6)}" cy="${220 + 48 * Math.sin((i * Math.PI) / 6)}" r="4" fill="#5a6488"/>`)}
      <path d="M1010 220 V182 M1010 220 L1038 232" stroke="#3a2a52" stroke-width="7" stroke-linecap="round"/><circle cx="1010" cy="220" r="7" fill="#f2553d"/></g>
    <g stroke="#fff" stroke-width="5">${[['#36a9f0', `<circle cx="0" cy="0" r="30" fill="#fff"/>`], ['#ffd23a', `<path d="M0 -32 L32 26 H-32 Z" fill="#fff"/>`], ['#35c46a', `<rect x="-28" y="-28" width="56" height="56" rx="8" fill="#fff"/>`], ['#f0569a', `<path d="${starPath(0, 0, 34)}" fill="#fff"/>`]]
      .map(([c, s], i) => `<g transform="translate(${650 + i * 0} 0)"></g><g transform="translate(${420 + i * 118} 290)"><rect x="-50" y="-58" width="100" height="116" rx="14" fill="${c}"/><g stroke="none">${s}</g></g>`).join('')}</g>
    <rect y="${FLOOR}" width="${BW}" height="${BH - FLOOR}" fill="#f0cf9a"/>
    <g stroke="#d9ac6a" stroke-width="3">${rep(5, (i) => `<path d="M0 ${FLOOR + i * 50} H${BW}"/>`)}${rep(40, (i) => `<path d="M${i * 120 + (i % 2) * 60 - 20} ${FLOOR + (i % 5) * 50} v50"/>`)}</g>
    <rect y="${FLOOR}" width="${BW}" height="${BH - FLOOR}" fill="url(#fs)"/><rect y="${FLOOR - 6}" width="${BW}" height="12" fill="#fff"/>`;
}

function parkBg(): string {
  const tree = (x: number, s: number) => `<g transform="translate(${x} ${FLOOR - 8}) scale(${s})"><rect x="-14" y="-110" width="28" height="118" rx="8" fill="#9a6a3a" stroke="#6a4520" stroke-width="3"/>
    <g fill="url(#tr)" stroke="#2f8a3a" stroke-width="3"><circle cx="-46" cy="-136" r="50"/><circle cx="46" cy="-136" r="50"/><circle cx="0" cy="-184" r="64"/></g><g fill="url(#tr)"><circle cx="0" cy="-140" r="50"/></g><ellipse cx="-22" cy="-214" rx="26" ry="10" fill="#fff" opacity=".4" transform="rotate(-20 -22 -214)"/></g>`;
  return `<defs><linearGradient id="w" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7fcdff"/><stop offset="1" stop-color="#d8f4ff"/></linearGradient>
    <linearGradient id="gr" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9fe07a"/><stop offset="1" stop-color="#5fb84a"/></linearGradient>${ballGrad('tr', '#b6f08a', '#5fc24f', '#2f9a3a')}${blur('fg', 3)}</defs>
    <rect width="${BW}" height="${BH}" fill="url(#w)"/>
    <path d="M0 420 Q200 300 420 400 Q600 310 820 396 Q1040 300 1300 410 V520 H0 Z" fill="#b8e8c8" opacity=".9"/>
    <path d="M0 460 Q260 380 520 450 Q800 372 1060 446 Q1200 410 1300 440 V520 H0 Z" fill="#8fd89a"/>
    ${tree(150, 1.15)}${tree(1150, 1.2)}${tree(900, 0.8)}${tree(420, 0.75)}
    <g stroke="#fff" stroke-width="12" stroke-linecap="round">${rep(27, (i) => `<path d="M${i * 50 + 10} ${FLOOR - 56} V${FLOOR + 4}"/>`)}<path d="M0 ${FLOOR - 36} H${BW} M0 ${FLOOR - 12} H${BW}"/></g>
    <rect y="${FLOOR}" width="${BW}" height="${BH - FLOOR}" fill="url(#gr)"/>
    <ellipse cx="650" cy="610" rx="330" ry="70" fill="#f3e2b0" stroke="#d9c48a" stroke-width="4"/>
    <g>${rep(16, (i) => { const x = 40 + i * 82 + ((i * 53) % 30), y = FLOOR + 30 + ((i * 97) % 190); const c = ['#ff7ab8', '#fff', '#ffd23a', '#b06af0'][i % 4];
      return Math.abs(x - 650) < 340 && Math.abs(y - 610) < 80 ? '' : `<g transform="translate(${x} ${y})"><path d="M0 0 v18" stroke="#3f8f2a" stroke-width="3"/>${rep(5, (k) => `<circle cx="${7 * Math.cos(k * 1.257)}" cy="${7 * Math.sin(k * 1.257)}" r="5" fill="${c}"/>`)}<circle r="4" fill="#ffb81f"/></g>`; })}</g>
    <g fill="#4faa3a" filter="url(#fg)">${rep(12, (i) => `<path d="M${i * 118 - 10} 750 q10 -50 24 -4 q8 -60 26 0 q8 -40 20 4 Z"/>`)}</g>`;
}

function props(): SvgTex[] {
  const sh = (cx: number, cy: number, rx: number) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="14" fill="#1d2440" opacity=".28" filter="url(#psh)"/>`;
  const D = `${blur('psh', 6)}`;
  return [
    T('pp_fridge', 340, 540, `<defs>${D}${lightGrad('g', '#e4f8ff', '#9fdcf5', '#5fb0d8')}${lightGrad('m', '#ffffff', '#dfe6f0', '#a8b4c8', true)}</defs>${sh(170, 522, 150)}
      <rect x="48" y="500" width="34" height="24" rx="6" fill="#5a6488"/><rect x="258" y="500" width="34" height="24" rx="6" fill="#5a6488"/>
      <rect x="26" y="14" width="288" height="496" rx="44" fill="url(#g)" stroke="#3f8ab8" stroke-width="5"/><path d="M26 186 H314" stroke="#3f8ab8" stroke-width="5"/>
      <rect x="250" y="70" width="22" height="92" rx="11" fill="url(#m)" stroke="#7a86a0" stroke-width="3"/><rect x="250" y="216" width="22" height="150" rx="11" fill="url(#m)" stroke="#7a86a0" stroke-width="3"/>
      <rect x="48" y="34" width="26" height="130" rx="13" fill="#fff" opacity=".55"/><rect x="48" y="210" width="26" height="260" rx="13" fill="#fff" opacity=".45"/>
      <g transform="translate(120 280)"><path d="${starPath(0, 0, 26)}" fill="#ffcf2e" stroke="#e08a00" stroke-width="3"/></g><g transform="translate(176 340)"><path d="M0 22 Q-26 4 -24 -12 Q-22 -24 -12 -24 Q-4 -24 0 -14 Q4 -24 12 -24 Q22 -24 24 -12 Q26 4 0 22 Z" fill="#ff5e9a" stroke="#c4245f" stroke-width="3"/></g>
      <rect x="96" y="394" width="70" height="56" rx="6" fill="#fff" stroke="#c8d0e4" stroke-width="3" transform="rotate(-6 130 420)"/><path d="M108 412 q14 -12 26 0 q10 10 22 0" fill="none" stroke="#f0569a" stroke-width="5" stroke-linecap="round" transform="rotate(-6 130 420)"/>`),
    T('pp_stove', 400, 440, `<defs>${D}${lightGrad('g', '#ffffff', '#f1f1f6', '#c4c8d8')}${lightGrad('p', '#ffb0a0', '#f2553d', '#b82a1a')}${lightGrad('m', '#f4f6fa', '#c8cfdc', '#8a94a8', true)}</defs>${sh(200, 424, 180)}
      <rect x="24" y="184" width="352" height="236" rx="22" fill="url(#g)" stroke="#8a94a8" stroke-width="5"/><rect x="14" y="170" width="372" height="30" rx="10" fill="#5a6488" stroke="#3a4260" stroke-width="4"/>
      <rect x="64" y="262" width="272" height="130" rx="16" fill="#2a3048" stroke="#8a94a8" stroke-width="5"/><rect x="80" y="276" width="240" height="70" rx="10" fill="#ffb347" opacity=".55"/><rect x="84" y="244" width="232" height="12" rx="6" fill="url(#m)" stroke="#7a86a0" stroke-width="3"/>
      ${[70, 130, 270, 330].map((x, i) => `<circle cx="${x}" cy="222" r="15" fill="${['#f2553d', '#ffb81f', '#35c46a', '#36a9f0'][i]}" stroke="#3a4260" stroke-width="3"/><path d="M${x} 222 v-10" stroke="#fff" stroke-width="4" stroke-linecap="round"/>`).join('')}
      <path d="M90 86 H310 V150 Q310 174 286 174 H114 Q90 174 90 150 Z" fill="url(#p)" stroke="#8f1f12" stroke-width="5"/><rect x="78" y="74" width="244" height="24" rx="12" fill="#f2553d" stroke="#8f1f12" stroke-width="5"/>
      <path d="M90 112 H56 Q44 112 44 124 Q44 136 56 136 H90 M310 112 H344 Q356 112 356 124 Q356 136 344 136 H310" fill="none" stroke="#8f1f12" stroke-width="9" stroke-linecap="round"/>
      <rect x="108" y="98" width="20" height="62" rx="10" fill="#fff" opacity=".45"/><path d="M250 80 L300 16" stroke="#c9965a" stroke-width="14" stroke-linecap="round"/><path d="M250 80 L300 16" stroke="#f0cf9a" stroke-width="6" stroke-linecap="round"/>
      <path d="M150 62 q-12 -16 0 -30 q12 -14 0 -28 M200 58 q-12 -16 0 -30 q12 -14 0 -24" fill="none" stroke="#fff" stroke-width="8" stroke-linecap="round" opacity=".9"/>`),
    T('pp_potty', 300, 300, `<defs>${D}${lightGrad('g', '#d8ffc0', '#8fe05a', '#4fa82a')}${lightGrad('y', '#fff7a8', '#ffd84a', '#e0a81e')}</defs>${sh(150, 284, 124)}
      <path d="M70 60 Q70 16 150 16 Q230 16 230 60 V150 H70 Z" fill="url(#g)" stroke="#2f7a16" stroke-width="5"/><ellipse cx="120" cy="52" rx="30" ry="12" fill="#fff" opacity=".45"/>
      <path d="M30 150 Q30 128 60 128 H240 Q270 128 270 150 L252 256 Q248 280 220 280 H80 Q52 280 48 256 Z" fill="url(#g)" stroke="#2f7a16" stroke-width="5"/>
      <ellipse cx="150" cy="148" rx="112" ry="30" fill="url(#y)" stroke="#b8860b" stroke-width="5"/><ellipse cx="150" cy="150" rx="78" ry="17" fill="#8a6a1a" opacity=".6"/>
      <path d="${starPath(150, 222, 26)}" fill="#fff" opacity=".9"/><rect x="56" y="160" width="16" height="84" rx="8" fill="#fff" opacity=".4" transform="rotate(-6 64 200)"/>`),
    T('pp_tub', 620, 420, `<defs>${D}${lightGrad('g', '#ffffff', '#f2f6ff', '#b8c8ea', true)}${lightGrad('m', '#f4f6fa', '#c8cfdc', '#8a94a8')}<radialGradient id="b" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#c4ecff"/></radialGradient></defs>${sh(290, 402, 250)}
      <path d="M560 400 V70 Q560 26 520 26 Q486 26 480 60" fill="none" stroke="#7a86a0" stroke-width="22" stroke-linecap="round"/><path d="M560 400 V70 Q560 26 520 26 Q486 26 480 60" fill="none" stroke="url(#m)" stroke-width="14" stroke-linecap="round"/>
      <path d="M440 60 H520 L506 92 H454 Z" fill="url(#m)" stroke="#7a86a0" stroke-width="4" stroke-linejoin="round"/>
      <path d="M90 374 L70 404 M490 374 L510 404" stroke="#d9a54a" stroke-width="20" stroke-linecap="round"/>
      <g fill="url(#b)" stroke="#7cc4f0" stroke-width="3"><circle cx="110" cy="176" r="40"/><circle cx="186" cy="150" r="52"/><circle cx="270" cy="168" r="44"/><circle cx="350" cy="148" r="50"/><circle cx="430" cy="172" r="42"/><circle cx="480" cy="190" r="26"/><circle cx="318" cy="96" r="20"/><circle cx="150" cy="96" r="14"/></g>
      <path d="M24 200 H556 Q560 330 480 380 H100 Q20 330 24 200 Z" fill="url(#g)" stroke="#7f95bd" stroke-width="5"/><rect x="8" y="184" width="564" height="36" rx="18" fill="#fff" stroke="#7f95bd" stroke-width="5"/>
      <path d="M70 250 Q70 330 130 350" fill="none" stroke="#fff" stroke-width="14" stroke-linecap="round" opacity=".9"/><path d="M60 300 q30 -20 60 0 q30 20 60 0 q30 -20 60 0 q30 20 60 0 q30 -20 60 0 q30 20 60 0" fill="none" stroke="#8fd3ff" stroke-width="8" stroke-linecap="round" opacity=".6"/>`),
    T('pp_bed', 680, 400, `<defs>${D}${lightGrad('w', '#f0cf9a', '#c9965a', '#8f6230')}${lightGrad('b', '#9fb8ff', '#5f7ff0', '#3a4fc4', true)}${ballGrad('p', '#ffffff', '#f4f6ff', '#c8d0ea')}
      <radialGradient id="lg"><stop offset="0" stop-color="#fff3a0" stop-opacity=".95"/><stop offset="1" stop-color="#fff3a0" stop-opacity="0"/></radialGradient>${lightGrad('la', '#fff6b0', '#ffcf2e', '#f08c00', true)}</defs>${sh(300, 384, 280)}
      <rect x="20" y="96" width="44" height="286" rx="14" fill="url(#w)" stroke="#6a4520" stroke-width="5"/><circle cx="42" cy="92" r="26" fill="url(#w)" stroke="#6a4520" stroke-width="5"/>
      <rect x="40" y="250" width="500" height="110" rx="16" fill="url(#w)" stroke="#6a4520" stroke-width="5"/>
      <rect x="54" y="206" width="476" height="70" rx="26" fill="#fff" stroke="#b8c4e0" stroke-width="5"/>
      <ellipse cx="140" cy="206" rx="80" ry="40" fill="url(#p)" stroke="#9fb0d6" stroke-width="5"/><ellipse cx="116" cy="192" rx="30" ry="10" fill="#fff" opacity=".8"/>
      <path d="M210 214 Q360 172 540 214 V326 Q540 340 526 340 H224 Q210 340 210 326 Z" fill="url(#b)" stroke="#2a3a9a" stroke-width="5"/>
      <g fill="#fff6b0">${[[270, 250], [350, 290], [430, 240], [490, 300], [300, 310], [400, 320]].map(([x, y]) => `<path d="${starPath(x, y, 13)}"/>`).join('')}</g>
      <rect x="516" y="170" width="40" height="212" rx="14" fill="url(#w)" stroke="#6a4520" stroke-width="5"/>
      <circle cx="622" cy="150" r="90" fill="url(#lg)"/><rect x="612" y="196" width="18" height="150" rx="6" fill="#8a94a8" stroke="#5a6488" stroke-width="3"/><ellipse cx="621" cy="356" rx="46" ry="16" fill="#8a94a8" stroke="#5a6488" stroke-width="4"/>
      <path d="M586 110 H656 L676 206 H566 Z" fill="url(#la)" stroke="#c47a00" stroke-width="5" stroke-linejoin="round"/><path d="M596 124 L586 190" stroke="#fff" stroke-width="8" stroke-linecap="round" opacity=".6"/>`),
    T('pp_wardrobe', 380, 580, `<defs>${D}${lightGrad('w', '#f4d6a4', '#d9a56a', '#a8743a')}${lightGrad('d', '#ffe6bc', '#e8b97c', '#c08a4a')}</defs>${sh(190, 564, 170)}
      <rect x="40" y="540" width="40" height="26" rx="8" fill="#8f6230"/><rect x="300" y="540" width="40" height="26" rx="8" fill="#8f6230"/>
      <rect x="20" y="30" width="340" height="520" rx="22" fill="url(#w)" stroke="#6a4520" stroke-width="5"/><path d="M10 34 Q190 -14 370 34 V54 H10 Z" fill="url(#d)" stroke="#6a4520" stroke-width="5" stroke-linejoin="round"/>
      <rect x="40" y="76" width="140" height="350" rx="14" fill="url(#d)" stroke="#8f6230" stroke-width="4"/><rect x="200" y="76" width="140" height="350" rx="14" fill="url(#d)" stroke="#8f6230" stroke-width="4"/>
      <path d="M110 190 Q84 168 86 150 Q88 136 100 136 Q108 136 110 146 Q112 136 120 136 Q132 136 134 150 Q136 168 110 190 Z" fill="#a8743a" opacity=".7"/><path d="M270 190 Q244 168 246 150 Q248 136 260 136 Q268 136 270 146 Q272 136 280 136 Q292 136 294 150 Q296 168 270 190 Z" fill="#a8743a" opacity=".7"/>
      <circle cx="164" cy="262" r="11" fill="#ffcf2e" stroke="#b86e00" stroke-width="3"/><circle cx="216" cy="262" r="11" fill="#ffcf2e" stroke="#b86e00" stroke-width="3"/>
      <rect x="40" y="446" width="300" height="84" rx="14" fill="url(#d)" stroke="#8f6230" stroke-width="4"/><rect x="150" y="480" width="80" height="16" rx="8" fill="#ffcf2e" stroke="#b86e00" stroke-width="3"/>
      <rect x="52" y="90" width="14" height="300" rx="7" fill="#fff" opacity=".35"/><path d="M186 426 Q220 470 210 520 L176 512 Z" fill="#ff5ea8" stroke="#a01a58" stroke-width="3"/>`),
    T('pp_board', 580, 480, `<defs>${D}${lightGrad('w', '#f0cf9a', '#c9965a', '#8f6230')}${lightGrad('g', '#4fae7a', '#2f8a5a', '#1f6a42')}</defs>${sh(290, 464, 220)}
      <path d="M120 300 L60 462 M460 300 L520 462 M290 300 V452" stroke="#8f6230" stroke-width="20" stroke-linecap="round"/><path d="M120 300 L60 462 M460 300 L520 462" stroke="#c9965a" stroke-width="9" stroke-linecap="round"/>
      <rect x="24" y="16" width="532" height="320" rx="18" fill="url(#w)" stroke="#6a4520" stroke-width="5"/><rect x="48" y="38" width="484" height="260" rx="8" fill="url(#g)" stroke="#1a5a38" stroke-width="4"/>
      <g fill="none" stroke="#fff" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" opacity=".92"><circle cx="118" cy="130" r="36"/><path d="M196 166 L234 96 L272 166 Z"/><circle cx="350" cy="130" r="36"/>
        <path d="M430 100 Q430 78 452 78 Q476 78 476 100 Q476 116 458 124 Q452 128 452 140" stroke="#ffe066"/><circle cx="452" cy="166" r="5" fill="#ffe066" stroke="#ffe066"/></g>
      <path d="M90 232 q30 -20 60 0 q30 20 60 0 M260 236 H420" fill="none" stroke="#fff" stroke-width="6" stroke-linecap="round" opacity=".5"/>
      <rect x="40" y="322" width="500" height="22" rx="8" fill="url(#w)" stroke="#6a4520" stroke-width="4"/><rect x="100" y="312" width="56" height="14" rx="5" fill="#fff"/><rect x="180" y="312" width="44" height="14" rx="5" fill="#ff8fb0"/><rect x="430" y="306" width="70" height="22" rx="6" fill="#7a86a0"/>`),
  ];
}

export function roomTextures(): SvgTex[] {
  return [
    T('pp_bg_kitchen', BW, BH, kitchenBg()), T('pp_bg_bath', BW, BH, bathBg()), T('pp_bg_bedroom', BW, BH, bedroomBg()),
    T('pp_bg_school', BW, BH, schoolBg()), T('pp_bg_park', BW, BH, parkBg()), ...props(),
  ];
}
