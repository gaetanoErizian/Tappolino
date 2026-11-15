import { defineConfig, type Plugin } from 'vite';
import { fileURLToPath } from 'node:url';
import { readFileSync } from 'node:fs';

// `vite build --mode pages`: pagina di prova per i tester su GitHub Pages (decisione 28): password, niente motori
// di ricerca, e "Aggiungi a schermata Home" che apre il gioco a tutto schermo come un'app.

// `vite build --mode artifact`: build per la pagina di test web (Phaser da CDN, bundle piccolo).
const PHASER_CDN = 'https://cdn.jsdelivr.net/npm/phaser@4.2.1/dist/phaser.min.js';

export default defineConfig(({ mode }) => {
  const artifact = mode === 'artifact';
  const cdn: Plugin = {
    name: 'phaser-cdn',
    transformIndexHtml: (html) => html.replace('<script type="module"', `<script src="${PHASER_CDN}"></script>\n  <script type="module"`),
  };
  // Il loader Tappolino sta in index.html (visibile dal primo istante): qui si inseriscono scritta e mascotte.
  const brand: Plugin = {
    name: 'brand-inline',
    transformIndexHtml: {
      order: 'pre',
      handler: (html) => html.replace(/<!--brand:(\w[\w-]*)-->/g, (_m, name: string) =>
        readFileSync(fileURLToPath(new URL(`./src/core/brand/${name}.svg`, import.meta.url)), 'utf8').trim()),
    },
  };
  const pages = mode === 'pages';
  const tester: Plugin = {
    name: 'pagina-di-prova',
    transformIndexHtml: (html) => html.replace('</title>', '</title>\n  <meta name="robots" content="noindex, nofollow" />\n  <link rel="manifest" href="./manifest.webmanifest" />\n  <link rel="apple-touch-icon" href="./icon-512.png" />'),
    generateBundle() {
      this.emitFile({ type: 'asset', fileName: 'robots.txt', source: 'User-agent: *\nDisallow: /\n' });
      this.emitFile({ type: 'asset', fileName: 'icon-512.png', source: readFileSync(fileURLToPath(new URL('./store/graphics/icon-512.png', import.meta.url))) });
      this.emitFile({ type: 'asset', fileName: 'manifest.webmanifest', source: JSON.stringify({
        name: 'Tappolino (prova)', short_name: 'Tappolino', start_url: './', scope: './', display: 'fullscreen', orientation: 'landscape',
        background_color: '#8fd3ff', theme_color: '#8fd3ff', icons: [{ src: './icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' }],
      }) });
    },
  };
  return {
    base: './',
    plugins: artifact ? [brand, cdn] : pages ? [brand, tester] : [brand],
    resolve: artifact ? { alias: { phaser: fileURLToPath(new URL('./src/phaser-global.ts', import.meta.url)) } } : {},
    build: {
      target: 'es2020',
      assetsInlineLimit: 0,
      chunkSizeWarningLimit: 2000,
      outDir: artifact ? 'dist-web' : pages ? 'dist-pages' : 'dist',
    },
  };
});
