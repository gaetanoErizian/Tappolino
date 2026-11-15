import type { GameEntryDef } from '../../core/module';
import { giardinoTile } from './tile';

/** Voce di menu del gioco 8: leggera, niente codice del gioco (si carica solo all'apertura). */
const entry: GameEntryDef = {
  id: 'giardino',
  order: 8,
  free: false,
  color: '#5fbf6a',
  titles: { it: 'Giardino delle Fate', en: 'Fairy Garden', es: 'Jardín de las Hadas', fr: 'Le Jardin des Fées', de: 'Feengarten', pt: 'Jardim das Fadas' },
  tile: giardinoTile,
  load: () => import('./index'),
};

export default entry;
