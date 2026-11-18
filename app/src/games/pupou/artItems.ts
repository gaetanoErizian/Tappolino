import { svgDoc, type SvgTex } from '../../core/textures';
import { lightGrad, ballGrad, blur, starPath } from '../../core/art';

/** Cibo, vestiti, amici del parco e pezzi dei rompicapo di Pupou (SVG originali, stile 2.5D). */
const T = (key: string, w: number, h: number, body: string, vbW = w, vbH = h): SvgTex => ({ key, w, h, svg: svgDoc(w, h, body, vbW, vbH) });
const shine = (x: number, y: number, rx = 9, ry = 4.5, rot = -30, o = 0.7): string => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="#fff" opacity="${o}" transform="rotate(${rot} ${x} ${y})"/>`;

// ------------------------------------------------------------------ cibo (viewBox 100×100)
export const FOOD_ART: Record<string, string> = {
  apple: `<defs>${ballGrad('g', '#ffb09a', '#f2553d', '#b82a1a')}</defs><path d="M50 32 Q30 20 20 40 Q12 62 30 82 Q40 92 50 84 Q60 92 70 82 Q88 62 80 40 Q70 20 50 32 Z" fill="url(#g)" stroke="#8f1f12" stroke-width="3"/>
    <path d="M50 32 Q50 20 58 14" fill="none" stroke="#6a3a1a" stroke-width="5" stroke-linecap="round"/><path d="M58 18 Q72 10 78 22 Q66 28 58 18 Z" fill="#6cc24a" stroke="#3f8f2a" stroke-width="2"/>${shine(34, 48, 6, 10, 20, 0.6)}`,
  water: `<defs>${lightGrad('g', '#e8f8ff', '#8fd8ff', '#3fa3e0')}</defs><rect x="40" y="6" width="20" height="12" rx="4" fill="#2a83c4"/><path d="M38 18 H62 Q64 30 72 36 V86 Q72 94 64 94 H36 Q28 94 28 86 V36 Q36 30 38 18 Z" fill="url(#g)" stroke="#2a83c4" stroke-width="3"/>
    <rect x="28" y="52" width="44" height="22" fill="#fff" opacity=".85"/><path d="M50 56 Q58 66 50 70 Q42 66 50 56 Z" fill="#3fa3e0"/><rect x="34" y="38" width="6" height="46" rx="3" fill="#fff" opacity=".6"/>`,
  banana: `<defs>${lightGrad('g', '#fff7a8', '#ffdd3c', '#e0a81e')}</defs><path d="M22 20 Q18 62 44 80 Q68 94 88 78 Q92 74 86 70 Q62 76 46 58 Q34 44 34 20 Q28 12 22 20 Z" fill="url(#g)" stroke="#b8860b" stroke-width="3" stroke-linejoin="round"/>
    <path d="M22 20 Q28 12 34 20" fill="#7a5a12" stroke="#5a4010" stroke-width="3"/><path d="M30 30 Q30 58 52 74" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".6"/><circle cx="86" cy="74" r="4" fill="#5a4010"/>`,
  beans: `<defs>${lightGrad('g', '#ffe0b0', '#f58a2a', '#b85a0a')}${lightGrad('m', '#f4f6fa', '#c8cfdc', '#8a94a8')}</defs><rect x="22" y="18" width="56" height="70" rx="6" fill="url(#g)" stroke="#8f4406" stroke-width="3"/>
    <ellipse cx="50" cy="18" rx="28" ry="8" fill="url(#m)" stroke="#6a7488" stroke-width="3"/><ellipse cx="50" cy="88" rx="28" ry="7" fill="#8a94a8" opacity=".9"/><rect x="22" y="36" width="56" height="34" fill="#fff6e2"/>
    <g fill="#9a3a1a" stroke="#6a2410" stroke-width="1.5"><path d="M34 48 q6 -8 12 0 q2 8 -6 8 q-2 -4 -6 -8 Z"/><path d="M52 52 q8 -6 12 2 q0 8 -8 6 q0 -4 -4 -8 Z"/><path d="M42 60 q6 -6 11 1 q0 7 -7 5 q0 -3 -4 -6 Z"/></g><rect x="27" y="22" width="6" height="62" rx="3" fill="#fff" opacity=".45"/>`,
  milk: `<defs>${lightGrad('g', '#ffffff', '#f1f6ff', '#c2d2ee')}</defs><path d="M30 34 L42 14 H62 L72 34 V88 Q72 94 66 94 H36 Q30 94 30 88 Z" fill="url(#g)" stroke="#7f95bd" stroke-width="3" stroke-linejoin="round"/>
    <path d="M30 34 H72 L62 14 H42 Z" fill="#dfe8f8" stroke="#7f95bd" stroke-width="3" stroke-linejoin="round"/><rect x="30" y="50" width="42" height="24" fill="#5aa8f0"/>
    <path d="M40 62 q4 -8 8 0 q4 8 8 0 q4 -8 8 0" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round"/><rect x="48" y="8" width="10" height="8" rx="2" fill="#5aa8f0"/>`,
  carrot: `<defs>${lightGrad('g', '#ffc88a', '#ff8a2a', '#c85a0a')}</defs><path d="M34 34 Q52 22 66 38 Q58 70 30 92 Q22 94 24 86 Q26 54 34 34 Z" fill="url(#g)" stroke="#a84808" stroke-width="3" stroke-linejoin="round"/>
    <path d="M40 46 l10 4 M36 60 l9 3 M48 58 l8 3" stroke="#a84808" stroke-width="3" stroke-linecap="round" opacity=".7"/><g fill="#5fbf3f" stroke="#3a8f24" stroke-width="2.5"><path d="M46 30 Q40 10 52 6 Q58 18 52 32 Z"/><path d="M54 32 Q62 12 76 14 Q74 28 60 36 Z"/><path d="M60 38 Q76 28 86 36 Q78 46 62 42 Z"/></g>`,
  soda: `<defs>${lightGrad('g', '#e4c8ff', '#a45cf0', '#6a2ab8')}${lightGrad('m', '#f4f6fa', '#c8cfdc', '#8a94a8')}</defs><path d="M30 20 Q30 14 36 12 H64 Q70 14 70 20 V84 Q70 92 62 92 H38 Q30 92 30 84 Z" fill="url(#g)" stroke="#4f1f8f" stroke-width="3"/>
    <ellipse cx="50" cy="14" rx="18" ry="5" fill="url(#m)" stroke="#6a7488" stroke-width="2.5"/><path d="M30 40 Q50 54 70 40 V62 Q50 76 30 62 Z" fill="#fff" opacity=".9"/><circle cx="44" cy="54" r="5" fill="#ff7ab8"/><circle cx="56" cy="60" r="4" fill="#ffd23a"/><circle cx="56" cy="48" r="3" fill="#5ad0ff"/>
    <rect x="35" y="20" width="5" height="64" rx="2.5" fill="#fff" opacity=".45"/>`,
  broccoli: `<defs>${ballGrad('g', '#b6f08a', '#5fbf3f', '#2f8a22')}${lightGrad('s', '#d8f0a8', '#9fd46a', '#6aa83a')}</defs><path d="M42 54 H58 L62 90 Q50 96 38 90 Z" fill="url(#s)" stroke="#4f8a2a" stroke-width="3" stroke-linejoin="round"/>
    <g fill="url(#g)" stroke="#256e1a" stroke-width="3"><circle cx="30" cy="46" r="18"/><circle cx="70" cy="46" r="18"/><circle cx="50" cy="30" r="22"/><circle cx="50" cy="52" r="16"/></g>${shine(40, 20, 9, 4)}${shine(22, 38, 6, 3)}`,
  cheese: `<defs>${lightGrad('g', '#fff3a8', '#ffd23a', '#e0a000')}</defs><path d="M10 62 L70 22 Q90 30 90 56 V82 H10 Z" fill="url(#g)" stroke="#b87a00" stroke-width="3" stroke-linejoin="round"/><path d="M10 62 H90" stroke="#b87a00" stroke-width="3"/>
    <path d="M10 62 L70 22 Q90 30 90 56 L90 62 Z" fill="#ffe680"/><g fill="#e0a000"><circle cx="30" cy="72" r="6"/><circle cx="56" cy="74" r="4.5"/><circle cx="76" cy="70" r="6"/><ellipse cx="62" cy="44" rx="7" ry="5"/></g>
    <path d="M26 20 q-6 -8 0 -14 M40 14 q-6 -6 0 -12" fill="none" stroke="#9cc83a" stroke-width="4" stroke-linecap="round"/>`,
  icecream: `<defs>${ballGrad('g', '#ffe0f0', '#ff8fc2', '#d9508f')}${lightGrad('c', '#ffe4b0', '#f0b25a', '#b87a2a')}</defs><path d="M30 46 H70 L50 96 Z" fill="url(#c)" stroke="#8f5a1a" stroke-width="3" stroke-linejoin="round"/>
    <path d="M36 56 L62 66 M40 68 L58 76 M64 56 L40 66" stroke="#8f5a1a" stroke-width="2" opacity=".6"/><circle cx="50" cy="32" r="26" fill="url(#g)" stroke="#b83a78" stroke-width="3"/>
    <path d="M26 42 Q32 54 40 44 Q48 56 56 44 Q64 54 74 42" fill="url(#g)" stroke="#b83a78" stroke-width="3" stroke-linejoin="round"/>${shine(40, 18, 10, 5)}<circle cx="60" cy="10" r="6" fill="#e0283a" stroke="#8f1420" stroke-width="2"/>`,
  pizza: `<defs>${lightGrad('g', '#fff0a8', '#ffcf5a', '#e09a20')}</defs><path d="M10 26 Q50 6 90 26 L52 94 Q50 96 48 94 Z" fill="url(#g)" stroke="#a86a10" stroke-width="3" stroke-linejoin="round"/>
    <path d="M10 26 Q50 6 90 26 L86 34 Q50 16 14 34 Z" fill="#d98a3a" stroke="#a86a10" stroke-width="3" stroke-linejoin="round"/><g fill="#e0382a" stroke="#9a1c14" stroke-width="2"><circle cx="38" cy="42" r="8"/><circle cx="62" cy="46" r="7"/><circle cx="50" cy="68" r="7"/></g>
    <g fill="#4faa3a"><ellipse cx="50" cy="34" rx="5" ry="3"/><ellipse cx="40" cy="58" rx="4" ry="2.5"/><ellipse cx="60" cy="62" rx="4" ry="2.5"/></g>`,
  cake: `<defs>${lightGrad('g', '#fff0e0', '#ffd0a0', '#e0a060')}${lightGrad('p', '#ffe0f0', '#ff9ac8', '#e0609a')}</defs><path d="M12 86 V52 L80 36 L90 46 V86 Z" fill="url(#g)" stroke="#a86a3a" stroke-width="3" stroke-linejoin="round"/>
    <path d="M12 52 L80 36 L90 46 L20 62 Z" fill="url(#p)" stroke="#b84a80" stroke-width="3" stroke-linejoin="round"/><path d="M14 70 L90 62" stroke="#ff9ac8" stroke-width="6"/>
    <path d="M12 52 q4 12 10 6 q4 10 10 2" fill="url(#p)" stroke="#b84a80" stroke-width="2"/><circle cx="54" cy="36" r="9" fill="#e0283a" stroke="#8f1420" stroke-width="2.5"/><path d="M54 28 q4 -10 12 -12" fill="none" stroke="#3a8f24" stroke-width="3" stroke-linecap="round"/>${shine(50, 33, 3, 2)}`,
  soup: `<defs>${lightGrad('g', '#ffffff', '#e8f0ff', '#a8b8dc')}${ballGrad('s', '#d8f08a', '#9fd04a', '#5f9a1a')}</defs><path d="M8 46 H92 Q90 84 60 90 H40 Q10 84 8 46 Z" fill="url(#g)" stroke="#6f84b0" stroke-width="3"/>
    <ellipse cx="50" cy="46" rx="42" ry="12" fill="url(#s)" stroke="#6f84b0" stroke-width="3"/><g fill="#f58a2a"><circle cx="36" cy="46" r="4"/><circle cx="62" cy="44" r="4"/></g><g fill="#9a3a1a"><ellipse cx="50" cy="50" rx="5" ry="3"/><ellipse cx="72" cy="48" rx="4" ry="2.5"/></g>
    <path d="M34 30 q-6 -8 0 -14 q6 -6 0 -12 M54 28 q-6 -8 0 -14 q6 -6 0 -10 M72 30 q-5 -7 0 -12" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".85"/><rect x="40" y="90" width="20" height="6" rx="3" fill="#a8b8dc"/>`,
};

