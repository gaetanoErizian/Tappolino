/**
 * Pupou — logica pura (nessuna dipendenza da Phaser): bisogni, pancino pieno d'aria, crescita, monete,
 * dispensa, armadio, amici. Tutto quello che il gioco "decide" passa da qui ed è coperto dai test.
 */
export const NEEDS = ['food', 'water', 'clean', 'energy', 'fun'] as const;
export type Need = (typeof NEEDS)[number];
export type Needs = Record<Need, number>;

export const ROOMS = ['kitchen', 'bath', 'bedroom', 'school', 'park'] as const;
export type Room = (typeof ROOMS)[number];
/** livello a cui si apre ogni stanza (le prime tre subito) */
export const ROOM_LEVEL: Record<Room, number> = { kitchen: 1, bath: 1, bedroom: 1, park: 2, school: 3 };

export type PuzzleKind = 'path' | 'sort' | 'exit' | 'seq';
export const PUZZLES: readonly PuzzleKind[] = ['path', 'sort', 'exit', 'seq'];

/** Attività che si completano con un rompicapo. */
export type Activity = 'cook' | 'bath' | 'potty' | 'school' | 'play';
export const ACTIVITY_PUZZLE: Record<Exclude<Activity, 'play'>, PuzzleKind> = { cook: 'sort', bath: 'path', potty: 'exit', school: 'seq' };

export const clamp = (v: number, lo = 0, hi = 100): number => Math.max(lo, Math.min(hi, v));

// ---------------------------------------------------------------- tempo che passa
/** punti persi al minuto da sveglio */
export const DECAY: Needs = { food: 2.4, water: 2.8, clean: 1.4, energy: 1.1, fun: 1.9 };
/** mentre il gioco è chiuso il tempo scorre molto più piano e non si scende mai sotto questa soglia */
export const OFFLINE_SLOW = 10;
export const OFFLINE_FLOOR = 18;
export const SLEEP_GAIN_PER_MIN = 150;

export interface Vitals { needs: Needs; gas: number; asleep: boolean }

/** Fa passare `minutes` minuti. `offline`: il gioco era chiuso (lento e con un pavimento, mai una punizione). */
export function tick(v: Vitals, minutes: number, offline = false): Vitals {
  const m = Math.max(0, Math.min(minutes, offline ? 60 * 24 * 3 : 5));
  const k = offline ? 1 / OFFLINE_SLOW : 1;
  const floor = offline ? OFFLINE_FLOOR : 0;
  const needs = { ...v.needs };
  for (const n of NEEDS) {
    if (n === 'energy' && v.asleep) { needs.energy = clamp(needs.energy + SLEEP_GAIN_PER_MIN * m); continue; }
    const rate = DECAY[n] * k * (v.asleep ? 0.35 : 1);
    needs[n] = Math.max(Math.min(needs[n], floor), clamp(needs[n] - rate * m));
  }
  // l'aria nel pancino cala piano da sola
  const gas = clamp(v.gas - 0.6 * m * k);
  // a batteria carica ci si sveglia da soli
  const asleep = v.asleep && needs.energy < 100 && !offline;
  return { needs, gas, asleep };
}

export type Mood = 'happy' | 'ok' | 'sad';
export function mood(n: Needs): Mood {
  const avg = NEEDS.reduce((s, k) => s + n[k], 0) / NEEDS.length;
  const low = Math.min(...NEEDS.map((k) => n[k]));
  if (low < 15 || avg < 35) return 'sad';
  return avg >= 62 && low >= 30 ? 'happy' : 'ok';
}

/** Il bisogno più urgente (quello più basso), se è sotto la soglia: guida la nuvoletta e la manina. */
export function urgent(n: Needs, below = 45): Need | null {
  let best: Need | null = null;
  for (const k of NEEDS) if (n[k] < below && (best === null || n[k] < n[best])) best = k;
  return best;
}

/** Dove si risolve ogni bisogno. */
export const NEED_ROOM: Record<Need, Room> = { food: 'kitchen', water: 'kitchen', clean: 'bath', energy: 'bedroom', fun: 'park' };

// ---------------------------------------------------------------- crescita
export const MAX_LEVEL = 30;
/** esperienza per passare dal livello l al successivo */
export const xpToNext = (l: number): number => 30 + 18 * l;
export function levelOf(xp: number): { level: number; into: number; need: number } {
  let level = 1;
  let rest = Math.max(0, Math.floor(xp));
  while (level < MAX_LEVEL && rest >= xpToNext(level)) { rest -= xpToNext(level); level++; }
  const need = xpToNext(level);
  return { level, into: level >= MAX_LEVEL ? need : rest, need };
}
/** tappe della crescita: cucciolo, bimbo, ragazzino, grande, re della puzzetta */
export const STAGE_LEVELS = [1, 4, 9, 16, 25] as const;
export function stageOf(level: number): number {
  let s = 0;
  STAGE_LEVELS.forEach((l, i) => { if (level >= l) s = i; });
  return s;
}
/** "giri" della cacchina e grandezza per ogni tappa */
export const STAGE_TIERS = [2, 3, 3, 4, 4] as const;
export const STAGE_SCALE = [0.74, 0.86, 0.98, 1.04, 1.14] as const;

