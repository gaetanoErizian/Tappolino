import { describe, expect, it } from 'vitest';
import { levelCfg, LEVEL_COUNT, newlyUnlocked, TRUCKS, medalKind, pickFreeCell, isUnlocked } from '../src/levels';
import { mergeDefaults } from '../src/core/storage';
import { noteFreq } from '../src/core/audio';
import { LOCALES } from '../src/locales';
import { DEFAULT_SAVE } from '../src/save';

describe('livelli', () => {
  it('difficoltà mai decrescente e bersagli sempre ≥ 2 righe/3 colonne', () => {
    for (let i = 1; i < LEVEL_COUNT; i++) {
      const a = levelCfg(i - 1), b = levelCfg(i);
      expect(b.goal).toBeGreaterThanOrEqual(a.goal);
      expect(b.spawnMs).toBeLessThanOrEqual(a.spawnMs);
      expect(b.cols * b.rows).toBeGreaterThanOrEqual(a.cols * a.rows);
    }
  });
  it('max 3 righe e 6 colonne (bersagli grandi su telefono)', () => {
    for (let i = 0; i < LEVEL_COUNT + 5; i++) {
      expect(levelCfg(i).rows).toBeLessThanOrEqual(3);
      expect(levelCfg(i).cols).toBeLessThanOrEqual(6);
      expect(levelCfg(i).maxFlames).toBeLessThan(levelCfg(i).cols * levelCfg(i).rows);
    }
  });
  it('oltre l’ultimo livello resta la difficoltà massima', () => {
    expect(levelCfg(99)).toEqual(levelCfg(LEVEL_COUNT - 1));
    expect(levelCfg(-3)).toEqual(levelCfg(0));
  });
  it('sblocco camion', () => {
    expect(TRUCKS.filter((t) => isUnlocked(t, 0)).map((t) => t.id)).toEqual(['red']);
    expect(newlyUnlocked(1, 2).map((t) => t.id)).toEqual(['yellow']);
    expect(newlyUnlocked(2, 3)).toEqual([]);
    expect(TRUCKS.every((t) => isUnlocked(t, 10))).toBe(true);
  });
  it('medaglie a rotazione', () => {
    expect([0, 1, 2, 3].map(medalKind)).toEqual(['bronze', 'silver', 'gold', 'bronze']);
  });
  it('scelta cella libera', () => {
    expect(pickFreeCell([true, true])).toBe(-1);
    expect(pickFreeCell([true, false, true])).toBe(1);
    expect(pickFreeCell([false, false, false], () => 0.99)).toBe(2);
  });
});

describe('salvataggi', () => {
  it('unisce dati vecchi con nuovi campi e ignora tipi sbagliati', () => {
    const s = mergeDefaults(DEFAULT_SAVE, JSON.stringify({ levelsDone: 4, truck: 7, extra: 1 }));
    expect(s.levelsDone).toBe(4);
    expect(s.truck).toBe('red');
    expect(s.catsSaved).toBe(0);
    expect('extra' in s).toBe(false);
  });
  it('dati corrotti → default', () => {
    expect(mergeDefaults(DEFAULT_SAVE, '{oops')).toEqual(DEFAULT_SAVE);
  });
});

describe('traduzioni', () => {
  const keys = Object.keys(LOCALES.it).sort();
  for (const [l, d] of Object.entries(LOCALES)) {
    it(`${l}: stesse chiavi dell'italiano, nessun testo vuoto, 10 numeri`, () => {
      expect(Object.keys(d).sort()).toEqual(keys);
      for (const v of Object.values(d)) expect(String(v).trim().length).toBeGreaterThan(0);
      expect((d.numbers as string[]).length).toBe(10);
      expect(String(d['gate.question'])).toContain('{a}');
      expect(String(d['parents.removeAds'])).toContain('{price}');
    });
  }
});

describe('audio', () => {
  it('frequenze note', () => {
    expect(noteFreq('A4')).toBeCloseTo(440);
    expect(noteFreq('C4')).toBeCloseTo(261.63, 1);
  });
});
