import { svgDoc, type SvgTex } from '../../core/textures';
import { lightGrad, ballGrad, blur, roundButton, shade } from '../../core/art';
import { swirlBody, BODY_W, BODY_H, PUPOU } from './swirl';
import { itemTextures } from './artItems';
import { roomTextures } from './artRooms';

/**
 * Grafica di Pupou — tutta disegnata in codice (SVG), originale, stile 2.5D Tappolino:
 * luce dall'alto a sinistra, sfumature, riflessi, bordi nella tonalità scura dello stesso colore.
 * Qui: il personaggio a pezzi (corpo, occhi, bocche, braccia), gli effetti (puzzette, mosca, bolle) e l'interfaccia.
 * Cibo, vestiti, amici e pezzi dei rompicapo sono in artItems.ts; stanze e mobili in artRooms.ts.
 */
export const T = (key: string, w: number, h: number, body: string, vbW = w, vbH = h): SvgTex => ({ key, w, h, svg: svgDoc(w, h, body, vbW, vbH) });
const L = PUPOU.line;

// ------------------------------------------------------------------ occhi (240×110, centro 120,55)
const EX = [62, 178];
const eyeOpen = (x: number, lid = 0): string => `<ellipse cx="${x}" cy="55" rx="27" ry="31" fill="#fff" stroke="${L}" stroke-width="4"/>
  <circle cx="${x + 3}" cy="59" r="16.5" fill="#2b1a12"/><circle cx="${x - 3}" cy="52" r="6.5" fill="#fff"/><circle cx="${x + 9}" cy="65" r="3" fill="#fff"/>
  ${lid ? `<path d="M${x - 30} ${55 - 34} H${x + 30} V${55 - 31 + lid} Q${x} ${55 - 31 + lid + 10} ${x - 30} ${55 - 31 + lid} Z" fill="${PUPOU.base}" stroke="${L}" stroke-width="4" stroke-linejoin="round"/>` : ''}`;
const EYES: Record<string, string> = {
  open: EX.map((x) => eyeOpen(x)).join(''),
  sleepy: EX.map((x) => eyeOpen(x, 26)).join(''),
  blink: EX.map((x) => `<path d="M${x - 25} 54 Q${x} 72 ${x + 25} 54" fill="none" stroke="${L}" stroke-width="7" stroke-linecap="round"/>`).join(''),
  happy: EX.map((x) => `<path d="M${x - 25} 66 Q${x} 30 ${x + 25} 66" fill="none" stroke="${L}" stroke-width="8" stroke-linecap="round"/>`).join(''),
  strain: `<path d="M38 36 L84 55 L38 74" fill="none" stroke="${L}" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M202 36 L156 55 L202 74" fill="none" stroke="${L}" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>`,
  sad: EX.map((x, i) => `${eyeOpen(x)}<path d="M${x - 32} ${i ? 14 : 40} L${x + 32} ${i ? 40 : 14} L${x + 32} 6 L${x - 32} 6 Z" fill="${PUPOU.base}"/>
    <path d="M${x - 30} ${i ? 16 : 40} L${x + 30} ${i ? 40 : 16}" stroke="${L}" stroke-width="5" stroke-linecap="round"/>`).join('')
    + `<path d="M206 84 Q198 98 206 104 Q214 98 206 84 Z" fill="#7fd0ff" stroke="#3b9ad6" stroke-width="2"/>`,
};

