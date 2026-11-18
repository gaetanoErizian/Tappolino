import { describe, it, expect } from 'vitest';
import {
  DEFAULT_GAME, NEEDS, FOODS, WEARS, FRIENDS, tick, mood, urgent, levelOf, xpToNext, stageOf, feed, fart, fartSize, complete, buyFood, tapWear,
  sanitize, resume, puzzleReward, playKind, roomOpen, OFFLINE_FLOOR, MAX_LEVEL, type Game,
} from './logic';
import { generatePath, pathDone, validPath, pathHint, solvePath } from './puzzles/path';
import { generateSort, solveSort, sortDone, applyMove, canMove, sortHint } from './puzzles/sort';
import { generateExit, solveExit, canExit, exitHint, type Puff } from './puzzles/exit';
import { generateSeq, SEQ_SYMBOLS } from './puzzles/seq';
import { generate } from './puzzles';
import { LOCALES } from './locales';
import entry from './entry';

const game = (p: Partial<Game> = {}): Game => ({ ...structuredClone(DEFAULT_GAME), ...p });

describe('pupou: bisogni e tempo', () => {
  it('da sveglio i bisogni calano, mai sotto zero', () => {
    const v = tick(game(), 3);
    for (const n of NEEDS) { expect(v.needs[n]).toBeLessThan(DEFAULT_GAME.needs[n]); expect(v.needs[n]).toBeGreaterThanOrEqual(0); }
    const z = tick(game({ needs: { food: 1, water: 1, clean: 1, energy: 1, fun: 1 } }), 5);
    for (const n of NEEDS) expect(z.needs[n]).toBe(0);
  });
  it('a gioco chiuso il tempo scorre piano e non scende sotto il pavimento', () => {
    const g = resume(game({ last: 1000 }), 1000 + 3 * 24 * 3600 * 1000);
    for (const n of NEEDS) expect(g.needs[n]).toBeGreaterThanOrEqual(OFFLINE_FLOOR);
    const low = resume(game({ last: 1000, needs: { food: 5, water: 5, clean: 5, energy: 5, fun: 5 } }), 1000 + 3600 * 1000);
    for (const n of NEEDS) expect(low.needs[n]).toBe(5);
  });
  it('dormendo si ricarica e ci si sveglia a batteria piena', () => {
    let v = tick(game({ asleep: true, needs: { ...DEFAULT_GAME.needs, energy: 10 } }), 0.2);
    expect(v.needs.energy).toBeGreaterThan(10);
    expect(v.asleep).toBe(true);
    v = tick({ ...v, asleep: true }, 2);
    expect(v.needs.energy).toBe(100);
    expect(v.asleep).toBe(false);
  });
  it('umore e bisogno più urgente', () => {
    expect(mood({ food: 90, water: 90, clean: 90, energy: 90, fun: 90 })).toBe('happy');
    expect(mood({ food: 5, water: 90, clean: 90, energy: 90, fun: 90 })).toBe('sad');
    expect(urgent({ food: 30, water: 20, clean: 90, energy: 90, fun: 90 })).toBe('water');
    expect(urgent({ food: 80, water: 80, clean: 90, energy: 90, fun: 90 })).toBeNull();
  });
});

