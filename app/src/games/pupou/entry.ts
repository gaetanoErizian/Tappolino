import type { GameEntryDef } from '../../core/module';
import { pupouTile } from './tile';

/** Voce di menu di Pupou (gioco 11): leggera, niente codice del gioco (si carica solo all'apertura). */
const entry: GameEntryDef = {
  id: 'pupou',
  order: 11,
  free: false,
  color: '#b9793c',
  titles: { it: 'Pupou', en: 'Pupou', es: 'Pupou', fr: 'Pupou', de: 'Pupou', pt: 'Pupou' },
  tile: pupouTile,
  load: () => import('./index'),
};

export default entry;
