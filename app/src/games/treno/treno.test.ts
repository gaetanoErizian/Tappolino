import { describe, expect, it } from 'vitest';
import {
  STATIONS, STATION_IDS, ANIMAL_IDS, COLOR_IDS, SHAPE_IDS, COLORS, RAIL_Y, WAIT_Y, LOCO_W, COUPLER,
  reached, complete, addDelivered, sanitizeDelivered, destFor, pickAnimals, planFor, makeTrip, accepts, wagonFor, allAboard,
  trainLayout, wagonW, seatX, waitX, wagonAt, stationOf, isAnimalId, isStationId, shuffle, type Trip,
} from './logic';
import { gameTextures } from './art';
import { animalTextures } from './animals';
import { trenoTile } from './tile';
import entry from './entry';
import { mergeDefaults } from '../../core/storage';
import { LOCALES } from './locales';
import { DEFAULT_SAVE } from './save';
import { sound } from '../../core/sound';
import { PACK, THEME_LOOP, SFX_URLS, SFX_NAMES, registerTrenoSound, sfx } from './sfx';

/** Generatore con seme per i test (sequenze ripetibili). */
function seeded(seed: number): () => number {
  let s = seed >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}
const LANGS = ['it', 'en', 'es', 'fr', 'de', 'pt'] as const;

/** Gioca un viaggio intero "a tocchi" (ogni animale nel primo vagone che lo accetta). */
function playTrip(trip: Trip): number[] {
  const seated = trip.wagons.map(() => 0);
  for (const p of trip.passengers) {
    const i = wagonFor(trip, seated, p);
    expect(i, `nessun vagone per ${p.animal}`).toBeGreaterThanOrEqual(0);
    seated[i]++;
  }
  return seated;
}

describe('treno: voce di menu', () => {
  it('gioco 9, non gratis, colore e titoli dal brief', () => {
    expect(entry.id).toBe('treno');
    expect(entry.order).toBe(9);
    expect(entry.free).toBe(false);
    expect(entry.color).toBe('#e2574c');
    for (const l of LANGS) {
      expect(entry.titles[l].length).toBeGreaterThan(3);
      expect(LOCALES[l]['treno.title']).toBe(entry.titles[l]);
    }
    const tile = trenoTile();
    expect(tile.key).toBe('tile_treno');
    expect(tile.w).toBe(360);
    expect(tile.h).toBe(280);
    expect(tile.svg).not.toContain('NaN');
    expect(tile.svg).not.toContain('undefined');
  });
});

