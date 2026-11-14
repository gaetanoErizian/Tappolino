import { svgDoc, type SvgTex } from './core/textures';
import { roundButton, lightGrad, ballGrad, blur, groundShadow, shade, starSvg } from './core/art';
import { TRUCKS } from './levels';

/**
 * Grafica vettoriale originale di "Pompieri in Azione" — stile 2.5D:
 * luce dall'alto a sinistra, sfumature, riflessi, ombre proprie e portate.
 */

const METAL = (id: string) => lightGrad(id, '#ffffff', '#cdd4e0', '#8790a3', true);

export function truckSvg(body: string, dark: string): string {
  const light = shade(body, 0.38);
  const deep = shade(dark, -0.25);
  const edge = shade(dark, -0.35);
  return svgDoc(560, 330, `<defs>
    ${lightGrad('tb', light, body, dark, true)}
    ${lightGrad('tc', light, body, dark)}
    ${lightGrad('tp', shade(dark, -0.1), dark, deep, true)}
    ${METAL('mt')}
    <linearGradient id="gl" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f2fbff"/><stop offset=".5" stop-color="#a9dcf7"/><stop offset="1" stop-color="#5aa8db"/></linearGradient>
    <linearGradient id="sp" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#d5dbe6"/></linearGradient>
    ${ballGrad('ty', '#6b7186', '#34384a', '#16182a')}
    ${ballGrad('rm', '#ffffff', '#c8cfdc', '#7c8599')}
    ${ballGrad('bc', '#ffb3b3', '#ff3b3b', '#a80f0f')}
    ${ballGrad('hl', '#ffffff', '#fff1a6', '#e3b52a')}
    ${ballGrad('sk', '#ffe7d3', '#ffcda6', '#e09a70')}
    ${lightGrad('hm', '#fff3a8', '#ffcc2a', '#e08f00')}
  </defs>
  ${groundShadow(285, 314, 262, 13, 0.4)}
  <rect x="72" y="86" width="70" height="30" rx="9" fill="url(#mt)" stroke="#6f788c" stroke-width="2.5"/>
  <rect x="20" y="108" width="384" height="156" rx="26" fill="url(#tb)" stroke="${edge}" stroke-width="3"/>
  <path d="M44 114 H380" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".45"/>
  ${[40, 160, 280].map((x) => {
    const w = x === 280 ? 100 : 104;
    return `<rect x="${x}" y="128" width="${w}" height="58" rx="12" fill="url(#tp)"/>
    <path d="M${x + 6} 183 H${x + w - 6} M${x + w - 2} 134 V180" stroke="${light}" stroke-width="3" opacity=".7" stroke-linecap="round"/>
    <path d="M${x + 3} 176 V138 Q${x + 3} 131 ${x + 10} 131 H${x + 60}" stroke="${deep}" stroke-width="4" opacity=".6" fill="none" stroke-linecap="round"/>
    <rect x="${x + 40}" y="151" width="24" height="9" rx="4.5" fill="url(#mt)"/>`;
  }).join('')}
  <path d="M380 262 V92 Q380 70 402 70 H468 Q496 70 512 98 L536 146 Q542 158 542 172 V240 Q542 262 520 262 Z" fill="url(#tc)" stroke="${edge}" stroke-width="3" stroke-linejoin="round"/>
  <path d="M396 78 H466" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".45"/>
  <path d="M402 90 H466 Q482 90 492 106 L514 150 H402 Z" fill="url(#gl)"/>
  <ellipse cx="446" cy="152" rx="24" ry="8" fill="#2a3a5a" opacity=".25"/>
  <circle cx="444" cy="134" r="19" fill="url(#sk)" stroke="#c98763" stroke-width="2"/>
  <path d="M422 124 Q424 98 446 98 Q468 98 470 124 Z" fill="url(#hm)" stroke="#c98200" stroke-width="2" stroke-linejoin="round"/>
  <rect x="416" y="120" width="60" height="9" rx="4" fill="url(#hm)" stroke="#c98200" stroke-width="2"/>
  <ellipse cx="438" cy="106" rx="8" ry="4" fill="#fff" opacity=".7"/>
  <circle cx="438" cy="136" r="3" fill="#2b2140"/><circle cx="452" cy="136" r="3" fill="#2b2140"/>
  <path d="M437 144 Q445 150 453 144" stroke="#8a3b2a" stroke-width="3" fill="none" stroke-linecap="round"/>
  <circle cx="432" cy="142" r="4" fill="#ff8a80" opacity=".45"/><circle cx="458" cy="142" r="4" fill="#ff8a80" opacity=".45"/>
  <path d="M402 90 H466 Q482 90 492 106 L514 150 H402 Z" fill="none" stroke="${edge}" stroke-width="3" stroke-linejoin="round"/>
  <path d="M410 98 L428 98 L414 120 Z M440 98 L452 98 L430 132 L424 132 Z" fill="#fff" opacity=".35"/>
  <rect x="24" y="196" width="374" height="18" fill="url(#sp)"/>
  <rect x="384" y="196" width="156" height="18" fill="url(#sp)"/>
  <path d="M30 199 H534" stroke="#fff" stroke-width="3" opacity=".9"/>
  <rect x="24" y="222" width="516" height="38" rx="10" fill="url(#tp)"/>
  <path d="M66 262 Q66 206 122 206 Q178 206 178 262 Z" fill="${shade(dark, -0.55)}"/>
  <path d="M396 262 Q396 206 452 206 Q508 206 508 262 Z" fill="${shade(dark, -0.55)}"/>
  <circle cx="530" cy="182" r="15" fill="#fff6c2" opacity=".55"/>
  <circle cx="530" cy="182" r="10" fill="url(#hl)" stroke="#c9a12a" stroke-width="2"/>
  <rect x="516" y="236" width="36" height="24" rx="9" fill="url(#mt)" stroke="#6f788c" stroke-width="2.5"/>
  <rect x="424" y="54" width="44" height="20" rx="6" fill="url(#mt)" stroke="#6f788c" stroke-width="2"/>
  <path d="M430 56 Q430 34 446 34 Q462 34 462 56 Z" fill="url(#bc)" stroke="#9c1414" stroke-width="2" stroke-linejoin="round"/>
  <ellipse cx="440" cy="42" rx="5" ry="3.5" fill="#fff" opacity=".85"/>
  ${[122, 452].map((cx) => `
    <circle cx="${cx}" cy="264" r="46" fill="url(#ty)"/>
    <circle cx="${cx}" cy="264" r="43" fill="none" stroke="#565c72" stroke-width="2" stroke-dasharray="6 7" opacity=".7"/>
    <circle cx="${cx}" cy="264" r="28" fill="url(#rm)" stroke="#6f788c" stroke-width="2"/>
    ${[0, 72, 144, 216, 288].map((a) => `<circle cx="${(cx + Math.cos((a * Math.PI) / 180) * 17).toFixed(1)}" cy="${(264 + Math.sin((a * Math.PI) / 180) * 17).toFixed(1)}" r="3.2" fill="#8790a3"/>`).join('')}
    <circle cx="${cx}" cy="264" r="9" fill="url(#mt)" stroke="#6f788c" stroke-width="2"/>
    <ellipse cx="${cx - 12}" cy="250" rx="8" ry="5" fill="#fff" opacity=".7"/>`).join('')}
  `);
}

