import Phaser from 'phaser';
import { setupView, button, pulse, burst, view } from '../../../core/ui';
import { t } from '../../../core/i18n';
import { muteButton, homeButton, title3d, goTo } from '../../../core/hud';
import { colorHex, type Look, type Reward } from '../salon';
import { drawSalon, UnicornView, makePolaroid, hex, FLOOR_Y } from '../world';
import { sfx, playUnicorniMusic } from '../sfx';

const ALBUM_BTN = { x: 230, y: 930 };

/** Foto ricordo davanti all'arcobaleno, la polaroid che vola nell'album e la sorpresa sbloccata. */
export class Photo extends Phaser.Scene {
  constructor() { super('unicorni:Photo'); }

  create(data: { look: Look; reward: Reward | null }): void {
    setupView(this);
    this.cameras.main.fadeIn(250, 143, 211, 255);
    playUnicorniMusic();
    const reward = data.reward;
    const mx = reward ? 680 : 960;
    drawSalon(this, { platformX: mx, mirror: false, shelf: false, fgAside: true });
    this.add.image(mx, FLOOR_Y - 30, 'un_rainbow').setOrigin(0.5, 1).setScale(0.82).setDepth(8);
    const rays = this.add.image(mx, 520, 'un_rays').setDepth(9).setAlpha(0.8).setScale(1.5);
    this.tweens.add({ targets: rays, scale: 1.7, alpha: 0.5, duration: 1600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    const uni = new UnicornView(this, mx, FLOOR_Y, data.look, { depth: 50 });
    uni.face('happy');
    muteButton(this);
    homeButton(this, () => goTo(this, 'unicorni:Menu'));
    const album = button(this, ALBUM_BTN.x, ALBUM_BTN.y, 'un_btn_album', () => goTo(this, 'unicorni:Album'), 0.85);

    // clic! lampo della macchina fotografica
    this.time.delayedCall(600, () => {
      sfx.camera();
      const v = view(this);
      const flash = this.add.rectangle(v.left, v.top, v.right - v.left, v.bottom - v.top, 0xffffff, 1).setOrigin(0).setDepth(1800);
      this.tweens.add({ targets: flash, alpha: 0, duration: 450, onComplete: () => flash.destroy() });
      uni.hop();
      const ttl = title3d(this, mx, 140, t('unicorni.bravo'), 110).setScale(0);
      this.tweens.add({ targets: ttl, scale: 1, duration: 400, delay: 200, ease: 'Back.easeOut' });
      for (let i = 0; i < 4; i++) {
        this.time.delayedCall(200 + i * 280, () => burst(this, 300 + Math.random() * 1320, 140, 'confetti', {
          count: 20, tints: [0xff8cc6, 0xffd04d, 0x79e0a6, 0x4fd3cf, 0xb58cf0], speed: [250, 700], scale: [1.4, 0.6], life: 1600, gravity: 800,
        }));
      }
    });

    // la polaroid si sviluppa davanti all'unicorno e vola nell'album
    this.time.delayedCall(1300, () => {
      const pol = makePolaroid(this, mx + 40, 560, data.look, 1200).c.setScale(0);
      sfx.whoosh();
      this.tweens.chain({
        targets: pol,
        tweens: [
          { scale: 1.05, duration: 420, ease: 'Back.easeOut' },
          { scale: 1.05, duration: 900 },
          { x: ALBUM_BTN.x, y: ALBUM_BTN.y, scale: 0.12, alpha: 0.6, duration: 650, ease: 'Cubic.easeIn' },
        ],
        onComplete: () => {
          pol.destroy(true);
          sfx.pop(4);
          this.tweens.add({ targets: album, scale: 1.05, duration: 140, yoyo: true });
          burst(this, ALBUM_BTN.x, ALBUM_BTN.y, 'star', { count: 8, speed: [150, 350], scale: [0.5, 0.1], gravity: 300, life: 800, depth: 1300 });
        },
      });
    });

    if (reward) this.time.delayedCall(3500, () => this.showReward(reward));

    const next = button(this, 1680, 930, 'btn_next', () => goTo(this, 'unicorni:Salon'), 1).setAlpha(0);
    this.tweens.add({ targets: next, alpha: 1, delay: reward ? 4400 : 3400, duration: 300, onComplete: () => pulse(this, next) });

    this.input.on('pointerdown', (p: Phaser.Input.Pointer, over: Phaser.GameObjects.GameObject[]) => {
      if (over.length || !uni.c.getBounds().contains(p.worldX, p.worldY)) return;
      sfx.neigh();
      uni.hop();
      burst(this, p.worldX, p.worldY, 'heart', { count: 6, speed: [150, 350], scale: [0.6, 0.2], gravity: 200, life: 900, depth: 700 });
    });
  }

  private showReward(rw: Reward): void {
    const x = 1400;
    const key = rw.kind === 'unicorn' ? 'newUnicorn' : rw.kind === 'accessory' ? 'newAccessory' : 'newColor';
    const lbl = title3d(this, x, 250, t(`unicorni.${key}`), 78).setScale(0);
    const glow = this.add.image(x, 560, 'glow').setScale(3.6).setAlpha(0).setDepth(30).setTint(0xd9b8ff);
    let objs: Phaser.GameObjects.Components.Transform[];
    if (rw.kind === 'unicorn') {
      const u = new UnicornView(this, x, 770, { u: rw.id, c: null, a: [] }, { scale: 0.62, depth: 40 });
      u.c.setScale(0);
      this.tweens.add({ targets: u.c, scale: 0.62, duration: 500, ease: 'Back.easeOut', onComplete: () => u.breathe(true) });
      objs = [];
    } else if (rw.kind === 'accessory') {
      const img = this.add.image(x, 560, `un_acc_${rw.id}`).setDepth(40).setScale(0);
      objs = [img];
      this.tweens.add({ targets: img, scale: Math.min(2.6, 300 / UnicornView.accSize(rw.id)), duration: 500, ease: 'Back.easeOut' });
    } else {
      const paint = rw.id === 'rainbow' ? this.add.image(x, 560, 'un_pot_rainbow') : this.add.image(x, 560, 'un_pot_paint').setTint(hex(colorHex(rw.id)));
      const glass = this.add.image(x, 560, 'un_pot_glass');
      objs = [paint, glass];
      for (const o of [paint, glass]) o.setDepth(40).setScale(0);
      this.tweens.add({ targets: objs, scale: 1.8, duration: 500, ease: 'Back.easeOut' });
    }
    sfx.fanfare();
    this.tweens.add({ targets: lbl, scale: 1, duration: 350, ease: 'Back.easeOut' });
    this.tweens.add({ targets: glow, alpha: 0.75, duration: 400 });
    burst(this, x, 560, 'sparkle', { count: 18, tints: [0xffffff, 0xffe066, 0xffb3d9], speed: [200, 500], scale: [1, 0], gravity: 0, life: 900 });
    if (objs.length) this.time.delayedCall(600, () => this.tweens.add({ targets: objs, y: '-=16', duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' }));
  }
}