describe('treno: grafica', () => {
  it('texture con chiavi uniche, prefisso "tr_" e SVG validi', () => {
    const list = gameTextures();
    expect(new Set(list.map((t) => t.key)).size).toBe(list.length);
    for (const t of list) {
      expect(t.key.startsWith('tr_')).toBe(true);
      expect(t.svg.startsWith('<svg')).toBe(true);
      expect(t.svg, t.key).not.toContain('NaN');
      expect(t.svg, t.key).not.toContain('undefined');
      // niente texture enormi (telefoni economici): i paesaggi lontani sono a metà risoluzione
      expect(t.w * t.h, t.key).toBeLessThanOrEqual(1200 * 600);
    }
  });
  it('ogni animale ha la faccia normale e quella felice; vagoni per 1–5 posti; forme, colori, stemmi', () => {
    const keys = new Set(gameTextures().map((t) => t.key));
    for (const a of ANIMAL_IDS) for (const k of [`tr_an_${a}`, `tr_an_${a}_happy`]) expect(keys.has(k), k).toBe(true);
    for (const c of [1, 2, 3, 4, 5]) for (const p of ['back', 'panel', 'trim']) expect(keys.has(`tr_wagon_${p}_${c}`)).toBe(true);
    for (const s of SHAPE_IDS) expect(keys.has(`tr_shape_${s}`)).toBe(true);
    for (const c of COLOR_IDS) expect(keys.has(`tr_dot_${c}`)).toBe(true);
    for (const s of STATION_IDS) for (const k of [`tr_emb_${s}`, `tr_far_${s}`]) expect(keys.has(k), k).toBe(true);
    for (const k of ['tr_loco', 'tr_wheel_big', 'tr_wheel', 'tr_wheel_wagon', 'tr_ticket', 'tr_ticket_top', 'tr_plate', 'tr_backrest', 'tr_rail', 'tr_station', 'tr_btn_album', 'tr_puff']) {
      expect(keys.has(k), k).toBe(true);
    }
  });
  it('faccia felice diversa da quella normale', () => {
    const list = animalTextures();
    for (const a of ANIMAL_IDS) {
      const n = list.find((t) => t.key === `tr_an_${a}`)!.svg.replace(/id="\w+"|url\(#\w+\)/g, '');
      const h = list.find((t) => t.key === `tr_an_${a}_happy`)!.svg.replace(/id="\w+"|url\(#\w+\)/g, '');
      expect(n, a).not.toBe(h);
    }
  });
});

describe('treno: stazioni e collezione', () => {
  it('3 stazioni dal brief (fattoria, giungla, polo) con 5 animali diversi ciascuna', () => {
    expect(STATION_IDS).toEqual(['fattoria', 'giungla', 'polo']);
    for (const s of STATIONS) expect(s.animals.length).toBe(5);
    expect(new Set(ANIMAL_IDS).size).toBe(15);
    expect(stationOf('penguin')).toBe('polo');
    expect(isAnimalId('cow')).toBe(true);
    expect(isAnimalId('dragon')).toBe(false);
    expect(isStationId('giungla')).toBe(true);
    expect(isStationId('luna')).toBe(false);
  });
  it('una stazione si raggiunge con il primo animale portato a casa, si completa con tutti e 5', () => {
    expect(reached([])).toEqual([]);
    expect(reached(['pig'])).toEqual(['fattoria']);
    expect(reached(['pig', 'seal'])).toEqual(['fattoria', 'polo']);
    expect(complete('fattoria', ['cow', 'pig', 'sheep', 'hen'])).toBe(false);
    expect(complete('fattoria', ['cow', 'pig', 'sheep', 'hen', 'horse'])).toBe(true);
  });
  it('collezione: niente doppioni, dati salvati ripuliti', () => {
    expect(addDelivered(['cow'], ['cow', 'pig', 'pig'])).toEqual(['cow', 'pig']);
    expect(sanitizeDelivered(['cow', 'dragon', 3, 'cow', 'seal'])).toEqual(['cow', 'seal']);
    expect(sanitizeDelivered('cow')).toEqual([]);
  });
  it('la linea si allunga in ordine: prima la fattoria, poi la giungla, poi il polo', () => {
    expect(destFor([], '')).toBe('fattoria');
    expect(destFor(['cow', 'pig', 'sheep', 'hen', 'horse'], 'fattoria')).toBe('giungla');
    const farmJungle = [...STATIONS[0].animals, ...STATIONS[1].animals];
    expect(destFor(farmJungle, 'giungla')).toBe('polo');
    // a collezione completa: a caso, mai la stessa due volte di fila
    const r = seeded(3);
    for (let i = 0; i < 60; i++) expect(destFor(ANIMAL_IDS, 'polo', r)).not.toBe('polo');
  });
  it('viaggiano prima gli animali mai portati a casa', () => {
    expect(pickAnimals('fattoria', 2, [])).toEqual(['cow', 'pig']);
    const list = pickAnimals('fattoria', 3, ['cow', 'pig', 'sheep'], seeded(2));
    expect(list.slice(0, 2)).toEqual(['hen', 'horse']);
    expect(new Set(list).size).toBe(3);
    expect(pickAnimals('polo', 9, []).length).toBe(5);
  });
});

describe('treno: viaggi (colori, forme, numeri fino a 5)', () => {
  it('i primi viaggi insegnano un\'idea alla volta, poi colori, forme e numeri a turno', () => {
    expect(planFor(0)).toEqual({ kind: 'color', groups: [1, 1] });
    expect(planFor(1)).toEqual({ kind: 'shape', groups: [1, 1] });
    expect(planFor(2)).toEqual({ kind: 'number', groups: [3] });
    expect(planFor(5).kind).toBe('number');
    const r = seeded(5);
    for (let t = 6; t < 60; t++) {
      const p = planFor(t, r);
      expect(p.kind).toBe(['color', 'shape', 'number'][(t - 6) % 3]);
      expect(p.groups.length).toBeLessThanOrEqual(3);
      expect(p.groups.reduce((a, b) => a + b, 0)).toBeLessThanOrEqual(5);
      expect(Math.min(...p.groups)).toBeGreaterThanOrEqual(1);
    }
  });
  it('ogni viaggio si può completare: ogni animale ha il suo vagone e alla fine sono tutti a bordo', () => {
    const r = seeded(11);
    let delivered: string[] = [];
    let last = '';
    for (let t = 0; t < 80; t++) {
      const trip = makeTrip({ trips: t, delivered, last }, r);
      expect(trip.passengers.length).toBe(trip.wagons.reduce((a, w) => a + w.cap, 0));
      expect(new Set(trip.passengers.map((p) => p.animal)).size).toBe(trip.passengers.length);
      for (const p of trip.passengers) expect(stationOf(p.animal)).toBe(trip.dest);
      const seated = playTrip(trip);
      expect(allAboard(trip, seated)).toBe(true);
      delivered = addDelivered(delivered, trip.passengers.map((p) => p.animal));
      last = trip.dest;
    }
    // dopo tanti viaggi la collezione è completa
    expect(delivered.length).toBe(15);
  });
  it('colori e forme: vagoni tutti diversi; il biglietto va solo nel vagone giusto', () => {
    const r = seeded(7);
    for (const kind of ['color', 'shape'] as const) {
      for (let k = 0; k < 20; k++) {
        const trip = makeTrip({ trips: 10, delivered: [], last: '' }, r, { kind, groups: [2, 2, 1] });
        const marks = trip.wagons.map((w) => (kind === 'color' ? w.color : w.shape));
        expect(new Set(marks).size).toBe(3);
        for (const p of trip.passengers) {
          const right = trip.wagons.findIndex((w) => (kind === 'color' ? w.color === p.color : w.shape === p.shape));
          trip.wagons.forEach((w, i) => expect(accepts(trip, w, p, 0)).toBe(i === right));
        }
      }
    }
  });
  it('numeri: ogni vagone prende tanti animali quanti ne dice il suo numero, non uno di più', () => {
    const trip = makeTrip({ trips: 2, delivered: [], last: '' }, seeded(1), { kind: 'number', groups: [2, 3] });
    expect(trip.wagons.map((w) => w.cap)).toEqual([2, 3]);
    const p = trip.passengers[0];
    expect(accepts(trip, trip.wagons[0], p, 1)).toBe(true);
    expect(accepts(trip, trip.wagons[0], p, 2)).toBe(false);
    expect(wagonFor(trip, [2, 0], p)).toBe(1);
    expect(wagonFor(trip, [2, 3], p)).toBe(-1);
  });
  it('mai più di 5 animali né più di 3 vagoni, anche con richieste esagerate', () => {
    const trip = makeTrip({ trips: 0, delivered: [], last: '' }, seeded(4), { kind: 'number', groups: [4, 4, 4, 4] });
    expect(trip.wagons.length).toBe(3);
    expect(trip.passengers.length).toBeLessThanOrEqual(5);
    expect(trip.wagons.reduce((a, w) => a + w.cap, 0)).toBe(trip.passengers.length);
  });
  it('sul marciapiede gli animali non sono in fila come i vagoni', () => {
    const r = seeded(9);
    for (let k = 0; k < 30; k++) {
      const trip = makeTrip({ trips: 3, delivered: [], last: '' }, r);
      const byWagon = trip.wagons.map((w) => w.color);
      expect(trip.passengers.map((p) => p.color)).not.toEqual(byWagon);
    }
  });
  it('shuffle mantiene gli elementi', () => {
    expect(shuffle([1, 2, 3, 4, 5], seeded(1)).sort()).toEqual([1, 2, 3, 4, 5]);
  });
});

describe('treno: posizioni sullo schermo (1920×1080)', () => {
  it('il treno più lungo sta nello schermo; vagoni attaccati alla locomotiva', () => {
    for (const caps of [[1, 1], [2, 2, 1], [5], [1, 4], [2, 3], [1, 1, 1]]) {
      const l = trainLayout(caps);
      expect(l.left).toBeGreaterThanOrEqual(60);
      expect(l.right).toBeLessThanOrEqual(1860);
      expect(l.right - l.loco).toBeCloseTo(LOCO_W / 2);
      expect(l.loco - LOCO_W / 2 - (l.wagons[0] + wagonW(caps[0]) / 2)).toBeCloseTo(COUPLER);
    }
  });
  it('posti nel vagone dentro la fiancata; animali in attesa distanziati per le dita piccole', () => {
    for (const c of [1, 2, 3, 4, 5]) {
      for (let k = 0; k < c; k++) expect(Math.abs(seatX(0, k, c))).toBeLessThan(wagonW(c) / 2 - 50);
    }
    for (const n of [2, 3, 4, 5]) {
      for (let i = 1; i < n; i++) expect(waitX(i, n) - waitX(i - 1, n)).toBeGreaterThanOrEqual(330);
      expect(waitX(0, n)).toBeGreaterThan(200);
      expect(waitX(n - 1, n)).toBeLessThan(1720);
    }
    expect(WAIT_Y).toBeGreaterThan(RAIL_Y + 250);
  });
  it('rilascio sopra un vagone: zona generosa, vale il vagone più vicino, fuori dal treno nessuno', () => {
    const caps = [2, 2, 1];
    const l = trainLayout(caps);
    expect(wagonAt(l.wagons[0], RAIL_Y - 100, l.wagons, caps)).toBe(0);
    expect(wagonAt(l.wagons[1], RAIL_Y - 380, l.wagons, caps)).toBe(1);
    expect(wagonAt(l.wagons[2] + wagonW(1) / 2 + 20, RAIL_Y - 50, l.wagons, caps)).toBe(2);
    expect(wagonAt(l.wagons[0], WAIT_Y, l.wagons, caps)).toBe(-1);
    expect(wagonAt(l.loco, RAIL_Y - 100, l.wagons, caps)).toBe(-1);
  });
  it('i colori sono quelli giusti e ben distinti', () => {
    expect(Object.keys(COLORS)).toEqual([...COLOR_IDS]);
    expect(new Set(Object.values(COLORS)).size).toBe(5);
  });
});

describe('treno: testi', () => {
  it('stesse chiavi in tutte le 6 lingue, prefisso "treno.", nomi di stazioni e animali', () => {
    const keys = Object.keys(LOCALES.it).sort();
    for (const l of LANGS) {
      expect(Object.keys(LOCALES[l]).sort()).toEqual(keys);
      for (const [k, v] of Object.entries(LOCALES[l])) {
        expect(k.startsWith('treno.')).toBe(true);
        expect(String(v).trim().length).toBeGreaterThan(0);
      }
      expect(LOCALES[l]['treno.count']).toContain('{n}');
      expect(LOCALES[l]['treno.count']).toContain('{tot}');
    }
    for (const s of STATION_IDS) expect(keys).toContain(`treno.station.${s}`);
    for (const a of ANIMAL_IDS) expect(keys).toContain(`treno.animal.${a}`);
  });
});

describe('treno: salvataggi', () => {
  it('valori di default e unione con dati vecchi o rovinati', () => {
    expect(DEFAULT_SAVE).toEqual({ trips: 0, delivered: [], last: '', tutorialDone: false });
    const m = mergeDefaults(DEFAULT_SAVE, JSON.stringify({ trips: 4, delivered: ['cow'], extra: 1 }));
    expect(m).toEqual({ trips: 4, delivered: ['cow'], last: '', tutorialDone: false });
    expect(mergeDefaults(DEFAULT_SAVE, '{rotto')).toEqual(DEFAULT_SAVE);
    expect(mergeDefaults(DEFAULT_SAVE, JSON.stringify({ trips: 'tanti', delivered: 'cow' }))).toEqual(DEFAULT_SAVE);
  });
});

describe('treno: audio', () => {
  it('ogni effetto usato dal gioco ha il suo file; la musica ha il loop di 64 s', () => {
    for (const name of SFX_NAMES) expect(SFX_URLS[name], name).toBeTruthy();
    for (const a of ANIMAL_IDS) expect(SFX_NAMES).toContain(`voice_${a}`);
    expect(THEME_LOOP).toBe(64);
  });
  it('il pacchetto si registra con il nome del gioco; senza audio gli effetti non fanno nulla', () => {
    registerTrenoSound();
    expect(PACK).toBe('treno');
    expect(() => { sfx.board(3); sfx.count(5); sfx.voice('cow'); sfx.whistle(); }).not.toThrow();
    expect(sound.music).toBe(null);
  });
});
