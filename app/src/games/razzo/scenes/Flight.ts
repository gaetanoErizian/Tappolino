import Phaser from 'phaser';
import { setupView, button, pin, burst, pulse, view } from '../../../core/ui';
import { t } from '../../../core/i18n';
import { urlParam } from '../../../core/platform';
import { muteButton, title3d, goTo } from '../../../core/hud';
import { FONT } from '../../../core/brand';
import { sound } from '../../../core/sound';
import {
  buildCourse, courseLength, speedFor, stepRocket, bounceFrom, touches,
  ROCKET_X, ROCKET_R, STAR_REACH, BIG_REACH, LANES, type Item, type RocketState,
} from '../course';
import { nextPlanet, addVisited, newRockets, planetById, isPlanetId, usableRocket, PLANET_IDS, type Planet, type RocketId } from '../planets';
import { SpaceBg, RocketView, PlanetView, hex } from '../world';
import { HoldHint } from '../../../core/holdHint';
import { save } from '../save';
import { sfx, playRazzoMusic } from '../sfx';

type Phase = 'fly' | 'arrive' | 'landed';

interface Live {
  item: Item;
  img: Phaser.GameObjects.Image;
  glow?: Phaser.GameObjects.Image;
  taken: boolean;
  /** spinta ricevuta dopo un rimbalzo (asteroidi) */
  ox: number; oy: number; vx: number; vy: number;
  ph: number;
}

const IDLE_HINT_MS = 7000;
const TRAIL = [0xffe066, 0xffffff, 0xffb84a];
const CONFETTI = [0xff5e5e, 0xffd23f, 0x3cc46a, 0x4fa3ff, 0xff6fb5, 0xb48cff];

/**
 * Un viaggio: tieni premuto e il razzo sale, lascia e scende. Si raccolgono stelle; gli asteroidi di gomma
 * fanno rimbalzare (non si perde mai). Alla fine si atterra su un pianeta buffo che finisce nella collezione.
 */
export class Flight extends Phaser.Scene {
  private dest!: Planet;
  private phase: Phase = 'fly';
  private level = 0;
  private course: Item[] = [];
  private nextIdx = 0;
  private live: Live[] = [];
  private len = 1;
  private dist = 0;
  private speed = 0;
  private bg!: SpaceBg;
  private rocket!: RocketView;
  private rocketId: RocketId = 'rosso';
  private st: RocketState = { y: LANES[1], vy: 0 };
  private holding = new Set<number>();
  private wasHolding = false;
  private lastLift = 0;
  private knock = 0;
  private enter = -800;
  private spin = 0;
  private invuln = 0;
  private stars = 0;
  private shown = 0;
  private combo = 0;
  private lastStar = -9999;
  private held = 0;
  private released = false;
  private lastTouch = 0;
  private hint!: HoldHint;
  private counter!: Phaser.GameObjects.Text;
  private counterIcon!: Phaser.GameObjects.Image;
  private track: Phaser.GameObjects.Image[] = [];
  private mini!: Phaser.GameObjects.Image;
  private planet: PlanetView | null = null;
  /** solo test e catture (?debug=1): il razzo vola da solo verso le stelle */
  autoPilot = false;

  constructor() { super('razzo:Flight'); }

