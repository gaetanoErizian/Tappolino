import type { GameEntryDef } from '../../core/module';
import { trenoTile } from './tile';

/** Voce di menu del gioco 9: leggera, niente codice del gioco (si carica solo all'apertura). */
const entry: GameEntryDef = {
  id: 'treno',
  order: 9,
  free: false,
  color: '#e2574c',
  titles: { it: 'Treno degli Animali', en: 'Animal Train', es: 'El Tren de los Animales', fr: 'Le Train des Animaux', de: 'Der Tierzug', pt: 'O Trem dos Animais' },
  tile: trenoTile,
  load: () => import('./index'),
};

export default entry;
