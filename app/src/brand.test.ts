import { describe, expect, it } from 'vitest';
import { progressOf, runWithLoader, withTimeout } from './core/loader';
import { BRAND, RAINBOW, FONT, MARK_SVG, WORDMARK_SVG, LOGO_SVG, brandTextures, svgDataUrl } from './core/brand';
import { sound } from './core/sound';
import { HUB_LOOP, registerHubSound } from './hub/sfx';
import { sample } from './games/pompieri/jet';

describe('loader Tappolino', () => {
  const steps = [{ weight: 2 }, { weight: 1 }, { weight: 5 }, { weight: 2 }];
  it('la barra parte da zero, arriva a uno e non torna mai indietro', () => {
    expect(progressOf(steps, 0, 0)).toBe(0);
    expect(progressOf(steps, 3, 1)).toBe(1);
    let last = -1;
    steps.forEach((_, i) => [0, 0.3, 0.7, 1].forEach((inner) => {
      const p = progressOf(steps, i, inner);
      expect(p).toBeGreaterThanOrEqual(last);
      last = p;
    }));
  });
  it('ogni passo pesa in proporzione', () => {
    expect(progressOf(steps, 2, 0)).toBeCloseTo(0.3);
    expect(progressOf(steps, 2, 0.5)).toBeCloseTo(0.55);
    expect(progressOf(steps, 2, 7)).toBeCloseTo(0.8); // valori fuori scala vengono limitati
  });
  it('senza pagina (test) i passi vengono comunque eseguiti in ordine; quelli facoltativi possono fallire', async () => {
    const order: string[] = [];
    (globalThis as { document?: unknown }).document ??= { getElementById: () => null };
    await runWithLoader([
      { weight: 1, run: () => { order.push('a'); } },
      { weight: 1, optional: true, run: () => { order.push('b'); throw new Error('audio non disponibile'); } },
      { weight: 1, run: async () => { order.push('c'); } },
    ]);
    expect(order).toEqual(['a', 'b', 'c']);
  });
  it('un passo lento non blocca oltre il tempo massimo', async () => {
    expect(await withTimeout(new Promise((r) => setTimeout(() => r('tardi'), 200)), 20)).toBeUndefined();
    expect(await withTimeout(Promise.resolve('ok'), 200)).toBe('ok');
  });
});

describe('marchio', () => {
  it('logo, scritta e mascotte sono SVG validi generati dallo script', () => {
    for (const svg of [MARK_SVG, WORDMARK_SVG, LOGO_SVG]) {
      expect(svg.startsWith('<svg')).toBe(true);
      expect(svg.trim().endsWith('</svg>')).toBe(true);
    }
    // 9 lettere, ognuna definita una volta
    expect(WORDMARK_SVG.match(/<path id="w\dp"/g)?.length).toBe(9);
    expect(svgDataUrl(MARK_SVG).startsWith('data:image/svg+xml')).toBe(true);
  });
  it('texture del marchio con le proporzioni dei file', () => {
    for (const t of brandTextures()) {
      const m = /width="(\d+)" height="(\d+)"/.exec(t.svg)!;
      expect([t.w, t.h]).toEqual([Number(m[1]), Number(m[2])]);
    }
  });
  it('colori e carattere del marchio', () => {
    expect(RAINBOW).toHaveLength(7);
    expect(RAINBOW[0]).toBe(BRAND.coral);
    expect(FONT.startsWith('"Fredoka"')).toBe(true);
  });
});

describe('audio del menu', () => {
  it('pacchetto "hub": musica in due formati ed effetti', () => {
    registerHubSound();
    const pack = (sound as unknown as { packs: Map<string, { music?: { ogg: string; mp3: string; loop: number }; sfx: Record<string, string> }> }).packs.get('hub')!;
    expect(pack.music?.loop).toBe(HUB_LOOP);
    expect(pack.music?.ogg).toMatch(/theme.*\.ogg|^data:/);
    expect(Object.keys(pack.sfx).sort()).toEqual(['locked', 'open', 'page', 'pop', 'ready']);
  });
  it('il loop dura 16 battute a 108 bpm', () => {
    expect(HUB_LOOP).toBeCloseTo((16 * 4 * 60) / 108, 4);
  });
});

describe('getto d’acqua di Pompieri', () => {
  // Bézier quadratica con la stessa interfaccia di Phaser.Curves.QuadraticBezier (punto e tangente).
  const [a, b, c] = [{ x: 300, y: 700 }, { x: 700, y: 200 }, { x: 1100, y: 400 }];
  const curve = {
    getPoint: (t: number) => ({ x: (1 - t) ** 2 * a.x + 2 * (1 - t) * t * b.x + t * t * c.x, y: (1 - t) ** 2 * a.y + 2 * (1 - t) * t * b.y + t * t * c.y }),
    getTangent: (t: number) => {
      const x = 2 * (1 - t) * (b.x - a.x) + 2 * t * (c.x - b.x), y = 2 * (1 - t) * (b.y - a.y) + 2 * t * (c.y - b.y);
      const len = Math.hypot(x, y);
      return { x: x / len, y: y / len };
    },
  };
  it('è un flusso continuo dalla bocca al bersaglio, più largo verso la punta', () => {
    const pts = sample(curve as never, 0, 1, 0);
    expect(pts[0].x).toBeCloseTo(300, 0);
    expect(pts[pts.length - 1].x).toBeCloseTo(1100, -1);
    // nessun buco: punti vicini tra loro
    for (let i = 1; i < pts.length; i++) expect(Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y)).toBeLessThan(90);
    const mid = pts[Math.floor(pts.length / 2)], near = pts[4];
    expect(mid.w).toBeGreaterThan(near.w);
    // la normale punta sempre verso l'alto (il riflesso sta sul lato superiore)
    pts.forEach((p) => expect(p.ny).toBeLessThanOrEqual(0));
  });
  it('quando la coda si stacca il getto si accorcia verso il bersaglio', () => {
    const pts = sample(curve as never, 0.6, 1, 0);
    expect(pts[0].x).toBeGreaterThan(700);
  });
});
