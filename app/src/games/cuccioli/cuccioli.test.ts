import { describe, expect, it } from 'vitest';
import {
  PETS, PET_IDS, PROBLEMS, PROBLEM_IDS, TOOLS, SPOTS, PET_AT, PET_HIT, TRAY_Y, TOOL_GAP, GARDEN_SPOTS,
  nextPet, addCured, sanitizeCured, isPetId, problemsFor, stepsOf, trayTools, ailmentFor, toolNeeded, isCured, onPet,
  trayX, spotPoint, problemById, type Ailment,
} from './logic';
import { gameTextures } from './art';
import { cuccioliTile } from './tile';
import entry from './entry';
import { mergeDefaults } from '../../core/storage';
import { LOCALES } from './locales';
import { DEFAULT_SAVE } from './save';
import { sound } from '../../core/sound';
import { PACK, THEME_LOOP, SFX_URLS, SFX_NAMES, registerCuccioliSound, sfx } from './sfx';

/** Generatore con seme per i test (sequenze ripetibili). */
function seeded(seed: number): () => number {
  let s = seed >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}

describe('cuccioli: voce di menu', () => {
  it('gioco 6, non gratis, colore e titoli dal brief', () => {
    expect(entry.id).toBe('cuccioli');
    expect(entry.order).toBe(6);
    expect(entry.free).toBe(false);
    expect(entry.color).toBe('#4cc3a5');
    for (const l of ['it', 'en', 'es', 'fr', 'de', 'pt'] as const) {
      expect(entry.titles[l].length).toBeGreaterThan(3);
      expect(LOCALES[l]['cuccioli.title']).toBe(entry.titles[l]);
    }
    expect(cuccioliTile().key).toBe('tile_cuccioli');
    expect(cuccioliTile().svg).not.toContain('NaN');
  });
});

describe('cuccioli: grafica', () => {
  it('texture con chiavi uniche, prefisso "cu_" e SVG validi', () => {
    const list = gameTextures();
    expect(new Set(list.map((t) => t.key)).size).toBe(list.length);
    for (const t of list) {
      expect(t.key.startsWith('cu_')).toBe(true);
      expect(t.svg.startsWith('<svg')).toBe(true);
      expect(t.svg).not.toContain('NaN');
      expect(t.svg).not.toContain('undefined');
      expect(t.w * t.h).toBeLessThanOrEqual(2200 * 400);
    }
  });
  it('ogni cucciolo ha corpo, testa, zampetta e coda; ogni strumento la sua icona', () => {
    const keys = new Set(gameTextures().map((t) => t.key));
    for (const p of PETS) for (const part of ['body', 'head', 'paw', 'tail']) expect(keys.has(`cu_${p.id}_${part}`)).toBe(true);
    for (const t of TOOLS) expect(keys.has(`cu_tool_${t}`)).toBe(true);
    for (const k of ['cu_eye', 'cu_eye_closed', 'cu_eye_happy', 'cu_eye_sleepy', 'cu_mouth_smile', 'cu_mouth_open', 'cu_mouth_o', 'cu_mouth_wavy',
      'cu_mud', 'cu_thorn', 'cu_ouch', 'cu_plaster', 'cu_scarf', 'cu_blanket', 'cu_tissue', 'cu_rednose', 'cu_thought', 'cu_btn_garden']) {
      expect(keys.has(k), k).toBe(true);
    }
  });
});

