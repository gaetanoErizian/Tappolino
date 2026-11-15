import type { GameEntryDef } from '../../core/module';
import { dinosauriTile } from './tile';

/** Voce di menu del gioco 3: leggera, niente codice del gioco (si carica solo all'apertura). */
const entry: GameEntryDef = {
  id: 'dinosauri',
  order: 3,
  free: true,
  color: '#c9853a',
  titles: { it: 'Scavo dei Dinosauri', en: 'Dinosaur Dig', es: 'Excavación de Dinosaurios', fr: 'Fouille de Dinosaures', de: 'Dinosaurier-Ausgrabung', pt: 'Escavação de Dinossauros' },
  tile: dinosauriTile,
  load: () => import('./index'),
};

export default entry;
