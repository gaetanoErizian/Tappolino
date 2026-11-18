/** Generatore casuale con seme (mulberry32): stesso seme, stessa sequenza, su ogni telefono. Mai Math.random nei rompicapo. */
export class Rng {
  private s: number;
  constructor(seed: number) { this.s = (seed >>> 0) || 1; }
  next(): number {
    let t = (this.s += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  /** intero in [0, n) */
  int(n: number): number { return Math.floor(this.next() * n); }
  pick<T>(a: readonly T[]): T { return a[this.int(a.length)]; }
  shuffle<T>(a: T[]): T[] {
    for (let i = a.length - 1; i > 0; i--) { const j = this.int(i + 1); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  }
}

/** Seme del livello n di un certo rompicapo (versione del generatore inclusa: cambiare V cambia tutti i livelli). */
export function seedOf(kind: string, n: number, attempt = 0, V = 1): number {
  let h = 2166136261 ^ V;
  const s = `${kind}:${n}:${attempt}`;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
