import type { PuzzleKind } from '../logic';
import { generatePath, type PathLevel } from './path';
import { generateSort, type SortLevel } from './sort';
import { generateExit, type ExitLevel } from './exit';
import { generateSeq, type SeqLevel } from './seq';

export type AnyLevel = PathLevel | SortLevel | ExitLevel | SeqLevel;

/** Il rompicapo numero n di un tipo: sempre lo stesso su ogni telefono. */
export function generate(kind: PuzzleKind, n: number): AnyLevel {
  const k = Math.max(0, Math.floor(n));
  return kind === 'path' ? generatePath(k) : kind === 'sort' ? generateSort(k) : kind === 'exit' ? generateExit(k) : generateSeq(k);
}
