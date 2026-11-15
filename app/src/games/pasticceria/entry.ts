import type { GameEntryDef } from '../../core/module';
import { pasticceriaTile } from './tile';

/** Voce di menu del gioco 2: leggera, niente codice del gioco (si carica solo all'apertura). */
const entry: GameEntryDef = {
  id: 'pasticceria',
  order: 2,
  free: true,
  color: '#ff7fb0',
  titles: { it: "Pasticceria Magica", en: "Magic Bakery", es: "Pastelería Mágica", fr: "Pâtisserie Magique", de: "Zauberbäckerei", pt: "Confeitaria Mágica" },
  tile: pasticceriaTile,
  load: () => import('./index'),
};

export default entry;
