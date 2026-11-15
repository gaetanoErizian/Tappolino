import { svgDoc, type SvgTex } from '../../core/textures';
import { lightGrad, ballGrad, blur, starPath } from '../../core/art';

/**
 * Illustrazione della tessera nel menu dei giochi. Volutamente autonoma (niente import dal gioco):
 * il codice del Salone degli Unicorni si carica solo quando il bambino apre il gioco.
 * Un unicorno bianco con la criniera arcobaleno spunta dalla schiuma, tra le nuvole lilla e rosa.
 */
export function unicorniTile(): SvgTex {
  const rainbow = ['#ff8a9c', '#ffb36b', '#ffe073', '#8ee39a', '#74c8ff', '#b892ff'];
  const locks: [number, number, number, number, number][] = [
    [150, 86, 70, 46, 60], [144, 104, 86, 52, 42], [134, 130, 92, 54, 32], [124, 158, 80, 50, 22], [168, 76, 52, 40, 80],
  ];
  const lock = ([x, y, len, w, a]: [number, number, number, number, number], i: number) =>
    `<path transform="translate(${x} ${y}) rotate(${a})" d="M${-w * 0.42} 0 C${-w * 0.78} ${len * 0.32} ${-w * 0.62} ${len * 0.78} ${-w * 0.08} ${len}
      C${w * 0.3} ${len} ${w * 0.52} ${len * 0.86} ${w * 0.34} ${len * 0.72} C${w * 0.2} ${len * 0.62} ${w * 0.02} ${len * 0.74} ${w * 0.06} ${len * 0.84}
      C${w * 0.62} ${len * 0.6} ${w * 0.6} ${len * 0.24} ${w * 0.42} 0 Z" fill="${rainbow[i % rainbow.length]}" stroke="#b08fd0" stroke-width="3"/>`;
  const bubbles = [[40, 250, 30], [92, 262, 26], [140, 246, 34], [196, 258, 30], [250, 248, 36], [306, 260, 30], [350, 250, 24], [70, 226, 18], [228, 222, 16], [290, 228, 14]]
    .map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="url(#fo)" stroke="#bcd2ee" stroke-width="2"/><ellipse cx="${x - r * 0.35}" cy="${y - r * 0.4}" rx="${r * 0.28}" ry="${r * 0.16}" fill="#fff"/>`).join('');
  return {
    key: 'tile_unicorni', w: 360, h: 280, svg: svgDoc(360, 280, `<defs>
      <linearGradient id="sk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c3aefc"/><stop offset=".6" stop-color="#ffc9e4"/><stop offset="1" stop-color="#bff1ec"/></linearGradient>
      <linearGradient id="co" gradientUnits="userSpaceOnUse" x1="120" y1="60" x2="300" y2="260"><stop offset="0" stop-color="#ffffff"/><stop offset=".55" stop-color="#f3eff9"/><stop offset="1" stop-color="#cfc6e4"/></linearGradient>
      ${lightGrad('hn', '#fff4b8', '#ffd04d', '#e09a12')}
      ${ballGrad('bw', '#ffd3ea', '#ff74b4', '#d43f86')}
      ${ballGrad('ey', '#7d58c2', '#4a2f73', '#2b1d40')}
      <radialGradient id="fo" cx=".38" cy=".32" r=".7"><stop offset="0" stop-color="#ffffff"/><stop offset=".7" stop-color="#f3f8ff"/><stop offset="1" stop-color="#c9dcf2"/></radialGradient>
      ${blur('sh', 5)}
    </defs>
    <rect width="360" height="280" fill="url(#sk)"/>
    <!-- arcobaleno e nuvole lontane nella foschia -->
    <g opacity=".45" fill="none" stroke-width="12">${rainbow.map((c, i) => `<path d="M${20 + i * 12} 200 A${170 - i * 12} ${170 - i * 12} 0 0 1 ${360 - i * 12} 200" stroke="${c}"/>`).join('')}</g>
    <g fill="#ffffff" opacity=".85"><circle cx="40" cy="190" r="34"/><circle cx="84" cy="176" r="40"/><circle cx="300" cy="186" r="38"/><circle cx="340" cy="176" r="30"/></g>
    <rect width="360" height="280" fill="#fff4fb" opacity=".18"/>
    <!-- collo e testa -->
    <ellipse cx="200" cy="246" rx="120" ry="20" fill="#3a2a52" opacity=".18" filter="url(#sh)"/>
    <g fill="#a39fbd" stroke="#a39fbd" stroke-width="7" stroke-linejoin="round">
      <path d="M128 250 C134 190 160 140 190 120 L250 158 C240 200 222 230 214 250 Z"/>
      <path d="M176 92 Q166 46 186 30 Q202 52 200 92 Z"/><circle cx="214" cy="132" r="66"/><ellipse cx="266" cy="162" rx="50" ry="38"/>
      <path d="M198 86 Q194 40 216 24 Q230 52 222 88 Z"/></g>
    <g fill="url(#co)">
      <path d="M128 250 C134 190 160 140 190 120 L250 158 C240 200 222 230 214 250 Z"/>
      <path d="M176 92 Q166 46 186 30 Q202 52 200 92 Z"/><circle cx="214" cy="132" r="66"/><ellipse cx="266" cy="162" rx="50" ry="38"/>
      <path d="M198 86 Q194 40 216 24 Q230 52 222 88 Z"/></g>
    <ellipse cx="196" cy="104" rx="24" ry="12" fill="#fff" opacity=".8"/>
    <ellipse cx="258" cy="168" rx="17" ry="10" fill="#ff7fb0" opacity=".45"/>
    <ellipse cx="300" cy="156" rx="4" ry="6" fill="#8a86a3"/>
    <path d="M268 184 Q282 194 298 184" stroke="#8a86a3" stroke-width="4" fill="none" stroke-linecap="round"/>
    <!-- criniera arcobaleno -->
    ${locks.map(lock).join('')}
    <!-- corno -->
    <path d="M222 76 Q228 44 256 6 Q258 46 252 80 Q236 86 222 76 Z" fill="url(#hn)" stroke="#c98610" stroke-width="2.5"/>
    <path d="M226 66 Q244 66 258 50 M224 54 Q242 52 256 34" stroke="#c98610" stroke-width="3" fill="none" opacity=".5"/>
    <!-- occhio -->
    <ellipse cx="238" cy="132" rx="15" ry="20" fill="url(#ey)"/><ellipse cx="232" cy="124" rx="6" ry="7" fill="#fff"/><circle cx="243" cy="142" r="3" fill="#fff"/>
    <path d="M250 120 q8 -6 12 -14 M254 128 q10 -2 16 -8" stroke="#3a2a52" stroke-width="3" fill="none" stroke-linecap="round"/>
    <!-- fiocco -->
    <path d="M170 60 C152 34 128 40 130 60 C132 80 156 80 170 60 Z M170 60 C188 34 212 40 210 60 C208 80 184 80 170 60 Z" fill="url(#bw)" stroke="#b8347a" stroke-width="2.5"/>
    <circle cx="170" cy="60" r="10" fill="#ff8cc6" stroke="#b8347a" stroke-width="2.5"/>
    <!-- schiuma e scintille -->
    ${bubbles}
    <path d="${starPath(56, 64, 16)}" fill="#ffe36a" stroke="#f0a500" stroke-width="2"/>
    <path d="${starPath(318, 52, 12)}" fill="#ffffff" opacity=".95"/>
    <path d="${starPath(318, 110, 8)}" fill="#ffffff" opacity=".85"/>`),
  };
}