// ------------------------------------------------------------------ bocche (150×100, centro 75,45)
const MOUTHS: Record<string, string> = {
  smile: `<path d="M40 34 Q75 74 110 34" fill="none" stroke="${L}" stroke-width="7" stroke-linecap="round"/>`,
  open: `<path d="M34 28 Q75 96 116 28 Q75 46 34 28 Z" fill="#7a2a2a" stroke="${L}" stroke-width="5" stroke-linejoin="round"/>
    <path d="M56 62 Q75 48 94 62 Q75 80 56 62 Z" fill="#ff8fa0"/>`,
  grin: `<path d="M26 26 Q75 104 124 26 Q75 40 26 26 Z" fill="#7a2a2a" stroke="${L}" stroke-width="5" stroke-linejoin="round"/>
    <path d="M40 33 Q75 44 110 33 L106 42 Q75 52 44 42 Z" fill="#fff"/><path d="M54 68 Q75 54 96 68 Q75 86 54 68 Z" fill="#ff8fa0"/>`,
  sad: `<path d="M44 62 Q75 30 106 62" fill="none" stroke="${L}" stroke-width="7" stroke-linecap="round"/>`,
  o: `<ellipse cx="75" cy="48" rx="17" ry="21" fill="#7a2a2a" stroke="${L}" stroke-width="5"/><ellipse cx="75" cy="56" rx="9" ry="8" fill="#ff8fa0"/>`,
  chew: `<path d="M42 46 Q58 30 75 46 Q92 62 108 46" fill="none" stroke="${L}" stroke-width="7" stroke-linecap="round"/>
    <circle cx="36" cy="52" r="12" fill="${PUPOU.light}" opacity=".7"/><circle cx="114" cy="52" r="12" fill="${PUPOU.light}" opacity=".7"/>`,
  zip: `<path d="M48 48 H102" fill="none" stroke="${L}" stroke-width="7" stroke-linecap="round"/>`,
};

function pupouTextures(): SvgTex[] {
  const out: SvgTex[] = [];
  for (const tiers of [2, 3, 4]) out.push(T(`pp_body_${tiers}`, BODY_W, BODY_H, swirlBody(tiers)));
  for (const [k, v] of Object.entries(EYES)) out.push(T(`pp_eyes_${k}`, 240, 110, v));
  for (const [k, v] of Object.entries(MOUTHS)) out.push(T(`pp_mouth_${k}`, 150, 100, v));
  out.push(T('pp_arm', 96, 64, `<defs>${ballGrad('a', PUPOU.light, PUPOU.base, PUPOU.dark)}</defs>
    <ellipse cx="48" cy="32" rx="42" ry="24" fill="url(#a)" stroke="${L}" stroke-width="4"/><ellipse cx="34" cy="22" rx="16" ry="6" fill="#fff" opacity=".4"/>`));
  // macchie di sporco (sopra il corpo, sempre più visibili quando è sporco)
  out.push(T('pp_dirt', 380, 300, `<defs>${blur('d', 2)}</defs><g fill="#4a5a2a" opacity=".8" filter="url(#d)">
    <path d="M50 190 q20 -22 44 -6 q18 14 -4 30 q-30 16 -40 -24 Z"/><path d="M270 210 q26 -14 40 8 q8 22 -22 24 q-28 -2 -18 -32 Z"/>
    <path d="M120 60 q18 -12 30 4 q6 16 -14 18 q-22 -2 -16 -22 Z"/><path d="M240 96 q14 -8 22 4 q4 12 -12 12 q-14 -2 -10 -16 Z"/><circle cx="182" cy="262" r="12"/><circle cx="92" cy="128" r="8"/></g>`));
  // ciuccio del cucciolo
  out.push(T('pp_pacifier', 110, 90, `<defs>${ballGrad('p', '#ffe07a', '#ffb81f', '#d98a00')}${ballGrad('q', '#9fe3ff', '#4fb8f0', '#2a83c4')}</defs>
    <circle cx="55" cy="68" r="17" fill="none" stroke="#2a83c4" stroke-width="7"/><ellipse cx="55" cy="36" rx="46" ry="26" fill="url(#q)" stroke="#1f6aa3" stroke-width="3"/>
    <circle cx="55" cy="36" r="15" fill="url(#p)" stroke="#b87400" stroke-width="3"/><ellipse cx="34" cy="26" rx="12" ry="5" fill="#fff" opacity=".6"/>`));
  out.push(T('pp_tipstar', 80, 80, `<defs>${lightGrad('s', '#fff6b0', '#ffcf2e', '#f08c00')}</defs>
    <path d="M40 6 L49 28 L73 30 L55 46 L61 70 L40 57 L19 70 L25 46 L7 30 L31 28 Z" fill="url(#s)" stroke="#d98a00" stroke-width="3" stroke-linejoin="round"/><ellipse cx="32" cy="30" rx="7" ry="4" fill="#fff" opacity=".8"/>`));
  return out;
}

