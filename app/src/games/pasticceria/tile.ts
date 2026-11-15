import { svgDoc, type SvgTex } from '../../core/textures';
import { lightGrad, ballGrad, blur, starPath } from '../../core/art';

/**
 * Illustrazione della tessera nel menu dei giochi. Volutamente autonoma (niente import dal gioco):
 * il codice di Pasticceria Magica si carica solo quando il bambino apre il gioco.
 */
export function pasticceriaTile(): SvgTex {
  const awning = Array.from({ length: 9 }, (_, i) =>
    `<path d="M${i * 40} 0 H${i * 40 + 40} V34 Q${i * 40 + 20} 50 ${i * 40} 34 Z" fill="${i % 2 ? '#fff4f8' : '#ff7fb0'}"/>`).join('');
  const sprinkles = [[150, 92, '#4fb3f7', 30], [182, 80, '#ffe14d', -40], [206, 98, '#5ed06a', 60], [168, 118, '#a97cf2', -10],
    [214, 124, '#ff6b6b', 25], [138, 128, '#ffb02e', 70], [196, 142, '#4fb3f7', -60]]
    .map(([x, y, c, r]) => `<rect x="${x}" y="${y}" width="14" height="5" rx="2.5" fill="${c}" transform="rotate(${r} ${x as number + 7} ${y as number + 2.5})"/>`).join('');
  return {
    key: 'tile_pasticceria', w: 360, h: 280, svg: svgDoc(360, 280, `<defs>
      <linearGradient id="wl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe3ec"/><stop offset="1" stop-color="#ffc7da"/></linearGradient>
      ${lightGrad('ct', '#fffaf2', '#f6eadb', '#dccab4', true)}
      ${lightGrad('cf', '#a4e6d8', '#6fcbb8', '#3f9c8a', true)}
      ${lightGrad('lin', '#ffd0e4', '#ff8fbf', '#d9548f')}
      ${ballGrad('cake', '#ffe6b0', '#f2b765', '#c47d2c')}
      ${ballGrad('fr', '#ffffff', '#ffd2e6', '#f08fbd')}
      ${ballGrad('ch', '#ff9a9a', '#e8203a', '#8f0b1f')}
      ${blur('sh', 4)}
    </defs>
    <rect width="360" height="280" fill="url(#wl)"/>
    ${Array.from({ length: 10 }, (_, i) => `<rect x="${i * 40 + 14}" y="0" width="12" height="280" fill="#ffffff" opacity=".35"/>`).join('')}
    <!-- forno sullo sfondo, nella foschia -->
    <g opacity=".75"><rect x="246" y="96" width="96" height="112" rx="12" fill="#ffb3c9"/><rect x="258" y="128" width="72" height="56" rx="8" fill="#6b3a4e"/>
      <rect x="262" y="132" width="64" height="48" rx="6" fill="#ff9a3c" opacity=".55"/>
      <circle cx="268" cy="112" r="6" fill="#fff"/><circle cx="288" cy="112" r="6" fill="#fff"/><circle cx="308" cy="112" r="6" fill="#fff"/></g>
    <rect x="0" y="0" width="360" height="280" fill="#fff0f5" opacity=".25"/>
    ${awning}
    <!-- bancone -->
    <rect y="204" width="360" height="16" fill="url(#ct)"/><rect y="220" width="360" height="60" fill="url(#cf)"/>
    <rect y="218" width="360" height="5" fill="#2f7a6c" opacity=".35"/>
    ${[30, 150, 270].map((x) => `<rect x="${x}" y="232" width="80" height="40" rx="8" fill="#5bb9a6" stroke="#9de0d1" stroke-width="2"/>`).join('')}
    <!-- piattino e cupcake -->
    <ellipse cx="180" cy="214" rx="96" ry="12" fill="#1d2440" opacity=".3" filter="url(#sh)"/>
    <ellipse cx="180" cy="206" rx="92" ry="16" fill="#e8eef7"/><ellipse cx="180" cy="202" rx="84" ry="12" fill="#ffffff"/>
    <path d="M118 140 L132 204 H228 L242 140 Z" fill="url(#lin)"/>
    ${[134, 150, 166, 182, 198, 214, 228].map((x, i) => `<path d="M${x - 4 + i} 142 L${x + (i - 3) * 2} 202" stroke="#c9437e" stroke-width="3" opacity=".45"/>`).join('')}
    <path d="M110 144 Q112 112 180 108 Q248 112 250 144 Q180 156 110 144 Z" fill="url(#cake)"/>
    <path d="M116 140 Q100 118 130 108 Q120 86 150 80 Q150 54 180 50 Q212 54 210 80 Q240 86 230 108 Q262 118 244 140 Q180 156 116 140 Z" fill="url(#fr)" stroke="#e57aab" stroke-width="2"/>
    <path d="M132 112 Q180 124 228 112 M150 84 Q180 94 210 84" stroke="#e57aab" stroke-width="3" fill="none" opacity=".6"/>
    <ellipse cx="160" cy="70" rx="18" ry="8" fill="#fff" opacity=".8"/>
    ${sprinkles}
    <path d="M180 40 Q186 20 200 12" stroke="#5a8a2a" stroke-width="4" fill="none" stroke-linecap="round"/>
    <circle cx="180" cy="44" r="17" fill="url(#ch)"/><ellipse cx="174" cy="37" rx="6" ry="4" fill="#fff" opacity=".85"/>
    <!-- scintille magiche -->
    <path d="${starPath(62, 70, 18)}" fill="#ffe36a" stroke="#f0a500" stroke-width="2"/>
    <path d="${starPath(300, 40, 13)}" fill="#ffffff" opacity=".9"/>
    <path d="${starPath(86, 150, 10)}" fill="#ffffff" opacity=".85"/>`),
  };
}
