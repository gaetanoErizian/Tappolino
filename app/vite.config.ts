import { defineConfig, type Plugin } from 'vite';
import { fileURLToPath } from 'node:url';

// `vite build --mode artifact`: build per la pagina di test web (Phaser da CDN, bundle piccolo).
const PHASER_CDN = 'https://cdn.jsdelivr.net/npm/phaser@4.2.1/dist/phaser.min.js';

export default defineConfig(({ mode }) => {
  const artifact = mode === 'artifact';
  const cdn: Plugin = {
    name: 'phaser-cdn',
    transformIndexHtml: (html) => html.replace('<script type="module"', `<script src="${PHASER_CDN}"></script>\n  <script type="module"`),
  };
  return {
    base: './',
    plugins: artifact ? [cdn] : [],
    resolve: artifact ? { alias: { phaser: fileURLToPath(new URL('./src/phaser-global.ts', import.meta.url)) } } : {},
    build: {
      target: 'es2020',
      assetsInlineLimit: 0,
      chunkSizeWarningLimit: 2000,
      outDir: artifact ? 'dist-web' : 'dist',
    },
  };
});
