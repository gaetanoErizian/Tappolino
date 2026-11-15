import { svgDoc, type SvgTex } from '../../core/textures';
import { lightGrad, ballGrad, blur, starPath } from '../../core/art';

/**
 * Illustrazione della tessera nel menu dei giochi. Volutamente autonoma (niente import dal gioco):
 * il codice dell'Officina dei Monster Truck si carica solo quando il bambino apre il gioco.
 * Un monster truck arancione salta da un trampolino nell'arena, tra la polvere e le stelle, con il pubblico dietro.
 */
export function monstertruckTile(): SvgTex {
  const crowd = Array.from({ length: 16 }, (_, i) => {
    const x = 12 + i * 23, y = 150 + (i % 2) * 6;
    const c = ['#ff5e5e', '#4fa3ff', '#ffd23f', '#3cc46a', '#ffffff', '#b48cff'][i % 6];
    return `<rect x="${x - 7}" y="${y + 4}" width="14" height="16" rx="5" fill="${c}"/><circle cx="${x}" cy="${y}" r="6.5" fill="${i % 3 ? '#f6d2b0' : '#b97a52'}"/>`
      + (i % 3 === 0 ? `<path d="M${x - 6} ${y + 8} L${x - 11} ${y - 6} M${x + 6} ${y + 8} L${x + 11} ${y - 6}" stroke="#f6d2b0" stroke-width="4" stroke-linecap="round"/>` : '');
  }).join('');
  const lugs = (cx: number, cy: number) => Array.from({ length: 12 }, (_, i) => `<rect x="${cx - 5}" y="${cy - 34}" width="10" height="9" rx="2" fill="#2a2a33" transform="rotate(${i * 30} ${cx} ${cy})"/>`).join('');
  const wheel = (cx: number, cy: number) => `${lugs(cx, cy)}<circle cx="${cx}" cy="${cy}" r="29" fill="url(#ti)"/><circle cx="${cx}" cy="${cy}" r="14" fill="url(#rim)"/><circle cx="${cx}" cy="${cy}" r="5" fill="#f08c00"/>
    <ellipse cx="${cx - 9}" cy="${cy - 10}" rx="6" ry="3.5" fill="#fff" opacity=".5" transform="rotate(-35 ${cx - 9} ${cy - 10})"/>`;
  return {
    key: 'tile_monstertruck', w: 360, h: 280, svg: svgDoc(360, 280, `<defs>
      <linearGradient id="sk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5fb8ff"/><stop offset="1" stop-color="#ffe2a8"/></linearGradient>
      ${lightGrad('gr', '#f6b25e', '#e0913f', '#a8601e', true)}${lightGrad('bd', '#ffc070', '#ff8a1e', '#c45a10', true)}
      ${ballGrad('ti', '#6a6a78', '#34343e', '#16161c')}${ballGrad('rim', '#fff6b0', '#ffd23f', '#c78a00')}
      ${blur('b', 2)}${blur('d', 6)}
    </defs>
    <rect width="360" height="280" fill="url(#sk)"/>
    <circle cx="300" cy="46" r="26" fill="#fff3a0"/><circle cx="300" cy="46" r="38" fill="#fff3a0" opacity=".35"/>
    <path d="M0 140 L40 110 L90 110 L110 140 L200 140 L230 100 L300 100 L330 140 H360 V160 H0 Z" fill="#d79a6a" opacity=".7" filter="url(#b)"/>
    <rect y="138" width="360" height="40" fill="#9aa2b4"/>
    <g filter="url(#b)">${crowd}</g>
    <rect y="176" width="360" height="12" fill="#ff8a1e"/>
    <path d="M0 214 L150 214 Q200 214 226 170 L232 170 L238 216 L360 222 V280 H0 Z" fill="url(#gr)"/>
    <path d="M0 214 L150 214 Q200 214 226 170 L232 170" fill="none" stroke="#ffd08a" stroke-width="6"/>
    <g filter="url(#d)" opacity=".75"><circle cx="196" cy="206" r="16" fill="#f6d2a0"/><circle cx="214" cy="192" r="12" fill="#f6d2a0"/><circle cx="176" cy="210" r="10" fill="#f6d2a0"/></g>
    <path d="${starPath(56, 64, 15)}" fill="#ffe36a" stroke="#f0a500" stroke-width="2"/>
    <path d="${starPath(112, 40, 10)}" fill="#ffe36a" stroke="#f0a500" stroke-width="2"/>
    <path d="${starPath(30, 110, 9)}" fill="#ffe36a"/>
    <!-- truck in volo, un po' impennato -->
    <ellipse cx="262" cy="232" rx="60" ry="8" fill="#5a3010" opacity=".25" filter="url(#d)"/>
    <g transform="translate(262 112) rotate(-12)">
      <rect x="-56" y="20" width="112" height="12" rx="5" fill="#3a4050"/>
      ${wheel(-48, 40)}${wheel(48, 40)}
      <path d="M-74 -4 H-30 L-26 -36 Q-24 -44 -14 -44 H22 Q30 -44 34 -36 L46 -6 H70 Q80 -4 80 8 V18 Q80 26 72 26 H66 A26 26 0 0 0 30 26 H-30 A26 26 0 0 0 -66 26 Q-78 26 -78 16 V4 Q-78 -4 -74 -4 Z" fill="url(#bd)" stroke="#a84a10" stroke-width="3" stroke-linejoin="round"/>
      <path d="M-16 -36 H20 L34 -8 H-16 Z" fill="#cfefff" stroke="#2b3550" stroke-width="2.5"/>
      <circle cx="6" cy="-20" r="9" fill="#ffcfa8"/><path d="M-4 -22 Q-3 -33 6 -33 Q16 -33 16 -22 Z" fill="#ffd23f"/>
      <circle cx="9" cy="-19" r="1.8" fill="#2b2140"/><circle cx="14" cy="-19" r="1.8" fill="#2b2140"/>
      <path d="M-70 0 H-34 M40 -2 H66" stroke="#fff" stroke-width="3" opacity=".6" stroke-linecap="round"/>
      <path d="${starPath(-50, 10, 9)}" fill="#ffd23f" stroke="#fff" stroke-width="2"/>
      <ellipse cx="78" cy="4" rx="3" ry="5" fill="#fff3a0"/>
    </g>`),
  };
}
