import { describe, expect, it } from 'vitest';
import {
  DINOS, DINO_IDS, FRAME, FLOOR, CELL, BONE_BOX, STAGE, TRAY_Y, TRAY_BOX, nextDino, addFound, sanitizeFound, layoutDig,
  fitScale, dropsOnSkeleton, stagePoint, trayX, isDinoId,
} from './dinos';
import { piecesOf, insideFrame, faceOf, HEADS, smoothPath, taper, along } from './skeleton';
import { ScratchGrid } from './scratch';
import { gameTextures } from './art';
import { dinosauriTile } from './tile';
import entry from './entry';
import { mergeDefaults } from '../../core/storage';
import { LOCALES } from './locales';
import { DEFAULT_SAVE } from './save';
import { sound } from '../../core/sound';
import { PACK, THEME_LOOP, SFX_URLS, SFX_NAMES, registerDinosauriSound, sfx } from './sfx';


describe('dinosauri: voce di menu', () => {
  it('gioco 3, gratis, colore e titoli dal brief', () => {
    expect(entry.id).toBe('dinosauri');
    expect(entry.order).toBe(3);
    expect(entry.free).toBe(true);
    expect(entry.color).toBe('#c9853a');
    for (const l of ['it', 'en', 'es', 'fr', 'de', 'pt'] as const) {
      expect(entry.titles[l].length).toBeGreaterThan(3);
      expect(LOCALES[l]['dinosauri.title']).toBe(entry.titles[l]);
    }
    expect(dinosauriTile().key).toBe('tile_dinosauri');
  });
});