describe('cuccioli: i cuccioli e il giardino', () => {
  it('8 cuccioli diversi, ognuno con il suo colore', () => {
    expect(PETS.length).toBe(8);
    expect(new Set(PET_IDS).size).toBe(8);
    expect(new Set(PETS.map((p) => p.fur)).size).toBe(8);
    for (const p of PETS) for (const c of [p.fur, p.belly, p.nose, p.accent]) expect(c).toMatch(/^#[0-9a-f]{6}$/);
  });
  it('si conoscono in ordine, uno nuovo per visita', () => {
    let cured: string[] = [];
    for (const p of PETS) {
      const id = nextPet(cured, cured[cured.length - 1] ?? '');
      expect(id).toBe(p.id);
      cured = addCured(cured, id);
    }
    expect(cured).toEqual(PET_IDS);
  });
  it('a giardino pieno: mai lo stesso cucciolo due volte di fila', () => {
    for (const last of PET_IDS) for (const r of [0, 0.5, 0.9999]) expect(nextPet(PET_IDS, last, () => r)).not.toBe(last);
  });
  it('giardino senza doppioni né cuccioli sconosciuti', () => {
    expect(addCured(['dog'], 'dog')).toEqual(['dog']);
    expect(sanitizeCured(['dog', 'dog', 'drago', 3, null, 'cat'])).toEqual(['dog', 'cat']);
    expect(sanitizeCured('x')).toEqual([]);
    expect(isPetId('panda')).toBe(true);
    expect(isPetId('unicorno')).toBe(false);
  });
  it('un posto in giardino per ogni cucciolo, dentro lo schermo, al massimo due file', () => {
    expect(GARDEN_SPOTS.length).toBe(PETS.length);
    expect(new Set(GARDEN_SPOTS.map((s) => s.y > 800)).size).toBe(2);
    for (const s of GARDEN_SPOTS) {
      expect(s.x - 200 * s.s).toBeGreaterThan(0);
      expect(s.x + 200 * s.s).toBeLessThan(1920);
      expect(s.y - 650 * s.s).toBeGreaterThan(160);
      expect(s.y).toBeLessThan(1000);
    }
  });
  it('salvataggi: unisce dati vecchi con nuovi campi e ignora tipi sbagliati', () => {
    const s = mergeDefaults(DEFAULT_SAVE, JSON.stringify({ cured: ['dog'], visits: 'tante', extra: 1 }));
    expect(s.cured).toEqual(['dog']);
    expect(s.visits).toBe(0);
    expect(s.tutorialDone).toBe(false);
    expect('extra' in s).toBe(false);
  });
});

describe('cuccioli: guai e strumenti', () => {
  it('6 guai, ognuno curato da strumenti diversi; ogni strumento serve a qualcosa', () => {
    expect(PROBLEMS.length).toBe(6);
    const used = PROBLEMS.flatMap((p) => p.tools);
    expect(new Set(used).size).toBe(used.length);
    expect([...used].sort()).toEqual([...TOOLS].sort());
    expect(problemById('thorn').tools).toEqual(['tweezers', 'plaster']);
  });
  it('ogni guaio ha un punto suo sul cucciolo', () => {
    expect(new Set(PROBLEMS.map((p) => p.spot)).size).toBe(PROBLEMS.length);
    for (const p of PROBLEMS) expect(SPOTS[p.spot]).toBeTruthy();
  });
  it('progressione gentile: 1 guaio, poi 2, poi fino a 3; mai doppioni', () => {
    expect(problemsFor(0)).toEqual(['dirty']);
    expect(problemsFor(1).length).toBe(2);
    expect(problemsFor(2).length).toBe(2);
    for (let v = 3; v < 30; v++) for (let k = 0; k < 10; k++) {
      const list = problemsFor(v, seeded(v * 31 + k));
      expect(list.length).toBe(v >= 5 ? 3 : 2);
      expect(new Set(list).size).toBe(list.length);
      for (const p of list) expect(PROBLEM_IDS).toContain(p);
    }
  });
  it('vassoio: alle prime visite gli strumenti che servono più uno, poi tutti e sette', () => {
    for (let v = 0; v < 3; v++) {
      const probs = problemsFor(v);
      const tray = trayTools(probs, v);
      const need = stepsOf(probs);
      for (const t of need) expect(tray).toContain(t);
      expect(tray.length).toBe(new Set(need).size + 1);
    }
    expect(trayTools(['dirty'], 0)).toEqual(['sponge', 'bottle']);
    expect(trayTools(['dirty'], 5)).toEqual([...TOOLS]);
  });
  it('la spina: prima le pinzette, poi il cerotto', () => {
    const list: Ailment[] = [{ id: 'thorn', done: 0 }];
    expect(toolNeeded(list[0])).toBe('tweezers');
    expect(ailmentFor(list, 'plaster')).toBe(-1);
    expect(ailmentFor(list, 'tweezers')).toBe(0);
    list[0].done = 1;
    expect(isCured(list[0])).toBe(false);
    expect(toolNeeded(list[0])).toBe('plaster');
    expect(ailmentFor(list, 'tweezers')).toBe(-1);
    list[0].done = 2;
    expect(isCured(list[0])).toBe(true);
    expect(toolNeeded(list[0])).toBe(null);
  });
  it('lo strumento giusto lasciato sul cucciolo cura il guaio più vicino', () => {
    const list: Ailment[] = [{ id: 'dirty', done: 0 }, { id: 'hungry', done: 0 }];
    expect(ailmentFor(list, 'sponge', SPOTS.pawL.x, SPOTS.pawL.y)).toBe(0);
    expect(ailmentFor(list, 'sponge', SPOTS.mouth.x, SPOTS.mouth.y)).toBe(0);
    expect(ailmentFor(list, 'bottle', SPOTS.pawL.x, SPOTS.pawL.y)).toBe(1);
    expect(ailmentFor(list, 'scarf', 0, -200)).toBe(-1);
  });
  it('bersagli generosi: tutto il cucciolo e i punti di cura rispondono, lontano no', () => {
    for (const s of Object.values(SPOTS)) expect(onPet(s.x, s.y)).toBe(true);
    expect(onPet(PET_HIT.x, PET_HIT.y)).toBe(true);
    expect(onPet(0, -660)).toBe(true);
    expect(onPet(600, 0)).toBe(false);
    expect(onPet(0, 300)).toBe(false);
  });
});

describe('cuccioli: scena della visita', () => {
  it('vassoio: fino a 7 strumenti in fila, distanti e dentro lo schermo', () => {
    for (let n = 1; n <= TOOLS.length; n++) {
      const xs = Array.from({ length: n }, (_, i) => trayX(i, n));
      for (let i = 1; i < n; i++) expect(xs[i] - xs[i - 1]).toBe(TOOL_GAP);
      expect(xs[0] - 95).toBeGreaterThan(160);
      expect(xs[n - 1] + 95).toBeLessThan(1760);
    }
    expect(TOOL_GAP).toBeGreaterThanOrEqual(190);
  });
  it('i punti di cura sono sopra il vassoio, lontani dagli strumenti e dentro lo schermo', () => {
    for (const id of Object.keys(SPOTS) as (keyof typeof SPOTS)[]) {
      const p = spotPoint(id);
      expect(p.y).toBeLessThan(TRAY_Y - 150);
      expect(p.y).toBeGreaterThan(150);
      expect(p.x).toBeGreaterThan(400);
      expect(p.x).toBeLessThan(1520);
    }
    // testa del cucciolo sotto le pastiglie in alto
    expect(PET_AT.y - 640 * PET_AT.scale).toBeGreaterThan(140);
  });
});

describe('cuccioli: audio (core/sound)', () => {
  it('pacchetto "cuccioli": musica ogg+mp3 con loop di 60 s e un file per ogni effetto', () => {
    registerCuccioliSound();
    const pack = (sound as unknown as { packs: Map<string, { music?: { ogg: string; mp3: string; loop: number }; sfx: Record<string, string> }> }).packs.get(PACK)!;
    expect(pack.music?.ogg).toMatch(/theme.*\.ogg/);
    expect(pack.music?.mp3).toMatch(/theme.*\.mp3/);
    expect(pack.music?.loop).toBe(THEME_LOOP);
    expect(THEME_LOOP).toBeGreaterThanOrEqual(30);
    expect(THEME_LOOP).toBeLessThanOrEqual(80);
    expect(Object.keys(SFX_URLS).sort()).toEqual([...SFX_NAMES].sort());
    for (const p of PETS) expect(SFX_URLS[`voice_${p.id}`]).toBeTruthy();
    expect(typeof sfx.voice).toBe('function');
  });
});

describe('cuccioli: traduzioni', () => {
  const keys = Object.keys(LOCALES.it).sort();
  for (const [l, d] of Object.entries(LOCALES)) {
    it(`${l}: stesse chiavi, tutte prefissate "cuccioli.", un nome per ogni cucciolo`, () => {
      expect(Object.keys(d).sort()).toEqual(keys);
      for (const [k, v] of Object.entries(d)) {
        expect(k.startsWith('cuccioli.')).toBe(true);
        expect(String(v).trim().length).toBeGreaterThan(0);
      }
      expect(String(d['cuccioli.count'])).toContain('{n}');
      expect(String(d['cuccioli.count'])).toContain('{tot}');
      for (const p of PETS) expect(d[`cuccioli.pet.${p.id}`]).toBeTruthy();
    });
  }
});
