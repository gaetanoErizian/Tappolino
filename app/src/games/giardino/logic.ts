/**
 * Logica pura del Giardino delle Fate (nessun Phaser: si prova con i test).
 *
 * Il giardino ha 3 aiuole da 7 vasi di terra. Un tocco sulla terra pianta un seme; ogni tocco sulla nuvola
 * fa piovere sul seme assetato più vicino e lo fa crescere di un passo: seme → germoglio → bocciolo → fiore.
 * I fiori sbocciati restano per sempre (il giardino è la collezione); a certe quantità di fiori arrivano le fatine.
 * Quando un'aiuola è piena si apre quella accanto.
 */

export const FLOWER_IDS = ['daisy', 'tulip', 'bell', 'sun', 'rose', 'star', 'moon', 'rainbow'] as const;
export type FlowerId = (typeof FLOWER_IDS)[number];

export interface FlowerDef {
  id: FlowerId;
  /** petali: chiaro, base, scuro */
  petal: [string, string, string];
  /** cuore del fiore */
  heart: [string, string, string];
  /** colore dell'alone magico e delle farfalle */
  glow: string;
  /** nota cantata dal fiore, in semitoni sopra il campione (scala pentatonica: mai stonata) */
  note: number;
}

export const FLOWERS: FlowerDef[] = [
  { id: 'daisy', petal: ['#ffffff', '#fdf3fb', '#e6c6e4'], heart: ['#fff3a0', '#ffd23a', '#e09a00'], glow: '#fff1a8', note: 0 },
  { id: 'tulip', petal: ['#ffc6d8', '#ff6f9e', '#d83a70'], heart: ['#fff3a0', '#ffd23a', '#e09a00'], glow: '#ff9fc2', note: 2 },
  { id: 'bell', petal: ['#d9ccff', '#9d86f2', '#6c52c8'], heart: ['#ffffff', '#f3edff', '#c9b9f5'], glow: '#c3b2ff', note: 4 },
  { id: 'sun', petal: ['#fff2a0', '#ffc928', '#e88f00'], heart: ['#c98a55', '#8a5a2c', '#5e3a1a'], glow: '#ffe066', note: 7 },
  { id: 'rose', petal: ['#ffd0c2', '#ff8a6e', '#e0533c'], heart: ['#ffd9c9', '#ff9f85', '#d9604a'], glow: '#ffb39e', note: 9 },
  { id: 'star', petal: ['#fffbd6', '#ffe36a', '#f0b400'], heart: ['#ffffff', '#fff6c8', '#ffd84a'], glow: '#fff3a0', note: 12 },
  { id: 'moon', petal: ['#f1fbff', '#bfe6ff', '#7fbde6'], heart: ['#ffffff', '#eef9ff', '#bfe0f5'], glow: '#c9f0ff', note: 14 },
  { id: 'rainbow', petal: ['#fff', '#ffb0d0', '#b58cf0'], heart: ['#fff6c8', '#ffe36a', '#f0b400'], glow: '#ffd0f0', note: 16 },
];

export const flowerById = (id: FlowerId): FlowerDef => FLOWERS.find((f) => f.id === id)!;
export const isFlowerId = (v: unknown): v is FlowerId => typeof v === 'string' && (FLOWER_IDS as readonly string[]).includes(v);

/** Tasso di riproduzione della nota del fiore (campione unico, intonato con `rate`). */
export const noteRate = (id: FlowerId): number => Math.pow(2, flowerById(id).note / 12);

/** Passi di crescita: 0 terra vuota, 1 seme, 2 germoglio, 3 bocciolo, 4 fiore. */
export type Stage = 0 | 1 | 2 | 3 | 4;
export const BLOOM: Stage = 4;

export interface Plot { f: FlowerId | ''; s: Stage }
export type Garden = Plot[][];

export const BEDS = 3;
export const PLOTS_PER_BED = 7;
export const TOTAL_PLOTS = BEDS * PLOTS_PER_BED;

/**
 * Posizione dei vasi nell'area di design 1920×1080 (y = base della terra).
 * Due file sfalsate: dietro 3 vasi più piccoli, davanti 4. I fiori di dietro crescono negli spazi tra quelli davanti.
 */
export const PLOT_POS: { x: number; y: number; s: number }[] = [
  { x: 640, y: 660, s: 0.8 }, { x: 960, y: 660, s: 0.8 }, { x: 1280, y: 660, s: 0.8 },
  { x: 440, y: 900, s: 1 }, { x: 800, y: 900, s: 1 }, { x: 1120, y: 900, s: 1 }, { x: 1480, y: 900, s: 1 },
];

