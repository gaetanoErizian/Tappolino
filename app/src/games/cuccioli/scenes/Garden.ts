import Phaser from 'phaser';
import { setupView, button, pin, burst, pulse } from '../../../core/ui';
import { t } from '../../../core/i18n';
import { muteButton, title3d, goTo } from '../../../core/hud';
import { FONT } from '../../../core/brand';
import { drawGarden, PetView } from '../world';
import { GARDEN_SPOTS, PETS, isPetId, type PetId } from '../logic';
import { save } from '../save';
import { sfx, playCuccioliMusic } from '../sfx';

/** Porta della clinica nel giardino: da qui arriva il cucciolo appena curato. */
const DOOR = { x: 60, y: 600 };

/**
 * Giardino della clinica (collezione): i cuccioli curati vivono qui e giocano. Un tocco: saltello, verso e nome.
 * Dopo una visita il cucciolo curato esce dalla porta della clinica e raggiunge il suo posto.
 */
export class Garden extends Phaser.Scene {
  private pets: PetView[] = [];

  constructor() { super('cuccioli:Garden'); }

  create(data: { arrive?: string; isNew?: boolean }): void {
    this.pets = [];
    setupView(this);
    this.cameras.main.fadeIn(250, 143, 211, 255);
    playCuccioliMusic();
    drawGarden(this);
    title3d(this, 960, 110, t('cuccioli.garden'), 92);

    const cured = save.state.cured.filter(isPetId);
    const arrive = isPetId(data?.arrive) ? data.arrive : null;
    GARDEN_SPOTS.forEach((s, i) => {
      const id = cured[i];
      if (!id) {
        this.add.image(s.x, s.y, 'cu_cushion').setOrigin(0.5, 0.75).setScale(s.s * 2.2).setDepth(10 + s.y / 100).setAlpha(0.95);
        return;
      }
      const pv = new PetView(this, id, s.x, s.y, s.s, { depth: 10 + s.y / 100 });
      this.pets.push(pv);
      if (id === arrive) this.arriveFromDoor(pv, s, !!data?.isNew);
    });

    // palla da far rimbalzare
    const ball = this.add.image(960, 820, 'cu_ball').setDepth(19).setScale(0.9);
    const ballSh = this.add.image(960, 860, 'shadow').setScale(0.6, 0.25).setDepth(18.9).setAlpha(0.8);
    let ballBusy = false;
    const kick = () => {
      if (ballBusy) return;
      ballBusy = true;
      sfx.ball();
      this.tweens.chain({
        targets: ball,
        tweens: [
          { y: 560, scaleX: 0.84, scaleY: 0.98, duration: 360, ease: 'Quad.easeOut' },
          { y: 820, scaleX: 0.9, scaleY: 0.9, duration: 340, ease: 'Quad.easeIn', onComplete: () => sfx.ball() },
          { y: 720, duration: 200, ease: 'Quad.easeOut' },
          { y: 820, duration: 200, ease: 'Quad.easeIn' },
          { scaleY: 0.78, scaleX: 1.0, duration: 70, yoyo: true },
        ],
        onComplete: () => { ballBusy = false; },
      });
      this.tweens.add({ targets: ballSh, scaleX: 0.3, alpha: 0.3, duration: 360, yoyo: true });
      this.pets.forEach((p, i) => this.time.delayedCall(150 + i * 70, () => p.hop(70)));
    };

    // ogni tanto qualcuno saltella da solo
    this.time.addEvent({ delay: 1600, loop: true, callback: () => { const p = Phaser.Utils.Array.GetRandom(this.pets); if (p && !p.busy) p.hop(50); } });

    const count = this.add.text(960, 1030, t('cuccioli.count', { n: cured.length, tot: PETS.length }), {
      fontFamily: FONT, fontSize: '46px', fontStyle: '700', color: '#ffffff', stroke: '#2a8f78', strokeThickness: 8,
    }).setOrigin(0.5).setDepth(900);
    void count;

    muteButton(this);
    const home = button(this, 0, 0, 'btn_home', () => goTo(this, 'cuccioli:Menu'), 0.85);
    pin(this, home, 'tl', 80, 80);
    const next = button(this, 0, 0, 'btn_next', () => goTo(this, 'cuccioli:Clinic'), 0.8);
    pin(this, next, 'br', 150, 140);
    if (arrive) {
      next.setScale(0);
      this.time.delayedCall(2200, () => this.tweens.add({ targets: next, scale: 0.8, duration: 400, ease: 'Back.easeOut', onComplete: () => pulse(this, next) }));
    }

    this.input.on('pointerdown', (p: Phaser.Input.Pointer, over: Phaser.GameObjects.GameObject[]) => {
      if (over.length) return;
      if (Phaser.Math.Distance.Between(p.worldX, p.worldY, ball.x, ball.y) < 120) { kick(); return; }
      const hit = this.pets.filter((pv) => pv.hit(p.worldX, p.worldY)).sort((a, b) => b.c.depth - a.c.depth)[0];
      if (hit) { this.tapPet(hit); return; }
      burst(this, p.worldX, p.worldY, 'sparkle', { count: 6, tints: [0xffffff, 0xffe066], speed: [80, 220], scale: [0.45, 0], gravity: 0, life: 500 });
    });
  }

