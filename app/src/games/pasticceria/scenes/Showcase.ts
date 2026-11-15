import Phaser from 'phaser';
import { setupView, button, pin, burst } from '../../../core/ui';
import { t } from '../../../core/i18n';
import { muteButton, title3d, goTo } from '../../../core/hud';
import { recipeById, SHOWCASE_MAX } from '../recipes';
import { drawKitchen, Dessert, FONT } from '../world';
import { save } from '../save';
import { sfx } from '../sfx';

const CASE = { x: 380, y: 230, w: 1160, h: 690 };
const SHELVES = [560, 880];
const S = 0.5;

/** Vetrina: gli ultimi 6 dolci creati dal bambino, esattamente come li ha decorati. */
export class Showcase extends Phaser.Scene {
  constructor() { super('pasticceria:Showcase'); }

  create(): void {
    setupView(this);
    this.cameras.main.fadeIn(250, 143, 211, 255);
    drawKitchen(this, { counter: false, window: false, fgAside: true });
    title3d(this, 960, 120, t('pasticceria.showcase'), 100);
    this.drawCase();

    const list = save.state.creations;
    for (let i = 0; i < SHOWCASE_MAX; i++) {
      const x = 960 + ((i % 3) - 1) * 360, shelf = SHELVES[Math.floor(i / 3)];
      const c = list[i];
      if (!c) {
        this.add.image(x, shelf - 6, 'pa_plate').setScale(0.42).setAlpha(0.35).setDepth(30);
        continue;
      }
      const r = recipeById(c.r);
      const d = new Dessert(this, x, shelf - 6 - r.plateDy * S, c, { depth: 30 + i });
      d.c.setScale(0);
      this.tweens.add({ targets: d.c, scale: S, duration: 400, delay: 200 + i * 110, ease: 'Back.easeOut' });
      // toccare un dolce lo fa brillare
      const hit = this.add.zone(x, shelf - 140, 300, 280).setInteractive({ useHandCursor: true }).setDepth(60);
      hit.on('pointerdown', () => {
        sfx.magic();
        this.tweens.add({ targets: d.c, scaleX: S * 1.1, scaleY: S * 0.9, duration: 110, yoyo: true });
        burst(this, x, shelf - 160, 'sparkle', { count: 10, tints: [0xffffff, 0xffe066], gravity: 0, life: 600 });
      });
    }
    this.add.text(960, 990, t('pasticceria.served', { n: save.state.served }), {
      fontFamily: FONT, fontSize: '54px', fontStyle: 'bold', color: '#ffffff', stroke: '#c2386f', strokeThickness: 8,
    }).setOrigin(0.5).setDepth(70);

    muteButton(this);
    const home = button(this, 0, 0, 'btn_home', () => goTo(this, 'pasticceria:Menu'), 0.85);
    pin(this, home, 'tl', 80, 80);
  }

  /** Vetrina in legno con vetro (riflessi sopra i dolci) e due ripiani. */
  private drawCase(): void {
    const { x, y, w, h } = CASE;
    const g = this.add.graphics().setDepth(20);
    g.fillStyle(0x3a2a52, 0.2).fillRoundedRect(x + 16, y + 24, w, h, 40);
    g.fillGradientStyle(0xf0c48f, 0xf0c48f, 0xc98b55, 0xc98b55, 1).fillRoundedRect(x, y, w, h, 40);
    g.fillGradientStyle(0xfff8fb, 0xfff8fb, 0xffe1ec, 0xffe1ec, 1).fillRoundedRect(x + 30, y + 30, w - 60, h - 60, 24);
    g.fillStyle(0x3a2a52, 0.08).fillRect(x + 30, y + 30, w - 60, 20);
    for (const sy of SHELVES) {
      g.fillStyle(0xf6d3aa, 1).fillRect(x + 30, sy - 14, w - 60, 14);
      g.fillGradientStyle(0xe2b07f, 0xe2b07f, 0xb7814f, 0xb7814f, 1).fillRect(x + 30, sy, w - 60, 26);
      g.fillStyle(0x3a2a52, 0.15).fillRect(x + 30, sy + 26, w - 60, 12);
    }
    g.lineStyle(6, 0xffffff, 0.5).strokeRoundedRect(x + 8, y + 8, w - 16, h - 16, 34);
    const glass = this.add.graphics().setDepth(55);
    glass.fillStyle(0xffffff, 0.16);
    glass.fillPoints([new Phaser.Math.Vector2(x + 140, y + 30), new Phaser.Math.Vector2(x + 300, y + 30), new Phaser.Math.Vector2(x + 120, y + h - 30), new Phaser.Math.Vector2(x + 30, y + h - 30), new Phaser.Math.Vector2(x + 30, y + 260)], true);
    glass.fillPoints([new Phaser.Math.Vector2(x + 820, y + 30), new Phaser.Math.Vector2(x + 880, y + 30), new Phaser.Math.Vector2(x + 640, y + h - 30), new Phaser.Math.Vector2(x + 580, y + h - 30)], true);
  }
}
