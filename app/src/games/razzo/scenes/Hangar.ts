import Phaser from 'phaser';
import { setupView, button, pin, burst } from '../../../core/ui';
import { t } from '../../../core/i18n';
import { muteButton, title3d, goTo } from '../../../core/hud';
import { FONT } from '../../../core/brand';
import { SpaceBg, RocketView } from '../world';
import { ROCKETS, rocketsUnlocked, usableRocket, type RocketId } from '../planets';
import { save } from '../save';
import { sfx, playRazzoMusic } from '../sfx';

const RS = 0.72;

/** I miei razzi: sei rampe di lancio; si sceglie il razzo con un tocco. Quelli da sbloccare sono sagome. */
export class Hangar extends Phaser.Scene {
  private bg!: SpaceBg;
  private views: Array<{ id: RocketId; r: RocketView; x: number; y: number; open: boolean; busy: boolean }> = [];
  private halo!: Phaser.GameObjects.Image;

  constructor() { super('razzo:Hangar'); }

  create(): void {
    setupView(this);
    this.cameras.main.fadeIn(250, 10, 16, 60);
    playRazzoMusic();
    this.bg = new SpaceBg(this, { nebula: 'gold', decor: ['giungla'] });
    title3d(this, 960, 110, t('razzo.hangar'), 96);
    this.views = [];

    const open = rocketsUnlocked(save.state.trips);
    const chosen = usableRocket(save.state.rocket, save.state.trips);
    this.halo = this.add.image(0, 0, 'glow').setTint(0xffe066).setBlendMode(Phaser.BlendModes.ADD).setScale(2.6, 3.4).setAlpha(0.6).setDepth(25);
    this.tweens.add({ targets: this.halo, alpha: 0.35, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    ROCKETS.forEach((ro, i) => {
      const x = 960 + ((i % 3) - 1) * 480, padY = 560 + Math.floor(i / 3) * 360;
      this.add.image(x, padY, 'rz_pad').setScale(0.8).setDepth(20);
      const y = padY - 10 - (150 - 30) * RS;
      const r = new RocketView(this, ro.id, x, y, RS, 30);
      r.angle = -90;
      r.thrust(0);
      const isOpen = open.includes(ro.id);
      if (!isOpen) {
        r.img.setTint(0x1a2266).setAlpha(0.6);
        this.add.text(x, y, '?', { fontFamily: FONT, fontSize: '90px', fontStyle: '700', color: '#ffffff', stroke: '#3c4fc4', strokeThickness: 10 }).setOrigin(0.5).setDepth(40).setAlpha(0.85);
      }
      r.sync(0);
      this.views.push({ id: ro.id, r, x, y, open: isOpen, busy: false });
      if (ro.id === chosen) this.halo.setPosition(x, y);
    });

    muteButton(this);
    const home = button(this, 0, 0, 'btn_home', () => goTo(this, 'razzo:Menu'), 0.85);
    pin(this, home, 'tl', 80, 80);

    this.input.on('pointerdown', (p: Phaser.Input.Pointer, over: Phaser.GameObjects.GameObject[]) => {
      if (over.length) return;
      const v = this.views.find((w) => Math.abs(p.worldX - w.x) < 170 && Math.abs(p.worldY - w.y) < 170);
      if (!v) {
        sfx.twinkle();
        burst(this, p.worldX, p.worldY, 'sparkle', { count: 6, tints: [0xffffff, 0xffe066, 0x9fd8ff], speed: [80, 220], scale: [0.6, 0], gravity: 0, life: 600 });
        return;
      }
      if (!v.open) {
        // ancora da sbloccare: un piccolo dondolio, nessun "errore"
        this.tweens.add({ targets: v.r, x: v.x + 14, duration: 70, yoyo: true, repeat: 2, onComplete: () => { v.r.x = v.x; } });
        sfx.twinkle();
        return;
      }
      this.choose(v);
    });
  }

  private choose(v: { id: RocketId; r: RocketView; x: number; y: number; busy: boolean }): void {
    if (v.busy) return;
    v.busy = true;
    save.update({ rocket: v.id });
    sfx.select();
    this.halo.setPosition(v.x, v.y);
    burst(this, v.x, v.y - 60, 'sparkle', { count: 12, tints: [0xffffff, 0xffe066], speed: [150, 400], scale: [0.9, 0], gravity: 0, life: 800 });
    v.r.thrust(1);
    this.tweens.add({
      targets: v.r, y: v.y - 120, duration: 380, yoyo: true, ease: 'Quad.easeOut',
      onComplete: () => { v.r.y = v.y; v.r.thrust(0); v.busy = false; sfx.land(); },
    });
  }

  update(_t: number, delta: number): void {
    const dt = Math.min(0.05, delta / 1000);
    this.bg.update(dt, 0);
    for (const v of this.views) v.r.sync(dt);
  }
}
