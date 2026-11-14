import Phaser from 'phaser';
import { setupView, button, pin, HintHand, burst, view } from '../../../core/ui';
import { t } from '../../../core/i18n';
import { drawBackdrop, drawBuilding, Truck, GROUND_Y, type Cell } from '../world';
import { levelCfg, wallColor, newlyUnlocked, pickFreeCell, type LevelCfg } from '../levels';
import { save } from '../save';
import { sfx } from '../sfx';
import { muteButton, title3d, goTo } from './common';

interface Flame {
  cell: Cell;
  /** dimensione (crescita/spegnimento) e oscillazione separate; niente Container (Phaser 4 + rotazione = artefatti) */
  s: { size: number; wx: number; wy: number };
  img: Phaser.GameObjects.Image;
  /** bagliore additivo sul muro (luce dinamica leggera) */
  halo: Phaser.GameObjects.Image;
  embers: Phaser.GameObjects.Particles.ParticleEmitter;
  dying: boolean;
  born: number;
}

const BUILDING_X = 1270;
const HIT_FLAME = 175;   // tolleranza generosa (unità di design)
const HIT_CAT = 140;
const IDLE_HINT_MS = 5000;

export class Game extends Phaser.Scene {
  private level = 0;
  private cfg!: LevelCfg;
  private cells: Cell[] = [];
  private flames: Flame[] = [];
  private truck!: Truck;
  private hint!: HintHand;
  private out = 0;            // fiamme spente
  private spawned = 0;
  private misses = 0;
  private lastSuccess = 0;
  private finishing = false;
  private slots: Phaser.GameObjects.Image[] = [];
  private cat: { img: Phaser.GameObjects.Image; cell: Cell; rescuing: boolean; meow: Phaser.Time.TimerEvent } | null = null;
  private catSpawned = false;
  private catsThisLevel = 0;
  private catRescue: Promise<void> | null = null;
  private lastFreed = -1;
  private tutorial = false;

  constructor() { super('pompieri:Game'); }

  create(): void {
    this.level = save.state.levelsDone;
    this.cfg = levelCfg(this.level);
    this.flames = [];
    this.out = 0;
    this.spawned = 0;
    this.misses = 0;
    this.finishing = false;
    this.cat = null;
    this.catSpawned = false;
    this.catsThisLevel = 0;
    this.catRescue = null;
    this.lastFreed = -1;
    this.slots = [];
    this.tutorial = !save.state.tutorialDone;

    setupView(this, (v) => this.slots.forEach((s) => { s.y = v.top + 60; }));
    this.cameras.main.fadeIn(250, 143, 211, 255);
    drawBackdrop(this);
    this.cells = drawBuilding(this, BUILDING_X, this.cfg.cols, this.cfg.rows, wallColor(this.level)).cells;
    this.truck = new Truck(this, 40, 630, save.state.truck);
    this.hint = new HintHand(this);

    this.buildHud();
    const home = button(this, 0, 0, 'btn_home', () => goTo(this, 'pompieri:Menu'), 0.85);
    pin(this, home, 'tl', 80, 80);
    muteButton(this);

    // Inizio livello: "Livello N" + sirena, poi prima fiamma.
    const lbl = title3d(this, 960, 500, t('pompieri.level', { n: this.level + 1 }), 100).setScale(0);
    this.tweens.add({ targets: lbl, scale: 1, duration: 350, ease: 'Back.easeOut', hold: 700, yoyo: true, onComplete: () => lbl.destroy() });
    this.time.delayedCall(300, () => this.truck.honk());
    this.time.delayedCall(1300, () => this.spawnFlame());
    this.time.addEvent({ delay: this.cfg.spawnMs, loop: true, startAt: 0, callback: () => this.spawnFlame() });
    this.time.addEvent({ delay: 500, loop: true, callback: () => this.tick() });
    this.lastSuccess = this.time.now + 1500;

    this.input.on('pointerdown', (p: Phaser.Input.Pointer, over: Phaser.GameObjects.GameObject[]) => {
      if (!over.length) this.onTap(p.worldX, p.worldY);
    });
  }

  update(): void {
    for (const f of this.flames) f.img.setScale(f.s.size * f.s.wx, f.s.size * f.s.wy);
  }