// ---------------------------------------------------------------- cibo e bevande
export interface Food { id: string; price: number; food: number; water: number; gas: number; fun: number; level: number; drink?: boolean; shop?: boolean }
export const FOODS: readonly Food[] = [
  { id: 'apple', price: 4, food: 14, water: 4, gas: 2, fun: 0, level: 1 },
  { id: 'water', price: 3, food: 0, water: 32, gas: 0, fun: 0, level: 1, drink: true },
  { id: 'banana', price: 5, food: 18, water: 0, gas: 3, fun: 2, level: 1 },
  { id: 'beans', price: 5, food: 22, water: 0, gas: 38, fun: 0, level: 1 },
  { id: 'milk', price: 5, food: 8, water: 26, gas: 4, fun: 0, level: 2, drink: true },
  { id: 'carrot', price: 4, food: 15, water: 3, gas: 2, fun: 0, level: 2 },
  { id: 'soda', price: 7, food: 2, water: 24, gas: 34, fun: 10, level: 3, drink: true },
  { id: 'broccoli', price: 6, food: 20, water: 2, gas: 24, fun: 0, level: 3 },
  { id: 'cheese', price: 9, food: 24, water: 0, gas: 20, fun: 5, level: 4 },
  { id: 'icecream', price: 10, food: 12, water: 6, gas: 4, fun: 16, level: 5 },
  { id: 'pizza', price: 12, food: 36, water: 0, gas: 10, fun: 6, level: 6 },
  { id: 'cake', price: 15, food: 30, water: 0, gas: 8, fun: 20, level: 8 },
  // il minestrone non si compra: si cucina con il rompicapo dei barattoli
  { id: 'soup', price: 0, food: 48, water: 14, gas: 16, fun: 4, level: 1, shop: false },
];
export const foodById = (id: string): Food | undefined => FOODS.find((f) => f.id === id);
export const shopFoods = (): Food[] => FOODS.filter((f) => f.shop !== false);

// ---------------------------------------------------------------- armadio
export type Slot = 'hat' | 'eyes' | 'neck';
export const SLOTS: readonly Slot[] = ['hat', 'eyes', 'neck'];
export interface Wear { id: string; slot: Slot; price: number; level: number }
export const WEARS: readonly Wear[] = [
  { id: 'bow', slot: 'hat', price: 15, level: 1 },
  { id: 'cap', slot: 'hat', price: 20, level: 1 },
  { id: 'bib', slot: 'neck', price: 12, level: 1 },
  { id: 'round', slot: 'eyes', price: 25, level: 2 },
  { id: 'roll', slot: 'hat', price: 30, level: 3 },
  { id: 'bowtie', slot: 'neck', price: 28, level: 4 },
  { id: 'shades', slot: 'eyes', price: 40, level: 5 },
  { id: 'chef', slot: 'hat', price: 45, level: 7 },
  { id: 'medal', slot: 'neck', price: 40, level: 9 },
  { id: 'party', slot: 'hat', price: 50, level: 11 },
  { id: 'stars', slot: 'eyes', price: 60, level: 14 },
  { id: 'crown', slot: 'hat', price: 120, level: 18 },
];
export const wearById = (id: string): Wear | undefined => WEARS.find((w) => w.id === id);

// ---------------------------------------------------------------- amici del parco
export interface Friend { id: string; level: number }
export const FRIENDS: readonly Friend[] = [{ id: 'roll', level: 2 }, { id: 'soap', level: 5 }, { id: 'plunger', level: 8 }];
export const MAX_HEARTS = 5;

// ---------------------------------------------------------------- stato del gioco
export interface Game {
  needs: Needs;
  gas: number;
  asleep: boolean;
  xp: number;
  coins: number;
  /** ultimo istante in cui il tempo è stato fatto scorrere (ms) */
  last: number;
  inv: Record<string, number>;
  owned: string[];
  worn: Record<Slot, string>;
  solved: Record<PuzzleKind, number>;
  friends: Record<string, number>;
  /** quante volte ha fatto ogni cosa (statistiche buffe e progressi) */
  farts: number;
  tutorial: number;
}

