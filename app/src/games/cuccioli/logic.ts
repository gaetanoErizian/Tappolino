/**
 * Cuccioli dal Dottore — logica pura (niente Phaser): cuccioli, guai, strumenti, visite, collezione.
 * Tutto qui è testato in cuccioli.test.ts.
 */

// =====================================================================
// Cuccioli (collezione: vanno a vivere nel giardino della clinica)
// =====================================================================

export type PetId = 'dog' | 'cat' | 'bunny' | 'bear' | 'fox' | 'panda' | 'pig' | 'lamb';
export type Ears = 'floppy' | 'pointy' | 'long' | 'round' | 'big' | 'pig' | 'lamb';
export type Tail = 'wag' | 'cat' | 'puff' | 'stub' | 'bushy' | 'curl' | 'fluff';

export interface Pet {
  id: PetId;
  /** colore del pelo */
  fur: string;
  /** pancia, muso e interno delle orecchie */
  belly: string;
  /** naso */
  nose: string;
  /** colore secondario (macchie, zampe del panda, punta della coda) */
  accent: string;
  ears: Ears;
  tail: Tail;
  /** voce: nome dell'effetto sfx_voice_<id> e tono */
  rate: number;
}

export const PETS: readonly Pet[] = [
  { id: 'dog', fur: '#e0a868', belly: '#fff1dc', nose: '#4a2f2a', accent: '#a8673a', ears: 'floppy', tail: 'wag', rate: 1 },
  { id: 'cat', fur: '#9fa8c2', belly: '#f6f2fb', nose: '#ff8fa8', accent: '#6f7896', ears: 'pointy', tail: 'cat', rate: 1 },
  { id: 'bunny', fur: '#f3e9f2', belly: '#fffaff', nose: '#ff8fb0', accent: '#ffb7cf', ears: 'long', tail: 'puff', rate: 1 },
  { id: 'bear', fur: '#a9734c', belly: '#ecc9a2', nose: '#3c2620', accent: '#7a4a2c', ears: 'round', tail: 'stub', rate: 1 },
  { id: 'fox', fur: '#f08a3c', belly: '#fff6ea', nose: '#3c2a2a', accent: '#5a3426', ears: 'big', tail: 'bushy', rate: 1 },
  { id: 'panda', fur: '#f7f6f1', belly: '#ffffff', nose: '#2f2f3a', accent: '#3d3d4c', ears: 'round', tail: 'stub', rate: 1 },
  { id: 'pig', fur: '#f9b0c0', belly: '#ffd6df', nose: '#e47a94', accent: '#e8899f', ears: 'pig', tail: 'curl', rate: 1 },
  { id: 'lamb', fur: '#fff8ec', belly: '#f6dcc4', nose: '#8a5a4a', accent: '#e9c9ad', ears: 'lamb', tail: 'fluff', rate: 1 },
];

export const PET_IDS: readonly PetId[] = PETS.map((p) => p.id);
export const isPetId = (v: unknown): v is PetId => typeof v === 'string' && (PET_IDS as readonly string[]).includes(v);
export const petById = (id: PetId): Pet => PETS.find((p) => p.id === id) ?? PETS[0];

/** Prossimo paziente: prima i cuccioli mai curati (in ordine), poi a caso ma mai lo stesso due volte di fila. */
export function nextPet(cured: readonly string[], last: string, rnd: () => number = Math.random): PetId {
  const fresh = PETS.find((p) => !cured.includes(p.id));
  if (fresh) return fresh.id;
  const pool = PET_IDS.filter((id) => id !== last);
  return pool[Math.floor(rnd() * pool.length) % pool.length];
}

/** Aggiunge un cucciolo al giardino (una volta sola). */
export function addCured(cured: readonly string[], id: PetId): string[] {
  return cured.includes(id) ? [...cured] : [...cured, id];
}

/** Ripulisce la collezione salvata (id sconosciuti o ripetuti). */
export function sanitizeCured(list: unknown): PetId[] {
  if (!Array.isArray(list)) return [];
  const out: PetId[] = [];
  for (const v of list) if (isPetId(v) && !out.includes(v)) out.push(v);
  return out;
}

// =====================================================================
// Guai e strumenti
// =====================================================================

export type ProblemId = 'dirty' | 'thorn' | 'hungry' | 'sleepy' | 'sneezy' | 'cold';
export type ToolId = 'sponge' | 'tweezers' | 'plaster' | 'bottle' | 'blanket' | 'tissue' | 'scarf';
/** Punti del cucciolo dove si cura (coordinate nel cucciolo, vedi SPOTS). */
export type SpotId = 'pawL' | 'pawR' | 'mouth' | 'nose' | 'neck' | 'body';

export interface Problem {
  id: ProblemId;
  spot: SpotId;
  /** strumenti da usare, in ordine (la spina: prima le pinzette, poi il cerotto) */
  tools: ToolId[];
}

export const PROBLEMS: readonly Problem[] = [
  { id: 'dirty', spot: 'pawL', tools: ['sponge'] },
  { id: 'thorn', spot: 'pawR', tools: ['tweezers', 'plaster'] },
  { id: 'hungry', spot: 'mouth', tools: ['bottle'] },
  { id: 'sleepy', spot: 'body', tools: ['blanket'] },
  { id: 'sneezy', spot: 'nose', tools: ['tissue'] },
  { id: 'cold', spot: 'neck', tools: ['scarf'] },
];

