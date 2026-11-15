import type { GameEntry } from '../core/module';
import { pompieriTile } from './pompieri/tile';
import { pasticceriaTile } from './pasticceria/tile';

/**
 * Elenco dei giochi dell'app, nell'ordine del menu.
 * Ogni voce è leggera: il modulo vero si carica con import dinamico solo quando il gioco viene aperto.
 * Gratis (decisione 2): pompieri, pasticceria, dinosauri. Tutti gli altri: free: false.
 */
export const GAMES: GameEntry[] = [
  { id: 'pompieri', free: true, titleKey: 'games.pompieri', color: '#ef4a35', tile: pompieriTile, load: () => import('./pompieri') },
  { id: 'pasticceria', free: true, titleKey: 'games.pasticceria', color: '#ff7fb0', tile: pasticceriaTile, load: () => import('./pasticceria') },
];

export const gameById = (id: string): GameEntry | undefined => GAMES.find((g) => g.id === id);
