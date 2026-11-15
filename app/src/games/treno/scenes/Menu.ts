import Phaser from 'phaser';
import { setupView, button, pulse, burst } from '../../../core/ui';
import { t } from '../../../core/i18n';
import { muteButton, homeButton, title3d, goTo } from '../../../core/hud';
import { backToHub } from '../../../launcher';
import { drawStation, TrainView, Waiter, happyFace } from '../world';
import { destFor, isStationId, stationById, WAIT_Y, type AnimalId } from '../logic';
import { save } from '../save';
import { sfx, playTrenoMusic } from '../sfx';

/** Menu del gioco: la stazioncina con il treno fermo, gioca, album delle stazioni, casa (menu Tappolino). */
export class Menu extends Phaser.Scene {
  constructor() { super('treno:Menu'); }

  create(): void {
    setupView(this);
    this.cameras.main.fadeIn(250, 143, 211, 255);
    playTrenoMusic();
    const dest = isStationId(save.state.last) ? save.state.last : destFor(save.state.delivered, '');
    drawStation(this, dest);

    // treno fermo sul binario: due vagoni con due passeggeri che salutano
    const train = new TrainView(this, 'number', [{ cap: 1 }, { cap: 1 }], dest, 1180);
    const ids = stationById(dest).animals;
    const seated: { id: AnimalId; img: Phaser.GameObjects.Image }[] = [
      { id: ids[0], img: train.seat(0, ids[0]) }, { id: ids[1], img: train.seat(1, ids[1]) },
    ];
    train.bob(false);
    this.time.addEvent({ delay: 2200, loop: true, callback: () => train.puff(2) });

    const ttl = title3d(this, 960, 120, t('treno.title'), 108);
    this.tweens.add({ targets: ttl, scale: 1.04, duration: 1400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    const play = button(this, 520, 880, 'btn_play', () => goTo(this, 'treno:Station'), 0.95);
    pulse(this, play);
    button(this, 1420, 900, 'tr_btn_album', () => goTo(this, 'treno:Album'), 0.85);

    // un passeggero che aspetta sul marciapiede (si tocca: saluta)
    const waiter = new Waiter(this, { animal: ids[2] }, 'number', 960, WAIT_Y - 10);

    muteButton(this);
    homeButton(this, () => backToHub(this));

    this.input.on('pointerdown', (p: Phaser.Input.Pointer, over: Phaser.GameObjects.GameObject[]) => {
      if (over.length) return;
      const s = train.hitSeated(p.worldX, p.worldY);
      if (s) {
        happyFace(this, s.img, s.id);
        sfx.voice(s.id);
        this.tweens.add({ targets: s.img, y: s.img.y - 30, duration: 150, yoyo: true, ease: 'Quad.easeOut' });
        return;
      }
      if (train.hitLoco(p.worldX, p.worldY)) { train.whistle(); return; }
      if (Phaser.Math.Distance.Between(p.worldX, p.worldY, waiter.img.x, waiter.img.y - 120) < 150) {
        waiter.cheer();
        burst(this, p.worldX, p.worldY - 40, 'heart', { count: 5, speed: [120, 280], scale: [0.7, 0.2], gravity: -120, life: 1000 });
        return;
      }
      burst(this, p.worldX, p.worldY, 'sparkle', { count: 6, tints: [0xffffff, 0xffe066], speed: [80, 220], scale: [0.45, 0], gravity: 0, life: 500 });
    });
    void seated;
  }
}
