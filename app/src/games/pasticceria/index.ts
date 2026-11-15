import type { GameModule } from '../../core/module';
import { gameTextures } from './art';
import { LOCALES } from './locales';
import { SONG } from './sfx';
import { save } from './save';
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
  song: SONG,
  // Carica i progressi salvati (dolci serviti, vetrina) prima di mostrare il gioco.
  init: async () => { await save.load(); },
};

export default pasticceria;