describe('pupou: crescita ed economia', () => {
  it('livelli crescenti fino al massimo', () => {
    expect(levelOf(0).level).toBe(1);
    expect(levelOf(xpToNext(1)).level).toBe(2);
    expect(levelOf(1e7).level).toBe(MAX_LEVEL);
    expect([1, 3, 4, 9, 16, 25, 30].map(stageOf)).toEqual([0, 0, 1, 2, 3, 4, 4]);
  });
  it('mangiare: toglie dalla dispensa, sazia e (con i fagioli) gonfia il pancino', () => {
    const o = feed(game({ gas: 0 }), 'beans');
    expect(o.ok).toBe(true);
    expect(o.game.inv.beans).toBeUndefined();
    expect(o.game.needs.food).toBeGreaterThan(DEFAULT_GAME.needs.food);
    expect(o.game.gas).toBeGreaterThan(30);
    expect(feed(o.game, 'beans').ok).toBe(false);
    expect(feed(game({ asleep: true }), 'apple').ok).toBe(false);
  });
  it('puzzetta: serve aria nel pancino, fa ridere e sporca un pochino', () => {
    expect(fart(game({ gas: 0 })).size).toBe(0);
    const o = fart(game({ gas: 100 }));
    expect(o.size).toBe(3);
    expect(o.game.gas).toBe(0);
    expect(o.game.needs.fun).toBeGreaterThan(DEFAULT_GAME.needs.fun);
    expect(o.game.needs.clean).toBeLessThan(DEFAULT_GAME.needs.clean);
    expect([0, 9, 10, 59, 60, 99, 100].map(fartSize)).toEqual([0, 0, 1, 1, 2, 2, 3]);
  });
  it('attività completate: premi e conseguenze', () => {
    const bath = complete(game({ needs: { ...DEFAULT_GAME.needs, clean: 3 } }), 'bath', 'path');
    expect(bath.game.needs.clean).toBe(100);
    expect(bath.game.coins).toBe(DEFAULT_GAME.coins + bath.coins);
    expect(bath.game.solved.path).toBe(1);
    expect(complete(game(), 'cook', 'sort').game.inv.soup).toBe(2);
    expect(complete(game({ gas: 80 }), 'potty', 'exit').game.gas).toBe(0);
    const play = complete(game(), 'play', 'seq', 'roll');
    expect(play.game.friends.roll).toBe(1);
    expect(puzzleReward(100).coins).toBeGreaterThan(puzzleReward(0).coins);
    expect(playKind(game())).toBe('path');
  });
  it('salire di livello e di tappa viene segnalato', () => {
    const o = complete(game({ xp: xpToNext(1) + xpToNext(2) + xpToNext(3) - 1 }), 'school', 'seq');
    expect(o.levelUp).toBe(4);
    expect(o.stageUp).toBe(1);
  });
  it('negozio e armadio: monete, livello, indossare e togliere', () => {
    expect(buyFood(game({ coins: 0 }), 'apple').ok).toBe(false);
    expect(buyFood(game({ coins: 50 }), 'cake').ok).toBe(false); // livello troppo basso
    expect(buyFood(game({ coins: 50 }), 'soup').ok).toBe(false); // non si compra
    const b = buyFood(game({ coins: 50 }), 'apple');
    expect(b.game.inv.apple).toBe(3);
    expect(b.game.coins).toBe(46);
    const w = tapWear(game({ coins: 50 }), 'cap');
    expect(w.bought).toBe(true);
    expect(w.game.worn.hat).toBe('cap');
    expect(tapWear(w.game, 'cap').game.worn.hat).toBe('');
    expect(tapWear(game({ coins: 500 }), 'crown').ok).toBe(false);
    expect(roomOpen('school', 1)).toBe(false);
    expect(roomOpen('school', 3)).toBe(true);
  });
  it('salvataggi rovinati vengono ripuliti', () => {
    const g = sanitize({ needs: { food: 999, water: -5 } as never, coins: -3, owned: ['cap', 'boh', 'cap'], worn: { hat: 'crown', eyes: '', neck: '' }, inv: { apple: 3.7, boh: 2 } } as never);
    expect(g.needs.food).toBe(100);
    expect(g.needs.water).toBe(0);
    expect(g.coins).toBe(0);
    expect(g.owned).toEqual(['cap']);
    expect(g.worn.hat).toBe('');
    expect(g.inv).toEqual({ apple: 3 });
    expect(sanitize(null)).toEqual(DEFAULT_GAME);
  });
  it('cataloghi coerenti', () => {
    expect(new Set(FOODS.map((f) => f.id)).size).toBe(FOODS.length);
    expect(new Set(WEARS.map((f) => f.id)).size).toBe(WEARS.length);
    for (const id of Object.keys(DEFAULT_GAME.inv)) expect(FOODS.some((f) => f.id === id)).toBe(true);
    expect(FRIENDS.length).toBeGreaterThan(0);
  });
});

