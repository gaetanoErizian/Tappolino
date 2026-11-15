/**
 * Razzo tra le Stelle — il percorso di un viaggio e il volo (logica pura, testata).
 * Area di design 1920×1080. Il razzo sta fermo in orizzontale (ROCKET_X) e sale o scende;
 * stelle e asteroidi di gomma scorrono verso di lui. Al massimo 3 righe di bersagli (LANES).
 */

/** Le tre righe di bersagli (sul telefono non ne entrano di più). */
export const LANES = [300, 540, 780] as const;
/** Limiti del volo: il razzo non esce mai dallo schermo. */
export const TOP = 220;
export const BOTTOM = 860;
export const ROCKET_X = 470;

/** Raggi di contatto, generosi con le stelle e indulgenti con gli asteroidi. */
export const STAR_REACH = 105;
export const BIG_REACH = 130;
export const ROCKET_R = 46;

/** Volo: tenendo premuto la velocità va verso `up`, lasciando verso `down` (morbido, mai a scatti). */
export const PHYS = { up: -640, down: 460, k: 4.2, bounce: 760 };

export type ItemKind = 'star' | 'big' | 'rock';
export interface Item {
  kind: ItemKind;
  /** distanza dalla partenza (unità di design) */
  x: number;
  y: number;
  /** raggio dell'asteroide */
  r?: number;
  /** oscillazione verticale dell'asteroide (ampiezza) */
  bob?: number;
  /** variante grafica dell'asteroide (0..2) */
  look?: number;
}

/** Generatore pseudo-casuale con seme (mulberry32): stesso seme, stesso percorso. */
export function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Velocità di scorrimento (unità al secondo): cresce appena con i viaggi fatti. */
export const speedFor = (level: number): number => 430 + Math.min(level, 8) * 12;

/** Lunghezza del viaggio: ~40 s il primo, ~50 s dal nono in poi (più l'arrivo). */
export const courseLength = (level: number): number => 16000 + Math.min(level, 8) * 650;

/** Tratto iniziale senza asteroidi: si impara a salire e scendere solo con le stelle. */
export const SAFE_START = 2600;
/** Prima dell'arrivo il cielo si libera. */
export const SAFE_END = 900;
/** Il percorso comincia un po' fuori dallo schermo a destra. */
export const START_X = 1700;

type Chunk = (x: number, r: () => number, level: number) => { items: Item[]; w: number };

const pick = <T>(r: () => number, list: readonly T[]): T => list[Math.min(list.length - 1, Math.floor(r() * list.length))];
const lane = (i: number): number => LANES[i];
const smooth = (u: number): number => u * u * (3 - 2 * u);

const line: Chunk = (x, r) => {
  const l = lane(Math.floor(r() * 3));
  return { items: Array.from({ length: 5 }, (_, i) => ({ kind: 'star' as const, x: x + i * 125, y: l })), w: 5 * 125 + 260 };
};

/** Arco da una riga all'altra: insegna a tenere premuto e a lasciare. */
const arc: Chunk = (x, r) => {
  const a = Math.floor(r() * 3);
  let b = Math.floor(r() * 3);
  if (b === a) b = (a + 1 + Math.floor(r() * 2)) % 3;
  const n = 7;
  return {
    items: Array.from({ length: n }, (_, i) => ({ kind: 'star' as const, x: x + i * 140, y: lane(a) + (lane(b) - lane(a)) * smooth(i / (n - 1)) })),
    w: n * 140 + 260,
  };
};

/** Onda che attraversa le tre righe. */
const wave: Chunk = (x, r) => {
  const ph = r() < 0.5 ? 0 : Math.PI;
  const n = 9;
  return {
    items: Array.from({ length: n }, (_, i) => ({ kind: 'star' as const, x: x + i * 130, y: LANES[1] + 240 * Math.sin(ph + (i / (n - 1)) * Math.PI * 2) })),
    w: n * 130 + 260,
  };
};

/** Un asteroide su una riga, le stelle su un'altra: si sceglie dove passare. */
const rock: Chunk = (x, r, level) => {
  const rl = Math.floor(r() * 3);
  const sl = (rl + 1 + Math.floor(r() * 2)) % 3;
  const items: Item[] = [{ kind: 'rock', x: x + 260, y: lane(rl), r: 92 + Math.floor(r() * 20), bob: level >= 3 ? 50 : 0, look: Math.floor(r() * 3) }];
  for (let i = 0; i < 4; i++) items.push({ kind: 'star', x: x + 70 + i * 125, y: lane(sl) });
  return { items, w: 4 * 125 + 400 };
};

