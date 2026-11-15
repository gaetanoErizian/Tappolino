import Phaser from 'phaser';
import { setupView, button, pin, burst } from '../../../core/ui';
import { t } from '../../../core/i18n';
import { muteButton, title3d, goTo } from '../../../core/hud';
import { FONT } from '../../../core/brand';
import { drawDesert, DinoView } from '../world';
import { DINOS, FRAME, GROUND } from '../dinos';
import { save } from '../save';
import { playDinosauriMusic } from '../sfx';

const S = 0.32;

/** Album: una foto per ogni dinosauro; quelli da scoprire sono sagome con il punto interrogativo. */
export class Album extends Phaser.Scene {
  constructor() { super('dinosauri:Album'); }

  create(): void {
    setupView(this);
    this.cameras.main.fadeIn(250, 143, 211, 255);
    playDinosauriMusic();
    drawDesert(this, { props: 'album', horizon: 620 });
    title3d(this, 960, 110, t('dinosauri.album'), 96);

    // tavola di legno su cui sono appese le foto
    const g = this.add.graphics().setDepth(20);
    g.fillStyle(0x3a1d0e, 0.3).fillRoundedRect(232, 222, 1480, 740, 40);
    g.fillStyle(0xc98a4c, 1).fillRoundedRect(220, 206, 1480, 740, 40);
    g.lineStyle(6, 0x7a4218, 1).strokeRoundedRect(220, 206, 1480, 740, 40);
    g.fillStyle(0xffe0b4, 0.35).fillRoundedRect(240, 214, 1440, 14, 7);
    g.lineStyle(4, 0x8a5022, 0.35);
    for (let y = 290; y < 940; y += 90) g.lineBetween(250, y, 1670, y);

    const found = save.state.found;
    DINOS.forEach((d, i) => {
      const x = 960 + ((i % 4) - 1.5) * 352, y = 400 + Math.floor(i / 4) * 360;
      const photo = this.add.image(x, y, 'di_photo').setScale(0.98).setDepth(30);
      this.add.circle(x, y - 150, 12, 0xff5a5f).setStrokeStyle(4, 0xb02a30).setDepth(31);
      const ix = x, iy = y - 35, gy = iy + (GROUND - FRAME.h / 2) * S;
      const has = found.includes(d.id);
      photo.setScale(0);
      this.tweens.add({ targets: photo, scale: 0.98, duration: 360, delay: 120 + i * 70, ease: 'Back.easeOut' });
      if (has) {
        const dv = new DinoView(this, d.id, ix, gy, S, { depth: 32 });
        dv.c.setAlpha(0);
        this.tweens.add({ targets: dv.c, alpha: 1, duration: 300, delay: 300 + i * 70 });
        this.add.text(x, y + 120, t(`dinosauri.dino.${d.id}`), {
          fontFamily: FONT, fontSize: '27px', fontStyle: '700', color: '#7a4218',
        }).setOrigin(0.5).setDepth(33);
        const hit = this.add.zone(x, y, 300, 330).setInteractive({ useHandCursor: true }).setDepth(60);
        hit.on('pointerdown', () => {
          dv.roar();
          dv.hop();
          burst(this, x + 60, y - 80, 'di_note', { count: 4, speed: [120, 260], scale: [0.6, 0.2], gravity: -80, life: 900 });
        });
      } else {
        this.add.image(ix - FRAME.w / 2 * S, gy - GROUND * S, `di_dino_${d.id}`).setOrigin(0).setScale(S).setTint(0x5a3018).setAlpha(0.4).setDepth(32);
        this.add.text(ix, iy, '?', { fontFamily: FONT, fontSize: '110px', fontStyle: '700', color: '#ffffff', stroke: '#a8692e', strokeThickness: 10 }).setOrigin(0.5).setDepth(33);
      }
    });
    this.add.text(960, 1010, t('dinosauri.count', { n: found.length, tot: DINOS.length }), {
      fontFamily: FONT, fontSize: '50px', fontStyle: '700', color: '#ffffff', stroke: '#8a4a22', strokeThickness: 8,
    }).setOrigin(0.5).setDepth(70);

    muteButton(this);
    const home = button(this, 0, 0, 'btn_home', () => goTo(this, 'dinosauri:Menu'), 0.85);
    pin(this, home, 'tl', 80, 80);
  }
}
