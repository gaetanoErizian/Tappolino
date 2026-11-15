import Phaser from 'phaser';
import { setupView, button, pin, burst, pulse, view } from '../../../core/ui';
import { t } from '../../../core/i18n';
import { urlParam } from '../../../core/platform';
import { muteButton, title3d, goTo } from '../../../core/hud';
import { FONT } from '../../../core/brand';
import { sound } from '../../../core/sound';
import { HoldHint } from '../../../core/holdHint';
import {
  buildCourse, stepTruck, touches, boxHop, TRUCK_X, REACH_Y, STAR_REACH, BIG_REACH, NOSE, BOX,
  type Course, type Item, type TruckState,
} from '../track';
import { nextTrack, prizeOf, colorHex, trackById, isTrackId, type TrackId, type Unlock } from '../parts';
import { TF } from '../art';
import { ArenaBg, GroundView, TruckView, hex } from '../world';
import { save } from '../save';
import { sfx, playTruckMusic } from '../sfx';

type Phase = 'race' | 'finish' | 'done';

interface Live {
  item: Item;
  imgs: Phaser.GameObjects.Image[];
  glow?: Phaser.GameObjects.Image;
  taken: boolean;
  ph: number;
}

const TS = 0.92;
const IDLE_HINT_MS = 6000;
const CONFETTI = [0xff5e5e, 0xffd23f, 0x3cc46a, 0x4fa3ff, 0xff8a1e, 0xb48cff];

/**
 * Una gara (gesto: tenere premuto, con qualsiasi dito e in qualsiasi punto). Tieni premuto e il truck accelera;
 * sui dossi e sui trampolini salta. Lascia e rallenta fino a fermarsi. Le stelle si prendono passando;
 * gli scatoloni si schiacciano con un saltello. Niente incidenti: il truck atterra sempre sulle ruote e rimbalza.
 * Al traguardo il pubblico esulta e arriva un premio per la collezione (pezzo o pista).
 */
export class Race extends Phaser.Scene {
  private track!: TrackId;
  private course!: Course;
  private phase: Phase = 'race';
  private st: TruckState = { x: 0, y: 0, vx: 0, vy: 0, air: false, airTime: 0 };
  private bg!: ArenaBg;
  private groundView!: GroundView;
  private truck!: TruckView;
  private live: Live[] = [];
  private nextIdx = 0;
  private finishImg!: Phaser.GameObjects.Image;
  private holding = new Set<number>();
  private wasHolding = false;
  private lastVroom = 0;
  private lastCheer = 0;
  private lastTouch = 0;
  private held = 0;
  private released = false;
  private stars = 0;
  private shown = 0;
  private combo = 0;
  private lastStar = -9999;
  private dustT = 0;
  private dust!: Phaser.GameObjects.Particles.ParticleEmitter;
  private hint!: HoldHint;
  private counter!: Phaser.GameObjects.Text;
  private counterIcon!: Phaser.GameObjects.Image;
  private bar: Phaser.GameObjects.Image[] = [];
  private mini!: Phaser.GameObjects.Image;
  private enter = -900;
  /** solo test e catture (?debug=1): il dito resta sempre giù */
  autoPilot = false;

  constructor() { super('monstertruck:Race'); }

