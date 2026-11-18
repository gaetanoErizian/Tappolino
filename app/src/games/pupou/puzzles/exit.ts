import { Rng, seedOf } from '../rng';

/**
 * "Fuori le puzzette!" (uscita a catena): ogni nuvoletta vola via nella sua direzione, ma solo se la strada è libera.
 * Il livello si costruisce al contrario: si aggiunge una nuvoletta alla volta con la strada libera rispetto a quelle
 * già messe, quindi togliendole nell'ordine inverso si svuota sempre il campo.
 */
export interface Puff { x: number; y: number; dir: number } // 0 su, 1 destra, 2 giù, 3 sinistra
export interface ExitLevel { w: number; h: number; puffs: Puff[]; depth: number }

export const DX = [0, 1, 0, -1];
export const DY = [-1, 0, 1, 0];

export function exitSize(n: number): { w: number; h: number; count: number; chain: number } {
  if (n < 2) return { w: 3, h: 2, count: 3, chain: 0.2 };
  if (n < 5) return { w: 3, h: 3, count: 5, chain: 0.4 };
  if (n < 10) return { w: 4, h: 3, count: 7, chain: 0.55 };
  if (n < 18) return { w: 5, h: 3, count: 9, chain: 0.7 };
  if (n < 28) return { w: 5, h: 4, count: 12, chain: 0.8 };
  return { w: 6, h: 4, count: 15 + (n % 3), chain: 0.9 };
}

/** Caselle che la nuvoletta attraversa per uscire. */
export function lane(p: Puff, w: number, h: number): number[] {
  const out: number[] = [];
  for (let x = p.x + DX[p.dir], y = p.y + DY[p.dir]; x >= 0 && y >= 0 && x < w && y < h; x += DX[p.dir], y += DY[p.dir]) out.push(y * w + x);
  return out;
}

/** Indice della prima nuvoletta che blocca la strada di `i` (-1 se è libera). */
export function blocker(puffs: readonly (Puff | null)[], i: number, w: number, h: number): number {
  const p = puffs[i];
  if (!p) return -1;
  for (const c of lane(p, w, h)) {
    const j = puffs.findIndex((q) => q !== null && q.y * w + q.x === c);
    if (j >= 0) return j;
  }
  return -1;
}
export const canExit = (puffs: readonly (Puff | null)[], i: number, w: number, h: number): boolean => !!puffs[i] && blocker(puffs, i, w, h) < 0;

/**
 * Risolve a giri: a ogni giro escono tutte le nuvolette libere. Togliere una nuvoletta non blocca mai le altre,
 * quindi se questo metodo si ferma il livello non è risolvibile. `depth` = numero di giri (lunghezza della catena).
 */
export function solveExit(lv: Pick<ExitLevel, 'w' | 'h' | 'puffs'>): { order: number[]; depth: number; solved: boolean } {
  const puffs: (Puff | null)[] = [...lv.puffs];
  const order: number[] = [];
  let depth = 0;
  for (;;) {
    const free = puffs.map((_, i) => i).filter((i) => canExit(puffs, i, lv.w, lv.h));
    if (!free.length) break;
    depth++;
    for (const i of free) { order.push(i); puffs[i] = null; }
  }
  return { order, depth, solved: puffs.every((p) => p === null) };
}

export function generateExit(n: number): ExitLevel {
  const { w, h, count, chain } = exitSize(n);
  let best: ExitLevel | null = null;
  for (let a = 0; a < 6; a++) {
    const rng = new Rng(seedOf('exit', n, a));
    const puffs: Puff[] = [];
    const used = new Set<number>();
    for (let k = 0; k < count; k++) {
      // candidati: casella libera + direzione con strada libera dalle nuvolette già messe
      const cands: { p: Puff; blocks: number }[] = [];
      for (let c = 0; c < w * h; c++) {
        if (used.has(c)) continue;
        for (let dir = 0; dir < 4; dir++) {
          const p = { x: c % w, y: Math.floor(c / w), dir };
          if (lane(p, w, h).some((cell) => used.has(cell))) continue;
          // quante nuvolette già messe restano bloccate da questa (è così che nascono le catene)
          const blocks = puffs.filter((q) => lane(q, w, h).includes(c)).length;
          cands.push({ p, blocks });
        }
      }
      if (!cands.length) break;
      const blocking = cands.filter((c) => c.blocks > 0);
      const pool = blocking.length && rng.next() < chain ? blocking : cands;
      const pick = rng.pick(pool).p;
      puffs.push(pick);
      used.add(pick.y * w + pick.x);
    }
    rng.shuffle(puffs);
    const s = solveExit({ w, h, puffs });
    if (!s.solved || puffs.length < Math.min(3, count)) continue;
    const lv = { w, h, puffs, depth: s.depth };
    if (!best || lv.depth > best.depth || (lv.depth === best.depth && lv.puffs.length > best.puffs.length)) best = lv;
  }
  return best ?? { w, h, puffs: [{ x: 0, y: 0, dir: 0 }, { x: w - 1, y: h - 1, dir: 2 }, { x: 1, y: 0, dir: 3 }], depth: 2 };
}

/** Aiutino: una nuvoletta che può uscire adesso. */
export function exitHint(puffs: readonly (Puff | null)[], w: number, h: number): number {
  return puffs.findIndex((_, i) => canExit(puffs, i, w, h));
}