// ------------------------------------------------------------------ vestiti
/** [larghezza, altezza, disegno] — cappelli: l'origine è in basso al centro; occhiali e collo: al centro */
export const WEAR_ART: Record<string, [number, number, string]> = {
  bow: [200, 120, `<defs>${ballGrad('g', '#ffc2e0', '#ff5ea8', '#c4246e')}</defs><path d="M100 60 Q60 10 16 22 Q2 60 16 98 Q60 110 100 60 Z" fill="url(#g)" stroke="#a01a58" stroke-width="4" stroke-linejoin="round"/>
    <path d="M100 60 Q140 10 184 22 Q198 60 184 98 Q140 110 100 60 Z" fill="url(#g)" stroke="#a01a58" stroke-width="4" stroke-linejoin="round"/><circle cx="100" cy="60" r="20" fill="url(#g)" stroke="#a01a58" stroke-width="4"/>${shine(46, 40, 16, 6)}${shine(140, 38, 14, 5)}`],
  cap: [280, 150, `<defs>${ballGrad('g', '#9fd8ff', '#3a9af0', '#1a5fb8')}</defs><path d="M150 108 Q230 96 276 124 Q268 142 150 132 Z" fill="#1a5fb8" stroke="#123f80" stroke-width="4" stroke-linejoin="round"/>
    <path d="M30 128 Q26 26 120 20 Q210 26 214 128 Q120 142 30 128 Z" fill="url(#g)" stroke="#123f80" stroke-width="4" stroke-linejoin="round"/><circle cx="120" cy="22" r="10" fill="#ffd23a" stroke="#b87a00" stroke-width="3"/>
    <path d="M120 30 V128 M70 34 Q56 80 60 130 M170 34 Q184 80 180 130" fill="none" stroke="#123f80" stroke-width="3" opacity=".5"/>${shine(80, 52, 22, 8)}`],
  roll: [230, 190, `<defs>${lightGrad('g', '#ffffff', '#f2f4fb', '#c4cbe0')}</defs><path d="M168 96 Q214 100 210 150 Q206 178 222 186 Q190 190 184 158 Q180 124 160 120 Z" fill="url(#g)" stroke="#8d96b8" stroke-width="4" stroke-linejoin="round"/>
    <rect x="34" y="42" width="140" height="140" rx="10" fill="url(#g)" stroke="#8d96b8" stroke-width="4"/><ellipse cx="104" cy="44" rx="70" ry="26" fill="#fff" stroke="#8d96b8" stroke-width="4"/><ellipse cx="104" cy="44" rx="26" ry="10" fill="#c9a877" stroke="#8f6a3a" stroke-width="3"/>
    <path d="M52 86 H160 M52 126 H160" stroke="#8d96b8" stroke-width="2.5" stroke-dasharray="5 8" opacity=".7"/>`],
  chef: [250, 230, `<defs>${ballGrad('g', '#ffffff', '#f4f6fb', '#c8d0e4')}</defs><g fill="url(#g)" stroke="#8d96b8" stroke-width="4"><circle cx="66" cy="96" r="52"/><circle cx="184" cy="96" r="52"/><circle cx="125" cy="66" r="62"/></g>
    <g fill="url(#g)"><circle cx="66" cy="96" r="50"/><circle cx="184" cy="96" r="50"/><circle cx="125" cy="66" r="60"/></g><rect x="48" y="130" width="154" height="92" rx="12" fill="url(#g)" stroke="#8d96b8" stroke-width="4"/>
    <path d="M80 150 V210 M125 150 V210 M170 150 V210" stroke="#8d96b8" stroke-width="3" opacity=".5"/>${shine(96, 36, 26, 10)}`],
  party: [190, 240, `<defs>${lightGrad('g', '#ffe680', '#ff9a3c', '#e0562a')}${ballGrad('p', '#ffe0f4', '#ff7ac0', '#c93a8a')}</defs><path d="M95 30 L174 228 Q95 244 16 228 Z" fill="url(#g)" stroke="#a83a12" stroke-width="4" stroke-linejoin="round"/>
    <g fill="#36a9f0"><circle cx="86" cy="100" r="11"/><circle cx="62" cy="170" r="12"/><circle cx="126" cy="184" r="12"/><circle cx="112" cy="134" r="9"/></g><path d="M16 228 Q95 244 174 228" fill="none" stroke="#fff" stroke-width="10" stroke-linecap="round" opacity=".85"/>
    <circle cx="95" cy="28" r="24" fill="url(#p)" stroke="#a01a68" stroke-width="4"/>${shine(86, 18, 9, 4)}`],
  crown: [260, 180, `<defs>${lightGrad('g', '#fff6b0', '#ffcf2e', '#e08a00')}</defs><path d="M22 170 L10 44 L72 96 L130 14 L188 96 L250 44 L238 170 Z" fill="url(#g)" stroke="#b86e00" stroke-width="5" stroke-linejoin="round"/>
    <rect x="22" y="138" width="216" height="32" rx="8" fill="#ffb81f" stroke="#b86e00" stroke-width="4"/><circle cx="130" cy="154" r="11" fill="#f2553d" stroke="#8f1f12" stroke-width="2.5"/><circle cx="70" cy="154" r="8" fill="#36a9f0" stroke="#1a5fb8" stroke-width="2.5"/><circle cx="190" cy="154" r="8" fill="#35c46a" stroke="#1a7a3a" stroke-width="2.5"/>
    <circle cx="10" cy="42" r="10" fill="#fff6b0" stroke="#b86e00" stroke-width="3"/><circle cx="130" cy="14" r="11" fill="#fff6b0" stroke="#b86e00" stroke-width="3"/><circle cx="250" cy="42" r="10" fill="#fff6b0" stroke="#b86e00" stroke-width="3"/><path d="M40 70 L60 110" stroke="#fff" stroke-width="6" stroke-linecap="round" opacity=".6"/>`],
  round: [270, 110, `<g fill="#c8ecff" fill-opacity=".45" stroke="#e0382a" stroke-width="9"><circle cx="74" cy="55" r="42"/><circle cx="196" cy="55" r="42"/></g><path d="M116 50 Q135 38 154 50" fill="none" stroke="#e0382a" stroke-width="9" stroke-linecap="round"/>
    <path d="M32 50 L8 40 M238 50 L262 40" stroke="#e0382a" stroke-width="8" stroke-linecap="round"/><path d="M50 36 L70 28 M172 36 L192 28" stroke="#fff" stroke-width="6" stroke-linecap="round" opacity=".8"/>`],
  shades: [280, 110, `<defs>${lightGrad('g', '#5a6480', '#22283a', '#0c0f18')}</defs><path d="M22 28 H126 Q130 28 128 40 Q122 90 76 92 Q30 90 20 40 Q18 28 22 28 Z M154 28 H258 Q262 28 260 40 Q250 90 204 92 Q158 90 152 40 Q150 28 154 28 Z" fill="url(#g)" stroke="#05070c" stroke-width="5" stroke-linejoin="round"/>
    <path d="M124 34 Q140 26 156 34" fill="none" stroke="#05070c" stroke-width="9"/><path d="M20 34 L4 28 M260 34 L276 28" stroke="#05070c" stroke-width="8" stroke-linecap="round"/><path d="M40 42 L66 38 M172 42 L198 38" stroke="#fff" stroke-width="6" stroke-linecap="round" opacity=".6"/>`],
  stars: [290, 130, `<defs>${lightGrad('g', '#fff6b0', '#ffcf2e', '#f08c00')}</defs><g fill="url(#g)" stroke="#c47a00" stroke-width="4" stroke-linejoin="round"><path d="${starPath(78, 66, 62, 0.56)}"/><path d="${starPath(212, 66, 62, 0.56)}"/></g>
    <g fill="#bfe8ff" fill-opacity=".85" stroke="#c47a00" stroke-width="3"><circle cx="78" cy="68" r="27"/><circle cx="212" cy="68" r="27"/></g><path d="M112 62 H178" stroke="#c47a00" stroke-width="8"/><path d="M64 58 L78 52 M198 58 L212 52" stroke="#fff" stroke-width="5" stroke-linecap="round"/>`],
  bib: [190, 130, `<defs>${lightGrad('g', '#ffffff', '#f1f6ff', '#c2d2ee')}</defs><path d="M30 8 Q95 44 160 8 Q186 60 150 108 Q95 136 40 108 Q4 60 30 8 Z" fill="url(#g)" stroke="#5aa8f0" stroke-width="6" stroke-linejoin="round"/>
    <path d="M95 52 Q112 72 95 96 Q78 72 95 52 Z" fill="#ff8fa8"/><circle cx="68" cy="66" r="7" fill="#ffd23a"/><circle cx="122" cy="66" r="7" fill="#5ad08a"/>`],
  bowtie: [170, 90, `<defs>${ballGrad('g', '#ff9a8a', '#e83a2a', '#a8180e')}</defs><path d="M85 45 L16 10 Q6 45 16 80 Z M85 45 L154 10 Q164 45 154 80 Z" fill="url(#g)" stroke="#7a0e08" stroke-width="4" stroke-linejoin="round"/>
    <g fill="#fff" opacity=".9"><circle cx="34" cy="34" r="5"/><circle cx="44" cy="58" r="5"/><circle cx="136" cy="34" r="5"/><circle cx="126" cy="58" r="5"/></g><rect x="68" y="26" width="34" height="38" rx="10" fill="url(#g)" stroke="#7a0e08" stroke-width="4"/>`],
  medal: [150, 140, `<defs>${ballGrad('g', '#fff6b0', '#ffcf2e', '#e08a00')}</defs><path d="M36 0 H70 L84 62 H58 Z" fill="#36a9f0" stroke="#1a5fb8" stroke-width="3"/><path d="M114 0 H80 L66 62 H92 Z" fill="#f2553d" stroke="#8f1f12" stroke-width="3"/>
    <circle cx="75" cy="92" r="42" fill="url(#g)" stroke="#b86e00" stroke-width="4"/><path d="${starPath(75, 93, 24)}" fill="#fff6b0" stroke="#d98a00" stroke-width="2.5" stroke-linejoin="round"/>${shine(58, 68, 12, 5)}`],
};

