import type { GameModule } from '../../core/module';
import { gameTextures } from './art';
import { LOCALES } from './locales';
import { save } from './save';
import { sound } from '../../core/sound';
import { PACK, registerUnicorniSound } from './sfx';
import { Menu } from './scenes/Menu';
import { Salon } from './scenes/Salon';
import { Photo } from './scenes/Photo';
import { Album } from './scenes/Album';

/** Modulo "Salone degli Unicorni" (gioco 4, compreso nello sblocco unico). */
const unicorni: GameModule = {
  id: 'unicorni',
  textures: gameTextures,
  locales: LOCALES,
  scenes: [Menu, Salon, Photo, Album],
  startScene: 'unicorni:Menu',
  // Carica i progressi salvati (foto, unicorni pettinati).
  init: async () => { await save.load(); },
  // Musica ed effetti (file audio): avanzamento nella barra del loader Tappolino.
  preload: (report) => { registerUnicorniSound(); return sound.preload(PACK, report); },
};

export default unicorni;