  create(data: { planet?: string }): void {
    this.level = save.state.trips;
    this.dest = planetById(isPlanetId(data?.planet) ? data.planet : nextPlanet(save.state.visited, save.state.last));
    this.rocketId = usableRocket(save.state.rocket, save.state.trips);
    this.phase = 'fly';
    this.course = buildCourse(this.level, (Date.now() ^ (this.level * 7919)) >>> 0);
    this.len = courseLength(this.level);
    this.nextIdx = 0;
    this.live = [];
    this.dist = 0;
    this.speed = 0;
    this.st = { y: LANES[1], vy: 0 };
    this.holding = new Set();
    this.wasHolding = false;
    this.knock = 0;
    this.enter = -800;
    this.spin = 0;
    this.invuln = 0;
    this.stars = 0;
    this.shown = 0;
    this.combo = 0;
    this.lastStar = -9999;
    this.held = 0;
    this.released = false;
    this.lastTouch = this.time.now;
    this.track = [];
    this.planet = null;
    this.autoPilot = false;

    setupView(this, (v) => this.placeTrack(v.top));
    this.cameras.main.fadeIn(250, 10, 16, 60);
    playRazzoMusic();
    const others = PLANET_IDS.filter((id) => id !== this.dest.id);
    this.bg = new SpaceBg(this, { nebula: this.dest.nebula, decor: [others[this.level % others.length], others[(this.level + 3) % others.length]], dust: true });

    this.rocket = new RocketView(this, this.rocketId, ROCKET_X - 800, this.st.y, 0.82, 60);
    this.rocket.thrust(1);
    this.tweens.add({ targets: this, enter: 0, duration: 900, ease: 'Cubic.easeOut' });
    sfx.launch();

    this.buildHud();
    this.hint = new HoldHint(this);
    if (!save.state.tutorial) this.time.delayedCall(500, () => this.showHint());

    const home = button(this, 0, 0, 'btn_home', () => goTo(this, 'razzo:Menu'), 0.85);
    pin(this, home, 'tl', 80, 80);
    muteButton(this);

    this.input.on('pointerdown', (p: Phaser.Input.Pointer, over: Phaser.GameObjects.GameObject[]) => {
      if (over.length) return;
      if (this.phase === 'fly') this.holding.add(p.id);
      else if (this.phase === 'landed') this.onLandedTap(p.worldX, p.worldY);
    });
    const up = (p: Phaser.Input.Pointer) => this.holding.delete(p.id);
    this.input.on('pointerup', up);
    this.input.on('pointerupoutside', up);
    this.input.on('gameout', () => this.holding.clear());
    // tastiera (solo prove sul computer): spazio = tieni premuto
    this.input.keyboard?.on('keydown-SPACE', () => { if (this.phase === 'fly') this.holding.add(-1); });
    this.input.keyboard?.on('keyup-SPACE', () => this.holding.delete(-1));
    this.events.once('shutdown', () => this.holding.clear());
    if (urlParam('debug')) Object.assign(window, { __rz: this, __sound: sound });
  }

  // =================================================================
  // Interfaccia: stelle raccolte e strada verso il pianeta
  // =================================================================

  private buildHud(): void {
    this.counterIcon = this.add.image(0, 0, 'star').setScale(0.8).setDepth(950);
    pin(this, this.counterIcon, 'tl', 205, 80);
    this.counter = this.add.text(0, 0, '0', {
      fontFamily: FONT, fontSize: '64px', fontStyle: '700', color: '#ffffff', stroke: '#1b2466', strokeThickness: 10,
    }).setOrigin(0, 0.5).setDepth(950);
    pin(this, this.counter, 'tl', 250, 82);
    const bar = this.add.image(960, 0, 'rz_track').setScale(0.82).setDepth(940);
    const home = this.add.image(960 - 340, 0, 'rz_planet_casa').setScale(0.15).setDepth(941);
    const goal = this.add.image(960 + 340, 0, `rz_planet_${this.dest.id}`).setScale(0.15).setDepth(941);
    this.mini = this.add.image(960 - 300, 0, `rz_rocket_${this.rocketId}`).setScale(0.26).setDepth(942);
    this.track = [bar, home, goal, this.mini];
    this.placeTrack(view(this).top);
  }