/** Raggio del tocco intorno alla terra e intorno al fiore (in unità di design, a scala 1). */
export const PLOT_HIT = 150;
/** Altezza della pianta sopra la base della terra, per passo (a scala 1): si tocca anche la corolla. */
export const PLANT_TOP: Record<Stage, number> = { 0: 0, 1: 70, 2: 180, 3: 285, 4: 390 };

/** Quota della nuvola nel cielo. */
export const CLOUD_Y = 220;
export const CLOUD_MIN_X = 380;
export const CLOUD_MAX_X = 1540;

/** Al seme numero n (0, 1, 3…) si scopre un fiore nuovo; negli altri si ripianta uno già conosciuto. */
export const NEW_FLOWER_AT = [0, 1, 3, 5, 8, 11, 14, 17];

// ------------------------------------------------------------------ fatine
export const FAIRY_IDS = ['dew', 'petal', 'firefly', 'moss', 'breeze', 'twinkle'] as const;
export type FairyId = (typeof FAIRY_IDS)[number];

export interface FairyDef {
  id: FairyId;
  skin: string;
  hair: [string, string];
  dress: [string, string, string];
  wing: string;
  /** acconciatura */
  style: 'bun' | 'pigtails' | 'bob' | 'curly' | 'long' | 'short';
}

export const FAIRIES: FairyDef[] = [
  { id: 'dew', skin: '#ffd9bf', hair: ['#7fd1ff', '#3a8fd0'], dress: ['#d6f4ff', '#7fd1ff', '#3a9fd8'], wing: '#bfeaff', style: 'bun' },
  { id: 'petal', skin: '#f6c8a4', hair: ['#ff8fb8', '#c94a7e'], dress: ['#ffe0ec', '#ff8fb8', '#d9578c'], wing: '#ffd6ea', style: 'pigtails' },
  { id: 'firefly', skin: '#c98a62', hair: ['#4a3226', '#2a1a12'], dress: ['#fff6c0', '#ffd84a', '#e0a400'], wing: '#fff3b0', style: 'curly' },
  { id: 'moss', skin: '#e8b48c', hair: ['#9a6a3a', '#5e3a1a'], dress: ['#d4f5c0', '#7fcf6a', '#3f9a3a'], wing: '#d8ffc8', style: 'short' },
  { id: 'breeze', skin: '#8a5a3c', hair: ['#e6e0ff', '#a99ad8'], dress: ['#efe6ff', '#b58cf0', '#7d55c8'], wing: '#e6dcff', style: 'long' },
  { id: 'twinkle', skin: '#ffe2cc', hair: ['#ffd36a', '#d99a1a'], dress: ['#fff0e0', '#ffad7a', '#e0703a'], wing: '#fff0c8', style: 'bob' },
];

export const fairyById = (id: FairyId): FairyDef => FAIRIES.find((f) => f.id === id)!;

/** Fiori sbocciati necessari per l'arrivo di ogni fatina (l'ultima arriva a giardino completo). */
export const FAIRY_AT = [1, 4, 8, 12, 16, TOTAL_PLOTS];

/** Quante fatine vivono nel giardino con `blooms` fiori sbocciati. */
export function fairiesFor(blooms: number): number {
  return FAIRY_AT.filter((n) => blooms >= n).length;
}

/** La fatina che arriva proprio con il fiore numero `blooms`, se c'è. */
export function fairyArriving(blooms: number): FairyId | null {
  const i = FAIRY_AT.indexOf(blooms);
  return i >= 0 ? FAIRY_IDS[i] : null;
}

// ------------------------------------------------------------------ giardino
export function emptyGarden(): Garden {
  return Array.from({ length: BEDS }, () => Array.from({ length: PLOTS_PER_BED }, () => ({ f: '' as const, s: 0 as Stage })));
}

/** Ripulisce un giardino salvato: forma giusta, fiori conosciuti, passi validi. */
export function sanitizeGarden(raw: unknown): Garden {
  const g = emptyGarden();
  if (!Array.isArray(raw)) return g;
  for (let b = 0; b < BEDS; b++) {
    const bed = raw[b];
    if (!Array.isArray(bed)) continue;
    for (let p = 0; p < PLOTS_PER_BED; p++) {
      const v = bed[p] as { f?: unknown; s?: unknown } | undefined;
      if (!v || typeof v !== 'object') continue;
      const s = Number(v.s);
      if (isFlowerId(v.f) && Number.isInteger(s) && s >= 1 && s <= 4) g[b][p] = { f: v.f, s: s as Stage };
    }
  }
  return g;
}

const all = (g: Garden): Plot[] => g.flat();
export const plantedCount = (g: Garden): number => all(g).filter((p) => p.s >= 1).length;
export const bloomCount = (g: Garden): number => all(g).filter((p) => p.s === BLOOM).length;
export const bedFull = (g: Garden, b: number): boolean => g[b].every((p) => p.s === BLOOM);
export const gardenFull = (g: Garden): boolean => g.every((_, b) => bedFull(g, b));

