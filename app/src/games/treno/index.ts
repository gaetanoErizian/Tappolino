import type { GameModule } from '../../core/module';
import { gameTextures } from './art';
import { LOCALES } from './locales';
import { save } from './save';
import { sound } from '../../core/sound';
import { PACK, registerTrenoSound } from './sfx';
import { Menu } from './scenes/Menu';
import { Station } from './scenes/Station';
import { Journey } from './scenes/Journey';
import { Arrive } from './scenes/Arrive';
import { Album } from './scenes/Album';

/** Modulo "Treno degli Animali" (gioco 9, sbloccato con l'acquisto unico). */
const treno: GameModule = {
  id: 'treno',
  textures: gameTextures,
  locales: LOCALES,
  scenes: [Menu, Station, Journey, Arrive, Album],
  startScene: 'treno:Menu',
  // Carica i progressi salvati (viaggi e animali portati a casa).
  init: async () => { await save.load(); },
  // Musica ed effetti (file audio): avanzamento nella barra del loader Tappolino.
  preload: (report) => { registerTrenoSound(); return sound.preload(PACK, report); },
};

export default treno;
