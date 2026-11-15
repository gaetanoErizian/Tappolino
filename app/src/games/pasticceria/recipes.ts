/**
 * Logica pura di "Pasticceria Magica" (nessuna dipendenza da Phaser: testabile con Vitest).
 * Un turno = un dolce in 4 passi: ingredienti → mescola → forno (o freezer) → decora, poi lo mangia un cliente.
 */

export type RecipeId = 'cupcake' | 'cookie' | 'cake' | 'gelato';
export type IngredientId = 'flour' | 'egg' | 'milk' | 'sugar' | 'butter' | 'choco' | 'strawberry' | 'cream';
export type ToppingId = 'sprinkles' | 'cherry' | 'heart' | 'star' | 'strawberry' | 'chocochip' | 'candy' | 'flower';
export type ColorId = 'pink' | 'vanilla' | 'choco' | 'mint' | 'lemon' | 'berry';
export type CustomerId = 'bunny' | 'bear' | 'cat' | 'fox';

/** Zona dove si appoggiano le decorazioni, relativa al centro del dolce (ellisse). */
export interface Area { x: number; y: number; rx: number; ry: number; }

export interface Recipe {
  id: RecipeId;
  ingredients: IngredientId[];
  /** colore dell'impasto (#rrggbb) */
  batter: string;
  /** true: si congela nel freezer invece di cuocere nel forno */
  cold: boolean;
  /** spostamento verticale della glassa rispetto al centro della base */
  frostDy: number;
  /** zona delle decorazioni */
  area: Area;
}

export const RECIPES: Recipe[] = [
  { id: 'cupcake', ingredients: ['flour', 'egg', 'milk', 'sugar'], batter: '#f6d8a0', cold: false, frostDy: -120, area: { x: 0, y: -150, rx: 120, ry: 70 } },
  { id: 'cookie', ingredients: ['flour', 'butter', 'sugar', 'choco'], batter: '#e2b072', cold: false, frostDy: -14, area: { x: 0, y: -20, rx: 150, ry: 62 } },
  { id: 'cake', ingredients: ['flour', 'egg', 'sugar', 'strawberry'], batter: '#f8c4c8', cold: false, frostDy: -70, area: { x: 0, y: -112, rx: 170, ry: 46 } },
  { id: 'gelato', ingredients: ['milk', 'cream', 'sugar', 'strawberry'], batter: '#fbd6e4', cold: true, frostDy: -110, area: { x: 0, y: -150, rx: 105, ry: 92 } },
];

export const recipeById = (id: string): Recipe => RECIPES.find((r) => r.id === id) ?? RECIPES[0];

export const TOPPINGS: ToppingId[] = ['sprinkles', 'cherry', 'heart', 'star', 'strawberry', 'chocochip', 'candy', 'flower'];

export const COLORS: { id: ColorId; hex: string }[] = [
  { id: 'pink', hex: '#ff8fc2' },
  { id: 'vanilla', hex: '#fff1d2' },
  { id: 'choco', hex: '#9a6440' },
  { id: 'mint', hex: '#8fe3c2' },
  { id: 'lemon', hex: '#ffe36a' },
  { id: 'berry', hex: '#a88cff' },
];
export const colorHex = (id: string): string => (COLORS.find((c) => c.id === id) ?? COLORS[0]).hex;

export const CUSTOMERS: CustomerId[] = ['bunny', 'bear', 'cat', 'fox'];

/** Si parte con: cupcake, 3 decorazioni, 3 colori di glassa. */
export const START = {
  recipes: ['cupcake'] as RecipeId[],
  toppings: ['sprinkles', 'cherry', 'heart'] as ToppingId[],
  colors: ['pink', 'vanilla', 'choco'] as ColorId[],
};

export type Reward =
  | { kind: 'recipe'; id: RecipeId }
  | { kind: 'topping'; id: ToppingId }
  | { kind: 'color'; id: ColorId };

/** Una sorpresa a ogni dolce servito, nell'ordine; poi solo festa. */
export const REWARDS: Reward[] = [
  { kind: 'topping', id: 'star' },
  { kind: 'recipe', id: 'cookie' },
  { kind: 'topping', id: 'strawberry' },
  { kind: 'color', id: 'mint' },
  { kind: 'recipe', id: 'cake' },
  { kind: 'topping', id: 'chocochip' },
  { kind: 'recipe', id: 'gelato' },
  { kind: 'color', id: 'lemon' },
  { kind: 'topping', id: 'candy' },
  { kind: 'topping', id: 'flower' },
  { kind: 'color', id: 'berry' },
];