describe('dinosauri: i dinosauri', () => {
  it('8 dinosauri diversi, da 4 a 6 pezzi, prima quelli con meno pezzi', () => {
    expect(DINOS.length).toBe(8);
    expect(new Set(DINO_IDS).size).toBe(8);
    expect(new Set(DINOS.map((d) => d.color)).size).toBe(8);
    for (const d of DINOS) {
      expect(d.pieces.length).toBeGreaterThanOrEqual(4);
      expect(d.pieces.length).toBeLessThanOrEqual(6);
      expect(new Set(d.pieces).size).toBe(d.pieces.length);
      expect(d.pieces).toContain('skull');
      expect(d.color).toMatch(/^#[0-9a-f]{6}$/);
    }
    expect(DINOS[0].pieces.length).toBe(4);
    const counts = DINOS.map((d) => d.pieces.length);
    expect([...counts].sort((a, b) => a - b)).toEqual(counts);
  });
  it('ogni osso sta nel riquadro del dinosauro e ha una sua texture e impronta', () => {
    const keys = new Set(gameTextures().map((t) => t.key));
    for (const d of DINOS) {
      const ps = piecesOf(d.id);
      expect(ps.map((p) => p.id)).toEqual(d.pieces);
      for (const p of ps) {
        expect(insideFrame(p), `${d.id}/${p.id} ${p.x},${p.y} ${p.w}x${p.h}`).toBe(true);
        expect(p.w).toBeGreaterThan(30);
        expect(keys.has(`di_bone_${d.id}_${p.id}`)).toBe(true);
        expect(keys.has(`di_ghost_${d.id}_${p.id}`)).toBe(true);
      }
      expect(keys.has(`di_dino_${d.id}`)).toBe(true);
    }
  });
  it('occhio e bocca dentro la testa, testa dentro il riquadro', () => {
    for (const d of DINOS) {
      const f = faceOf(d.id);
      const { head } = d.pose;
      expect(Math.hypot(f.eye.x - head.x, f.eye.y - head.y)).toBeLessThan(head.r);
      expect(f.mouth.x).toBeGreaterThan(head.x);
      expect(head.y - head.r).toBeGreaterThanOrEqual(0);
      expect(HEADS[d.id].d.startsWith('M')).toBe(true);
    }
  });
  it('texture con chiavi uniche e SVG validi', () => {
    const list = gameTextures();
    expect(new Set(list.map((t) => t.key)).size).toBe(list.length);
    for (const t of list) {
      expect(t.key.startsWith('di_')).toBe(true);
      expect(t.svg.startsWith('<svg')).toBe(true);
      expect(t.svg).not.toContain('NaN');
      expect(t.w * t.h).toBeLessThanOrEqual(1600 * 600);
    }
  });
  it('geometria: curve e sagome affusolate senza valori invalidi', () => {
    const pts = [{ x: 0, y: 0 }, { x: 100, y: 50 }, { x: 200, y: 0 }];
    expect(smoothPath(pts)).toMatch(/^M0\.0 0\.0 C/);
    expect(taper(pts, 40, 10)).toMatch(/Z$/);
    expect(along(pts, 0)).toEqual({ x: 0, y: 0 });
    expect(along(pts, 1)).toEqual({ x: 200, y: 0 });
  });
});

describe('dinosauri: progressione e album', () => {
  it('si scoprono in ordine, uno nuovo per scavo', () => {
    let found: string[] = [];
    for (const d of DINOS) {
      const id = nextDino(found, found[found.length - 1] ?? '');
      expect(id).toBe(d.id);
      found = addFound(found, id);
    }
    expect(found).toEqual(DINO_IDS);
  });
  it('ad album completo: mai lo stesso due volte di fila', () => {
    for (const last of DINO_IDS) for (const r of [0, 0.5, 0.9999]) expect(nextDino(DINO_IDS, last, () => r)).not.toBe(last);
  });
  it('album senza doppioni né dinosauri sconosciuti', () => {
    expect(addFound(['rex'], 'rex')).toEqual(['rex']);
    expect(sanitizeFound(['rex', 'rex', 'godzilla', 3, null, 'tricera'])).toEqual(['rex', 'tricera']);
    expect(sanitizeFound('x')).toEqual([]);
    expect(isDinoId('stego')).toBe(true);
    expect(isDinoId('unicorno')).toBe(false);
  });
  it('salvataggi: unisce dati vecchi con nuovi campi e ignora tipi sbagliati', () => {
    const s = mergeDefaults(DEFAULT_SAVE, JSON.stringify({ found: ['rex'], digs: 'tanti', extra: 1 }));
    expect(s.found).toEqual(['rex']);
    expect(s.digs).toBe(0);
    expect(s.tutorialDig).toBe(false);
    expect('extra' in s).toBe(false);
  });
});

describe('dinosauri: scavo', () => {
  it('le ossa stanno in celle diverse dentro la buca, più un tesoro se c\'è posto', () => {
    for (let n = 4; n <= 6; n++) {
      for (let k = 0; k < 20; k++) {
        const { bones, treasure } = layoutDig(n, Math.random);
        expect(bones.length).toBe(n);
        expect(new Set(bones.map((b) => b.cell)).size).toBe(n);
        for (const b of [...bones, ...(treasure ? [treasure] : [])]) {
          expect(b.x - BONE_BOX.w / 2).toBeGreaterThanOrEqual(FLOOR.x - 40);
          expect(b.x + BONE_BOX.w / 2).toBeLessThanOrEqual(FLOOR.x + FLOOR.w + 40);
          expect(b.y).toBeGreaterThan(FLOOR.y);
          expect(b.y).toBeLessThan(FLOOR.y + FLOOR.h);
        }
        expect(treasure !== null).toBe(n < 6);
        if (treasure) expect(bones.map((b) => b.cell)).not.toContain(treasure.cell);
      }
    }
    expect(CELL.w).toBeGreaterThan(BONE_BOX.w);
  });
  it('un osso non è mai ingrandito per entrare nel suo spazio', () => {
    expect(fitScale(100, 50, BONE_BOX)).toBe(1);
    expect(fitScale(720, 100, BONE_BOX)).toBeCloseTo(0.5);
  });
  it('ScratchGrid: il pennello scopre le celle e misura le aree', () => {
    const g = new ScratchGrid(400, 200, 20);
    expect(g.fraction()).toBe(0);
    const fresh = g.stamp(100, 100, 40);
    expect(fresh).toBeGreaterThan(10);
    expect(g.stamp(100, 100, 40)).toBe(0);
    expect(g.fractionIn(80, 80, 40, 40)).toBe(1);
    expect(g.fractionIn(300, 0, 100, 100)).toBe(0);
    expect(g.isClear(100, 100)).toBe(true);
    expect(g.isClear(390, 190)).toBe(false);
    g.line(0, 20, 400, 20, 30);
    expect(g.fractionIn(0, 0, 400, 30)).toBeGreaterThan(0.95);
    g.clearRect(0, 0, 400, 200);
    expect(g.fraction()).toBe(1);
  });
  it('ScratchGrid: fuori dai bordi non si rompe', () => {
    const g = new ScratchGrid(100, 100, 20);
    expect(g.stamp(-500, -500, 30)).toBe(0);
    expect(g.stamp(0, 0, 30)).toBeGreaterThan(0);
    expect(ScratchGrid.along(0, 0, 100, 0, 10).length).toBe(10);
    expect(ScratchGrid.along(5, 5, 5, 5, 10).length).toBe(1);
  });
});

describe('dinosauri: montaggio', () => {
  it('uno scheletro sul palco: i posti delle ossa sono dentro lo schermo e sopra il vassoio', () => {
    for (const d of DINOS) for (const p of piecesOf(d.id)) {
      const s = stagePoint(p.cx, p.cy);
      expect(s.x).toBeGreaterThan(0);
      expect(s.x).toBeLessThan(1920);
      expect(s.y + (p.h / 2) * STAGE.scale).toBeLessThan(TRAY_Y);
      expect(s.y - (p.h / 2) * STAGE.scale).toBeGreaterThan(0);
    }
    expect(stagePoint(FRAME.w / 2, FRAME.h / 2)).toEqual({ x: STAGE.x, y: STAGE.y });
  });
  it('lasciato sullo scheletro va al suo posto; lontano torna nel vassoio', () => {
    const slot = stagePoint(100, 100);
    expect(dropsOnSkeleton(STAGE.x, STAGE.y, slot)).toBe(true);
    expect(dropsOnSkeleton(slot.x + 100, slot.y, slot)).toBe(true);
    expect(dropsOnSkeleton(100, 1050, slot)).toBe(false);
    expect(dropsOnSkeleton(1900, 100, slot)).toBe(false);
  });
  it('vassoio: posti in fila, distanti e dentro lo schermo', () => {
    for (let n = 4; n <= 6; n++) {
      const xs = Array.from({ length: n }, (_, i) => trayX(i, n));
      for (let i = 1; i < n; i++) expect(xs[i] - xs[i - 1]).toBeGreaterThanOrEqual(TRAY_BOX.w);
      expect(xs[0]).toBeGreaterThan(250);
      expect(xs[n - 1]).toBeLessThan(1670);
    }
  });
});

describe('dinosauri: audio (core/sound)', () => {
  it('pacchetto "dinosauri": musica ogg+mp3 con loop di 64 s e un file per ogni effetto', () => {
    registerDinosauriSound();
    const pack = (sound as unknown as { packs: Map<string, { music?: { ogg: string; mp3: string; loop: number }; sfx: Record<string, string> }> }).packs.get(PACK)!;
    expect(pack.music?.ogg).toMatch(/theme.*\.ogg/);
    expect(pack.music?.mp3).toMatch(/theme.*\.mp3/);
    expect(pack.music?.loop).toBe(THEME_LOOP);
    expect(THEME_LOOP).toBeGreaterThanOrEqual(30);
    expect(THEME_LOOP).toBeLessThanOrEqual(80);
    expect(Object.keys(SFX_URLS).sort()).toEqual([...SFX_NAMES].sort());
    for (const d of DINOS) expect(SFX_URLS[`roar_${d.roar}`]).toBeTruthy();
    expect(typeof sfx.roar).toBe('function');
  });
});

describe('dinosauri: traduzioni', () => {
  const keys = Object.keys(LOCALES.it).sort();
  for (const [l, d] of Object.entries(LOCALES)) {
    it(`${l}: stesse chiavi, tutte prefissate "dinosauri.", un nome per ogni dinosauro`, () => {
      expect(Object.keys(d).sort()).toEqual(keys);
      for (const [k, v] of Object.entries(d)) {
        expect(k.startsWith('dinosauri.')).toBe(true);
        expect(String(v).trim().length).toBeGreaterThan(0);
      }
      expect(String(d['dinosauri.count'])).toContain('{n}');
      expect(String(d['dinosauri.count'])).toContain('{tot}');
      for (const x of DINOS) expect(d[`dinosauri.dino.${x.id}`]).toBeTruthy();
    });
  }
});