// ------------------------------------------------------------------ amici del parco (260×300)
const friendFace = (cx: number, cy: number, c = '#3a2a52'): string => `<ellipse cx="${cx - 30}" cy="${cy}" rx="15" ry="18" fill="#fff" stroke="${c}" stroke-width="3"/><ellipse cx="${cx + 30}" cy="${cy}" rx="15" ry="18" fill="#fff" stroke="${c}" stroke-width="3"/>
  <circle cx="${cx - 28}" cy="${cy + 3}" r="8.5" fill="#2b1a2a"/><circle cx="${cx + 32}" cy="${cy + 3}" r="8.5" fill="#2b1a2a"/><circle cx="${cx - 31}" cy="${cy - 1}" r="3" fill="#fff"/><circle cx="${cx + 29}" cy="${cy - 1}" r="3" fill="#fff"/>
  <path d="M${cx - 22} ${cy + 32} Q${cx} ${cy + 56} ${cx + 22} ${cy + 32} Q${cx} ${cy + 40} ${cx - 22} ${cy + 32} Z" fill="#7a2a2a" stroke="${c}" stroke-width="3" stroke-linejoin="round"/>
  <circle cx="${cx - 56}" cy="${cy + 24}" r="12" fill="#ff8fa8" opacity=".5"/><circle cx="${cx + 56}" cy="${cy + 24}" r="12" fill="#ff8fa8" opacity=".5"/>`;