export const TRUCK_PIVOT = { nozzle: { x: 107, y: 92 }, ladder: { x: 170, y: 100 }, beacon: { x: 446, y: 44 } };

export function flameSvg(): string {
  return svgDoc(150, 180, `<defs>
    <radialGradient id="fo" cx=".5" cy=".78" r=".75"><stop offset="0" stop-color="#ffe36b"/><stop offset=".45" stop-color="#ff9a24"/><stop offset="1" stop-color="#e5401b"/></radialGradient>
    <radialGradient id="fi" cx=".5" cy=".75" r=".7"><stop offset="0" stop-color="#ffffff"/><stop offset=".35" stop-color="#fff6b8"/><stop offset="1" stop-color="#ffc93a"/></radialGradient>
    ${ballGrad('ey', '#ffffff', '#ffffff', '#e8e2f0')}
  </defs>
  <path d="M75 172 Q16 168 16 112 Q16 74 46 46 Q44 70 58 78 Q56 40 80 6 Q86 46 108 62 Q114 48 110 34 Q136 66 134 112 Q132 168 75 172 Z"
    fill="url(#fo)" stroke="#d63c18" stroke-width="2.5" stroke-linejoin="round"/>
  <path d="M75 162 Q38 158 38 122 Q38 98 58 84 Q60 100 72 104 Q72 84 86 66 Q92 90 104 100 Q114 112 112 126 Q110 160 75 162 Z" fill="url(#fi)"/>
  <path d="M34 92 Q40 70 52 58" stroke="#fff3b0" stroke-width="5" fill="none" stroke-linecap="round" opacity=".7"/>
  <ellipse cx="60" cy="122" rx="10" ry="12" fill="url(#ey)" stroke="#b5481c" stroke-width="2"/>
  <ellipse cx="90" cy="122" rx="10" ry="12" fill="url(#ey)" stroke="#b5481c" stroke-width="2"/>
  <circle cx="62" cy="125" r="5.5" fill="#3a2230"/><circle cx="92" cy="125" r="5.5" fill="#3a2230"/>
  <circle cx="64" cy="122" r="2.2" fill="#fff"/><circle cx="94" cy="122" r="2.2" fill="#fff"/>
  <path d="M64 142 Q75 152 86 142" stroke="#a83a16" stroke-width="4" fill="none" stroke-linecap="round"/>
  <circle cx="48" cy="140" r="6" fill="#ff5e7a" opacity=".45"/><circle cx="102" cy="140" r="6" fill="#ff5e7a" opacity=".45"/>`);
}

