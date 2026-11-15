import type { GameModule } from '../../core/module';
import { gameTextures } from './art';
import { LOCALES } from './locales';
import { save } from './save';
import { sound } from '../../core/sound';
import { PACK, registerAtelierSound } from './sfx';
import { Menu } from './scenes/Menu';
import { Pick } from './scenes/Pick';
import { Dress } from './scenes/Dress';
import { Show } from './scenes/Show';
import { Gallery } from './scenes/Gallery';

/** Modulo "Atelier delle Principesse" (gioco 10, sbloccato con l'acquisto unico). */
const atelier: GameModule = {
  id: 'atelier',
  textures: gameTextures,
  locales: LOCALES,
  scenes: [Menu, Pick, Dress, Show, Gallery],
  startScene: 'atelier:Menu',
  // Carica i progressi salvati (sfilate, galleria, ultimo look).
  init: async () => { await save.load(); },
  // Musica ed effetti (file audio): avanzamento nella barra del loader Tappolino.
  preload: (report) => { registerAtelierSound(); return sound.preload(PACK, report); },
};

export default atelier;
