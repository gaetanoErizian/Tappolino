import Phaser from 'phaser';
import { setupView, button, pin, burst } from '../../../core/ui';
import { urlParam } from '../../../core/platform';
import { muteButton, goTo, title } from '../../../core/hud';
import { DragManager, Hint, type DragItem } from '../../../core/drag';
import { sound } from '../../../core/sound';
import {
  makeTrip, accepts, ANIMAL_SCALE, wagonFor, allAboard, wagonAt, waitX, isStationId, COLORS, SEAT_SCALE, WAIT_Y, RAIL_Y,
  type Trip, type Kind, type StationId, type AnimalId,
} from '../logic';
import { drawStation, TrainView, Waiter, happyFace, hex } from '../world';
import { save } from '../save';
import { sfx, playTrenoMusic } from '../sfx';

const IDLE_HINT_MS = 5000;

/**
 * La stazioncina: il treno arriva, gli animali aspettano sul marciapiede con il biglietto. Si trascina (o si tocca)
 * ogni animale nel vagone con il colore o la forma del suo biglietto; nei viaggi dei numeri ogni vagone ha tanti posti
 * quanti dice il numero. Tutti a bordo: campanella, fischio e il treno parte.
 */
export class Station extends Phaser.Scene {
  trip!: Trip;
  private train!: TrainView;
  private waiters: Waiter[] = [];
  private items = new Map<DragItem, Waiter>();
  private drag!: DragManager;
  private hint!: Hint;
  busy = true;
  departed = false;
  private errors = 0;
  private boarded = 0;
  private lastAction = 0;

  constructor() { super('treno:Station'); }

  /** Animali già seduti per vagone. */
  get seated(): number[] { return this.train.wagons.map((w) => w.seated.length); }

  create(data: { dest?: string; kind?: Kind; groups?: number[] }): void {
    // `dest`, `kind`, `groups` solo per i test automatici e le catture degli store
    const force = { dest: isStationId(data?.dest) ? (data.dest as StationId) : undefined, kind: data?.kind, groups: Array.isArray(data?.groups) ? data.groups : undefined };
    this.trip = makeTrip(save.state, Math.random, force);
    this.waiters = [];
    this.items = new Map();
    this.busy = true;
    this.departed = false;
    this.errors = 0;
    this.boarded = 0;
    this.lastAction = this.time.now;

    setupView(this);
    this.cameras.main.fadeIn(250, 143, 211, 255);
    playTrenoMusic();
    drawStation(this, this.trip.dest);

    this.train = new TrainView(this, this.trip.kind, this.trip.wagons, this.trip.dest);
    this.hint = new Hint(this);
    this.drag = new DragManager(this, {
      onDrop: (it, x, y) => this.onDrop(it, x, y),
      onTap: (it) => this.onTap(it),
      onPick: (it) => { sfx.pick(); this.hint.hide(); this.lastAction = this.time.now; this.items.get(it)?.cheer(); },
    }, 175);
    this.drag.enabled = false;

    // gli animali aspettano già sul marciapiede (si vedono subito)
    const n = this.trip.passengers.length;
    this.trip.passengers.forEach((p, i) => {
      const w = new Waiter(this, p, this.trip.kind, waitX(i, n), WAIT_Y);
      this.waiters.push(w);
      this.items.set(this.drag.add(w.img, p.animal, w.shadow), w);
      w.img.setScale(0);
      this.tweens.add({ targets: w.img, scale: ANIMAL_SCALE, duration: 380, delay: 150 + i * 110, ease: 'Back.easeOut' });
    });

    const home = button(this, 0, 0, 'btn_home', () => goTo(this, 'treno:Menu'), 0.85);
    pin(this, home, 'tl', 80, 80);
    muteButton(this);

    this.input.on('pointerdown', (p: Phaser.Input.Pointer, over: Phaser.GameObjects.GameObject[]) => {
      if (over.length || this.drag.dragging) return;
      const s = this.train.hitSeated(p.worldX, p.worldY);
      if (s) { this.tickle(s); return; }
      if (this.train.hitLoco(p.worldX, p.worldY) && !this.busy) { this.train.whistle(); return; }
      burst(this, p.worldX, p.worldY, 'sparkle', { count: 5, tints: [0xffffff, 0xffe066], speed: [80, 200], scale: [0.4, 0], gravity: 0, life: 450, depth: 900 });
    });
    this.time.addEvent({ delay: 500, loop: true, callback: () => this.idleCheck() });
    if (urlParam('debug')) Object.assign(window, { __tr: this, __sound: sound });

    // il treno arriva da sinistra e si ferma con uno sbuffo
    const off = -(this.train.right + 200);
    this.train.move(off);
    sfx.chuff();
    this.train.drive(this.train.loco.x - off, 2000, 'Cubic.easeOut', () => {
      sfx.brake();
      this.train.puff(4);
      this.time.delayedCall(150, () => sfx.bell());
      this.ready();
    });
    this.time.delayedCall(1100, () => sfx.brake());
  }

