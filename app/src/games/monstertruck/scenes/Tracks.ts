import Phaser from 'phaser';
import { setupView, button, pin, burst } from '../../../core/ui';
import { t } from '../../../core/i18n';
import { muteButton, title3d, goTo } from '../../../core/hud';
import { FONT } from '../../../core/brand';
import { ArenaBg, drawMenuGround } from '../world';
import { TRACKS, unlocked, usable } from '../parts';
import { save } from '../save';
import { sfx, playTruckMusic } from '../sfx';

const S = 0.8;
const POS = [[500, 420], [960, 420], [1420, 420], [730, 760], [1190, 760]] as const;

/** Le mie piste: cartoline delle piste; con un tocco si corre su quella. Quelle da sbloccare sono sagome. */
export class Tracks extends Phaser.Scene {
  private bg!: ArenaBg;
  private busy = false;

  constructor() { super('monstertruck:Tracks'); }

  create(): void {
    setupView(this);
    this.cameras.main.fadeIn(250, 255, 214, 160);
    playTruckMusic();
    this.busy = false;
    this.bg = new ArenaBg(this, 'arena', { fg: false });
    drawMenuGround(this, 'arena');
    this.add.rectangle(-1100, -900, 4200, 3000, 0x2b2140, 0.25).setOrigin(0).setDepth(25);
    title3d(this, 960, 110, t('monstertruck.tracks'), 92);

    const races = save.state.races;
    const open = unlocked(races).track;
    const chosen = usable('track', save.state.track, races);
    this.add.text(960, 196, t('monstertruck.count', { n: open.length, tot: TRACKS.length }), {
      fontFamily: FONT, fontSize: '40px', fontStyle: '700', color: '#ffffff', stroke: '#8a4a1e', strokeThickness: 8,
    }).setOrigin(0.5).setDepth(40);

    // stelle raccolte in tutto
    const icon = this.add.image(0, 0, 'star').setScale(0.8).setDepth(950);
    pin(this, icon, 'tl', 205, 80);
    const num = this.add.text(0, 0, String(save.state.stars), {
      fontFamily: FONT, fontSize: '60px', fontStyle: '700', color: '#ffffff', stroke: '#8a4a1e', strokeThickness: 10,
    }).setOrigin(0, 0.5).setDepth(950);
    pin(this, num, 'tl', 250, 82);

    const cards: Array<{ id: string; img: Phaser.GameObjects.Image; x: number; y: number; open: boolean }> = [];
    TRACKS.forEach((tr, i) => {
      const [x, y] = POS[i];
      const isOpen = open.includes(tr.id);
      if (tr.id === chosen) {
        const g = this.add.image(x, y, 'glow').setScale(4.2, 3.2).setTint(0xffe066).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0.7).setDepth(30);
        this.tweens.add({ targets: g, alpha: 0.4, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      }
      const img = this.add.image(x, y, `mt_card_${tr.id}`).setScale(0).setDepth(31);
      this.tweens.add({ targets: img, scale: S, duration: 380, delay: 80 + i * 80, ease: 'Back.easeOut' });
      if (isOpen) {
        this.add.text(x, y + 142, t(`monstertruck.track.${tr.id}`), {
          fontFamily: FONT, fontSize: '40px', fontStyle: '700', color: '#ffffff', stroke: '#8a4a1e', strokeThickness: 9,
        }).setOrigin(0.5).setDepth(33);
        if (tr.id === chosen) {
          const st = this.add.image(x + 150, y - 100, 'star').setDepth(34).setScale(0.8);
          this.tweens.add({ targets: st, y: y - 118, duration: 500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
        }
      } else {
        img.setTint(0x3a3048);
        this.add.text(x, y, '?', { fontFamily: FONT, fontSize: '110px', fontStyle: '700', color: '#ffffff', stroke: '#8a4a1e', strokeThickness: 12 }).setOrigin(0.5).setDepth(33).setAlpha(0.9);
      }
      cards.push({ id: tr.id, img, x, y, open: isOpen });
    });

    muteButton(this);
    const home = button(this, 0, 0, 'btn_home', () => goTo(this, 'monstertruck:Menu'), 0.85);
    pin(this, home, 'tl', 80, 80);

    this.input.on('pointerdown', (p: Phaser.Input.Pointer, over: Phaser.GameObjects.GameObject[]) => {
      if (over.length || this.busy) return;
      const c = cards.find((k) => Math.abs(p.worldX - k.x) < 200 && Math.abs(p.worldY - k.y) < 150);
      if (!c) {
        sfx.tap();
        burst(this, p.worldX, p.worldY, 'sparkle', { count: 6, tints: [0xffffff, 0xffe066], speed: [80, 220], scale: [0.6, 0], gravity: 0, life: 600 });
        return;
      }
      if (!c.open) {
        sfx.locked();
        this.tweens.add({ targets: c.img, x: c.x + 14, duration: 70, yoyo: true, repeat: 2, onComplete: () => { c.img.x = c.x; } });
        return;
      }
      this.busy = true;
      save.update({ track: c.id });
      sfx.select();
      sfx.vroom();
      burst(this, c.x, c.y, 'sparkle', { count: 14, tints: [0xffffff, 0xffe066], speed: [150, 420], scale: [0.9, 0], gravity: 0, life: 700 });
      this.tweens.add({ targets: c.img, scale: S * 1.12, duration: 160, yoyo: true, ease: 'Quad.easeOut' });
      this.time.delayedCall(450, () => goTo(this, 'monstertruck:Race', { track: c.id }));
    });
  }

  update(_t: number, delta: number): void {
    this.bg.update(Math.min(0.05, delta / 1000), 0);
  }
}
