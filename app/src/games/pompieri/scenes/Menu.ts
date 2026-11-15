import Phaser from 'phaser';
import { setupView, button, pulse } from '../../../core/ui';
import { t } from '../../../core/i18n';
import { drawBackdrop, drawBuilding, Truck, GROUND_Y } from '../world';
import { wallColor } from '../levels';
import { save } from '../save';
import { sfx, playPompieriMusic } from '../sfx';
import { muteButton, title3d, goTo } from './common';
import { homeButton } from '../../../core/hud';
import { backToHub } from '../../../launcher';

export class Menu extends Phaser.Scene {
  constructor() { super('pompieri:Menu'); }

  create(): void {
    playPompieriMusic();
    setupView(this);
    this.cameras.main.fadeIn(250, 143, 211, 255);
    drawBackdrop(this);
    const b = drawBuilding(this, 1500, 3, 2, wallColor(save.state.levelsDone));
    const truck = new Truck(this, 40, 630, save.state.truck);

    // Gattino che saluta da una finestra: toccalo e miagola.
    const cell = b.cells[4];
    const cat = this.add.image(cell.x, cell.y + 22, 'cat').setDepth(41).setScale(0.95);
    this.tweens.add({ targets: cat, y: cat.y - 10, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    const ttl = title3d(this, 960, 150, t('pompieri.title'), 120);
    this.tweens.add({ targets: ttl, scale: 1.04, duration: 1400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    const play = button(this, 860, 520, 'btn_play', () => goTo(this, 'pompieri:Game'), 1);
    pulse(this, play);
    button(this, 860, 800, 'btn_garage', () => goTo(this, 'pompieri:Garage'), 0.85);

    muteButton(this);
    // La casa riporta al menu dei giochi Tappolino (l'area genitori è lì).
    homeButton(this, () => backToHub(this));

    this.input.on('pointerdown', (p: Phaser.Input.Pointer, over: Phaser.GameObjects.GameObject[]) => {
      if (over.length) return;
      if (truck.contains(p.worldX, p.worldY)) truck.honk();
      else if (Phaser.Math.Distance.Between(p.worldX, p.worldY, cat.x, cat.y) < 110) {
        sfx.meow();
        cat.setTexture('cat_happy');
        this.time.delayedCall(700, () => cat.setTexture('cat'));
      } else if (p.worldY < GROUND_Y) {
        truck.spray(p.worldX, p.worldY);
      }
    });
  }
}
