import Phaser from 'phaser';
import { setupView, button, pulse, burst } from '../../../core/ui';
import { t } from '../../../core/i18n';
import { muteButton, homeButton, title3d, goTo } from '../../../core/hud';
import { backToHub } from '../../../launcher';
import { drawDesert, DinoView } from '../world';
import { isDinoId } from '../dinos';
import { save } from '../save';
import { sfx, playDinosauriMusic } from '../sfx';

/** Menu del gioco: scava, album dei dinosauri, casa (menu Tappolino). */
export class Menu extends Phaser.Scene {
  constructor() { super('dinosauri:Menu'); }

  create(): void {
    setupView(this);
    this.cameras.main.fadeIn(250, 143, 211, 255);
    playDinosauriMusic();
    drawDesert(this, { props: 'menu' });

    const ttl = title3d(this, 960, 140, t('dinosauri.title'), 116);
    this.tweens.add({ targets: ttl, scale: 1.04, duration: 1400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    const play = button(this, 640, 520, 'btn_play', () => goTo(this, 'dinosauri:Dig'), 1);
    pulse(this, play);
    button(this, 640, 820, 'di_btn_album', () => goTo(this, 'dinosauri:Album'), 0.95);

    // l'ultimo dinosauro scoperto saluta davanti alla tenda; prima della prima scoperta c'è un uovo misterioso
    const last = save.state.last;
    let tapDino: (x: number, y: number) => boolean;
    if (isDinoId(last) && save.state.found.includes(last)) {
      const dv = new DinoView(this, last, 1080, 900, 0.78, { depth: 50 });
      this.time.delayedCall(700, () => dv.roar());
      tapDino = (x, y) => {
        if (!dv.hit(x, y)) return false;
        dv.roar();
        dv.hop();
        const h = dv.headPoint();
        burst(this, h.x + 30, h.y - 20, 'di_note', { count: 5, speed: [150, 320], scale: [0.8, 0.3], gravity: -100, life: 1000 });
        return true;
      };
    } else {
      const egg = this.add.image(1080, 900, 'di_egg').setOrigin(0.5, 0.95).setDepth(50);
      const wobble = () => this.tweens.add({ targets: egg, scaleX: 1.08, scaleY: 0.94, duration: 120, yoyo: true, repeat: 2, ease: 'Sine.easeInOut' });
      this.time.addEvent({ delay: 2600, loop: true, callback: wobble });
      tapDino = (x, y) => {
        if (Phaser.Math.Distance.Between(x, y, egg.x, egg.y - 110) > 160) return false;
        sfx.hop();
        wobble();
        burst(this, egg.x, egg.y - 120, 'sparkle', { count: 10, tints: [0xffffff, 0xffe066], gravity: 0, life: 700 });
        return true;
      };
    }

    muteButton(this);
    homeButton(this, () => backToHub(this));

    this.input.on('pointerdown', (p: Phaser.Input.Pointer, over: Phaser.GameObjects.GameObject[]) => {
      if (over.length) return;
      if (!tapDino(p.worldX, p.worldY)) burst(this, p.worldX, p.worldY, 'dot', { count: 6, tints: [0xd9a46a, 0xb8743f], speed: [80, 220], scale: [0.6, 0], life: 500, gravity: 400 });
    });
  }
}