export const DEFAULT_GAME: Game = {
  needs: { food: 38, water: 46, clean: 52, energy: 80, fun: 55 },
  gas: 30,
  asleep: false,
  xp: 0,
  coins: 12,
  last: 0,
  inv: { apple: 2, water: 2, beans: 1 },
  owned: [],
  worn: { hat: '', eyes: '', neck: '' },
  solved: { path: 0, sort: 0, exit: 0, seq: 0 },
  friends: {},
  farts: 0,
  tutorial: 0,
};

const num = (v: unknown, d: number, lo = 0, hi = Infinity): number => (typeof v === 'number' && Number.isFinite(v) ? Math.max(lo, Math.min(hi, v)) : d);

/** Ripulisce un salvataggio (campi mancanti, valori fuori scala, oggetti che non esistono più). */
export function sanitize(raw: Partial<Game> | null | undefined): Game {
  const d = structuredClone(DEFAULT_GAME);
  if (!raw || typeof raw !== 'object') return d;
  const g = raw as Record<string, unknown>;
  const needs = { ...d.needs };
  for (const n of NEEDS) needs[n] = num((g.needs as Record<string, unknown> | undefined)?.[n], d.needs[n], 0, 100);
  const inv: Record<string, number> = {};
  for (const f of FOODS) { const q = Math.floor(num((g.inv as Record<string, unknown> | undefined)?.[f.id], 0, 0, 99)); if (q > 0) inv[f.id] = q; }
  const owned = Array.isArray(g.owned) ? [...new Set(g.owned.filter((x): x is string => typeof x === 'string' && !!wearById(x)))] : [];
  const worn = { ...d.worn };
  for (const s of SLOTS) { const id = (g.worn as Record<string, unknown> | undefined)?.[s]; if (typeof id === 'string' && owned.includes(id) && wearById(id)?.slot === s) worn[s] = id; }
  const solved = { ...d.solved };
  for (const p of PUZZLES) solved[p] = Math.floor(num((g.solved as Record<string, unknown> | undefined)?.[p], 0, 0, 1e6));
  const friends: Record<string, number> = {};
  for (const f of FRIENDS) { const h = Math.floor(num((g.friends as Record<string, unknown> | undefined)?.[f.id], 0, 0, MAX_HEARTS)); if (h > 0) friends[f.id] = h; }
  return {
    needs, inv, owned, worn, solved, friends,
    gas: num(g.gas, d.gas, 0, 100), asleep: g.asleep === true, xp: Math.floor(num(g.xp, 0, 0, 1e7)), coins: Math.floor(num(g.coins, d.coins, 0, 1e6)),
    last: num(g.last, 0), farts: Math.floor(num(g.farts, 0)), tutorial: Math.floor(num(g.tutorial, 0, 0, 99)),
  };
}

/** Riprende il gioco dopo una pausa: fa scorrere il tempo passato da `g.last` a `now`. */
export function resume(g: Game, now: number): Game {
  if (!g.last || now <= g.last) return { ...g, last: now };
  const minutes = (now - g.last) / 60000;
  // meno di due minuti: come se il gioco fosse rimasto aperto
  const v = tick(g, minutes, minutes > 2);
  return { ...g, ...v, last: now };
}

// ---------------------------------------------------------------- azioni
export interface Outcome { game: Game; ok: boolean; levelUp?: number; stageUp?: number }

function withXp(g: Game, xp: number): Outcome {
  const before = levelOf(g.xp).level;
  const game = { ...g, xp: g.xp + Math.max(0, Math.round(xp)) };
  const after = levelOf(game.xp).level;
  const out: Outcome = { game, ok: true };
  if (after > before) { out.levelUp = after; if (stageOf(after) > stageOf(before)) out.stageUp = stageOf(after); }
  return out;
}

/** Pupou mangia o beve una cosa della dispensa. */
export function feed(g: Game, id: string): Outcome {
  const f = foodById(id);
  if (!f || !(g.inv[id] > 0) || g.asleep) return { game: g, ok: false };
  const inv = { ...g.inv, [id]: g.inv[id] - 1 };
  if (inv[id] <= 0) delete inv[id];
  const needs = { ...g.needs, food: clamp(g.needs.food + f.food), water: clamp(g.needs.water + f.water), fun: clamp(g.needs.fun + f.fun) };
  return withXp({ ...g, inv, needs, gas: clamp(g.gas + f.gas) }, 4);
}