  create(data: { track?: string }): void {
    const s = save.state;
    this.track = isTrackId(data?.track) ? data.track : nextTrack(s.races, s.raced, s.track);
    this.course = buildCourse(this.track, s.races, (Date.now() ^ (s.races * 7919)) >>> 0);
    this.phase = 'race';
    this.st = { x: 0, y: this.course.ground.at(0), vx: 0, vy: 0, air: false, airTime: 0 };
    this.live = [];
    this.nextIdx = 0;
    this.holding = new Set();
    this.wasHolding = false;
    this.lastVroom = this.lastCheer = 0;
    this.lastTouch = this.time.now;
    this.held = 0;
    this.released = false;
    this.stars = this.shown = this.combo = 0;
    this.lastStar = -9999;
    this.dustT = 0;
    this.bar = [];
    this.enter = -900;
    this.autoPilot = false;

    setupView(this, (v) => this.placeBar(v.top));
    this.cameras.main.fadeIn(250, 255, 214, 160);
    playTruckMusic();
    this.bg = new ArenaBg(this, this.track);
    const avoid = [...this.course.lips, ...this.course.items.filter((i) => i.kind === 'box').map((i) => i.x), this.course.len];
    this.groundView = new GroundView(this, this.course.ground, this.track, this.course.len, avoid);
    this.finishImg = this.add.image(0, 0, 'mt_finish').setOrigin(0.5, 0.98).setDepth(19).setScale(1.05);

    this.truck = new TruckView(this, { color: s.color, wheel: s.wheel, sticker: s.sticker }, TRUCK_X - 900, this.st.y, TS, 60, true);
    this.tweens.add({ targets: this, enter: 0, duration: 800, ease: 'Cubic.easeOut' });
    const dustTint = hex(trackById(this.track).ground[0]);
    this.dust = this.add.particles(0, 0, 'dot', {
      speed: { min: 60, max: 180 }, angle: { min: 190, max: 250 }, scale: { start: 1.3, end: 0 }, lifespan: 520,
      gravityY: -60, tint: [dustTint, 0xffffff], alpha: { start: 0.8, end: 0 }, emitting: false,
    }).setDepth(58);

    this.buildHud();
    this.hint = new HoldHint(this);
    if (!save.state.tutorial) this.time.delayedCall(600, () => this.showHint());

    const home = button(this, 0, 0, 'btn_home', () => goTo(this, 'monstertruck:Menu'), 0.85);
    pin(this, home, 'tl', 80, 80);
    muteButton(this);

    this.input.on('pointerdown', (p: Phaser.Input.Pointer, over: Phaser.GameObjects.GameObject[]) => {
      if (over.length) return;
      if (this.phase === 'race') this.holding.add(p.id);
      else if (this.phase === 'done') this.onDoneTap(p.worldX, p.worldY);
    });
    const up = (p: Phaser.Input.Pointer) => this.holding.delete(p.id);
    this.input.on('pointerup', up);
    this.input.on('pointerupoutside', up);
    this.input.on('gameout', () => this.holding.clear());
    // tastiera (solo prove sul computer): spazio = tieni premuto
    this.input.keyboard?.on('keydown-SPACE', () => { if (this.phase === 'race') this.holding.add(-1); });
    this.input.keyboard?.on('keyup-SPACE', () => this.holding.delete(-1));
    this.events.once('shutdown', () => this.holding.clear());
    if (urlParam('debug')) Object.assign(window, { __mtr: this, __sound: sound });
    sfx.vroom();
  }

  // =================================================================
  // Interfaccia: stelle raccolte e strada verso il traguardo
  // =================================================================

  private buildHud(): void {
    this.counterIcon = this.add.image(0, 0, 'star').setScale(0.8).setDepth(950);
    pin(this, this.counterIcon, 'tl', 205, 80);
    this.counter = this.add.text(0, 0, '0', {
      fontFamily: FONT, fontSize: '64px', fontStyle: '700', color: '#ffffff', stroke: '#8a4a1e', strokeThickness: 10,
    }).setOrigin(0, 0.5).setDepth(950);
    pin(this, this.counter, 'tl', 250, 82);
    const bar = this.add.image(960, 0, 'mt_track').setScale(0.82).setDepth(940);
    const flag = this.add.image(960 + 350, 0, 'mt_flag').setScale(0.5).setDepth(941);
    this.mini = this.add.image(960 - 300, 0, 'mt_mini').setScale(0.55).setDepth(942).setTint(hex(colorHex(save.state.color)));
    this.bar = [bar, flag, this.mini];
    this.placeBar(view(this).top);
  }

  private placeBar(top: number): void {
    for (const o of this.bar) o.y = top + 80;
    if (this.bar[1]) this.bar[1].y = top + 66;
  }

  private bumpCounter(): void {
    this.shown++;
    this.counter.setText(String(this.shown));
    this.tweens.killTweensOf([this.counter, this.counterIcon]);
    this.counter.setScale(1);
    this.counterIcon.setScale(0.8);
    this.tweens.add({ targets: this.counter, scale: 1.25, duration: 90, yoyo: true, ease: 'Quad.easeOut' });
    this.tweens.add({ targets: this.counterIcon, scale: 1, duration: 90, yoyo: true, ease: 'Quad.easeOut' });
  }