  private placeTrack(top: number): void {
    for (const o of this.track) o.y = top + 80;
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
  // Volo
  // =================================================================

  update(time: number, delta: number): void {
    const dt = Math.min(0.05, delta / 1000);
    const flying = this.phase === 'fly';
    let holding = flying && this.holding.size > 0;
    if (flying && this.autoPilot) holding = this.autoHold();
    this.trackHolding(holding, delta / 1000);

    if (flying) {
      stepRocket(this.st, holding, dt);
      this.speed += (speedFor(this.level) - this.speed) * Math.min(1, dt * 1.6);
    } else {
      this.speed += (0 - this.speed) * Math.min(1, dt * 2.2);
    }
    this.dist += this.speed * dt;
    this.knock *= Math.exp(-3 * dt);
    this.spin *= Math.exp(-4 * dt);
    this.bg.update(dt, this.speed);
    this.updateItems(time, dt);

    if (flying) {
      const r = this.rocket;
      r.x = ROCKET_X + this.knock + this.enter;
      r.y = this.st.y;
      r.angle = Phaser.Math.Clamp(this.st.vy * 0.028, -16, 16) + this.spin * Math.sin(time / 40);
      r.thrust(holding ? 1 : 0.32);
      r.setAlpha(time < this.invuln ? (Math.floor(time / 90) % 2 ? 0.45 : 1) : 1);
      this.mini.x = 960 - 300 + 600 * Math.min(1, this.dist / this.len);
      this.hint.arrowsAt(r.x, r.y);
      if (!this.hint.visible && time - this.lastTouch > IDLE_HINT_MS) this.showHint();
      if (this.dist >= this.len) this.arrive();
    }
    this.rocket.sync(dt);
  }

  /** Prima pressione: suono di spinta; il tutorial si chiude quando il bambino ha tenuto (tempo vero) e lasciato. */
  private trackHolding(holding: boolean, realDt: number): void {
    if (holding) {
      this.lastTouch = this.time.now;
      this.held += realDt;
      if (!this.wasHolding && this.time.now - this.lastLift > 260) { sfx.lift(); this.lastLift = this.time.now; }
      if (this.hint.visible) this.hint.hide();
    } else if (this.wasHolding) {
      this.released = true;
    }
    if (!save.state.tutorial && this.held > 1.0 && this.released) save.update({ tutorial: true });
    this.wasHolding = holding;
  }

  private showHint(): void {
    if (this.phase !== 'fly') return;
    this.lastTouch = this.time.now;
    this.hint.show(1180, 640, this.rocket.x, this.rocket.y);
  }

  private updateItems(time: number, dt: number): void {
    const v = view(this);
    // nuovi oggetti che entrano da destra
    while (this.nextIdx < this.course.length && this.course[this.nextIdx].x - this.dist < v.right + 260) {
      this.spawn(this.course[this.nextIdx++]);
    }
    const rx = this.rocket.x + 40, ry = this.rocket.y;
    for (let i = this.live.length - 1; i >= 0; i--) {
      const L = this.live[i];
      const it = L.item;
      L.vx *= Math.exp(-2.2 * dt);
      L.vy *= Math.exp(-2.2 * dt);
      L.ox += L.vx * dt;
      L.oy += L.vy * dt;
      const x = it.x - this.dist + L.ox;
      const y = it.y + L.oy + (it.bob ? Math.sin(time / 600 + L.ph) * it.bob : 0);
      if (x < v.left - 260) { this.removeLive(i); continue; }
      if (L.taken) continue;
      L.img.setPosition(x, y);
      L.glow?.setPosition(x, y);
      if (it.kind === 'rock') {
        if (this.phase === 'fly' && time > this.invuln && touches(rx, ry, ROCKET_R, x, y, (it.r ?? 90) * 0.85)) this.hitRock(L, x, y);
      } else {
        L.img.setScale((it.kind === 'big' ? 0.9 : 0.95) * (1 + 0.08 * Math.sin(time / 160 + L.ph)));
        const reach = it.kind === 'big' ? BIG_REACH : STAR_REACH;
        if (this.phase === 'fly' && touches(rx, ry, 0, x, y, reach)) this.takeStar(L, x, y);
      }
    }
  }

  private spawn(it: Item): void {
    let img: Phaser.GameObjects.Image;
    let glow: Phaser.GameObjects.Image | undefined;
    if (it.kind === 'rock') {
      img = this.add.image(0, 0, `rz_rock_${it.look ?? 0}`).setDepth(50).setScale(((it.r ?? 90) * 2) / 190);
    } else if (it.kind === 'big') {
      glow = this.add.image(0, 0, 'glow').setTint(0xffd6f0).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0.8).setScale(1.7).setDepth(44);
      img = this.add.image(0, 0, 'rz_bigstar').setDepth(45);
    } else {
      img = this.add.image(0, 0, 'star').setDepth(45);
    }
    img.setPosition(it.x - this.dist, it.y);
    this.live.push({ item: it, img, glow, taken: false, ox: 0, oy: 0, vx: 0, vy: 0, ph: Math.random() * 6.28 });
  }