// ------------------------------------------------------------------ effetti
function fxTextures(): SvgTex[] {
  const cloud = (c1: string, c2: string, c3: string) => `<defs>${ballGrad('c', c1, c2, c3)}</defs>
    <g fill="url(#c)" stroke="${shade(c3, -0.15)}" stroke-width="3"><circle cx="60" cy="96" r="42"/><circle cx="150" cy="100" r="38"/><circle cx="104" cy="64" r="52"/></g>
    <g fill="url(#c)"><circle cx="60" cy="96" r="40"/><circle cx="150" cy="100" r="36"/><circle cx="104" cy="64" r="50"/><rect x="60" y="92" width="92" height="44" rx="20"/></g>
    <ellipse cx="86" cy="38" rx="24" ry="10" fill="#fff" opacity=".65" transform="rotate(-14 86 38)"/>
    <path d="M88 84 q10 -16 24 -6 q10 10 -2 18 q-10 4 -12 -6" fill="none" stroke="${shade(c3, -0.2)}" stroke-width="5" stroke-linecap="round" opacity=".7"/>`;
  return [
    T('pp_cloud', 210, 150, cloud('#f0ffb0', '#c4e660', '#8fc02e')),
    T('pp_cloud_y', 210, 150, cloud('#fff8c0', '#ffe066', '#e0a81e')),
    T('pp_cloud_p', 210, 150, cloud('#ffe0f4', '#f7a8dc', '#c96ab0')),
    T('pp_stink', 60, 130, `<path d="M30 124 q-22 -20 0 -40 q22 -20 0 -40 q-18 -18 0 -36" fill="none" stroke="#9cc83a" stroke-width="9" stroke-linecap="round" opacity=".85"/>`),
    T('pp_fly', 90, 80, `<defs>${ballGrad('f', '#7b83a8', '#4a4f6a', '#2a2d44')}</defs>
      <ellipse cx="28" cy="24" rx="24" ry="13" fill="#e4f6ff" stroke="#8fb9d6" stroke-width="3" opacity=".9" transform="rotate(-24 28 24)"/>
      <ellipse cx="62" cy="24" rx="24" ry="13" fill="#e4f6ff" stroke="#8fb9d6" stroke-width="3" opacity=".9" transform="rotate(24 62 24)"/>
      <ellipse cx="45" cy="50" rx="23" ry="20" fill="url(#f)" stroke="#23263a" stroke-width="3"/>
      <circle cx="36" cy="44" r="9" fill="#fff"/><circle cx="55" cy="44" r="9" fill="#fff"/><circle cx="38" cy="46" r="4" fill="#111"/><circle cx="57" cy="46" r="4" fill="#111"/>
      <path d="M38 60 Q45 66 53 60" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"/>`),
    T('pp_zzz', 70, 70, `<path d="M14 14 H56 L16 56 H58" fill="none" stroke="#1f3f8f" stroke-width="16" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M14 14 H56 L16 56 H58" fill="none" stroke="#dff0ff" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/>`),
    T('pp_soapbubble', 70, 70, `<defs><radialGradient id="b" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#fff" stop-opacity=".95"/><stop offset=".6" stop-color="#d8f3ff" stop-opacity=".75"/><stop offset="1" stop-color="#8fd3ff" stop-opacity=".9"/></radialGradient></defs>
      <circle cx="35" cy="35" r="31" fill="url(#b)" stroke="#7cc4f0" stroke-width="2.5"/><ellipse cx="24" cy="22" rx="10" ry="5.5" fill="#fff" transform="rotate(-35 24 22)"/>`),
    T('pp_drop', 40, 56, `<defs>${ballGrad('w', '#dff6ff', '#6cc7f5', '#2a8fd0')}</defs><path d="M20 4 Q38 30 34 40 Q30 53 20 53 Q10 53 6 40 Q2 30 20 4 Z" fill="url(#w)" stroke="#2a83c4" stroke-width="2"/><ellipse cx="14" cy="36" rx="4" ry="7" fill="#fff" opacity=".8"/>`),
    T('pp_sponge', 150, 120, `<defs>${lightGrad('s', '#fff6a8', '#ffd84a', '#e0a81e')}</defs>
      <rect x="10" y="22" width="130" height="84" rx="26" fill="#c98a12" opacity=".5"/><rect x="8" y="14" width="130" height="84" rx="26" fill="url(#s)" stroke="#c98a12" stroke-width="4"/>
      <g fill="#e6b52e" opacity=".8"><circle cx="40" cy="42" r="8"/><circle cx="78" cy="66" r="10"/><circle cx="108" cy="40" r="7"/><circle cx="54" cy="76" r="6"/><circle cx="112" cy="74" r="5"/></g>
      <ellipse cx="50" cy="26" rx="28" ry="6" fill="#fff" opacity=".6"/>`),
    T('pp_bubble', 190, 170, `<defs>${blur('s', 4)}</defs><g opacity=".3" filter="url(#s)"><ellipse cx="96" cy="74" rx="84" ry="62" fill="#1d2440"/></g>
      <ellipse cx="94" cy="68" rx="84" ry="62" fill="#fff" stroke="#b8c6e0" stroke-width="4"/><circle cx="46" cy="136" r="14" fill="#fff" stroke="#b8c6e0" stroke-width="4"/><circle cx="26" cy="158" r="8" fill="#fff" stroke="#b8c6e0" stroke-width="3"/>`),
  ];
}