  // =================================================================
  // Guida
  // =================================================================

  update(time: number, delta: number): void {
    const dt = Math.min(0.05, delta / 1000);
    const racing = this.phase === 'race';
    let holding = racing && this.holding.size > 0;
    if (racing && this.autoPilot) holding = true;
    this.trackHolding(holding, delta / 1000);

    const st = this.st;
    const g = this.course.ground;
    const res = this.phase === 'done' ? {} : stepTruck(st, g, holding, dt);
    const cam = st.x - TRUCK_X;

    if (res.takeoff && st.vx > 260) sfx.jump();
    if (res.land !== undefined) this.onLand(res.land, res.flight ?? 0, !!res.bounced);
    this.bg.update(dt, st.vx);
    this.groundView.draw(cam);
    this.finishImg.setPosition(this.course.len - cam, g.at(this.course.len));
    this.updateTruck(dt, holding, cam);
    this.updateItems(time, cam);

    if (racing) {
      this.mini.x = 960 - 300 + 600 * Math.min(1, st.x / this.course.len);
      if (!this.hint.visible && st.vx < 5 && time - this.lastTouch > IDLE_HINT_MS) this.showHint();
      if (st.x >= this.course.len) this.finish();
    } else if (this.phase === 'finish' && st.vx <= 0 && !st.air) {
      this.celebrate();
    }
  }

  /** Il truck: segue il terreno ruota per ruota, si inclina, gira le ruote, fa la polvere. */
  private updateTruck(dt: number, holding: boolean, cam: number): void {
    const st = this.st, g = this.course.ground, tr = this.truck;
    tr.x = TRUCK_X + this.enter + (st.x - cam - TRUCK_X);
    tr.y = st.y;
    const half = (TF.frontX - TF.cx) * TS;
    let want: number;
    if (st.air) {
      want = Phaser.Math.Clamp(Phaser.Math.RadToDeg(Math.atan2(st.vy, Math.max(200, st.vx))) * 0.45, -22, 22);
      tr.rearDy += (0 - tr.rearDy) * Math.min(1, dt * 8);
      tr.frontDy += (0 - tr.frontDy) * Math.min(1, dt * 8);
    } else {
      want = Phaser.Math.Clamp(Phaser.Math.RadToDeg(Math.atan2(g.at(st.x + half) - g.at(st.x - half), 2 * half)), -30, 30);
      const w = tr.wheelRest();
      const r = TF.R * TS;
      tr.rearDy = Phaser.Math.Clamp(g.at(w.rx + cam) - r - w.ry, -36, 36);
      tr.frontDy = Phaser.Math.Clamp(g.at(w.fx + cam) - r - w.fy, -36, 36);
    }
    tr.angle += (want - tr.angle) * Math.min(1, dt * (st.air ? 4 : 10));
    tr.spin += (st.vx * dt) / (TF.R * TS) * 57.3;
    tr.floorY = g.at(st.x);
    tr.sync(dt);
    // polvere dalla ruota dietro quando si accelera
    if (holding && !st.air && st.vx > 80) {
      this.dustT -= dt;
      if (this.dustT <= 0) {
        this.dustT = 0.05;
        const w = tr.wheelRest();
        this.dust.emitParticleAt(w.rx - 50 * TS, tr.floorY - 6, 1);
      }
    }
  }

  private onLand(impact: number, flight: number, bounced: boolean): void {
    const tr = this.truck;
    if (flight < 0.12 && impact < 250) return;
    tr.kick(Math.min(420, impact * 0.35));
    sfx.land();
    if (bounced) {
      sfx.boing();
      this.tweens.add({ targets: tr, squash: 0.84, duration: 90, yoyo: true, ease: 'Quad.easeOut' });
    }
    const w = tr.wheelRest();
    const tint = hex(trackById(this.track).ground[0]);
    for (const x of [w.rx, w.fx]) burst(this, x, (tr.floorY ?? tr.y) - 4, 'dot', { count: 7, tints: [tint, 0xffffff], speed: [80, 260], scale: [1.3, 0], gravity: 300, life: 550, depth: 70 });
    if (flight > 0.7 && this.time.now - this.lastCheer > 1800) {
      this.lastCheer = this.time.now;
      this.bg.cheer();
      sfx.cheer();
      burst(this, tr.x, tr.y - 200, 'star', { count: 6, speed: [160, 360], scale: [0.5, 0.1], gravity: 400, life: 800, depth: 70 });
    }
  }

