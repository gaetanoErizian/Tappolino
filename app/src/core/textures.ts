import type Phaser from 'phaser';

/** Una texture vettoriale: SVG disegnato in "unità di design" e rasterizzato a w×h pixel. */
export interface SvgTex { key: string; w: number; h: number; svg: string; }

/** Avvolge il contenuto SVG con dimensioni pixel e viewBox di design. */
export function svgDoc(w: number, h: number, body: string, vbW = w, vbH = h): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${vbW} ${vbH}">${body}</svg>`;
}

/**
 * Rasterizza gli SVG su canvas e li registra come texture Phaser.
 * Nessun file immagine esterno: tutta la grafica è generata nel codice (vettoriale, originale).
 * `onProgress` riceve la quota di texture pronte (0..1), per la barra del loader.
 */
export async function registerSvgTextures(scene: Phaser.Scene, list: SvgTex[], onProgress?: (p: number) => void): Promise<void> {
  let ready = 0;
  const tick = () => { ready++; onProgress?.(ready / list.length); };
  await Promise.all(list.map((tex) => new Promise<void>((done) => {
    const resolve = () => { tick(); done(); };
    if (scene.textures.exists(tex.key)) { resolve(); return; }
    const img = new Image();
    const url = URL.createObjectURL(new Blob([tex.svg], { type: 'image/svg+xml' }));
    img.onload = () => {
      const c = document.createElement('canvas');
      c.width = tex.w;
      c.height = tex.h;
      c.getContext('2d')!.drawImage(img, 0, 0, tex.w, tex.h);
      scene.textures.addCanvas(tex.key, c);
      URL.revokeObjectURL(url);
      resolve();
    };
    img.onerror = () => {
      console.warn('SVG non valido:', tex.key);
      URL.revokeObjectURL(url);
      resolve();
    };
    img.src = url;
  })));
}
