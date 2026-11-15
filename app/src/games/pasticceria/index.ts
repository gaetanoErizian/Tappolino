import type { GameModule } from '../../core/module';
import { gameTextures } from './art';
import { LOCALES } from './locales';
import { save } from './save';
import { sound } from '../../core/sound';
import { PACK, registerPasticceriaSound } from './sfx';
import { Menu } from './scenes/Menu';
import { Recipes } from './scenes/Recipes';
import { Game } from './scenes/Game';
import { Reward } from './scenes/Reward';
import { Showcase } from './scenes/Showcase';

/** Modulo "Pasticceria Magica" (gioco 2, gratis). */
const pasticceria: GameModule = {
  id: 'pasticceria',
  textures: gameTextures,
  locales: LOCALES,
  scenes: [Menu, Recipes, Game, Reward, Showcase],
  startScene: 'pasticceria:Menu',
  // Carica i progressi salvati (dolci serviti, vetrina).
  init: async () => { await save.load(); },
  // Musica ed effetti (file audio, ~1,3 MB): avanzamento nella barra del loader Tappolino.
  preload: (report) => { registerPasticceriaSound(); return sound.preload(PACK, report); },
};

export default pasticceria;
