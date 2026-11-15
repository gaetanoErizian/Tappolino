import type { GameModule } from '../../core/module';
import { gameTextures } from './art';
import { LOCALES } from './locales';
import { save } from './save';
import { sound } from '../../core/sound';
import { PACK, registerRazzoSound } from './sfx';
import { Menu } from './scenes/Menu';
import { Flight } from './scenes/Flight';
import { Planets } from './scenes/Planets';
import { Hangar } from './scenes/Hangar';

/** Modulo "Razzo tra le Stelle" (gioco 5, con l'acquisto unico). */
const razzo: GameModule = {
  id: 'razzo',
  textures: gameTextures,
  locales: LOCALES,
  scenes: [Menu, Flight, Planets, Hangar],
  startScene: 'razzo:Menu',
  // Carica i progressi salvati (pianeti visitati, razzi, stelle).
  init: async () => { await save.load(); },
  // Musica ed effetti (file audio): avanzamento nella barra del loader Tappolino.
  preload: (report) => { registerRazzoSound(); return sound.preload(PACK, report); },
};

export default razzo;