  // ---------- HUD: stelle da riempire ----------
  private buildHud(): void {
    const n = this.cfg.goal;
    const gap = Math.min(78, 1000 / n);
    const x0 = BUILDING_X - ((n - 1) * gap) / 2;
    for (let i = 0; i < n; i++) {
      this.slots.push(this.add.image(x0 + i * gap, view(this).top + 60, 'star_empty').setScale(gap / 100).setDepth(900));
    }
  }

  private fillSlot(fromX: number, fromY: number): void {
    const slot = this.slots[this.out - 1];
    if (!slot) return;
    const s = this.add.image(fromX, fromY, 'star').setDepth(950).setScale(0.9);
    this.tweens.add({
      targets: s, x: slot.x, y: slot.y, scale: slot.scale, duration: 520, ease: 'Cubic.easeIn',
      onComplete: () => {
        s.destroy();
        slot.setTexture('star');
        sfx.star();
        this.tweens.add({ targets: slot, scale: slot.scale * 1.35, duration: 110, yoyo: true });
      },
    });
  }

  // ---------- Fiamme ----------
  private spawnFlame(): void {
    if (this.finishing) return;
    const active = this.flames.filter((f) => !f.dying).length;
    if (active >= this.cfg.maxFlames) return;
    if (this.spawned >= this.cfg.goal) return;
    // Evita di riaccendere subito la finestra appena spenta (se ce ne sono altre libere).
    const busy = this.cells.map((c) => c.busy);
    const freeCount = busy.filter((b) => !b).length;
    if (this.lastFreed >= 0 && freeCount > 1) busy[this.lastFreed] = true;
    const idx = pickFreeCell(busy);
    if (idx < 0) return;
    const cell = this.cells[idx];
    cell.busy = true;
    this.spawned++;

    const img = this.add.image(cell.x, cell.y + 66, 'flame').setOrigin(0.5, 0.92).setDepth(40).setScale(0);
    const st = { size: 0, wx: 1, wy: 1 };
    const embers = this.add.particles(cell.x, cell.y - 40, 'dot', {
      speedY: { min: -120, max: -60 }, speedX: { min: -30, max: 30 }, scale: { start: 0.35, end: 0 },
      lifespan: 900, frequency: 260, tint: [0xffb703, 0xff7a1a], alpha: { start: 0.9, end: 0 },
    }).setDepth(39);
    const halo = this.add.image(cell.x, cell.y - 10, 'glow').setTint(0xff9a3c).setBlendMode(Phaser.BlendModes.ADD)
      .setDepth(35).setScale(2.4).setAlpha(0);
    this.tweens.add({ targets: halo, alpha: { from: 0.28, to: 0.5 }, duration: 420 + Math.random() * 200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    const f: Flame = { cell, s: st, img, halo, embers, dying: false, born: this.time.now };
    this.flames.push(f);

    this.tweens.add({ targets: cell.glow, alpha: 0.85, duration: 300 });
    this.tweens.add({ targets: st, size: 1, duration: 380, ease: 'Back.easeOut' });
    this.tweens.add({ targets: st, wx: 0.9, wy: 1.08, duration: 260 + Math.random() * 120, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    // Se resta accesa cresce un pochino (nessuna penalità).
    this.tweens.add({ targets: st, size: 1.22, delay: 4000, duration: 3000, ease: 'Sine.easeInOut' });
    sfx.flameAppear();

    if (this.tutorial && !this.hint.visible) this.time.delayedCall(450, () => { if (this.tutorial && !f.dying) this.showHintOn(f.cell.x, f.cell.y); });
    this.maybeSpawnCat();
  }

  private extinguish(f: Flame, auto = false): void {
    if (f.dying) return;
    f.dying = true;
    this.hint.hide();
    this.misses = 0;
    this.lastSuccess = this.time.now;
    if (this.tutorial && !auto) {
      this.tutorial = false;
      save.update({ tutorialDone: true });
    }
    this.truck.spray(f.cell.x, f.cell.y, () => {
      sfx.extinguish();
      f.embers.stop();
      this.tweens.killTweensOf(f.s);
      this.tweens.killTweensOf(f.img);
      this.tweens.add({
        targets: f.s, size: 0, duration: 320, ease: 'Back.easeIn',
        onComplete: () => {
          f.img.destroy();
          f.embers.destroy();
          f.cell.busy = false;
          this.lastFreed = this.cells.indexOf(f.cell);
          this.flames = this.flames.filter((x) => x !== f);
        },
      });
      this.tweens.add({ targets: f.cell.glow, alpha: 0, duration: 400 });
      this.tweens.killTweensOf(f.halo);
      this.tweens.add({ targets: f.halo, alpha: 0, scale: 1, duration: 400, onComplete: () => f.halo.destroy() });
      for (let i = 0; i < 3; i++) {
        const p = this.add.image(f.cell.x + (i - 1) * 40, f.cell.y - 10, 'puff').setDepth(62).setScale(0.3).setAlpha(0.95);
        this.tweens.add({ targets: p, y: p.y - 140 - i * 30, scale: 0.9, alpha: 0, duration: 900 + i * 120, ease: 'Sine.easeOut', onComplete: () => p.destroy() });
      }
      burst(this, f.cell.x, f.cell.y, 'sparkle', { count: 10, tints: [0xffffff, 0xffe066, 0x9ad7ff], scale: [0.7, 0], gravity: 300 });
      this.out++;
      save.update({ flamesOut: save.state.flamesOut + 1 });
      this.fillSlot(f.cell.x, f.cell.y);
      if (this.out >= this.cfg.goal && !this.finishing) this.finishLevel();
    });
  }

  // ---------- Gattino ----------
  private maybeSpawnCat(): void {
    if (!this.cfg.cat || this.catSpawned || this.spawned < Math.ceil(this.cfg.goal / 2)) return;
    const free = this.cells.filter((c) => !c.busy).sort((a, b) => b.row - a.row);
    if (!free.length) return;
    const top = free.filter((c) => c.row === free[0].row);
    const cell = top[Math.floor(Math.random() * top.length)];
    cell.busy = true;
    this.catSpawned = true;
    const img = this.add.image(cell.x, cell.y + 26, 'cat').setDepth(41).setScale(0);
    this.tweens.add({ targets: img, scale: 1, duration: 400, ease: 'Back.easeOut' });
    sfx.meow();
    const meow = this.time.addEvent({
      delay: 2600, loop: true, callback: () => {
        if (!this.cat || this.cat.rescuing) return;
        sfx.meow();
        this.tweens.add({ targets: img, y: img.y - 26, duration: 160, yoyo: true, ease: 'Quad.easeOut' });
      },
    });
    this.cat = { img, cell, rescuing: false, meow };
    if (!save.state.catTutorialDone) this.time.delayedCall(500, () => { if (this.cat && !this.cat.rescuing) this.showHintOn(cell.x, cell.y); });
  }

  private rescueCat(): Promise<void> {
    const c = this.cat;
    if (!c) return Promise.resolve();
    if (c.rescuing) return this.catRescue ?? Promise.resolve();
    c.rescuing = true;
    c.meow.remove();
    this.hint.hide();
    this.lastSuccess = this.time.now;
    save.update({ catTutorialDone: true });
    c.img.setTexture('cat_happy');
    this.catRescue = this.truck.extendLadder(c.cell.x - 30, c.cell.y + 40).then(() => new Promise<void>((resolve) => {
      const bottom = { x: this.truck.ladder.x + 40, y: this.truck.ladder.y - 40 };
      this.tweens.add({
        targets: c.img, x: bottom.x, y: bottom.y, duration: 750, ease: 'Sine.easeIn',
        onComplete: () => {
          this.truck.retractLadder();
          c.cell.busy = false;
          const sx = 610 + this.catsThisLevel * 30;
          const shadow = this.add.image(sx, GROUND_Y + 26, 'shadow').setDepth(54).setScale(0.2, 0.3).setAlpha(0);
          this.tweens.add({ targets: shadow, alpha: 1, scaleX: 0.5, scaleY: 0.5, duration: 420, ease: 'Quad.easeOut' });
          this.tweens.add({
            targets: c.img, x: sx, y: GROUND_Y - 34, scale: 0.75, duration: 420, ease: 'Quad.easeOut',
            onComplete: () => {
              sfx.hearts();
              burst(this, sx, GROUND_Y - 80, 'heart', { count: 8, speed: [150, 350], scale: [0.7, 0.2], gravity: -200, life: 900 });
              c.img.setDepth(55);
              this.tweens.add({ targets: c.img, y: c.img.y - 30, duration: 200, yoyo: true, repeat: 1 });
              // l'ombra si stringe e schiarisce quando il gattino salta
              this.tweens.add({ targets: shadow, scaleX: 0.35, alpha: 0.6, duration: 200, yoyo: true, repeat: 1 });
              this.catsThisLevel++;
              save.update({ catsSaved: save.state.catsSaved + 1 });
              this.cat = null;
              resolve();
            },
          });
        },
      });
    }));
    return this.catRescue;
  }

  // ---------- Input ----------
  private onTap(x: number, y: number): void {
    if (this.finishing) return;
    if (this.cat && !this.cat.rescuing && Phaser.Math.Distance.Between(x, y, this.cat.img.x, this.cat.img.y) < HIT_CAT) {
      void this.rescueCat();
      return;
    }
    let best: Flame | null = null;
    let bestD = HIT_FLAME;
    for (const f of this.flames) {
      if (f.dying) continue;
      const d = Phaser.Math.Distance.Between(x, y, f.cell.x, f.cell.y);
      if (d < bestD) { bestD = d; best = f; }
    }
    if (best) { this.extinguish(best); return; }
    if (this.truck.contains(x, y)) { this.truck.honk(); return; }
    // Tocco a vuoto: l'acqua schizza lo stesso (divertente, mai punitivo).
    if (y < GROUND_Y) this.truck.spray(x, y);
    if (this.flames.some((f) => !f.dying)) {
      this.misses++;
      if (this.misses >= 2) this.hintNearest();
    }
  }

  private showHintOn(x: number, y: number): void {
    this.hint.show(x, y);
  }

  private hintNearest(): void {
    if (this.cat && !this.cat.rescuing && !save.state.catTutorialDone) { this.showHintOn(this.cat.img.x, this.cat.img.y); return; }
    const f = this.flames.filter((x) => !x.dying).sort((a, b) => a.born - b.born)[0];
    if (f) this.showHintOn(f.cell.x, f.cell.y);
  }

  private tick(): void {
    if (this.finishing) return;
    const active = this.flames.filter((f) => !f.dying).length;
    // Mai schermo vuoto: se non ci sono fiamme ne arriva subito una.
    if (active === 0 && this.time.now > this.lastSuccess + 600) this.spawnFlame();
    if (!this.hint.visible && this.time.now - this.lastSuccess > IDLE_HINT_MS) this.hintNearest();
  }

  // ---------- Fine livello ----------
  private async finishLevel(): Promise<void> {
    this.finishing = true;
    this.hint.hide();
    // Le fiamme rimaste (se ce ne sono) le spegne il camion da solo; il gattino viene salvato comunque.
    const left = this.flames.filter((f) => !f.dying);
    left.forEach((f, i) => this.time.delayedCall(250 + i * 300, () => this.extinguish(f, true)));
    if (this.cat) await this.rescueCat();
    await new Promise<void>((r) => this.time.delayedCall(500 + left.length * 300, () => r()));

    const before = save.state.levelsDone;
    const after = before + 1;
    save.update({ levelsDone: after });
    void save.flush();
    const unlocked = newlyUnlocked(before, after).map((x) => x.id);

    sfx.fanfare();
    this.truck.honk();
    const rays = this.add.image(960, 480, 'rays').setDepth(940).setScale(0).setAlpha(0.8);
    this.tweens.add({ targets: rays, scale: 1.4, duration: 500, ease: 'Back.easeOut' });
    this.tweens.add({ targets: rays, alpha: 0.5, duration: 900, yoyo: true, repeat: -1 });
    const star = this.add.image(960, 460, 'big_star').setDepth(945).setScale(0);
    this.tweens.add({ targets: star, scale: 1, duration: 700, ease: 'Back.easeOut' });
    const txt = title3d(this, 960, 700, t('pompieri.bravo'), 120).setScale(0).setDepth(950);
    this.tweens.add({ targets: txt, scale: 1, duration: 450, delay: 300, ease: 'Back.easeOut' });
    for (let i = 0; i < 3; i++) {
      this.time.delayedCall(i * 250, () => burst(this, 560 + i * 400, 300, 'confetti', {
        count: 26, tints: [0xff5e5e, 0xffd23f, 0x3cc46a, 0x4fa3ff, 0xff6fb5], speed: [300, 800], scale: [1.4, 0.6], life: 1400, gravity: 900, depth: 960,
      }));
    }
    this.time.delayedCall(2300, () => goTo(this, 'pompieri:Reward', { level: before, unlocked }));
  }
}
