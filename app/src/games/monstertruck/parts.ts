/**
 * Officina dei Monster Truck — catalogo di pezzi e piste, sblocchi e guasti da riparare (logica pura, testata).
 * Collezione: ogni gara finita sblocca un pezzo nuovo (colore, ruote, adesivo) o una pista nuova.
 */

export const COLORS = [
  { id: 'arancio', hex: '#ff8a1e' },
  { id: 'rosso', hex: '#ef3b3b' },
  { id: 'blu', hex: '#2f7cf0' },
  { id: 'verde', hex: '#2fbf5a' },
  { id: 'giallo', hex: '#ffcc1f' },
  { id: 'viola', hex: '#9a5cf0' },
  { id: 'rosa', hex: '#ff6fb5' },
  { id: 'oro', hex: '#e8b53a' },
] as const;

export const WHEELS = [
  { id: 'classica', rim: '#c9d2e0', hub: '#7a869c' },
  { id: 'stella', rim: '#ffd23f', hub: '#f08c00' },
  { id: 'fiamme', rim: '#ff6a2a', hub: '#c4361b' },
  { id: 'arcobaleno', rim: '#4fa3ff', hub: '#ff5e9a' },
  { id: 'oro', rim: '#ffd86a', hub: '#c78a00' },
] as const;

/** Adesivi sulla fiancata ("nessuno" è sempre disponibile). */
export const STICKERS = ['nessuno', 'stella', 'fulmine', 'fiamme', 'cuore', 'sorriso', 'scacchi'] as const;

/** Piste: ambientazione, colori e carattere del percorso. */
export const TRACKS = [
  { id: 'arena', sky: ['#5fb8ff', '#ffe2a8'], ground: ['#f0a24a', '#c87632', '#8f4c1e'], edge: '#ffc46a', mix: { ramp: 3, boxes: 3, hills: 2, bumps: 1 } },
  { id: 'dune', sky: ['#7fcbff', '#fff1c4'], ground: ['#f8d47a', '#e2ac4a', '#b9802e'], edge: '#ffe7a6', mix: { ramp: 2, boxes: 1, hills: 4, bumps: 1 } },
  { id: 'cantiere', sky: ['#8fd2ff', '#fff4d8'], ground: ['#a7adb6', '#80868f', '#5a6068'], edge: '#ffd23f', mix: { ramp: 2, boxes: 4, hills: 1, bumps: 3 } },
  { id: 'canyon', sky: ['#ff8f5a', '#ffd98a'], ground: ['#d9703f', '#ad4d2b', '#7a321c'], edge: '#f6a066', mix: { ramp: 4, boxes: 1, hills: 2, bumps: 2 } },
  { id: 'notte', sky: ['#141a52', '#55408f'], ground: ['#6a6f8c', '#4c5068', '#33364a'], edge: '#ffb31f', mix: { ramp: 3, boxes: 3, hills: 2, bumps: 2 } },
] as const;

export type ColorId = (typeof COLORS)[number]['id'];
export type WheelId = (typeof WHEELS)[number]['id'];
export type StickerId = (typeof STICKERS)[number];
export type TrackId = (typeof TRACKS)[number]['id'];
export type Track = (typeof TRACKS)[number];

export const COLOR_IDS = COLORS.map((c) => c.id) as ColorId[];
export const WHEEL_IDS = WHEELS.map((w) => w.id) as WheelId[];
export const TRACK_IDS = TRACKS.map((t) => t.id) as TrackId[];

export type Kind = 'color' | 'wheel' | 'sticker' | 'track';
export interface Unlock { kind: Kind; id: string }

/** Pezzi e piste disponibili dall'inizio. */
export const START: Record<Kind, string[]> = {
  color: ['arancio', 'rosso', 'blu'],
  wheel: ['classica'],
  sticker: ['nessuno', 'stella'],
  track: ['arena'],
};

