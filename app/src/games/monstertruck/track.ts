import { TRACKS, type TrackId } from './parts';

/**
 * Officina dei Monster Truck — la pista e la guida del truck (logica pura, testata).
 * Area di design 1920×1080. Il terreno è un profilo y(x) campionato ogni STEP unità; il truck è un punto di
 * contatto (in basso, tra le ruote) che corre sul profilo. Tieni premuto: accelera. Lascia: rallenta e si ferma.
 * Sulle creste e sui trampolini, se va abbastanza veloce, si stacca da terra e salta; quando atterra rimbalza
 * sempre sulle sue ruote morbide: niente incidenti, niente ribaltamenti.
 */

/** Livello del terreno piano (y del punto di contatto). Colline e trampolini salgono da qui. */
export const GROUND = 840;
export const STEP = 8;
/** Il profilo comincia un po' prima della partenza (sfondo a sinistra del truck). */
const X0 = -2400;
/** Il truck sta fermo sullo schermo a questa x; è il mondo che scorre. */
export const TRUCK_X = 540;

/** Guida: velocità massima, accelerazione con il dito giù, frenata dolce senza dito; gravità e rimbalzo. */
export const PHYS = { vmax: 640, accel: 620, brake: 520, airBrake: 160, g: 1700, bounce: 0.32, bounceMin: 380 } as const;

/** Punto "che prende" le stelle: al centro della carrozzeria, sopra il punto di contatto. */
export const REACH_Y = 130;
export const STAR_REACH = 118;
export const BIG_REACH = 140;
/** Il muso del truck rispetto al punto di contatto (per schiacciare gli scatoloni). */
export const NOSE = 150;
export const BOX = 92;
/** Saltello quando il truck schiaccia una pila di `n` scatoloni. */
export const boxHop = (n: number): number => -(320 + 90 * n);

export type ItemKind = 'star' | 'big' | 'box';
export interface Item {
  kind: ItemKind;
  x: number;
  /** centro della stella; per gli scatoloni la base (a terra) */
  y: number;
  /** scatoloni impilati (1–3) */
  n?: number;
}

/** Generatore pseudo-casuale con seme (mulberry32): stesso seme, stessa pista. */
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

/** Profilo del terreno: altezza, pendenza (positiva = scende) e curvatura, letti dai campioni. */
export class Ground {
  constructor(readonly h: Float32Array) {}

  at(x: number): number {
    const f = (x - X0) / STEP;
    const n = this.h.length - 1;
    if (f <= 0) return this.h[0];
    if (f >= n) return this.h[n];
    const i = Math.floor(f);
    return this.h[i] + (this.h[i + 1] - this.h[i]) * (f - i);
  }

  slope(x: number): number { return (this.at(x + 4) - this.at(x - 4)) / 8; }

  /** Curvatura (y''): positiva sulle creste e sul bordo dei trampolini, dove il truck può staccarsi. */
  curv(x: number): number { return (this.at(x + STEP) - 2 * this.at(x) + this.at(x - STEP)) / (STEP * STEP); }

  get end(): number { return X0 + (this.h.length - 1) * STEP; }
}

export interface Course {
  track: TrackId;
  /** x del traguardo */
  len: number;
  ground: Ground;
  items: Item[];
  /** bordo dei trampolini (per i test e per gli effetti) */
  lips: number[];
}

/** Lunghezza della gara: ~32 s il primo giro tenendo sempre premuto, fino a ~40 s con l'esperienza. */
export const courseLength = (level: number): number => 20000 + Math.min(Math.max(0, level), 8) * 600;

const smooth = (u: number): number => u * u * (3 - 2 * u);

type Seg = 'hills' | 'bumps' | 'ramp' | 'boxes' | 'flat';

/**
 * Pista di una gara (deterministica per seme). Partenza in piano con le prime stelle, poi colline, dossi,
 * trampolini e pile di scatoloni secondo il carattere della pista; alla fine un lungo rettilineo con il traguardo.
 * Almeno 3 trampolini e 2 pile di scatoloni; mai due trampolini di fila.
 */