const WIN_DEFS = `
  ${lightGrad('fr', '#fffaf0', '#f3e6c9', '#d9c49c')}
  <linearGradient id="gs" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e9f8ff"/><stop offset=".55" stop-color="#9bd3f2"/><stop offset="1" stop-color="#5d9fd0"/></linearGradient>
  <linearGradient id="ct" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ffb3d1"/><stop offset=".3" stop-color="#ff8fbd"/><stop offset=".5" stop-color="#ffc4dc"/><stop offset=".75" stop-color="#ff8fbd"/><stop offset="1" stop-color="#e86aa0"/></linearGradient>
  ${lightGrad('sl', '#fffaf0', '#ead9b5', '#c8b088', true)}
  ${blur('sb', 3)}`;

const CURTAINS = `
  <path d="M20 20 H60 Q46 52 20 72 Z" fill="url(#ct)" stroke="#d65e94" stroke-width="1.5"/>
  <path d="M140 20 H100 Q114 52 140 72 Z" fill="url(#ct)" stroke="#d65e94" stroke-width="1.5"/>
  <path d="M20 20 H140 V27 H20 Z" fill="#e86aa0" opacity=".5"/>`;

const SILL = `
  <rect x="2" y="146" width="156" height="10" rx="5" fill="#3a2a52" opacity=".3" filter="url(#sb)"/>
  <rect x="0" y="134" width="160" height="20" rx="7" fill="url(#sl)" stroke="#bfa57a" stroke-width="2"/>
  <path d="M6 137 H154" stroke="#fff" stroke-width="3" opacity=".8" stroke-linecap="round"/>`;

function windowSvg(): string {
  return svgDoc(160, 170, `<defs>${WIN_DEFS}</defs>
  <rect x="10" y="12" width="148" height="138" rx="16" fill="#3a2a52" opacity=".22" filter="url(#sb)"/>
  <rect x="6" y="6" width="148" height="138" rx="16" fill="url(#fr)" stroke="#c4ad83" stroke-width="2"/>
  <rect x="20" y="20" width="120" height="110" rx="8" fill="url(#gs)"/>
  <path d="M20 28 Q20 20 28 20 H140 V30 H30 V130 H20 Z" fill="#2f5d86" opacity=".28"/>
  <path d="M36 128 L80 22 H100 L56 128 Z M74 128 L112 36 H122 L84 128 Z" fill="#fff" opacity=".28"/>
  <rect x="76" y="20" width="8" height="110" fill="url(#fr)"/><rect x="20" y="71" width="120" height="8" fill="url(#fr)"/>
  ${CURTAINS}${SILL}`);
}

