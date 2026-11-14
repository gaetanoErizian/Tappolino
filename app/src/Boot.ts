import Phaser from 'phaser';
import { registerSvgTextures } from './core/textures';
import { commonTextures } from './core/art';
import { urlParam } from './core/platform';
import { hubTextures } from './hub/art';
import { GAMES, gameById } from './games/registry';
import { startApp } from './app';
import { launchGame } from './launcher';

export class Boot extends Phaser.Scene {
  constructor() { super('Boot'); }

  create(): void {
    const { width, height } = this.scale;
    const dot = this.add.circle(width / 2, height / 2, 30, 0xffffff);
    this.tweens.add({ targets: dot, scale: 1.5, alpha: 0.4, duration: 400, yoyo: true, repeat: -1 });
    const textures = [...commonTextures(), ...hubTextures(), ...GAMES.map((g) => g.tile())];
    void Promise.all([startApp(), registerSvgTextures(this, textures)]).then(() => {
      // Web di test: ?game=<id> apre direttamente un gioco.
      const direct = gameById(urlParam('game') ?? '');
      if (direct) void launchGame(this, direct);
      else this.scene.start('Hub');
    });
  }
}