export type FartSize = 0 | 1 | 2 | 3;
/** Grandezza della puzzetta in base all'aria nel pancino (0 = niente aria: solo solletico). */
export function fartSize(gas: number): FartSize {
  return gas >= 100 ? 3 : gas >= 60 ? 2 : gas >= 28 ? 1 : gas >= 10 ? 1 : 0;
}
/** Tocco su Pupou: se c'è aria esce una puzzetta (che fa ridere ma sporca un pochino). */
export function fart(g: Game): Outcome & { size: FartSize } {
  const size = fartSize(g.gas);
  if (size === 0 || g.asleep) return { game: { ...g, needs: { ...g.needs, fun: clamp(g.needs.fun + 1) } }, ok: false, size: 0 };
  const used = size === 3 ? 100 : size === 2 ? 45 : 22;
  const needs = { ...g.needs, fun: clamp(g.needs.fun + [0, 5, 9, 18][size]), clean: clamp(g.needs.clean - [0, 2, 4, 9][size]) };
  const o = withXp({ ...g, needs, gas: clamp(g.gas - used), farts: g.farts + 1 }, [0, 1, 2, 5][size]);
  return { ...o, size };
}

/** Monete ed esperienza per il rompicapo numero n (già risolti) di un tipo. */
export function puzzleReward(n: number): { coins: number; xp: number } {
  return { coins: 8 + Math.min(12, Math.floor(n / 3)), xp: 16 + Math.min(14, Math.floor(n / 4)) };
}

/** Attività completata (rompicapo risolto): premi e conseguenze. */
export function complete(g: Game, act: Activity, kind: PuzzleKind, friend?: string): Outcome & { coins: number } {
  const r = puzzleReward(g.solved[kind]);
  let game: Game = { ...g, coins: g.coins + r.coins, solved: { ...g.solved, [kind]: g.solved[kind] + 1 }, needs: { ...g.needs } };
  let xp = r.xp;
  if (act === 'cook') game.inv = { ...game.inv, soup: Math.min(99, (game.inv.soup ?? 0) + 2) };
  if (act === 'bath') game.needs.clean = 100;
  if (act === 'potty') { game.gas = 0; game.needs.fun = clamp(game.needs.fun + 22); game.needs.clean = clamp(game.needs.clean + 6); }
  if (act === 'school') { xp += 22; game.needs.fun = clamp(game.needs.fun + 6); game.needs.energy = clamp(game.needs.energy - 6); }
  if (act === 'play') {
    game.needs.fun = clamp(game.needs.fun + 38);
    game.needs.energy = clamp(game.needs.energy - 8);
    if (friend && FRIENDS.some((f) => f.id === friend)) game.friends = { ...game.friends, [friend]: Math.min(MAX_HEARTS, (game.friends[friend] ?? 0) + 1) };
  }
  return { ...withXp(game, xp), coins: r.coins };
}

/** Rompicapo di un gioco al parco: a rotazione tra quelli già visti, così cambia sempre. */
export function playKind(g: Game): PuzzleKind {
  const total = PUZZLES.reduce((s, p) => s + g.solved[p], 0);
  return PUZZLES[total % PUZZLES.length];
}

export function buyFood(g: Game, id: string): Outcome {
  const f = foodById(id);
  const level = levelOf(g.xp).level;
  if (!f || f.shop === false || level < f.level || g.coins < f.price || (g.inv[id] ?? 0) >= 99) return { game: g, ok: false };
  return { game: { ...g, coins: g.coins - f.price, inv: { ...g.inv, [id]: (g.inv[id] ?? 0) + 1 } }, ok: true };
}

/** Tocco su un capo dell'armadio: se non è suo lo compra (e lo indossa), altrimenti lo mette o lo toglie. */
export function tapWear(g: Game, id: string): Outcome & { bought?: boolean } {
  const w = wearById(id);
  if (!w) return { game: g, ok: false };
  if (!g.owned.includes(id)) {
    if (levelOf(g.xp).level < w.level || g.coins < w.price) return { game: g, ok: false };
    return { game: { ...g, coins: g.coins - w.price, owned: [...g.owned, id], worn: { ...g.worn, [w.slot]: id } }, ok: true, bought: true };
  }
  return { game: { ...g, worn: { ...g.worn, [w.slot]: g.worn[w.slot] === id ? '' : id } }, ok: true };
}

export const sleep = (g: Game, on: boolean): Game => ({ ...g, asleep: on });

/** Palla, solletico, saluto: un pizzico di allegria (mai infinita con un solo gesto). */
export const cheer = (g: Game, amount = 2): Game => ({ ...g, needs: { ...g.needs, fun: clamp(g.needs.fun + amount) } });

export const roomOpen = (room: Room, level: number): boolean => level >= ROOM_LEVEL[room];
export const friendOpen = (id: string, level: number): boolean => (FRIENDS.find((f) => f.id === id)?.level ?? 99) <= level;