function windowGlowSvg(): string {
  return svgDoc(160, 170, `<defs><radialGradient id="w" cx=".5" cy=".75" r=".75"><stop offset="0" stop-color="#fff2b0"/><stop offset=".5" stop-color="#ffb347"/><stop offset="1" stop-color="#e8662a"/></radialGradient></defs>
    <rect x="20" y="20" width="120" height="110" rx="8" fill="url(#w)"/>`);
}

/** Cornice + tende + davanzale senza vetro: va sopra al bagliore, così il fuoco sembra "dentro" casa. */
function windowFrameSvg(): string {
  return svgDoc(160, 170, `<defs>${WIN_DEFS}</defs>
  <path fill-rule="evenodd" d="M22 6 H138 Q154 6 154 22 V128 Q154 144 138 144 H22 Q6 144 6 128 V22 Q6 6 22 6 Z M28 20 H132 Q140 20 140 28 V122 Q140 130 132 130 H28 Q20 130 20 122 V28 Q20 20 28 20 Z"
    fill="url(#fr)" stroke="#c4ad83" stroke-width="2"/>
  ${CURTAINS}${SILL}`);
}

function catSvg(happy: boolean): string {
  const eyes = happy
    ? `<path d="M48 52 Q57 42 66 52 M74 52 Q83 42 92 52" stroke="#3a2230" stroke-width="5" fill="none" stroke-linecap="round"/>`
    : `<ellipse cx="57" cy="50" rx="9" ry="11" fill="url(#ce)"/><ellipse cx="83" cy="50" rx="9" ry="11" fill="url(#ce)"/>
       <circle cx="60" cy="45" r="3.8" fill="#fff"/><circle cx="86" cy="45" r="3.8" fill="#fff"/>
       <circle cx="55" cy="55" r="1.6" fill="#fff" opacity=".8"/><circle cx="81" cy="55" r="1.6" fill="#fff" opacity=".8"/>`;
  const E = '#c8691c';
  return svgDoc(140, 150, `<defs>
    ${ballGrad('cf', '#ffd29a', '#ffa64a', '#d9741f')}
    ${ballGrad('ch', '#ffd8a6', '#ffab52', '#e07c24')}
    ${ballGrad('cb', '#fffaf0', '#ffe6c8', '#f2c79a')}
    ${ballGrad('ce', '#6a4a7a', '#3a2230', '#160c14')}
    ${blur('cs', 3)}
  </defs>
  <ellipse cx="72" cy="139" rx="46" ry="7" fill="#1d2440" opacity=".3" filter="url(#cs)"/>
  <path d="M100 118 Q138 112 130 78 Q126 64 116 70" stroke="#d9741f" stroke-width="16" fill="none" stroke-linecap="round"/>
  <path d="M100 116 Q134 110 127 79 Q124 68 117 72" stroke="#ffb361" stroke-width="7" fill="none" stroke-linecap="round"/>
  <ellipse cx="70" cy="100" rx="40" ry="32" fill="url(#cf)" stroke="${E}" stroke-width="2.5"/>
  <ellipse cx="68" cy="106" rx="20" ry="18" fill="url(#cb)"/>
  <ellipse cx="56" cy="128" rx="13" ry="8" fill="url(#cf)" stroke="${E}" stroke-width="2"/>
  <ellipse cx="84" cy="128" rx="13" ry="8" fill="url(#cf)" stroke="${E}" stroke-width="2"/>
  <path d="M40 34 L44 4 L66 22 Z" fill="url(#ch)" stroke="${E}" stroke-width="2.5" stroke-linejoin="round"/>
  <path d="M100 34 L96 4 L74 22 Z" fill="url(#ch)" stroke="${E}" stroke-width="2.5" stroke-linejoin="round"/>
  <path d="M46 26 L47 14 L56 22 Z M94 26 L93 14 L84 22 Z" fill="#ff9ec2"/>
  <circle cx="70" cy="50" r="35" fill="url(#ch)" stroke="${E}" stroke-width="2.5"/>
  <ellipse cx="70" cy="64" rx="17" ry="11" fill="url(#cb)"/>
  <path d="M62 18 L64 28 M70 16 V27 M78 18 L76 28" stroke="#d26a18" stroke-width="4.5" stroke-linecap="round"/>
  <ellipse cx="52" cy="28" rx="9" ry="5" transform="rotate(-30 52 28)" fill="#fff" opacity=".45"/>
  ${eyes}
  <path d="M66 60 H74 L70 65 Z" fill="#ff6f91" stroke="#c94a6c" stroke-width="1.5" stroke-linejoin="round"/>
  <path d="M61 67 Q66 73 70 66 Q74 73 79 67" stroke="#7a3a2a" stroke-width="3" fill="none" stroke-linecap="round"/>
  <path d="M30 58 L48 60 M30 68 L48 65 M110 58 L92 60 M110 68 L92 65" stroke="#8a5a3a" stroke-width="2" stroke-linecap="round" opacity=".7"/>
  <circle cx="46" cy="63" r="6" fill="#ff8fa3" opacity=".5"/><circle cx="94" cy="63" r="6" fill="#ff8fa3" opacity=".5"/>`, 140, 150);
}