export function buildCourse(track: TrackId, level: number, seed: number): Course {
  const r = rng(seed);
  const len = courseLength(level);
  const end = len + 3600;
  const n = Math.ceil((end - X0) / STEP) + 1;
  const h = new Float32Array(n).fill(GROUND);
  const lift = (x0: number, x1: number, f: (x: number) => number) => {
    for (let i = Math.max(0, Math.ceil((x0 - X0) / STEP)); i < n; i++) {
      const x = X0 + i * STEP;
      if (x > x1) break;
      h[i] = GROUND - f(x);
    }
  };
  const mix = TRACKS.find((t) => t.id === track)?.mix ?? TRACKS[0].mix;
  const pending: Array<{ kind: 'line'; x: number; count: number; gap: number } | { kind: 'arc'; lip: number } | { kind: 'box'; x: number; n: number }> = [];
  const lips: number[] = [];

  // sequenza dei tratti: si garantiscono 3 trampolini e 2 pile di scatoloni, il resto secondo la pista
  const pickSeg = (prev: Seg): Seg => {
    const w: Array<[Seg, number]> = [['hills', mix.hills], ['bumps', mix.bumps], ['ramp', prev === 'ramp' ? 0 : mix.ramp], ['boxes', mix.boxes]];
    const tot = w.reduce((s, [, v]) => s + v, 0);
    let u = r() * tot;
    for (const [k, v] of w) { if ((u -= v) < 0) return k; }
    return 'hills';
  };

  let x = 0;
  // partenza: rettilineo con una fila di stelle che insegna ad andare avanti
  pending.push({ kind: 'line', x: 520, count: 4, gap: 150 });
  x = 1300;
  let prev = 'flat' as Seg;
  let ramps = 0, boxes = 0;
  // l'ultimo tratto può essere lungo fino a ~2100: così restano almeno 900 di rettilineo prima del traguardo
  const finishAt = len - 3100;
  while (x < finishAt) {
    const left = finishAt - x;
    let seg = pickSeg(prev);
    // trampolini e scatoloni sono la parte più divertente: se ne mancano, gli ultimi tratti sono loro
    const needR = Math.max(0, 3 - ramps), needB = Math.max(0, 2 - boxes);
    const needSegs = needR + needB + Math.max(0, needR - 1 - needB);
    if (needSegs && left < needSegs * 1700 + 400) seg = needR && prev !== 'ramp' ? 'ramp' : needB ? 'boxes' : 'bumps';
    if (prev === 'flat' && x === 1300 && seg === 'ramp') seg = 'hills';
    let w = 0;
    if (seg === 'hills') {
      const big = track === 'dune' ? 1.4 : 1;
      const count = 2;
      const wl = 760 + Math.floor(r() * 300);
      const amp = (58 + r() * 50) * big;
      w = count * wl;
      const x0 = x;
      lift(x0, x0 + w, (xx) => amp * (1 - Math.cos((2 * Math.PI * (xx - x0)) / wl)) / 2);
      pending.push({ kind: 'line', x: x0 + wl * 0.3, count: 4, gap: 140 });
      if (r() < 0.6) pending.push({ kind: 'line', x: x0 + wl * 1.3, count: 4, gap: 140 });
    } else if (seg === 'bumps') {
      const count = 3 + Math.floor(r() * 2);
      const wl = 330;
      w = count * wl + 200;
      const x0 = x + 100;
      lift(x0, x0 + count * wl, (xx) => 26 * (1 - Math.cos((2 * Math.PI * (xx - x0)) / wl)) / 2);
      pending.push({ kind: 'line', x: x0 + 80, count: count + 1, gap: wl });
    } else if (seg === 'ramp') {
      // trampolino: rampa che si incurva (pendenza da 0 a S), bordo, discesa ripida, lungo atterraggio
      const S = 1.0 + Math.min(level, 6) * 0.03 + r() * 0.1;
      const L = 300;
      const H = (S * L) / 2;
      const a = x + 250;
      const lip = a + L;
      lift(a, lip, (xx) => (S * (xx - a) ** 2) / (2 * L));
      lift(lip, lip + 32, (xx) => H * (1 - smooth((xx - lip) / 32)));
      lips.push(lip);
      pending.push({ kind: 'line', x: x + 40, count: 2, gap: 130 });
      pending.push({ kind: 'arc', lip });
      w = 250 + L + 32 + 980;
      ramps++;
    } else {
      // pila di scatoloni da schiacciare (su un tratto piano), con un arco di stelle sopra
      const nb = 1 + Math.floor(r() * 3);
      w = 760;
      pending.push({ kind: 'box', x: x + 380, n: nb });
      pending.push({ kind: 'line', x: x + 80, count: 2, gap: 140 });
      boxes++;
    }
    x += w;
    prev = seg;
  }

  const ground = new Ground(h);
  const items: Item[] = [];
  const bigAt = lips.length ? lips[Math.floor(lips.length / 2)] : -1;
  for (const p of pending) {
    if (p.kind === 'line') {
      for (let k = 0; k < p.count; k++) {
        const sx = p.x + k * p.gap;
        if (sx < len - 700) items.push({ kind: 'star', x: sx, y: ground.at(sx) - REACH_Y });
      }
    } else if (p.kind === 'box') {
      items.push({ kind: 'box', x: p.x, y: GROUND, n: p.n });
      // stelle sopra la pila: il truck le prende saltellando sugli scatoloni
      for (const dx of [-40, 110, 260]) items.push({ kind: 'star', x: p.x + dx, y: GROUND - REACH_Y - (dx === 110 ? 20 + 26 * p.n : 10 * p.n) });
    } else {
      // stelle lungo il salto fatto a tutta velocità
      const path = flightPath(ground, p.lip);
      const k = path.length;
      const marks = p.lip === bigAt ? [0.18, 0.34, 0.5, 0.66, 0.82] : [0.2, 0.4, 0.6, 0.8];
      for (const f of marks) {
        const q = path[Math.min(k - 1, Math.floor(k * f))];
        const big = p.lip === bigAt && f === 0.5;
        items.push({ kind: big ? 'big' : 'star', x: q.x, y: q.y - REACH_Y });
      }
    }
  }
  return { track, len, ground, items: items.sort((a, b) => a.x - b.x), lips };
}

