import { describe, expect, it } from 'vitest';
import {
  PLANETS, PLANET_IDS, ROCKETS, ROCKET_IDS, nextPlanet, addVisited, sanitizePlanets, isPlanetId,
  rocketsUnlocked, newRockets, usableRocket,
} from './planets';
import {
  buildCourse, courseLength, speedFor, stepRocket, bounceFrom, touches, starValue, comboRate, rng,
  LANES, TOP, BOTTOM, SAFE_START, SAFE_END, START_X, STAR_REACH, ROCKET_R, PHYS, type Item,
} from './course';
import { gameTextures, PF, EYES } from './art';
import { razzoTile } from './tile';
import entry from './entry';
import { mergeDefaults } from '../../core/storage';
import { LOCALES } from './locales';
import { DEFAULT_SAVE } from './save';
import { sound } from '../../core/sound';
import { PACK, THEME_LOOP, SFX_URLS, SFX_NAMES, registerRazzoSound, sfx } from './sfx';

const LANGS = ['it', 'en', 'es', 'fr', 'de', 'pt'] as const;

describe('razzo: voce di menu', () => {
  it('gioco 5, a pagamento, colore e titoli dal brief', () => {
    expect(entry.id).toBe('razzo');
    expect(entry.order).toBe(5);
    expect(entry.free).toBe(false);
    expect(entry.color).toBe('#3c4fc4');
    for (const l of LANGS) {
      expect(entry.titles[l].length).toBeGreaterThan(3);
      expect(LOCALES[l]['razzo.title']).toBe(entry.titles[l]);
    }
    const tile = razzoTile();
    expect(tile.key).toBe('tile_razzo');
    expect([tile.w, tile.h]).toEqual([360, 280]);
    expect(tile.svg).not.toContain('NaN');
  });
});

