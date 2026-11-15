import type { GameEntryDef } from '../../core/module';
import { cuccioliTile } from './tile';

/** Voce di menu del gioco 6: leggera, niente codice del gioco (si carica solo all'apertura). */
const entry: GameEntryDef = {
  id: 'cuccioli',
  order: 6,
  free: false,
  color: '#4cc3a5',
  titles: { it: 'Cuccioli dal Dottore', en: 'Little Pet Doctor', es: 'Veterinario de Cachorros', fr: 'Docteur des Petits Animaux', de: 'Tierarzt für Tierbabys', pt: 'Doutor dos Filhotes' },
  tile: cuccioliTile,
  load: () => import('./index'),
};

export default entry;