/** Traiettoria (punto di contatto) di un salto fatto a tutta velocità dal bordo `lip`. */
export function flightPath(ground: Ground, lip: number): Array<{ x: number; y: number }> {
  const s: TruckState = { x: lip - 60, y: ground.at(lip - 60), vx: PHYS.vmax, vy: 0, air: false, airTime: 0 };
  const out: Array<{ x: number; y: number }> = [];
  for (let i = 0; i < 600; i++) {
    const was = s.air;
    stepTruck(s, ground, true, 1 / 60);
    if (s.air) out.push({ x: s.x, y: s.y });
    else if (was) break;
  }
  return out.length ? out : [{ x: lip, y: ground.at(lip) }];
}

export interface TruckState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  air: boolean;
  /** tempo passato in volo (per gli applausi sui salti lunghi) */
  airTime: number;
}

export interface StepResult {
  takeoff?: boolean;
  /** velocità d'impatto all'atterraggio (verso il basso, rispetto al terreno) */
  land?: number;
  bounced?: boolean;
  /** tempo di volo del salto appena concluso */
  flight?: number;
}

/**
 * Un passo di guida. Con il dito giù la velocità sale fino a `vmax`; senza, cala dolcemente fino a fermarsi
 * (in volo cala poco). A terra il truck segue il profilo; se la cresta curva più di quanto la gravità può
 * trattenere (vx²·y'' > g) o il terreno sparisce sotto le ruote, si stacca e vola. All'atterraggio rimbalza.
 */
