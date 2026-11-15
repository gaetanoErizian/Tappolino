import Phaser from 'phaser';
import { setupView, button, pulse, burst } from '../../../core/ui';
import { t } from '../../../core/i18n';
import { muteButton, homeButton, title3d, goTo } from '../../../core/hud';
import { backToHub } from '../../../launcher';
import { drawClinic, PetView } from '../world';
import { isPetId, nextPet } from '../logic';
import { save } from '../save';
import { playCuccioliMusic } from '../sfx';

/** Menu del gioco: visita (gioca), giardino dei cuccioli curati, casa (menu Tappolino). */
export class Menu extends Phaser.Scene {
  constructor() { super('cuccioli:Menu'); }

  create(): void {
    setupView(this);
    this.cameras.main.fadeIn(250, 143, 211, 255);
    playCuccioliMusic();
    drawClinic(this, { tableX: 1300 });

    const ttl = title3d(this, 960, 130, t('cuccioli.title'), 112);
    this.tweens.add({ targets: ttl, scale: 1.04, duration: 1400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    const play = button(this, 560, 540, 'btn_play', () => goTo(this, 'cuccioli:Clinic'), 1);
    pulse(this, play);
    button(this, 560, 850, 'cu_btn_garden', () => goTo(this, 'cuccioli:Garden'), 0.95);

    // sul lettino: l'ultimo cucciolo curato, oppure il primo paziente che aspetta
    const last = save.state.last;
    const id = isPetId(last) ? last : nextPet(save.state.cured, '');
    const pet = new PetView(this, id, 1300, 770, 0.82, { depth: 40 });
    this.time.delayedCall(700, () => pet.giggle());

    muteButton(this);
    homeButton(this, () => backToHub(this));

    this.input.on('pointerdown', (p: Phaser.Input.Pointer, over: Phaser.GameObjects.GameObject[]) => {
      if (over.length) return;
      if (pet.hit(p.worldX, p.worldY)) {
        pet.giggle();
        burst(this, p.worldX, p.worldY - 40, 'heart', { count: 5, speed: [120, 280], scale: [0.7, 0.2], gravity: -120, life: 1000 });
      } else {
        burst(this, p.worldX, p.worldY, 'sparkle', { count: 6, tints: [0xffffff, 0xa7f0dc], speed: [80, 220], scale: [0.45, 0], gravity: 0, life: 500 });
      }
    });
  }
}