/** Aiuole aperte: la prima sempre, ognuna delle altre quando la precedente è piena. */
export function bedsOpen(g: Garden): number {
  let n = 1;
  while (n < BEDS && bedFull(g, n - 1)) n++;
  return n;
}

/** Aiuola in cui si gioca: la prima non ancora piena (a giardino completo, la prima). */
export function currentBed(g: Garden): number {
  for (let b = 0; b < bedsOpen(g); b++) if (!bedFull(g, b)) return b;
  return 0;
}

/** Fiori già sbocciati almeno una volta (per l'album). */
export function discoveredFlowers(g: Garden): FlowerId[] {
  const seen = new Set(all(g).filter((p) => p.s === BLOOM && p.f).map((p) => p.f as FlowerId));
  return FLOWER_IDS.filter((id) => seen.has(id));
}

/**
 * Il fiore del seme numero `n` (contando tutti i semi piantati): nei semi di NEW_FLOWER_AT un fiore nuovo,
 * negli altri uno già conosciuto a caso, se possibile diverso dall'ultimo piantato.
 */
export function flowerFor(n: number, prev: FlowerId | '' = '', rnd: () => number = Math.random): FlowerId {
  const k = NEW_FLOWER_AT.indexOf(n);
  if (k >= 0) return FLOWER_IDS[k];
  const known = FLOWER_IDS.slice(0, Math.max(1, NEW_FLOWER_AT.filter((m) => m < n).length));
  const pool = known.length > 1 ? known.filter((id) => id !== prev) : known;
  return pool[Math.min(pool.length - 1, Math.floor(rnd() * pool.length))];
}

const clone = (g: Garden): Garden => g.map((bed) => bed.map((p) => ({ ...p })));

/** Pianta un seme nella terra vuota (solo nelle aiuole aperte). Restituisce il giardino nuovo e il fiore, o null. */
export function plant(g: Garden, b: number, p: number, prev: FlowerId | '' = '', rnd: () => number = Math.random): { garden: Garden; flower: FlowerId } | null {
  if (b < 0 || b >= bedsOpen(g) || !g[b]?.[p] || g[b][p].s !== 0) return null;
  const flower = flowerFor(plantedCount(g), prev, rnd);
  const garden = clone(g);
  garden[b][p] = { f: flower, s: 1 };
  return { garden, flower };
}

export const thirsty = (pl: Plot): boolean => pl.s >= 1 && pl.s < BLOOM;

/** Una pioggia: il seme cresce di un passo. `bloomed` è vero quando diventa fiore. */
export function water(g: Garden, b: number, p: number): { garden: Garden; stage: Stage; bloomed: boolean } | null {
  const pl = g[b]?.[p];
  if (!pl || !thirsty(pl)) return null;
  const garden = clone(g);
  const stage = (pl.s + 1) as Stage;
  garden[b][p] = { f: pl.f, s: stage };
  return { garden, stage, bloomed: stage === BLOOM };
}

/** Il vaso assetato più vicino alla nuvola (in x), o -1. A parità vince quello con il seme più indietro. */
export function thirstyNear(g: Garden, b: number, x: number): number {
  let best = -1, bestD = Infinity;
  g[b].forEach((pl, i) => {
    if (!thirsty(pl)) return;
    const d = Math.abs(PLOT_POS[i].x - x) + pl.s * 0.01;
    if (d < bestD) { bestD = d; best = i; }
  });
  return best;
}

/** Il primo vaso vuoto dell'aiuola (per la manina), o -1. Prima la fila davanti, al centro. */
export function emptyPlot(g: Garden, b: number): number {
  const order = [4, 5, 3, 6, 1, 0, 2];
  return order.find((i) => g[b][i].s === 0) ?? -1;
}

/** Il vaso toccato (bersaglio più vicino entro il raggio, compresa la corolla dei fiori), o -1. */
export function plotAt(g: Garden, b: number, x: number, y: number): number {
  let best = -1, bestD = Infinity;
  PLOT_POS.forEach((pos, i) => {
    const pl = g[b][i];
    const top = PLANT_TOP[pl.s];
    // distanza dal segmento verticale terra → cima della pianta
    const yy = Math.max(pos.y - top * pos.s, Math.min(pos.y - 20 * pos.s, y));
    const d = Math.hypot(x - pos.x, y - yy) / pos.s;
    if (d < PLOT_HIT && d < bestD) { bestD = d; best = i; }
  });
  return best;
}

/** Ordine per la festa dell'aiuola piena: da sinistra a destra. */
export const PLOTS_LEFT_TO_RIGHT = PLOT_POS.map((p, i) => ({ x: p.x, i })).sort((a, b) => a.x - b.x).map((o) => o.i);