const N = 400;
describe('pupou: rompicapo generati dal codice', () => {
  it('spugna: sempre risolvibili, stessi livelli a ogni generazione', () => {
    for (let n = 0; n < N; n++) {
      const lv = generatePath(n);
      expect(pathDone(lv, lv.solution), `path ${n}`).toBe(true);
      expect(validPath(lv, [lv.start])).toBe(true);
      if (n % 40 === 0) expect(generatePath(n)).toEqual(lv);
    }
    const lv = generatePath(7);
    expect(pathHint(lv, [lv.start])).toBeGreaterThanOrEqual(0);
    expect(solvePath(lv, lv.solution.slice(0, 3), 1).count).toBe(1);
  });
  it('barattoli: sempre risolvibili e la soluzione trovata funziona', () => {
    for (let n = 0; n < 120; n++) {
      const lv = generateSort(n);
      const sol = solveSort(lv.jars, lv.cap);
      expect(sol, `sort ${n}`).not.toBeNull();
      let jars = lv.jars;
      for (const mv of sol!) { expect(canMove(jars, lv.cap, mv[0], mv[1])).toBe(true); jars = applyMove(jars, mv); }
      expect(sortDone(jars, lv.cap)).toBe(true);
      expect(sortDone(lv.jars, lv.cap)).toBe(false);
    }
    const lv = generateSort(9);
    expect(sortHint(lv.jars, lv.cap)).not.toBeNull();
    expect(generateSort(9)).toEqual(lv);
  });
  it('puzzette: sempre risolvibili, almeno una libera all\'inizio, catene più lunghe col tempo', () => {
    let early = 0, late = 0;
    for (let n = 0; n < N; n++) {
      const lv = generateExit(n);
      const s = solveExit(lv);
      expect(s.solved, `exit ${n}`).toBe(true);
      expect(exitHint(lv.puffs, lv.w, lv.h)).toBeGreaterThanOrEqual(0);
      const cells = new Set(lv.puffs.map((p) => p.y * lv.w + p.x));
      expect(cells.size).toBe(lv.puffs.length);
      if (n < 5) early += s.depth; else if (n >= 30 && n < 35) late += s.depth;
    }
    expect(late).toBeGreaterThan(early);
    const puffs: (Puff | null)[] = [{ x: 0, y: 0, dir: 1 }, { x: 1, y: 0, dir: 0 }];
    expect(canExit(puffs, 0, 2, 1)).toBe(false);
    expect(canExit(puffs, 1, 2, 1)).toBe(true);
  });
  it('sequenze: una sola risposta giusta tra le scelte, buco mai nella prima ripetizione', () => {
    for (let n = 0; n < N; n++) {
      const lv = generateSeq(n);
      expect(lv.questions.length).toBe(3);
      for (const q of lv.questions) {
        expect(q.options.filter((o) => o === q.answer).length).toBe(1);
        expect(new Set(q.options).size).toBe(q.options.length);
        expect(q.items[q.hole]).toBe(-1);
        expect(q.items.filter((s) => s === -1).length).toBe(1);
        expect(q.hole).toBeGreaterThanOrEqual(2);
        for (const o of q.options) { expect(o).toBeGreaterThanOrEqual(0); expect(o).toBeLessThan(SEQ_SYMBOLS); }
      }
    }
  });
  it('generazione veloce anche ai livelli alti', () => {
    const t0 = performance.now();
    for (const kind of ['path', 'sort', 'exit', 'seq'] as const) for (const n of [0, 10, 25, 60, 200]) generate(kind, n);
    expect(performance.now() - t0).toBeLessThan(4000);
  });
});

describe('pupou: modulo', () => {
  it('voce di menu e testi nelle 6 lingue con le stesse chiavi', () => {
    expect(entry.id).toBe('pupou');
    expect(entry.free).toBe(false);
    const keys = Object.keys(LOCALES.it).sort();
    for (const l of Object.keys(LOCALES) as (keyof typeof LOCALES)[]) {
      expect(Object.keys(LOCALES[l]).sort()).toEqual(keys);
      for (const k of keys) expect(k.startsWith('pupou.')).toBe(true);
    }
  });
});
