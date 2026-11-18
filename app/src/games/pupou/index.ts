import type { GameModule } from '../../core/module';
import { gameTextures } from './art';
import { LOCALES } from './locales';
import { save } from './save';
import { sound } from '../../core/sound';
import { PACK, registerPupouSound } from './sfx';
import { Home } from './scenes/Home';
import { Puzzle } from './scenes/Puzzle';

/**
 * Modulo "Pupou" (gioco 11): un cucciolo di cacchina da crescere — pappa, bagnetto, vasino, nanna, scuola, amici,
 * negozio e armadio — con quattro rompicapo di logica generati dal codice per completare le attività.
 */
const pupou: GameModule = {
  id: 'pupou',
  textures: gameTextures,
  locales: LOCALES,
  scenes: [Home, Puzzle],
  startScene: 'pupou:Home',
  // Carica i progressi salvati e fa scorrere il tempo passato da quando il gioco era chiuso.
  init: async () => { await save.load(); },
  preload: (report) => { registerPupouSound(); return sound.preload(PACK, report); },
};

export default pupou;
