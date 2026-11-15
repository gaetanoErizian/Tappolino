/**
 * Genera icona dell'app Tappolino (la mascotte Tappo), icona adattiva Android, splash e grafiche store
 * a partire dal marchio in src/core/brand/ (prima: npm run brand).
 * Uso: npm run icons   (poi: npx capacitor-assets generate --iconBackgroundColor '#8fd3ff' --splashBackgroundColor '#8fd3ff')
 */
import sharp from 'sharp';
import { mkdirSync, writeFileSync, rmSync, readFileSync } from 'node:fs';
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

// Il marchio arriva dai file generati da scripts/make-brand.mjs (npm run brand).
const brand = (name: string) => readFileSync(`src/core/brand/${name}.svg`, 'utf8').trim();
/** Inserisce un SVG del marchio in un riquadro, rendendo unici i suoi id (più copie nella stessa immagine). */
let copies = 0;
function place(name: string, x: number, y: number, w: number): string {
  const svg = brand(name);
  const m = /width="(\d+)" height="(\d+)"/.exec(svg)!;
  const ns = `b${++copies}_`;
  const body = inner(svg).replaceAll('id="', `id="${ns}`).replaceAll('url(#', `url(#${ns}`).replaceAll('href="#', `href="#${ns}`);
  return `<svg x="${x}" y="${y}" width="${w}" height="${(w * Number(m[2])) / Number(m[1])}" viewBox="0 0 ${m[1]} ${m[2]}">${body}</svg>`;
}

// Icona: Tappo in primo piano su cielo e collina.
const icon = `${DEFS}<rect width="1024" height="1024" fill="url(#sky)"/>
  <path d="M0 1024 V820 Q260 720 520 800 Q780 880 1024 790 V1024 Z" fill="url(#hill)"/>
  ${place('mark', 112, 78, 800)}`;
const fg = `${DEFS}${place('mark', 262, 232, 500)}`;
const splash = `${DEFS}<rect width="2732" height="2732" fill="url(#sky)"/>${place('logo-stacked', 866, 1040, 1000)}`;

mkdirSync('assets', { recursive: true });
mkdirSync('store/graphics', { recursive: true });
const tile = inner(pompieriTile().svg);

const jobs: [string, string, number, number][] = [
  ['assets/icon-only.png', doc(1024, 1024, icon), 1024, 1024],
  ['assets/icon-foreground.png', doc(1024, 1024, fg), 1024, 1024],
  ['assets/icon-background.png', doc(1024, 1024, `${DEFS}<rect width="1024" height="1024" fill="url(#sky)"/>`), 1024, 1024],
  ['assets/splash.png', doc(2732, 2732, splash), 2732, 2732],
  ['assets/splash-dark.png', doc(2732, 2732, splash), 2732, 2732],
  ['store/graphics/icon-512.png', doc(1024, 1024, icon), 512, 512],
  ['store/graphics/feature-graphic-1024x500.png', doc(1024, 500, `${DEFS}<rect width="1024" height="500" fill="url(#sky)"/>
    <path d="M0 500 V380 Q260 320 520 380 Q780 430 1024 360 V500 Z" fill="url(#hill)"/>
    ${place('logo-stacked', 30, 60, 500)}
    <g transform="translate(590 100) rotate(0)"><rect x="-12" y="-12" width="384" height="304" rx="28" fill="#fff"/>
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