function medalSvg(c: string, d: string, l: string, w = 220, h = 300): string {
  return svgDoc(w, h, `<defs>
    ${ballGrad('md', l, c, d)}
    <linearGradient id="mr" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${l}"/><stop offset="1" stop-color="${d}"/></linearGradient>
    <linearGradient id="r1" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ff8a8a"/><stop offset=".5" stop-color="#ff4d4d"/><stop offset="1" stop-color="#c62828"/></linearGradient>
    <linearGradient id="r2" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#8cc8ff"/><stop offset=".5" stop-color="#3d8bff"/><stop offset="1" stop-color="#1f5fc4"/></linearGradient>
    ${blur('ms', 5)}
  </defs>
  <path d="M60 0 H104 L122 120 H82 Z" fill="url(#r1)"/>
  <path d="M160 0 H116 L98 120 H138 Z" fill="url(#r2)"/>
  <path d="M98 100 L122 120 L98 120 Z" fill="#000" opacity=".2"/>
  <circle cx="116" cy="202" r="84" fill="#1d2440" opacity=".3" filter="url(#ms)"/>
  <circle cx="110" cy="192" r="84" fill="url(#mr)"/>
  <circle cx="110" cy="192" r="72" fill="url(#md)"/>
  <circle cx="110" cy="192" r="60" fill="none" stroke="${d}" stroke-width="4" opacity=".7"/>
  <circle cx="111.5" cy="193.5" r="58" fill="none" stroke="${l}" stroke-width="2" opacity=".8"/>
  <path d="M56 160 Q72 128 104 120" stroke="#fff" stroke-width="10" fill="none" stroke-linecap="round" opacity=".55"/>`, 220, 300);
}

/** Città lontana: foschia, poco contrasto (piano più lontano). */
function skylineSvg(): string {
  const b: string[] = [`<defs><linearGradient id="hz" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d6ecfa" stop-opacity="0"/><stop offset="1" stop-color="#e3f3fc" stop-opacity=".85"/></linearGradient></defs>`];
  const blocks = [[0, 150, 120], [130, 90, 110], [250, 200, 90], [350, 120, 130], [490, 60, 100], [600, 170, 110], [720, 110, 80]];
  blocks.forEach(([x, y, w], i) => {
    const col = i % 2 ? '#a9d2ec' : '#b8dbf0';
    b.push(`<rect x="${x}" y="${y}" width="${w}" height="${380 - y}" rx="6" fill="${col}"/>`);
    b.push(`<rect x="${x + w - 18}" y="${y}" width="18" height="${380 - y}" rx="4" fill="#94c3e2" opacity=".6"/>`);
    for (let yy = y + 24; yy < 360; yy += 46) for (let xx = x + 14; xx < x + w - 26; xx += 32)
      b.push(`<rect x="${xx}" y="${yy}" width="14" height="20" rx="3" fill="#d4ecfa"/>`);
  });
  b.push(`<rect x="0" y="0" width="800" height="380" fill="url(#hz)"/>`);
  return svgDoc(800, 380, b.join(''));
}

