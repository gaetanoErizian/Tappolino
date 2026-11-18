import { Rng, seedOf } from '../rng';

/**
 * "Riordina i barattoli" (ordina e incastra): si sposta il pezzo in cima a un barattolo su un altro
 * (vuoto, oppure con in cima lo stesso ingrediente) fino ad avere un ingrediente per barattolo.
 * Ogni livello candidato viene risolto dal codice (ricerca in ampiezza): si tengono solo quelli risolvibili
 * e si sceglie quello con il numero di mosse più vicino alla difficoltà voluta.
 */
export interface SortLevel { cap: number; colors: number; jars: number[][]; min: number }
export type Move = [from: number, to: number];

export function sortSize(n: number): { colors: number; cap: number; empty: number; target: number } {
  if (n < 2) return { colors: 2, cap: 3, empty: 1, target: 3 };
  if (n < 6) return { colors: 3, cap: 3, empty: 2, target: 5 + Math.min(3, n - 2) };
  if (n < 13) return { colors: 3, cap: 4, empty: 2, target: 8 + Math.floor((n - 6) / 2) };
  if (n < 24) return { colors: 4, cap: 4, empty: 2, target: 11 + Math.floor((n - 13) / 2) };
  return n % 2 ? { colors: 5, cap: 3, empty: 2, target: 14 } : { colors: 4, cap: 4, empty: 2, target: 17 };
}

const top = (j: number[]): number => j[j.length - 1];
const uniform = (j: number[]): boolean => j.every((c) => c === j[0]);
export const jarDone = (j: number[], cap: number): boolean => j.length === cap && uniform(j);
export const sortDone = (jars: number[][], cap: number): boolean => jars.every((j) => j.length === 0 || jarDone(j, cap));

export function canMove(jars: number[][], cap: number, a: number, b: number): boolean {
  if (a === b || !jars[a]?.length || !jars[b] || jars[b].length >= cap) return false;
  return jars[b].length === 0 || top(jars[b]) === top(jars[a]);
}
export function applyMove(jars: number[][], [a, b]: Move): number[][] {
  const out = jars.map((j) => [...j]);
  out[b].push(out[a].pop() as number);
  return out;
}

const keyOf = (jars: number[][]): string => jars.map((j) => j.join('')).sort().join('|');

/** Mosse utili da uno stato (niente mosse inutili: barattolo già finito, pezzi uguali verso un vuoto). */
function usefulMoves(jars: number[][], cap: number): Move[] {
  const out: Move[] = [];
  let usedEmpty = false;
  for (let b = 0; b < jars.length; b++) {
    if (jars[b].length === 0) { if (usedEmpty) continue; usedEmpty = true; }
    for (let a = 0; a < jars.length; a++) {
      if (!canMove(jars, cap, a, b) || jarDone(jars[a], cap)) continue;
      if (jars[b].length === 0 && uniform(jars[a])) continue;
      out.push([a, b]);
    }
  }
  return out;
}

/** Ricerca in ampiezza: soluzione più corta (o null se non c'è o se si supera il tetto di stati). */
export function solveSort(jars: number[][], cap: number, maxStates = 60000): Move[] | null {
  if (sortDone(jars, cap)) return [];
  const seen = new Map<string, { prev: string | null; move: Move | null }>();
  const start = keyOf(jars);
  seen.set(start, { prev: null, move: null });
  let frontier: { jars: number[][]; key: string }[] = [{ jars, key: start }];
  while (frontier.length && seen.size < maxStates) {
    const next: typeof frontier = [];
    for (const st of frontier) {
      for (const mv of usefulMoves(st.jars, cap)) {
        const nj = applyMove(st.jars, mv);
        const k = keyOf(nj);
        if (seen.has(k)) continue;
        seen.set(k, { prev: st.key, move: mv });
        if (sortDone(nj, cap)) {
          // le mosse sono registrate sugli indici dello stato da cui partono: si rigioca dall'inizio per ricostruirle
          const chain: string[] = [];
          for (let c: string | null = k; c; c = seen.get(c)!.prev) chain.push(c);
          return replay(jars, cap, chain.reverse());
        }
        next.push({ jars: nj, key: k });
      }
    }
    frontier = next;
  }
  return null;
}

/** Ricostruisce le mosse seguendo la catena di stati (le chiavi non dipendono dall'ordine dei barattoli). */
function replay(jars: number[][], cap: number, chain: string[]): Move[] {
  const moves: Move[] = [];
  let cur = jars;
  for (let i = 1; i < chain.length; i++) {
    const mv = allMoves(cur, cap).find((m) => keyOf(applyMove(cur, m)) === chain[i]);
    if (!mv) return moves;
    moves.push(mv);
    cur = applyMove(cur, mv);
  }
  return moves;
}
function allMoves(jars: number[][], cap: number): Move[] {
  const out: Move[] = [];
  for (let a = 0; a < jars.length; a++) for (let b = 0; b < jars.length; b++) if (canMove(jars, cap, a, b)) out.push([a, b]);
  return out;
}

export function generateSort(n: number): SortLevel {
  const { colors, cap, empty, target } = sortSize(n);
  let best: SortLevel | null = null;
  for (let a = 0, found = 0; a < 40 && found < 5; a++) {
    const rng = new Rng(seedOf('sort', n, a));
    const pieces: number[] = [];
    for (let c = 0; c < colors; c++) for (let i = 0; i < cap; i++) pieces.push(c);
    rng.shuffle(pieces);
    const jars: number[][] = [];
    for (let j = 0; j < colors; j++) jars.push(pieces.slice(j * cap, (j + 1) * cap));
    for (let e = 0; e < empty; e++) jars.push([]);
    if (jars.some((j) => jarDone(j, cap))) continue;
    const sol = solveSort(jars, cap);
    if (!sol || sol.length < 2) continue;
    found++;
    if (!best || Math.abs(sol.length - target) < Math.abs(best.min - target)) best = { cap, colors, jars, min: sol.length };
  }
  if (best) return best;
  // riserva sempre risolvibile: due ingredienti scambiati in cima
  const jars: number[][] = [];
  for (let c = 0; c < colors; c++) jars.push(new Array<number>(cap).fill(c));
  [jars[0][cap - 1], jars[1][cap - 1]] = [jars[1][cap - 1], jars[0][cap - 1]];
  for (let e = 0; e < empty; e++) jars.push([]);
  return { cap, colors, jars, min: 3 };
}

/** Aiutino: la prossima mossa della soluzione più corta da qui (null: da qui non si finisce, meglio ricominciare). */
export function sortHint(jars: number[][], cap: number): Move | null {
  const sol = solveSort(jars, cap);
  return sol && sol.length ? sol[0] : null;
}