/** Un premio per ogni gara finita, nell'ordine: le piste ogni tre-quattro gare, in mezzo i pezzi. */
export const UNLOCKS: Unlock[] = [
  { kind: 'wheel', id: 'stella' },
  { kind: 'track', id: 'dune' },
  { kind: 'color', id: 'verde' },
  { kind: 'sticker', id: 'fulmine' },
  { kind: 'track', id: 'cantiere' },
  { kind: 'wheel', id: 'fiamme' },
  { kind: 'color', id: 'giallo' },
  { kind: 'sticker', id: 'fiamme' },
  { kind: 'track', id: 'canyon' },
  { kind: 'color', id: 'viola' },
  { kind: 'wheel', id: 'arcobaleno' },
  { kind: 'sticker', id: 'cuore' },
  { kind: 'track', id: 'notte' },
  { kind: 'color', id: 'rosa' },
  { kind: 'sticker', id: 'sorriso' },
  { kind: 'wheel', id: 'oro' },
  { kind: 'sticker', id: 'scacchi' },
  { kind: 'color', id: 'oro' },
];

/** Tutto ciò che è sbloccato dopo `races` gare finite. */
export function unlocked(races: number): Record<Kind, string[]> {
  const out: Record<Kind, string[]> = { color: [...START.color], wheel: [...START.wheel], sticker: [...START.sticker], track: [...START.track] };
  for (const u of UNLOCKS.slice(0, Math.max(0, Math.floor(races)))) out[u.kind].push(u.id);
  return out;
}

export const isUnlocked = (kind: Kind, id: string, races: number): boolean => unlocked(races)[kind].includes(id);

/** Il premio della gara che porta da `before` a `after` gare finite (null a collezione completa). */
export function prizeOf(before: number, after: number): Unlock | null {
  return after > before && before < UNLOCKS.length ? UNLOCKS[before] : null;
}

/** Quanti pezzi e piste ci sono in tutto e quanti sono sbloccati. */
export const TOTAL = START.color.length + START.wheel.length + START.sticker.length + START.track.length + UNLOCKS.length;
export const ownedCount = (races: number): number => Math.min(TOTAL, TOTAL - UNLOCKS.length + Math.max(0, Math.floor(races)));

/** Ciò che è salvato deve essere valido e sbloccato; altrimenti si torna al primo della lista. */
export function usable<K extends Kind>(kind: K, id: unknown, races: number): string {
  const list = unlocked(races)[kind];
  return typeof id === 'string' && list.includes(id) ? id : list[0];
}

export const isTrackId = (id: unknown): id is TrackId => typeof id === 'string' && (TRACK_IDS as string[]).includes(id);
export const trackById = (id: TrackId): Track => TRACKS.find((t) => t.id === id)!;
export const colorHex = (id: string): string => COLORS.find((c) => c.id === id)?.hex ?? COLORS[0].hex;

/**
 * Pista della prossima gara: prima quelle sbloccate e mai provate (dalla più nuova), poi quella scelta,
 * altrimenti si gira tra le piste sbloccate.
 */
export function nextTrack(races: number, raced: readonly string[], chosen: unknown): TrackId {
  const open = unlocked(races).track as TrackId[];
  const fresh = open.filter((id) => !raced.includes(id));
  if (fresh.length) return fresh[fresh.length - 1];
  if (isTrackId(chosen) && open.includes(chosen)) return chosen;
  return open[races % open.length];
}

/** Elenco pulito delle piste provate (salvataggi rovinati o vecchi). */
export function sanitizeTracks(list: unknown): TrackId[] {
  if (!Array.isArray(list)) return [];
  const out: TrackId[] = [];
  for (const v of list) if (isTrackId(v) && !out.includes(v)) out.push(v);
  return out;
}

// ---------------------------------------------------------------- guasti in officina

/** Guasti: ruota davanti smontata, gomma dietro a terra, fango sulla carrozzeria, motore che fuma. */
export const REPAIRS = ['ruota', 'gomma', 'fango', 'motore'] as const;
export type RepairId = (typeof REPAIRS)[number];
export const isRepairId = (id: unknown): id is RepairId => typeof id === 'string' && (REPAIRS as readonly string[]).includes(id);

/** Tre guasti diversi per visita; la prima volta sempre gli stessi, nell'ordine più facile da capire. */
export function repairsFor(visit: number, r: () => number = Math.random): RepairId[] {
  if (visit <= 0) return ['gomma', 'fango', 'motore'];
  const pool = [...REPAIRS];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, 3);
}