  private ready(): void {
    this.busy = false;
    this.drag.enabled = true;
    this.lastAction = this.time.now;
    if (!save.state.tutorialDone) this.time.delayedCall(400, () => this.showHint());
  }

  private tickle(s: { id: AnimalId; img: Phaser.GameObjects.Image }): void {
    happyFace(this, s.img, s.id);
    sfx.voice(s.id);
    this.tweens.add({ targets: s.img, scaleY: SEAT_SCALE * 1.12, duration: 120, yoyo: true });
  }

  // =================================================================
  // Trascinamenti e tocchi
  // =================================================================
  private onDrop(it: DragItem, x: number, y: number): boolean {
    if (this.busy) return false;
    const w = this.items.get(it)!;
    const caps = this.trip.wagons.map((s) => s.cap);
    // vale il dito oppure il centro dell'animale (lasciato cadere sopra un vagone)
    let i = wagonAt(x, y, this.train.wagons.map((v) => v.c.x), caps);
    if (i < 0) i = wagonAt(it.obj.x, it.obj.y - 100, this.train.wagons.map((v) => v.c.x), caps);
    if (i < 0) { sfx.back(); return false; }
    if (accepts(this.trip, this.trip.wagons[i], w.p, this.seated[i])) { this.board(it, i, false); return true; }
    this.wrong(i);
    return false;
  }

  private onTap(it: DragItem): void {
    if (this.busy) return;
    const w = this.items.get(it)!;
    const i = wagonFor(this.trip, this.seated, w.p);
    if (i >= 0) this.board(it, i, true);
  }

  /** Vagone sbagliato (o già pieno): il vagone fa "no", l'animale torna al suo posto. Nessun errore. */
  private wrong(i: number): void {
    sfx.nope();
    this.train.shake(i);
    this.lastAction = this.time.now;
    if (++this.errors >= 2) { this.errors = 0; this.time.delayedCall(450, () => this.showHint()); }
  }

  // =================================================================
  // Salire sul treno
  // =================================================================
  private board(it: DragItem, i: number, fromTap: boolean): void {
    const w = this.items.get(it)!;
    const wagon = this.train.wagons[i];
    const k = wagon.seated.length;
    const seat = this.train.seatAt(i, k);
    it.enabled = false;
    w.busy = true;
    this.errors = 0;
    this.hint.hide();
    this.lastAction = this.time.now;
    if (!save.state.tutorialDone) save.update({ tutorialDone: true });
    const plate = this.train.plateAt(i);
    w.punch(plate.x, plate.y);
    this.tweens.add({ targets: w.shadow, alpha: 0, duration: 250 });
    // l'animale salta nel suo posto (dietro la fiancata), poi si siede davvero nel vagone
    it.obj.setDepth(1300);
    this.tweens.killTweensOf(it.obj);
    const midY = Math.min(it.obj.y, seat.y) - 140;
    const st = { u: 0 };
    const x0 = it.obj.x, y0 = it.obj.y, s0 = it.obj.scaleX;
    this.tweens.add({
      targets: st, u: 1, duration: fromTap ? 560 : 360, ease: 'Sine.easeInOut',
      onUpdate: () => {
        const u = st.u;
        it.obj.setPosition(x0 + (seat.x - x0) * u, (1 - u) * (1 - u) * y0 + 2 * (1 - u) * u * midY + u * u * seat.y).setScale(s0 + (SEAT_SCALE - s0) * u);
      },
      onComplete: () => {
        w.destroy();
        const img = this.train.seat(i, w.p.animal);
        happyFace(this, img, w.p.animal, 1100);
        img.setScale(SEAT_SCALE * 1.1, SEAT_SCALE * 0.88);
        this.tweens.add({ targets: img, scaleX: SEAT_SCALE, scaleY: SEAT_SCALE, duration: 260, ease: 'Back.easeOut' });
        this.onSeated(i, w.p.animal, seat);
      },
    });
    if (fromTap) sfx.hop();
  }

