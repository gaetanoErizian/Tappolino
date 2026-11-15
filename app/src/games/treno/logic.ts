/**
 * Treno degli Animali — logica pura (niente Phaser): stazioni, animali, viaggi (colori, forme, numeri fino a 5),
 * vagoni e posti, progressione, collezione. Tutto qui è testato in treno.test.ts.
 *
 * Un viaggio: gli animali di una stazione aspettano sul marciapiede della stazioncina, ognuno con il suo biglietto
 * (un colore o una forma); si trascinano nel vagone giusto (nei viaggi dei numeri basta che nel vagone ci sia posto).
 * Il treno parte fischiando e li porta a casa: la loro stazione entra nella collezione.
 */

// =====================================================================
// Stazioni e animali (collezione)
// =====================================================================

export type StationId = 'fattoria' | 'giungla' | 'polo';
export type AnimalId =
  | 'cow' | 'pig' | 'sheep' | 'hen' | 'horse'
  | 'monkey' | 'elephant' | 'giraffe' | 'lion' | 'parrot'
  | 'penguin' | 'polarbear' | 'seal' | 'walrus' | 'puffin';

export interface Station { id: StationId; animals: readonly AnimalId[] }

/** In ordine: la linea si allunga quando tutti gli animali di una stazione sono tornati a casa. */
export const STATIONS: readonly Station[] = [
  { id: 'fattoria', animals: ['cow', 'pig', 'sheep', 'hen', 'horse'] },
  { id: 'giungla', animals: ['monkey', 'elephant', 'giraffe', 'lion', 'parrot'] },
  { id: 'polo', animals: ['penguin', 'polarbear', 'seal', 'walrus', 'puffin'] },
];

export const STATION_IDS: readonly StationId[] = STATIONS.map((s) => s.id);
export const ANIMAL_IDS: readonly AnimalId[] = STATIONS.flatMap((s) => s.animals);
export const isStationId = (v: unknown): v is StationId => typeof v === 'string' && (STATION_IDS as readonly string[]).includes(v);
export const isAnimalId = (v: unknown): v is AnimalId => typeof v === 'string' && (ANIMAL_IDS as readonly string[]).includes(v);
export const stationById = (id: StationId): Station => STATIONS.find((s) => s.id === id) ?? STATIONS[0];
export const stationOf = (a: AnimalId): StationId => STATIONS.find((s) => s.animals.includes(a))!.id;

/** Una stazione è "raggiunta" (sbloccata nell'album) quando almeno un suo animale è tornato a casa. */
export const reached = (delivered: readonly string[]): StationId[] =>
  STATION_IDS.filter((id) => stationById(id).animals.some((a) => delivered.includes(a)));

export const complete = (id: StationId, delivered: readonly string[]): boolean =>
  stationById(id).animals.every((a) => delivered.includes(a));

/** Aggiunge gli animali portati a casa (una volta sola ciascuno, nell'ordine di arrivo). */
export function addDelivered(delivered: readonly string[], list: readonly AnimalId[]): string[] {
  const out = [...delivered];
  for (const a of list) if (!out.includes(a)) out.push(a);
  return out;
}

/** Ripulisce la collezione salvata (id sconosciuti o ripetuti). */
export function sanitizeDelivered(list: unknown): AnimalId[] {
  if (!Array.isArray(list)) return [];
  const out: AnimalId[] = [];
  for (const v of list) if (isAnimalId(v) && !out.includes(v)) out.push(v);
  return out;
}

/**
 * Destinazione del prossimo viaggio: la prima stazione con animali ancora lontani da casa (la linea si allunga
 * in ordine: fattoria, giungla, polo); a collezione completa una stazione a caso, mai la stessa due volte di fila.
 */
export function destFor(delivered: readonly string[], last: string, rnd: () => number = Math.random): StationId {
  const open = STATION_IDS.find((id) => !complete(id, delivered));
  if (open) return open;
  const pool = STATION_IDS.filter((id) => id !== last);
  return pool[Math.floor(rnd() * pool.length) % pool.length];
}

/** Gli animali che viaggiano: prima quelli mai portati a casa (in ordine), poi altri della stessa stazione a caso. */
export function pickAnimals(dest: StationId, n: number, delivered: readonly string[], rnd: () => number = Math.random): AnimalId[] {
  const all = [...stationById(dest).animals];
  const missing = all.filter((a) => !delivered.includes(a));
  const others = shuffle(all.filter((a) => delivered.includes(a)), rnd);
  return [...missing, ...others].slice(0, Math.min(n, all.length));
}

