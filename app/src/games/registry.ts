import type { GameEntry, GameEntryDef } from '../core/module';
import type { Dict, Lang } from '../core/i18n';

/**
 * Elenco dei giochi dell'app, costruito da solo: ogni cartella `games/<id>/` con un file `entry.ts`
 * compare nel menu, nell'ordine dato da `order`. Per aggiungere un gioco NON si modifica questo file
 * (così più giochi possono essere sviluppati in parallelo senza conflitti): basta creare la cartella.
 * Ogni voce è leggera: il modulo vero si carica con import dinamico solo quando il gioco viene aperto.
 * Gratis (decisione 2): pompieri, pasticceria, dinosauri. Tutti gli altri: free: false.
 */
const found = import.meta.glob('./*/entry.ts', { eager: true, import: 'default' }) as Record<string, GameEntryDef>;

export const GAMES: GameEntry[] = Object.values(found)
  .map((e) => ({ ...e, titleKey: `games.${e.id}` }))
  .sort((a, b) => a.order - b.order || a.id.localeCompare(b.id));

export const gameById = (id: string): GameEntry | undefined => GAMES.find((g) => g.id === id);

/** Titoli dei giochi come testi dell'app (`games.<id>`), nelle 6 lingue. */
export function gameTitles(): Record<Lang, Dict> {
  const out = { it: {}, en: {}, es: {}, fr: {}, de: {}, pt: {} } as Record<Lang, Dict>;
  for (const g of GAMES) for (const l of Object.keys(out) as Lang[]) out[l][g.titleKey] = g.titles[l];
  return out;
}