  /** Prima pressione: rombo del motore; il tutorial si chiude quando il bambino ha tenuto (tempo vero) e lasciato. */
  private trackHolding(holding: boolean, realDt: number): void {
    if (holding) {
      this.lastTouch = this.time.now;
      this.held += realDt;
      if (!this.wasHolding && this.time.now - this.lastVroom > 700) { sfx.vroom(); this.lastVroom = this.time.now; }
      if (this.hint.visible) this.hint.hide();
    } else if (this.wasHolding) {
      this.released = true;
    }
    if (!save.state.tutorial && this.held > 1.0 && this.released) save.update({ tutorial: true });
    this.wasHolding = holding;
  }

  private showHint(): void {
    if (this.phase !== 'race') return;
    this.lastTouch = this.time.now;
    this.hint.show(1240, 560);
  }

  // =================================================================
  // Stelle e scatoloni
  // =================================================================

  private updateItems(time: number, cam: number): void {
    const v = view(this);
    while (this.nextIdx < this.course.items.length && this.course.items[this.nextIdx].x - cam < v.right + 300) {
      this.spawn(this.course.items[this.nextIdx++]);
    }
    const st = this.st;
    const cx = st.x, cy = st.y - REACH_Y;
    for (let i = this.live.length - 1; i >= 0; i--) {
      const L = this.live[i];
      const it = L.item;
      const sx = it.x - cam;
      if (sx < v.left - 300) { this.removeLive(i); continue; }
      if (L.taken) continue;
      if (it.kind === 'box') {
        L.imgs.forEach((img, k) => img.setPosition(sx + (k % 2 ? 6 : -4), it.y - k * (BOX - 6)));
        if (this.phase !== 'done' && st.x + NOSE >= it.x - 40) this.crush(L, sx);
        continue;
      }
      const img = L.imgs[0];
      img.setPosition(sx, it.y + Math.sin(time / 300 + L.ph) * 6);
      img.setScale((it.kind === 'big' ? 1.05 : 0.95) * (1 + 0.08 * Math.sin(time / 160 + L.ph)));
      L.glow?.setPosition(sx, it.y);
      if (this.phase !== 'done' && touches(cx, cy, it.x, it.y, it.kind === 'big' ? BIG_REACH : STAR_REACH)) this.takeStar(L, sx, img.y);
    }
  }

