import Phaser from 'phaser';
import { setupView, button, pin } from '../../../core/ui';
import { t } from '../../../core/i18n';
import { muteButton, goTo } from '../../../core/hud';
import { RECIPES, unlocked } from '../recipes';
import { drawKitchen, Dessert, previewCreation, FONT } from '../world';
import { save } from '../save';
import { sfx } from '../sfx';

const PREVIEW_SCALE: Record<string, number> = { cupcake: 0.5, cookie: 0.6, cake: 0.5, gelato: 0.48 };

/** Scelta della ricetta: quelle ancora da scoprire sono sagome con il punto interrogativo. */
export class Recipes extends Phaser.Scene {
  constructor() { super('pasticceria:Recipes'); }

  create(): void {
    setupView(this);
    this.cameras.main.fadeIn(250, 143, 211, 255);
    drawKitchen(this);
    const open = unlocked(save.state.served).recipes;

    RECIPES.forEach((r, i) => {
      const x = 960 + (i - 1.5) * 430, y = 540;
      const ok = open.includes(r.id);
      const card = this.add.image(x, y, 'pa_card').setDepth(40);
      const s = PREVIEW_SCALE[r.id];
      const d = new Dessert(this, x, y - 40 + (r.id === 'cookie' ? 40 : r.id === 'gelato' ? 30 : 10), previewCreation(r), { plate: false, depth: 41 });
      d.c.setScale(s);
      const parts: Phaser.GameObjects.GameObject[] = [card, d.c];
      if (ok) {
        parts.push(this.add.text(x, y + 124, t(`pasticceria.recipe.${r.id}`), {
          fontFamily: FONT, fontSize: '50px', fontStyle: 'bold', color: '#c2386f',
        }).setOrigin(0.5).setDepth(42));
      } else {
        d.silhouette();
        d.c.setAlpha(0.55);
        parts.push(this.add.text(x, y - 40, '?', {
          fontFamily: FONT, fontSize: '170px', fontStyle: 'bold', color: '#ffffff', stroke: '#8a6aa8', strokeThickness: 16,
        }).setOrigin(0.5).setDepth(42));
      }
      // ingresso a cascata e leggero dondolio
      parts.forEach((o) => { const tgt = o as unknown as { y: number }; const y0 = tgt.y; tgt.y += 700; this.tweens.add({ targets: o, y: y0, duration: 500, delay: i * 90, ease: 'Back.easeOut' }); });
      this.time.delayedCall(700, () => this.tweens.add({ targets: parts, y: '-=10', duration: 1300, yoyo: true, repeat: -1, ease: 'Sine.easeInOut', delay: i * 250 }));

      card.setInteractive({ useHandCursor: true });
      card.on('pointerdown', () => {
        if (!ok) {
          sfx.nope();
          this.tweens.add({ targets: parts, x: '+=12', duration: 50, yoyo: true, repeat: 3 });
          return;
        }
        sfx.pick();
        this.tweens.add({ targets: parts, scale: '*=1.06', duration: 110, yoyo: true, onComplete: () => goTo(this, 'pasticceria:Game', { recipe: r.id }) });
      });
    });

    muteButton(this);
    const home = button(this, 0, 0, 'btn_home', () => goTo(this, 'pasticceria:Menu'), 0.85);
    pin(this, home, 'tl', 80, 80);
  }
}
