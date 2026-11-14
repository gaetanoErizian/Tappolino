import type { GameModule } from '../../core/module';
import { gameTextures } from './art';
import { LOCALES } from './locales';
import { SONG } from './sfx';
import { save } from './save';
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
  song: SONG,
  // Carica i progressi salvati (livelli, camion, gattini) prima di mostrare il gioco.
  init: async () => { await save.load(); },
};

export default pompieri;