  private onSeated(i: number, id: AnimalId, seat: { x: number; y: number }): void {
    const wagon = this.train.wagons[i];
    const tint = this.trip.kind === 'color' && wagon.spec.color ? hex(COLORS[wagon.spec.color]) : 0xffe066;
    sfx.board(this.boarded++);
    this.time.delayedCall(140, () => sfx.voice(id));
    burst(this, seat.x, seat.y - 120, 'sparkle', { count: 12, tints: [0xffffff, tint], speed: [150, 380], gravity: 0, life: 650, depth: 950 });
    // nei viaggi dei numeri si conta a voce alta (numero grande sopra il vagone)
    if (this.trip.kind === 'number') this.countPop(wagon.seated.length, seat.x, RAIL_Y - 330);
    if (wagon.seated.length >= wagon.spec.cap) {
      this.time.delayedCall(320, () => {
        sfx.full();
        this.train.glow(i);
        const p = this.train.plateAt(i);
        burst(this, p.x, p.y, 'star', { count: 8, speed: [180, 380], scale: [0.45, 0.1], gravity: 300, life: 800, depth: 950 });
      });
    }
    if (allAboard(this.trip, this.seated)) this.depart();
  }

  /** Numero grande che salta fuori e sale (si conta: 1, 2, 3…). */
  private countPop(n: number, x: number, y: number): void {
    sfx.count(n);
    const txt = title(this, x, y, String(n), 120).setScale(0).setDepth(960);
    this.tweens.add({ targets: txt, scale: 1, duration: 260, ease: 'Back.easeOut' });
    this.tweens.add({ targets: txt, y: y - 70, alpha: 0, duration: 500, delay: 650, onComplete: () => txt.destroy() });
  }

  // =================================================================
  // Partenza
  // =================================================================
  private depart(): void {
    if (this.departed) return;
    this.departed = true;
    this.busy = true;
    this.drag.enabled = false;
    this.hint.hide();
    this.time.delayedCall(700, () => { sfx.bell(); });
    this.time.delayedCall(1300, () => { this.train.whistle(); this.train.bob(true); });
    this.time.delayedCall(2000, () => {
      sfx.depart();
      this.train.drive(this.train.loco.x + 2600, 2600, 'Quad.easeIn', undefined, 200);
      burst(this, this.train.loco.x, RAIL_Y - 260, 'confetti', { count: 24, tints: [0xff5a5f, 0xffc800, 0x2f86e8, 0x3dbb4f, 0x9a5fd8], speed: [250, 600], scale: [0.9, 0.4], gravity: 700, life: 1400, depth: 1500 });
    });
    const seats = this.train.wagons.map((w) => w.seated.map((s) => s.id));
    this.time.delayedCall(3900, () => goTo(this, 'treno:Journey', { trip: this.trip, seats }));
  }

  // =================================================================
  // Manina d'aiuto: subito al primo viaggio, poi dopo qualche secondo senza azioni o dopo due tentativi
  // =================================================================
  private idleCheck(): void {
    if (this.busy || this.hint.visible || this.drag.dragging) return;
    if (this.time.now - this.lastAction > IDLE_HINT_MS) this.showHint();
  }

  private showHint(): void {
    if (this.busy || this.drag.dragging) return;
    for (const [it, w] of this.items) {
      if (!it.enabled) continue;
      const i = wagonFor(this.trip, this.seated, w.p);
      if (i < 0) continue;
      const seat = this.train.seatAt(i, this.train.wagons[i].seated.length);
      this.hint.drag(it.obj.x, it.obj.y - 120, seat.x, seat.y - 40);
      this.lastAction = this.time.now;
      return;
    }
  }

  // =================================================================
  // Solo test automatici (?debug=1): fa salire il prossimo animale come un tocco
  // =================================================================
  autoStep(): string {
    if (this.departed) return 'done';
    if (this.busy) return 'busy';
    const next = [...this.items.keys()].find((it) => it.enabled);
    if (!next) return 'done';
    this.onTap(next);
    return next.id;
  }

  /** Trascinamento simulato di un animale in un vagone (per i test): risultato del rilascio. */
  dropOn(animal: string, wagon: number): boolean {
    const it = [...this.items.keys()].find((x) => x.id === animal && x.enabled);
    if (!it || this.busy) return false;
    const c = this.train.wagons[wagon].c;
    it.obj.setPosition(c.x, RAIL_Y - 120);
    const ok = this.onDrop(it, c.x, RAIL_Y - 120);
    if (!ok) this.drag.home(it);
    return ok;
  }
}
