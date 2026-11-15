import type { GameModule } from '../../core/module';
import { gameTextures } from './art';
import { LOCALES } from './locales';
import { save } from './save';
import { sound } from './sound';
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
  // Carica i progressi salvati (dolci serviti, vetrina) e prepara l'audio campionato (musica ed effetti).
  init: async () => { await save.load(); sound.install(); },
};

export default pasticceria;