describe('razzo: pianeti', () => {
  it('8 pianeti diversi, con colori validi', () => {
    expect(PLANETS.length).toBe(8);
    expect(new Set(PLANET_IDS).size).toBe(8);
    expect(PLANETS.map((p) => p.id)).toEqual([...PLANET_IDS]);
    expect(new Set(PLANETS.map((p) => p.base)).size).toBe(8);
    for (const p of PLANETS) for (const c of [p.light, p.base, p.dark]) expect(c).toMatch(/^#[0-9a-f]{6}$/);
  });
  it('si scoprono in ordine, poi a caso senza ripetere il precedente', () => {
    let visited: string[] = [];
    for (const id of PLANET_IDS) {
      expect(nextPlanet(visited, '')).toBe(id);
      visited = addVisited(visited, id);
    }
    expect(addVisited(visited, 'luna')).toEqual(visited);
    for (let k = 0; k < 50; k++) {
      const last = PLANET_IDS[k % 8];
      const r = rng(k);
      const n = nextPlanet(visited, last, r);
      expect(n).not.toBe(last);
      expect(isPlanetId(n)).toBe(true);
    }
    expect(nextPlanet(visited, 'luna', () => 0.999999)).toBe('arcobaleno');
  });
  it('ripulisce i salvataggi', () => {
    expect(sanitizePlanets(['luna', 'marte', 3, 'luna', null, 'bolle'])).toEqual(['luna', 'bolle']);
  });
});

describe('razzo: razzi', () => {
  it('6 razzi, il primo subito, gli altri con i viaggi', () => {
    expect(ROCKETS.length).toBe(6);
    expect(new Set(ROCKET_IDS).size).toBe(6);
    expect(ROCKETS[0].at).toBe(0);
    const ats = ROCKETS.map((r) => r.at);
    expect([...ats].sort((a, b) => a - b)).toEqual(ats);
    expect(new Set(ats).size).toBe(6);
    // l'ultimo razzo arriva quando la collezione dei pianeti è completa
    expect(ats[ats.length - 1]).toBe(PLANETS.length);
    expect(rocketsUnlocked(0)).toEqual(['rosso']);
    expect(rocketsUnlocked(100)).toEqual([...ROCKET_IDS]);
  });
  it('ogni razzo si sblocca una volta sola', () => {
    const seen: string[] = [];
    for (let trips = 0; trips < 20; trips++) seen.push(...newRockets(trips, trips + 1));
    expect(seen.sort()).toEqual(ROCKET_IDS.filter((id) => id !== 'rosso').sort());
    expect(newRockets(0, 1)).toEqual(['blu']);
    expect(newRockets(2, 3)).toEqual([]);
  });
  it('razzo scelto valido solo se sbloccato', () => {
    expect(usableRocket('oro', 0)).toBe('rosso');
    expect(usableRocket('oro', 8)).toBe('oro');
    expect(usableRocket('missile', 8)).toBe('rosso');
    expect(usableRocket(undefined, 3)).toBe('rosso');
  });
});

describe('razzo: percorso del viaggio', () => {
  const courses: Array<[number, Item[]]> = [];
  for (let level = 0; level < 12; level++) for (let seed = 1; seed <= 25; seed++) courses.push([level, buildCourse(level, seed * 97 + level)]);

  it('stesso seme, stesso percorso', () => {
    expect(buildCourse(3, 42)).toEqual(buildCourse(3, 42));
    expect(buildCourse(3, 42)).not.toEqual(buildCourse(3, 43));
  });
  it('tante stelle, al massimo 3 righe, ordinate e dentro il viaggio', () => {
    for (const [level, c] of courses) {
      const len = courseLength(level);
      expect(starValue(c)).toBeGreaterThanOrEqual(40);
      expect(c.filter((i) => i.kind === 'big').length).toBe(1);
      for (let i = 1; i < c.length; i++) expect(c[i].x).toBeGreaterThanOrEqual(c[i - 1].x);
      for (const it of c) {
        expect(it.x).toBeGreaterThanOrEqual(START_X);
        expect(it.x).toBeLessThanOrEqual(len - SAFE_END);
        expect(it.y).toBeGreaterThanOrEqual(LANES[0] - 1);
        expect(it.y).toBeLessThanOrEqual(LANES[2] + 1);
        if (it.kind === 'rock') expect(LANES as readonly number[]).toContain(it.y);
      }
    }
  });
  it('inizio senza asteroidi, poi asteroidi solo dopo un po\'', () => {
    for (const [level, c] of courses) {
      expect(c.filter((i) => i.kind === 'rock' && i.x < SAFE_START).length).toBe(0);
      expect(c.filter((i) => i.kind === 'rock').length).toBeGreaterThanOrEqual(level === 0 ? 2 : 3);
    }
  });
  it('mai tre righe bloccate insieme', () => {
    for (const [, c] of courses) {
      const rocks = c.filter((i) => i.kind === 'rock');
      for (const r of rocks) {
        const near = rocks.filter((o) => Math.abs(o.x - r.x) < 600);
        expect(new Set(near.map((o) => o.y)).size).toBeLessThanOrEqual(2);
      }
    }
  });
  it('nessuna stella sopra o troppo vicina a un asteroide', () => {
    for (const [, c] of courses) {
      const rocks = c.filter((i) => i.kind === 'rock');
      for (const s of c.filter((i) => i.kind !== 'rock')) {
        for (const r of rocks) expect(Math.hypot(s.x - r.x, s.y - r.y)).toBeGreaterThan((r.r ?? 90) + 60);
      }
    }
  });
  it('viaggi di 40–55 secondi, un po\' più lunghi e veloci con l\'esperienza', () => {
    for (const level of [0, 4, 8, 20]) {
      const s = courseLength(level) / speedFor(level);
      expect(s).toBeGreaterThan(35);
      expect(s).toBeLessThan(55);
    }
    expect(courseLength(8)).toBeGreaterThan(courseLength(0));
    expect(courseLength(20)).toBe(courseLength(8));
  });
});

describe('razzo: volo', () => {
  it('tieni premuto e sale, lascia e scende, senza uscire dallo schermo', () => {
    const s = { y: LANES[1], vy: 0 };
    for (let i = 0; i < 30; i++) stepRocket(s, true, 1 / 60);
    expect(s.y).toBeLessThan(LANES[1]);
    expect(s.vy).toBeLessThan(0);
    for (let i = 0; i < 600; i++) stepRocket(s, true, 1 / 60);
    expect(s.y).toBe(TOP);
    for (let i = 0; i < 600; i++) stepRocket(s, false, 1 / 60);
    expect(s.y).toBe(BOTTOM);
    // da fermo in basso si prendono le stelle della riga più bassa; in alto quelle della riga più alta
    expect(Math.abs(BOTTOM - LANES[2])).toBeLessThan(STAR_REACH);
    expect(Math.abs(TOP - LANES[0])).toBeLessThan(STAR_REACH);
  });
  it('movimento morbido: niente scatti anche con fotogrammi lenti', () => {
    const s = { y: LANES[1], vy: PHYS.down };
    stepRocket(s, true, 0.05);
    expect(s.vy).toBeGreaterThan(PHYS.up);
    expect(Math.abs(s.y - LANES[1])).toBeLessThan(40);
  });
  it('rimbalzo lontano dall\'asteroide', () => {
    const above = { y: 400, vy: 300 };
    bounceFrom(above, 540);
    expect(above.vy).toBe(-PHYS.bounce);
    const below = { y: 700, vy: -300 };
    bounceFrom(below, 540);
    expect(below.vy).toBe(PHYS.bounce);
    expect(touches(0, 0, ROCKET_R, 100, 0, 60)).toBe(true);
    expect(touches(0, 0, ROCKET_R, 200, 0, 60)).toBe(false);
  });
  it('le stelle prese di fila salgono sulla scala', () => {
    expect(comboRate(0)).toBe(1);
    for (let k = 1; k < 15; k++) expect(comboRate(k)).toBeGreaterThanOrEqual(comboRate(k - 1));
    expect(comboRate(99)).toBe(4);
  });
});

describe('razzo: grafica', () => {
  it('texture con chiavi uniche, SVG validi e misure contenute', () => {
    const list = gameTextures();
    expect(new Set(list.map((t) => t.key)).size).toBe(list.length);
    for (const t of list) {
      expect(t.key.startsWith('rz_')).toBe(true);
      expect(t.svg.startsWith('<svg')).toBe(true);
      expect(t.svg).not.toContain('NaN');
      expect(t.svg).not.toContain('undefined');
      expect(t.w * t.h).toBeLessThanOrEqual(1600 * 600);
    }
  });
  it('ogni pianeta e ogni razzo ha la sua texture', () => {
    const keys = new Set(gameTextures().map((t) => t.key));
    for (const id of [...PLANET_IDS, 'casa']) expect(keys.has(`rz_planet_${id}`)).toBe(true);
    for (const id of ROCKET_IDS) expect(keys.has(`rz_rocket_${id}`)).toBe(true);
    for (const k of ['rz_sky', 'rz_twinkle', 'rz_flame', 'rz_lid', 'rz_bigstar', 'rz_rock_0', 'rz_rock_1', 'rz_rock_2', 'rz_btn_planets', 'rz_btn_hangar']) {
      expect(keys.has(k)).toBe(true);
    }
    for (const n of new Set(PLANETS.map((p) => p.nebula))) expect(keys.has(`rz_neb_${n}`)).toBe(true);
  });
  it('occhi dentro la sfera del pianeta', () => {
    for (const dx of [-EYES.dx, EYES.dx]) expect(Math.hypot(dx, EYES.y - PF.cy)).toBeLessThan(PF.r * 0.6);
  });
});

describe('razzo: testi e salvataggi', () => {
  it('stesse chiavi in tutte le lingue, nomi di tutti i pianeti', () => {
    const keys = Object.keys(LOCALES.it).sort();
    for (const l of LANGS) {
      expect(Object.keys(LOCALES[l]).sort()).toEqual(keys);
      for (const k of keys) {
        expect(k.startsWith('razzo.')).toBe(true);
        expect(String(LOCALES[l][k]).length).toBeGreaterThan(1);
      }
      for (const id of PLANET_IDS) expect(LOCALES[l][`razzo.planet.${id}`]).toBeTruthy();
      expect(LOCALES[l]['razzo.count']).toContain('{n}');
      expect(LOCALES[l]['razzo.count']).toContain('{tot}');
    }
  });
  it('salvataggi rovinati tornano ai valori di partenza', () => {
    expect(mergeDefaults(DEFAULT_SAVE, null)).toEqual(DEFAULT_SAVE);
    expect(mergeDefaults(DEFAULT_SAVE, '{rotto')).toEqual(DEFAULT_SAVE);
    const m = mergeDefaults(DEFAULT_SAVE, JSON.stringify({ visited: 'luna', trips: '3', stars: 12, rocket: 'blu' }));
    expect(m.visited).toEqual([]);
    expect(m.trips).toBe(0);
    expect(m.stars).toBe(12);
    expect(m.rocket).toBe('blu');
  });
});

describe('razzo: audio', () => {
  it('musica in loop e un file per ogni effetto', () => {
    expect(THEME_LOOP).toBeGreaterThanOrEqual(30);
    expect(THEME_LOOP).toBeLessThanOrEqual(80);
    for (const n of SFX_NAMES) expect(SFX_URLS[n], n).toBeTruthy();
    expect(Object.keys(SFX_URLS).sort()).toEqual([...SFX_NAMES].sort());
    registerRazzoSound();
    expect(PACK).toBe('razzo');
    // senza AudioContext (test) gli effetti non devono mai lanciare errori
    expect(() => { sfx.star(3); sfx.boing(); sfx.giggle(1.1); sfx.fanfare(); }).not.toThrow();
    expect(sound.music).toBe(null);
  });
});
