import type { GameModule } from '../../core/module';
import { gameTextures } from './art';
import { LOCALES } from './locales';
import { save } from './save';
import { sound } from '../../core/sound';
import { PACK, registerGiardinoSound } from './sfx';
import { Menu } from './scenes/Menu';
import { Garden } from './scenes/Garden';
import { Album } from './scenes/Album';

/** Modulo "Giardino delle Fate" (gioco 8, sbloccato con l'acquisto unico). */
const giardino: GameModule = {
  id: 'giardino',
  textures: gameTextures,
  locales: LOCALES,
  scenes: [Menu, Garden, Album],
  startScene: 'giardino:Menu',
  // Carica il giardino salvato (aiuole, ultimo fiore, tutorial).
  init: async () => { await save.load(); },
  // Musica ed effetti (file audio): avanzamento nella barra del loader Tappolino.
  preload: (report) => { registerGiardinoSound(); return sound.preload(PACK, report); },
};

export default giardino;
