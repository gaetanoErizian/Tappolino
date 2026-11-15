import type { GameModule } from '../../core/module';
import { gameTextures } from './art';
import { LOCALES } from './locales';
import { save } from './save';
import { sound } from '../../core/sound';
import { PACK, registerDinosauriSound } from './sfx';
import { Menu } from './scenes/Menu';
import { Dig } from './scenes/Dig';
import { Album } from './scenes/Album';

/** Modulo "Scavo dei Dinosauri" (gioco 3, gratis). */
const dinosauri: GameModule = {
  id: 'dinosauri',
  textures: gameTextures,
  locales: LOCALES,
  scenes: [Menu, Dig, Album],
  startScene: 'dinosauri:Menu',
  // Carica i progressi salvati (album dei dinosauri).
  init: async () => { await save.load(); },
  // Musica ed effetti (file audio): avanzamento nella barra del loader Tappolino.
  preload: (report) => { registerDinosauriSound(); return sound.preload(PACK, report); },
};

export default dinosauri;
