import type { GameModule } from '../../core/module';
import { gameTextures } from './art';
import { LOCALES } from './locales';
import { save } from './save';
import { sound } from '../../core/sound';
import { PACK, registerCuccioliSound } from './sfx';
import { Menu } from './scenes/Menu';
import { Clinic } from './scenes/Clinic';
import { Garden } from './scenes/Garden';

/** Modulo "Cuccioli dal Dottore" (gioco 6, sbloccato con l'acquisto unico). */
const cuccioli: GameModule = {
  id: 'cuccioli',
  textures: gameTextures,
  locales: LOCALES,
  scenes: [Menu, Clinic, Garden],
  startScene: 'cuccioli:Menu',
  // Carica i progressi salvati (giardino e visite).
  init: async () => { await save.load(); },
  // Musica ed effetti (file audio): avanzamento nella barra del loader Tappolino.
  preload: (report) => { registerCuccioliSound(); return sound.preload(PACK, report); },
};

export default cuccioli;
