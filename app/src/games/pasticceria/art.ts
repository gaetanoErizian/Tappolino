import { svgDoc, type SvgTex } from '../../core/textures';
import { lightGrad, ballGrad, blur, shade, starPath, roundButton } from '../../core/art';
import { RECIPES, TOPPINGS, CUSTOMERS, type Recipe, type CustomerId, type IngredientId, type ToppingId } from './recipes';

/**
 * Grafica 2.5D di Pasticceria Magica (decisione 8): volumi sfumati, luce dall'alto a sinistra,
 * riflessi e ombre proprie. Le parti da colorare (impasto, glassa, sac à poche) sono disegnate
 * in scala di grigi e colorate con il tint di Phaser; i riflessi stanno in texture separate, così restano bianchi.
 * Chiavi prefissate "pa_".
 */

const G = (id: string, base: string, vertical = false, k = 0.4): string => lightGrad(id, shade(base, k), base, shade(base, -0.3), vertical);
const B = (id: string, base: string, k = 0.55): string => ballGrad(id, shade(base, k), base, shade(base, -0.35));
const shine = (cx: number, cy: number, rx: number, ry: number, rot = -25, op = 0.8): string =>
  `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" transform="rotate(${rot} ${cx} ${cy})" fill="#fff" opacity="${op}"/>`;
/** Scala di grigi per le parti colorate con il tint. */
const GREY = ballGrad('gr', '#ffffff', '#efefef', '#bdbdbd');

// =====================================================================
// Pasticceria: finestra, mensole, lampade, primo piano sfocato
// =====================================================================

function windowTex(): SvgTex {
  const houses = [[130, 300, 60, 46, '#f7b7a3'], [210, 290, 70, 56, '#ffe1a8'], [470, 296, 64, 50, '#b9d9f7'], [560, 286, 74, 60, '#f9c6dc']]
    .map(([x, y, w, h, c]) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${c}"/>
      <path d="M${(x as number) - 8} ${y} L${(x as number) + (w as number) / 2} ${(y as number) - 30} L${(x as number) + (w as number) + 8} ${y} Z" fill="${shade(c as string, -0.25)}"/>
      <rect x="${(x as number) + 14}" y="${(y as number) + 14}" width="14" height="14" fill="#fff" opacity=".8"/>`).join('');
  const valance = Array.from({ length: 12 }, (_, i) => `<path d="M${i * 66} 0 H${i * 66 + 66} V54 Q${i * 66 + 33} 84 ${i * 66} 54 Z" fill="${i % 2 ? '#fff6fa' : '#ff8fbd'}"/>`).join('');
  const curtain = (flip: boolean) => {
    const p = 'M0 40 H150 Q130 160 150 270 Q100 300 120 440 H0 Z';
    return `<g transform="${flip ? 'translate(780 0) scale(-1 1)' : ''}">
      <path d="${p}" fill="url(#cu)"/>
      <path d="M40 50 Q36 200 60 300 Q52 380 60 440 M90 50 Q82 180 110 290" stroke="#e86aa0" stroke-width="5" fill="none" opacity=".45"/>
      <path d="M10 50 Q8 240 20 440" stroke="#fff" stroke-width="6" fill="none" opacity=".35"/>
      <ellipse cx="128" cy="282" rx="30" ry="14" fill="#ffd44d" stroke="#d9a01a" stroke-width="3"/></g>`;
  };
  return {
    key: 'pa_window', w: 780, h: 470, svg: svgDoc(780, 470, `<defs>
      <linearGradient id="sk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6fc1f4"/><stop offset="1" stop-color="#e3f5ff"/></linearGradient>
      ${G('fr', '#fbefe2', false, 0.6)}
      ${G('cu', '#ffaacb', false, 0.35)}
      <linearGradient id="hz" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#eaf7ff" stop-opacity=".1"/><stop offset="1" stop-color="#eaf7ff" stop-opacity=".75"/></linearGradient>
      <radialGradient id="sg"><stop offset="0" stop-color="#fffbe0"/><stop offset=".3" stop-color="#ffe98a" stop-opacity=".8"/><stop offset="1" stop-color="#ffe98a" stop-opacity="0"/></radialGradient>
      ${lightGrad('mu', '#ffffff', '#efe0cf', '#cdb79f')}
    </defs>
    <rect x="30" y="30" width="720" height="420" rx="26" fill="url(#fr)" stroke="#d8c2a8" stroke-width="4"/>
    <rect x="72" y="72" width="636" height="336" rx="10" fill="url(#sk)"/>
    <circle cx="560" cy="150" r="90" fill="url(#sg)"/><circle cx="560" cy="150" r="34" fill="#fff6c4"/>
    <path d="M72 300 Q200 220 330 280 Q470 340 600 250 Q660 220 708 250 V408 H72 Z" fill="#b5e0c8"/>
    ${houses}
    <path d="M72 350 Q240 300 400 345 Q560 390 708 330 V408 H72 Z" fill="#8fd3a0"/>
    <rect x="72" y="72" width="636" height="336" fill="url(#hz)"/>
    <!-- incasso: ombra in alto e a sinistra, luce sul davanzale -->
    <rect x="72" y="72" width="636" height="16" fill="#3a2a52" opacity=".14"/><rect x="72" y="72" width="16" height="336" fill="#3a2a52" opacity=".1"/>
    <rect x="72" y="398" width="636" height="10" fill="#fff" opacity=".6"/>
    <rect x="382" y="72" width="16" height="336" fill="url(#mu)"/><rect x="72" y="232" width="636" height="14" fill="url(#mu)"/>
    <path d="M120 72 L200 72 L110 232 L72 232 Z M470 246 L520 246 L450 408 L410 408 Z" fill="#fff" opacity=".18"/>
    ${curtain(false)}${curtain(true)}
    <g transform="translate(-6 0)">${valance}</g>`),
  };
}

function shelfTex(): SvgTex {
  const balls = [[70, 150, '#ff6b8f'], [96, 156, '#ffd34d'], [122, 150, '#5ec7f2'], [82, 128, '#8fe3a0'], [110, 126, '#b48cff'], [96, 104, '#ff9a3c'], [70, 176, '#4fb3f7'], [124, 176, '#ff8fc2']]
    .map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="14" fill="url(#bb${i})"/>`).join('');
  const ballDefs = [['#ff6b8f'], ['#ffd34d'], ['#5ec7f2'], ['#8fe3a0'], ['#b48cff'], ['#ff9a3c'], ['#4fb3f7'], ['#ff8fc2']]
    .map(([c], i) => B(`bb${i}`, c)).join('');
  const mac = (y: number, c: string) => `<ellipse cx="460" cy="${y + 10}" rx="46" ry="16" fill="${shade(c, -0.25)}"/>
    <rect x="414" y="${y - 2}" width="92" height="12" fill="#fff6e8"/>
    <ellipse cx="460" cy="${y - 4}" rx="46" ry="16" fill="${c}"/><ellipse cx="446" cy="${y - 10}" rx="16" ry="5" fill="#fff" opacity=".6"/>`;
  return {
    key: 'pa_shelf', w: 560, h: 300, svg: svgDoc(560, 300, `<defs>${ballDefs}
      ${G('wd', '#e2b07f', true, 0.35)}
      <linearGradient id="gl" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity=".55"/><stop offset=".3" stop-color="#fff" stop-opacity=".15"/><stop offset="1" stop-color="#cfe6f5" stop-opacity=".35"/></linearGradient>
      ${G('ck', '#ffb3cc', true)}${blur('sb', 6)}
    </defs>
    <rect x="34" y="226" width="500" height="26" fill="#3a2a52" opacity=".22" filter="url(#sb)"/>
    <!-- vaso di caramelle -->
    <rect x="52" y="86" width="90" height="116" rx="22" fill="#e7f4fb" opacity=".5"/>
    ${balls}
    <rect x="52" y="86" width="90" height="116" rx="22" fill="url(#gl)" stroke="#a9cfe4" stroke-width="3"/>
    <rect x="46" y="70" width="102" height="22" rx="9" fill="#ff8fbd" stroke="#d9548f" stroke-width="2"/><ellipse cx="97" cy="66" rx="16" ry="8" fill="#ff8fbd"/>
    <rect x="62" y="98" width="8" height="90" rx="4" fill="#fff" opacity=".7"/>
    <!-- alzatina con torta sotto la campana -->
    <ellipse cx="282" cy="196" rx="34" ry="8" fill="#d9dfe9"/><rect x="274" y="168" width="16" height="28" fill="#e8edf5"/>
    <ellipse cx="282" cy="168" rx="92" ry="14" fill="#f4f7fb" stroke="#c8d0dd" stroke-width="2"/>
    <rect x="230" y="118" width="104" height="44" rx="8" fill="url(#ck)"/><ellipse cx="282" cy="118" rx="52" ry="12" fill="#fff0f6"/>
    <rect x="230" y="136" width="104" height="7" fill="#fff6fa"/>
    <circle cx="282" cy="106" r="9" fill="#e8203a"/>
    <path d="M200 166 Q196 50 282 44 Q368 50 364 166" fill="#dff1fb" opacity=".28" stroke="#b9d9ec" stroke-width="3"/>
    <circle cx="282" cy="40" r="9" fill="#cfe2ee"/>
    <path d="M222 140 Q220 80 262 60" stroke="#fff" stroke-width="8" fill="none" opacity=".6" stroke-linecap="round"/>
    <!-- torretta di macarons -->
    ${mac(190, '#9fe6c4')}${mac(162, '#ff9cc4')}${mac(134, '#ffe36a')}
    <!-- mensola: piano, bordo frontale, staffe -->
    <path d="M24 204 L44 192 H540 L520 204 Z" fill="#f3d2aa"/>
    <rect x="24" y="204" width="496" height="24" rx="4" fill="url(#wd)"/>
    <path d="M520 204 L540 192 V216 L520 228 Z" fill="#b7814f"/>
    <rect x="24" y="204" width="496" height="4" fill="#fff" opacity=".5"/>
    <path d="M80 228 V262 L120 228 Z M440 228 V262 L480 228 Z" fill="#c99363"/>`),
  };
}

