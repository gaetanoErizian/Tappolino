import Phaser from 'phaser';
import { setupView, button, pulse, burst } from '../../../core/ui';
import { t } from '../../../core/i18n';
import { muteButton, homeButton, title3d, goTo } from '../../../core/hud';
import { FONT } from '../../../core/brand';
import { backToHub } from '../../../launcher';
import { drawMeadow, Butterfly, FairyView, hex } from '../world';
import { FAIRY_IDS, TOTAL_PLOTS, bloomCount, currentBed, discoveredFlowers, fairiesFor, flowerById, type FlowerId } from '../logic';
import { save } from '../save';
import { sfx, playGiardinoMusic } from '../sfx';

/** Menu del gioco: gioca (l'aiuola di adesso), album dei fiori e delle fatine, casa (menu Tappolino). */
export class Menu extends Phaser.Scene {
  constructor() { super('giardino:Menu'); }

  create(): void {
    setupView(this);
    this.cameras.main.fadeIn(250, 143, 211, 255);
    playGiardinoMusic();
    const g = save.state.garden;
    const flies = drawMeadow(this, currentBed(g));

    const ttl = title3d(this, 960, 130, t('giardino.title'), 112);
    this.tweens.add({ targets: ttl, scale: 1.04, duration: 1600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    const play = button(this, 560, 520, 'btn_play', () => goTo(this, 'giardino:Garden'), 1);
    pulse(this, play);
    button(this, 560, 830, 'gi_btn_album', () => goTo(this, 'giardino:Album'), 0.95);

    // a destra: un grande fiore che canta (l'ultimo scoperto), con la sua farfalla e la prima fatina
    const known = discoveredFlowers(g);
    const fid: FlowerId = known[known.length - 1] ?? 'daisy';
    const fx = 1330, fy = 960;
    this.add.image(fx, fy, 'gi_soil').setOrigin(0.5, 0.8).setScale(1.35).setDepth(20);
    const glow = this.add.image(fx, fy - 420, 'glow').setScale(3).setTint(hex(flowerById(fid).glow)).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0.5).setDepth(19.9);
    this.tweens.add({ targets: glow, alpha: 0.25, duration: 1600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    const fl = this.add.image(fx, fy - 76, `gi_fl_${fid}`).setOrigin(0.5, 1).setScale(1.08).setDepth(20.1);
    this.tweens.add({ targets: fl, scaleX: 1.05, scaleY: 1.1, duration: 1500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    new Butterfly(this, fid, { x: fx + 220, y: fy - 520 });
    const fairy = new FairyView(this, FAIRY_IDS[0], { x: fx - 300, y: 470 }, 0.85);
    if (fairiesFor(bloomCount(g)) === 0) fairy.c.setAlpha(0.0);

    const n = bloomCount(g);
    this.add.text(960, 1035, t('giardino.count', { n, tot: TOTAL_PLOTS }), {
      fontFamily: FONT, fontSize: '44px', fontStyle: '700', color: '#ffffff', stroke: '#3f8a34', strokeThickness: 8,
    }).setOrigin(0.5).setDepth(900);

    muteButton(this);
    homeButton(this, () => backToHub(this));

    this.input.on('pointerdown', (p: Phaser.Input.Pointer, over: Phaser.GameObjects.GameObject[]) => {
      if (over.length) return;
      const x = p.worldX, y = p.worldY;
      if (fairy.c.alpha > 0 && fairy.hit(x, y)) { fairy.twirl(); return; }
      if (Math.abs(x - fx) < 160 && y > fy - 560 && y < fy) {
        sfx.sing(fid);
        this.tweens.add({ targets: fl, scaleX: 1.2, scaleY: 0.96, duration: 100, yoyo: true });
        burst(this, fx, fy - 420, 'sparkle', { count: 10, tints: [0xffffff, hex(flowerById(fid).glow)], speed: [120, 300], scale: [0.6, 0], gravity: 0, life: 700, depth: 760 });
        return;
      }
      const fly = flies.find((f) => Phaser.Math.Distance.Between(x, y, f.img.x, f.img.y) < 70);
      if (fly) sfx.twinkle();
      burst(this, x, y, 'sparkle', { count: 6, tints: [0xffffff, 0xd6f7b0, 0xfff3a0], speed: [80, 220], scale: [0.45, 0], gravity: 0, life: 500, depth: 760 });
    });
  }
}
