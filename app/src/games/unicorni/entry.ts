import type { GameEntryDef } from '../../core/module';
import { unicorniTile } from './tile';

/** Voce di menu del gioco 4: leggera, niente codice del gioco (si carica solo all'apertura). */
const entry: GameEntryDef = {
  id: 'unicorni',
  order: 4,
  free: false,
  color: '#b58cf0',
  titles: { it: 'Salone degli Unicorni', en: 'Unicorn Salon', es: 'Salón de Unicornios', fr: 'Salon des Licornes', de: 'Einhorn-Salon', pt: 'Salão dos Unicórnios' },
  tile: unicorniTile,
  load: () => import('./index'),
};

export default entry;
