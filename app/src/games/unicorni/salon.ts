/**
 * Logica pura del "Salone degli Unicorni" (nessuna dipendenza da Phaser: testabile con Vitest).
 * Una visita = un unicorno arriva sporco e spettinato e passa per 5 tappe:
 * schiuma → risciacquo → spazzola → colore della criniera → accessori, poi la foto ricordo.
 */

export type UnicornId = 'perla' | 'rosa' | 'cielo' | 'pesca' | 'lavanda' | 'notte';
export type ColorId = 'pink' | 'turquoise' | 'lilac' | 'gold' | 'mint' | 'rainbow';
export type AccessoryId = 'bow' | 'star' | 'heart' | 'crown' | 'necklace' | 'flower' | 'glasses' | 'wings';
export type Slot = 'head' | 'neck' | 'body' | 'face' | 'back';
export type HornId = 'gold' | 'pearl' | 'rose';
export type Step = 'wash' | 'rinse' | 'brush' | 'color' | 'decorate';

export const STEPS: Step[] = ['wash', 'rinse', 'brush', 'color', 'decorate'];

export interface Unicorn {
  id: UnicornId;
  /** colore del manto (tinta sopra il disegno in grigio chiaro) */
  coat: string;
  /** colore della criniera all'arrivo (spettinata) */
  mane: string;
  horn: HornId;
  /** manto stellato (l'unicorno della notte) */
  stars?: boolean;
}

export const UNICORNS: Unicorn[] = [
  { id: 'perla', coat: '#ffffff', mane: '#ff9fd0', horn: 'gold' },
  { id: 'rosa', coat: '#ffd6e8', mane: '#b58cf0', horn: 'pearl' },
  { id: 'cielo', coat: '#cfeffd', mane: '#ffd96a', horn: 'gold' },
  { id: 'pesca', coat: '#ffdcc4', mane: '#79d9b0', horn: 'rose' },
  { id: 'lavanda', coat: '#e4d6ff', mane: '#5fd3d0', horn: 'pearl' },
  { id: 'notte', coat: '#6a70cc', mane: '#ffd25a', horn: 'gold', stars: true },
];
export const unicornById = (id: string): Unicorn => UNICORNS.find((u) => u.id === id) ?? UNICORNS[0];
export const isUnicornId = (id: unknown): id is UnicornId => UNICORNS.some((u) => u.id === id);

export const COLORS: { id: ColorId; hex: string }[] = [
  { id: 'pink', hex: '#ff8cc6' },
  { id: 'turquoise', hex: '#4fd3cf' },
  { id: 'lilac', hex: '#b58cf0' },
  { id: 'gold', hex: '#ffd04d' },
  { id: 'mint', hex: '#79e0a6' },
  // l'arcobaleno ha una texture sua (non è una tinta): qui serve solo il colore del barattolo
  { id: 'rainbow', hex: '#ffffff' },
];
export const colorHex = (id: string): string => (COLORS.find((c) => c.id === id) ?? COLORS[0]).hex;
export const isColorId = (id: unknown): id is ColorId => COLORS.some((c) => c.id === id);

export interface Accessory {
  id: AccessoryId;
  slot: Slot;
}

export const ACCESSORIES: Accessory[] = [
  { id: 'bow', slot: 'head' },
  { id: 'star', slot: 'body' },
  { id: 'heart', slot: 'body' },
  { id: 'crown', slot: 'head' },
  { id: 'necklace', slot: 'neck' },
  { id: 'flower', slot: 'head' },
  { id: 'glasses', slot: 'face' },
  { id: 'wings', slot: 'back' },
];
export const accessoryById = (id: string): Accessory | undefined => ACCESSORIES.find((a) => a.id === id);

/** Adesivi sul manto (stelle, cuori): al massimo tanti quanti i posti preparati; poi si sostituisce il più vecchio. */
export const MAX_STICKERS = 6;

/** Si parte con: Perla, 3 colori, fiocco, stelline e cuoricini. */
export const START = {
  unicorns: ['perla'] as UnicornId[],
  colors: ['pink', 'turquoise', 'lilac'] as ColorId[],
  accessories: ['bow', 'star', 'heart'] as AccessoryId[],
};

export type Reward =
  | { kind: 'unicorn'; id: UnicornId }
  | { kind: 'accessory'; id: AccessoryId }
  | { kind: 'color'; id: ColorId };

/** Una sorpresa a ogni foto ricordo, in quest'ordine; poi solo festa. */
export const REWARDS: Reward[] = [
  { kind: 'accessory', id: 'crown' },
  { kind: 'unicorn', id: 'rosa' },
  { kind: 'color', id: 'gold' },
  { kind: 'accessory', id: 'necklace' },
  { kind: 'unicorn', id: 'cielo' },
  { kind: 'accessory', id: 'flower' },
  { kind: 'color', id: 'mint' },
  { kind: 'unicorn', id: 'pesca' },
  { kind: 'accessory', id: 'glasses' },
  { kind: 'unicorn', id: 'lavanda' },
  { kind: 'accessory', id: 'wings' },
  { kind: 'color', id: 'rainbow' },
  { kind: 'unicorn', id: 'notte' },
];

/** Sorpresa ottenuta con la foto numero `visits` (1 = la prima). */
export function rewardFor(visits: number): Reward | null {
  return visits >= 1 ? REWARDS[visits - 1] ?? null : null;
}

export interface Unlocked { unicorns: UnicornId[]; colors: ColorId[]; accessories: AccessoryId[]; }