export const PROBLEM_IDS: readonly ProblemId[] = PROBLEMS.map((p) => p.id);
export const TOOLS: readonly ToolId[] = ['sponge', 'tweezers', 'plaster', 'bottle', 'blanket', 'tissue', 'scarf'];
export const problemById = (id: ProblemId): Problem => PROBLEMS.find((p) => p.id === id)!;

/**
 * Punti di cura nel cucciolo (origine ai piedi, scala 1). Lo scheletro è comune a tutti i cuccioli:
 * corpo seduto, testa grande, due zampette davanti.
 */
export const SPOTS: Record<SpotId, { x: number; y: number }> = {
  pawL: { x: -78, y: -26 },
  pawR: { x: 78, y: -26 },
  mouth: { x: 0, y: -318 },
  nose: { x: 0, y: -350 },
  neck: { x: 0, y: -248 },
  body: { x: 0, y: -150 },
};

/** Le prime visite sono scritte a mano (un guaio, poi due facili); poi 2 guai, e 3 dalla sesta visita. */
const FIRST_VISITS: ProblemId[][] = [['dirty'], ['hungry', 'sneezy'], ['thorn', 'sleepy']];

export function problemsFor(visits: number, rnd: () => number = Math.random): ProblemId[] {
  if (visits < FIRST_VISITS.length) return [...FIRST_VISITS[visits]];
  const n = visits >= 5 ? 3 : 2;
  const pool = [...PROBLEM_IDS];
  const out: ProblemId[] = [];
  while (out.length < n) out.push(pool.splice(Math.floor(rnd() * pool.length) % pool.length, 1)[0]);
  return out;
}

/** Strumenti che servono per una visita (in ordine di passi). */
export function stepsOf(problems: readonly ProblemId[]): ToolId[] {
  return problems.flatMap((p) => problemById(p).tools);
}

/**
 * Strumenti sul vassoio: alle prime visite solo quelli che servono più uno in più (scelta facile),
 * poi tutti e sette. Sempre nell'ordine fisso di TOOLS (ogni strumento ha il suo posto).
 */
export function trayTools(problems: readonly ProblemId[], visits: number): ToolId[] {
  if (visits >= 3) return [...TOOLS];
  const need = new Set(stepsOf(problems));
  const extra = TOOLS.find((t) => !need.has(t) && (visits === 0 ? t === 'bottle' : t !== 'plaster'));
  if (extra) need.add(extra);
  return TOOLS.filter((t) => need.has(t));
}

/** Stato di un guaio durante la visita: quanti strumenti sono già stati usati. */
export interface Ailment { id: ProblemId; done: number }

export const isCured = (a: Ailment): boolean => a.done >= problemById(a.id).tools.length;
export const toolNeeded = (a: Ailment): ToolId | null => (isCured(a) ? null : problemById(a.id).tools[a.done]);

/**
 * Quale guaio cura lo strumento lasciato in (x, y) (coordinate nel cucciolo, scala 1)?
 * Generoso per le dita piccole: va bene il punto giusto o anche solo il cucciolo, purché lo strumento serva.
 * Restituisce l'indice del guaio o -1.
 */
export function ailmentFor(list: readonly Ailment[], tool: ToolId, x?: number, y?: number): number {
  let best = -1;
  let bd = Infinity;
  list.forEach((a, i) => {
    if (toolNeeded(a) !== tool) return;
    const s = SPOTS[problemById(a.id).spot];
    const d = x === undefined || y === undefined ? 0 : Math.hypot(x - s.x, y - s.y);
    if (d < bd) { bd = d; best = i; }
  });
  return best;
}

/** Il punto (x, y) nel cucciolo (scala 1) cade sul cucciolo o vicino a un punto di cura? */
export function onPet(x: number, y: number): boolean {
  const inBody = ((x - PET_HIT.x) / PET_HIT.rx) ** 2 + ((y - PET_HIT.y) / PET_HIT.ry) ** 2 <= 1;
  return inBody || Object.values(SPOTS).some((s) => Math.hypot(x - s.x, y - s.y) < 170);
}

/** Area del cucciolo che risponde al tocco (ellisse generosa attorno a corpo e testa). */
export const PET_HIT = { x: 0, y: -310, rx: 270, ry: 360 };

// =====================================================================
// Scena: posizioni nell'area di design 1920×1080
// =====================================================================

/** Il cucciolo sul lettino. */
export const PET_AT = { x: 960, y: 770, scale: 0.92 };
/** Vassoio degli strumenti, in basso. */
export const TRAY_Y = 985;
export const TOOL_GAP = 212;

export function trayX(i: number, n: number): number {
  return 960 + (i - (n - 1) / 2) * TOOL_GAP;
}

/** Punto di cura in coordinate di scena. */
export function spotPoint(spot: SpotId, at = PET_AT): { x: number; y: number } {
  const s = SPOTS[spot];
  return { x: at.x + s.x * at.scale, y: at.y + s.y * at.scale };
}

/** Posti dei cuccioli nel giardino (due file, la seconda più lontana e più piccola). */
export const GARDEN_SPOTS: readonly { x: number; y: number; s: number }[] = [
  { x: 360, y: 640, s: 0.36 }, { x: 760, y: 610, s: 0.34 }, { x: 1160, y: 610, s: 0.34 }, { x: 1560, y: 640, s: 0.36 },
  { x: 250, y: 930, s: 0.44 }, { x: 700, y: 960, s: 0.46 }, { x: 1220, y: 960, s: 0.46 }, { x: 1670, y: 930, s: 0.44 },
];