/** Sorpresa ottenuta servendo il dolce numero `served` (1 = il primo). */
export function rewardFor(served: number): Reward | null {
  return served >= 1 ? REWARDS[served - 1] ?? null : null;
}

/** Tutto ciò che è sbloccato dopo `served` dolci serviti. */
export function unlocked(served: number): { recipes: RecipeId[]; toppings: ToppingId[]; colors: ColorId[] } {
  const got = REWARDS.slice(0, Math.max(0, served));
  const pick = <K extends Reward['kind']>(k: K) => got.filter((r) => r.kind === k).map((r) => r.id);
  return {
    recipes: RECIPES.map((r) => r.id).filter((id) => START.recipes.includes(id) || pick('recipe').includes(id)),
    toppings: TOPPINGS.filter((id) => START.toppings.includes(id) || pick('topping').includes(id)),
    colors: COLORS.map((c) => c.id).filter((id) => START.colors.includes(id) || pick('color').includes(id)),
  };
}

// ---------- Mescolare ----------
/** Movimento del dito (unità di design) per avere un impasto liscio. */
export const MIX_GOAL = 2600;
export const mixProgress = (dist: number): number => Math.max(0, Math.min(1, dist / MIX_GOAL));

/** Punto più vicino dentro un'ellisse (per tenere la frusta nella ciotola). */
export function clampToEllipse(px: number, py: number, cx: number, cy: number, rx: number, ry: number): { x: number; y: number } {
  const dx = (px - cx) / rx, dy = (py - cy) / ry;
  const d = Math.hypot(dx, dy);
  if (d <= 1) return { x: px, y: py };
  return { x: cx + (dx / d) * rx, y: cy + (dy / d) * ry };
}

// ---------- Decorazioni ----------
export const MAX_TOPPINGS = 14;
/** Decorazioni minime (dopo la glassa) per far comparire il pulsante "servi". */
export const MIN_TOPPINGS = 2;

/** Dolce creato dal bambino: ricetta, glassa (o null) e decorazioni [id, dx, dy] relative al centro. */
export interface Creation {
  r: RecipeId;
  c: ColorId | null;
  t: [ToppingId, number, number][];
}

/** Ultimi dolci in vetrina (il più recente per primo). */
export const SHOWCASE_MAX = 6;
export function addCreation(list: Creation[], c: Creation, max = SHOWCASE_MAX): Creation[] {
  return [c, ...list].slice(0, max);
}

/** Scarta dolci salvati non validi (salvataggi vecchi o manomessi). */
export function sanitizeCreations(list: unknown): Creation[] {
  if (!Array.isArray(list)) return [];
  const out: Creation[] = [];
  for (const c of list) {
    if (!c || typeof c !== 'object') continue;
    const { r, c: col, t } = c as Record<string, unknown>;
    if (!RECIPES.some((x) => x.id === r)) continue;
    if (col !== null && !COLORS.some((x) => x.id === col)) continue;
    if (!Array.isArray(t)) continue;
    const tops = t.filter((x): x is [ToppingId, number, number] => Array.isArray(x) && x.length === 3
      && TOPPINGS.includes(x[0]) && Number.isFinite(x[1]) && Number.isFinite(x[2])).slice(0, MAX_TOPPINGS);
    out.push({ r: r as RecipeId, c: col as ColorId | null, t: tops });
  }
  return out.slice(0, SHOWCASE_MAX);
}

/** Punto dentro la zona decorazioni: casuale (tocco) o il più vicino al punto di rilascio. */
export function placeInArea(a: Area, dx: number, dy: number): { x: number; y: number } {
  return clampToEllipse(dx, dy, a.x, a.y, a.rx, a.ry);
}
export function randomInArea(a: Area, rnd: () => number = Math.random): { x: number; y: number } {
  const ang = rnd() * Math.PI * 2, rr = Math.sqrt(rnd()) * 0.85;
  return { x: Math.round(a.x + Math.cos(ang) * a.rx * rr), y: Math.round(a.y + Math.sin(ang) * a.ry * rr) };
}

/** Cliente successivo, mai uguale al precedente. */
export function nextCustomer(prev: string | null, rnd: () => number = Math.random): CustomerId {
  const pool = CUSTOMERS.filter((c) => c !== prev);
  return pool[Math.min(pool.length - 1, Math.floor(rnd() * pool.length))];
}
