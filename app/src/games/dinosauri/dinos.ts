/**
 * Scavo dei Dinosauri — dati e logica pura (niente Phaser: testabile).
 *
 * Ogni dinosauro ha una "posa" nel suo riquadro FRAME (unità di design, guarda a destra, piedi su GROUND):
 * dalla stessa posa nascono sia le ossa del puzzle (skeleton.ts) sia il dinosauro vivo (art.ts),
 * così lo scheletro montato e l'animale combaciano.
 */

export const FRAME = { w: 800, h: 560 };
export const GROUND = 520;

export type DinoId = 'rex' | 'pachy' | 'tricera' | 'ptero' | 'anky' | 'para' | 'stego' | 'brachio';
export type PieceId = 'skull' | 'neck' | 'ribs' | 'tail' | 'legs' | 'front' | 'back' | 'arms' | 'plates' | 'wingL' | 'wingR';
export type Roar = 'big' | 'mid' | 'small';

export interface Pt { x: number; y: number }
export interface Leg { x: number; y: number; len: number; w: number; far?: boolean }

export interface Pose {
  body: { x: number; y: number; rx: number; ry: number };
  head: { x: number; y: number; r: number };
  /** dal corpo alla testa */
  neck: Pt[];
  neckW: number;
  /** dalla parte posteriore del corpo alla punta */
  tail: Pt[];
  tailW: number;
  /** zampe posteriori (back) e anteriori (front); far = lato lontano, più scuro */
  back: Leg[];
  front: Leg[];
  /** braccine dei bipedi */
  arms?: Leg[];
}

export interface Dino {
  id: DinoId;
  /** colore della pelle */
  color: string;
  /** colore delle parti speciali (placche, cresta, collare, ali) */
  accent: string;
  pieces: PieceId[];
  roar: Roar;
  /** velocità del ruggito: più alto = più acuto */
  rate: number;
  pose: Pose;
}

const P = (x: number, y: number): Pt => ({ x, y });

