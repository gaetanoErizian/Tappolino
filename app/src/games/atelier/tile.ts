import { svgDoc, type SvgTex } from '../../core/textures';
import { lightGrad, ballGrad, blur, starPath } from '../../core/art';

/**
 * Illustrazione della tessera nel menu dei giochi. Volutamente autonoma (niente import dal gioco):
 * il codice dell'Atelier si carica solo quando il bambino apre il gioco.
 * Una principessina con l'abito rosa e la coroncina davanti allo specchio dorato, con un manichino
 * vestito da principe accanto, nell'atelier rosa antico.
 */
export function atelierTile(): SvgTex {
  let diamonds = '';
  for (let y = 14; y < 190; y += 34) for (let x = (y / 34) % 2 ? 17 : 0; x < 380; x += 34) diamonds += `<path d="M${x} ${y - 6} L${x + 5} ${y} L${x} ${y + 6} L${x - 5} ${y} Z"/>`;
  const sparkle = (x: number, y: number, r: number) => `<path d="M${x} ${y - r} Q${x + r * 0.15} ${y - r * 0.15} ${x + r} ${y} Q${x + r * 0.15} ${y + r * 0.15} ${x} ${y + r} Q${x - r * 0.15} ${y + r * 0.15} ${x - r} ${y} Q${x - r * 0.15} ${y - r * 0.15} ${x} ${y - r} Z" fill="#fff"/>`;
  return {
    key: 'tile_atelier', w: 360, h: 280, svg: svgDoc(360, 280, `<defs>
      <linearGradient id="wl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f6d2d6"/><stop offset="1" stop-color="#dca2ab"/></linearGradient>
      <linearGradient id="fl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f3d6ae"/><stop offset="1" stop-color="#d9a978"/></linearGradient>
      ${lightGrad('go', '#fff3c4', '#e8b84a', '#a8741c')}
      <linearGradient id="gl" x1="0" y1="0" x2=".6" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset=".5" stop-color="#f3e2ee"/><stop offset="1" stop-color="#d6b8cf"/></linearGradient>
      ${lightGrad('dr', '#ffe0ee', '#ff9cc6', '#e45f9c')}${lightGrad('dr2', '#fff2f8', '#ffc2dc', '#f08ab6')}
      ${ballGrad('sk', '#fff0e4', '#ffdcc6', '#e9b496')}${lightGrad('hr', '#c8835a', '#8a4b2a', '#5a2c14')}
      ${lightGrad('tu', '#9cc4ff', '#3d72dc', '#24499c')}${lightGrad('mq', '#fffaf2', '#f3e2cc', '#d4b896')}
      ${blur('sh', 5)}
    </defs>
    <rect width="360" height="280" fill="url(#wl)"/>
    <g fill="#fff3d6" opacity=".35">${diamonds}</g>
    <rect y="178" width="360" height="30" fill="#fff6ea"/><rect y="174" width="360" height="6" fill="#e8b84a"/>
    <rect y="208" width="360" height="72" fill="url(#fl)"/>
    <ellipse cx="170" cy="250" rx="150" ry="22" fill="#e8a2b4"/><ellipse cx="170" cy="250" rx="150" ry="22" fill="none" stroke="#e8b84a" stroke-width="4"/>
    <!-- specchio -->
    <ellipse cx="160" cy="118" rx="86" ry="108" fill="url(#go)" stroke="#7a5212" stroke-width="3"/>
    <ellipse cx="160" cy="118" rx="72" ry="94" fill="url(#gl)"/>
    <path d="M110 62 Q126 40 152 32" stroke="#fff" stroke-width="10" stroke-linecap="round" opacity=".7"/>
    <!-- manichino con la tunica da principe -->
    <ellipse cx="298" cy="262" rx="30" ry="6" fill="#1d2440" opacity=".25" filter="url(#sh)"/>
    <path d="M296 190 V258 M300 190 V258" stroke="#a8741c" stroke-width="4"/>
    <path d="M276 260 Q298 248 320 260 Z" fill="#a8741c"/>
    <path d="M276 128 Q298 118 320 128 L322 190 Q298 198 274 190 Z" fill="url(#tu)" stroke="#1b3a80" stroke-width="2.5"/>
    <path d="M288 128 L298 146 L308 128" fill="#fff6e6"/><rect x="274" y="168" width="48" height="8" rx="2" fill="#8a5a34"/>
    <circle cx="298" cy="154" r="3" fill="#ffd84a"/><ellipse cx="298" cy="118" rx="8" ry="5" fill="#e8b84a"/>
    <!-- principessina -->
    <ellipse cx="160" cy="262" rx="70" ry="9" fill="#1d2440" opacity=".3" filter="url(#sh)"/>
    <path d="M120 70 Q112 40 160 34 Q208 40 200 70 L206 168 Q186 176 160 172 Q134 176 114 168 Z" fill="url(#hr)" stroke="#4a2410" stroke-width="2.5"/>
    <path d="M140 146 L180 146 Q216 210 232 256 Q200 266 160 262 Q120 266 88 256 Q104 210 140 146 Z" fill="url(#dr)" stroke="#c4467e" stroke-width="2.5" stroke-linejoin="round"/>
    <path d="M142 146 L178 146 Q200 190 208 222 Q160 236 112 222 Q120 190 142 146 Z" fill="url(#dr2)" stroke="#e070a4" stroke-width="2"/>
    <path d="M136 112 Q160 106 184 112 L186 150 L134 150 Z" fill="url(#dr)" stroke="#c4467e" stroke-width="2.5"/>
    <ellipse cx="132" cy="118" rx="12" ry="10" fill="url(#dr2)" stroke="#e070a4" stroke-width="2"/><ellipse cx="188" cy="118" rx="12" ry="10" fill="url(#dr2)" stroke="#e070a4" stroke-width="2"/>
    <path d="M126 126 L116 172 M194 126 L204 172" stroke="#e9b496" stroke-width="12" stroke-linecap="round"/>
    <path d="M126 126 L116 172 M194 126 L204 172" stroke="url(#sk)" stroke-width="9" stroke-linecap="round"/>
    <circle cx="116" cy="176" r="8" fill="url(#sk)"/><circle cx="204" cy="176" r="8" fill="url(#sk)"/>
    <path d="M204 176 L222 128" stroke="#a8741c" stroke-width="5" stroke-linecap="round"/><path d="${starPath(224, 122, 15)}" fill="#ffe066" stroke="#c98a12" stroke-width="2"/>
    <ellipse cx="160" cy="76" rx="46" ry="44" fill="url(#sk)" stroke="#c98a6a" stroke-width="2"/>
    <path d="M114 82 Q108 34 160 30 Q212 34 206 82 Q200 62 188 54 Q168 66 146 62 Q130 58 122 52 Q114 64 114 82 Z" fill="url(#hr)" stroke="#4a2410" stroke-width="2.5"/>
    <ellipse cx="143" cy="82" rx="7" ry="9" fill="#2b2140"/><ellipse cx="177" cy="82" rx="7" ry="9" fill="#2b2140"/>
    <circle cx="140" cy="78" r="2.6" fill="#fff"/><circle cx="174" cy="78" r="2.6" fill="#fff"/>
    <ellipse cx="132" cy="96" rx="8" ry="5" fill="#ff7f9e" opacity=".45"/><ellipse cx="188" cy="96" rx="8" ry="5" fill="#ff7f9e" opacity=".45"/>
    <path d="M150 100 Q160 110 170 100 Q160 104 150 100 Z" fill="#c9465a" stroke="#8a2a3a" stroke-width="2"/>
    <path d="M132 40 L138 22 L148 34 L160 14 L172 34 L182 22 L188 40 Q160 30 132 40 Z" fill="url(#go)" stroke="#7a5212" stroke-width="2" stroke-linejoin="round"/>
    <circle cx="160" cy="30" r="4" fill="#ff6fae"/>
    ${[[160, 170], [130, 230], [192, 228]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="5" fill="#fff"/>`).join('')}
    ${sparkle(250, 50, 10)}${sparkle(60, 70, 8)}${sparkle(236, 92, 6)}${sparkle(48, 150, 6)}
    <path d="${starPath(330, 50, 10)}" fill="#ffe36a" stroke="#f0a500" stroke-width="2"/>
    <path d="${starPath(30, 40, 8)}" fill="#ffe36a" stroke="#f0a500" stroke-width="2"/>`),
  };
}