function lampTex(color: string, key: string): SvgTex {
  return {
    key, w: 240, h: 330, svg: svgDoc(240, 330, `<defs>${G('ls', color, false, 0.45)}
      <radialGradient id="bu" cx=".5" cy=".4"><stop offset="0" stop-color="#ffffff"/><stop offset=".6" stop-color="#fff2b8"/><stop offset="1" stop-color="#ffd76a"/></radialGradient></defs>
      <path d="M120 0 V150" stroke="#6b5a7a" stroke-width="5"/>
      <rect x="104" y="140" width="32" height="26" rx="6" fill="#8a7a9a"/>
      <ellipse cx="120" cy="272" rx="38" ry="22" fill="url(#bu)"/>
      <path d="M120 160 Q40 168 20 270 Q120 300 220 270 Q200 168 120 160 Z" fill="url(#ls)" stroke="${shade(color, -0.35)}" stroke-width="3"/>
      <ellipse cx="120" cy="270" rx="100" ry="20" fill="${shade(color, -0.4)}"/>
      <ellipse cx="120" cy="272" rx="44" ry="12" fill="#fff6cf"/>
      ${shine(76, 200, 14, 34, 30, 0.6)}`),
  };
}

function fgJar(): SvgTex {
  const pops = [[90, '#ff6b8f', 100], [150, '#5ec7f2', 70], [210, '#ffd34d', 110], [270, '#8fe3a0', 80]]
    .map(([x, c, y]) => `<path d="M${x} ${(y as number) + 40} V300" stroke="#fff" stroke-width="12"/>
      <circle cx="${x}" cy="${y}" r="52" fill="${c}"/><path d="M${(x as number) - 30} ${y} Q${x} ${(y as number) - 40} ${(x as number) + 30} ${y}" stroke="#fff" stroke-width="12" fill="none" opacity=".7"/>
      <ellipse cx="${(x as number) - 18}" cy="${(y as number) - 22}" rx="14" ry="8" fill="#fff" opacity=".8"/>`).join('');
  return {
    key: 'pa_fg_jar', w: 380, h: 470, svg: svgDoc(380, 470, `<defs>${blur('b', 7)}</defs>
      <g filter="url(#b)">${pops}
        <path d="M40 220 Q30 460 190 460 Q350 460 340 220 Z" fill="#dff1fb" opacity=".5" stroke="#b9d9ec" stroke-width="8"/>
        <rect x="60" y="250" width="22" height="170" rx="11" fill="#fff" opacity=".6"/></g>`),
  };
}

function fgStand(): SvgTex {
  const cup = (x: number, c: string) => `<path d="M${x - 50} 150 L${x - 38} 220 H${x + 38} L${x + 50} 150 Z" fill="#ff9cc4"/>
    <path d="M${x - 56} 156 Q${x - 60} 80 ${x} 70 Q${x + 60} 80 ${x + 56} 156 Q${x} 170 ${x - 56} 156 Z" fill="${c}"/>
    <ellipse cx="${x - 20}" cy="104" rx="14" ry="9" fill="#fff" opacity=".8"/><circle cx="${x}" cy="62" r="14" fill="#e8203a"/>`;
  return {
    key: 'pa_fg_stand', w: 440, h: 380, svg: svgDoc(440, 380, `<defs>${blur('b', 7)}</defs>
      <g filter="url(#b)">${cup(130, '#fff1d2')}${cup(300, '#9fe6c4')}
        <ellipse cx="220" cy="236" rx="200" ry="30" fill="#f4f7fb"/><rect x="200" y="236" width="40" height="110" fill="#e8edf5"/>
        <ellipse cx="220" cy="350" rx="90" ry="20" fill="#d9dfe9"/></g>`),
  };
}

// =====================================================================
// Ciotola, impasto, frusta
// =====================================================================

const BOWL = { light: '#eef9ff', base: '#9fd6f5', dark: '#4f95c4' };

function bowlTextures(): SvgTex[] {
  const inner = svgDoc(440, 300, `<defs>
      <radialGradient id="in" cx=".6" cy=".75" r=".8"><stop offset="0" stop-color="#e8f6ff"/><stop offset=".7" stop-color="#b9def5"/><stop offset="1" stop-color="#6fa9d1"/></radialGradient></defs>
    <ellipse cx="220" cy="80" rx="200" ry="54" fill="${BOWL.dark}"/>
    <ellipse cx="220" cy="84" rx="188" ry="46" fill="url(#in)"/>
    <path d="M32 80 A188 46 0 0 1 408 80" stroke="#fff" stroke-width="5" fill="none" opacity=".7"/>`);
  const front = svgDoc(440, 300, `<defs>${G('bw', BOWL.base, false, 0.7)}${blur('s', 6)}
      <linearGradient id="bd" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity=".95"/><stop offset=".5" stop-color="#ffe9f2"/><stop offset="1" stop-color="#e9b9cf"/></linearGradient></defs>
    <path d="M20 80 A200 54 0 0 0 420 80 C412 210 330 288 220 288 C110 288 28 210 20 80 Z" fill="url(#bw)"/>
    <path d="M30 118 A196 52 0 0 0 410 118 L404 150 A190 52 0 0 1 36 150 Z" fill="url(#bd)"/>
    ${[90, 150, 220, 290, 350].map((x, i) => `<circle cx="${x}" cy="${136 + Math.abs(i - 2) * -6 + 14}" r="7" fill="#ff8fbd"/>`).join('')}
    <path d="M20 80 A200 54 0 0 0 420 80" stroke="${BOWL.light}" stroke-width="9" fill="none"/>
    <path d="M60 168 Q80 240 150 268" stroke="#fff" stroke-width="12" fill="none" opacity=".5" stroke-linecap="round"/>
    <path d="M420 80 C412 210 330 288 220 288" stroke="${shade(BOWL.dark, -0.2)}" stroke-width="4" fill="none" opacity=".5"/>`);
  return [
    { key: 'pa_bowl_in', w: 440, h: 300, svg: inner },
    { key: 'pa_bowl', w: 440, h: 300, svg: front },
    { key: 'pa_batter', w: 360, h: 100, svg: svgDoc(360, 100, `<defs>${ballGrad('bt', '#ffffff', '#ececec', '#b4b4b4')}</defs>
      <ellipse cx="180" cy="50" rx="170" ry="44" fill="url(#bt)"/>
      <ellipse cx="180" cy="56" rx="150" ry="30" fill="#000" opacity=".05"/>`) },
    { key: 'pa_batter_hl', w: 360, h: 100, svg: svgDoc(360, 100, `${shine(110, 30, 46, 9, -8, 0.65)}${shine(240, 44, 16, 5, -8, 0.5)}${shine(70, 52, 8, 4, 0, 0.5)}`) },
    { key: 'pa_swirl', w: 320, h: 90, svg: svgDoc(320, 90, `<g fill="none" stroke="#9a9a9a" stroke-linecap="round">
      <path d="M160 45 m-30 0 a30 12 0 1 1 60 0 a54 22 0 1 1 -108 0 a86 32 0 1 1 172 0 a120 38 0 1 1 -240 0" stroke-width="7" opacity=".7"/></g>`) },
    { key: 'pa_lump', w: 44, h: 34, svg: svgDoc(44, 34, `<defs>${GREY}</defs><path d="M6 22 Q4 8 18 6 Q30 2 38 12 Q44 26 30 30 Q12 32 6 22 Z" fill="url(#gr)"/>${shine(16, 12, 6, 3, -20, 0.8)}`) },
    { key: 'pa_whisk', w: 130, h: 320, svg: svgDoc(130, 320, `<defs>${G('hd', '#ff8fbd', false, 0.45)}
      <linearGradient id="mt" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#f4f8fc"/><stop offset=".5" stop-color="#c3cdda"/><stop offset="1" stop-color="#7d8aa0"/></linearGradient></defs>
      ${[18, 30, 42].map((rx) => `<ellipse cx="65" cy="230" rx="${rx}" ry="84" fill="none" stroke="url(#mt)" stroke-width="5"/>`).join('')}
      <rect x="0" y="130" width="130" height="20" fill="none"/>
      <rect x="52" y="128" width="26" height="30" rx="5" fill="url(#mt)"/>
      <rect x="44" y="6" width="42" height="130" rx="21" fill="url(#hd)" stroke="#d9548f" stroke-width="3"/>
      <circle cx="65" cy="28" r="8" fill="#d9548f"/>
      <rect x="52" y="44" width="8" height="78" rx="4" fill="#fff" opacity=".6"/>`) },
  ];
}

