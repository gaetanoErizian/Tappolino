import Phaser from 'phaser';
import { setupView } from '../../../core/ui';
import { t } from '../../../core/i18n';
import { muteButton, homeButton, title3d } from '../../../core/hud';
import { backToHub } from '../../../launcher';

/** Menu del gioco (provvisorio: scheletro del modulo). */
export class Menu extends Phaser.Scene {
  constructor() { super('pasticceria:Menu'); }

  create(): void {
    setupView(this);
    this.cameras.main.fadeIn(250, 143, 211, 255);
    this.add.graphics().fillGradientStyle(0xffe3ec, 0xffe3ec, 0xffc7da, 0xffc7da, 1).fillRect(-2000, -1600, 5920, 3800);
    title3d(this, 960, 150, t('pasticceria.title'), 120);
    this.add.image(960, 560, 'tile_pasticceria').setScale(2);
    muteButton(this);
    homeButton(this, () => backToHub(this));
  }
}