/** Tutto ciò che è sbloccato dopo `visits` foto ricordo. */
export function unlocked(visits: number): Unlocked {
  const got = REWARDS.slice(0, Math.max(0, visits));
  const has = (k: Reward['kind'], id: string) => got.some((r) => r.kind === k && r.id === id);
  return {
    unicorns: UNICORNS.map((u) => u.id).filter((id) => START.unicorns.includes(id) || has('unicorn', id)),
    colors: COLORS.map((c) => c.id).filter((id) => START.colors.includes(id) || has('color', id)),
    accessories: ACCESSORIES.map((a) => a.id).filter((id) => START.accessories.includes(id) || has('accessory', id)),
  };
}

/**
 * Chi arriva al salone: prima un unicorno sbloccato e mai pettinato (il nuovo arrivato),
 * altrimenti uno a caso tra quelli sbloccati, mai lo stesso due volte di fila.
 */
export function nextUnicorn(visits: number, groomed: readonly string[], prev: string | null, rnd: () => number = Math.random): UnicornId {
  const un = unlocked(visits).unicorns;
  const fresh = un.find((id) => !groomed.includes(id));
  if (fresh) return fresh;
  const pool = un.length > 1 ? un.filter((id) => id !== prev) : un;
  return pool[Math.min(pool.length - 1, Math.floor(rnd() * pool.length))];
}

// ---------- Strofinare ----------
/**
 * Quota della superficie da strofinare per finire una tappa (schiuma, risciacquo, spazzola, colore).
 * Insieme al raggio del pennello (RUB_RADIUS) decide quanto dura una tappa. Le tappe di pulizia sono state
 * allungate di circa l'80% su richiesta di Gaetano (simulazione di uno strofinio "da bambino" sulla sagoma vera).
 */
export const RUB_GOAL: Record<Exclude<Step, 'decorate'>, number> = { wash: 0.6, rinse: 0.56, brush: 0.66, color: 0.5 };

/** Raggio del pennello di ogni tappa (unità della tela dell'unicorno). */
export const RUB_RADIUS: Record<Exclude<Step, 'decorate'>, number> = { wash: 52, rinse: 66, brush: 54, color: 60 };

/** Avanzamento 0..1 della tappa, data la quota strofinata. */
export function rubProgress(step: Exclude<Step, 'decorate'>, fraction: number): number {
  return Math.max(0, Math.min(1, fraction / RUB_GOAL[step]));
}

// ---------- Accessori ----------
/**
 * Mette un accessorio: per testa, collo, viso e schiena ne resta uno solo (il nuovo sostituisce il vecchio);
 * gli adesivi del manto si aggiungono fino a MAX_STICKERS, poi il nuovo prende il posto del più vecchio.
 * L'elenco è in ordine di applicazione: così la foto si ricompone uguale.
 */
export function wear(list: readonly AccessoryId[], id: AccessoryId): AccessoryId[] {
  const a = accessoryById(id);
  if (!a) return [...list];
  if (a.slot === 'body') {
    const out = [...list, id];
    const stickers = out.filter((x) => accessoryById(x)?.slot === 'body');
    if (stickers.length > MAX_STICKERS) out.splice(out.findIndex((x) => accessoryById(x)?.slot === 'body'), 1);
    return out;
  }
  return [...list.filter((x) => accessoryById(x)?.slot !== a.slot), id];
}

/** Dove va ogni accessorio: gli adesivi occupano i posti del manto nell'ordine (indice 0..MAX_STICKERS-1). */
export function layout(list: readonly AccessoryId[]): { id: AccessoryId; slot: Slot; spot: number }[] {
  let n = 0;
  return list.filter((id) => accessoryById(id)).map((id) => {
    const slot = accessoryById(id)!.slot;
    return { id, slot, spot: slot === 'body' ? n++ : 0 };
  });
}

/** La foto compare dopo almeno un accessorio. */
export const canPhoto = (list: readonly AccessoryId[]): boolean => list.length >= 1;

// ---------- Album ----------
/** Look di una foto ricordo: unicorno, colore della criniera, accessori in ordine di applicazione. */
export interface Look {
  u: UnicornId;
  c: ColorId;
  a: AccessoryId[];
}

/** Ultime foto nell'album (la più recente per prima). */
export const ALBUM_MAX = 6;
export function addPhoto(list: readonly Look[], look: Look, max = ALBUM_MAX): Look[] {
  return [look, ...list].slice(0, max);
}

/** Scarta le foto salvate non valide (salvataggi vecchi o manomessi). */
export function sanitizeLooks(list: unknown): Look[] {
  if (!Array.isArray(list)) return [];
  const out: Look[] = [];
  for (const l of list) {
    if (!l || typeof l !== 'object') continue;
    const { u, c, a } = l as Record<string, unknown>;
    if (!isUnicornId(u) || !isColorId(c) || !Array.isArray(a)) continue;
    let acc: AccessoryId[] = [];
    for (const x of a) if (typeof x === 'string' && accessoryById(x)) acc = wear(acc, x as AccessoryId);
    out.push({ u, c, a: acc });
  }
  return out.slice(0, ALBUM_MAX);
}

/** Unicorni pettinati almeno una volta: solo id validi, senza doppioni. */
export function sanitizeGroomed(list: unknown): UnicornId[] {
  if (!Array.isArray(list)) return [];
  return UNICORNS.map((u) => u.id).filter((id) => list.includes(id));
}
