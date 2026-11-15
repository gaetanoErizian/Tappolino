import { svgDoc, type SvgTex } from '../../core/textures';
import { lightGrad, ballGrad, blur, starPath } from '../../core/art';

/**
 * Illustrazione della tessera nel menu dei giochi. Volutamente autonoma (niente import dal gioco):
 * il codice del Giardino delle Fate si carica solo quando il bambino apre il gioco.
 * Una radura al mattino: un fiore magico che sorride, la nuvoletta che lo innaffia, una fatina e una farfalla.
 */
export function giardinoTile(): SvgTex {
  let petals = '';
  for (let i = 0; i < 12; i++) {
    petals += `<ellipse cx="180" cy="106" rx="13" ry="30" fill="url(#pt)" stroke="#e0a6c4" stroke-width="2" transform="rotate(${i * 30} 180 146)"/>`;
  }
  let drops = '';
  for (const [x, y] of [[66, 112], [86, 132], [104, 108], [78, 150], [114, 140]]) {
    drops += `<path d="M${x} ${y} q6 10 5 13 q-1 6 -5 6 q-4 0 -5 -6 q-1 -3 5 -13 Z" fill="#8fd6ff" stroke="#3a98d8" stroke-width="1.2"/>`;
  }
  return {
    key: 'tile_giardino', w: 360, h: 280, svg: svgDoc(360, 280, `<defs>
      <linearGradient id="sk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9fd8ff"/><stop offset=".7" stop-color="#e6f6ff"/><stop offset="1" stop-color="#fff0d6"/></linearGradient>
      ${lightGrad('hf', '#d8f0d6', '#bfe3c4', '#a6d4b0', true)}${lightGrad('gr', '#b8ec8e', '#7ccf5a', '#4f9e3a', true)}
      ${lightGrad('pt', '#ffffff', '#ffe0ef', '#f2b6d4')}${ballGrad('hc', '#fff3a0', '#ffd23a', '#e09a00')}
      ${lightGrad('st', '#c6f0a0', '#78c45a', '#3f8a34', true)}${lightGrad('lf', '#d6f7b0', '#86d466', '#3f9a3a')}
      ${ballGrad('sk2', '#fff0e2', '#f6c8a4', '#d99a76')}${lightGrad('dr', '#ffe0ec', '#ff8fb8', '#d9578c')}${lightGrad('hr', '#ffe9a0', '#ffc94a', '#d99a1a')}
      ${ballGrad('so', '#d9a070', '#a8704a', '#74462a')}${ballGrad('bf', '#ffffff', '#b58cf0', '#7d55c8')}
      <radialGradient id="gl"><stop offset="0" stop-color="#fff6c0" stop-opacity=".95"/><stop offset="1" stop-color="#fff6c0" stop-opacity="0"/></radialGradient>
      <linearGradient id="cl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#d2e4f6"/></linearGradient>
      ${blur('sh', 5)}</defs>
    <rect width="360" height="280" fill="url(#sk)"/>
    <circle cx="300" cy="50" r="40" fill="#fff3a0" opacity=".55"/><circle cx="300" cy="50" r="24" fill="#ffe066"/>
    <path d="M0 176 Q80 132 170 160 Q260 186 360 140 V280 H0 Z" fill="url(#hf)"/>
    <path d="M0 206 Q100 176 190 196 Q280 214 360 190 V280 H0 Z" fill="url(#gr)"/>
    ${[[30, 236], [320, 250], [250, 226], [110, 256]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="7" fill="#fff"/><circle cx="${x}" cy="${y}" r="3" fill="#ffd23a"/>`).join('')}
    <!-- terra e fiore magico -->
    <ellipse cx="182" cy="262" rx="70" ry="10" fill="#1d4020" opacity=".3" filter="url(#sh)"/>
    <path d="M118 256 Q126 226 180 224 Q234 226 242 256 Q214 266 180 266 Q146 266 118 256 Z" fill="url(#so)" stroke="#5e3416" stroke-width="2.5"/>
    <circle cx="180" cy="146" r="86" fill="url(#gl)"/>
    <path d="M176 234 Q172 200 177 168 L183 168 Q180 200 184 234 Z" fill="url(#st)" stroke="#3f8a34" stroke-width="2"/>
    <path d="M180 214 Q140 186 120 200 Q140 228 180 220 Z" fill="url(#lf)" stroke="#3f8a34" stroke-width="2.5"/>
    <path d="M180 200 Q220 172 240 186 Q222 214 180 206 Z" fill="url(#lf)" stroke="#3f8a34" stroke-width="2.5"/>
    ${petals}
    <circle cx="180" cy="146" r="28" fill="url(#hc)" stroke="#c88400" stroke-width="2.5"/>
    <path d="M168 144 Q172 138 176 144 M184 144 Q188 138 192 144" stroke="#6a3a2a" stroke-width="2.6" fill="none" stroke-linecap="round"/>
    <path d="M174 152 Q180 158 186 152" stroke="#6a3a2a" stroke-width="2.6" fill="none" stroke-linecap="round"/>
    <ellipse cx="164" cy="152" rx="5" ry="3" fill="#ff7fa8" opacity=".5"/><ellipse cx="196" cy="152" rx="5" ry="3" fill="#ff7fa8" opacity=".5"/>
    <!-- nuvoletta che innaffia -->
    <g fill="url(#cl)" stroke="#b4c8e4" stroke-width="2"><circle cx="70" cy="74" r="28"/><circle cx="102" cy="62" r="34"/><circle cx="132" cy="78" r="24"/><rect x="50" y="74" width="100" height="30" rx="15"/></g>
    <rect x="54" y="76" width="92" height="26" rx="13" fill="url(#cl)"/>
    <path d="M86 78 Q90 73 94 78 M108 78 Q112 73 116 78" stroke="#4a5a8a" stroke-width="2.6" fill="none" stroke-linecap="round"/>
    <ellipse cx="101" cy="88" rx="5" ry="6" fill="#4a5a8a"/>
    ${drops}
    <!-- fatina -->
    <ellipse cx="288" cy="146" rx="30" ry="18" fill="#fff" opacity=".7" stroke="#fff" stroke-width="2" transform="rotate(-30 288 146)"/>
    <ellipse cx="326" cy="146" rx="30" ry="18" fill="#fff" opacity=".7" stroke="#fff" stroke-width="2" transform="rotate(30 326 146)"/>
    <path d="M296 160 Q307 154 318 160 L330 196 Q307 204 284 196 Z" fill="url(#dr)" stroke="#c4467a" stroke-width="2" stroke-linejoin="round"/>
    <path d="M318 166 Q332 162 338 150" stroke="#f6c8a4" stroke-width="5" fill="none" stroke-linecap="round"/>
    <path d="M338 150 L344 128" stroke="#c98a55" stroke-width="3" stroke-linecap="round"/>
    <path d="${starPath(345, 124, 9)}" fill="#ffe36a" stroke="#e0a000" stroke-width="1.5"/>
    <circle cx="307" cy="136" r="21" fill="url(#sk2)" stroke="#c98763" stroke-width="2"/>
    <path d="M286 138 Q284 112 307 112 Q330 112 328 138 Q320 124 307 126 Q294 124 286 138 Z" fill="url(#hr)" stroke="#c88a1a" stroke-width="2"/>
    <circle cx="300" cy="139" r="3" fill="#3a2a4a"/><circle cx="314" cy="139" r="3" fill="#3a2a4a"/>
    <path d="M303 147 Q307 151 311 147" stroke="#a03a4a" stroke-width="2" fill="none" stroke-linecap="round"/>
    <!-- farfalla e scintille -->
    <g transform="translate(232 70)"><path d="M0 0 Q-16 -22 -26 -12 Q-30 2 0 4 Z M0 0 Q16 -22 26 -12 Q30 2 0 4 Z M0 4 Q-16 8 -16 18 Q-6 22 0 8 Z M0 4 Q16 8 16 18 Q6 22 0 8 Z" fill="url(#bf)" stroke="#6a42b0" stroke-width="1.5"/>
      <ellipse cx="0" cy="6" rx="2.5" ry="9" fill="#4a2a5a"/></g>
    <path d="${starPath(250, 120, 7)}" fill="#fff6c0"/><path d="${starPath(134, 190, 6)}" fill="#fff6c0"/><path d="${starPath(36, 168, 6)}" fill="#fff6c0"/>`),
  };
}
