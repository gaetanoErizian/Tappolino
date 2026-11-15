import type { SvgTex } from './textures';
import markSvg from './brand/mark.svg?raw';
import wordmarkSvg from './brand/wordmark.svg?raw';
import logoSvg from './brand/logo.svg?raw';
import logoStackedSvg from './brand/logo-stacked.svg?raw';
import '@fontsource/fredoka/latin-500.css';
import '@fontsource/fredoka/latin-600.css';
import '@fontsource/fredoka/latin-700.css';

/**
 * Identità Tappolino: colori, carattere e marchio (mascotte "Tappo" + scritta).
 * I file SVG in ./brand/ sono generati da scripts/make-brand.mjs (npm run brand): non modificarli a mano.
 */
export const BRAND = {
  ink: '#2b2140',
  cream: '#fffaf0',
  sky: '#8fd3ff',
  coral: '#ff5a5f',
  orange: '#ff9f1c',
  yellow: '#ffc800',
  green: '#35c46a',
  blue: '#36a9f0',
  violet: '#8a5cf6',
  pink: '#ff5e9a',
  teal: '#17b8a6',
} as const;

/** I colori delle lettere del logo, nell'ordine: usati per barre, bordi e accenti. */
export const RAINBOW = [BRAND.coral, BRAND.orange, BRAND.yellow, BRAND.green, BRAND.blue, BRAND.violet, BRAND.pink] as const;

/** Carattere dell'app (Fredoka, OFL 1.1, incluso nel pacchetto) con ripieghi di sistema. */
export const FONT = '"Fredoka", "Trebuchet MS", "Arial Rounded MT Bold", system-ui, sans-serif';

export const MARK_SVG: string = markSvg;
export const WORDMARK_SVG: string = wordmarkSvg;
export const LOGO_SVG: string = logoSvg;
export const LOGO_STACKED_SVG: string = logoStackedSvg;

/** Marchio come texture Phaser (menu dei giochi e schermate che lo mostrano). */
export function brandTextures(): SvgTex[] {
  return [
    { key: 'brand_logo', w: 1305, h: 420, svg: LOGO_SVG },
    { key: 'brand_mark', w: 300, h: 340, svg: MARK_SVG },
  ];
}

/**
 * Aspetta che Fredoka sia pronto prima di disegnare testi sul canvas (Phaser misura il testo una volta sola).
 * Se il carattere non si carica entro il tempo massimo si prosegue con quello di sistema.
 */
export async function loadBrandFont(timeoutMs = 4000): Promise<void> {
  const fonts = (document as Document & { fonts?: FontFaceSet }).fonts;
  if (!fonts?.load) return;
  const all = Promise.all(['500', '600', '700'].map((w) => fonts.load(`${w} 40px Fredoka`, 'Tappolino àéñöß')));
  await Promise.race([all, new Promise((r) => setTimeout(r, timeoutMs))]).catch(() => undefined);
}

/** SVG come data: URL, per usarlo in <img> o in CSS senza conflitti di id con altri SVG nella pagina. */
export const svgDataUrl = (svg: string): string => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