// =====================================================================
// Biglietti: colori e forme
// =====================================================================

export type Kind = 'color' | 'shape' | 'number';
export type ColorId = 'red' | 'yellow' | 'blue' | 'green' | 'purple';
export type ShapeId = 'circle' | 'square' | 'triangle' | 'star' | 'heart';

export const COLOR_IDS: readonly ColorId[] = ['red', 'yellow', 'blue', 'green', 'purple'];
export const SHAPE_IDS: readonly ShapeId[] = ['circle', 'square', 'triangle', 'star', 'heart'];

/** Colori ben distinti per i più piccoli (niente arancione accanto al rosso). */
export const COLORS: Record<ColorId, string> = {
  red: '#e8453c', yellow: '#ffc61a', blue: '#2f86e8', green: '#3dbb4f', purple: '#9a5fd8',
};

/** Vernice dei vagoni nei viaggi delle forme e dei numeri: il rosso del gioco. */
export const TRAIN_RED = '#e2574c';

export interface WagonSpec {
  /** posti a sedere (nei viaggi dei numeri è il numero scritto sul vagone) */
  cap: number;
  color?: ColorId;
  shape?: ShapeId;
}

export interface Passenger { animal: AnimalId; color?: ColorId; shape?: ShapeId }

export interface Trip {
  dest: StationId;
  kind: Kind;
  wagons: WagonSpec[];
  /** nell'ordine in cui aspettano sul marciapiede (da sinistra) */
  passengers: Passenger[];
}

// =====================================================================
// Progressione: i primi viaggi sono scritti a mano, poi colori, forme e numeri a turno
// =====================================================================

/** Quanti animali per vagone. I primi sei viaggi insegnano un'idea alla volta. */
const FIRST: { kind: Kind; groups: number[] }[] = [
  { kind: 'color', groups: [1, 1] },
  { kind: 'shape', groups: [1, 1] },
  { kind: 'number', groups: [3] },
  { kind: 'color', groups: [1, 1, 1] },
  { kind: 'shape', groups: [1, 1, 1] },
  { kind: 'number', groups: [2, 3] },
];
const MATCH_GROUPS = [[1, 1, 1], [2, 1, 1], [1, 2, 1], [1, 1, 2], [2, 2, 1], [2, 1, 2], [1, 2, 2], [2, 2]];
const NUMBER_GROUPS = [[4], [5], [2, 2], [1, 3], [3, 1], [2, 3], [3, 2], [1, 4], [4, 1]];
const KINDS: Kind[] = ['color', 'shape', 'number'];

/** Tipo di viaggio e animali per vagone (massimo 3 vagoni e 5 animali: tanti quanti quelli di una stazione). */
export function planFor(trips: number, rnd: () => number = Math.random): { kind: Kind; groups: number[] } {
  if (trips < FIRST.length) return { kind: FIRST[trips].kind, groups: [...FIRST[trips].groups] };
  const kind = KINDS[(trips - FIRST.length) % 3];
  const list = kind === 'number' ? NUMBER_GROUPS : MATCH_GROUPS;
  return { kind, groups: [...list[Math.floor(rnd() * list.length) % list.length]] };
}

/** Prepara un viaggio completo: destinazione, vagoni, biglietti, ordine sul marciapiede. */
export function makeTrip(
  state: { trips: number; delivered: readonly string[]; last: string },
  rnd: () => number = Math.random,
  force: { dest?: StationId; kind?: Kind; groups?: number[] } = {},
): Trip {
  const plan = planFor(state.trips, rnd);
  const kind = force.kind ?? plan.kind;
  const groups = (force.groups ?? plan.groups).slice(0, 3).map((g) => Math.max(1, Math.min(5, Math.round(g))));
  while (groups.reduce((a, b) => a + b, 0) > 5) groups[groups.indexOf(Math.max(...groups))]--;
  const dest = force.dest ?? destFor(state.delivered, state.last, rnd);
  const n = groups.reduce((a, b) => a + b, 0);
  const animals = pickAnimals(dest, n, state.delivered, rnd);
  const colors = shuffle([...COLOR_IDS], rnd);
  const shapes = shuffle([...SHAPE_IDS], rnd);
  const wagons: WagonSpec[] = groups.map((cap, i) => (
    kind === 'color' ? { cap, color: colors[i] } : kind === 'shape' ? { cap, shape: shapes[i] } : { cap }));
  const passengers: Passenger[] = [];
  let k = 0;
  groups.forEach((g, i) => {
    for (let j = 0; j < g; j++) passengers.push({ animal: animals[k++], color: wagons[i].color, shape: wagons[i].shape });
  });
  return { dest, kind, wagons, passengers: platformOrder(passengers, rnd) };
}