/** Piano intermedio: casette e alberi, un po' di foschia. */
function midtownSvg(): string {
  const p: string[] = [`<defs>${ballGrad('tr', '#b6eab8', '#74c785', '#4a9c62')}
    <linearGradient id="hz2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#dff1fb" stop-opacity=".5"/><stop offset="1" stop-color="#dff1fb" stop-opacity=".25"/></linearGradient></defs>`];
  const houses = [[20, '#f3c08a'], [250, '#e9a6a0'], [470, '#b8c6ea'], [690, '#f0d58a']] as const;
  houses.forEach(([x, col]) => {
    p.push(`<rect x="${x}" y="110" width="150" height="130" fill="${col}"/><rect x="${x + 120}" y="110" width="30" height="130" fill="#000" opacity=".1"/>
      <path d="M${x - 12} 114 L${x + 75} 50 L${x + 162} 114 Z" fill="${shade(col, -0.3)}"/>
      <path d="M${x - 12} 114 L${x + 75} 50 L${x + 80} 54 L${x} 114 Z" fill="#fff" opacity=".2"/>
      <rect x="${x + 22}" y="140" width="36" height="34" rx="4" fill="#d9eefa"/><rect x="${x + 92}" y="140" width="36" height="34" rx="4" fill="#d9eefa"/>`);
  });
  [190, 420, 640, 880].forEach((x) => {
    p.push(`<rect x="${x - 6}" y="170" width="12" height="70" fill="#8a6a50"/>
      <circle cx="${x}" cy="150" r="44" fill="url(#tr)"/><circle cx="${x - 26}" cy="172" r="30" fill="url(#tr)"/><circle cx="${x + 26}" cy="170" r="30" fill="url(#tr)"/>
      <ellipse cx="${x - 14}" cy="134" rx="14" ry="9" fill="#fff" opacity=".3"/>`);
  });
  p.push(`<rect x="0" y="0" width="960" height="240" fill="url(#hz2)"/>`);
  return svgDoc(960, 240, p.join(''));
}

function cloudSvg(): string {
  return svgDoc(320, 150, `<defs><linearGradient id="c" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset=".7" stop-color="#f4faff"/><stop offset="1" stop-color="#d2e7f7"/></linearGradient></defs>
    <g fill="url(#c)"><circle cx="90" cy="92" r="52"/><circle cx="160" cy="66" r="62"/><circle cx="232" cy="92" r="50"/><rect x="60" y="90" width="210" height="52" rx="26"/></g>
    <ellipse cx="140" cy="42" rx="34" ry="14" fill="#fff" opacity=".9"/>`);
}

function sunSvg(): string {
  let rays = '';
  for (let i = 0; i < 12; i++) {
    const a = (i * Math.PI) / 6;
    const x1 = 130 + Math.cos(a) * 88, y1 = 130 + Math.sin(a) * 88;
    const x2 = 130 + Math.cos(a) * 118, y2 = 130 + Math.sin(a) * 118;
    rays += `<path d="M${x1.toFixed(1)} ${y1.toFixed(1)} L${x2.toFixed(1)} ${y2.toFixed(1)}" stroke="#ffd84a" stroke-width="14" stroke-linecap="round" opacity=".85"/>`;
  }
  return svgDoc(260, 260, `<defs>${ballGrad('su', '#fffbe0', '#ffe066', '#ffae1a')}
    <radialGradient id="sg"><stop offset=".5" stop-color="#fff3a0" stop-opacity=".7"/><stop offset="1" stop-color="#fff3a0" stop-opacity="0"/></radialGradient></defs>
    <circle cx="130" cy="130" r="128" fill="url(#sg)"/>${rays}
    <circle cx="130" cy="130" r="72" fill="url(#su)"/>
    <path d="M100 124 Q108 116 116 124 M144 124 Q152 116 160 124" stroke="#c77700" stroke-width="6" fill="none" stroke-linecap="round"/>
    <path d="M108 148 Q130 166 152 148" stroke="#c77700" stroke-width="6" fill="none" stroke-linecap="round"/>
    <circle cx="96" cy="146" r="9" fill="#ff9e6d" opacity=".45"/><circle cx="164" cy="146" r="9" fill="#ff9e6d" opacity=".45"/>`);
}

