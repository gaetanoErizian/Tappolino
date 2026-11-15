import type { GameEntryDef } from '../../core/module';
import { pompieriTile } from './tile';

/** Voce di menu del gioco 1: leggera, niente codice del gioco (si carica solo all'apertura). */
const entry: GameEntryDef = {
  id: 'pompieri',
  order: 1,
  free: true,
  color: '#ef4a35',
  titles: { it: "Pompieri in Azione", en: "Firefighters in Action", es: "Bomberos en Acción", fr: "Pompiers en Action", de: "Feuerwehr im Einsatz", pt: "Bombeiros em Ação" },
  tile: pompieriTile,
  load: () => import('./index'),
};

export default entry;
