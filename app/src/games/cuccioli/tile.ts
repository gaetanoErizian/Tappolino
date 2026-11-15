import { svgDoc, type SvgTex } from '../../core/textures';
import { lightGrad, ballGrad, blur, starPath } from '../../core/art';

/**
 * Illustrazione della tessera nel menu dei giochi. Volutamente autonoma (niente import dal gioco):
 * il codice di Cuccioli dal Dottore si carica solo quando il bambino apre il gioco.
 * Un cagnolino felice sul lettino verde acqua, con il cerotto sulla zampa, davanti alla finestra sul giardino.
 */
export function cuccioliTile(): SvgTex {
  const ear = 'M116 92 C86 98 80 160 100 178 C116 190 130 158 126 104 Z';
  return {
    key: 'tile_cuccioli', w: 360, h: 280, svg: svgDoc(360, 280, `<defs>
      <linearGradient id="wl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fffcf4"/><stop offset="1" stop-color="#f3e3c4"/></linearGradient>
      <linearGradient id="vw" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#bfe8ff"/><stop offset=".6" stop-color="#8fd3ff"/><stop offset=".61" stop-color="#9fdc8c"/><stop offset="1" stop-color="#6fc45f"/></linearGradient>
      ${lightGrad('tb', '#b8f5e4', '#6fd8bc', '#3fb497', true)}${lightGrad('tf', '#4cc3a5', '#33a88b', '#23826b', true)}
      ${ballGrad('fu', '#fbe2c0', '#e0a868', '#b77e44')}${ballGrad('ea', '#c98a55', '#a8673a', '#7a4422')}
      <radialGradient id="be" cx=".42" cy=".3" r=".8"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#fff1dc"/></radialGradient>
      ${lightGrad('pl', '#a7f0dc', '#4cc3a5', '#2a8f78', true)}${blur('sh', 5)}
    </defs>
    <rect width="360" height="280" fill="url(#wl)"/>
    <g fill="#4cc3a5" opacity=".12">${[...Array(24)].map((_, i) => `<circle cx="${20 + (i % 8) * 46 + (Math.floor(i / 8) % 2) * 23}" cy="${20 + Math.floor(i / 8) * 40}" r="5"/>`).join('')}</g>
    <rect x="96" y="20" width="168" height="120" rx="6" fill="#ffffff" stroke="#a9cfc5" stroke-width="4"/>
    <rect x="106" y="30" width="148" height="100" fill="url(#vw)"/>
    <circle cx="234" cy="50" r="12" fill="#fff3a0"/><circle cx="130" cy="96" r="16" fill="#5cbf5a"/><circle cx="148" cy="92" r="12" fill="#6fc45f"/>
    <rect x="178" y="30" width="5" height="100" fill="#ffffff"/>
    <rect y="150" width="360" height="40" fill="#5fcfb2"/><rect y="146" width="360" height="6" fill="#ffffff"/>
    <rect y="190" width="360" height="90" fill="#d9efe8"/>
    <!-- lettino -->
    <ellipse cx="180" cy="270" rx="150" ry="10" fill="#1d2440" opacity=".25" filter="url(#sh)"/>
    <rect x="64" y="226" width="232" height="50" rx="8" fill="#fff6e4" stroke="#c9b893" stroke-width="3"/>
    <path d="M40 216 Q40 204 54 204 H306 Q320 204 320 216 V232 Q320 240 308 240 H52 Q40 240 40 232 Z" fill="url(#tf)" stroke="#1f7a64" stroke-width="3"/>
    <path d="M40 210 Q40 196 56 196 H304 Q320 196 320 210 V220 Q320 230 304 230 H56 Q40 230 40 220 Z" fill="url(#tb)" stroke="#1f7a64" stroke-width="3"/>
    <!-- cagnolino -->
    <ellipse cx="180" cy="214" rx="74" ry="10" fill="#1d2440" opacity=".25" filter="url(#sh)"/>
    <path d="M178 128 C226 128 248 170 246 196 C244 214 226 216 178 216 C130 216 112 214 110 196 C108 170 130 128 178 128 Z" fill="url(#fu)" stroke="#8a5a2c" stroke-width="3"/>
    <ellipse cx="178" cy="182" rx="40" ry="34" fill="url(#be)"/>
    <ellipse cx="152" cy="208" rx="22" ry="12" fill="url(#fu)" stroke="#8a5a2c" stroke-width="3"/><ellipse cx="204" cy="208" rx="22" ry="12" fill="url(#fu)" stroke="#8a5a2c" stroke-width="3"/>
    <rect x="190" y="198" width="30" height="14" rx="7" fill="url(#pl)" stroke="#2a8f78" stroke-width="2"/><rect x="200" y="200" width="10" height="10" rx="2" fill="#fff6e4"/>
    <path d="M244 178 Q274 176 280 146" stroke="#8a5a2c" stroke-width="14" fill="none" stroke-linecap="round"/><path d="M244 178 Q274 176 280 146" stroke="#e0a868" stroke-width="8" fill="none" stroke-linecap="round"/>
    <ellipse cx="178" cy="104" rx="62" ry="54" fill="url(#fu)" stroke="#8a5a2c" stroke-width="3"/>
    <ellipse cx="204" cy="98" rx="18" ry="17" fill="#a8673a" opacity=".8"/>
    <path d="${ear}" fill="url(#ea)" stroke="#6a3a1a" stroke-width="3"/><g transform="translate(356 0) scale(-1 1)"><path d="${ear}" fill="url(#ea)" stroke="#6a3a1a" stroke-width="3"/></g>
    <ellipse cx="178" cy="122" rx="30" ry="21" fill="url(#be)"/>
    <path d="M168 110 Q178 106 188 110 Q186 120 178 122 Q170 120 168 110 Z" fill="#4a2f2a"/>
    <path d="M166 128 Q172 136 178 129 Q184 136 190 128" stroke="#2b1d26" stroke-width="3" fill="none" stroke-linecap="round"/>
    <ellipse cx="155" cy="96" rx="9" ry="11" fill="#2b1d26"/><ellipse cx="201" cy="96" rx="9" ry="11" fill="#2b1d26"/>
    <circle cx="152" cy="92" r="3.5" fill="#fff"/><circle cx="198" cy="92" r="3.5" fill="#fff"/>
    <ellipse cx="140" cy="118" rx="10" ry="6" fill="#ff8fa8" opacity=".5"/><ellipse cx="216" cy="118" rx="10" ry="6" fill="#ff8fa8" opacity=".5"/>
    <ellipse cx="156" cy="72" rx="16" ry="8" fill="#fff" opacity=".5" transform="rotate(-25 156 72)"/>
    <!-- cuori e stelline -->
    <path d="M300 98 Q282 86 283 74 Q284 66 292 66 Q298 66 300 72 Q302 66 308 66 Q316 66 317 74 Q318 86 300 98 Z" fill="#ff5e9a" stroke="#c4245f" stroke-width="2"/>
    <path d="M62 120 Q50 112 51 104 Q52 98 57 98 Q61 98 62 102 Q63 98 67 98 Q72 98 73 104 Q74 112 62 120 Z" fill="#ff8fb0"/>
    <path d="${starPath(318, 140, 10)}" fill="#ffe36a" stroke="#f0a500" stroke-width="2"/>
    <path d="${starPath(44, 64, 8)}" fill="#ffe36a" stroke="#f0a500" stroke-width="2"/>`),
  };
}