function bushSvg(blurred: boolean): string {
  return svgDoc(240, 130, `<defs>${ballGrad('bu', '#a6eb9c', '#4fc266', '#23853f')}${blur('bs', 4)}${blur('bf', 3)}</defs>
    <ellipse cx="120" cy="118" rx="112" ry="10" fill="#1d2440" opacity=".3" filter="url(#bs)"/>
    <g ${blurred ? 'filter="url(#bf)"' : ''}>
      <circle cx="60" cy="74" r="44" fill="url(#bu)"/><circle cx="182" cy="76" r="42" fill="url(#bu)"/><circle cx="120" cy="56" r="52" fill="url(#bu)"/>
      <rect x="44" y="76" width="152" height="40" rx="20" fill="#3fa65a"/>
      <ellipse cx="102" cy="30" rx="18" ry="9" fill="#fff" opacity=".35"/>
      <circle cx="96" cy="58" r="7" fill="#ff6fa8"/><circle cx="150" cy="82" r="7" fill="#ffd23f"/><circle cx="68" cy="88" r="7" fill="#fff"/>
      <circle cx="94" cy="56" r="2.5" fill="#fff" opacity=".8"/><circle cx="148" cy="80" r="2.5" fill="#fff" opacity=".8"/>
    </g>`);
}

function raysSvg(): string {
  let r = '';
  for (let i = 0; i < 16; i++) {
    const a0 = (i * Math.PI) / 8, a1 = a0 + Math.PI / 16;
    r += `<path d="M450 450 L${(450 + Math.cos(a0) * 450).toFixed(1)} ${(450 + Math.sin(a0) * 450).toFixed(1)} L${(450 + Math.cos(a1) * 450).toFixed(1)} ${(450 + Math.sin(a1) * 450).toFixed(1)} Z" fill="#fff"/>`;
  }
  return svgDoc(900, 900, `<defs><radialGradient id="f"><stop offset=".2" stop-color="#fff" stop-opacity="1"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
    <mask id="m"><circle cx="450" cy="450" r="450" fill="url(#f)"/></mask></defs><g mask="url(#m)" opacity=".5">${r}</g>`);
}

