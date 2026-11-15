import Phaser from 'phaser';
import { setupView, button, pulse, burst } from '../../../core/ui';
import { t } from '../../../core/i18n';
import { muteButton, homeButton, title3d, goTo } from '../../../core/hud';
import { backToHub } from '../../../launcher';
import { ArenaBg, TruckView, drawMenuGround, hex } from '../world';
import { GROUND } from '../track';
import { colorHex } from '../parts';
import { save } from '../save';
import { sfx, playTruckMusic } from '../sfx';

/** Menu del gioco: in officina, le mie piste, casa (menu Tappolino). Il truck aspetta nell'arena. */
export class Menu extends Phaser.Scene {
  private bg!: ArenaBg;
  private truck!: TruckView;
  private busy = false;

  constructor() { super('monstertruck:Menu'); }

  create(): void {
    setupView(this);
    this.cameras.main.fadeIn(250, 255, 214, 160);
    playTruckMusic();
    this.busy = false;
    this.bg = new ArenaBg(this, 'arena', { fg: false });
    drawMenuGround(this, 'arena');

    const ttl = title3d(this, 960, 150, t('monstertruck.title'), 104);
    this.tweens.add({ targets: ttl, scale: 1.04, duration: 1400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    const play = button(this, 520, 520, 'btn_play', () => goTo(this, 'monstertruck:Garage'), 1);
    pulse(this, play);
    button(this, 520, 820, 'mt_btn_tracks', () => goTo(this, 'monstertruck:Tracks'), 0.9);

    const s = save.state;
    this.truck = new TruckView(this, { color: s.color, wheel: s.wheel, sticker: s.sticker }, 1100, GROUND, 1, 60);
    this.truck.floorY = GROUND;
    this.time.addEvent({ delay: 1600, loop: true, callback: () => { if (!this.busy) this.truck.kick(-60); } });

    muteButton(this);
    homeButton(this, () => backToHub(this));

    this.input.on('pointerdown', (p: Phaser.Input.Pointer, over: Phaser.GameObjects.GameObject[]) => {
      if (over.length) return;
      if (this.truck.hit(p.worldX, p.worldY)) this.hop();
      else {
        sfx.tap();
        burst(this, p.worldX, p.worldY, 'sparkle', { count: 6, tints: [0xffffff, 0xffe066, hex(colorHex(s.color))], speed: [80, 220], scale: [0.6, 0], gravity: 0, life: 600 });
      }
    });
  }

  /** Clacson, rombo e un bel salto sul posto: il pubblico applaude. */
  private hop(): void {
    if (this.busy) return;
    this.busy = true;
    sfx.horn();
    this.time.delayedCall(250, () => sfx.vroom());
    this.bg.cheer(1200);
    const tr = this.truck;
    this.tweens.add({
      targets: tr, y: GROUND - 170, duration: 380, delay: 250, ease: 'Quad.easeOut', yoyo: true,
      onYoyo: () => sfx.whoosh(),
      onComplete: () => {
        tr.y = GROUND; tr.kick(260); sfx.land();
        burst(this, tr.x, GROUND, 'dot', { count: 12, tints: [0xf6d2a0, 0xe0a070], speed: [120, 320], scale: [1.2, 0], gravity: 200, life: 600, depth: 70 });
        this.busy = false;
      },
    });
  }

  update(_t: number, delta: number): void {
    const dt = Math.min(0.05, delta / 1000);
    this.bg.update(dt, 0);
    if (this.busy) this.truck.spin(700 * dt);
    this.truck.sync(dt);
  }
}
