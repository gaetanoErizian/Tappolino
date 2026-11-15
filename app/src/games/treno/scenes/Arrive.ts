import Phaser from 'phaser';
import { setupView, button, pin, burst, pulse } from '../../../core/ui';
import { t } from '../../../core/i18n';
import { muteButton, goTo, title, title3d } from '../../../core/hud';
import { urlParam } from '../../../core/platform';
import { drawDest, TrainView, happyFace } from '../world';
import { AN } from '../animals';
import {
  ANIMAL_SCALE, WAIT_Y, waitX, addDelivered, reached, isAnimalId, type AnimalId, type Trip,
} from '../logic';
import { save } from '../save';
import { sfx, playTrenoMusic } from '../sfx';

interface Friend { id: AnimalId; img: Phaser.GameObjects.Image; shadow: Phaser.GameObjects.Image; hopping: boolean; isNew: boolean }

/**
 * Arrivo alla stazione degli animali: il treno entra e si ferma, gli animali scendono uno alla volta
 * (si contano: 1, 2, 3…) e fanno festa a casa loro. La prima volta la stazione entra nell'album ("Nuova stazione!").
 */
export class Arrive extends Phaser.Scene {
  private train!: TrainView;
  private friends: Friend[] = [];
  trip!: Trip;
  done = false;
  isNewStation = false;

  constructor() { super('treno:Arrive'); }

  create(data: { trip: Trip; seats: string[][] }): void {
    this.trip = data.trip;
    const seats = (data.seats ?? []).map((l) => l.filter(isAnimalId));
    this.friends = [];
    this.done = false;
    setupView(this);
    this.cameras.main.fadeIn(250, 143, 211, 255);
    playTrenoMusic();
    drawDest(this, this.trip.dest);

    // salvataggio subito (anche se si esce a metà festa il viaggio conta)
    const all = seats.flat();
    const before = save.state.delivered;
    this.isNewStation = !reached(before).includes(this.trip.dest);
    const fresh = all.filter((a) => !before.includes(a));
    save.update({ trips: save.state.trips + 1, delivered: addDelivered(before, all), last: this.trip.dest, tutorialDone: true });

    this.train = new TrainView(this, this.trip.kind, this.trip.wagons, this.trip.dest);
    seats.forEach((list, i) => list.forEach((id) => this.train.seat(i, id)));
    this.train.bob(true);
    const off = -(this.train.right + 200);
    this.train.move(off);
    this.train.drive(this.train.loco.x - off, 2200, 'Cubic.easeOut', () => {
      this.train.bob(false);
      sfx.bell();
      this.train.puff(4);
      this.time.delayedCall(400, () => this.unload(fresh));
    });
    this.time.delayedCall(1200, () => sfx.brake());

    muteButton(this);
    const home = button(this, 0, 0, 'btn_home', () => goTo(this, 'treno:Menu'), 0.85);
    pin(this, home, 'tl', 80, 80);

    this.input.on('pointerdown', (p: Phaser.Input.Pointer, over: Phaser.GameObjects.GameObject[]) => {
      if (over.length) return;
      const f = this.friends.find((x) => Math.abs(p.worldX - x.img.x) < 120 && p.worldY > x.img.y - 290 && p.worldY < x.img.y + 20);
      if (f) { this.cheer(f); burst(this, p.worldX, p.worldY - 40, 'heart', { count: 5, speed: [120, 280], scale: [0.7, 0.2], gravity: -120, life: 1000, depth: 900 }); return; }
      const s = this.train.hitSeated(p.worldX, p.worldY);
      if (s) { happyFace(this, s.img, s.id); sfx.voice(s.id); return; }
      if (this.train.hitLoco(p.worldX, p.worldY)) { this.train.whistle(); return; }
      burst(this, p.worldX, p.worldY, 'sparkle', { count: 5, tints: [0xffffff, 0xffe066], speed: [80, 200], scale: [0.4, 0], gravity: 0, life: 450, depth: 900 });
    });
    if (urlParam('debug')) Object.assign(window, { __tra: this });
  }