export function gameTextures(): SvgTex[] {
  const list: SvgTex[] = TRUCKS.map((tr) => ({ key: `truck_${tr.id}`, w: 560, h: 330, svg: truckSvg(tr.body, tr.dark) }));
  list.push(
    { key: 'nozzle', w: 140, h: 50, svg: svgDoc(140, 50, `<defs>${lightGrad('nb', '#fff2b8', '#f5b942', '#c47f10', true)}${METAL('nm')}</defs>
      <rect x="20" y="13" width="104" height="24" rx="10" fill="url(#nb)" stroke="#a86a0c" stroke-width="2"/>
      <rect x="112" y="8" width="24" height="34" rx="8" fill="url(#nm)" stroke="#6f788c" stroke-width="2"/>
      <circle cx="22" cy="25" r="19" fill="url(#nm)" stroke="#6f788c" stroke-width="2"/>
      <path d="M40 18 H104" stroke="#fff" stroke-width="4" opacity=".75" stroke-linecap="round"/>`) },
    { key: 'ladder_tile', w: 64, h: 48, svg: svgDoc(64, 48, `<defs>${METAL('lm')}</defs>
      <rect x="0" y="4" width="64" height="11" fill="url(#lm)" stroke="#6f788c" stroke-width="1.5"/>
      <rect x="0" y="33" width="64" height="11" fill="url(#lm)" stroke="#6f788c" stroke-width="1.5"/>
      <rect x="26" y="15" width="12" height="18" fill="url(#lm)" stroke="#6f788c" stroke-width="1.5"/>
      <rect x="27" y="33" width="12" height="3" fill="#000" opacity=".2"/>`) },
    { key: 'flame', w: 150, h: 180, svg: flameSvg() },
    { key: 'window', w: 160, h: 170, svg: windowSvg() },
    { key: 'window_glow', w: 160, h: 170, svg: windowGlowSvg() },
    { key: 'window_frame', w: 160, h: 170, svg: windowFrameSvg() },
    { key: 'cat', w: 140, h: 150, svg: catSvg(false) },
    { key: 'cat_happy', w: 140, h: 150, svg: catSvg(true) },
    { key: 'medal_gold', w: 220, h: 300, svg: medalSvg('#ffcf2e', '#d08a00', '#fff6b0') },
    { key: 'medal_silver', w: 220, h: 300, svg: medalSvg('#d5dde8', '#8f9bb0', '#ffffff') },
    { key: 'medal_bronze', w: 220, h: 300, svg: medalSvg('#e8975a', '#a3561f', '#ffd2ad') },
    { key: 'medal_icon', w: 90, h: 123, svg: medalSvg('#ffcf2e', '#d08a00', '#fff6b0', 90, 123) },
    { key: 'skyline', w: 800, h: 380, svg: skylineSvg() },
    { key: 'midtown', w: 960, h: 240, svg: midtownSvg() },
    { key: 'cloud', w: 320, h: 150, svg: cloudSvg() },
    { key: 'sun', w: 260, h: 260, svg: sunSvg() },
    { key: 'drop', w: 34, h: 46, svg: svgDoc(34, 46, `<defs>${ballGrad('dr', '#e6f8ff', '#55c4ff', '#1f7ac4')}</defs>
      <path d="M17 3 Q31 22 31 31 Q31 43 17 43 Q3 43 3 31 Q3 22 17 3 Z" fill="url(#dr)"/>
      <ellipse cx="11" cy="28" rx="3.5" ry="6" fill="#fff" opacity=".85"/>`) },
    { key: 'puff', w: 130, h: 96, svg: svgDoc(130, 96, `<defs>${ballGrad('pf', '#ffffff', '#eef3f8', '#c3cfdd')}${blur('pb', 2)}</defs>
      <g fill="url(#pf)" filter="url(#pb)"><circle cx="40" cy="56" r="28"/><circle cx="70" cy="38" r="30"/><circle cx="96" cy="58" r="26"/><rect x="40" y="50" width="56" height="32" rx="14"/></g>`) },
    { key: 'bush', w: 240, h: 130, svg: bushSvg(false) },
    { key: 'bush_fg', w: 240, h: 130, svg: bushSvg(true) },
    { key: 'hydrant', w: 90, h: 120, svg: svgDoc(90, 120, `<defs>${lightGrad('hy', '#ff9a9a', '#ff4545', '#b51d1d')}${METAL('hm')}</defs>
      ${groundShadow(45, 108, 38, 7, 0.4)}
      <path d="M22 106 V48 Q22 24 45 24 Q68 24 68 48 V106 Z" fill="url(#hy)" stroke="#a31818" stroke-width="2"/>
      <rect x="8" y="56" width="74" height="20" rx="9" fill="url(#hy)" stroke="#a31818" stroke-width="2"/>
      <rect x="35" y="10" width="20" height="18" rx="5" fill="url(#hy)" stroke="#a31818" stroke-width="2"/>
      <circle cx="45" cy="66" r="6" fill="url(#hm)"/><path d="M30 40 V96" stroke="#fff" stroke-width="5" opacity=".45" stroke-linecap="round"/>`) },
    { key: 'big_star', w: 300, h: 300, svg: starSvg(300) },
    { key: 'rays', w: 900, h: 900, svg: raysSvg() },
    roundButton('btn_garage', '#ff7a4d', `
      <rect x="8" y="36" width="56" height="30" rx="7" fill="#fff"/>
      <path d="M62 66 V30 Q62 26 66 26 H78 Q84 26 88 34 L94 46 V66 Z" fill="#fff" stroke="#fff" stroke-width="2" stroke-linejoin="round"/>
      <circle cx="26" cy="70" r="11" fill="#fff"/><circle cx="78" cy="70" r="11" fill="#fff"/>
      <circle cx="26" cy="70" r="5" fill="#ff7a4d"/><circle cx="78" cy="70" r="5" fill="#ff7a4d"/>
      <rect x="12" y="22" width="44" height="7" rx="3.5" fill="#fff"/>`, 190),
  );
  return list;
}
