import Phaser from 'phaser';
import { setupView, button, pulse, burst } from '../../../core/ui';
import { t } from '../../../core/i18n';
import { drawBackdrop, FONT } from '../world';
import { medalKind, truckById } from '../levels';
import { save } from '../save';
import { sfx, playPompieriMusic } from '../sfx';
import { muteButton, title3d, goTo } from './common';

/** Ricompensa: medaglia del livello e, se sbloccato, un camion nuovo. Solo icone e animazioni. */
export class Reward extends Phaser.Scene {
  constructor() { super('pompieri:Reward'); }

  create(data: { level?: number; unlocked?: string[] }): void {
    playPompieriMusic();
    const level = data.level ?? Math.max(0, save.state.levelsDone - 1);
    const unlocked = data.unlocked ?? [];
    const newTruck = unlocked.length ? truckById(unlocked[unlocked.length - 1]) : null;

    setupView(this);
    this.cameras.main.fadeIn(250, 143, 211, 255);
    drawBackdrop(this, { sunX: -400 });
    muteButton(this);

    const mx = newTruck ? 620 : 960;
    const rays = this.add.image(mx, 430, 'rays').setScale(1.3).setDepth(10).setAlpha(0.9);
    this.tweens.add({ targets: rays, scale: 1.45, alpha: 0.6, duration: 1600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    const medal = this.add.image(mx, -300, `medal_${medalKind(level)}`).setScale(1.3).setDepth(20);
    const num = this.add.text(mx, -238, String(level + 1), {
      fontFamily: FONT, fontSize: '110px', fontStyle: 'bold', color: '#ffffff', stroke: '#2b2140', strokeThickness: 16,
    }).setOrigin(0.5).setDepth(21);
    this.tweens.add({
      targets: [medal, num], y: '+=700', duration: 700, ease: 'Bounce.easeOut',
      onComplete: () => {
        sfx.medal();
        burst(this, mx, 480, 'star', { count: 12, speed: [300, 600], scale: [0.7, 0.1], gravity: 500, life: 1000 });
        this.tweens.add({ targets: [medal, num], scale: '*=1.06', duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      },
    });
    for (let i = 0; i < 4; i++) {
      this.time.delayedCall(300 + i * 300, () => burst(this, 300 + Math.random() * 1320, 150, 'confetti', {
        count: 22, tints: [0xff5e5e, 0xffd23f, 0x3cc46a, 0x4fa3ff, 0xff6fb5], speed: [250, 700], scale: [1.4, 0.6], life: 1600, gravity: 800,
      }));
    }

    if (newTruck) {
      const lbl = title3d(this, 1300, 300, t('pompieri.newTruck'), 80).setAlpha(0);
      const tr = this.add.image(-700, 640, `truck_${newTruck.id}`).setDepth(20).setScale(0.95);
      this.time.delayedCall(1100, () => {
        sfx.whoosh();
        this.tweens.add({
          targets: tr, x: 1300, duration: 900, ease: 'Back.easeOut',
          onComplete: () => {
            sfx.siren(newTruck.siren);
            burst(this, 1300, 600, 'sparkle', { count: 16, tints: [0xffffff, 0xffe066], speed: [200, 500], scale: [1, 0], gravity: 0, life: 900 });
            this.tweens.add({ targets: lbl, alpha: 1, duration: 300 });
            this.tweens.add({ targets: tr, y: tr.y - 20, duration: 160, yoyo: true, repeat: 3 });
          },
        });
      });
      // Il camion nuovo diventa subito quello in uso: sorpresa immediata nel prossimo livello.
      save.update({ truck: newTruck.id });
    }

    const next = button(this, 1680, 900, 'btn_next', () => goTo(this, 'pompieri:Game'), 1).setAlpha(0);
    this.tweens.add({ targets: next, alpha: 1, delay: newTruck ? 2200 : 1000, duration: 300, onComplete: () => pulse(this, next) });
    button(this, 230, 930, 'btn_home', () => goTo(this, 'pompieri:Menu'), 0.9);
  }
}