  private spawn(it: Item): void {
    const imgs: Phaser.GameObjects.Image[] = [];
    let glow: Phaser.GameObjects.Image | undefined;
    if (it.kind === 'box') {
      for (let k = 0; k < (it.n ?? 1); k++) imgs.push(this.add.image(0, 0, 'mt_box').setOrigin(0.5, 1).setDepth(56 - k * 0.01));
    } else if (it.kind === 'big') {
      glow = this.add.image(0, 0, 'glow').setTint(0xfff0a0).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0.8).setScale(1.8).setDepth(44);
      imgs.push(this.add.image(0, 0, 'star').setDepth(45).setScale(1.05));
    } else {
      imgs.push(this.add.image(0, 0, 'star').setDepth(45));
    }
    this.live.push({ item: it, imgs, glow, taken: false, ph: Math.random() * 6.28 });
  }

  private removeLive(i: number): void {
    const L = this.live[i];
    if (!L.taken) { L.imgs.forEach((o) => o.destroy()); L.glow?.destroy(); }
    this.live.splice(i, 1);
  }

  private takeStar(L: Live, x: number, y: number): void {
    L.taken = true;
    const now = this.time.now;
    this.combo = now - this.lastStar < 900 ? this.combo + 1 : 0;
    this.lastStar = now;
    const big = L.item.kind === 'big';
    const value = big ? 3 : 1;
    this.stars += value;
    if (big) {
      sfx.bigstar();
      L.glow?.destroy();
      burst(this, x, y, 'sparkle', { count: 18, tints: [0xffffff, 0xffe066, 0xffb84a], speed: [200, 520], scale: [1.1, 0], gravity: 0, life: 900, depth: 70 });
      this.bg.cheer(1000);
    } else {
      sfx.star(this.combo);
      burst(this, x, y, 'sparkle', { count: 7, tints: [0xffe066, 0xffffff, 0xffb84a], speed: [120, 300], scale: [0.6, 0], gravity: 0, life: 500, depth: 70 });
    }
    const img = L.imgs[0];
    img.setDepth(960);
    for (let k = 1; k < value; k++) this.flyToCounter(this.add.image(x, y, 'star').setDepth(960).setScale(0.7), 120 * k);
    this.flyToCounter(img, 0);
  }

  private flyToCounter(img: Phaser.GameObjects.Image, delay: number): void {
    const target = this.counterIcon;
    this.tweens.add({
      targets: img, x: target.x, y: target.y, scale: 0.5, duration: 520, delay, ease: 'Cubic.easeIn',
      onComplete: () => { img.destroy(); this.bumpCounter(); },
    });
  }

  /** Il truck schiaccia la pila di scatoloni: pezzi di cartone, coriandoli, "ooh" del pubblico e un saltello. */
  private crush(L: Live, sx: number): void {
    L.taken = true;
    const n = L.item.n ?? 1;
    sfx.crunch();
    if (n >= 2) sfx.ooh();
    L.imgs.forEach((img, k) => {
      const dir = k % 2 ? 1 : -1;
      this.tweens.add({
        targets: img, x: img.x + dir * (60 + k * 40) + 160, y: img.y - 80 - k * 40, scaleX: 0.6, scaleY: 0.2, alpha: 0,
        duration: 420, ease: 'Quad.easeOut', onComplete: () => img.destroy(),
      });
    });
    const y = L.item.y - n * 40;
    burst(this, sx, y, 'mt_chip', { count: 10 + n * 4, speed: [200, 520], scale: [1.2, 0.6], gravity: 900, life: 900, depth: 70 });
    burst(this, sx, y, 'confetti', { count: 10, tints: CONFETTI, speed: [200, 500], scale: [1.1, 0.5], gravity: 700, life: 900, depth: 70 });
    if (!this.st.air) {
      this.st.air = true;
      this.st.airTime = 0;
      this.st.vy = boxHop(n);
    }
    this.truck.kick(200);
    if (n >= 2 && this.time.now - this.lastCheer > 1200) { this.lastCheer = this.time.now; this.bg.cheer(900); }
  }

  // =================================================================
  // Traguardo e premio
  // =================================================================

  private finish(): void {
    if (this.phase !== 'race') return;
    this.phase = 'finish';
    this.holding.clear();
    this.hint.hide();
    this.tweens.add({ targets: this.bar, alpha: 0, duration: 400 });
    this.bg.cheer(3500);
    sfx.cheer();
    sfx.fanfare();
    const fx = this.finishImg.x;
    for (let i = 0; i < 4; i++) {
      this.time.delayedCall(i * 240, () => burst(this, fx - 200 + Math.random() * 400, 260, 'confetti', {
        count: 22, tints: CONFETTI, speed: [250, 700], scale: [1.4, 0.6], life: 1600, gravity: 800,
      }));
    }
  }

  private celebrate(): void {
    this.phase = 'done';
    const s = save.state;
    const before = s.races;
    const prize = prizeOf(before, before + 1);
    save.update({
      races: before + 1,
      stars: s.stars + this.stars,
      raced: s.raced.includes(this.track) ? s.raced : [...s.raced, this.track],
      track: this.track,
    });
    sfx.horn();
    this.truck.kick(-200);
    const head = title3d(this, 700, 230, t('monstertruck.finish'), 110).setScale(0);
    this.tweens.add({ targets: head, scale: 1, duration: 450, ease: 'Back.easeOut' });
    const icon = this.add.image(620, 370, 'star').setScale(0).setDepth(900);
    const num = this.add.text(680, 374, `${this.stars}`, {
      fontFamily: FONT, fontSize: '80px', fontStyle: '700', color: '#ffe066', stroke: '#6a3a00', strokeThickness: 12,
    }).setOrigin(0, 0.5).setDepth(900).setAlpha(0);
    this.time.delayedCall(500, () => {
      this.tweens.add({ targets: icon, scale: 1.1, duration: 360, ease: 'Back.easeOut' });
      this.tweens.add({ targets: num, alpha: 1, duration: 300 });
    });
    let wait = 1400;
    if (prize) {
      wait = 3200;
      this.time.delayedCall(1300, () => this.showPrize(prize));
    }
    this.time.delayedCall(wait, () => {
      button(this, 420, 920, 'mt_btn_tracks', () => goTo(this, 'monstertruck:Tracks'), 0.85);
      const next = button(this, 720, 920, 'btn_next', () => goTo(this, 'monstertruck:Garage'), 0.95);
      pulse(this, next);
    });
  }

  /** Il premio della gara: un pezzo nuovo per il truck o una pista nuova. */
  private showPrize(u: Unlock): void {
    sfx.newpart();
    const x = 1180, y = 330;
    const isTrack = u.kind === 'track';
    const lbl = title3d(this, x, 110, t(isTrack ? 'monstertruck.newTrack' : 'monstertruck.newPart'), 72).setAlpha(0).setDepth(930);
    const glow = this.add.image(x, y, 'glow').setScale(isTrack ? 4.4 : 3).setTint(0xfff0a0).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0).setDepth(905);
    const parts: Phaser.GameObjects.Image[] = [];
    let sc = 1;
    if (isTrack) {
      parts.push(this.add.image(x, y, `mt_card_${u.id}`));
      sc = 0.72;
    } else {
      parts.push(this.add.image(x, y, 'mt_slot'));
      if (u.kind === 'color') {
        parts.push(this.add.image(x, y - 4, 'mt_swatch').setTint(hex(colorHex(u.id))), this.add.image(x, y - 4, 'mt_swatch_hi'));
      } else if (u.kind === 'wheel') {
        parts.push(this.add.image(x, y - 4, `mt_wheel_${u.id}`).setData('s', 0.62));
      } else {
        parts.push(this.add.image(x, y - 4, `mt_stk_${u.id}`).setData('s', 0.7));
      }
      sc = 1.5;
    }
    parts.forEach((p, i) => {
      p.setDepth(910 + i).setScale(0);
      const k = (p.getData('s') as number | undefined) ?? (i === 0 || u.kind === 'color' ? 1 : 0.62);
      this.tweens.add({ targets: p, scale: sc * k, duration: 520, ease: 'Back.easeOut' });
    });
    this.tweens.add({ targets: [lbl, glow], alpha: 1, duration: 300, delay: 200 });
    this.tweens.add({ targets: glow, scale: glow.scale * 1.15, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    if (isTrack) {
      this.add.text(x, y + 140, t(`monstertruck.track.${u.id}`), {
        fontFamily: FONT, fontSize: '50px', fontStyle: '700', color: '#ffffff', stroke: '#8a4a1e', strokeThickness: 10,
      }).setOrigin(0.5).setDepth(930);
    }
    burst(this, x, y, 'sparkle', { count: 20, tints: [0xffffff, 0xffe066], speed: [200, 520], scale: [1.1, 0], gravity: 0, life: 900, depth: 940 });
  }

  private onDoneTap(x: number, y: number): void {
    const tr = this.truck;
    if (tr.hit(x, y)) {
      sfx.horn();
      tr.kick(-260);
      this.bg.cheer(900);
      return;
    }
    sfx.tap();
    burst(this, x, y, 'sparkle', { count: 6, tints: [0xffffff, 0xffe066, 0xffb84a], speed: [80, 220], scale: [0.6, 0], gravity: 0, life: 600 });
  }

  // ---------------------------------------------------------------- per le prove (?debug=1)
  /** Salta a una frazione della pista (la parte saltata non conta). */
  skipTo(fraction: number): void {
    const x = this.course.len * fraction;
    for (const L of this.live) { L.imgs.forEach((o) => o.setVisible(false)); L.glow?.setVisible(false); L.taken = true; }
    this.st.x = x;
    this.st.y = this.course.ground.at(x);
    this.st.air = false;
    while (this.nextIdx < this.course.items.length && this.course.items[this.nextIdx].x < x + 200) this.nextIdx++;
  }

  get state(): { phase: Phase; stars: number; x: number; len: number; y: number; vx: number; air: boolean; track: string } {
    const s = this.st;
    return { phase: this.phase, stars: this.stars, x: s.x, len: this.course.len, y: s.y, vx: s.vx, air: s.air, track: this.track };
  }
}
