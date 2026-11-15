import type { GameModule } from '../../core/module';
import { LOCALES } from './locales';
import { save } from './save';
import { Menu } from './scenes/Menu';

/** Modulo "Pasticceria Magica" (gioco 2, gratis). */
const pasticceria: GameModule = {
  id: 'pasticceria',
  textures: () => [],
  locales: LOCALES,
  scenes: [Menu],
  startScene: 'pasticceria:Menu',
  // Carica i progressi salvati (dolci serviti, vetrina) prima di mostrare il gioco.
  init: async () => { await save.load(); },
};

export default pasticceria;
