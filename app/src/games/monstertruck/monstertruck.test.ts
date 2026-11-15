import { describe, expect, it } from 'vitest';
import {
  COLORS, WHEELS, STICKERS, TRACKS, TRACK_IDS, START, UNLOCKS, TOTAL, REPAIRS,
  unlocked, prizeOf, ownedCount, usable, nextTrack, sanitizeTracks, repairsFor, isRepairId,
} from './parts';
import {
  buildCourse, courseLength, stepTruck, simulate, starValue, comboRate, rng, flightPath,
  GROUND, PHYS, REACH_Y, type Course, type TruckState,
} from './track';
import { gameTextures, TF, WHEEL_PX } from './art';
import { monstertruckTile } from './tile';
import entry from './entry';
import { mergeDefaults } from '../../core/storage';
import { LOCALES } from './locales';
import { DEFAULT_SAVE } from './save';
import { sound } from '../../core/sound';
import { PACK, THEME_LOOP, SFX_URLS, SFX_NAMES, registerTruckSound, sfx } from './sfx';

const LANGS = ['it', 'en', 'es', 'fr', 'de', 'pt'] as const;

describe('monstertruck: voce di menu', () => {
  it('gioco 7, a pagamento, colore e titoli dal brief', () => {
    expect(entry.id).toBe('monstertruck');
    expect(entry.order).toBe(7);
    expect(entry.free).toBe(false);
    expect(entry.color).toBe('#f2a01e');
    for (const l of LANGS) {
      expect(entry.titles[l].length).toBeGreaterThan(3);
      expect(LOCALES[l]['monstertruck.title']).toBe(entry.titles[l]);
    }
    const tile = monstertruckTile();
    expect(tile.key).toBe('tile_monstertruck');
    expect([tile.w, tile.h]).toEqual([360, 280]);
    expect(tile.svg).not.toContain('NaN');
  });
});