const FRIEND_ART: Record<string, string> = {
  roll: `<defs>${lightGrad('g', '#ffffff', '#f2f4fb', '#bcc4dc')}</defs><path d="M196 110 Q250 116 244 190 Q240 240 256 262 Q214 262 212 214 Q210 150 190 140 Z" fill="url(#g)" stroke="#8d96b8" stroke-width="4" stroke-linejoin="round"/>
    <ellipse cx="96" cy="282" rx="26" ry="12" fill="#bcc4dc" stroke="#8d96b8" stroke-width="3"/><ellipse cx="156" cy="282" rx="26" ry="12" fill="#bcc4dc" stroke="#8d96b8" stroke-width="3"/>
    <rect x="40" y="56" width="170" height="220" rx="14" fill="url(#g)" stroke="#8d96b8" stroke-width="4"/><ellipse cx="125" cy="58" rx="85" ry="30" fill="#fff" stroke="#8d96b8" stroke-width="4"/><ellipse cx="125" cy="58" rx="32" ry="11" fill="#c9a877" stroke="#8f6a3a" stroke-width="3"/>
    <path d="M56 226 H196" stroke="#8d96b8" stroke-width="2.5" stroke-dasharray="5 8" opacity=".7"/>${friendFace(125, 140, '#5a6488')}`,
  soap: `<defs>${lightGrad('g', '#ffe4f2', '#ff9ccb', '#d95a98')}<radialGradient id="b" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#bfe8ff"/></radialGradient></defs>
    <ellipse cx="90" cy="284" rx="26" ry="11" fill="#d95a98" stroke="#a83a74" stroke-width="3"/><ellipse cx="170" cy="284" rx="26" ry="11" fill="#d95a98" stroke="#a83a74" stroke-width="3"/>
    <rect x="22" y="96" width="216" height="180" rx="62" fill="url(#g)" stroke="#a83a74" stroke-width="4"/><rect x="46" y="112" width="120" height="26" rx="13" fill="#fff" opacity=".55"/>
    <g fill="url(#b)" stroke="#7cc4f0" stroke-width="3"><circle cx="70" cy="70" r="34"/><circle cx="130" cy="48" r="42"/><circle cx="190" cy="76" r="30"/><circle cx="216" cy="34" r="14"/><circle cx="34" cy="30" r="10"/></g>${friendFace(130, 176, '#8a2a5a')}`,
  plunger: `<defs>${lightGrad('w', '#f0cf9a', '#c9965a', '#8f6230')}${ballGrad('g', '#ff9a8a', '#e8452a', '#a8200e')}</defs><rect x="114" y="6" width="32" height="150" rx="14" fill="url(#w)" stroke="#6a4520" stroke-width="4"/>
    <rect x="120" y="16" width="8" height="120" rx="4" fill="#fff" opacity=".4"/><path d="M20 276 Q20 150 130 144 Q240 150 240 276 Q130 298 20 276 Z" fill="url(#g)" stroke="#7a140a" stroke-width="4" stroke-linejoin="round"/>
    <path d="M20 268 Q130 292 240 268 Q244 284 236 288 Q130 306 24 288 Q16 284 20 268 Z" fill="#c4301a" stroke="#7a140a" stroke-width="4" stroke-linejoin="round"/><ellipse cx="84" cy="176" rx="34" ry="12" fill="#fff" opacity=".4" transform="rotate(-24 84 176)"/>${friendFace(130, 212, '#7a140a')}`,
};