// =====================================================================
// Ingredienti
// =====================================================================

function ingredientSvg(id: IngredientId): string {
  switch (id) {
    case 'flour': return `<defs>${G('s', '#f4e8d0', false, 0.6)}</defs>
      <path d="M52 76 Q36 150 42 206 Q44 230 70 232 H150 Q176 230 178 206 Q184 150 168 76 Z" fill="url(#s)" stroke="#bda57d" stroke-width="3"/>
      <path d="M44 62 Q110 42 176 62 L170 88 Q110 72 50 88 Z" fill="#fbf3e2" stroke="#bda57d" stroke-width="3"/>
      <path d="M58 88 Q110 102 162 88" stroke="#e0628f" stroke-width="7" fill="none" stroke-linecap="round"/>
      <rect x="72" y="118" width="76" height="86" rx="16" fill="#fff" opacity=".9" stroke="#e8d8bb" stroke-width="2"/>
      <path d="M110 196 V128" stroke="#c99a3a" stroke-width="4"/>
      ${[134, 148, 162, 176].map((y) => `<ellipse cx="100" cy="${y}" rx="7" ry="11" transform="rotate(-30 100 ${y})" fill="#e8b443"/><ellipse cx="120" cy="${y}" rx="7" ry="11" transform="rotate(30 120 ${y})" fill="#e8b443"/>`).join('')}
      <ellipse cx="110" cy="124" rx="6" ry="10" fill="#e8b443"/>
      <circle cx="94" cy="50" r="12" fill="#fff"/><circle cx="114" cy="40" r="15" fill="#fff"/><circle cx="134" cy="50" r="11" fill="#fff"/>
      ${shine(70, 130, 9, 30, 0, 0.55)}`;
    case 'egg': return `<defs>${ballGrad('e', '#fffef9', '#f7e9cf', '#d6b98c')}${G('c', '#7cc4f2', false, 0.5)}</defs>
      <ellipse cx="110" cy="146" rx="58" ry="10" fill="#2f6f9e"/>
      <ellipse cx="110" cy="100" rx="56" ry="72" fill="url(#e)" stroke="#d9c09a" stroke-width="2"/>
      ${shine(88, 66, 14, 24, -20, 0.85)}
      <path d="M52 146 A58 10 0 0 0 168 146 Q166 204 110 206 Q54 204 52 146 Z" fill="url(#c)" stroke="#3f8fc4" stroke-width="3"/>
      <path d="M53 146 A57 10 0 0 0 167 146" stroke="#c4e8fc" stroke-width="5" fill="none"/>
      ${[[80, 170], [110, 186], [140, 170]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="7" fill="#fff" opacity=".9"/>`).join('')}
      <rect x="96" y="204" width="28" height="14" fill="#5aa9dc"/>
      <ellipse cx="110" cy="222" rx="52" ry="12" fill="#3f8fc4"/><ellipse cx="110" cy="218" rx="48" ry="9" fill="#8fd0f7"/>`;
    case 'milk': return `<defs><linearGradient id="m" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ffffff"/><stop offset=".55" stop-color="#f1f5fa"/><stop offset="1" stop-color="#c9d6e6"/></linearGradient>${G('cp', '#4fa3ff')}</defs>
      <path d="M86 44 V30 H134 V44 Q144 54 146 72 L154 104 Q162 122 162 142 V212 Q162 232 142 232 H78 Q58 232 58 212 V142 Q58 122 66 104 L74 72 Q76 54 86 44 Z" fill="url(#m)" stroke="#9fb4cc" stroke-width="3"/>
      <rect x="80" y="12" width="60" height="26" rx="9" fill="url(#cp)" stroke="#2f7ad1" stroke-width="2"/>
      <rect x="70" y="112" width="11" height="98" rx="5" fill="#fff" opacity=".85"/>
      <rect x="66" y="146" width="88" height="62" rx="14" fill="#5fb8f5"/>
      <path d="M110 158 Q124 176 124 186 Q124 200 110 200 Q96 200 96 186 Q96 176 110 158 Z" fill="#fff"/>
      <rect x="74" y="152" width="6" height="50" rx="3" fill="#fff" opacity=".45"/>`;
    case 'sugar': {
      const cube = (x: number, y: number) => `<path d="M${x} ${y} l14 -8 h30 l-14 8 Z" fill="#ffffff"/><rect x="${x}" y="${y}" width="30" height="30" fill="#eef1f6"/>
        <path d="M${x + 30} ${y} l14 -8 v30 l-14 8 Z" fill="#c9d1de"/>`;
      return `<defs>${G('l', '#ff8fbd', false, 0.45)}
        <linearGradient id="gl" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity=".6"/><stop offset=".35" stop-color="#fff" stop-opacity=".1"/><stop offset="1" stop-color="#bcd8ea" stop-opacity=".45"/></linearGradient></defs>
        <rect x="48" y="84" width="124" height="146" rx="26" fill="#eaf5fb" opacity=".6"/>
        ${cube(64, 190)}${cube(108, 190)}${cube(84, 158)}${cube(124, 158)}${cube(70, 126)}${cube(110, 126)}
        <rect x="48" y="84" width="124" height="146" rx="26" fill="url(#gl)" stroke="#a6c8de" stroke-width="3"/>
        <rect x="42" y="62" width="136" height="30" rx="12" fill="url(#l)" stroke="#d9548f" stroke-width="2"/>
        <ellipse cx="110" cy="58" rx="22" ry="10" fill="#ff8fbd" stroke="#d9548f" stroke-width="2"/>
        <rect x="58" y="98" width="9" height="116" rx="4" fill="#fff" opacity=".75"/>`;
    }
    case 'butter': return `<defs>${G('bf', '#ffd84d', true, 0.4)}</defs>
      <ellipse cx="110" cy="210" rx="98" ry="24" fill="#c9d3e2"/><ellipse cx="110" cy="204" rx="98" ry="22" fill="#f4f7fb"/><ellipse cx="110" cy="204" rx="70" ry="13" fill="#e6ebf3"/>
      <path d="M46 132 L74 112 H178 L150 132 Z" fill="#fff1a8"/>
      <rect x="46" y="132" width="104" height="66" fill="url(#bf)"/>
      <path d="M150 132 L178 112 V176 L150 198 Z" fill="#e0ad24"/>
      <path d="M46 160 H150 V198 H46 Z" fill="#fff" opacity=".95"/><path d="M150 160 L178 140 V176 L150 198 Z" fill="#dfe6f0"/>
      <rect x="46" y="172" width="104" height="8" fill="#5fb8f5"/><path d="M150 172 L178 152 V160 L150 180 Z" fill="#3f8fc4"/>
      <path d="M46 160 L60 152 L74 160 L88 152 L102 160 L116 152 L130 160 L150 152" stroke="#e6ebf3" stroke-width="2" fill="none"/>
      ${shine(76, 122, 18, 4, -18, 0.8)}`;
    case 'choco': {
      const sq = [0, 1].flatMap((c) => [0, 1, 2].map((r) => {
        const x = 62 + c * 50, y = 34 + r * 40;
        return `<rect x="${x}" y="${y}" width="44" height="34" rx="5" fill="#6b3a24"/><rect x="${x + 4}" y="${y + 3}" width="36" height="26" rx="4" fill="#8a5232"/>
          <path d="M${x + 4} ${y + 29} V${y + 3} H${x + 40}" stroke="#b07a52" stroke-width="3" fill="none"/>`;
      })).join('');
      return `<defs>${G('w', '#ff5a6e', false, 0.35)}</defs>
        <rect x="56" y="28" width="106" height="200" rx="10" fill="#5a2e1c"/>
        ${sq}
        <path d="M50 154 L62 146 L74 156 L86 144 L98 156 L110 146 L122 156 L134 144 L146 156 L158 146 L170 154 V226 Q170 234 162 234 H58 Q50 234 50 226 Z" fill="url(#w)" stroke="#c22a42" stroke-width="2"/>
        <rect x="50" y="182" width="120" height="16" fill="#ffd34d"/><circle cx="110" cy="190" r="15" fill="#ffd34d" stroke="#d9a01a" stroke-width="3"/>
        <path d="M104 190 L110 182 L116 190 L110 198 Z" fill="#ff5a6e"/>
        ${shine(68, 190, 6, 24, 0, 0.6)}`;
    }
    case 'strawberry': return `<defs>${ballGrad('sb', '#ff9aa6', '#ef2f45', '#a3122a')}${G('lf', '#6fd36b', false, 0.4)}</defs>
      <path d="M110 228 Q46 192 42 126 Q40 86 80 78 Q110 72 140 78 Q180 86 178 126 Q174 192 110 228 Z" fill="url(#sb)" stroke="#a3122a" stroke-width="2"/>
      ${[[82, 112], [110, 104], [138, 112], [70, 144], [98, 140], [126, 140], [152, 146], [84, 172], [112, 172], [138, 176], [100, 200], [122, 202]]
        .map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="3.5" ry="5" fill="#ffe36a"/>`).join('')}
      <path d="M110 86 L74 66 L98 78 L84 46 L110 70 L136 46 L122 78 L146 66 Z" fill="url(#lf)" stroke="#3f9c3a" stroke-width="2" stroke-linejoin="round"/>
      <path d="M110 64 Q112 40 126 28" stroke="#3f9c3a" stroke-width="6" fill="none" stroke-linecap="round"/>
      ${shine(76, 112, 10, 18, -20, 0.75)}`;
    case 'cream': return `<defs><linearGradient id="cf" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#e6ecf4"/></linearGradient></defs>
      <path d="M60 92 L110 50 L160 92 Z" fill="#ffffff" stroke="#c9d3e2" stroke-width="3"/>
      <path d="M160 92 L110 50 L136 36 L186 78 Z" fill="#dfe6f0" stroke="#c9d3e2" stroke-width="3"/>
      <rect x="96" y="24" width="30" height="16" rx="4" fill="#ff8fbd"/>
      <rect x="60" y="92" width="100" height="138" fill="url(#cf)" stroke="#c9d3e2" stroke-width="3"/>
      <path d="M160 92 L186 78 V216 L160 230 Z" fill="#cdd6e3" stroke="#c9d3e2" stroke-width="3"/>
      <rect x="60" y="120" width="100" height="80" fill="#ffd0e4"/>
      <path d="M78 176 Q72 158 88 154 Q90 138 110 140 Q130 138 132 154 Q148 158 142 176 Z" fill="#fff"/>
      <path d="M160 120 L186 106 V186 L160 200 Z" fill="#f0b3cf"/>
      <rect x="66" y="98" width="9" height="124" rx="4" fill="#fff" opacity=".8"/>`;
  }
}

