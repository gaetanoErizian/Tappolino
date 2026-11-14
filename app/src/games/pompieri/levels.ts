/** Livelli, camion sbloccabili e medaglie (logica pura, testata con Vitest). */

export interface LevelCfg {
  cols: number;
  rows: number;
  /** fiamme da spegnere per finire il livello */
  goal: number;
  /** ogni quanti ms compare una nuova fiamma */
  spawnMs: number;
  /** fiamme contemporanee al massimo */
  maxFlames: number;
  /** compare il gattino da salvare */
  cat: boolean;
}

const LEVELS: LevelCfg[] = [
  { cols: 3, rows: 2, goal: 6, spawnMs: 1900, maxFlames: 2, cat: false },
  { cols: 4, rows: 2, goal: 8, spawnMs: 1700, maxFlames: 2, cat: true },
  { cols: 4, rows: 3, goal: 10, spawnMs: 1550, maxFlames: 3, cat: true },
  { cols: 5, rows: 3, goal: 10, spawnMs: 1400, maxFlames: 3, cat: true },
  { cols: 5, rows: 3, goal: 12, spawnMs: 1300, maxFlames: 3, cat: true },
  { cols: 6, rows: 3, goal: 12, spawnMs: 1200, maxFlames: 4, cat: true },
  { cols: 6, rows: 3, goal: 14, spawnMs: 1100, maxFlames: 4, cat: true },
  { cols: 6, rows: 3, goal: 14, spawnMs: 1000, maxFlames: 4, cat: true },
  { cols: 6, rows: 3, goal: 15, spawnMs: 950, maxFlames: 5, cat: true },
  { cols: 6, rows: 3, goal: 15, spawnMs: 900, maxFlames: 5, cat: true },
];

/** Dopo l'ultimo livello si continua all'infinito con la difficoltà massima (mai più dura di così). */
export function levelCfg(index: number): LevelCfg {
  return LEVELS[Math.max(0, Math.min(index, LEVELS.length - 1))];
}

export const LEVEL_COUNT = LEVELS.length;

/** Colori dei palazzi, a rotazione. */
export const WALLS = [0xf2a65a, 0x7cc6c0, 0xb9a3e3, 0xf28b82, 0x8fc66a, 0xf6c35b];
export const wallColor = (index: number): number => WALLS[index % WALLS.length];

export type SirenKind = 'hilo' | 'wail' | 'yelp' | 'honk' | 'tune' | 'space';
export interface TruckDef { id: string; body: string; dark: string; unlockAt: number; siren: SirenKind; }

/** unlockAt = livelli completati necessari. */
export const TRUCKS: TruckDef[] = [
  { id: 'red', body: '#ef4a35', dark: '#b8281c', unlockAt: 0, siren: 'hilo' },
  { id: 'yellow', body: '#ffc229', dark: '#d48f00', unlockAt: 2, siren: 'wail' },
  { id: 'blue', body: '#3a8ee8', dark: '#1f5fb0', unlockAt: 4, siren: 'yelp' },
  { id: 'green', body: '#3cc46a', dark: '#22894a', unlockAt: 6, siren: 'honk' },
  { id: 'pink', body: '#ff6fb5', dark: '#d1458e', unlockAt: 8, siren: 'tune' },
  { id: 'purple', body: '#9b5de5', dark: '#6a38b5', unlockAt: 10, siren: 'space' },
];

export const truckById = (id: string): TruckDef => TRUCKS.find((t) => t.id === id) ?? TRUCKS[0];

export function isUnlocked(t: TruckDef, levelsDone: number): boolean {
  return levelsDone >= t.unlockAt;
}

/** Camion sbloccati esattamente passando da `before` a `after` livelli completati. */
export function newlyUnlocked(before: number, after: number): TruckDef[] {
  return TRUCKS.filter((t) => t.unlockAt > before && t.unlockAt <= after);
}

export type MedalKind = 'bronze' | 'silver' | 'gold';
/** Medaglia del livello (indice 0-based): bronzo, argento, oro a rotazione; ogni 3° livello oro. */
export function medalKind(levelIndex: number): MedalKind {
  return (['bronze', 'silver', 'gold'] as const)[levelIndex % 3];
}

/** Indice della cella libera scelta a caso (o -1). Funzione pura per i test. */
export function pickFreeCell(busy: boolean[], rnd: () => number = Math.random): number {
  const free = busy.map((b, i) => (b ? -1 : i)).filter((i) => i >= 0);
  return free.length ? free[Math.floor(rnd() * free.length)] : -1;
}
