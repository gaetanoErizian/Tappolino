import type { GameEntryDef } from '../../core/module';
import { razzoTile } from './tile';

/** Voce di menu del gioco 5: leggera, niente codice del gioco (si carica solo all'apertura). */
const entry: GameEntryDef = {
  id: 'razzo',
  order: 5,
  free: false,
  color: '#3c4fc4',
  titles: { it: 'Razzo tra le Stelle', en: 'Rocket to the Stars', es: 'Cohete entre Estrellas', fr: 'Fusée dans les Étoiles', de: 'Rakete zu den Sternen', pt: 'Foguete nas Estrelas' },
  tile: razzoTile,
  load: () => import('./index'),
};

export default entry;