/** I dinosauri nell'ordine in cui si scoprono: prima pochi pezzi, poi di più. */
export const DINOS: Dino[] = [
  {
    id: 'rex', color: '#67c04f', accent: '#f7d154', roar: 'big', rate: 1, pieces: ['skull', 'ribs', 'tail', 'legs'],
    pose: {
      body: { x: 380, y: 300, rx: 150, ry: 112 }, head: { x: 590, y: 170, r: 88 },
      neck: [P(470, 250), P(540, 200)], neckW: 92,
      tail: [P(250, 300), P(150, 330), P(46, 372)], tailW: 96,
      back: [{ x: 330, y: 360, len: 160, w: 66, far: true }, { x: 380, y: 360, len: 160, w: 72 }],
      front: [],
      arms: [{ x: 486, y: 316, len: 54, w: 24 }],
    },
  },
  {
    id: 'pachy', color: '#ff8a3d', accent: '#ffd36b', roar: 'small', rate: 1.15, pieces: ['skull', 'ribs', 'tail', 'legs'],
    pose: {
      body: { x: 390, y: 312, rx: 140, ry: 112 }, head: { x: 586, y: 196, r: 92 },
      neck: [P(470, 262), P(540, 220)], neckW: 88,
      tail: [P(262, 318), P(160, 350), P(60, 392)], tailW: 92,
      back: [{ x: 340, y: 370, len: 150, w: 64, far: true }, { x: 392, y: 370, len: 150, w: 70 }],
      front: [],
      arms: [{ x: 488, y: 330, len: 50, w: 24 }],
    },
  },
  {
    id: 'tricera', color: '#4d8fe6', accent: '#ffb44a', roar: 'mid', rate: 0.95, pieces: ['skull', 'ribs', 'tail', 'front', 'back'],
    pose: {
      body: { x: 380, y: 320, rx: 190, ry: 118 }, head: { x: 640, y: 300, r: 86 },
      neck: [P(540, 310), P(590, 305)], neckW: 100,
      tail: [P(206, 322), P(120, 350), P(40, 384)], tailW: 92,
      back: [{ x: 290, y: 382, len: 136, w: 66, far: true }, { x: 248, y: 380, len: 138, w: 72 }],
      front: [{ x: 510, y: 384, len: 134, w: 62, far: true }, { x: 470, y: 382, len: 136, w: 68 }],
    },
  },
  {
    id: 'ptero', color: '#ff7fa3', accent: '#ffb35c', roar: 'small', rate: 1.3, pieces: ['skull', 'ribs', 'wingL', 'wingR', 'legs'],
    pose: {
      body: { x: 400, y: 300, rx: 78, ry: 92 }, head: { x: 486, y: 138, r: 66 },
      neck: [P(424, 230), P(456, 180)], neckW: 60,
      tail: [P(370, 380), P(350, 420)], tailW: 30,
      back: [{ x: 372, y: 372, len: 98, w: 34, far: true }, { x: 420, y: 372, len: 100, w: 38 }],
      front: [],
    },
  },
  {
    id: 'anky', color: '#e8aa2e', accent: '#a86a2c', roar: 'big', rate: 1.1, pieces: ['skull', 'ribs', 'tail', 'front', 'back'],
    pose: {
      body: { x: 390, y: 360, rx: 210, ry: 92 }, head: { x: 650, y: 384, r: 64 },
      neck: [P(570, 384), P(610, 386)], neckW: 80,
      tail: [P(190, 370), P(120, 386), P(66, 392)], tailW: 70,
      back: [{ x: 300, y: 412, len: 104, w: 62, far: true }, { x: 262, y: 410, len: 106, w: 68 }],
      front: [{ x: 520, y: 412, len: 104, w: 58, far: true }, { x: 484, y: 410, len: 106, w: 64 }],
    },
  },
  {
    id: 'para', color: '#d65fb8', accent: '#ff9f43', roar: 'mid', rate: 1.2, pieces: ['skull', 'ribs', 'arms', 'tail', 'legs'],
    pose: {
      body: { x: 370, y: 312, rx: 150, ry: 106 }, head: { x: 586, y: 158, r: 70 },
      neck: [P(462, 254), P(530, 200)], neckW: 80,
      tail: [P(234, 318), P(140, 346), P(40, 384)], tailW: 88,
      back: [{ x: 320, y: 370, len: 150, w: 64, far: true }, { x: 372, y: 370, len: 150, w: 70 }],
      front: [],
      arms: [{ x: 480, y: 336, len: 84, w: 28 }],
    },
  },
  {
    id: 'stego', color: '#22b3a3', accent: '#ff8f4a', roar: 'mid', rate: 0.9, pieces: ['skull', 'plates', 'ribs', 'tail', 'front', 'back'],
    pose: {
      body: { x: 380, y: 340, rx: 196, ry: 112 }, head: { x: 652, y: 392, r: 58 },
      neck: [P(552, 368), P(606, 384)], neckW: 74,
      tail: [P(200, 350), P(120, 362), P(44, 352)], tailW: 82,
      back: [{ x: 290, y: 398, len: 120, w: 66, far: true }, { x: 250, y: 396, len: 122, w: 72 }],
      front: [{ x: 512, y: 404, len: 114, w: 58, far: true }, { x: 474, y: 402, len: 116, w: 64 }],
    },
  },
  {
    id: 'brachio', color: '#9b7be6', accent: '#ffcf5c', roar: 'big', rate: 0.8, pieces: ['skull', 'neck', 'ribs', 'tail', 'front', 'back'],
    pose: {
      body: { x: 330, y: 340, rx: 168, ry: 106 }, head: { x: 630, y: 78, r: 56 },
      neck: [P(440, 290), P(530, 196), P(590, 110)], neckW: 74,
      tail: [P(176, 346), P(96, 380), P(30, 428)], tailW: 80,
      back: [{ x: 250, y: 400, len: 120, w: 64, far: true }, { x: 212, y: 398, len: 122, w: 70 }],
      front: [{ x: 446, y: 380, len: 140, w: 60, far: true }, { x: 410, y: 378, len: 142, w: 66 }],
    },
  },
];

export const DINO_IDS = DINOS.map((d) => d.id);
export const dinoById = (id: string): Dino => DINOS.find((d) => d.id === id) ?? DINOS[0];
export const isDinoId = (id: unknown): id is DinoId => typeof id === 'string' && (DINO_IDS as string[]).includes(id);

/**
 * Il prossimo dinosauro da scavare: il primo non ancora scoperto, nell'ordine.
 * Ad album completo uno qualsiasi, ma mai lo stesso due volte di fila.
 */
export function nextDino(found: readonly string[], last: string, rnd: () => number = Math.random): DinoId {
  const missing = DINO_IDS.find((id) => !found.includes(id));
  if (missing) return missing;
  const pool = DINO_IDS.filter((id) => id !== last);
  return pool[Math.min(pool.length - 1, Math.floor(rnd() * pool.length))];
}

