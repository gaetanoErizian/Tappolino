import Phaser from 'phaser';
import { registerSvgTextures } from '../core/textures';
import { commonTextures } from '../core/art';
import { gameTextures } from '../art';
import { startApp } from '../app';

export class Boot extends Phaser.Scene {
  constructor() { super('Boot'); }

  create(): void {
    const { width, height } = this.scale;
    const dot = this.add.circle(width / 2, height / 2, 30, 0xffffff);
    this.tweens.add({ targets: dot, scale: 1.5, alpha: 0.4, duration: 400, yoyo: true, repeat: -1 });
    void Promise.all([startApp(), registerSvgTextures(this, [...commonTextures(), ...gameTextures()])]).then(() => {
      this.scene.start('Menu');
    });
  }
}
