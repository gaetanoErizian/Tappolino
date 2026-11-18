import { Rng, seedOf } from '../rng';

/**
 * "Passa la spugna" (tratto unico): una sola linea che passa su tutte le piastrelle sporche, senza ripassare.
 * Il livello nasce da un percorso casuale (quindi è risolvibile per costruzione); le caselle non toccate
 * diventano ostacoli (paperelle).
 */
export interface PathLevel { w: number; h: number; blocked: boolean[]; start: number; solution: number[] }

export function pathSize(n: number): { w: number; h: number; maxBlocked: number } {
  if (n < 2) return { w: 3, h: 2, maxBlocked: 0 };
  if (n < 5) return { w: 3, h: 3, maxBlocked: 1 };
  if (n < 10) return { w: 4, h: 3, maxBlocked: 2 };
  if (n < 18) return { w: 4, h: 4, maxBlocked: 3 };
  if (n < 30) return { w: 5, h: 4, maxBlocked: 4 };
  return { w: 6, h: 4, maxBlocked: 5 };
}

export function neighbors(c: number, w: number, h: number): number[] {
  const x = c % w, y = Math.floor(c / w), out: number[] = [];
  if (y > 0) out.push(c - w);
  if (x < w - 1) out.push(c + 1);
  if (y < h - 1) out.push(c + w);
  if (x > 0) out.push(c - 1);
  return out;
}

function walk(rng: Rng, w: number, h: number): number[] {
  const seen = new Array<boolean>(w * h).fill(false);
  let cur = rng.int(w * h);
  const path = [cur];
  seen[cur] = true;
  for (;;) {
    const opts = neighbors(cur, w, h).filter((c) => !seen[c]);
    if (!opts.length) break;
    let next: number;
    if (rng.next() < 0.78) {
      // regola di Warnsdorff: la casella con meno uscite (copre quasi tutta la griglia)
      const score = (c: number) => neighbors(c, w, h).filter((d) => !seen[d]).length + rng.next() * 0.5;
      next = opts.reduce((a, b) => (score(b) < score(a) ? b : a));
    } else next = rng.pick(opts);
    seen[next] = true;
    path.push(next);
    cur = next;
  }
  return path;
}

/** Conta le soluzioni (fino a `cap`) a partire da un percorso già iniziato. Restituisce anche la prima trovata. */
export function solvePath(lv: Pick<PathLevel, 'w' | 'h' | 'blocked'>, prefix: number[], cap = 60, maxNodes = 40000): { count: number; first: number[] | null } {
  const total = lv.blocked.filter((b) => !b).length;
  const seen = [...lv.blocked];
  for (const c of prefix) seen[c] = true;
  const path = [...prefix];
  let count = 0, nodes = 0;
  let first: number[] | null = null;
  const go = (cur: number): void => {
    if (count >= cap || nodes++ > maxNodes) return;
    if (path.length === total) { count++; first ??= [...path]; return; }
    for (const nb of neighbors(cur, lv.w, lv.h)) {
      if (seen[nb]) continue;
      seen[nb] = true; path.push(nb);
      go(nb);
      path.pop(); seen[nb] = false;
    }
  };
  if (path.length) go(path[path.length - 1]);
  return { count, first };
}

export function generatePath(n: number): PathLevel {
  const { w, h, maxBlocked } = pathSize(n);
  let best: PathLevel | null = null;
  let bestScore = -Infinity;
  for (let a = 0, found = 0; a < 80 && found < 6; a++) {
    const rng = new Rng(seedOf('path', n, a));
    const sol = walk(rng, w, h);
    const left = w * h - sol.length;
    if (left > maxBlocked) continue;
    const blocked = new Array<boolean>(w * h).fill(true);
    for (const c of sol) blocked[c] = false;
    const lv: PathLevel = { w, h, blocked, start: sol[0], solution: sol };
    const sols = solvePath(lv, [lv.start]).count;
    // i primi livelli hanno tante strade giuste; più avanti ne resta una sola o quasi
    const score = (n < 12 ? sols : -sols) + left * 0.5;
    if (score > bestScore) { best = lv; bestScore = score; }
    found++;
  }
  if (best) return best;
  // riserva: serpentina su tutta la griglia
  const sol: number[] = [];
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) sol.push(y * w + (y % 2 ? w - 1 - x : x));
  return { w, h, blocked: new Array<boolean>(w * h).fill(false), start: 0, solution: sol };
}

/** Il percorso è valido? (parte dall'inizio, passi vicini, niente ripassi, niente ostacoli) */
export function validPath(lv: PathLevel, path: number[]): boolean {
  if (!path.length || path[0] !== lv.start) return false;
  const seen = new Set<number>();
  for (let i = 0; i < path.length; i++) {
    const c = path[i];
    if (c < 0 || c >= lv.w * lv.h || lv.blocked[c] || seen.has(c)) return false;
    if (i && !neighbors(path[i - 1], lv.w, lv.h).includes(c)) return false;
    seen.add(c);
  }
  return true;
}
export const pathDone = (lv: PathLevel, path: number[]): boolean => validPath(lv, path) && path.length === lv.blocked.filter((b) => !b).length;

/** Aiutino: la prossima casella giusta; -1 se da qui non si arriva più in fondo (bisogna tornare indietro). */
export function pathHint(lv: PathLevel, path: number[]): number {
  const p = path.length ? path : [lv.start];
  const s = solvePath(lv, p, 1).first;
  return s && s.length > p.length ? s[p.length] : -1;
}
