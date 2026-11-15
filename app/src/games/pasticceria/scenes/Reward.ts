import Phaser from 'phaser';
import { setupView, button, pulse, burst } from '../../../core/ui';
import { t } from '../../../core/i18n';
import { muteButton, title3d, goTo } from '../../../core/hud';
import { recipeById, colorHex, type Creation, type Reward as RewardT } from '../recipes';
import { drawKitchen, Dessert, previewCreation, COUNTER_Y, hex } from '../world';
import { sfx } from '../sfx';
import { playTarget } from './Menu';

/** Festa: il dolce appena servito e, se c'è, la sorpresa sbloccata (ricetta, decorazione, glassa). */
export class Reward extends Phaser.Scene {
  constructor() { super('pasticceria:Reward'); }

  create(data: { creation: Creation; reward: RewardT | null }): void {
    setupView(this);
    this.cameras.main.fadeIn(250, 143, 211, 255);
    drawKitchen(this);
    muteButton(this);
    const reward = data.reward;
    const mx = reward ? 640 : 960;

    const rays = this.add.image(mx, 520, 'pa_rays').setDepth(10).setAlpha(0.9).setScale(1.2);
    this.tweens.add({ targets: rays, scale: 1.4, alpha: 0.6, duration: 1600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    const s = 0.9;
    const r = recipeById(data.creation.r);
    const d = new Dessert(this, mx, -400, data.creation, { depth: 50 });
    d.c.setScale(s);
    this.tweens.add({
      targets: d.c, y: COUNTER_Y + 10 - r.plateDy * s, duration: 700, ease: 'Bounce.easeOut',
      onComplete: () => {
        sfx.fanfare();
        burst(this, mx, 420, 'star', { count: 12, speed: [300, 600], scale: [0.7, 0.1], gravity: 500, life: 1000 });
      },
    });
    const ttl = title3d(this, mx, 150, t('pasticceria.bravo'), 110).setScale(0);
    this.tweens.add({ targets: ttl, scale: 1, duration: 400, delay: 500, ease: 'Back.easeOut' });
    for (let i = 0; i < 4; i++) {
      this.time.delayedCall(300 + i * 300, () => burst(this, 300 + Math.random() * 1320, 150, 'confetti', {
        count: 22, tints: [0xff8fc2, 0xffd23f, 0x8fe3c2, 0x4fa3ff, 0xb48cff], speed: [250, 700], scale: [1.4, 0.6], life: 1600, gravity: 800,
      }));
    }

    if (reward) this.time.delayedCall(1300, () => this.showReward(reward));

    const next = button(this, 1680, 920, 'btn_next', () => goTo(this, ...playTarget()), 1).setAlpha(0);
    this.tweens.add({ targets: next, alpha: 1, delay: reward ? 2400 : 1200, duration: 300, onComplete: () => pulse(this, next) });
    button(this, 230, 930, 'btn_home', () => goTo(this, 'pasticceria:Menu'), 0.9);
  }

  private showReward(rw: RewardT): void {
    const x = 1380;
    const key = rw.kind === 'recipe' ? 'newRecipe' : rw.kind === 'topping' ? 'newTopping' : 'newColor';
    const lbl = title3d(this, x, 250, t(`pasticceria.${key}`), 80).setScale(0);
    const glow = this.add.image(x, 560, 'glow').setScale(3.4).setAlpha(0).setDepth(30).setBlendMode(Phaser.BlendModes.ADD);
    let objs: Phaser.GameObjects.GameObject[];
    if (rw.kind === 'recipe') {
      const r = recipeById(rw.id);
      const d = new Dessert(this, x, 560 + (r.id === 'cookie' ? 60 : 30), previewCreation(r), { plate: false, depth: 40 });
      objs = [d.c];
      d.c.setScale(0);
      this.tweens.add({ targets: d.c, scale: r.id === 'cookie' ? 0.8 : 0.62, duration: 500, ease: 'Back.easeOut' });
    } else if (rw.kind === 'topping') {
      const img = this.add.image(x, 560, `pa_top_${rw.id}`).setDepth(40).setScale(0);
      objs = [img];
      this.tweens.add({ targets: img, scale: 2.6, duration: 500, ease: 'Back.easeOut' });
    } else {
      const bag = this.add.image(x, 560, 'pa_bag').setTint(hex(colorHex(rw.id))).setDepth(40).setScale(0);
      const tip = this.add.image(x, 560, 'pa_bag_tip').setDepth(41).setScale(0);
      objs = [bag, tip];
      this.tweens.add({ targets: objs, scale: 1.6, duration: 500, ease: 'Back.easeOut' });
    }
    sfx.magic();
    this.tweens.add({ targets: lbl, scale: 1, duration: 350, ease: 'Back.easeOut' });
    this.tweens.add({ targets: glow, alpha: 0.6, duration: 400 });
    burst(this, x, 560, 'sparkle', { count: 18, tints: [0xffffff, 0xffe066, 0xffb3d9], speed: [200, 500], scale: [1, 0], gravity: 0, life: 900 });
    this.time.delayedCall(600, () => this.tweens.add({ targets: objs, y: '-=16', duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' }));
  }
}
