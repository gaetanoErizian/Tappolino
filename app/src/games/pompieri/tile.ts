import { svgDoc, type SvgTex } from '../../core/textures';
import { lightGrad, ballGrad, blur } from '../../core/art';

/**
 * Illustrazione della tessera nel menu dei giochi. Volutamente autonoma (niente import dal gioco):
 * il codice di Pompieri si carica solo quando il bambino apre il gioco.
 */
export function pompieriTile(): SvgTex {
  return {
    key: 'tile_pompieri', w: 360, h: 280, svg: svgDoc(360, 280, `<defs>
      <linearGradient id="sk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5fbef7"/><stop offset="1" stop-color="#d4f0ff"/></linearGradient>
      ${lightGrad('wl', '#ffb09a', '#f2846c', '#c9573f')}
      ${lightGrad('tr', '#ff8a7a', '#ef4a35', '#b8281c', true)}
      <radialGradient id="fo" cx=".5" cy=".78" r=".75"><stop offset="0" stop-color="#ffe36b"/><stop offset=".45" stop-color="#ff9a24"/><stop offset="1" stop-color="#e5401b"/></radialGradient>
      <radialGradient id="fi" cx=".5" cy=".75" r=".7"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#ffc93a"/></radialGradient>
      ${ballGrad('ty', '#6b7186', '#34384a', '#16182a')}
      ${ballGrad('dr', '#e6f8ff', '#55c4ff', '#1f7ac4')}
      ${blur('sh', 4)}
    </defs>
    <rect width="360" height="280" fill="url(#sk)"/>
    <rect y="236" width="360" height="44" fill="#6f7787"/><rect y="228" width="360" height="10" fill="#efe8dc"/>
    <!-- palazzo con fianco in ombra -->
    <path d="M300 60 L322 46 V220 L300 236 Z" fill="#b3523d"/>
    <rect x="170" y="60" width="130" height="176" fill="url(#wl)"/>
    <path d="M160 52 L182 38 H332 L310 52 Z" fill="#e88a73"/><rect x="160" y="52" width="150" height="14" fill="#c0614b"/>
    ${[[188, 80], [246, 80], [188, 146], [246, 146]].map(([x, y]) => `<rect x="${x}" y="${y}" width="44" height="48" rx="6" fill="#fff3d6"/><rect x="${x + 6}" y="${y + 6}" width="32" height="34" rx="3" fill="#9bd3f2"/>`).join('')}
    <rect x="252" y="152" width="32" height="34" rx="3" fill="#ffb347"/>
    <!-- fiammella -->
    <g transform="translate(240 116) scale(.36)">
      <path d="M75 172 Q16 168 16 112 Q16 74 46 46 Q44 70 58 78 Q56 40 80 6 Q86 46 108 62 Q114 48 110 34 Q136 66 134 112 Q132 168 75 172 Z" fill="url(#fo)" stroke="#d63c18" stroke-width="4"/>
      <path d="M75 162 Q38 158 38 122 Q38 98 58 84 Q60 100 72 104 Q72 84 86 66 Q92 90 104 100 Q114 112 112 126 Q110 160 75 162 Z" fill="url(#fi)"/>
      <circle cx="62" cy="125" r="7" fill="#3a2230"/><circle cx="92" cy="125" r="7" fill="#3a2230"/>
      <path d="M62 144 Q75 154 88 144" stroke="#a83a16" stroke-width="6" fill="none" stroke-linecap="round"/>
    </g>
    <!-- getto d'acqua -->
    ${[[118, 118], [150, 104], [182, 100], [214, 108]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="7" ry="9" fill="url(#dr)"/>`).join('')}
    <!-- camion -->
    <ellipse cx="96" cy="240" rx="92" ry="8" fill="#1d2440" opacity=".35" filter="url(#sh)"/>
    <rect x="10" y="168" width="128" height="58" rx="12" fill="url(#tr)"/>
    <path d="M132 226 V160 Q132 150 142 150 H160 Q172 150 178 162 L186 178 V226 Z" fill="url(#tr)"/>
    <path d="M142 158 H160 Q168 158 172 166 L178 178 H142 Z" fill="#bfe9ff"/>
    <rect x="10" y="196" width="176" height="8" fill="#fff" opacity=".9"/>
    <rect x="40" y="152" width="22" height="16" rx="4" fill="#cdd4e0"/>
    <path d="M52 158 L102 128" stroke="#f5b942" stroke-width="10" stroke-linecap="round"/>
    <path d="M150 150 Q150 138 158 138 Q166 138 166 150 Z" fill="#ff3b3b"/>
    <circle cx="44" cy="228" r="17" fill="url(#ty)"/><circle cx="44" cy="228" r="7" fill="#cdd4e0"/>
    <circle cx="152" cy="228" r="17" fill="url(#ty)"/><circle cx="152" cy="228" r="7" fill="#cdd4e0"/>
    <path d="M18 172 H128" stroke="#fff" stroke-width="3" opacity=".5" stroke-linecap="round"/>`),
  };
}