describe('monstertruck: pezzi e piste', () => {
  it('cataloghi con id unici e colori validi', () => {
    expect(new Set(COLORS.map((c) => c.id)).size).toBe(COLORS.length);
    expect(new Set(COLORS.map((c) => c.hex)).size).toBe(COLORS.length);
    expect(new Set(WHEELS.map((w) => w.id)).size).toBe(WHEELS.length);
    expect(new Set(STICKERS).size).toBe(STICKERS.length);
    expect(TRACKS.length).toBe(5);
    for (const t of TRACKS) for (const c of [...t.sky, ...t.ground, t.edge]) expect(c).toMatch(/^#[0-9a-f]{6}$/);
  });
  it('ogni pezzo e ogni pista si sblocca una volta sola, e alla fine c\'è tutto', () => {
    const all = unlocked(UNLOCKS.length);
    expect(all.color.sort()).toEqual(COLORS.map((c) => c.id).sort());
    expect(all.wheel.sort()).toEqual(WHEELS.map((w) => w.id).sort());
    expect(all.sticker.sort()).toEqual([...STICKERS].sort());
    expect(all.track.sort()).toEqual([...TRACK_IDS].sort());
    const keys = UNLOCKS.map((u) => `${u.kind}:${u.id}`);
    expect(new Set(keys).size).toBe(keys.length);
    for (const u of UNLOCKS) expect(START[u.kind]).not.toContain(u.id);
    expect(ownedCount(0)).toBe(TOTAL - UNLOCKS.length);
    expect(ownedCount(999)).toBe(TOTAL);
  });
  it('un premio per gara, nell\'ordine, poi più niente', () => {
    expect(prizeOf(0, 1)).toEqual(UNLOCKS[0]);
    expect(prizeOf(1, 2)?.kind).toBe('track');
    expect(prizeOf(UNLOCKS.length, UNLOCKS.length + 1)).toBe(null);
    expect(prizeOf(3, 3)).toBe(null);
    // le piste arrivano presto: la seconda alla seconda gara, tutte entro 13 gare
    expect(UNLOCKS.findIndex((u) => u.kind === 'track')).toBe(1);
    expect(UNLOCKS.filter((u, i) => u.kind === 'track' && i < 13).length).toBe(4);
  });
  it('pezzi salvati validi solo se sbloccati', () => {
    expect(usable('color', 'oro', 0)).toBe('arancio');
    expect(usable('color', 'oro', 100)).toBe('oro');
    expect(usable('wheel', 'razzo', 5)).toBe('classica');
    expect(usable('sticker', undefined, 5)).toBe('nessuno');
    expect(usable('track', 'dune', 2)).toBe('dune');
    expect(usable('track', 'dune', 1)).toBe('arena');
  });
  it('prossima pista: prima quelle nuove, poi quella scelta', () => {
    expect(nextTrack(0, [], 'arena')).toBe('arena');
    expect(nextTrack(2, ['arena'], 'arena')).toBe('dune');
    expect(nextTrack(2, ['arena', 'dune'], 'arena')).toBe('arena');
    expect(nextTrack(5, ['arena', 'dune', 'cantiere'], 'notte')).not.toBe('notte');
    expect(sanitizeTracks(['arena', 'luna', 3, 'arena', null, 'dune'])).toEqual(['arena', 'dune']);
    expect(sanitizeTracks('arena')).toEqual([]);
  });
  it('tre guasti diversi per visita; la prima volta sempre gli stessi', () => {
    expect(repairsFor(0)).toEqual(['gomma', 'fango', 'motore']);
    for (let v = 1; v < 40; v++) {
      const r = repairsFor(v, rng(v));
      expect(r.length).toBe(3);
      expect(new Set(r).size).toBe(3);
      for (const id of r) expect(isRepairId(id)).toBe(true);
    }
    expect(isRepairId('volante')).toBe(false);
    expect(REPAIRS.length).toBe(4);
  });
});

describe('monstertruck: pista', () => {
  const courses: Course[] = [];
  for (const tr of TRACK_IDS) for (let level = 0; level < 10; level += 3) for (let seed = 1; seed <= 6; seed++) courses.push(buildCourse(tr, level, seed * 131 + level));

  it('stesso seme, stessa pista', () => {
    const a = buildCourse('dune', 3, 42), b = buildCourse('dune', 3, 42);
    expect(a.items).toEqual(b.items);
    expect(Array.from(a.ground.h)).toEqual(Array.from(b.ground.h));
    expect(buildCourse('dune', 3, 43).items).not.toEqual(a.items);
  });
  it('trampolini, scatoloni e tante stelle; terreno dentro lo schermo', () => {
    for (const c of courses) {
      expect(c.lips.length).toBeGreaterThanOrEqual(3);
      expect(c.items.filter((i) => i.kind === 'box').length).toBeGreaterThanOrEqual(2);
      expect(c.items.filter((i) => i.kind === 'big').length).toBe(1);
      expect(starValue(c.items)).toBeGreaterThanOrEqual(50);
      for (let i = 1; i < c.items.length; i++) expect(c.items[i].x).toBeGreaterThanOrEqual(c.items[i - 1].x);
      for (let x = -500; x < c.len + 2000; x += 40) {
        const y = c.ground.at(x);
        expect(y).toBeLessThanOrEqual(GROUND);
        expect(y).toBeGreaterThan(GROUND - 260);
      }
      // partenza in piano e rettilineo finale con il traguardo
      for (let x = -300; x < 1200; x += 50) expect(c.ground.at(x)).toBe(GROUND);
      for (let x = c.len - 900; x < c.len + 2000; x += 50) expect(c.ground.at(x)).toBe(GROUND);
      // stelle al massimo su 3 righe di altezza (a terra, salto basso, salto alto) e sempre sullo schermo
      for (const it of c.items) if (it.kind !== 'box') { expect(it.y).toBeGreaterThan(200); expect(it.y).toBeLessThan(GROUND); }
    }
  });
  it('tenendo sempre premuto si prendono tutte le stelle, in 30–45 secondi', () => {
    for (const c of courses) {
      const r = simulate(c, () => true);
      expect(r.finished).toBe(true);
      expect(r.stars).toBe(starValue(c.items));
      expect(r.t).toBeGreaterThan(28);
      expect(r.t).toBeLessThan(45);
      // il truck non esce mai dall'alto dello schermo e non sprofonda nel terreno
      expect(r.minY - REACH_Y).toBeGreaterThan(260);
      expect(r.maxBelow).toBeLessThan(2);
      expect(r.boxes).toBe(c.items.filter((i) => i.kind === 'box').length);
    }
  });
  it('anche premendo a intermittenza si arriva e si prendono le stelle a terra', () => {
    for (const c of courses.slice(0, 12)) {
      const r = simulate(c, (t) => t % 2.4 < 1.4);
      expect(r.finished).toBe(true);
      expect(r.stars).toBeGreaterThan(starValue(c.items) * 0.6);
      expect(r.t).toBeLessThan(80);
    }
  });
  it('viaggi un po\' più lunghi con l\'esperienza', () => {
    expect(courseLength(8)).toBeGreaterThan(courseLength(0));
    expect(courseLength(30)).toBe(courseLength(8));
  });
});

describe('monstertruck: guida', () => {
  const flat = buildCourse('arena', 0, 1);
  it('tieni premuto e accelera, lascia e si ferma dolcemente', () => {
    const s: TruckState = { x: 0, y: GROUND, vx: 0, vy: 0, air: false, airTime: 0 };
    for (let i = 0; i < 30; i++) stepTruck(s, flat.ground, true, 1 / 60);
    expect(s.vx).toBeGreaterThan(200);
    expect(s.air).toBe(false);
    for (let i = 0; i < 120; i++) stepTruck(s, flat.ground, true, 1 / 60);
    expect(s.vx).toBe(PHYS.vmax);
    const x0 = s.x;
    for (let i = 0; i < 30; i++) stepTruck(s, flat.ground, false, 1 / 60);
    expect(s.vx).toBeGreaterThan(0);
    for (let i = 0; i < 200; i++) stepTruck(s, flat.ground, false, 1 / 60);
    expect(s.vx).toBe(0);
    expect(s.x).toBeGreaterThan(x0);
  });
  it('dal trampolino si salta e si atterra rimbalzando, sempre sulle ruote', () => {
    const c = buildCourse('canyon', 2, 9);
    const path = flightPath(c.ground, c.lips[0]);
    expect(path.length).toBeGreaterThan(30);
    const top = Math.min(...path.map((p) => p.y));
    expect(c.ground.at(c.lips[0]) - top).toBeGreaterThan(60);
    const s: TruckState = { x: c.lips[0] - 200, y: c.ground.at(c.lips[0] - 200), vx: PHYS.vmax, vy: 0, air: false, airTime: 0 };
    let took = false, bounced = false;
    for (let i = 0; i < 400 && !(took && !s.air); i++) {
      const r = stepTruck(s, c.ground, true, 1 / 60);
      took ||= !!r.takeoff;
      bounced ||= !!r.bounced;
      expect(s.y).toBeLessThanOrEqual(c.ground.at(s.x) + 0.01);
    }
    expect(took).toBe(true);
    expect(bounced).toBe(true);
    expect(s.air).toBe(false);
  });
  it('movimento morbido anche con fotogrammi lenti', () => {
    const s: TruckState = { x: 0, y: GROUND, vx: 0, vy: 0, air: false, airTime: 0 };
    stepTruck(s, flat.ground, true, 0.05);
    expect(s.vx).toBeLessThan(60);
  });
  it('le stelle prese di fila salgono sulla scala', () => {
    expect(comboRate(0)).toBe(1);
    for (let k = 1; k < 15; k++) expect(comboRate(k)).toBeGreaterThanOrEqual(comboRate(k - 1));
    expect(comboRate(99)).toBe(4);
  });
});

describe('monstertruck: grafica', () => {
  it('texture con chiavi uniche, SVG validi e misure contenute', () => {
    const list = gameTextures();
    expect(new Set(list.map((t) => t.key)).size).toBe(list.length);
    for (const t of list) {
      expect(t.key.startsWith('mt_')).toBe(true);
      expect(t.svg.startsWith('<svg')).toBe(true);
      expect(t.svg).not.toContain('NaN');
      expect(t.svg).not.toContain('undefined');
      expect(t.w * t.h).toBeLessThanOrEqual(1100 * 720);
    }
  });
  it('ogni pezzo, pista e guasto ha le sue texture', () => {
    const keys = new Set(gameTextures().map((t) => t.key));
    for (const w of WHEELS) expect(keys.has(`mt_wheel_${w.id}`)).toBe(true);
    for (const s of STICKERS) expect(keys.has(`mt_stk_${s}`)).toBe(true);
    for (const t of TRACK_IDS) for (const k of ['sky', 'far', 'card']) expect(keys.has(`mt_${k}_${t}`)).toBe(true);
    for (const r of REPAIRS) expect(keys.has(`mt_need_${r}`)).toBe(true);
    for (const k of ['mt_body', 'mt_body_hi', 'mt_chassis', 'mt_stands', 'mt_stands_cheer', 'mt_fence', 'mt_box', 'mt_finish', 'mt_btn_go', 'mt_btn_tracks', 'mt_cat_color', 'mt_cat_wheel', 'mt_cat_sticker']) {
      expect(keys.has(k)).toBe(true);
    }
  });
  it('ruote dentro la loro texture, assi sotto la carrozzeria', () => {
    expect(TF.R * 2 + 8).toBeLessThanOrEqual(WHEEL_PX);
    expect(TF.axleY).toBeGreaterThan(TF.cy);
    expect(TF.frontX - TF.cx).toBe(TF.cx - TF.rearX);
  });
});

describe('monstertruck: testi e salvataggi', () => {
  it('stesse chiavi in tutte le lingue, nomi di tutte le piste', () => {
    const keys = Object.keys(LOCALES.it).sort();
    for (const l of LANGS) {
      expect(Object.keys(LOCALES[l]).sort()).toEqual(keys);
      for (const k of keys) {
        expect(k.startsWith('monstertruck.')).toBe(true);
        expect(String(LOCALES[l][k]).length).toBeGreaterThan(1);
      }
      for (const id of TRACK_IDS) expect(LOCALES[l][`monstertruck.track.${id}`]).toBeTruthy();
      expect(LOCALES[l]['monstertruck.count']).toContain('{n}');
      expect(LOCALES[l]['monstertruck.count']).toContain('{tot}');
    }
  });
  it('salvataggi rovinati tornano ai valori di partenza', () => {
    expect(mergeDefaults(DEFAULT_SAVE, null)).toEqual(DEFAULT_SAVE);
    expect(mergeDefaults(DEFAULT_SAVE, '{rotto')).toEqual(DEFAULT_SAVE);
    const m = mergeDefaults(DEFAULT_SAVE, JSON.stringify({ races: '3', raced: 'arena', stars: 40, color: 'blu' }));
    expect(m.races).toBe(0);
    expect(m.raced).toEqual([]);
    expect(m.stars).toBe(40);
    expect(m.color).toBe('blu');
  });
});

describe('monstertruck: audio', () => {
  it('musica in loop e un file per ogni effetto', () => {
    expect(THEME_LOOP).toBeGreaterThanOrEqual(30);
    expect(THEME_LOOP).toBeLessThanOrEqual(80);
    for (const n of SFX_NAMES) expect(SFX_URLS[n], n).toBeTruthy();
    expect(Object.keys(SFX_URLS).sort()).toEqual([...SFX_NAMES].sort());
    registerTruckSound();
    expect(PACK).toBe('monstertruck');
    // senza AudioContext (test) gli effetti non devono mai lanciare errori
    expect(() => { sfx.star(3); sfx.boing(); sfx.cheer(); sfx.horn(); sfx.fanfare(); }).not.toThrow();
    expect(sound.music).toBe(null);
  });
});