/** Aggiunge un dinosauro all'album (una volta sola, in ordine di scoperta). */
export function addFound(found: readonly string[], id: DinoId): string[] {
  return found.includes(id) ? [...found] : [...found, id];
}

/** Album dai dati salvati: solo dinosauri validi, senza doppioni. */
export function sanitizeFound(v: unknown): DinoId[] {
  if (!Array.isArray(v)) return [];
  const out: DinoId[] = [];
  for (const id of v) if (isDinoId(id) && !out.includes(id)) out.push(id);
  return out;
}

// =====================================================================
// Scavo: la buca, le celle in cui stanno le ossa sotto la terra
// =====================================================================

/** Fondo della buca coperto di terra (coordinate di scena). */
export const FLOOR = { x: 300, y: 300, w: 1320, h: 520 };
const COLS = 3, ROWS = 2;
export const CELL = { w: FLOOR.w / COLS, h: FLOOR.h / ROWS };
/** spazio massimo per un osso dentro la sua cella */
export const BONE_BOX = { w: 360, h: 210 };

export interface DigSpot { x: number; y: number; cell: number }

/**
 * Posti delle ossa (e del tesoro) nella buca: una cella ciascuno, con un piccolo spostamento casuale.
 * Restituisce `count` posti per le ossa più uno per il tesoro se avanza una cella.
 */
export function layoutDig(count: number, rnd: () => number = Math.random): { bones: DigSpot[]; treasure: DigSpot | null } {
  const cells = Array.from({ length: COLS * ROWS }, (_, i) => i);
  for (let i = cells.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [cells[i], cells[j]] = [cells[j], cells[i]];
  }
  const spot = (cell: number, jitter: number): DigSpot => {
    const cx = FLOOR.x + ((cell % COLS) + 0.5) * CELL.w;
    const cy = FLOOR.y + (Math.floor(cell / COLS) + 0.5) * CELL.h;
    return { x: Math.round(cx + (rnd() * 2 - 1) * jitter), y: Math.round(cy + (rnd() * 2 - 1) * jitter * 0.4), cell };
  };
  const n = Math.min(count, cells.length);
  const bones = cells.slice(0, n).map((c) => spot(c, 30));
  const treasure = n < cells.length ? spot(cells[n], 70) : null;
  return { bones, treasure };
}

/** Scala per far stare un osso (w×h) nel suo spazio: mai più grande del naturale. */
export const fitScale = (w: number, h: number, box: { w: number; h: number }): number => Math.min(1, box.w / w, box.h / h);

/** Un osso si considera trovato quando questa quota della sua area è scoperta. */
export const FOUND_AT = 0.55;

/** Tesori nascosti nella terra (sorpresa, uno per scavo). */
export const TREASURES = ['ammonite', 'amber', 'shell'] as const;
export type Treasure = (typeof TREASURES)[number];

// =====================================================================
// Montaggio: dove si posa lo scheletro e quando un osso va al suo posto
// =====================================================================

/** Centro del riquadro del dinosauro durante il montaggio e la festa. */
export const STAGE = { x: 960, y: 520, scale: 1 };

/** Vassoio in fondo: posti delle ossa trovate. */
export function trayX(i: number, n: number): number {
  const left = 370, right = 1550;
  return n <= 1 ? 960 : left + ((right - left) * i) / (n - 1);
}
export const TRAY_Y = 952;
export const TRAY_BOX = { w: 220, h: 140 };

/**
 * Un osso lasciato cade al suo posto se il dito è sopra lo scheletro (riquadro del dinosauro allargato)
 * o abbastanza vicino al suo posto. Nessun errore: altrimenti torna nel vassoio.
 */
export function dropsOnSkeleton(x: number, y: number, slot: Pt): boolean {
  const s = STAGE.scale;
  const left = STAGE.x - (FRAME.w / 2) * s - 40, right = STAGE.x + (FRAME.w / 2) * s + 40;
  const top = STAGE.y - (FRAME.h / 2) * s - 40, bottom = STAGE.y + (FRAME.h / 2) * s + 20;
  const inside = x >= left && x <= right && y >= top && y <= bottom;
  return inside || Math.hypot(x - slot.x, y - slot.y) < 260;
}

/** Posizione in scena di un punto del riquadro del dinosauro (es. il centro di un osso). */
export function stagePoint(fx: number, fy: number): Pt {
  return { x: STAGE.x + (fx - FRAME.w / 2) * STAGE.scale, y: STAGE.y + (fy - FRAME.h / 2) * STAGE.scale };
}
