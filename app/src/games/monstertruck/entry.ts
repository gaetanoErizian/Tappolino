import type { GameEntryDef } from '../../core/module';
import { monstertruckTile } from './tile';

/** Voce di menu del gioco 7: leggera, niente codice del gioco (si carica solo all'apertura). */
const entry: GameEntryDef = {
  id: 'monstertruck',
  order: 7,
  free: false,
  color: '#f2a01e',
  titles: { it: 'Officina dei Monster Truck', en: 'Monster Truck Workshop', es: 'Taller de Monster Trucks', fr: 'Garage des Monster Trucks', de: 'Monster-Truck-Werkstatt', pt: 'Oficina dos Monster Trucks' },
  tile: monstertruckTile,
  load: () => import('./index'),
};

export default entry;
