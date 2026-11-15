import { describe, expect, it } from 'vitest';
import {
  RECIPES, TOPPINGS, COLORS, REWARDS, START, unlocked, rewardFor, mixProgress, MIX_GOAL, clampToEllipse,
  addCreation, sanitizeCreations, placeInArea, randomInArea, nextCustomer, canServe, SHOWCASE_MAX, MAX_TOPPINGS, type Creation,
} from './recipes';
import { mergeDefaults } from '../../core/storage';
import { LOCALES } from './locales';
import { DEFAULT_SAVE } from './save';

describe('pasticceria: ricette e sblocchi', () => {
  it('4 ricette da 4 ingredienti, solo il gelato va nel freezer', () => {
    expect(RECIPES.map((r) => r.id)).toEqual(['cupcake', 'cookie', 'cake', 'gelato']);
    for (const r of RECIPES) {
      expect(r.ingredients.length).toBe(4);
      expect(new Set(r.ingredients).size).toBe(4);
      expect(r.batter).toMatch(/^#[0-9a-f]{6}$/);
    }
    expect(RECIPES.filter((r) => r.cold).map((r) => r.id)).toEqual(['gelato']);
  });
  it('si parte con cupcake, 3 decorazioni e 3 glasse', () => {
    expect(unlocked(0)).toEqual({ recipes: ['cupcake'], toppings: START.toppings, colors: START.colors });
  });
  it('una sorpresa per dolce, ognuna sblocca qualcosa di nuovo, mai due volte', () => {
    const keys = REWARDS.map((r) => `${r.kind}:${r.id}`);
    expect(new Set(keys).size).toBe(keys.length);
    for (let n = 1; n <= REWARDS.length; n++) {
      const before = unlocked(n - 1), after = unlocked(n);
      const count = (u: typeof before) => u.recipes.length + u.toppings.length + u.colors.length;
      expect(count(after)).toBe(count(before) + 1);
      expect(rewardFor(n)).toEqual(REWARDS[n - 1]);
    }
    expect(rewardFor(0)).toBeNull();
    expect(rewardFor(REWARDS.length + 1)).toBeNull();
  });
  it('alla fine tutto è sbloccato', () => {
    const all = unlocked(99);
    expect(all.recipes.length).toBe(RECIPES.length);
    expect(all.toppings).toEqual(TOPPINGS);
    expect(all.colors.length).toBe(COLORS.length);
  });
  it('vassoi: al massimo 8 decorazioni e 6 glasse (2 righe)', () => {
    expect(TOPPINGS.length).toBeLessThanOrEqual(8);
    expect(COLORS.length).toBeLessThanOrEqual(6);
  });
});

describe('pasticceria: mescolare e decorare', () => {
  it('impasto liscio dopo MIX_GOAL di movimento', () => {
    expect(mixProgress(0)).toBe(0);
    expect(mixProgress(MIX_GOAL / 2)).toBeCloseTo(0.5);
    expect(mixProgress(MIX_GOAL * 3)).toBe(1);
    expect(mixProgress(-10)).toBe(0);
  });
  it('la frusta resta dentro la ciotola', () => {
    expect(clampToEllipse(10, 5, 0, 0, 100, 50)).toEqual({ x: 10, y: 5 });
    const p = clampToEllipse(500, 0, 0, 0, 100, 50);
    expect(p.x).toBeCloseTo(100);
    expect(p.y).toBeCloseTo(0);
  });
  it('le decorazioni finiscono sempre sul dolce', () => {
    for (const r of RECIPES) {
      const a = r.area;
      const inside = (q: { x: number; y: number }) => ((q.x - a.x) / a.rx) ** 2 + ((q.y - a.y) / a.ry) ** 2 <= 1.0001;
      expect(inside(placeInArea(a, 900, -900))).toBe(true);
      for (let i = 0; i < 50; i++) expect(inside(randomInArea(a))).toBe(true);
    }
  });
  it('pulsante servi: glassa + 2 decorazioni, oppure 4 decorazioni', () => {
    expect(canServe(true, 1)).toBe(false);
    expect(canServe(true, 2)).toBe(true);
    expect(canServe(false, 3)).toBe(false);
    expect(canServe(false, 4)).toBe(true);
  });
  it('il cliente cambia sempre', () => {
    for (const prev of ['bunny', 'bear', 'cat', 'fox']) {
      for (const r of [0, 0.5, 0.999]) expect(nextCustomer(prev, () => r)).not.toBe(prev);
    }
  });
});

describe('pasticceria: vetrina e salvataggi', () => {
  const c = (r: Creation['r']): Creation => ({ r, c: 'pink', t: [['cherry', 0, -10]] });
  it('la vetrina tiene gli ultimi 6, il più recente per primo', () => {
    let list: Creation[] = [];
    for (let i = 0; i < 9; i++) list = addCreation(list, c(i % 2 ? 'cake' : 'cupcake'));
    expect(list.length).toBe(SHOWCASE_MAX);
    list = addCreation(list, c('gelato'));
    expect(list[0].r).toBe('gelato');
  });
  it('scarta dolci non validi', () => {
    const tooMany = Array.from({ length: 30 }, () => ['star', 1, 2]);
    const clean = sanitizeCreations([
      c('cookie'), { r: 'pizza', c: 'pink', t: [] }, { r: 'cake', c: 'blue', t: [] }, null, 'x',
      { r: 'cake', c: null, t: [['cherry', 1, 2], ['bomb', 1, 2], ['star', 'a', 2], ['heart', 3, 4, 5]] },
      { r: 'gelato', c: 'mint', t: tooMany },
    ]);
    expect(clean.map((x) => x.r)).toEqual(['cookie', 'cake', 'gelato']);
    expect(clean[1].t).toEqual([['cherry', 1, 2]]);
    expect(clean[2].t.length).toBe(MAX_TOPPINGS);
    expect(sanitizeCreations('nope')).toEqual([]);
  });
  it('unisce dati vecchi con nuovi campi e ignora tipi sbagliati', () => {
    const s = mergeDefaults(DEFAULT_SAVE, JSON.stringify({ served: 3, creations: 'x', extra: 1 }));
    expect(s.served).toBe(3);
    expect(s.creations).toEqual([]);
    expect(s.tutorialDone).toBe(false);
    expect('extra' in s).toBe(false);
  });
});

describe('pasticceria: traduzioni', () => {
  const keys = Object.keys(LOCALES.it).sort();
  for (const [l, d] of Object.entries(LOCALES)) {
    it(`${l}: stesse chiavi, tutte prefissate "pasticceria."`, () => {
      expect(Object.keys(d).sort()).toEqual(keys);
      for (const [k, v] of Object.entries(d)) {
        expect(k.startsWith('pasticceria.')).toBe(true);
        expect(String(v).trim().length).toBeGreaterThan(0);
      }
      expect(String(d['pasticceria.served'])).toContain('{n}');
      for (const r of RECIPES) expect(d[`pasticceria.recipe.${r.id}`]).toBeTruthy();
    });
  }
});
