import { svgDoc, type SvgTex } from '../../core/textures';
import { lightGrad, ballGrad, blur, starPath } from '../../core/art';

/**
 * Illustrazione della tessera nel menu dei giochi. Volutamente autonoma (niente import dal gioco):
 * il codice di Scavo dei Dinosauri si carica solo quando il bambino apre il gioco.
 * Un dinosauro verde spunta dalla buca dello scavo, al tramonto, con un osso e il pennello.
 */
export function dinosauriTile(): SvgTex {
  return {
    key: 'tile_dinosauri', w: 360, h: 280, svg: svgDoc(360, 280, `<defs>
      <linearGradient id="sk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7a6ac4"/><stop offset=".55" stop-color="#ff9a7a"/><stop offset="1" stop-color="#ffd08a"/></linearGradient>
      <radialGradient id="sg"><stop offset=".25" stop-color="#fff2b8"/><stop offset=".5" stop-color="#ffb36b" stop-opacity=".6"/><stop offset="1" stop-color="#ff7a6b" stop-opacity="0"/></radialGradient>
      <linearGradient id="gr" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#eaa463"/><stop offset="1" stop-color="#c97a42"/></linearGradient>
      ${ballGrad('dn', '#a6e48a', '#67c04f', '#3f8a2c')}
      ${ballGrad('bn', '#fffaf0', '#f2e1bd', '#d2b183')}
      ${lightGrad('hd', '#d08a3c', '#b9773a', '#7a4218')}
      ${blur('sh', 4)}
    </defs>
    <rect width="360" height="280" fill="url(#sk)"/>
    <circle cx="276" cy="120" r="70" fill="url(#sg)"/><circle cx="276" cy="120" r="30" fill="#ffe27a"/>
    <path d="M0 150 L30 150 L38 112 L110 108 L118 150 L200 154 L214 124 L260 122 L270 156 L360 156 V180 H0 Z" fill="#c77a8e" opacity=".85"/>
    <path d="M0 180 V160 Q90 140 180 162 Q270 182 360 160 V180 Z" fill="#e8a88c"/>
    <rect y="170" width="360" height="110" fill="url(#gr)"/>
    <!-- buca -->
    <ellipse cx="170" cy="236" rx="150" ry="36" fill="#6a3418"/>
    <ellipse cx="170" cy="240" rx="138" ry="28" fill="#9c5c30"/>
    <!-- dinosauro che spunta -->
    <ellipse cx="160" cy="234" rx="70" ry="12" fill="#3a1d0e" opacity=".35" filter="url(#sh)"/>
    <path d="M100 236 Q96 160 140 140 Q150 100 196 84 Q238 72 262 96 Q282 120 262 138 Q240 150 206 148 Q196 170 210 236 Z" fill="url(#dn)" stroke="#2f6a20" stroke-width="4" stroke-linejoin="round"/>
    <path d="M118 236 Q120 196 150 182 Q186 176 196 236 Z" fill="#e9f8dc" opacity=".9"/>
    ${[[150, 128], [168, 112], [186, 100]].map(([x, y]) => `<path d="M${x - 8} ${y + 6} Q${x - 6} ${y - 12} ${x + 6} ${y - 14} Q${x + 4} ${y} ${x + 8} ${y + 6} Z" fill="#f7d154" stroke="#b08a1e" stroke-width="2"/>`).join('')}
    <ellipse cx="226" cy="100" rx="15" ry="16" fill="#fff" stroke="#2f6a20" stroke-width="3"/><circle cx="230" cy="102" r="9" fill="#2b1d14"/><circle cx="226" cy="97" r="3.5" fill="#fff"/>
    <ellipse cx="246" cy="124" rx="10" ry="6" fill="#ff7f8f" opacity=".55"/>
    <path d="M216 132 Q240 146 262 128" stroke="#2b1d14" stroke-width="4" fill="none" stroke-linecap="round"/>
    <ellipse cx="196" cy="98" rx="14" ry="7" fill="#fff" opacity=".5" transform="rotate(-25 196 98)"/>
    <!-- osso e pennello -->
    <g transform="translate(36 214)"><path d="M10 14 H58" stroke="#9a7445" stroke-width="20" stroke-linecap="round"/><path d="M10 14 H58" stroke="url(#bn)" stroke-width="13" stroke-linecap="round"/>
      ${[[6, 6], [6, 22], [62, 6], [62, 22]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="10" fill="url(#bn)" stroke="#9a7445" stroke-width="3"/>`).join('')}</g>
    <g transform="translate(262 196)"><path d="M14 30 L78 0" stroke="#7a4218" stroke-width="12" stroke-linecap="round"/><path d="M14 30 L78 0" stroke="url(#hd)" stroke-width="8" stroke-linecap="round"/>
      <path d="M0 30 L18 22 L26 40 Q10 56 -10 54 Q-14 40 0 30 Z" fill="#f2d28a" stroke="#a8803a" stroke-width="3" stroke-linejoin="round"/></g>
    <path d="${starPath(70, 70, 14)}" fill="#ffe36a" stroke="#f0a500" stroke-width="2"/>
    <path d="${starPath(320, 40, 9)}" fill="#ffffff" opacity=".9"/>
    <path d="${starPath(40, 120, 7)}" fill="#ffffff" opacity=".8"/>`),
  };
}
