import Phaser from 'phaser';
import { setupView, button, pin, burst } from '../core/ui';
import { drawBackdrop, FONT } from '../world';
import { TRUCKS, isUnlocked } from '../levels';
import { save } from '../save';
import { sfx } from '../sfx';
import { muteButton, goTo } from './common';

/** Garage: collezione di camion (sbloccati giocando) e contatori medaglie/gattini. */
export class Garage extends Phaser.Scene {
  constructor() { super('Garage'); }

  create(): void {
    setupView(this);
    this.cameras.main.fadeIn(250, 143, 211, 255);
    drawBackdrop(this, { street: false });
    const back = button(this, 0, 0, 'btn_back', () => goTo(this, 'Menu'), 0.85);
    pin(this, back, 'tl', 80, 80);
    muteButton(this);

    // Contatori in alto
    const stat = (x: number, key: string, n: number, scale: number) => {
      this.add.image(x, 95, key).setScale(scale).setDepth(20);
      this.add.text(x + 60, 95, `× ${n}`, { fontFamily: FONT, fontSize: '64px', fontStyle: 'bold', color: '#fff', stroke: '#2b2140', strokeThickness: 12 })
        .setOrigin(0, 0.5).setDepth(20);
    };
    stat(700, 'medal_icon', save.state.levelsDone, 0.75);
    stat(1080, 'cat_happy', save.state.catsSaved, 0.7);

    const done = save.state.levelsDone;
    const panels: Phaser.GameObjects.Graphics[] = [];
    const drawPanel = (g: Phaser.GameObjects.Graphics, selected: boolean) => {
      g.clear();
      g.fillStyle(0x1d2440, 0.18).fillRoundedRect(-200, -132, 420, 300, 36);
      g.fillGradientStyle(0xffffff, 0xf3f8ff, 0xdbe9f7, 0xc9dcf0, selected ? 0.95 : 0.7).fillRoundedRect(-210, -150, 420, 300, 36);
      g.fillStyle(0xffffff, 0.6).fillRoundedRect(-196, -140, 392, 10, 5);
      g.lineStyle(selected ? 10 : 3, selected ? 0xffb703 : 0x9fb6cf, 1).strokeRoundedRect(-210, -150, 420, 300, 36);
    };
    TRUCKS.forEach((tr, i) => {
      const x = 480 + (i % 3) * 480;
      const y = 380 + Math.floor(i / 3) * 360;
      const unlocked = isUnlocked(tr, done);
      const g = this.add.graphics({ x, y }).setDepth(10);
      panels.push(g);
      drawPanel(g, unlocked && save.state.truck === tr.id);
      const img = this.add.image(x, y + 10, `truck_${tr.id}`).setScale(0.66).setDepth(11);
      if (!unlocked) {
        img.setTint(0x2b2140).setAlpha(0.55);
        this.add.image(x, y - 10, 'btn_lock').setScale(0.8).setDepth(12);
        this.add.image(x - 40, y + 105, 'medal_icon').setScale(0.42).setDepth(12);
        this.add.text(x - 10, y + 105, `${tr.unlockAt}`, { fontFamily: FONT, fontSize: '52px', fontStyle: 'bold', color: '#fff', stroke: '#2b2140', strokeThickness: 10 })
          .setOrigin(0, 0.5).setDepth(12);
      }
      const zone = this.add.zone(x, y, 420, 300).setInteractive().setDepth(13);
      zone.on('pointerdown', () => {
        if (!unlocked) {
          sfx.pop();
          this.tweens.add({ targets: img, x: x + 12, duration: 50, yoyo: true, repeat: 3 });
          return;
        }
        save.update({ truck: tr.id });
        TRUCKS.forEach((t2, j) => drawPanel(panels[j], isUnlocked(t2, done) && t2.id === tr.id));
        sfx.siren(tr.siren);
        burst(this, x, y, 'sparkle', { count: 12, tints: [0xffffff, 0xffe066], gravity: 0, life: 700 });
        this.tweens.add({ targets: img, y: img.y - 24, duration: 140, yoyo: true, repeat: 2, ease: 'Quad.easeOut' });
      });
    });
  }
}