function ingredientTextures(): SvgTex[] {
  const ids: IngredientId[] = ['flour', 'egg', 'milk', 'sugar', 'butter', 'choco', 'strawberry', 'cream'];
  return ids.map((id) => ({ key: `pa_ing_${id}`, w: 220, h: 240, svg: svgDoc(220, 240, ingredientSvg(id)) }));
}

/** Colore delle "briciole" di ogni ingrediente quando cade nella ciotola. */
export const INGREDIENT_TINT: Record<IngredientId, number> = {
  flour: 0xffffff, egg: 0xffd84d, milk: 0xf4f8ff, sugar: 0xffffff, butter: 0xffe066, choco: 0x7a4428, strawberry: 0xff4a62, cream: 0xfff6fa,
};

// =====================================================================
// Forno e freezer (sportello separato che si apre verso il basso)
// =====================================================================

function applianceTextures(): SvgTex[] {
  const kinds = [
    { key: 'pa_oven', body: '#ffb8cc', inner: ['#7a3a52', '#2e1626'], emblem: `<circle cx="398" cy="139" r="22" fill="#fff"/><path d="M398 139 L398 124 M398 139 L410 146" stroke="#e0628f" stroke-width="5" stroke-linecap="round"/>` },
    { key: 'pa_freezer', body: '#a9dcf7', inner: ['#cdeaf7', '#6fa6c8'], emblem: `<path d="M398 116 V162 M378 128 L418 150 M418 128 L378 150" stroke="#fff" stroke-width="6" stroke-linecap="round"/>` },
  ];
  const out: SvgTex[] = [];
  for (const k of kinds) {
    const d = shade(k.body, -0.3);
    out.push({
      key: k.key, w: 560, h: 560, svg: svgDoc(560, 560, `<defs>${G('bd', k.body, false, 0.5)}
        <linearGradient id="in" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${k.inner[0]}"/><stop offset="1" stop-color="${k.inner[1]}"/></linearGradient>
        ${ballGrad('kn', '#ffffff', '#f1f4f9', '#b9c3d3')}</defs>
        <path d="M60 82 L104 52 H520 L476 82 Z" fill="${shade(k.body, 0.45)}"/>
        <path d="M476 82 L520 52 V494 L476 524 Z" fill="${d}"/>
        <rect x="40" y="82" width="436" height="442" rx="30" fill="url(#bd)" stroke="${shade(k.body, -0.4)}" stroke-width="3"/>
        <rect x="70" y="104" width="380" height="72" rx="20" fill="#fffaf4" stroke="${shade(k.body, -0.2)}" stroke-width="2"/>
        ${[110, 180, 250].map((x) => `<circle cx="${x}" cy="140" r="24" fill="url(#kn)" stroke="#9aa6b8" stroke-width="2"/><path d="M${x} 140 L${x} 122" stroke="#e0628f" stroke-width="6" stroke-linecap="round"/>`).join('')}
        <rect x="290" y="126" width="70" height="28" rx="8" fill="#3a2a52"/><rect x="298" y="132" width="54" height="16" rx="5" fill="#7ef0b4" opacity=".8"/>
        ${k.emblem}
        <rect x="92" y="196" width="336" height="232" rx="28" fill="url(#in)"/>
        <rect x="92" y="196" width="336" height="18" rx="9" fill="#000" opacity=".2"/>
        <path d="M112 300 H408 M112 368 H408" stroke="#c3cdda" stroke-width="5" opacity=".7"/>
        <rect x="70" y="448" width="380" height="54" rx="16" fill="${shade(k.body, -0.12)}"/><rect x="200" y="466" width="120" height="14" rx="7" fill="#fffaf4"/>
        <rect x="66" y="522" width="60" height="22" rx="8" fill="${shade(k.body, -0.45)}"/><rect x="392" y="522" width="60" height="22" rx="8" fill="${shade(k.body, -0.45)}"/>
        <path d="M58 120 V470" stroke="#fff" stroke-width="10" opacity=".45" stroke-linecap="round"/>`),
    });
    out.push({
      key: `${k.key}_door`, w: 360, h: 252, svg: svgDoc(360, 252, `<defs>${G('fd', k.body, false, 0.55)}
        <linearGradient id="mt" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#9aa6b8"/></linearGradient></defs>
        <path d="M4 26 Q4 6 24 6 H336 Q356 6 356 26 V230 Q356 248 336 248 H24 Q4 248 4 230 Z M40 56 V216 H320 V56 Z" fill="url(#fd)" fill-rule="evenodd" stroke="${shade(k.body, -0.4)}" stroke-width="3"/>
        <rect x="40" y="56" width="280" height="160" rx="10" fill="${k.key === 'pa_oven' ? '#3a1a2a' : '#2f6f9e'}" opacity="${k.key === 'pa_oven' ? 0.28 : 0.14}"/>
        <path d="M70 56 H130 L80 216 H40 V120 Z M190 56 H220 L170 216 H140 Z" fill="#fff" opacity=".22"/>
        <rect x="90" y="16" width="180" height="18" rx="9" fill="url(#mt)" stroke="#7d8aa0" stroke-width="2"/>`),
    });
  }
  return out;
}

// =====================================================================
// Teglie (impasto crudo / cotto) per ogni ricetta
// =====================================================================

const GOLD = '#f0b25e';

