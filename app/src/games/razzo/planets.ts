/**
 * Razzo tra le Stelle — collezione (logica pura, testata): pianeti da visitare e razzi da sbloccare.
 * Un viaggio porta sempre a un pianeta; i pianeti si scoprono in ordine, poi si torna a trovarli a caso.
 * I razzi nuovi arrivano con i viaggi fatti (mai con acquisti o valute).
 */

export const PLANET_IDS = ['luna', 'anelli', 'bolle', 'giungla', 'caramella', 'ghiaccio', 'vulcano', 'arcobaleno'] as const;
export type PlanetId = (typeof PLANET_IDS)[number];

export interface Planet {
  id: PlanetId;
  /** colori della sfera: luce, base, ombra */
  light: string;
  base: string;
  dark: string;
  /** tinta della nebulosa durante il viaggio verso questo pianeta */
  nebula: 'pink' | 'teal' | 'gold' | 'violet';
  /** tono della risatina (velocità di lettura del suono) */
  giggle: number;
}

export const PLANETS: Planet[] = [
  { id: 'luna', light: '#fffbe8', base: '#e9e1c6', dark: '#a89c7a', nebula: 'violet', giggle: 1 },
  { id: 'anelli', light: '#ffe3b8', base: '#f4a96a', dark: '#c46a3a', nebula: 'gold', giggle: 0.9 },
  { id: 'bolle', light: '#c9f6ff', base: '#4fc3e8', dark: '#1f7ab0', nebula: 'teal', giggle: 1.12 },
  { id: 'giungla', light: '#d6f7b0', base: '#6cc24a', dark: '#2f7a2a', nebula: 'teal', giggle: 0.95 },
  { id: 'caramella', light: '#ffe0ef', base: '#ff8cc0', dark: '#d2468a', nebula: 'pink', giggle: 1.2 },
  { id: 'ghiaccio', light: '#ffffff', base: '#bfe6ff', dark: '#6aa6d8', nebula: 'violet', giggle: 1.06 },
  { id: 'vulcano', light: '#ffd6a0', base: '#f07a3a', dark: '#a8401e', nebula: 'gold', giggle: 0.85 },
  { id: 'arcobaleno', light: '#ffffff', base: '#b89cff', dark: '#6a4cc4', nebula: 'pink', giggle: 1.15 },
];

/** Il pianeta di casa (partenza di ogni viaggio): non fa parte della collezione. */
export const HOME = { light: '#c9f0ff', base: '#4aa8ef', dark: '#1f5fb0' };

export const isPlanetId = (v: unknown): v is PlanetId => typeof v === 'string' && (PLANET_IDS as readonly string[]).includes(v);
export const planetById = (id: PlanetId): Planet => PLANETS.find((p) => p.id === id)!;

/**
 * Prossima meta: il primo pianeta non ancora visitato; a collezione completa un pianeta a caso,
 * mai lo stesso del viaggio precedente.
 */
export function nextPlanet(visited: readonly string[], last: string, rnd: () => number = Math.random): PlanetId {
  const todo = PLANET_IDS.find((id) => !visited.includes(id));
  if (todo) return todo;
  const pool = PLANET_IDS.filter((id) => id !== last);
  return pool[Math.min(pool.length - 1, Math.floor(rnd() * pool.length))];
}

/** Aggiunge un pianeta alla collezione (senza doppioni). */
export function addVisited(visited: readonly string[], id: PlanetId): string[] {
  return visited.includes(id) ? [...visited] : [...visited, id];
}

/** Ripulisce un elenco salvato: solo id validi, senza doppioni, nell'ordine originale. */
export function sanitizePlanets(list: readonly unknown[]): PlanetId[] {
  const out: PlanetId[] = [];
  for (const v of list) if (isPlanetId(v) && !out.includes(v)) out.push(v);
  return out;
}

// ---------------------------------------------------------------- razzi

export const ROCKET_IDS = ['rosso', 'blu', 'giallo', 'verde', 'viola', 'oro'] as const;
export type RocketId = (typeof ROCKET_IDS)[number];

export interface Rocket {
  id: RocketId;
  /** viaggi da completare per sbloccarlo */
  at: number;
  body: string;
  trim: string;
  fin: string;
  pattern: 'stripes' | 'dots' | 'stars' | 'band' | 'checker' | 'zigzag';
  /** sagoma: snella o tonda */
  shape: 'slim' | 'round';
}

export const ROCKETS: Rocket[] = [
  { id: 'rosso', at: 0, body: '#f4f1ec', trim: '#ff5a5f', fin: '#ff5a5f', pattern: 'band', shape: 'slim' },
  { id: 'blu', at: 1, body: '#5aa8ff', trim: '#ffd23f', fin: '#ffd23f', pattern: 'stripes', shape: 'slim' },
  { id: 'giallo', at: 2, body: '#ffd23f', trim: '#36a9f0', fin: '#ff8a3d', pattern: 'dots', shape: 'round' },
  { id: 'verde', at: 4, body: '#7ad66a', trim: '#ffffff', fin: '#2f9a5a', pattern: 'zigzag', shape: 'slim' },
  { id: 'viola', at: 6, body: '#b48cff', trim: '#ff8cc0', fin: '#ff8cc0', pattern: 'stars', shape: 'round' },
  { id: 'oro', at: 8, body: '#ffcf3a', trim: '#ff5a5f', fin: '#e08a00', pattern: 'checker', shape: 'slim' },
];

export const isRocketId = (v: unknown): v is RocketId => typeof v === 'string' && (ROCKET_IDS as readonly string[]).includes(v);
export const rocketById = (id: RocketId): Rocket => ROCKETS.find((r) => r.id === id)!;

/** Razzi disponibili dopo un certo numero di viaggi. */
export function rocketsUnlocked(trips: number): RocketId[] {
  return ROCKETS.filter((r) => trips >= r.at).map((r) => r.id);
}

/** Razzi che si sbloccano passando da `before` a `after` viaggi. */
export function newRockets(before: number, after: number): RocketId[] {
  return ROCKETS.filter((r) => r.at > before && r.at <= after).map((r) => r.id);
}

/** Razzo valido da usare: quello scelto se sbloccato, altrimenti il primo. */
export function usableRocket(choice: unknown, trips: number): RocketId {
  return isRocketId(choice) && rocketsUnlocked(trips).includes(choice) ? choice : 'rosso';
}
