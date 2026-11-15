import { describe, expect, it } from 'vitest';
import {
  FLOWERS, FLOWER_IDS, FAIRIES, FAIRY_IDS, FAIRY_AT, BEDS, PLOTS_PER_BED, TOTAL_PLOTS, PLOT_POS, NEW_FLOWER_AT, PLOTS_LEFT_TO_RIGHT, CLOUD_MIN_X, CLOUD_MAX_X,
  emptyGarden, sanitizeGarden, plantedCount, bloomCount, bedFull, gardenFull, bedsOpen, currentBed, discoveredFlowers,
  flowerFor, plant, water, thirstyNear, emptyPlot, plotAt, fairiesFor, fairyArriving, noteRate, type Garden, type FlowerId,
} from './logic';
import { gameTextures } from './art';
import { giardinoTile } from './tile';
import entry from './entry';
import { mergeDefaults } from '../../core/storage';
import { LOCALES } from './locales';
import { DEFAULT_SAVE } from './save';
import { sound } from '../../core/sound';
import { PACK, THEME_LOOP, SFX_URLS, SFX_NAMES, registerGiardinoSound, sfx } from './sfx';

/** Generatore con seme per i test (sequenze ripetibili). */
function seeded(seed: number): () => number {
  let s = seed >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}

/** Riempie (pianta e innaffia fino al fiore) i vasi indicati di un'aiuola. */
function grow(g: Garden, b: number, plots: number[], rnd = seeded(1)): Garden {
  let last: FlowerId | '' = '';
  for (const p of plots) {
    const r: { garden: Garden; flower: FlowerId } | null = plant(g, b, p, last, rnd);
    if (!r) throw new Error('semina rifiutata');
    g = r.garden; last = r.flower;
    for (let k = 0; k < 3; k++) g = water(g, b, p)!.garden;
  }
  return g;
}
const ALL = [...Array(PLOTS_PER_BED).keys()];

describe('giardino: voce di menu', () => {
  it('gioco 8, non gratis, colore e titoli dal brief', () => {
    expect(entry.id).toBe('giardino');
    expect(entry.order).toBe(8);
    expect(entry.free).toBe(false);
    expect(entry.color).toBe('#5fbf6a');
    for (const l of ['it', 'en', 'es', 'fr', 'de', 'pt'] as const) {
      expect(entry.titles[l].length).toBeGreaterThan(3);
      expect(LOCALES[l]['giardino.title']).toBe(entry.titles[l]);
    }
    const tile = giardinoTile();
    expect(tile.key).toBe('tile_giardino');
    expect(tile.svg).not.toContain('NaN');
    expect(tile.svg).not.toContain('undefined');
  });
});

describe('giardino: grafica', () => {
  it('texture con chiavi uniche, prefisso "gi_" e SVG validi', () => {
    const list = gameTextures();
    expect(new Set(list.map((t) => t.key)).size).toBe(list.length);
    for (const t of list) {
      expect(t.key.startsWith('gi_')).toBe(true);
      expect(t.svg.startsWith('<svg')).toBe(true);
      expect(t.svg).not.toContain('NaN');
      expect(t.svg).not.toContain('undefined');
      expect(t.w * t.h).toBeLessThanOrEqual(2400 * 400);
    }
  });
  it('ogni fiore ha bocciolo, fiore e farfalla; ogni fatina il suo disegno', () => {
    const keys = new Set(gameTextures().map((t) => t.key));
    for (const f of FLOWERS) for (const k of [`gi_bud_${f.id}`, `gi_fl_${f.id}`, `gi_bf_${f.id}`]) expect(keys.has(k), k).toBe(true);
    for (const f of FAIRIES) expect(keys.has(`gi_fairy_${f.id}`)).toBe(true);
    for (const k of ['gi_soil', 'gi_soil_wet', 'gi_seed', 'gi_sprout', 'gi_cloud', 'gi_cloud_rain', 'gi_drop', 'gi_bubble', 'gi_wing',
      'gi_tree', 'gi_bush', 'gi_pond', 'gi_mushroom', 'gi_rainbow', 'gi_hills_far', 'gi_hills_near', 'gi_fg_grass', 'gi_card', 'gi_slot', 'gi_btn_album']) {
      expect(keys.has(k), k).toBe(true);
    }
  });
});