/** Mescola gli animali sul marciapiede, evitando (quando si può) che stiano già in fila come i vagoni. */
function platformOrder(list: Passenger[], rnd: () => number): Passenger[] {
  if (list.length < 2) return list;
  for (let i = 0; i < 8; i++) {
    const out = shuffle([...list], rnd);
    if (out.some((p, j) => p !== list[j])) return out;
  }
  return [...list].reverse();
}

/** Il vagone accetta il passeggero? Serve posto libero e (colori e forme) il biglietto giusto. */
export function accepts(trip: Pick<Trip, 'kind'>, w: WagonSpec, p: Passenger, seated: number): boolean {
  if (seated >= w.cap) return false;
  if (trip.kind === 'color') return w.color === p.color;
  if (trip.kind === 'shape') return w.shape === p.shape;
  return true;
}

/** Primo vagone dove il passeggero può salire (tocco senza trascinamento, manina), oppure -1. */
export function wagonFor(trip: Pick<Trip, 'kind' | 'wagons'>, seated: readonly number[], p: Passenger): number {
  return trip.wagons.findIndex((w, i) => accepts(trip, w, p, seated[i] ?? 0));
}

/** Tutti a bordo? */
export const allAboard = (trip: Pick<Trip, 'wagons'>, seated: readonly number[]): boolean =>
  trip.wagons.every((w, i) => (seated[i] ?? 0) >= w.cap);

// =====================================================================
// Scena: posizioni nell'area di design 1920×1080
// =====================================================================

/** Altezza delle rotaie (dove appoggiano le ruote del treno). */
export const RAIL_Y = 600;
/** Linea tra binario e marciapiede. */
export const PLATFORM_Y = 650;
/** Piedi degli animali che aspettano sul marciapiede. */
export const WAIT_Y = 990;
export const ANIMAL_SCALE = 0.86;
/** Scala degli animali seduti nel vagone. */
export const SEAT_SCALE = 0.56;

export const LOCO_W = 470;
export const SEAT_GAP = 128;
export const COUPLER = 26;
export const wagonW = (cap: number): number => 150 + cap * SEAT_GAP;

/**
 * Posizioni del treno, centrato sullo schermo: locomotiva a destra (parte verso destra), vagoni a sinistra.
 * Restituisce i centri dei vagoni (nell'ordine dei vagoni, da destra a sinistra dietro la locomotiva) e della locomotiva.
 */
export function trainLayout(caps: readonly number[], centerX = 960): { loco: number; wagons: number[]; left: number; right: number } {
  const total = LOCO_W + caps.reduce((a, c) => a + wagonW(c) + COUPLER, 0);
  const right = centerX + total / 2;
  const loco = right - LOCO_W / 2;
  const wagons: number[] = [];
  let x = right - LOCO_W - COUPLER;
  for (const c of caps) { wagons.push(x - wagonW(c) / 2); x -= wagonW(c) + COUPLER; }
  return { loco, wagons, left: right - total, right };
}

/** Posto k di un vagone (centro del vagone wx). */
export const seatX = (wx: number, k: number, cap: number): number => wx + (k - (cap - 1) / 2) * SEAT_GAP;

/** Animali in attesa sul marciapiede (al massimo 5, ben distanziati per le dita piccole). */
export function waitX(i: number, n: number): number {
  const gap = n >= 5 ? 330 : n === 4 ? 380 : 420;
  return 960 + (i - (n - 1) / 2) * gap;
}

/**
 * Il punto (x, y) del dito cade su un vagone? Zona generosa: tutto il vagone e un bel tratto sopra
 * (gli animali si lasciano cadere dall'alto), metà dello spazio tra due vagoni da ogni parte.
 */
export function wagonAt(x: number, y: number, centers: readonly number[], caps: readonly number[]): number {
  let best = -1;
  let bd = Infinity;
  centers.forEach((cx, i) => {
    const half = wagonW(caps[i]) / 2 + COUPLER / 2 + 20;
    if (y < RAIL_Y - 470 || y > RAIL_Y + 60) return;
    const d = Math.abs(x - cx);
    if (d <= half && d < bd) { bd = d; best = i; }
  });
  return best;
}

// =====================================================================
// Utilità
// =====================================================================

export function shuffle<T>(a: T[], rnd: () => number = Math.random): T[] {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1)) % (i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