// ------------------------------------------------------------------ interfaccia
const W = `fill="#fff"`;
const ICON: Record<string, string> = {
  kitchen: `<path d="M30 20 V44 Q30 52 38 52 V82" fill="none" stroke="#fff" stroke-width="8" stroke-linecap="round"/><path d="M22 20 V40 M38 20 V40" stroke="#fff" stroke-width="6" stroke-linecap="round"/>
    <path d="M66 20 Q82 22 80 48 Q78 58 68 58 V82" fill="none" stroke="#fff" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/><path d="M66 22 Q78 26 76 46 Q74 54 66 54 Z" ${W}/>`,
  bath: `<path d="M14 50 H86 Q86 78 64 78 H36 Q14 78 14 50 Z" ${W}/><path d="M26 50 V30 Q26 18 38 18 Q48 18 48 28" fill="none" stroke="#fff" stroke-width="7" stroke-linecap="round"/>
    <circle cx="60" cy="30" r="6" ${W}/><circle cx="74" cy="22" r="4.5" ${W}/><circle cx="74" cy="38" r="4" ${W}/><path d="M30 80 L26 88 M70 80 L74 88" stroke="#fff" stroke-width="7" stroke-linecap="round"/>`,
  bedroom: `<path d="M62 14 Q40 22 42 46 Q46 70 72 70 Q52 82 32 66 Q14 46 30 26 Q44 10 62 14 Z" ${W}/><path d="M66 26 L69 34 L77 37 L69 40 L66 48 L63 40 L55 37 L63 34 Z" ${W}/><circle cx="80" cy="56" r="4" ${W}/>`,
  school: `<path d="M50 28 Q32 16 12 22 V74 Q32 68 50 80 Q68 68 88 74 V22 Q68 16 50 28 Z" ${W}/><path d="M50 28 V80" stroke="#36a9f0" stroke-width="5" opacity=".55"/>
    <path d="M22 38 Q32 34 40 40 M22 52 Q32 48 40 54 M60 40 Q68 34 78 38 M60 54 Q68 48 78 52" fill="none" stroke="#36a9f0" stroke-width="4" stroke-linecap="round" opacity=".55"/>`,
  park: `<circle cx="50" cy="36" r="26" ${W}/><circle cx="32" cy="48" r="17" ${W}/><circle cx="68" cy="48" r="17" ${W}/><rect x="44" y="52" width="12" height="34" rx="4" ${W}/>`,
  shop: `<path d="M12 22 H24 L34 62 H74 L84 34 H30" fill="none" stroke="#fff" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/><path d="M30 36 H82 L74 60 H36 Z" ${W}/>
    <circle cx="40" cy="78" r="8" ${W}/><circle cx="70" cy="78" r="8" ${W}/>`,
  hint: `<path d="M50 14 Q26 14 26 40 Q26 54 38 62 V70 H62 V62 Q74 54 74 40 Q74 14 50 14 Z" ${W}/><rect x="39" y="74" width="22" height="7" rx="3.5" ${W}/><rect x="43" y="84" width="14" height="6" rx="3" ${W}/>`,
  redo: `<path d="M74 50 A24 24 0 1 1 62 29" fill="none" stroke="#fff" stroke-width="10" stroke-linecap="round"/><path d="M54 14 L78 26 L58 44 Z" ${W}/>`,
  close: `<path d="M28 28 L72 72 M72 28 L28 72" stroke="#fff" stroke-width="13" stroke-linecap="round"/>`,
  ok: `<path d="M24 52 L42 70 L76 30" fill="none" stroke="#fff" stroke-width="13" stroke-linecap="round" stroke-linejoin="round"/>`,
};

