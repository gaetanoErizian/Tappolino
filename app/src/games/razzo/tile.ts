import { svgDoc, type SvgTex } from '../../core/textures';
import { lightGrad, ballGrad, blur, starPath } from '../../core/art';

/**
 * Illustrazione della tessera nel menu dei giochi. Volutamente autonoma (niente import dal gioco):
 * il codice di Razzo tra le Stelle si carica solo quando il bambino apre il gioco.
 * Un razzo rosso e bianco sale tra le stelle verso un pianeta con gli anelli che sorride.
 */
export function razzoTile(): SvgTex {
  const stars = [[30, 40, 2], [92, 22, 1.5], [150, 60, 2.2], [210, 18, 1.4], [330, 30, 2], [312, 120, 1.6], [40, 150, 1.8], [120, 120, 1.3], [250, 90, 1.5], [24, 240, 1.6], [200, 250, 1.4]]
    .map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#fff" opacity=".85"/>`).join('');
  return {
    key: 'tile_razzo', w: 360, h: 280, svg: svgDoc(360, 280, `<defs>
      <linearGradient id="sk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0a1040"/><stop offset=".6" stop-color="#1f2a8a"/><stop offset="1" stop-color="#3c4fc4"/></linearGradient>
      ${blur('nb', 18)}${blur('sh', 3)}
      ${ballGrad('pl', '#ffe3b8', '#f4a96a', '#c46a3a')}
      <linearGradient id="rg" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ffcf8a"/><stop offset=".5" stop-color="#fff0c8"/><stop offset="1" stop-color="#e09a5a"/></linearGradient>
      ${lightGrad('bd', '#ffffff', '#f4f1ec', '#c9c2b8', true)}
      ${lightGrad('tr', '#ff9a9d', '#ff5a5f', '#c4363b', true)}
      ${ballGrad('gl', '#ffffff', '#9fdcff', '#3a7ac4')}
      <linearGradient id="fl" x1="1" y1="0" x2="0" y2="0"><stop offset="0" stop-color="#fff6b0"/><stop offset=".45" stop-color="#ffb02e"/><stop offset="1" stop-color="#ff3d6a" stop-opacity="0"/></linearGradient>
      <clipPath id="cp"><circle cx="276" cy="196" r="62"/></clipPath>
    </defs>
    <rect width="360" height="280" fill="url(#sk)"/>
    <g filter="url(#nb)" opacity=".7"><ellipse cx="90" cy="90" rx="90" ry="44" fill="#ff6fb5"/><ellipse cx="140" cy="70" rx="60" ry="34" fill="#9a6cff"/><ellipse cx="300" cy="60" rx="60" ry="30" fill="#39d0c8" opacity=".7"/></g>
    ${stars}
    <path d="${starPath(56, 210, 14)}" fill="#ffe36a" stroke="#f0a500" stroke-width="2"/>
    <path d="${starPath(318, 32, 11)}" fill="#ffe36a" stroke="#f0a500" stroke-width="2"/>
    <path d="${starPath(176, 34, 8)}" fill="#ffe36a"/>
    <!-- pianeta con gli anelli -->
    <path d="M196 214 A86 20 0 0 1 356 206" fill="none" stroke="url(#rg)" stroke-width="10"/>
    <circle cx="276" cy="196" r="62" fill="url(#pl)"/>
    <g clip-path="url(#cp)"><rect x="200" y="150" width="160" height="10" fill="#ffd6a0" opacity=".7"/><rect x="200" y="226" width="160" height="12" fill="#e0884a" opacity=".5"/></g>
    <circle cx="262" cy="190" r="7" fill="#fff"/><circle cx="290" cy="190" r="7" fill="#fff"/><circle cx="263" cy="192" r="4" fill="#2b2140"/><circle cx="291" cy="192" r="4" fill="#2b2140"/>
    <path d="M266 206 Q276 216 286 206" stroke="#2b2140" stroke-width="3.5" fill="none" stroke-linecap="round"/>
    <path d="M196 214 A86 20 0 0 0 356 206" fill="none" stroke="url(#rg)" stroke-width="10"/>
    <path d="M236 160 Q244 146 262 140" stroke="#fff" stroke-width="6" fill="none" stroke-linecap="round" opacity=".6"/>
    <!-- razzo che sale in diagonale -->
    <g transform="translate(150 150) rotate(-35)">
      <path d="M-74 0 Q-120 -26 -180 0 Q-120 26 -74 0 Z" fill="url(#fl)"/>
      <path d="M-30 -24 Q-50 -34 -64 -52 Q-72 -58 -74 -48 L-68 -22 Z M-30 24 Q-50 34 -64 52 Q-72 58 -74 48 L-68 22 Z" fill="url(#tr)" stroke="#a82a30" stroke-width="2.5" stroke-linejoin="round"/>
      <rect x="-82" y="-12" width="16" height="24" rx="5" fill="#7a86a3" stroke="#2b3146" stroke-width="2"/>
      <path d="M-66 -26 H34 Q72 -26 92 0 Q72 26 34 26 H-66 Q-76 26 -76 0 Q-76 -26 -66 -26 Z" fill="url(#bd)" stroke="#8a7e70" stroke-width="3"/>
      <path d="M48 -25 Q78 -20 92 0 Q78 20 48 25 Q58 0 48 -25 Z" fill="url(#tr)"/>
      <rect x="-28" y="-26" width="14" height="52" fill="#ff5a5f"/>
      <circle cx="18" cy="0" r="14" fill="#e8ecf6"/><circle cx="18" cy="0" r="10" fill="url(#gl)"/><ellipse cx="14" cy="-4" rx="4" ry="2.5" fill="#fff"/>
      <path d="M-60 -18 H30" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".7"/>
    </g>
    <circle cx="70" cy="252" r="10" fill="#fff" opacity=".25" filter="url(#sh)"/>`),
  };
}