  private removeLive(i: number): void {
    const L = this.live[i];
    if (!L.taken) { L.img.destroy(); L.glow?.destroy(); }
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
      burst(this, x, y, 'sparkle', { count: 18, tints: [0xffffff, 0xffe066, 0xff9fd0, 0x9fd8ff], speed: [200, 520], scale: [1.1, 0], gravity: 0, life: 900, depth: 70 });
      this.cameras.main.flash(120, 255, 240, 200, false);
    } else {
      sfx.star(this.combo);
      burst(this, x, y, 'sparkle', { count: 7, tints: TRAIL, speed: [120, 300], scale: [0.6, 0], gravity: 0, life: 500, depth: 70 });
    }
    // la stella vola nel contatore in alto
    const target = this.counterIcon;
    L.img.setDepth(960);
    for (let k = 1; k < value; k++) {
      const extra = this.add.image(x, y, 'star').setDepth(960).setScale(0.7);
      this.flyToCounter(extra, target, 120 * k);
    }
    this.flyToCounter(L.img, target, 0);
  }

  private flyToCounter(img: Phaser.GameObjects.Image, target: Phaser.GameObjects.Image, delay: number): void {
    this.tweens.add({
      targets: img, x: target.x, y: target.y, scale: 0.5, duration: 520, delay, ease: 'Cubic.easeIn',
      onComplete: () => { img.destroy(); this.bumpCounter(); },
    });
  }

  private hitRock(L: Live, x: number, y: number): void {
    this.invuln = this.time.now + 900;
    bounceFrom(this.st, y);
    const dir = Math.sign(this.st.vy) || -1;
    this.knock = -110;
    this.spin = 22;
    this.combo = 0;
    sfx.boing();
    // l'asteroide si schiaccia come una palla di gomma e viene spinto via
    L.vx = 260;
    L.vy = -dir * 220;
    const s = L.img.scale;
    this.tweens.add({ targets: L.img, scaleX: s * 1.25, scaleY: s * 0.78, duration: 90, yoyo: true, repeat: 1, ease: 'Quad.easeOut', onComplete: () => L.img.setScale(s) });
    this.tweens.add({ targets: this.rocket, squash: 0.8, duration: 80, yoyo: true, ease: 'Quad.easeOut' });
    const mx = (this.rocket.x + x) / 2, my = (this.rocket.y + y) / 2;
    burst(this, mx, my, 'star', { count: 6, speed: [160, 340], scale: [0.45, 0.1], gravity: 300, life: 700, depth: 70 });
    burst(this, mx, my, 'dot', { count: 8, tints: [0xffffff, 0xd9c2ff], speed: [100, 260], scale: [0.7, 0], gravity: 0, life: 450, depth: 70 });
  }

  /** Pilota automatico (solo ?debug=1): va verso la prossima stella evitando gli asteroidi. */
  private autoHold(): boolean {
    const rx = this.rocket.x;
    let target: number = LANES[1];
    let best = Infinity;
    for (const L of this.live) {
      if (L.taken || L.item.kind === 'rock') continue;
      const x = L.img.x;
      if (x < rx - 10 || x > rx + 900) continue;
      const blocked = this.live.some((R) => R.item.kind === 'rock' && Math.abs(R.img.x - x) < 360 && Math.abs(R.img.y - L.img.y) < 150);
      if (!blocked && x < best) { best = x; target = L.img.y; }
    }
    return this.st.y + this.st.vy * 0.28 > target;
  }

  // =================================================================
  // Arrivo sul pianeta
  // =================================================================

  private arrive(): void {
    if (this.phase !== 'fly') return;
    this.phase = 'arrive';
    this.holding.clear();
    this.hint.hide();
    this.rocket.setAlpha(1);
    this.tweens.add({ targets: this.track, alpha: 0, duration: 400 });
    this.bg.calm();

    const px = 1400, py = 800, ps = 1.35;
    const pv = new PlanetView(this, this.dest.id, px + 1300, py, ps, 30);
    this.planet = pv;
    const halo = this.add.image(px + 1300, py, 'glow').setScale(5.2).setTint(hex(this.dest.light)).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0.35).setDepth(29);
    const slide = { x: px + 1300 };
    this.tweens.add({
      targets: slide, x: px, duration: 1700, ease: 'Cubic.easeOut',
      onUpdate: () => { pv.setPosition(slide.x, py); halo.x = slide.x; },
    });

    // il razzo si raddrizza, va sopra il pianeta e scende piano con il motore acceso
    const r = this.rocket;
    const restY = pv.top - (150 - 30) * r.scale + 6;
    sfx.whoosh();
    r.thrust(0.7);
    this.tweens.add({ targets: r, x: px, y: 300, angle: -90, duration: 1700, ease: 'Sine.easeInOut' });
    this.time.delayedCall(1750, () => {
      r.thrust(0.55);
      this.tweens.add({
        targets: r, y: restY, duration: 1000, ease: 'Sine.easeIn',
        onComplete: () => this.landed(px),
      });
    });
  }

  private landed(px: number): void {
    const r = this.rocket;
    r.thrust(0);
    sfx.land();
    this.tweens.add({ targets: r, squash: 0.82, duration: 100, yoyo: true, ease: 'Quad.easeOut' });
    const top = this.planet!.top;
    const tint = [hex(this.dest.light), hex(this.dest.base), 0xffffff];
    for (const dx of [-1, 1]) burst(this, px + dx * 70, top + 10, 'dot', { count: 9, tints: tint, speed: [80, 260], scale: [1.1, 0], gravity: -40, life: 700, depth: 70 });

    // bandierina piantata accanto al razzo
    const fx = px + 150;
    const fy = this.planet!.y - Math.sqrt(Math.max(0, this.planet!.radius ** 2 - 150 ** 2)) + 6;
    const flag = this.add.image(fx, fy, 'rz_flag').setOrigin(0.15, 0.97).setDepth(55).setScale(0);
    this.time.delayedCall(450, () => {
      sfx.flag();
      this.tweens.add({ targets: flag, scale: 1, duration: 420, ease: 'Back.easeOut' });
      burst(this, fx + 30, fy - 120, 'sparkle', { count: 10, tints: [0xffffff, 0xffe066], speed: [150, 380], scale: [0.9, 0], gravity: 0, life: 800 });
    });
    this.time.delayedCall(900, () => this.celebrate());
  }

  private celebrate(): void {
    const isNew = !save.state.visited.includes(this.dest.id);
    const before = save.state.trips;
    const unlocked = newRockets(before, before + 1);
    save.update({
      visited: addVisited(save.state.visited, this.dest.id),
      trips: before + 1,
      stars: save.state.stars + this.stars,
      last: this.dest.id,
      ...(unlocked.length ? { rocket: unlocked[unlocked.length - 1] } : {}),
    });
    this.planet?.giggle();
    sfx.fanfare();
    for (let i = 0; i < 4; i++) {
      this.time.delayedCall(i * 260, () => burst(this, 300 + Math.random() * 1320, 120, 'confetti', {
        count: 22, tints: CONFETTI, speed: [250, 700], scale: [1.4, 0.6], life: 1600, gravity: 800,
      }));
    }
    const head = title3d(this, 640, 230, t(isNew ? 'razzo.newPlanet' : 'razzo.again'), isNew ? 96 : 80).setScale(0);
    this.tweens.add({ targets: head, scale: 1, duration: 450, ease: 'Back.easeOut' });
    const name = this.add.text(640, 350, t(`razzo.planet.${this.dest.id}`), {
      fontFamily: FONT, fontSize: '64px', fontStyle: '700', color: '#ffffff', stroke: '#2a2a8a', strokeThickness: 10,
    }).setOrigin(0.5).setDepth(900).setAlpha(0);
    this.tweens.add({ targets: name, alpha: 1, delay: 300, duration: 300 });

    // stelle del viaggio
    const icon = this.add.image(560, 500, 'star').setScale(0).setDepth(900);
    const num = this.add.text(620, 504, `${this.stars}`, {
      fontFamily: FONT, fontSize: '80px', fontStyle: '700', color: '#ffe066', stroke: '#6a3a00', strokeThickness: 12,
    }).setOrigin(0, 0.5).setDepth(900).setAlpha(0);
    this.time.delayedCall(700, () => {
      this.tweens.add({ targets: icon, scale: 1.1, duration: 360, ease: 'Back.easeOut' });
      this.tweens.add({ targets: num, alpha: 1, duration: 300 });
    });

    let wait = 1500;
    if (unlocked.length) {
      const id = unlocked[unlocked.length - 1];
      wait = 3300;
      this.time.delayedCall(1700, () => this.showNewRocket(id));
    }
    this.time.delayedCall(wait, () => {
      this.phase = 'landed';
      button(this, 400, 900, 'rz_btn_planets', () => goTo(this, 'razzo:Planets'), 0.85);
      const next = button(this, 720, 900, 'btn_next', () => goTo(this, 'razzo:Flight'), 0.95);
      pulse(this, next);
    });
  }

  private showNewRocket(id: RocketId): void {
    sfx.newrocket();
    const lbl = title3d(this, 560, 600, t('razzo.newRocket'), 64).setAlpha(0);
    const rk = new RocketView(this, id, -400, 700, 0.7, 910);
    rk.thrust(1);
    const ev = this.time.addEvent({ delay: 16, loop: true, callback: () => rk.sync(0.016) });
    this.tweens.add({
      targets: rk, x: 560, duration: 900, ease: 'Back.easeOut',
      onComplete: () => {
        rk.thrust(0.3);
        this.tweens.add({ targets: lbl, alpha: 1, duration: 300 });
        burst(this, 560, 700, 'sparkle', { count: 16, tints: [0xffffff, 0xffe066], speed: [200, 500], scale: [1, 0], gravity: 0, life: 900, depth: 920 });
        this.tweens.add({ targets: rk, y: 680, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      },
    });
    this.events.once('shutdown', () => ev.remove());
  }

  private onLandedTap(x: number, y: number): void {
    if (this.planet?.hit(x, y, 0)) {
      this.planet.giggle();
      burst(this, x, y, 'sparkle', { count: 8, tints: [0xffffff, hex(this.dest.light)], gravity: 0, life: 600 });
      return;
    }
    const r = this.rocket;
    if (Phaser.Math.Distance.Between(x, y, r.x, r.y) < 140) {
      sfx.zoom();
      r.thrust(1);
      const y0 = r.y;
      this.tweens.add({ targets: r, y: y0 - 90, duration: 260, yoyo: true, ease: 'Quad.easeOut', onComplete: () => { r.y = y0; r.thrust(0); sfx.land(); } });
      return;
    }
    sfx.twinkle();
    burst(this, x, y, 'sparkle', { count: 6, tints: [0xffffff, 0xffe066, 0x9fd8ff], speed: [80, 220], scale: [0.6, 0], gravity: 0, life: 600 });
  }

  // ---------------------------------------------------------------- per le prove (?debug=1)
  /** Salta quasi alla fine del viaggio. */
  skipTo(fraction: number): void {
    const d = this.len * fraction;
    for (const L of this.live) L.img.setVisible(false);
    this.dist = d;
    while (this.nextIdx < this.course.length && this.course[this.nextIdx].x < d - 200) this.nextIdx++;
  }

  get state(): { phase: Phase; stars: number; dist: number; len: number; y: number; dest: string } {
    return { phase: this.phase, stars: this.stars, dist: this.dist, len: this.len, y: this.st.y, dest: this.dest.id };
  }
}