  private tapPet(pv: PetView): void {
    pv.giggle();
    const top = { x: pv.c.x, y: pv.c.y - 640 * pv.s };
    burst(this, top.x, top.y + 80, 'heart', { count: 5, speed: [120, 260], scale: [0.6, 0.2], gravity: -120, life: 900, depth: 900 });
    const name = this.add.text(top.x, top.y, t(`cuccioli.pet.${pv.id}`), {
      fontFamily: FONT, fontSize: '40px', fontStyle: '700', color: '#ffffff', stroke: '#2a8f78', strokeThickness: 8,
    }).setOrigin(0.5).setDepth(950).setScale(0);
    this.tweens.add({ targets: name, scale: 1, y: top.y - 30, duration: 300, ease: 'Back.easeOut' });
    this.tweens.add({ targets: name, alpha: 0, duration: 400, delay: 1300, onComplete: () => name.destroy() });
  }

  /** Il cucciolo appena curato esce dalla clinica e saltella fino al suo posto. */
  private arriveFromDoor(pv: PetView, s: { x: number; y: number; s: number }, isNew: boolean): void {
    pv.busy = true;
    pv.c.setPosition(DOOR.x, DOOR.y).setScale(s.s * 0.8).setAlpha(0);
    this.tweens.add({ targets: pv.c, alpha: 1, duration: 250, delay: 300 });
    const hops = 4;
    let i = 0;
    const step = (): void => {
      if (i++ >= hops) {
        pv.busy = false;
        pv.party();
        sfx.garden();
        burst(this, s.x, s.y - 200 * s.s, 'confetti', { count: 30, tints: [0xff5a5f, 0xffc800, 0x4cc3a5, 0x36a9f0, 0xb58cf0], speed: [250, 600], scale: [0.9, 0.4], gravity: 700, life: 1400, depth: 1500 });
        burst(this, s.x, s.y - 300 * s.s, 'sparkle', { count: 16, tints: [0xffffff, 0xffe066], speed: [150, 400], gravity: 0, life: 900, depth: 1500 });
        if (isNew) {
          const lbl = title3d(this, 960, 260, t('cuccioli.new'), 100).setScale(0);
          this.tweens.add({ targets: lbl, scale: 1, duration: 400, ease: 'Back.easeOut' });
          this.tweens.add({ targets: lbl, alpha: 0, duration: 500, delay: 2600, onComplete: () => lbl.destroy() });
        }
        return;
      }
      const k = i / hops;
      sfx.hop();
      this.tweens.add({ targets: pv.c, x: DOOR.x + (s.x - DOOR.x) * k, y: DOOR.y + (s.y - DOOR.y) * k, scale: s.s * (0.8 + 0.2 * k), duration: 420, ease: 'Sine.easeInOut', onComplete: step });
    };
    this.time.delayedCall(450, step);
  }

  get count(): number { return this.pets.length; }
  get arrived(): PetId[] { return this.pets.map((p) => p.id); }
}
