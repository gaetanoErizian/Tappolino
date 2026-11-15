import type { GameModule } from '../../core/module';
import { gameTextures } from './art';
import { LOCALES } from './locales';
import { save } from './save';
import { sound } from '../../core/sound';
import { PACK, registerTruckSound } from './sfx';
import { Menu } from './scenes/Menu';
import { Garage } from './scenes/Garage';
import { Race } from './scenes/Race';
import { Tracks } from './scenes/Tracks';

/** Modulo "Officina dei Monster Truck" (gioco 7, con l'acquisto unico). */
const monstertruck: GameModule = {
  id: 'monstertruck',
  textures: gameTextures,
  locales: LOCALES,
  scenes: [Menu, Garage, Race, Tracks],
  startScene: 'monstertruck:Menu',
  // Carica i progressi salvati (gare, pezzi sbloccati, truck personalizzato).
  init: async () => { await save.load(); },
  // Musica ed effetti (file audio): avanzamento nella barra del loader Tappolino.
  preload: (report) => { registerTruckSound(); return sound.preload(PACK, report); },
};

export default monstertruck;
