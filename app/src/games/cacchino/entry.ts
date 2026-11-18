import type { GameEntryDef } from '../../core/module';
import { cacchinoTile } from './tile';

/** Voce di menu di Cacchino (gioco 11): leggera, niente codice del gioco (si carica solo all'apertura). */
const entry: GameEntryDef = {
  id: 'cacchino',
  order: 11,
  free: false,
  color: '#b9793c',
  titles: { it: 'Cacchino', en: 'Cacchino', es: 'Cacchino', fr: 'Cacchino', de: 'Cacchino', pt: 'Cacchino' },
  tile: cacchinoTile,
  load: () => import('./index'),
};

export default entry;
