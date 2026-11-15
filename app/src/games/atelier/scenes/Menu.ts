import Phaser from 'phaser';
import { setupView, button, pulse, burst } from '../../../core/ui';
import { t } from '../../../core/i18n';
import { muteButton, homeButton, title3d, goTo } from '../../../core/hud';
import { backToHub } from '../../../launcher';
import { drawAtelier, pedestal, Doll } from '../world';
import { signatureLook, unlockedItems } from '../logic';
import { save } from '../save';
import { sfx, playAtelierMusic } from '../sfx';

/** Menu del gioco: gioca (scelta del personaggio), galleria dei ritratti, casa (menu Tappolino). */
export class Menu extends Phaser.Scene {
  constructor() { super('atelier:Menu'); }

  create(): void {
    setupView(this);
    this.cameras.main.fadeIn(250, 143, 211, 255);
    playAtelierMusic();
    drawAtelier(this, { mannequins: true, chandeliers: true, mirror: true });

    const ttl = title3d(this, 960, 120, t('atelier.title'), 104);
    this.tweens.add({ targets: ttl, scale: 1.04, duration: 1400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    const play = button(this, 600, 560, 'btn_play', () => goTo(this, 'atelier:Pick'), 1);
    pulse(this, play);
    button(this, 600, 860, 'at_btn_gallery', () => goTo(this, 'atelier:Gallery'), 0.95);

    // sulla pedana: l'ultimo look in sfilata, oppure Lia con quello che c'è già nel guardaroba
    const look = save.state.last ?? signatureLook('lia', unlockedItems(save.state.shows));
    pedestal(this, 1290, 985, 0.8, 30);
    const doll = new Doll(this, look, 1290, 980, 0.8, { depth: 40 });
    this.time.delayedCall(700, () => { doll.twirl(); sfx.twirl(); });

    muteButton(this);
    homeButton(this, () => backToHub(this));

    this.input.on('pointerdown', (p: Phaser.Input.Pointer, over: Phaser.GameObjects.GameObject[]) => {
      if (over.length) return;
      if (doll.hit(p.worldX, p.worldY)) {
        doll.twirl();
        sfx.twirl();
        burst(this, p.worldX, p.worldY - 40, 'sparkle', { count: 10, tints: [0xffffff, 0xffd04d, 0xff9cc6], speed: [150, 380], scale: [0.7, 0], gravity: 0, life: 800 });
      } else {
        burst(this, p.worldX, p.worldY, 'sparkle', { count: 6, tints: [0xffffff, 0xffc2dc], speed: [80, 220], scale: [0.45, 0], gravity: 0, life: 500 });
      }
    });
  }
}
