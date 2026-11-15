import { svgDoc, type SvgTex } from '../../core/textures';
import { lightGrad, ballGrad, blur } from '../../core/art';

/**
 * Illustrazione della tessera nel menu dei giochi. Volutamente autonoma (niente import dal gioco):
 * il codice di Treno degli Animali si carica solo quando il bambino apre il gioco.
 * La locomotiva rossa che sbuffa con un vagone blu: dentro un maialino e un pinguino che salutano.
 */
export function trenoTile(): SvgTex {
  const wheel = (x: number, y: number, r: number) => `<circle cx="${x}" cy="${y}" r="${r}" fill="url(#wh)" stroke="#1f1828" stroke-width="3"/>
    <circle cx="${x}" cy="${y}" r="${r * 0.72}" fill="#e2574c" stroke="#a8352d" stroke-width="2"/>
    <path d="M${x - r * 0.7} ${y} H${x + r * 0.7} M${x} ${y - r * 0.7} V${y + r * 0.7}" stroke="#a8352d" stroke-width="3"/>
    <circle cx="${x}" cy="${y}" r="${r * 0.25}" fill="#ffc94a"/>`;
  const eyes = (cx: number, cy: number, dx: number) => `<ellipse cx="${cx - dx}" cy="${cy}" rx="5" ry="6.5" fill="#2b1d26"/><ellipse cx="${cx + dx}" cy="${cy}" rx="5" ry="6.5" fill="#2b1d26"/>
    <circle cx="${cx - dx - 1.5}" cy="${cy - 2.5}" r="2" fill="#fff"/><circle cx="${cx + dx - 1.5}" cy="${cy - 2.5}" r="2" fill="#fff"/>`;
  return {
    key: 'tile_treno', w: 360, h: 280, svg: svgDoc(360, 280, `<defs>
      <linearGradient id="sk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5fb8ff"/><stop offset="1" stop-color="#d6f1ff"/></linearGradient>
      <linearGradient id="hl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9ddc84"/><stop offset="1" stop-color="#6cbf58"/></linearGradient>
      ${lightGrad('lo', '#f59a8f', '#e2574c', '#a8352d', true)}${lightGrad('wg', '#8cc4ff', '#2f86e8', '#1d5aa8', true)}
      ${lightGrad('wd', '#e0a868', '#b9783f', '#7a4a24', true)}${lightGrad('ir', '#6a6078', '#3d3449', '#241c2c', true)}
      ${ballGrad('wh', '#6a6078', '#4a4058', '#1f1828')}${ballGrad('go', '#fff3b0', '#ffc94a', '#c48a10')}
      ${ballGrad('pg', '#ffd6df', '#f9b0c0', '#d0708a')}${ballGrad('pn', '#5a6a8f', '#33405f', '#1b2238')}
      <radialGradient id="pf" cx=".4" cy=".35" r=".7"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#d2deea"/></radialGradient>${blur('sh', 4)}
    </defs>
    <rect width="360" height="280" fill="url(#sk)"/>
    <circle cx="300" cy="44" r="22" fill="#ffe066"/><circle cx="300" cy="44" r="32" fill="#fff3a0" opacity=".35"/>
    <path d="M0 150 Q60 112 130 138 Q200 160 260 124 Q312 100 360 128 V200 H0 Z" fill="url(#hl)"/>
    <rect y="186" width="360" height="94" fill="#c99a66"/>
    <rect y="196" width="360" height="12" fill="#e9e4da"/><rect y="212" width="360" height="5" fill="#ffc61a"/>
    <rect y="228" width="360" height="52" fill="#b98250"/><path d="M0 252 H360" stroke="#8a5530" stroke-width="2" opacity=".4"/>
    <rect y="180" width="360" height="8" fill="#a9b2c2"/>
    <!-- sbuffi -->
    <circle cx="282" cy="40" r="15" fill="url(#pf)" opacity=".85"/><circle cx="262" cy="58" r="18" fill="url(#pf)"/><circle cx="292" cy="70" r="12" fill="url(#pf)" opacity=".9"/>
    <ellipse cx="180" cy="184" rx="170" ry="7" fill="#1d2440" opacity=".3" filter="url(#sh)"/>
    <!-- vagone con i passeggeri -->
    <rect x="22" y="92" width="134" height="56" rx="10" fill="#8a5530" stroke="#5a3418" stroke-width="3"/>
    <circle cx="62" cy="104" r="28" fill="url(#pg)" stroke="#d0708a" stroke-width="3"/>
    <path d="M42 80 L38 60 L58 74 Z M82 80 L86 60 L66 74 Z" fill="#f9b0c0" stroke="#d0708a" stroke-width="3" stroke-linejoin="round"/>
    ${eyes(62, 98, 11)}<ellipse cx="62" cy="114" rx="11" ry="8" fill="#f590a8" stroke="#d0708a" stroke-width="2"/><ellipse cx="58" cy="114" rx="2.5" ry="3.5" fill="#b14a66"/><ellipse cx="66" cy="114" rx="2.5" ry="3.5" fill="#b14a66"/>
    <circle cx="120" cy="104" r="28" fill="url(#pn)" stroke="#1b2238" stroke-width="3"/>
    <path d="M120 96 Q108 84 100 94 Q94 104 102 116 Q110 128 120 128 Q130 128 138 116 Q146 104 140 94 Q132 84 120 96 Z" fill="#fff"/>
    ${eyes(120, 104, 9)}<path d="M113 113 Q120 108 127 113 L120 122 Z" fill="#ff9a2e"/>
    <path d="M150 86 Q160 72 156 62" stroke="#33405f" stroke-width="8" fill="none" stroke-linecap="round"/>
    <rect x="16" y="122" width="146" height="54" rx="12" fill="url(#wg)" stroke="#1d5aa8" stroke-width="3"/>
    <rect x="12" y="116" width="154" height="12" rx="6" fill="url(#wd)" stroke="#7a4a24" stroke-width="2.5"/>
    <circle cx="89" cy="150" r="16" fill="url(#go)" stroke="#b07a10" stroke-width="2"/><circle cx="89" cy="150" r="11" fill="#fff6e4"/>
    <path d="M89 141 L91.5 147 L98 147.5 L93 151.5 L94.5 158 L89 154.5 L83.5 158 L85 151.5 L80 147.5 L86.5 147 Z" fill="#2c62c4"/>
    <rect x="22" y="172" width="134" height="8" rx="4" fill="url(#ir)"/>
    ${wheel(46, 176, 12)}${wheel(132, 176, 12)}
    <!-- locomotiva -->
    <rect x="172" y="164" width="172" height="14" rx="5" fill="url(#ir)"/>
    <rect x="232" y="104" width="100" height="62" rx="20" fill="url(#lo)" stroke="#a8352d" stroke-width="3"/>
    <rect x="256" y="104" width="6" height="62" fill="#ffc94a"/><rect x="294" y="104" width="6" height="62" fill="#ffc94a"/>
    <path d="M300 104 L302 82 Q292 74 294 64 H322 Q324 74 314 82 L316 104 Z" fill="url(#ir)" stroke="#241c2c" stroke-width="2.5"/>
    <rect x="290" y="60" width="36" height="7" rx="3.5" fill="#ffc94a"/>
    <path d="M270 104 Q270 88 282 88 Q294 88 294 104 Z" fill="url(#go)"/>
    <circle cx="334" cy="114" r="8" fill="#fff3a0" stroke="#c48a10" stroke-width="2.5"/>
    <rect x="176" y="80" width="64" height="88" rx="8" fill="url(#lo)" stroke="#a8352d" stroke-width="3"/>
    <rect x="186" y="92" width="44" height="32" rx="6" fill="#bfe6ff" stroke="#fff6e4" stroke-width="4"/>
    <rect x="168" y="70" width="80" height="13" rx="6.5" fill="#9c2f2a" stroke="#6e1f1b" stroke-width="2.5"/>
    <path d="M330 166 L352 180 H326 Z" fill="#ffb52e" stroke="#b06a00" stroke-width="2"/>
    ${wheel(204, 166, 20)}${wheel(258, 166, 20)}${wheel(314, 172, 13)}
    <ellipse cx="200" cy="96" rx="9" ry="5" fill="#fff" opacity=".7" transform="rotate(-25 200 96)"/>`),
  };
}