describe('giardino: fiori e fatine', () => {
  it('8 fiori e 6 fatine diversi, colori validi', () => {
    expect(FLOWERS.length).toBe(8);
    expect(new Set(FLOWER_IDS).size).toBe(8);
    expect(new Set(FLOWERS.map((f) => f.glow)).size).toBe(8);
    for (const f of FLOWERS) for (const c of [...f.petal, ...f.heart, f.glow]) expect(c).toMatch(/^#[0-9a-f]{3}([0-9a-f]{3})?$/);
    expect(FAIRIES.length).toBe(6);
    expect(new Set(FAIRIES.map((f) => f.dress[1])).size).toBe(6);
    expect(new Set(FAIRIES.map((f) => f.style)).size).toBe(6);
  });
  it('ogni fiore canta una nota diversa della scala pentatonica', () => {
    const notes = FLOWERS.map((f) => f.note);
    expect(new Set(notes).size).toBe(8);
    for (const n of notes) expect([0, 2, 4, 7, 9].includes(n % 12)).toBe(true);
    expect(noteRate('daisy')).toBe(1);
    expect(noteRate('star')).toBeCloseTo(2);
  });
  it('le fatine arrivano in ordine con i fiori, l\'ultima a giardino completo', () => {
    expect(FAIRY_AT.length).toBe(FAIRY_IDS.length);
    expect(FAIRY_AT[FAIRY_AT.length - 1]).toBe(TOTAL_PLOTS);
    expect(fairiesFor(0)).toBe(0);
    expect(fairiesFor(1)).toBe(1);
    expect(fairyArriving(1)).toBe('dew');
    expect(fairyArriving(2)).toBeNull();
    expect(fairiesFor(TOTAL_PLOTS)).toBe(6);
    expect([...FAIRY_AT].sort((a, b) => a - b)).toEqual(FAIRY_AT);
  });
});

describe('giardino: semi e fiori', () => {
  it('ai semi di NEW_FLOWER_AT si scopre un fiore nuovo, negli altri uno già conosciuto e diverso dall\'ultimo', () => {
    expect(NEW_FLOWER_AT.length).toBe(FLOWER_IDS.length);
    NEW_FLOWER_AT.forEach((n, k) => expect(flowerFor(n)).toBe(FLOWER_IDS[k]));
    const rnd = seeded(7);
    for (let n = 0; n < TOTAL_PLOTS; n++) {
      if (NEW_FLOWER_AT.includes(n)) continue;
      const known = NEW_FLOWER_AT.filter((m) => m < n).length;
      const prev = FLOWER_IDS[(n * 3) % known];
      const f = flowerFor(n, prev, rnd);
      expect(FLOWER_IDS.indexOf(f)).toBeLessThan(known);
      expect(f).not.toBe(prev);
    }
  });
  it('si pianta solo nella terra vuota, poi tre piogge fanno il fiore', () => {
    let g = emptyGarden();
    const r = plant(g, 0, 4)!;
    expect(r.flower).toBe('daisy');
    g = r.garden;
    expect(g[0][4]).toEqual({ f: 'daisy', s: 1 });
    expect(plant(g, 0, 4)).toBeNull();
    const w1 = water(g, 0, 4)!; expect(w1.stage).toBe(2); expect(w1.bloomed).toBe(false);
    const w2 = water(w1.garden, 0, 4)!; expect(w2.stage).toBe(3);
    const w3 = water(w2.garden, 0, 4)!; expect(w3.stage).toBe(4); expect(w3.bloomed).toBe(true);
    expect(water(w3.garden, 0, 4)).toBeNull();
    expect(water(emptyGarden(), 0, 0)).toBeNull();
    // il giardino di partenza non cambia (niente modifiche nascoste)
    expect(emptyGarden()[0][4].s).toBe(0);
    expect(bloomCount(w3.garden)).toBe(1);
    expect(discoveredFlowers(w3.garden)).toEqual(['daisy']);
  });
  it('la nuvola va sulla piantina assetata più vicina', () => {
    let g = emptyGarden();
    g = plant(g, 0, 3)!.garden;   // x 440
    g = plant(g, 0, 6)!.garden;   // x 1480
    expect(thirstyNear(g, 0, 400)).toBe(3);
    expect(thirstyNear(g, 0, 1500)).toBe(6);
    expect(thirstyNear(emptyGarden(), 0, 960)).toBe(-1);
  });
  it('la manina indica prima la terra davanti al centro', () => {
    expect(emptyPlot(emptyGarden(), 0)).toBe(4);
    expect(emptyPlot(grow(emptyGarden(), 0, ALL), 0)).toBe(-1);
  });
});

describe('giardino: aiuole e collezione', () => {
  it('3 aiuole da 7: la seguente si apre quando la precedente è piena', () => {
    expect(BEDS * PLOTS_PER_BED).toBe(TOTAL_PLOTS);
    let g = emptyGarden();
    expect(bedsOpen(g)).toBe(1);
    expect(plant(g, 1, 0)).toBeNull();
    g = grow(g, 0, ALL);
    expect(bedFull(g, 0)).toBe(true);
    expect(bedsOpen(g)).toBe(2);
    expect(currentBed(g)).toBe(1);
    g = grow(g, 1, ALL);
    g = grow(g, 2, ALL);
    expect(gardenFull(g)).toBe(true);
    expect(currentBed(g)).toBe(0);
    expect(bloomCount(g)).toBe(TOTAL_PLOTS);
    expect(plantedCount(g)).toBe(TOTAL_PLOTS);
    expect(discoveredFlowers(g)).toEqual([...FLOWER_IDS]);
    expect(fairiesFor(bloomCount(g))).toBe(6);
  });
  it('salvataggi rovinati o vecchi tornano a un giardino valido', () => {
    expect(sanitizeGarden(null)).toEqual(emptyGarden());
    expect(sanitizeGarden('x')).toEqual(emptyGarden());
    const bad = [[{ f: 'daisy', s: 4 }, { f: 'cactus', s: 2 }, { f: 'rose', s: 9 }, null, { f: 'moon', s: 2.5 }], 'x'];
    const g = sanitizeGarden(bad);
    expect(g.length).toBe(BEDS);
    expect(g.every((b) => b.length === PLOTS_PER_BED)).toBe(true);
    expect(g[0][0]).toEqual({ f: 'daisy', s: 4 });
    expect(g[0][1]).toEqual({ f: '', s: 0 });
    expect(g[0][2]).toEqual({ f: '', s: 0 });
    expect(g[0][4]).toEqual({ f: '', s: 0 });
    const merged = mergeDefaults(DEFAULT_SAVE, JSON.stringify({ garden: bad, tutorialDone: true, extra: 1 }));
    expect(merged.tutorialDone).toBe(true);
    expect(sanitizeGarden(merged.garden)[0][0].f).toBe('daisy');
    expect(mergeDefaults(DEFAULT_SAVE, '{rotto').garden).toEqual(emptyGarden());
  });
});

describe('giardino: tocchi e disposizione', () => {
  it('massimo 3 righe di bersagli: i vasi stanno su 2 file, ben distanziati', () => {
    expect(new Set(PLOT_POS.map((p) => p.y)).size).toBeLessThanOrEqual(3);
    expect(PLOT_POS.length).toBe(PLOTS_PER_BED);
    for (const p of PLOT_POS) {
      expect(p.x).toBeGreaterThan(300);
      expect(p.x).toBeLessThan(1620);
      expect(p.y).toBeLessThan(1000);
    }
    for (let i = 0; i < PLOT_POS.length; i++) for (let j = i + 1; j < PLOT_POS.length; j++) {
      expect(Math.hypot(PLOT_POS[i].x - PLOT_POS[j].x, PLOT_POS[i].y - PLOT_POS[j].y)).toBeGreaterThan(250);
    }
    expect(PLOTS_LEFT_TO_RIGHT.map((i) => PLOT_POS[i].x)).toEqual([...PLOT_POS.map((p) => p.x)].sort((a, b) => a - b));
    expect(CLOUD_MIN_X).toBeLessThanOrEqual(Math.min(...PLOT_POS.map((p) => p.x)));
    expect(CLOUD_MAX_X).toBeGreaterThanOrEqual(Math.max(...PLOT_POS.map((p) => p.x)));
  });
  it('un tocco sulla terra o sul fiore trova il vaso giusto, lontano non trova niente', () => {
    const g0 = emptyGarden();
    PLOT_POS.forEach((p, i) => {
      expect(plotAt(g0, 0, p.x, p.y - 30)).toBe(i);
      expect(plotAt(g0, 0, p.x + 90 * p.s, p.y)).toBe(i);
    });
    expect(plotAt(g0, 0, 960, 120)).toBe(-1);
    // il fiore sbocciato si tocca anche sulla corolla
    const g = grow(emptyGarden(), 0, [4]);
    expect(plotAt(g, 0, 800, 900 - 330)).toBe(4);
    expect(plotAt(g0, 0, 800, 900 - 330)).not.toBe(4);
  });
});

describe('giardino: testi e audio', () => {
  it('stesse chiavi in tutte le lingue, prefisso "giardino.", nomi di fiori e fatine', () => {
    const keys = Object.keys(LOCALES.it).sort();
    for (const id of FLOWER_IDS) expect(keys).toContain(`giardino.flower.${id}`);
    for (const id of FAIRY_IDS) expect(keys).toContain(`giardino.fairy.${id}`);
    for (const l of ['en', 'es', 'fr', 'de', 'pt'] as const) {
      expect(Object.keys(LOCALES[l]).sort()).toEqual(keys);
      for (const k of keys) expect(String(LOCALES[l][k]).length).toBeGreaterThan(1);
    }
    for (const k of keys) expect(k.startsWith('giardino.')).toBe(true);
    for (const l of ['it', 'en', 'es', 'fr', 'de', 'pt'] as const) {
      expect(LOCALES[l]['giardino.count']).toContain('{n}');
      expect(LOCALES[l]['giardino.count']).toContain('{tot}');
    }
  });
  it('un file per ogni effetto, loop della musica nei 30–80 s', () => {
    expect(Object.keys(SFX_URLS).sort()).toEqual([...SFX_NAMES].sort());
    expect(THEME_LOOP).toBeGreaterThanOrEqual(30);
    expect(THEME_LOOP).toBeLessThanOrEqual(80);
    expect(PACK).toBe('giardino');
    registerGiardinoSound();
    expect(() => { sfx.plant(); sfx.sing('rainbow'); sfx.grow(3); sound.play(PACK, 'pop'); }).not.toThrow();
  });
});
