import Phaser from 'phaser';
import { registerSvgTextures } from './core/textures';
import { commonTextures } from './core/art';
import { brandTextures, loadBrandFont } from './core/brand';
import { runWithLoader, withTimeout } from './core/loader';
import { sound } from './core/sound';
import { urlParam } from './core/platform';
import { hubTextures } from './hub/art';
import { GAMES, gameById } from './games/registry';
import { startApp } from './app';
import { launchGame } from './launcher';

/** Avvio dell'app dietro il loader Tappolino: stato, carattere, grafica e audio del menu. */
export class Boot extends Phaser.Scene {
  constructor() { super('Boot'); }

  create(): void {
    const textures = [...commonTextures(), ...brandTextures(), ...hubTextures(), ...GAMES.map((g) => g.tile())];
    void runWithLoader([
      { weight: 2, run: () => startApp() },
      { weight: 1, optional: true, run: () => loadBrandFont() },
      { weight: 5, run: (report) => registerSvgTextures(this, textures, report) },
      // L'audio non deve mai bloccare l'avvio: oltre il tempo massimo si entra comunque (arriverà appena pronto).
      { weight: 3, optional: true, run: (report) => withTimeout(sound.preload('hub', report), 8000) },
    ]).then(() => {
      // Web di test: ?game=<id> apre direttamente un gioco.
      const direct = gameById(urlParam('game') ?? '');
      if (direct) void launchGame(this, direct);
      else this.scene.start('Hub');
    });
  }
}
