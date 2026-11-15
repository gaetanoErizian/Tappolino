import Phaser from 'phaser';
import { setupView, button, pulse, burst } from '../../../core/ui';
import { t } from '../../../core/i18n';
import { muteButton, homeButton, title3d, goTo } from '../../../core/hud';
import { backToHub } from '../../../launcher';
import { recipeById, unlocked } from '../recipes';
import { drawKitchen, Dessert, Customer, previewCreation, COUNTER_Y } from '../world';
import { save } from '../save';
import { sfx } from '../sfx';
import { sound } from '../sound';

/** Menu del gioco: gioca, vetrina dei dolci, casa (menu Tappolino). */
export class Menu extends Phaser.Scene {
  constructor() { super('pasticceria:Menu'); }

  create(): void {
    setupView(this);
    this.cameras.main.fadeIn(250, 143, 211, 255);
    sound.startMusic(this);
    drawKitchen(this);

    const ttl = title3d(this, 960, 140, t('pasticceria.title'), 120);
    this.tweens.add({ targets: ttl, scale: 1.04, duration: 1400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    const play = button(this, 700, 520, 'btn_play', () => goTo(this, ...playTarget()), 1);
    pulse(this, play);
    button(this, 700, 800, 'pa_btn_showcase', () => goTo(this, 'pasticceria:Showcase'), 0.85);

    // L'ultimo dolce creato (o un cupcake d'esempio) sul bancone, e un cliente che saluta.
    const last = save.state.creations[0] ?? previewCreation(recipeById('cupcake'));
    const s = 0.8;
    const d = new Dessert(this, 1210, COUNTER_Y + 10 - recipeById(last.r).plateDy * s, last, { depth: 50 });
    d.c.setScale(s);
    const cust = new Customer(this, 'bunny', 1640);
    cust.enter(1640);

    muteButton(this);
    homeButton(this, () => backToHub(this));

    this.input.on('pointerdown', (p: Phaser.Input.Pointer, over: Phaser.GameObjects.GameObject[]) => {
      if (over.length) return;
      if (Phaser.Math.Distance.Between(p.worldX, p.worldY, d.c.x, d.c.y - 60) < 220) {
        sfx.magic();
        this.tweens.add({ targets: d.c, scaleX: s * 1.08, scaleY: s * 0.92, duration: 110, yoyo: true, repeat: 1 });
        burst(this, d.c.x, d.c.y - 120, 'sparkle', { count: 12, tints: [0xffffff, 0xffe066, 0xffb3d9], gravity: 0, life: 700 });
      } else if (p.worldX > 1460 && p.worldY < COUNTER_Y + 40) {
        sfx.hello();
        cust.face('happy');
        cust.jump();
        this.time.delayedCall(800, () => cust.face('idle'));
      }
    });
  }
}

/** Con una sola ricetta si va dritti in cucina; con più ricette si sceglie. */
export function playTarget(): [string, object?] {
  const un = unlocked(save.state.served);
  return un.recipes.length > 1 ? ['pasticceria:Recipes'] : ['pasticceria:Game', { recipe: un.recipes[0] }];
}