const NEED_ICON: Record<string, string> = {
  // 100×100: icone piene, leggibili da piccole
  food: `<defs>${ballGrad('g', '#ffb09a', '#f2553d', '#b82a1a')}</defs><path d="M50 30 Q30 18 20 38 Q12 60 30 80 Q40 90 50 82 Q60 90 70 80 Q88 60 80 38 Q70 18 50 30 Z" fill="url(#g)" stroke="#8f1f12" stroke-width="3"/>
    <path d="M50 30 Q50 18 58 12" fill="none" stroke="#6a3a1a" stroke-width="5" stroke-linecap="round"/><path d="M58 16 Q72 8 78 20 Q66 26 58 16 Z" fill="#6cc24a" stroke="#3f8f2a" stroke-width="2"/><ellipse cx="34" cy="46" rx="6" ry="10" fill="#fff" opacity=".6" transform="rotate(20 34 46)"/>`,
  water: `<defs>${ballGrad('g', '#dff6ff', '#58bff5', '#1f7fc4')}</defs><path d="M50 8 Q84 52 78 68 Q72 92 50 92 Q28 92 22 68 Q16 52 50 8 Z" fill="url(#g)" stroke="#1a6aa8" stroke-width="3"/><ellipse cx="38" cy="62" rx="7" ry="13" fill="#fff" opacity=".7" transform="rotate(14 38 62)"/>`,
  clean: `<defs><radialGradient id="g" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#fff"/><stop offset=".6" stop-color="#d4f1ff"/><stop offset="1" stop-color="#7cc8f5"/></radialGradient></defs>
    <circle cx="38" cy="58" r="28" fill="url(#g)" stroke="#4aa3da" stroke-width="3"/><circle cx="70" cy="34" r="19" fill="url(#g)" stroke="#4aa3da" stroke-width="3"/><circle cx="74" cy="72" r="12" fill="url(#g)" stroke="#4aa3da" stroke-width="3"/>
    <ellipse cx="28" cy="46" rx="8" ry="4.5" fill="#fff" transform="rotate(-30 28 46)"/><ellipse cx="64" cy="26" rx="6" ry="3.5" fill="#fff" transform="rotate(-30 64 26)"/>`,
  energy: `<defs>${lightGrad('g', '#fff6b0', '#ffd23a', '#f09a00')}</defs><path d="M58 6 L22 56 H46 L38 94 L80 40 H54 Z" fill="url(#g)" stroke="#c97a00" stroke-width="4" stroke-linejoin="round"/><path d="M52 20 L34 48" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".7"/>`,
  fun: `<defs>${ballGrad('g', '#fff3a0', '#ffd23a', '#f0a000')}</defs><circle cx="50" cy="50" r="40" fill="url(#g)" stroke="#c97a00" stroke-width="3"/>
    <path d="M30 42 Q37 32 44 42 M56 42 Q63 32 70 42" fill="none" stroke="#5a3212" stroke-width="5" stroke-linecap="round"/><path d="M28 56 Q50 84 72 56 Q50 64 28 56 Z" fill="#7a2a2a" stroke="#5a3212" stroke-width="3" stroke-linejoin="round"/>
    <ellipse cx="34" cy="26" rx="12" ry="5" fill="#fff" opacity=".6" transform="rotate(-25 34 26)"/>`,
};