// ------------------------------------------------------------------ pezzi dei rompicapo
function puzzleTextures(): SvgTex[] {
  const out: SvgTex[] = [];
  const tile = (g: string, edge: string, extra: string) => `<defs>${g}${blur('s', 3)}</defs><rect x="8" y="12" width="184" height="184" rx="26" fill="${edge}"/><rect x="6" y="4" width="188" height="184" rx="26" fill="url(#g)" stroke="${edge}" stroke-width="4"/>${extra}`;
  out.push(T('pp_tile_dirty', 200, 200, tile(lightGrad('g', '#f4ead8', '#e6d6b8', '#c9b48a'), '#a8946a', `<g fill="#8a6a3a" opacity=".55" filter="url(#s)"><path d="M40 60 q24 -26 50 -6 q20 18 -6 34 q-34 14 -44 -28 Z"/><path d="M110 120 q22 -12 36 8 q6 22 -22 22 q-24 -4 -14 -30 Z"/><circle cx="58" cy="140" r="12"/><circle cx="150" cy="56" r="10"/></g>
    <path d="M150 150 q-6 -10 0 -18 M164 150 q-6 -10 0 -18" fill="none" stroke="#9cc83a" stroke-width="5" stroke-linecap="round" opacity=".8"/>`)));
  out.push(T('pp_tile_clean', 200, 200, tile(lightGrad('g', '#f2fdff', '#b8ecfa', '#74cdea'), '#4aa9cc', `<rect x="20" y="16" width="160" height="40" rx="20" fill="#fff" opacity=".6"/>
    <path d="M150 110 Q154 138 180 142 Q154 146 150 174 Q146 146 120 142 Q146 138 150 110 Z" fill="#fff"/><path d="M60 84 Q62 98 76 100 Q62 102 60 116 Q58 102 44 100 Q58 98 60 84 Z" fill="#fff" opacity=".9"/>`)));
  out.push(T('pp_tile_block', 200, 200, tile(lightGrad('g', '#dff0ff', '#a8cdf0', '#7aa4d6'), '#5a84b8', `<defs>${ballGrad('d', '#fff7a8', '#ffd83a', '#e0a000')}</defs>
    <ellipse cx="100" cy="158" rx="62" ry="12" fill="#1d2440" opacity=".25"/><path d="M40 118 Q36 84 76 92 Q100 96 128 90 Q168 86 166 122 Q162 160 100 160 Q46 160 40 118 Z" fill="url(#d)" stroke="#b87a00" stroke-width="4"/>
    <circle cx="124" cy="70" r="36" fill="url(#d)" stroke="#b87a00" stroke-width="4"/><path d="M152 66 Q180 64 178 78 Q170 88 150 82 Z" fill="#ff8a2a" stroke="#b85a0a" stroke-width="3" stroke-linejoin="round"/><circle cx="130" cy="60" r="7" fill="#2b1a12"/><circle cx="128" cy="57" r="2.5" fill="#fff"/>
    <path d="M64 120 Q90 106 112 124 Q90 140 64 120 Z" fill="#ffc21a" stroke="#b87a00" stroke-width="3"/>`)));
  for (const cap of [3, 4]) {
    const h = cap * 120 + 80;
    out.push(T(`pp_jar_${cap}`, 200, h, `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#eaf8ff" stop-opacity=".85"/><stop offset=".5" stop-color="#d4f0ff" stop-opacity=".45"/><stop offset="1" stop-color="#a8d8f5" stop-opacity=".8"/></linearGradient>${blur('s', 5)}</defs>
      <ellipse cx="100" cy="${h - 12}" rx="84" ry="10" fill="#1d2440" opacity=".25" filter="url(#s)"/><path d="M22 40 Q22 28 34 28 H166 Q178 28 178 40 V${h - 50} Q178 ${h - 14} 142 ${h - 14} H58 Q22 ${h - 14} 22 ${h - 50} Z" fill="url(#g)" stroke="#6fb4dc" stroke-width="5"/>
      <rect x="12" y="10" width="176" height="28" rx="14" fill="#f4fbff" stroke="#6fb4dc" stroke-width="5"/><rect x="36" y="52" width="12" height="${h - 130}" rx="6" fill="#fff" opacity=".7"/>`));
  }
  const arrow = ['rotate(0 90 90)', 'rotate(90 90 90)', 'rotate(180 90 90)', 'rotate(270 90 90)'];
  arrow.forEach((rot, d) => out.push(T(`pp_puff_${d}`, 180, 180, `<defs>${ballGrad('c', '#f4ffb8', '#c4e660', '#86b82a')}</defs>
    <g fill="url(#c)" stroke="#5f8a16" stroke-width="4"><circle cx="52" cy="104" r="38"/><circle cx="128" cy="104" r="38"/><circle cx="90" cy="68" r="48"/><circle cx="90" cy="122" r="36"/></g>
    <g fill="url(#c)"><circle cx="52" cy="104" r="36"/><circle cx="128" cy="104" r="36"/><circle cx="90" cy="68" r="46"/><circle cx="90" cy="122" r="34"/></g><ellipse cx="72" cy="42" rx="22" ry="9" fill="#fff" opacity=".65" transform="rotate(-14 72 42)"/>
    <g transform="${rot}"><path d="M90 30 L134 84 H108 V146 H72 V84 H46 Z" fill="#fff" stroke="#5f8a16" stroke-width="5" stroke-linejoin="round"/></g>
    <circle cx="78" cy="96" r="6" fill="#3a5a0e"/><circle cx="102" cy="96" r="6" fill="#3a5a0e"/><path d="M80 110 Q90 120 100 110" fill="none" stroke="#3a5a0e" stroke-width="4" stroke-linecap="round"/>`)));
  const card = (extra: string, stroke = '#d9bd86', dash = '') => `<defs>${lightGrad('g', '#ffffff', '#fffaf0', '#f3e4c4', true)}${blur('s', 5)}</defs><rect x="14" y="20" width="182" height="200" rx="32" fill="#1d2440" opacity=".25" filter="url(#s)"/>
    <rect x="10" y="8" width="190" height="204" rx="32" fill="url(#g)" stroke="${stroke}" stroke-width="5" ${dash}/>${extra}`;
  out.push(T('pp_card', 210, 230, card('<rect x="24" y="20" width="162" height="36" rx="18" fill="#fff" opacity=".7"/>')));
  out.push(T('pp_card_q', 210, 230, card(`<path d="M76 84 Q76 54 105 54 Q136 54 136 82 Q136 102 116 110 Q105 116 105 132" fill="none" stroke="#f0569a" stroke-width="18" stroke-linecap="round"/><circle cx="105" cy="166" r="12" fill="#f0569a"/>`, '#f0569a', 'stroke-dasharray="18 12"')));
  out.push(T('pp_ball', 140, 140, `<defs>${ballGrad('g', '#ffffff', '#f4f6ff', '#c8d0ea')}<clipPath id="c"><circle cx="70" cy="70" r="60"/></clipPath></defs><circle cx="70" cy="70" r="60" fill="url(#g)"/>
    <g clip-path="url(#c)"><path d="M70 70 L10 0 H70 Z" fill="#f2553d"/><path d="M70 70 L130 0 H140 V70 Z" fill="#36a9f0"/><path d="M70 70 L140 140 H70 Z" fill="#ffd23a"/><path d="M70 70 L0 140 V70 Z" fill="#35c46a"/></g>
    <circle cx="70" cy="70" r="60" fill="none" stroke="#5a6488" stroke-width="4"/><circle cx="70" cy="70" r="12" fill="#fff" stroke="#5a6488" stroke-width="3"/><ellipse cx="46" cy="38" rx="18" ry="8" fill="#fff" opacity=".7" transform="rotate(-35 46 38)"/>`));
  return out;
}

export function itemTextures(): SvgTex[] {
  const out: SvgTex[] = [];
  for (const [k, v] of Object.entries(FOOD_ART)) out.push(T(`pp_food_${k}`, 160, 160, v, 100, 100));
  for (const [k, [w, h, v]] of Object.entries(WEAR_ART)) out.push(T(`pp_wear_${k}`, w, h, v));
  for (const [k, v] of Object.entries(FRIEND_ART)) out.push(T(`pp_friend_${k}`, 260, 300, v));
  return [...out, ...puzzleTextures()];
}
