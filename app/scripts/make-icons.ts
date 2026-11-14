/**
 * Genera icona dell'app Tappolino, icona adattiva Android, splash e grafiche store.
 * Uso: npm run icons   (poi: npx capacitor-assets generate --iconBackgroundColor '#8fd3ff' --splashBackgroundColor '#8fd3ff')
 */
import sharp from 'sharp';
import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { pompieriTile } from '../src/games/pompieri/tile';

const inner = (svg: string) => svg.replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '');
const doc = (w: number, h: number, body: string) => `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${body}</svg>`;

const DEFS = `<defs>
  <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4fb3f2"/><stop offset="1" stop-color="#d4f0ff"/></linearGradient>
  <linearGradient id="tf" x1="0" y1="0" x2=".7" y2="1"><stop offset="0" stop-color="#ffb36b"/><stop offset=".45" stop-color="#ff6b4a"/><stop offset="1" stop-color="#e0354f"/></linearGradient>
  <linearGradient id="hill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9fe08a"/><stop offset="1" stop-color="#4c9c44"/></linearGradient>
  <radialGradient id="ey" cx=".35" cy=".3" r=".75"><stop offset="0" stop-color="#6a4a7a"/><stop offset=".5" stop-color="#3a2230"/><stop offset="1" stop-color="#160c14"/></radialGradient>
  <radialGradient id="st" cx=".35" cy=".3" r=".75"><stop offset="0" stop-color="#fff6b0"/><stop offset=".5" stop-color="#ffcf2e"/><stop offset="1" stop-color="#f08c00"/></radialGradient>
  <filter id="sh" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="14"/></filter>
</defs>`;

function star(cx: number, cy: number, r: number): string {
  let d = '';
  for (let i = 0; i < 10; i++) {
    const rr = i % 2 ? r * 0.48 : r, a = -Math.PI / 2 + (i * Math.PI) / 5;
    d += `${i ? 'L' : 'M'}${(cx + rr * Math.cos(a)).toFixed(1)} ${(cy + rr * Math.sin(a)).toFixed(1)} `;
  }
  return `<path d="${d}Z" fill="url(#st)"/>`;
}

/** La "T" di Tappolino in rilievo, con faccina: estrusione scura, faccia sfumata, riflesso. */
function bigT(x: number, y: number, s: number): string {
  const shape = (dx: number, dy: number, fill: string) =>
    `<rect x="${232 + dx}" y="${230 + dy}" width="560" height="190" rx="70" fill="${fill}"/><rect x="${412 + dx}" y="${360 + dy}" width="200" height="460" rx="80" fill="${fill}"/>`;
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <ellipse cx="530" cy="860" rx="250" ry="34" fill="#1d2440" opacity=".35" filter="url(#sh)"/>
    ${shape(22, 30, '#a3203a')}${shape(0, 0, 'url(#tf)')}
    <rect x="270" y="252" width="420" height="40" rx="20" fill="#fff" opacity=".45"/>
    <rect x="436" y="430" width="34" height="300" rx="17" fill="#fff" opacity=".28"/>
    <ellipse cx="420" cy="320" rx="34" ry="42" fill="url(#ey)"/><ellipse cx="604" cy="320" rx="34" ry="42" fill="url(#ey)"/>
    <circle cx="432" cy="304" r="12" fill="#fff"/><circle cx="616" cy="304" r="12" fill="#fff"/>
    <path d="M462 520 Q512 572 562 520" stroke="#7a1a2a" stroke-width="18" fill="none" stroke-linecap="round"/>
    <circle cx="436" cy="500" r="24" fill="#ff9fb0" opacity=".6"/><circle cx="588" cy="500" r="24" fill="#ff9fb0" opacity=".6"/>
  </g>`;
}

const icon = `${DEFS}<rect width="1024" height="1024" fill="url(#sky)"/>
  <path d="M0 1024 V800 Q260 700 520 790 Q780 870 1024 770 V1024 Z" fill="url(#hill)"/>
  ${star(170, 190, 70)}${star(860, 230, 52)}${star(820, 600, 36)}
  ${bigT(0, 20, 1)}`;
const fg = `${DEFS}${bigT(150, 170, 0.7)}`;

mkdirSync('assets', { recursive: true });
mkdirSync('store/graphics', { recursive: true });
const tile = inner(pompieriTile().svg);

const jobs: [string, string, number, number][] = [
  ['assets/icon-only.png', doc(1024, 1024, icon), 1024, 1024],
  ['assets/icon-foreground.png', doc(1024, 1024, fg), 1024, 1024],
  ['assets/icon-background.png', doc(1024, 1024, `${DEFS}<rect width="1024" height="1024" fill="url(#sky)"/>`), 1024, 1024],
  ['assets/splash.png', doc(2732, 2732, `${DEFS}<rect width="2732" height="2732" fill="url(#sky)"/>${bigT(910, 880, 0.9)}`), 2732, 2732],
  ['assets/splash-dark.png', doc(2732, 2732, `${DEFS}<rect width="2732" height="2732" fill="url(#sky)"/>${bigT(910, 880, 0.9)}`), 2732, 2732],
  ['store/graphics/icon-512.png', doc(1024, 1024, icon), 512, 512],
  ['store/graphics/feature-graphic-1024x500.png', doc(1024, 500, `${DEFS}<rect width="1024" height="500" fill="url(#sky)"/>
    <path d="M0 500 V380 Q260 320 520 380 Q780 430 1024 360 V500 Z" fill="url(#hill)"/>
    ${star(80, 80, 34)}${star(960, 70, 28)}
    ${bigT(20, 10, 0.46)}
    <g transform="translate(540 90) rotate(0)"><rect x="-12" y="-12" width="384" height="304" rx="28" fill="#fff"/>
    <svg x="0" y="0" width="360" height="280" viewBox="0 0 360 280">${tile}</svg></g>`), 1024, 500],
];

(async () => {
  for (const [file, svg, w, h] of jobs) {
    await sharp(Buffer.from(svg)).resize(w, h).png().toFile(file);
    console.log('✓', file);
  }
  writeFileSync('public/icon.svg', doc(1024, 1024, icon));
  writeFileSync('store/graphics/icon.svg', doc(1024, 1024, icon));
  rmSync('icons', { recursive: true, force: true });
  console.log('✓ public/icon.svg');
})();