export function stepTruck(s: TruckState, ground: Ground, holding: boolean, dt: number): StepResult {
  const res: StepResult = {};
  if (holding) s.vx = Math.min(PHYS.vmax, s.vx + PHYS.accel * dt);
  else s.vx = Math.max(0, s.vx - (s.air ? PHYS.airBrake : PHYS.brake) * dt);
  const px = s.x;
  s.x += s.vx * dt;
  if (!s.air) {
    const gy = ground.at(s.x);
    const launch = s.vx > 30 && (s.vx * s.vx * ground.curv(s.x) > PHYS.g || gy - s.y > 26);
    // si stacca con la velocità che aveva sul terreno (es. lungo la rampa del trampolino)
    const vy = Math.min(s.vy, s.vx * ground.slope(px - 4));
    if (launch && s.y + vy * dt < gy) {
      s.air = true;
      s.airTime = 0;
      s.vy = vy;
      s.y += vy * dt;
      res.takeoff = true;
    } else {
      s.y = gy;
      s.vy = s.vx * ground.slope(s.x);
    }
    return res;
  }
  s.vy += PHYS.g * dt;
  s.y += s.vy * dt;
  s.airTime += dt;
  const gy = ground.at(s.x);
  if (s.y >= gy) {
    const gv = s.vx * ground.slope(s.x);
    const impact = s.vy - gv;
    s.y = gy;
    res.land = impact;
    res.flight = s.airTime;
    if (impact > PHYS.bounceMin) {
      // rimbalzo sulle gomme: un saltello più piccolo, poi si riprende a correre
      s.vy = gv - impact * PHYS.bounce;
      s.y = gy - 1;
      s.airTime = 0;
      res.bounced = true;
    } else {
      s.air = false;
      s.vy = gv;
    }
  }
  return res;
}

export const touches = (ax: number, ay: number, bx: number, by: number, r: number): boolean =>
  (ax - bx) * (ax - bx) + (ay - by) * (ay - by) <= r * r;

/** Valore delle stelle di una pista (la stellona vale 3). */
export const starValue = (items: readonly Item[]): number => items.reduce((n, i) => n + (i.kind === 'star' ? 1 : i.kind === 'big' ? 3 : 0), 0);

/** Note della scala pentatonica per le stelle prese di fila (in semitoni). */
export const COMBO_STEPS = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24];
export const comboRate = (n: number): number => Math.pow(2, COMBO_STEPS[Math.min(Math.max(0, n), COMBO_STEPS.length - 1)] / 12);

/**
 * Simulazione di una gara intera (test): `hold(t, s)` dice se il dito è giù. Restituisce le stelle prese,
 * il tempo impiegato e i limiti raggiunti dal truck.
 */
export function simulate(c: Course, hold: (t: number, s: TruckState) => boolean, dt = 1 / 60, maxT = 180) {
  const s: TruckState = { x: 0, y: c.ground.at(0), vx: 0, vy: 0, air: false, airTime: 0 };
  const taken = new Set<number>();
  let t = 0, minY = Infinity, maxBelow = 0, landings = 0, maxImpact = 0;
  const boxesHit = new Set<number>();
  while (s.x < c.len && t < maxT) {
    const r = stepTruck(s, c.ground, hold(t, s), dt);
    if (r.land !== undefined) { landings++; maxImpact = Math.max(maxImpact, r.land); }
    t += dt;
    minY = Math.min(minY, s.y);
    maxBelow = Math.max(maxBelow, s.y - c.ground.at(s.x));
    c.items.forEach((it, i) => {
      if (it.kind === 'box') {
        if (!boxesHit.has(i) && s.x + NOSE >= it.x - 40) {
          boxesHit.add(i);
          if (!s.air) { s.air = true; s.airTime = 0; s.vy = boxHop(it.n ?? 1); }
        }
      } else if (!taken.has(i) && touches(s.x, s.y - REACH_Y, it.x, it.y, it.kind === 'big' ? BIG_REACH : STAR_REACH)) taken.add(i);
    });
  }
  const stars = c.items.reduce((n, it, i) => n + (taken.has(i) ? (it.kind === 'big' ? 3 : 1) : 0), 0);
  return { t, stars, taken, minY, maxBelow, landings, maxImpact, boxes: boxesHit.size, finished: s.x >= c.len };
}
