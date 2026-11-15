import Phaser from 'phaser';
import { setupView, burst } from '../../../core/ui';
import { t } from '../../../core/i18n';
import { muteButton, homeButton, title3d, goTo } from '../../../core/hud';
import { UNICORNS, unlocked, ALBUM_MAX } from '../salon';
import { drawSalon, makePolaroid, UnicornView } from '../world';
import { FONT } from '../../../core/brand';
import { save } from '../save';
import { sfx, playUnicorniMusic } from '../sfx';

const COLS = [560, 960, 1360];
const ROWS = [370, 700];
const S = 0.82;

/** Album: le ultime 6 foto ricordo, come il bambino ha sistemato ogni unicorno, e la fila degli unicorni scoperti. */
export class Album extends Phaser.Scene {
  constructor() { super('unicorni:Album'); }

  create(): void {
    setupView(this);
    this.cameras.main.fadeIn(250, 143, 211, 255);
    playUnicorniMusic();
    drawSalon(this, { platformX: null, mirror: false, shelf: false, fgAside: true });
    title3d(this, 960, 110, t('unicorni.album'), 92);

    const photos = save.state.photos;
    for (let i = 0; i < ALBUM_MAX; i++) {
      const x = COLS[i % 3], y = ROWS[Math.floor(i / 3)];
      const { c, uni } = makePolaroid(this, x, y, photos[i] ?? null, 30 + i);
      c.setScale(0);
      this.tweens.add({ targets: c, scale: S, duration: 400, delay: 150 + i * 100, ease: 'Back.easeOut' });
      if (!uni) continue;
      const hit = this.add.zone(x, y, 300 * S, 340 * S).setInteractive({ useHandCursor: true }).setDepth(80);
      hit.on('pointerdown', () => {
        sfx.neigh();
        uni.hop();
        burst(this, x, y - 40, 'sparkle', { count: 10, tints: [0xffffff, 0xffe066, 0xffb3d9], gravity: 0, life: 600, depth: 90 });
      });
    }

    // fila degli unicorni: quelli scoperti e le sagome di quelli che arriveranno
    const un = unlocked(save.state.visits).unicorns;
    UNICORNS.forEach((u, i) => {
      const x = 960 + (i - 2.5) * 200, y = 1040;
      const v = new UnicornView(this, x, y, { u: u.id, c: null, a: [] }, { scale: 0.17, depth: 60 });
      if (!un.includes(u.id)) {
        v.silhouette();
        this.add.text(x, y - 60, '?', { fontFamily: FONT, fontSize: '64px', fontStyle: '700', color: '#ffffff', stroke: '#7a5fb0', strokeThickness: 10 }).setOrigin(0.5).setDepth(61);
      } else {
        v.c.setSize(140, 120).setInteractive(new Phaser.Geom.Rectangle(-70, -120, 140, 120), Phaser.Geom.Rectangle.Contains);
        v.c.on('pointerdown', () => { sfx.neigh(); v.hop(); });
      }
    });

    muteButton(this);
    homeButton(this, () => goTo(this, 'unicorni:Menu'));
  }
}