function moldSvg(r: Recipe, done: boolean): string {
  const bat = r.batter;
  const defs = `<defs>${B('bt', bat, 0.5)}${B('gd', GOLD, 0.6)}
    <linearGradient id="mt" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#eef2f8"/><stop offset=".5" stop-color="#c3cdda"/><stop offset="1" stop-color="#7d8aa0"/></linearGradient>
    ${G('ln', '#ff9cc4', false, 0.35)}${blur('s', 5)}</defs>
    <ellipse cx="170" cy="214" rx="150" ry="12" fill="#1d2440" opacity=".25" filter="url(#s)"/>`;
  const gloss = (cx: number, cy: number, rx: number) => shine(cx - rx * 0.35, cy - 3, rx * 0.35, 4, -6, 0.75);
  switch (r.id) {
    case 'cupcake': {
      const cups = [80, 170, 260].map((x) => `<path d="M${x - 40} 132 L${x - 30} 196 H${x + 30} L${x + 40} 132 Z" fill="url(#ln)"/>
        ${[-24, -8, 8, 24].map((o) => `<path d="M${x + o} 136 L${x + o * 0.75} 194" stroke="#d9548f" stroke-width="3" opacity=".45"/>`).join('')}
        ${done ? `<path d="M${x - 46} 136 Q${x - 44} 96 ${x} 92 Q${x + 44} 96 ${x + 46} 136 Q${x} 146 ${x - 46} 136 Z" fill="url(#gd)"/>${shine(x - 20, 108, 12, 6, -20, 0.6)}`
        : `<ellipse cx="${x}" cy="136" rx="40" ry="10" fill="url(#bt)"/>${gloss(x, 136, 40)}`}`).join('');
      return `${defs}<rect x="22" y="186" width="296" height="26" rx="10" fill="url(#mt)"/><rect x="22" y="186" width="296" height="5" rx="2" fill="#fff" opacity=".7"/>${cups}`;
    }
    case 'cookie': {
      const items = [[86, 150], [170, 136], [254, 150], [130, 176], [214, 176]].map(([x, y]) => done
        ? `<ellipse cx="${x}" cy="${y + 4}" rx="40" ry="18" fill="${shade(GOLD, -0.25)}"/><ellipse cx="${x}" cy="${y}" rx="40" ry="17" fill="url(#gd)"/>
           <circle cx="${x - 14}" cy="${y - 2}" r="5" fill="#6b3a24"/><circle cx="${x + 12}" cy="${y + 4}" r="5" fill="#6b3a24"/><circle cx="${x + 4}" cy="${y - 8}" r="4" fill="#6b3a24"/>`
        : `<circle cx="${x}" cy="${y - 6}" r="24" fill="url(#bt)"/><circle cx="${x - 6}" cy="${y - 10}" r="3.5" fill="#6b3a24"/><circle cx="${x + 8}" cy="${y - 2}" r="3.5" fill="#6b3a24"/>${shine(x - 8, y - 16, 7, 4, -20, 0.7)}`).join('');
      return `${defs}<path d="M14 196 L48 112 H292 L326 196 Z" fill="url(#mt)"/><path d="M14 196 H326 V210 H14 Z" fill="#8f9bb0"/>
        <path d="M34 190 L62 120 H278 L306 190 Z" fill="#f7f0e4"/>${items}`;
    }
    case 'cake': return `${defs}
      <path d="M60 110 V188 A110 26 0 0 0 280 188 V110 Z" fill="url(#mt)"/>
      <path d="M60 110 A110 26 0 0 1 280 110" stroke="#9aa6b8" stroke-width="5" fill="none"/>
      ${done ? `<path d="M64 112 Q70 52 170 46 Q270 52 276 112 Z" fill="url(#gd)"/>${shine(120, 70, 30, 9, -12, 0.55)}`
        : `<ellipse cx="170" cy="118" rx="104" ry="22" fill="url(#bt)"/>${gloss(170, 118, 104)}`}
      <path d="M60 110 A110 26 0 0 0 280 110" stroke="#eef2f8" stroke-width="6" fill="none"/>
      <path d="M76 130 V180" stroke="#fff" stroke-width="8" opacity=".55" stroke-linecap="round"/>`;
    case 'gelato': return `${defs}
      <path d="M70 100 L86 196 Q170 214 254 196 L270 100 Z" fill="#dff1fb" opacity=".75" stroke="#9fc9e2" stroke-width="3"/>
      ${done ? [[120, 92], [220, 92], [170, 62]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="50" fill="url(#bt)"/>
          <path d="M${x - 48} ${y + 12} Q${x - 30} ${y + 26} ${x - 14} ${y + 14} Q${x} ${y + 28} ${x + 16} ${y + 14} Q${x + 32} ${y + 26} ${x + 48} ${y + 12}" stroke="${shade(bat, -0.2)}" stroke-width="5" fill="none"/>
          ${shine(x - 18, y - 22, 14, 8, -25, 0.8)}`).join('')
        + [[90, 50], [250, 40], [170, 20]].map(([x, y]) => `<path d="${starPath(x, y, 12)}" fill="#fff"/>`).join('')
        : `<ellipse cx="170" cy="106" rx="96" ry="18" fill="url(#bt)"/>${gloss(170, 106, 96)}`}
      <path d="M70 100 A100 18 0 0 0 270 100" stroke="#fff" stroke-width="5" fill="none" opacity=".8"/>
      <path d="M90 112 L102 186" stroke="#fff" stroke-width="9" opacity=".6" stroke-linecap="round"/>`;
  }
}

function moldTextures(): SvgTex[] {
  return RECIPES.flatMap((r) => [false, true].map((done) => ({
    key: `pa_mold_${r.id}_${done ? 'done' : 'raw'}`, w: 340, h: 230, svg: svgDoc(340, 230, moldSvg(r, done)),
  })));
}

// =====================================================================
// Dolci da decorare: base, glassa (grigia, da colorare) e riflessi della glassa
// =====================================================================

interface DessertArt { w: number; h: number; base: string; fw: number; fh: number; frost: string; gloss: string; }

function dessertArt(r: Recipe): DessertArt {
  switch (r.id) {
    case 'cupcake': return {
      w: 380, h: 420,
      base: `<defs>${G('ln', '#ff9cc4', false, 0.4)}${B('gd', GOLD, 0.6)}</defs>
        <path d="M40 232 L82 404 H298 L340 232 Z" fill="url(#ln)" stroke="#d9548f" stroke-width="3"/>
        ${Array.from({ length: 9 }, (_, i) => { const x = 62 + i * 32; const xb = 96 + i * 23.5; return `<path d="M${x} 236 L${xb} 400" stroke="${i % 2 ? '#fff' : '#c9437e'}" stroke-width="${i % 2 ? 5 : 3}" opacity="${i % 2 ? 0.45 : 0.4}"/>`; }).join('')}
        <path d="M40 232 L82 404" stroke="#fff" stroke-width="8" opacity=".35"/>
        <path d="M28 238 Q36 154 190 146 Q344 154 352 238 Q190 262 28 238 Z" fill="url(#gd)" stroke="${shade(GOLD, -0.3)}" stroke-width="3"/>
        ${shine(110, 180, 40, 12, -12, 0.45)}`,
      fw: 360, fh: 300,
      frost: `<defs>${GREY}</defs>
        <path d="M14 262 Q-6 214 40 196 Q20 150 70 130 Q60 86 110 74 Q118 30 168 22 Q176 0 196 8 Q200 30 212 34 Q262 42 252 80 Q300 90 290 132 Q340 150 318 196 Q366 214 346 262 Q180 296 14 262 Z" fill="url(#gr)" stroke="#9a9a9a" stroke-width="3"/>
        <path d="M44 198 Q180 232 316 198 M74 132 Q180 160 286 132 M112 78 Q180 100 250 80" stroke="#9a9a9a" stroke-width="4" fill="none" opacity=".55"/>`,
      gloss: `${shine(98, 102, 30, 10, -14, 0.7)}${shine(70, 160, 34, 9, -10, 0.55)}${shine(56, 222, 30, 8, -6, 0.45)}${shine(170, 30, 12, 6, -20, 0.8)}`,
    };
    case 'cookie': return {
      w: 480, h: 300,
      base: `<defs>${B('gd', GOLD, 0.55)}</defs>
        <ellipse cx="240" cy="158" rx="222" ry="102" fill="${shade(GOLD, -0.35)}"/>
        <ellipse cx="240" cy="130" rx="222" ry="100" fill="url(#gd)" stroke="${shade(GOLD, -0.3)}" stroke-width="3"/>
        ${[[120, 100], [330, 90], [190, 180], [380, 160], [100, 160], [270, 60], [250, 200]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="14" ry="9" fill="#6b3a24"/><ellipse cx="${x - 4}" cy="${y - 3}" rx="5" ry="3" fill="#a8704a"/>`).join('')}
        ${[[160, 70], [300, 120], [210, 130], [350, 200]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="5" fill="${shade(GOLD, -0.2)}"/>`).join('')}
        ${shine(150, 70, 60, 14, -10, 0.35)}`,
      fw: 420, fh: 220,
      frost: `<defs>${GREY}</defs>
        <path d="${Array.from({ length: 24 }, (_, i) => {
          const a = (i / 24) * Math.PI * 2, rr = i % 2 ? 1 : 0.93;
          return `${i ? 'L' : 'M'}${(210 + Math.cos(a) * 186 * rr).toFixed(1)} ${(110 + Math.sin(a) * 86 * rr).toFixed(1)}`;
        }).join(' ')} Z" fill="url(#gr)" stroke="#9a9a9a" stroke-width="3" stroke-linejoin="round"/>
        <ellipse cx="210" cy="108" rx="150" ry="62" fill="none" stroke="#a9a9a9" stroke-width="3" opacity=".5"/>`,
      gloss: `${shine(130, 70, 60, 12, -8, 0.6)}${shine(280, 150, 26, 6, -8, 0.4)}`,
    };
    case 'cake': return {
      w: 480, h: 440,
      base: `<defs>${G('sp', GOLD, true, 0.45)}${G('bd', '#f4f7fb', true, 0.2)}</defs>
        <ellipse cx="240" cy="384" rx="232" ry="48" fill="#b9c3d3"/><ellipse cx="240" cy="370" rx="232" ry="48" fill="url(#bd)" stroke="#c8d0dd" stroke-width="2"/>
        <path d="M40 130 V330 A200 52 0 0 0 440 330 V130 Z" fill="url(#sp)"/>
        <path d="M40 222 A200 52 0 0 0 440 222 V250 A200 52 0 0 1 40 250 Z" fill="#fff4f8"/>
        <path d="M40 236 A200 52 0 0 0 440 236" stroke="#ff8fbd" stroke-width="6" fill="none"/>
        <path d="M64 150 V320" stroke="#fff" stroke-width="12" opacity=".35" stroke-linecap="round"/>
        <path d="M440 130 V330 A200 52 0 0 1 300 378" stroke="${shade(GOLD, -0.35)}" stroke-width="4" fill="none" opacity=".6"/>
        <ellipse cx="240" cy="130" rx="200" ry="52" fill="${shade(GOLD, 0.25)}"/>`,
      fw: 440, fh: 260,
      frost: `<defs>${GREY}</defs>
        <path d="M18 110 Q20 54 220 50 Q420 54 422 110 V140 Q410 150 404 176 Q398 200 388 176 Q380 156 360 168 Q350 220 336 222 Q322 220 318 178 Q300 180 280 186 Q270 236 252 236 Q236 234 232 192 Q210 194 190 192 Q184 214 170 214 Q156 212 154 188 Q132 184 112 178 Q108 206 92 206 Q76 204 74 168 Q48 158 34 146 Q18 140 18 110 Z" fill="url(#gr)" stroke="#9a9a9a" stroke-width="3"/>
        <ellipse cx="220" cy="106" rx="196" ry="50" fill="#ffffff" opacity=".35"/>`,
      gloss: `${shine(120, 82, 70, 14, -6, 0.6)}${shine(92, 190, 6, 12, 0, 0.6)}${shine(252, 220, 6, 12, 0, 0.6)}`,
    };
    case 'gelato': return {
      w: 320, h: 460,
      base: `<defs>${G('cn', '#f2c27a', false, 0.45)}${G('st', '#ff9cc4', true, 0.35)}</defs>
        <ellipse cx="160" cy="380" rx="64" ry="12" fill="#b9467a"/>
        <clipPath id="cc"><path d="M58 200 L160 430 L262 200 Z"/></clipPath>
        <path d="M58 200 L160 430 L262 200 Z" fill="url(#cn)"/>
        <g clip-path="url(#cc)" stroke="#c48a3c" stroke-width="4" opacity=".6">${Array.from({ length: 12 }, (_, i) => `<path d="M${-60 + i * 40} 180 L${80 + i * 40} 460"/><path d="M${380 - i * 40} 180 L${240 - i * 40} 460"/>`).join('')}</g>
        <path d="M58 200 L160 430 L262 200" fill="none" stroke="#c48a3c" stroke-width="3"/>
        <ellipse cx="160" cy="200" rx="104" ry="22" fill="#e9a95a"/>
        <path d="M74 206 L150 380" stroke="#fff" stroke-width="8" opacity=".35" stroke-linecap="round"/>
        <path d="M96 380 A64 12 0 0 0 224 380 L210 448 H110 Z" fill="url(#st)" stroke="#d9548f" stroke-width="3"/>
        <path d="M97 380 A63 12 0 0 0 223 380" stroke="#ffd0e4" stroke-width="5" fill="none"/>`,
      fw: 300, fh: 330,
      frost: `<defs>${GREY}</defs>
        <path d="M54 250 Q30 230 52 210 Q40 140 108 124 Q150 108 196 124 Q262 140 250 210 Q272 230 246 250 Q232 268 214 254 Q198 276 178 258 Q160 280 142 258 Q122 278 106 256 Q86 272 76 254 Q62 268 54 250 Z" fill="url(#gr)" stroke="#9a9a9a" stroke-width="3"/>
        <path d="M72 150 Q58 40 150 32 Q242 40 228 150 Q230 178 206 178 Q190 196 174 182 Q150 200 126 182 Q110 196 94 178 Q70 178 72 150 Z" fill="url(#gr)" stroke="#9a9a9a" stroke-width="3"/>`,
      gloss: `${shine(112, 80, 22, 12, -30, 0.75)}${shine(92, 170, 24, 10, -20, 0.55)}`,
    };
  }
}

function dessertTextures(): SvgTex[] {
  return RECIPES.flatMap((r) => {
    const a = dessertArt(r);
    return [
      { key: `pa_base_${r.id}`, w: a.w, h: a.h, svg: svgDoc(a.w, a.h, a.base) },
      { key: `pa_frost_${r.id}`, w: a.fw, h: a.fh, svg: svgDoc(a.fw, a.fh, a.frost) },
      { key: `pa_frost_${r.id}_hl`, w: a.fw, h: a.fh, svg: svgDoc(a.fw, a.fh, a.gloss) },
    ];
  });
}

// =====================================================================
// Decorazioni
// =====================================================================

function toppingSvg(id: ToppingId): string {
  switch (id) {
    case 'sprinkles': return [[30, 40, '#4fb3f7', 30], [56, 28, '#ffe14d', -40], [70, 52, '#5ed06a', 60], [40, 64, '#a97cf2', -10], [62, 74, '#ff6b6b', 25],
      [22, 58, '#ffb02e', 70], [80, 34, '#ff8fc2', -60], [48, 46, '#ffffff', 10], [76, 70, '#4fb3f7', 80], [34, 22, '#5ed06a', -20]]
      .map(([x, y, c, r]) => `<g transform="rotate(${r} ${x} ${y})"><rect x="${(x as number) - 10}" y="${(y as number) - 4}" width="20" height="8" rx="4" fill="${shade(c as string, -0.3)}"/>
        <rect x="${(x as number) - 10}" y="${(y as number) - 5}" width="20" height="7" rx="3.5" fill="${c}"/><rect x="${(x as number) - 6}" y="${(y as number) - 4}" width="8" height="2" rx="1" fill="#fff" opacity=".7"/></g>`).join('');
    case 'cherry': return `<defs>${ballGrad('c', '#ff9a9a', '#e8203a', '#8f0b1f')}</defs>
      <path d="M50 52 Q52 22 72 8" stroke="#4f8a2a" stroke-width="5" fill="none" stroke-linecap="round"/>
      <path d="M66 14 Q86 6 92 20 Q76 26 66 14 Z" fill="#6fd36b"/>
      <circle cx="50" cy="64" r="30" fill="url(#c)" stroke="#8f0b1f" stroke-width="2"/>${shine(40, 52, 9, 6, -30, 0.9)}`;
    case 'heart': return `<defs>${ballGrad('h', '#ffd0e4', '#ff5e9a', '#c4245f')}</defs>
      <path d="M50 90 Q8 62 10 34 Q12 12 32 12 Q44 12 50 26 Q56 12 68 12 Q88 12 90 34 Q92 62 50 90 Z" fill="url(#h)" stroke="#c4245f" stroke-width="2"/>${shine(30, 30, 9, 5, -35, 0.9)}`;
    case 'star': return `<defs>${lightGrad('s', '#fff6b0', '#ffcf2e', '#f08c00')}</defs>
      <path d="${starPath(51, 55, 44)}" fill="#c76a00" opacity=".5"/><path d="${starPath(50, 52, 44)}" fill="url(#s)" stroke="#e08a00" stroke-width="2.5" stroke-linejoin="round"/>
      ${shine(38, 34, 9, 5, -30, 0.9)}`;
    case 'strawberry': return `<defs>${ballGrad('sb', '#ff9aa6', '#ef2f45', '#a3122a')}</defs>
      <path d="M50 94 Q16 74 14 42 Q14 24 34 22 Q50 20 66 22 Q86 24 86 42 Q84 74 50 94 Z" fill="url(#sb)" stroke="#a3122a" stroke-width="2"/>
      ${[[34, 40], [52, 36], [68, 42], [40, 58], [60, 58], [50, 76]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="2.5" ry="3.5" fill="#ffe36a"/>`).join('')}
      <path d="M50 26 L32 14 L44 20 L38 4 L50 18 L62 4 L56 20 L68 14 Z" fill="#5ec25a" stroke="#3f9c3a" stroke-width="2" stroke-linejoin="round"/>${shine(30, 40, 5, 9, -20, 0.8)}`;
    case 'chocochip': return `<defs>${ballGrad('ch', '#c08a62', '#7a4428', '#3e1f10')}</defs>
      <path d="M50 10 Q56 38 78 58 Q90 82 50 88 Q10 82 22 58 Q44 38 50 10 Z" fill="url(#ch)" stroke="#3e1f10" stroke-width="2"/>${shine(38, 54, 6, 12, -20, 0.6)}`;
    case 'candy': return `<defs>${ballGrad('cd', '#c9f3ff', '#36b4f0', '#1a6fa8')}</defs>
      <path d="M26 50 L4 32 L8 68 Z M74 50 L96 32 L92 68 Z" fill="#7ad0f7" stroke="#1a6fa8" stroke-width="2" stroke-linejoin="round"/>
      <ellipse cx="50" cy="50" rx="28" ry="22" fill="url(#cd)" stroke="#1a6fa8" stroke-width="2"/>
      <path d="M32 36 Q40 50 34 66 M50 28 Q58 50 50 72 M66 34 Q74 50 66 66" stroke="#fff" stroke-width="5" fill="none" opacity=".85"/>${shine(40, 38, 8, 4, -20, 0.9)}`;
    case 'flower': return `<defs>${ballGrad('p', '#ffffff', '#ffe0ef', '#f59ac2')}${ballGrad('fc', '#fff6b0', '#ffcf2e', '#f08c00')}</defs>
      ${[0, 1, 2, 3, 4].map((i) => { const a = -Math.PI / 2 + i * (Math.PI * 2 / 5); return `<circle cx="${(50 + Math.cos(a) * 24).toFixed(1)}" cy="${(52 + Math.sin(a) * 24).toFixed(1)}" r="19" fill="url(#p)" stroke="#e57aab" stroke-width="2"/>`; }).join('')}
      <circle cx="50" cy="52" r="13" fill="url(#fc)"/>${shine(45, 47, 4, 3, -20, 0.9)}`;
  }
}

function toppingTextures(): SvgTex[] {
  return TOPPINGS.map((id) => ({ key: `pa_top_${id}`, w: 100, h: 100, svg: svgDoc(100, 100, toppingSvg(id)) }));
}

// =====================================================================
// Clienti-animaletti (busto dietro il bancone): attesa, bocca aperta, felice
// =====================================================================

/** Texture dei clienti: 40 px liberi in alto (orecchie) e busto lungo fino in fondo. */
export const CUST_H = 820;
const CUST_TOP = 40;
/** Distanza dalla base della texture alla bocca. */
export const CUST_MOUTH = CUST_H - CUST_TOP - 342;

interface Animal { fur: string; inner: string; muzzle: string; nose: string; shirt: string; ears: string; extra?: string; }

const ANIMALS: Record<CustomerId, Animal> = {
  bunny: {
    fur: '#fbf1f5', inner: '#ffb3cc', muzzle: '#ffffff', nose: '#ff7fa8', shirt: '#7fd1c1',
    ears: `<ellipse cx="160" cy="96" rx="34" ry="96" transform="rotate(-12 160 96)" fill="url(#fu)" stroke="#d9bfca" stroke-width="3"/>
      <ellipse cx="160" cy="100" rx="17" ry="72" transform="rotate(-12 160 100)" fill="#ffb3cc"/>
      <ellipse cx="280" cy="96" rx="34" ry="96" transform="rotate(12 280 96)" fill="url(#fu)" stroke="#d9bfca" stroke-width="3"/>
      <ellipse cx="280" cy="100" rx="17" ry="72" transform="rotate(12 280 100)" fill="#ffb3cc"/>`,
  },
  bear: {
    fur: '#c98b5a', inner: '#f0c9a5', muzzle: '#f3d9b8', nose: '#4a2a1e', shirt: '#ffd36b',
    ears: `<circle cx="120" cy="170" r="46" fill="url(#fu)"/><circle cx="120" cy="170" r="24" fill="#f0c9a5"/>
      <circle cx="320" cy="170" r="46" fill="url(#fu)"/><circle cx="320" cy="170" r="24" fill="#f0c9a5"/>`,
  },
  cat: {
    fur: '#ffb35c', inner: '#ffc9d8', muzzle: '#fff3e2', nose: '#ff7fa8', shirt: '#a9c8ff',
    ears: `<path d="M98 214 L112 104 L190 160 Z" fill="url(#fu)" stroke="#d9852a" stroke-width="3" stroke-linejoin="round"/><path d="M118 186 L124 132 L166 164 Z" fill="#ffc9d8"/>
      <path d="M342 214 L328 104 L250 160 Z" fill="url(#fu)" stroke="#d9852a" stroke-width="3" stroke-linejoin="round"/><path d="M322 186 L316 132 L274 164 Z" fill="#ffc9d8"/>`,
    extra: `<path d="M200 156 Q206 176 200 190 M220 150 V188 M240 156 Q234 176 240 190" stroke="#e08a2e" stroke-width="7" fill="none" stroke-linecap="round"/>
      <path d="M150 328 L96 318 M150 340 L98 344 M290 328 L344 318 M290 340 L342 344" stroke="#7a5a4a" stroke-width="3" stroke-linecap="round"/>`,
  },
  fox: {
    fur: '#ff8a3d', inner: '#fff1e2', muzzle: '#fffaf2', nose: '#3a2230', shirt: '#b8e986',
    ears: `<path d="M96 222 L104 92 L196 158 Z" fill="url(#fu)" stroke="#d9652a" stroke-width="3" stroke-linejoin="round"/><path d="M104 92 L116 128 L130 112 Z" fill="#3a2230"/><path d="M118 190 L120 132 L168 164 Z" fill="#fff1e2"/>
      <path d="M344 222 L336 92 L244 158 Z" fill="url(#fu)" stroke="#d9652a" stroke-width="3" stroke-linejoin="round"/><path d="M336 92 L324 128 L310 112 Z" fill="#3a2230"/><path d="M322 190 L320 132 L272 164 Z" fill="#fff1e2"/>`,
    extra: `<path d="M98 300 Q140 360 220 366 Q300 360 342 300 Q300 330 220 332 Q140 330 98 300 Z" fill="#fffaf2"/>`,
  },
};

function customerSvg(id: CustomerId, state: 'idle' | 'eat' | 'happy'): string {
  const a = ANIMALS[id];
  const eyes = state === 'happy'
    ? `<path d="M156 270 Q176 246 196 270 M244 270 Q264 246 284 270" stroke="#3a2230" stroke-width="9" fill="none" stroke-linecap="round"/>`
    : `<ellipse cx="176" cy="266" rx="16" ry="${state === 'eat' ? 22 : 20}" fill="#3a2230"/><ellipse cx="264" cy="266" rx="16" ry="${state === 'eat' ? 22 : 20}" fill="#3a2230"/>
       <circle cx="182" cy="256" r="6" fill="#fff"/><circle cx="270" cy="256" r="6" fill="#fff"/><circle cx="172" cy="276" r="3" fill="#fff" opacity=".7"/><circle cx="260" cy="276" r="3" fill="#fff" opacity=".7"/>`;
  const mouth = state === 'eat'
    ? `<ellipse cx="220" cy="342" rx="30" ry="26" fill="#8a2a3a"/><ellipse cx="220" cy="354" rx="18" ry="10" fill="#ff7f9a"/>`
    : state === 'happy'
      ? `<path d="M178 326 Q220 384 262 326 Z" fill="#8a2a3a"/><path d="M196 350 Q220 366 244 350 Q220 344 196 350 Z" fill="#ff7f9a"/>`
      : `<path d="M196 330 Q208 344 220 332 Q232 344 244 330" stroke="#3a2230" stroke-width="6" fill="none" stroke-linecap="round"/>`;
  return `<defs>${ballGrad('fu', shade(a.fur, 0.5), a.fur, shade(a.fur, -0.28))}${G('sh', a.shirt, false, 0.45)}</defs><g transform="translate(0 ${CUST_TOP})">
    <path d="M60 ${CUST_H - CUST_TOP} Q60 420 140 400 Q220 384 300 400 Q380 420 380 ${CUST_H - CUST_TOP} Z" fill="url(#sh)" stroke="${shade(a.shirt, -0.35)}" stroke-width="3"/>
    <path d="M150 404 L220 470 L290 404 Q220 420 150 404 Z" fill="#fff" stroke="#e7d6e0" stroke-width="2"/>
    <path d="M150 404 Q220 420 290 404" stroke="#ff8fbd" stroke-width="7" fill="none"/>
    <circle cx="220" cy="430" r="9" fill="#ff8fbd"/>
    ${a.ears}
    <circle cx="220" cy="280" r="140" fill="url(#fu)" stroke="${shade(a.fur, -0.35)}" stroke-width="3"/>
    ${a.extra ?? ''}
    <ellipse cx="220" cy="326" rx="70" ry="50" fill="${a.muzzle}"/>
    ${eyes}
    <ellipse cx="220" cy="304" rx="16" ry="11" fill="${a.nose}"/>${shine(214, 300, 5, 3, 0, 0.8)}
    ${mouth}
    <ellipse cx="146" cy="318" rx="20" ry="12" fill="#ff7fa8" opacity=".4"/><ellipse cx="294" cy="318" rx="20" ry="12" fill="#ff7fa8" opacity=".4"/>
    ${shine(150, 200, 30, 16, -35, 0.45)}</g>`;
}

function customerTextures(): SvgTex[] {
  return CUSTOMERS.flatMap((id) => (['idle', 'eat', 'happy'] as const).map((s) => ({
    key: `pa_cust_${id}_${s}`, w: 440, h: CUST_H, svg: svgDoc(440, CUST_H, customerSvg(id, s)),
  })));
}

// =====================================================================
// Varie: piattino, sac à poche, nuvoletta, briciole, vapore, pulsanti
// =====================================================================

function miscTextures(): SvgTex[] {
  const cupcakeIcon = `<path d="M26 52 Q20 36 36 32 Q38 16 54 16 Q70 14 70 30 Q84 34 78 52 Z" fill="#ffffff"/><path d="M28 58 H76 L70 86 H34 Z" fill="#ffffff"/>
    <path d="M40 62 L42 82 M52 62 V82 M64 62 L62 82" stroke="#ff7fb0" stroke-width="4"/>`;
  return [
    { key: 'pa_plate', w: 580, h: 130, svg: svgDoc(580, 130, `<defs>${blur('s', 6)}
      <linearGradient id="p" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#dfe6f0"/></linearGradient></defs>
      <ellipse cx="290" cy="82" rx="272" ry="34" fill="#1d2440" opacity=".25" filter="url(#s)"/>
      <ellipse cx="290" cy="70" rx="270" ry="44" fill="#c3cdda"/><ellipse cx="290" cy="62" rx="270" ry="44" fill="url(#p)" stroke="#c8d0dd" stroke-width="2"/>
      <ellipse cx="290" cy="64" rx="200" ry="28" fill="#eef2f8"/><path d="M50 52 Q150 24 290 22" stroke="#fff" stroke-width="7" fill="none" opacity=".9"/>
      <ellipse cx="290" cy="62" rx="236" ry="36" fill="none" stroke="#ffb3cc" stroke-width="4" opacity=".8"/>`) },
    { key: 'pa_bag', w: 150, h: 220, svg: svgDoc(150, 220, `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ffffff"/><stop offset=".5" stop-color="#e2e2e2"/><stop offset="1" stop-color="#a0a0a0"/></linearGradient></defs>
      <path d="M18 46 Q16 28 40 24 Q75 18 110 24 Q134 28 132 46 L86 182 H64 Z" fill="url(#g)" stroke="#8a8a8a" stroke-width="3" stroke-linejoin="round"/>
      <path d="M36 70 L68 170 M108 66 L82 170" stroke="#9a9a9a" stroke-width="3" opacity=".5"/>`) },
    { key: 'pa_bag_tip', w: 150, h: 220, svg: svgDoc(150, 220, `<defs><linearGradient id="m" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ffffff"/><stop offset=".5" stop-color="#c3cdda"/><stop offset="1" stop-color="#7d8aa0"/></linearGradient></defs>
      <path d="M14 34 Q16 12 75 10 Q134 12 136 34 Q75 44 14 34 Z" fill="#ffffff" stroke="#c8d0dd" stroke-width="3"/>
      <path d="M46 24 Q75 16 104 24" stroke="#ff8fbd" stroke-width="6" fill="none" stroke-linecap="round"/>
      <path d="M60 176 H90 L84 206 L80 214 L75 206 L70 214 L66 206 Z" fill="url(#m)" stroke="#6b788f" stroke-width="2" stroke-linejoin="round"/>
      ${shine(48, 90, 6, 30, -16, 0.6)}`) },
    { key: 'pa_bubble', w: 340, h: 300, svg: svgDoc(340, 300, `<defs>${ballGrad('bb', '#ffffff', '#ffffff', '#dfe9f5')}${blur('s', 5)}</defs>
      <g fill="#1d2440" opacity=".14" filter="url(#s)"><circle cx="96" cy="128" r="70"/><circle cx="176" cy="96" r="84"/><circle cx="252" cy="134" r="68"/><rect x="70" y="120" width="210" height="90" rx="45"/></g>
      <g fill="url(#bb)"><circle cx="92" cy="120" r="70"/><circle cx="172" cy="88" r="84"/><circle cx="248" cy="126" r="68"/><rect x="66" y="112" width="210" height="90" rx="45"/>
      <circle cx="74" cy="236" r="20"/><circle cx="40" cy="272" r="12"/></g>
      ${shine(140, 40, 30, 10, -12, 0.9)}`) },
    { key: 'pa_crumb', w: 30, h: 26, svg: svgDoc(30, 26, `<defs>${ballGrad('c', '#ffe2b0', GOLD, '#b06a1c')}</defs><path d="M4 16 L10 4 L22 6 L28 16 L18 24 L6 22 Z" fill="url(#c)"/>`) },
    { key: 'pa_steam', w: 90, h: 90, svg: svgDoc(90, 90, `<defs><radialGradient id="s"><stop offset="0" stop-color="#fff" stop-opacity=".85"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient></defs><circle cx="45" cy="45" r="44" fill="url(#s)"/>`) },
    { key: 'pa_badge', w: 150, h: 150, svg: svgDoc(150, 150, `<defs>${ballGrad('b', '#ffffff', '#fff3f8', '#f2c6d8')}${blur('s', 4)}</defs>
      <ellipse cx="75" cy="138" rx="50" ry="8" fill="#1d2440" opacity=".25" filter="url(#s)"/>
      <circle cx="75" cy="76" r="64" fill="#e9a9c4"/><circle cx="75" cy="70" r="64" fill="url(#b)" stroke="#e57aab" stroke-width="3"/>
      ${shine(52, 36, 24, 10, -25, 0.8)}`) },
    { key: 'pa_card', w: 380, h: 440, svg: svgDoc(380, 440, `<defs>${G('c', '#fff7fb', true, 0.4)}${blur('s', 8)}</defs>
      <rect x="22" y="34" width="340" height="396" rx="40" fill="#1d2440" opacity=".2" filter="url(#s)"/>
      <rect x="16" y="26" width="348" height="392" rx="40" fill="#f2b9d0"/>
      <rect x="16" y="14" width="348" height="392" rx="40" fill="url(#c)" stroke="#e57aab" stroke-width="4"/>
      <rect x="36" y="300" width="308" height="86" rx="26" fill="#ffe3ee"/>
      ${shine(110, 46, 70, 10, -4, 0.8)}`) },
    { key: 'pa_rays', w: 640, h: 640, svg: svgDoc(640, 640, `<defs><radialGradient id="r"><stop offset="0" stop-color="#fff" stop-opacity=".9"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient></defs>
      <g fill="url(#r)">${Array.from({ length: 12 }, (_, i) => { const a = (i / 12) * Math.PI * 2, b = a + 0.16;
        return `<path d="M320 320 L${(320 + Math.cos(a) * 320).toFixed(1)} ${(320 + Math.sin(a) * 320).toFixed(1)} L${(320 + Math.cos(b) * 320).toFixed(1)} ${(320 + Math.sin(b) * 320).toFixed(1)} Z"/>`; }).join('')}</g>
      <circle cx="320" cy="320" r="150" fill="url(#r)"/>`) },
    roundButton('pa_btn_showcase', '#ff7fb0', cupcakeIcon, 160),
    roundButton('pa_btn_serve', '#35c46a', 'next', 240),
  ];
}

export function gameTextures(): SvgTex[] {
  return [
    windowTex(), shelfTex(), lampTex('#9fe6c4', 'pa_lamp_a'), lampTex('#ffb3cc', 'pa_lamp_b'), fgJar(), fgStand(),
    ...bowlTextures(), ...ingredientTextures(), ...applianceTextures(), ...moldTextures(),
    ...dessertTextures(), ...toppingTextures(), ...customerTextures(), ...miscTextures(),
  ];
}
