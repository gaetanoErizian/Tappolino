import { Rng, seedOf } from '../rng';

/**
 * "Cosa viene dopo?" (sequenze logiche, la lezione a scuola): una fila di figure che segue una regola,
 * con un posto vuoto da riempire scegliendo tra 3 o 4 figure. Una lezione = 3 domande.
 */
export interface SeqQuestion { items: number[]; hole: number; answer: number; options: number[] }
export interface SeqLevel { questions: SeqQuestion[] }

export const SEQ_SYMBOLS = 9;
const TIERS: readonly (readonly string[])[] = [
  ['AB'],
  ['AB', 'AAB', 'ABB'],
  ['ABC', 'AAB', 'ABB', 'AABB'],
  ['ABC', 'AABB', 'ABAC', 'ABCB'],
  ['ABCB', 'AABC', 'ABBC', 'ABCD', 'ABAC'],
];

export function seqTier(n: number): { tier: number; holeAnywhere: boolean; options: number } {
  const tier = n < 2 ? 0 : n < 6 ? 1 : n < 12 ? 2 : n < 20 ? 3 : 4;
  return { tier, holeAnywhere: n >= 4, options: n >= 8 ? 4 : 3 };
}

export function generateSeq(n: number): SeqLevel {
  const { tier, holeAnywhere, options } = seqTier(n);
  const questions: SeqQuestion[] = [];
  let lastPattern = '';
  for (let q = 0; q < 3; q++) {
    const rng = new Rng(seedOf('seq', n, q));
    let pattern = rng.pick(TIERS[tier]);
    if (pattern === lastPattern && TIERS[tier].length > 1) pattern = TIERS[tier][(TIERS[tier].indexOf(pattern) + 1) % TIERS[tier].length];
    lastPattern = pattern;
    const letters = [...new Set(pattern.split(''))];
    const symbols = rng.shuffle([...Array(SEQ_SYMBOLS).keys()]);
    const map = new Map(letters.map((l, i) => [l, symbols[i]]));
    // almeno due ripetizioni complete visibili, così la regola si vede
    const len = Math.min(8, Math.max(6, pattern.length * 2 + 1));
    const full = [...Array(len).keys()].map((i) => map.get(pattern[i % pattern.length]) as number);
    // il buco non sta mai nella prima ripetizione (serve a capire la regola)
    const hole = holeAnywhere ? pattern.length + rng.int(len - pattern.length) : len - 1;
    const answer = full[hole];
    const wrong = rng.shuffle(letters.map((l) => map.get(l) as number).filter((s) => s !== answer));
    const extra = symbols.slice(letters.length);
    const opts = [answer, ...wrong, ...extra].slice(0, options);
    questions.push({ items: full.map((s, i) => (i === hole ? -1 : s)), hole, answer, options: rng.shuffle(opts) });
  }
  return { questions };
}
