/**
 * Genera icona app, icona adattiva Android, splash e grafica store dalla grafica vettoriale del gioco.
 * Uso: npm run icons   (poi: npx capacitor-assets generate)
 */
import sharp from 'sharp';
import { mkdirSync, writeFileSync } from 'node:fs';
import { truckSvg, flameSvg } from '../src/art';
import { TRUCKS } from '../src/levels';

const red = TRUCKS[0];
// Scala e cannone (nel gioco sono sprite separati e animati).
const rung = (x: number) => `<rect x="${x}" y="91" width="10" height="18" fill="url(#mt)" stroke="#6f788c" stroke-width="2"/>`;
const extras = `<g>${[190, 230, 270, 310, 350].map(rung).join('')}
  <rect x="166" y="80" width="214" height="12" fill="url(#mt)" stroke="#6f788c" stroke-width="2"/>
  <rect x="166" y="106" width="214" height="12" fill="url(#mt)" stroke="#6f788c" stroke-width="2"/></g>
  <g transform="translate(107 92) rotate(-30)"><rect x="-2" y="-12" width="104" height="24" rx="10" fill="url(#hm)" stroke="#a86a0c" stroke-width="2"/>
  <rect x="90" y="-17" width="24" height="34" rx="8" fill="url(#mt)" stroke="#6f788c" stroke-width="2"/><circle r="19" fill="url(#mt)" stroke="#6f788c" stroke-width="2"/></g>`;
const inner = (svg: string) => svg.replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '');
const truck = (x: number, y: number, w: number) =>
  `<svg x="${x}" y="${y}" width="${w}" height="${(w * 330) / 560}" viewBox="0 0 560 330">${inner(truckSvg(red.body, red.dark))}${extras}</svg>`;

const flame = (x: number, y: number, s: number) =>
  `<svg x="${x}" y="${y}" width="${150 * s}" height="${180 * s}" viewBox="0 0 150 180">${inner(flameSvg())}</svg>`;

const drops = (pts: [number, number, number][]) => pts.map(([x, y, s]) =>
  `<path transform="translate(${x} ${y}) scale(${s}) rotate(110 17 23)" d="M17 3 Q31 22 31 31 Q31 43 17 43 Q3 43 3 31 Q3 22 17 3 Z" fill="url(#drp)"/>`).join('');

const sky = (w: number, h: number) => `<defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4fb3f2"/><stop offset="1" stop-color="#d4f0ff"/></linearGradient>
  <radialGradient id="drp" cx=".35" cy=".3" r=".75"><stop offset="0" stop-color="#e6f8ff"/><stop offset=".5" stop-color="#55c4ff"/><stop offset="1" stop-color="#1f7ac4"/></radialGradient>
  <radialGradient id="sun" cx=".35" cy=".3" r=".75"><stop offset="0" stop-color="#fffbe0"/><stop offset=".5" stop-color="#ffe066"/><stop offset="1" stop-color="#ffae1a"/></radialGradient>
  <linearGradient id="road" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7a8292"/><stop offset="1" stop-color="#4f5564"/></linearGradient></defs>
  <rect width="${w}" height="${h}" fill="url(#sky)"/>`;

const doc = (w: number, h: number, body: string) => `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${body}</svg>`;

// Icona: camion grande che spegne una fiammella simpatica.
const iconBody = `${sky(1024, 1024)}
  <circle cx="830" cy="190" r="95" fill="url(#sun)"/>
  <rect y="790" width="1024" height="234" fill="url(#road)"/><rect y="760" width="1024" height="34" fill="#efe8dc"/><rect y="760" width="1024" height="6" fill="#fff" opacity=".8"/>
  ${flame(600, 150, 1.55)}
  ${drops([[300, 300, 1.6], [380, 250, 1.7], [460, 230, 1.8], [540, 250, 1.6]])}
  ${truck(40, 410, 900)}`;
const fgBody = `${flame(590, 250, 1.1)}${drops([[360, 380, 1.2], [430, 340, 1.3], [500, 330, 1.3]])}${truck(180, 450, 660)}`;

const out = (p: string) => p;
mkdirSync('assets', { recursive: true });
mkdirSync('store/graphics', { recursive: true });

const jobs: [string, string, number, number][] = [
  ['assets/icon-only.png', doc(1024, 1024, iconBody), 1024, 1024],
  ['assets/icon-foreground.png', doc(1024, 1024, fgBody), 1024, 1024],
  ['assets/icon-background.png', doc(1024, 1024, sky(1024, 1024)), 1024, 1024],
  ['assets/splash.png', doc(2732, 2732, `${sky(2732, 2732)}${truck(866, 1100, 1000)}`), 2732, 2732],
  ['assets/splash-dark.png', doc(2732, 2732, `${sky(2732, 2732)}${truck(866, 1100, 1000)}`), 2732, 2732],
  ['store/graphics/icon-512.png', doc(1024, 1024, iconBody), 512, 512],
  ['store/graphics/feature-graphic-1024x500.png', doc(1024, 500, `${sky(1024, 500)}
    <rect y="400" width="1024" height="100" fill="url(#road)"/><rect y="380" width="1024" height="22" fill="#efe8dc"/>
    ${flame(720, 60, 1.3)}${flame(860, 120, 0.9)}${drops([[420, 150, 1.4], [500, 120, 1.5], [580, 110, 1.5], [650, 120, 1.3]])}${truck(60, 150, 560)}`), 1024, 500],
];

(async () => {
  for (const [file, svg, w, h] of jobs) {
    await sharp(Buffer.from(svg)).resize(w, h).png().toFile(out(file));
    console.log('✓', file);
  }
  writeFileSync('public/icon.svg', doc(1024, 1024, iconBody));
  writeFileSync('store/graphics/icon.svg', doc(1024, 1024, iconBody));
  console.log('✓ public/icon.svg');
})();