function uiTextures(): SvgTex[] {
  const out: SvgTex[] = [];
  const tabColor: Record<string, string> = { kitchen: '#ff9a3c', bath: '#36b9e8', bedroom: '#7a6ff0', school: '#3dbf7a', park: '#8cc63f', shop: '#f0569a' };
  for (const [k, c] of Object.entries(tabColor)) out.push(roundButton(`pp_tab_${k}`, c, ICON[k], 190));
  out.push(roundButton('pp_btn_hint', '#ffb81f', ICON.hint, 170), roundButton('pp_btn_redo', '#36a9f0', ICON.redo, 150),
    roundButton('pp_btn_close', '#f2553d', ICON.close, 130), roundButton('pp_btn_ok', '#35c46a', ICON.ok, 220));
  for (const [k, v] of Object.entries(NEED_ICON)) out.push(T(`pp_need_${k}`, 110, 110, v, 100, 100));
  // moneta "tappo d'oro"
  out.push(T('pp_coin', 90, 90, `<defs>${ballGrad('g', '#fff6b0', '#ffcf2e', '#e08a00')}</defs><circle cx="45" cy="48" r="38" fill="#b86e00"/><circle cx="45" cy="44" r="38" fill="url(#g)" stroke="#c47a00" stroke-width="3"/>
    <circle cx="45" cy="44" r="27" fill="none" stroke="#e09a10" stroke-width="4" opacity=".8"/><path d="M45 26 L50 38 L63 39 L53 48 L56 61 L45 54 L34 61 L37 48 L27 39 L40 38 Z" fill="#fff6b0" stroke="#d98a00" stroke-width="2" stroke-linejoin="round"/>
    <ellipse cx="30" cy="24" rx="12" ry="5" fill="#fff" opacity=".7" transform="rotate(-30 30 24)"/>`));
  // base delle pastiglie dei bisogni e del livello
  out.push(T('pp_pill', 150, 150, `<defs>${ballGrad('g', '#ffffff', '#f3f6ff', '#cfd8f0')}${blur('s', 4)}</defs><circle cx="75" cy="80" r="62" fill="#1d2440" opacity=".28" filter="url(#s)"/>
    <circle cx="75" cy="75" r="64" fill="url(#g)" stroke="#aab6d6" stroke-width="3"/>`));
  out.push(T('pp_slot', 200, 200, `<defs>${lightGrad('g', '#ffffff', '#fff6e2', '#f0deb8', true)}${blur('s', 5)}</defs><rect x="14" y="20" width="172" height="172" rx="34" fill="#1d2440" opacity=".25" filter="url(#s)"/>
    <rect x="12" y="10" width="176" height="176" rx="34" fill="url(#g)" stroke="#d9bd86" stroke-width="4"/><rect x="24" y="20" width="152" height="40" rx="20" fill="#fff" opacity=".55"/>`));
  out.push(T('pp_slot_on', 200, 200, `<defs>${lightGrad('g', '#f2ffe0', '#c9f296', '#8fd44a', true)}${blur('s', 5)}</defs><rect x="14" y="20" width="172" height="172" rx="34" fill="#1d2440" opacity=".25" filter="url(#s)"/>
    <rect x="12" y="10" width="176" height="176" rx="34" fill="url(#g)" stroke="#5fae2a" stroke-width="6"/><rect x="24" y="20" width="152" height="40" rx="20" fill="#fff" opacity=".55"/>`));
  out.push(T('pp_tag', 150, 62, `<defs>${lightGrad('g', '#ffffff', '#fff3c9', '#ffd98a', true)}</defs><rect x="3" y="3" width="144" height="56" rx="28" fill="url(#g)" stroke="#d9a54a" stroke-width="4"/>`));
  out.push(T('pp_badge', 70, 70, `<defs>${ballGrad('g', '#ff9a8a', '#f2553d', '#b82a1a')}</defs><circle cx="35" cy="35" r="31" fill="url(#g)" stroke="#fff" stroke-width="5"/>`));
  return out;
}

export function gameTextures(): SvgTex[] {
  return [...pupouTextures(), ...fxTextures(), ...uiTextures(), ...itemTextures(), ...roomTextures()];
}