/** Due asteroidi sfalsati: la riga libera è piena di stelle. */
const rocks2: Chunk = (x, r, level) => {
  const free = Math.floor(r() * 3);
  const busy = [0, 1, 2].filter((i) => i !== free);
  const items: Item[] = busy.map((l, k) => ({ kind: 'rock' as const, x: x + 200 + k * 380, y: lane(l), r: 88 + Math.floor(r() * 16), bob: level >= 5 ? 40 : 0, look: Math.floor(r() * 3) }));
  for (let i = 0; i < 6; i++) items.push({ kind: 'star', x: x + 40 + i * 125, y: lane(free) });
  return { items, w: 6 * 125 + 420 };
};

/** Stellona: vale 3 stelle, con una corona di stelline intorno. */
const big: Chunk = (x, r) => {
  const l = lane(Math.floor(r() * 3));
  const cx = x + 260;
  const items: Item[] = [{ kind: 'big', x: cx, y: l }];
  for (const dx of [-200, 200]) items.push({ kind: 'star', x: cx + dx, y: l });
  return { items, w: 780 };
};

/**
 * Percorso di un viaggio (deterministico per seme): inizio senza asteroidi, poi un misto di disegni di stelle
 * e asteroidi, una stellona a metà strada e alla fine cielo libero per l'arrivo.
 * Mai tre righe bloccate insieme; nessuna stella sopra un asteroide.
 */
export function buildCourse(level: number, seed: number): Item[] {
  const r = rng(seed);
  const len = courseLength(level);
  const items: Item[] = [];
  let x = START_X;
  let bigDone = false;
  let lastRock = false;
  /** disegni di sole stelle di fila dopo l'inizio: al terzo arriva comunque un asteroide */
  let calm = 0;
  const rockChance = Math.min(0.6, 0.36 + level * 0.04);
  while (x < len - SAFE_END) {
    let ch: Chunk;
    if (x < SAFE_START) ch = pick(r, [line, arc, wave]);
    else if (!bigDone && x > len * 0.5) { ch = big; bigDone = true; }
    else if (!lastRock && (calm >= 3 || r() < rockChance)) ch = level >= 2 && r() < 0.35 ? rocks2 : rock;
    else ch = pick(r, [line, arc, wave, arc]);
    const c = ch(x, r, level);
    if (x + c.w > len - SAFE_END && ch !== big) break;
    lastRock = c.items.some((i) => i.kind === 'rock');
    calm = lastRock || x < SAFE_START ? 0 : calm + 1;
    items.push(...c.items);
    x += c.w;
  }
  return items.sort((a, b) => a.x - b.x);
}

/** Stelle raccoglibili in un percorso (la stellona vale 3). */
export const starValue = (items: readonly Item[]): number => items.reduce((n, i) => n + (i.kind === 'star' ? 1 : i.kind === 'big' ? 3 : 0), 0);

export interface RocketState { y: number; vy: number; }

/**
 * Un passo di volo: la velocità si avvicina dolcemente a quella voluta (salita o discesa),
 * ai bordi il razzo si ferma senza uscire. Restituisce il bordo toccato, se c'è.
 */
export function stepRocket(s: RocketState, holding: boolean, dt: number): 'top' | 'bottom' | null {
  const target = holding ? PHYS.up : PHYS.down;
  s.vy += (target - s.vy) * (1 - Math.exp(-PHYS.k * dt));
  s.y += s.vy * dt;
  if (s.y < TOP) { s.y = TOP; s.vy = Math.max(0, s.vy); return 'top'; }
  if (s.y > BOTTOM) { s.y = BOTTOM; s.vy = Math.min(0, s.vy); return 'bottom'; }
  return null;
}

/** Rimbalzo su un asteroide: il razzo viene spinto lontano dal centro dell'asteroide, in verticale. */
export function bounceFrom(s: RocketState, rockY: number): void {
  const dir = s.y < rockY ? -1 : s.y > rockY ? 1 : (rockY > LANES[1] ? -1 : 1);
  s.vy = dir * PHYS.bounce;
}

export const touches = (ax: number, ay: number, ar: number, bx: number, by: number, br: number): boolean =>
  (ax - bx) * (ax - bx) + (ay - by) * (ay - by) <= (ar + br) * (ar + br);

/** Note della scala pentatonica per le stelle prese di fila (in semitoni). */
export const COMBO_STEPS = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24];
export const comboRate = (n: number): number => Math.pow(2, COMBO_STEPS[Math.min(n, COMBO_STEPS.length - 1)] / 12);
