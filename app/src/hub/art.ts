import { svgDoc, type SvgTex } from '../core/textures';
import { ballGrad, blur, lightGrad } from '../core/art';

/** Grafica 2.5D del menu dei giochi: colline a piani, erba in primo piano, tessere e lucchetto. */

function hillsFar(): string {
  return svgDoc(1600, 320, `<defs>
    <linearGradient id="h1" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#b9e2cf"/><stop offset="1" stop-color="#9fd2bb"/></linearGradient>
    <linearGradient id="hz" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e2f4fb" stop-opacity=".2"/><stop offset="1" stop-color="#e2f4fb" stop-opacity=".7"/></linearGradient></defs>
    <path d="M0 320 V170 Q120 80 260 140 Q400 200 520 120 Q660 30 820 120 Q960 200 1100 110 Q1240 30 1380 120 Q1500 200 1600 170 V320 Z" fill="url(#h1)"/>
    <path d="M0 320 V230 Q200 160 400 220 Q600 280 800 210 Q1000 150 1200 220 Q1400 280 1600 220 V320 Z" fill="#a6d8b4"/>
    <rect width="1600" height="320" fill="url(#hz)"/>`);
}

function hillsMid(): string {
  const trees = [140, 430, 760, 1080, 1420].map((x, i) => {
    const y = 120 + (i % 2) * 24;
    return `<rect x="${x - 7}" y="${y + 30}" width="14" height="60" rx="5" fill="#8a6a50"/>
      <circle cx="${x}" cy="${y}" r="46" fill="url(#tr)"/><circle cx="${x - 28}" cy="${y + 22}" r="30" fill="url(#tr)"/><circle cx="${x + 28}" cy="${y + 20}" r="30" fill="url(#tr)"/>
      <ellipse cx="${x - 14}" cy="${y - 18}" rx="14" ry="8" fill="#fff" opacity=".35"/>`;
  }).join('');
  return svgDoc(1600, 280, `<defs>${ballGrad('tr', '#b9f0a8', '#62c464', '#2f8f45')}
    <linearGradient id="h2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9fe08a"/><stop offset="1" stop-color="#5fb653"/></linearGradient></defs>
    <path d="M0 280 V170 Q180 110 380 160 Q560 205 760 150 Q980 90 1180 160 Q1380 220 1600 170 V280 Z" fill="url(#h2)"/>
    <path d="M0 170 Q180 110 380 160" stroke="#c8f3b4" stroke-width="5" fill="none" opacity=".7"/>
    ${trees}`);
}

function grassFg(): string {
  let blades = '';
  for (let i = 0; i < 26; i++) {
    const x = 10 + i * 15, h = 70 + ((i * 37) % 60);
    blades += `<path d="M${x} 200 Q${x + 8} ${200 - h / 2} ${x + (i % 2 ? 14 : -6)} ${200 - h}" stroke="${i % 3 ? '#4fae4a' : '#6cc85c'}" stroke-width="12" fill="none" stroke-linecap="round"/>`;
  }
  return svgDoc(400, 200, `<defs>${blur('b', 3)}${ballGrad('fl', '#fff', '#ff8fbd', '#e05a95')}${ballGrad('fy', '#fff', '#ffd84a', '#e0a000')}</defs>
    <g filter="url(#b)">${blades}<circle cx="90" cy="96" r="16" fill="url(#fl)"/><circle cx="260" cy="110" r="14" fill="url(#fy)"/><circle cx="340" cy="84" r="15" fill="url(#fl)"/></g>`);
}

/** Cornice della tessera: cartoncino lucido con spessore (2.5D). */
function card(): string {
  return svgDoc(440, 420, `<defs>${lightGrad('cf', '#ffffff', '#f6f9ff', '#d7e3f2')}
    <linearGradient id="gl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".9"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient></defs>
    <rect x="10" y="22" width="420" height="390" rx="42" fill="#b8c7da"/>
    <rect x="10" y="8" width="420" height="390" rx="42" fill="url(#cf)" stroke="#c9d6e6" stroke-width="3"/>
    <rect x="40" y="36" width="360" height="280" rx="24" fill="#2a3a5a" opacity=".18"/>
    <path d="M52 20 H388" stroke="url(#gl)" stroke-width="10" stroke-linecap="round"/>`);
}

function lockBadge(): string {
  return svgDoc(150, 160, `<defs>${lightGrad('lk', '#fff2b0', '#ffc93a', '#d88a00')}${lightGrad('sh', '#ffffff', '#cdd4e0', '#7c8599', true)}${blur('s', 4)}</defs>
    <ellipse cx="75" cy="150" rx="50" ry="8" fill="#1d2440" opacity=".35" filter="url(#s)"/>
    <path d="M42 70 V50 Q42 16 75 16 Q108 16 108 50 V70" fill="none" stroke="url(#sh)" stroke-width="18" stroke-linecap="round"/>
    <rect x="22" y="64" width="106" height="80" rx="20" fill="url(#lk)" stroke="#c07a00" stroke-width="3"/>
    <circle cx="75" cy="98" r="12" fill="#8a5200"/><rect x="70" y="102" width="10" height="22" rx="5" fill="#8a5200"/>
    <ellipse cx="50" cy="80" rx="16" ry="7" fill="#fff" opacity=".7"/>`);
}

export function hubTextures(): SvgTex[] {
  return [
    { key: 'hub_hills_far', w: 1600, h: 320, svg: hillsFar() },
    { key: 'hub_hills_mid', w: 1600, h: 280, svg: hillsMid() },
    { key: 'hub_grass_fg', w: 400, h: 200, svg: grassFg() },
    { key: 'hub_card', w: 440, h: 420, svg: card() },
    { key: 'hub_lock', w: 150, h: 160, svg: lockBadge() },
  ];
}