  // =================================================================
  // Si scende e si conta
  // =================================================================
  private unload(fresh: AnimalId[]): void {
    const order: { i: number; s: { id: AnimalId; img: Phaser.GameObjects.Image } }[] = [];
    this.train.wagons.forEach((w, i) => w.seated.forEach((s) => order.push({ i, s })));
    const n = order.length;
    order.forEach(({ i, s }, k) => this.time.delayedCall(k * 620, () => {
      const w = this.train.wagons[i];
      const x0 = w.c.x + s.img.x, y0 = w.c.y + s.img.y;
      s.img.destroy();
      const tx = waitX(k, n), ty = WAIT_Y;
      const shadow = this.add.image(tx, ty + 4, 'shadow').setScale(0.9, 0.4).setAlpha(0).setDepth(39);
      const img = this.add.image(x0, y0, `tr_an_${s.id}`).setOrigin(0.5, AN.ground / AN.h).setScale(0.56).setDepth(40 + k * 0.01);
      happyFace(this, img, s.id, 0);
      sfx.hop();
      const st = { u: 0 }, midY = Math.min(y0, ty) - 220;
      this.tweens.add({
        targets: st, u: 1, duration: 520, ease: 'Sine.easeInOut',
        onUpdate: () => {
          const u = st.u;
          img.setPosition(x0 + (tx - x0) * u, (1 - u) * (1 - u) * y0 + 2 * (1 - u) * u * midY + u * u * ty).setScale(0.56 + (ANIMAL_SCALE - 0.56) * u);
        },
        onComplete: () => {
          shadow.setAlpha(0.8);
          img.setScale(ANIMAL_SCALE * 1.1, ANIMAL_SCALE * 0.88);
          this.tweens.add({ targets: img, scaleX: ANIMAL_SCALE, scaleY: ANIMAL_SCALE, duration: 240, ease: 'Back.easeOut' });
          const f: Friend = { id: s.id, img, shadow, hopping: false, isNew: fresh.includes(s.id) };
          this.friends.push(f);
          this.countPop(k + 1, tx, ty - 330);
          burst(this, tx, ty - 120, 'sparkle', { count: 10, tints: [0xffffff, 0xffe066], speed: [150, 360], gravity: 0, life: 600, depth: 950 });
          if (k === n - 1) this.time.delayedCall(700, () => this.party());
        },
      });
    }));
  }

  private countPop(n: number, x: number, y: number): void {
    sfx.count(n);
    const txt = title(this, x, y, String(n), 110).setScale(0).setDepth(960);
    this.tweens.add({ targets: txt, scale: 1, duration: 260, ease: 'Back.easeOut' });
    this.tweens.add({ targets: txt, y: y - 60, alpha: 0, duration: 500, delay: 1100, onComplete: () => txt.destroy() });
  }

  // =================================================================
  // Festa
  // =================================================================
  private party(): void {
    sfx.party();
    this.friends.forEach((f, i) => this.time.delayedCall(i * 120, () => { this.hop(f, 120); sfx.voice(f.id); }));
    burst(this, 960, 420, 'confetti', { count: 50, tints: [0xff5a5f, 0xffc800, 0x2f86e8, 0x3dbb4f, 0x9a5fd8, 0xff8fb0], speed: [350, 800], scale: [1, 0.5], gravity: 700, life: 1700, depth: 1500 });
    for (const f of this.friends.filter((x) => x.isNew)) burst(this, f.img.x, f.img.y - 200, 'star', { count: 8, speed: [180, 400], scale: [0.5, 0.15], gravity: 300, life: 900, depth: 1500 });
    this.time.addEvent({ delay: 1500, loop: true, callback: () => { const f = Phaser.Utils.Array.GetRandom(this.friends); if (f) this.hop(f, 70); } });
    if (this.isNewStation) this.time.delayedCall(900, () => this.newStation());
    else this.time.delayedCall(700, () => this.stationName());
    this.time.delayedCall(this.isNewStation ? 3200 : 1600, () => this.buttons());
  }

