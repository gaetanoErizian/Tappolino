import type { GameEntryDef } from '../../core/module';
import { atelierTile } from './tile';

/** Voce di menu del gioco 10: leggera, niente codice del gioco (si carica solo all'apertura). */
const entry: GameEntryDef = {
  id: 'atelier',
  order: 10,
  free: false,
  color: '#ee6fa8',
  titles: { it: 'Atelier delle Principesse', en: 'Princess Atelier', es: 'Taller de Princesas', fr: 'Atelier des Princesses', de: 'Prinzessinnen-Atelier', pt: 'Ateliê das Princesas' },
  tile: atelierTile,
  load: () => import('./index'),
};

export default entry;
