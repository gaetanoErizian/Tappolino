import type { GameModule } from '../../core/module';
import { gameTextures } from './art';
import { LOCALES } from './locales';
import { save } from './save';
import { sound } from '../../core/sound';
import { PACK, registerPompieriSound } from './sfx';
import { Menu } from './scenes/Menu';
import { Game } from './scenes/Game';
import { Reward } from './scenes/Reward';
import { Garage } from './scenes/Garage';

/** Modulo "Pompieri in Azione" (gioco 1, gratis). */
const pompieri: GameModule = {
  id: 'pompieri',
  textures: gameTextures,
  locales: LOCALES,
  scenes: [Menu, Game, Reward, Garage],
  startScene: 'pompieri:Menu',
  // Carica i progressi salvati (livelli, camion, gattini) prima di mostrare il gioco.
  init: async () => { await save.load(); },
  // Musica ed effetti (file audio, ~1,8 MB): avanzamento nella barra del loader Tappolino.
  preload: (report) => { registerPompieriSound(); return sound.preload(PACK, report); },
};

export default pompieri;