  /** Prima volta qui: lo stemma della stazione entra nell'album. */
  private newStation(): void {
    sfx.station();
    const emb = this.add.image(960, 300, `tr_emb_${this.trip.dest}`).setScale(0).setDepth(1600);
    const glow = this.add.image(960, 300, 'glow').setScale(0).setAlpha(0.8).setBlendMode(Phaser.BlendModes.ADD).setDepth(1599);
    this.tweens.add({ targets: emb, scale: 1.4, duration: 500, ease: 'Back.easeOut' });
    this.tweens.add({ targets: glow, scale: 3.4, duration: 500 });
    const lbl = title3d(this, 960, 120, t('treno.newStation'), 96).setScale(0).setDepth(1601);
    this.tweens.add({ targets: lbl, scale: 1, duration: 400, delay: 200, ease: 'Back.easeOut' });
    const name = title(this, 960, 450, t(`treno.station.${this.trip.dest}`), 70).setScale(0).setDepth(1601);
    this.tweens.add({ targets: name, scale: 1, duration: 400, delay: 350, ease: 'Back.easeOut' });
    burst(this, 960, 300, 'sparkle', { count: 24, tints: [0xffffff, 0xffe066], speed: [200, 520], gravity: 0, life: 900, depth: 1602 });
    this.time.delayedCall(2600, () => {
      // lo stemma vola verso il pulsante dell'album (in basso a sinistra)
      this.tweens.add({ targets: [emb, glow], x: 220, y: 900, scale: 0.4, alpha: 0, duration: 600, ease: 'Quad.easeIn', onComplete: () => { emb.destroy(); glow.destroy(); } });
      this.tweens.add({ targets: [lbl, name], alpha: 0, duration: 400, onComplete: () => { lbl.destroy(); name.destroy(); } });
    });
  }

  private stationName(): void {
    const name = title3d(this, 960, 150, t(`treno.station.${this.trip.dest}`), 96).setScale(0).setDepth(1601);
    this.tweens.add({ targets: name, scale: 1, duration: 400, ease: 'Back.easeOut' });
  }

  private buttons(): void {
    this.done = true;
    const next = button(this, 0, 0, 'btn_next', () => goTo(this, 'treno:Station'), 0.8);
    pin(this, next, 'br', 150, 140);
    next.setScale(0);
    this.tweens.add({ targets: next, scale: 0.8, duration: 400, ease: 'Back.easeOut', onComplete: () => pulse(this, next) });
    const album = button(this, 0, 0, 'tr_btn_album', () => goTo(this, 'treno:Album'), 0.7);
    pin(this, album, 'bl', 130, 130);
    album.setScale(0);
    this.tweens.add({ targets: album, scale: 0.7, duration: 400, delay: 150, ease: 'Back.easeOut', onComplete: () => { if (this.isNewStation) pulse(this, album); } });
  }

  private cheer(f: Friend): void {
    happyFace(this, f.img, f.id);
    sfx.voice(f.id);
    this.hop(f, 90);
  }

  private hop(f: Friend, h: number): void {
    if (f.hopping) return;
    f.hopping = true;
    const y = WAIT_Y;
    this.tweens.add({ targets: f.img, y: y - h, duration: 220, yoyo: true, ease: 'Quad.easeOut', onComplete: () => { f.img.y = y; f.hopping = false; } });
    this.tweens.add({ targets: f.shadow, scaleX: 0.6, alpha: 0.4, duration: 220, yoyo: true });
  }

  /** Animali scesi (per i test). */
  get landed(): AnimalId[] { return this.friends.map((f) => f.id); }
}
