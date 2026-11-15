import Phaser from 'phaser';
import { setupView, button, pin, burst, view, pulse } from '../../../core/ui';
import { t } from '../../../core/i18n';
import { urlParam } from '../../../core/platform';
import { muteButton, title3d, goTo } from '../../../core/hud';
import {
  recipeById, unlocked, nextCustomer, mixProgress, clampToEllipse, placeInArea, randomInArea, canServe,
  addCreation, rewardFor, colorHex, MAX_TOPPINGS, type Recipe, type IngredientId, type ToppingId, type ColorId,
} from '../recipes';
import { INGREDIENT_TINT } from '../art';
import { drawKitchen, Dessert, Customer, DragManager, Hint, previewCreation, COUNTER_Y, hex, type DragItem } from '../world';
import { save } from '../save';
import { sfx } from '../sfx';

type Step = 'intro' | 'ingredients' | 'mix' | 'bake' | 'decorate' | 'serve';

const BOWL = { x: 960, y: 690 };
const BATTER = { x: 960, y: 628, rx: 150, ry: 34 };
const ING_X = [250, 500, 1420, 1670];
const OVEN = { x: 1420, scale: 0.92 };
const BAKE_MS = 3600;
const IDLE_HINT_MS = 5000;
const MOLD_Y = COUNTER_Y + 14;

/** Una partita: un dolce dall'inizio (cliente che ordina) alla fine (cliente che mangia). */
export class Game extends Phaser.Scene {
  private recipe!: Recipe;
  private step: Step = 'intro';
  private drag!: DragManager;
  private hint!: Hint;
  private customer!: Customer;
  private badges: { bg: Phaser.GameObjects.Image; icon: Phaser.GameObjects.Image[]; star: Phaser.GameObjects.Image }[] = [];
  private lastAction = 0;
  private tutorial = false;
  private busy = false;

  // ingredienti e ciotola
  private bowlParts: Phaser.GameObjects.GameObject[] = [];
  private batter!: Phaser.GameObjects.Image;
  private batterHl!: Phaser.GameObjects.Image;
  private swirl!: Phaser.GameObjects.Image;
  private lumps: Phaser.GameObjects.Image[] = [];
  private added = 0;
  // mescolare
  private whisk!: Phaser.GameObjects.Image;
  private mixing = false;
  private mixDist = 0;
  private lastStir = 0;
  private lastP = { x: 0, y: 0 };
  // forno
  private mold!: Phaser.GameObjects.Image;
  private oven!: Phaser.GameObjects.Image;
  private door!: Phaser.GameObjects.Image;
  private ovenGlow!: Phaser.GameObjects.Image;
  // decorazioni
  private dessert!: Dessert;
  private trays: Phaser.GameObjects.GameObject[] = [];
  private serveBtn: Phaser.GameObjects.Image | null = null;

  constructor() { super('pasticceria:Game'); }

  create(data: { recipe?: string }): void {
    this.recipe = recipeById(data?.recipe ?? save.state.recipe);
    save.update({ recipe: this.recipe.id });
    this.step = 'intro';
    this.badges = [];
    this.bowlParts = [];
    this.lumps = [];
    this.trays = [];
    this.serveBtn = null;
    this.added = 0;
    this.mixDist = 0;
    this.mixing = false;
    this.busy = false;
    this.tutorial = !save.state.tutorialDone;

    setupView(this, (v) => this.badges.forEach((b, i) => {
      const y = v.top + 78;
      b.bg.y = y; b.star.y = y + 34;
      b.icon.forEach((o) => { o.y = y + ((o.getData('dy') as number) ?? 0); });
      void i;
    }));
    this.cameras.main.fadeIn(250, 143, 211, 255);
    drawKitchen(this);
    this.hint = new Hint(this);
    this.drag = new DragManager(this, {
      onDrop: (it, x, y) => this.onDrop(it, x, y),
      onTap: (it) => this.onTapItem(it),
      onPick: () => { sfx.pick(); this.hint.hide(); },
    });
    this.buildBadges();
    const home = button(this, 0, 0, 'btn_home', () => goTo(this, 'pasticceria:Menu'), 0.85);
    pin(this, home, 'tl', 80, 80);
    muteButton(this);

    this.input.on('pointerdown', (p: Phaser.Input.Pointer, over: Phaser.GameObjects.GameObject[]) => { if (!over.length) this.onDown(p); });
    this.input.on('pointermove', (p: Phaser.Input.Pointer) => this.onMove(p));
    this.input.on('pointerup', () => this.onUp());
    this.time.addEvent({ delay: 500, loop: true, callback: () => this.idleCheck() });

    if (urlParam('debug')) (window as unknown as { __pa: Game }).__pa = this;
    this.intro();
  }

  // =================================================================
  // Indicatore dei 4 passi
  // =================================================================
  private buildBadges(): void {
    const icons: [string, number, number][] = [['pa_bowl', 0.2, 6], ['pa_whisk', 0.3, 0], [this.recipe.cold ? 'pa_freezer' : 'pa_oven', 0.15, 0], ['pa_bag', 0.38, 0]];
    const top = view(this).top + 78;
    icons.forEach(([k, s, dy], i) => {
      const x = 960 + (i - 1.5) * 150;
      const bg = this.add.image(x, top, 'pa_badge').setScale(0.78).setDepth(900);
      const ic: Phaser.GameObjects.Image[] = [this.add.image(x, top + dy, k).setScale(s).setDepth(901).setData('dy', dy)];
      if (k === 'pa_bag') {
        ic[0].setTint(hex(colorHex('pink')));
        ic.push(this.add.image(x, top, 'pa_bag_tip').setScale(s).setDepth(902).setData('dy', 0));
      }
      const star = this.add.image(x + 40, top + 34, 'star').setScale(0).setDepth(903);
      this.badges.push({ bg, icon: ic, star });
    });
  }

  private badgeDone(i: number): void {
    const b = this.badges[i];
    if (!b) return;
    sfx.fanfare();
    this.tweens.add({ targets: b.star, scale: 0.5, duration: 400, ease: 'Back.easeOut' });
    burst(this, b.bg.x, b.bg.y, 'sparkle', { count: 10, tints: [0xffffff, 0xffe066], gravity: 0, life: 600, depth: 950 });
  }

  private badgeActive(i: number): void {
    this.badges.forEach((b, j) => {
      this.tweens.killTweensOf(b.bg);
      b.bg.setScale(0.78);
      if (j === i) this.tweens.add({ targets: b.bg, scale: 0.9, duration: 500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    });
  }

  // =================================================================
  // 0. Il cliente arriva e ordina
  // =================================================================
  private intro(): void {
    const id = nextCustomer(save.state.customer || null);
    save.update({ customer: id });
    this.customer = new Customer(this, id, 1560);
    this.customer.enter(1560, () => {
      sfx.hello();
      this.customer.jump();
      const bubble = this.add.image(1200, 330, 'pa_bubble').setDepth(60).setScale(0);
      const want = new Dessert(this, 1205, 330, previewCreation(this.recipe), { plate: false, depth: 61 });
      want.c.setScale(0);
      const s = this.recipe.id === 'cookie' ? 0.4 : 0.33;
      this.tweens.add({ targets: bubble, scale: 1, duration: 350, ease: 'Back.easeOut' });
      this.tweens.add({ targets: want.c, scale: s, duration: 350, delay: 120, ease: 'Back.easeOut' });
      this.time.delayedCall(2300, () => {
        this.tweens.add({ targets: [bubble, want.c], scale: 0, duration: 250, onComplete: () => { bubble.destroy(); want.c.destroy(); } });
        this.customer.leave();
        this.startIngredients();
      });
    });
  }

  // =================================================================
  // 1. Ingredienti nella ciotola
  // =================================================================
  private startIngredients(): void {
    this.step = 'ingredients';
    this.badgeActive(0);
    const sh = this.add.image(BOWL.x, COUNTER_Y + 8, 'shadow').setScale(2.3, 0.6).setDepth(29).setAlpha(0.8);
    const bin = this.add.image(BOWL.x, BOWL.y, 'pa_bowl_in').setDepth(30);
    this.batter = this.add.image(BATTER.x, BATTER.y, 'pa_batter').setDepth(31).setAlpha(0).setScale(0.4).setTint(0xf2ead8);
    this.swirl = this.add.image(BATTER.x, BATTER.y, 'pa_swirl').setDepth(32).setAlpha(0).setScale(0.85);
    this.batterHl = this.add.image(BATTER.x, BATTER.y, 'pa_batter_hl').setDepth(33).setAlpha(0).setScale(0.4);
    const front = this.add.image(BOWL.x, BOWL.y, 'pa_bowl').setDepth(36);
    this.bowlParts = [sh, bin, this.batter, this.swirl, this.batterHl, front];
    for (const o of [bin, front]) {
      o.y -= 500;
      this.tweens.add({ targets: o, y: BOWL.y, duration: 500, ease: 'Bounce.easeOut' });
    }

    this.recipe.ingredients.forEach((ing, i) => {
      const x = ING_X[i];
      const shadow = this.add.image(x, COUNTER_Y + 10, 'shadow').setScale(1.1, 0.45).setDepth(39).setAlpha(0.8);
      const img = this.add.image(x, COUNTER_Y + 12, `pa_ing_${ing}`).setOrigin(0.5, 1).setDepth(40).setScale(0);
      this.tweens.add({ targets: img, scale: 0.92, duration: 380, delay: 300 + i * 140, ease: 'Back.easeOut', onComplete: () => this.drag.add(img, ing, shadow) });
    });
    this.lastAction = this.time.now;
    if (this.tutorial) this.time.delayedCall(1100, () => this.showHint());
  }

  private addIngredient(it: DragItem): void {
    it.enabled = false;
    this.drag.items = this.drag.items.filter((x) => x !== it);
    this.lastAction = this.time.now;
    this.hint.hide();
    const ing = it.id as IngredientId;
    it.obj.setDepth(34);
    this.tweens.add({
      targets: it.obj, x: BOWL.x, y: BATTER.y + 60, scale: 0.35, duration: 300, ease: 'Quad.easeIn',
      onComplete: () => {
        it.obj.destroy();
        it.shadow?.destroy();
        sfx.plop();
        burst(this, BOWL.x, BATTER.y, 'dot', { count: 14, tints: [INGREDIENT_TINT[ing], 0xffffff], speed: [200, 420], scale: [0.7, 0.1], gravity: 900, life: 600, depth: 37 });
        this.added++;
        const k = this.added / this.recipe.ingredients.length;
        this.batter.setAlpha(1);
        this.tweens.add({ targets: [this.batter, this.batterHl], scale: 0.5 + 0.5 * k, duration: 300, ease: 'Back.easeOut' });
        this.batterHl.setAlpha(0.6);
        for (let j = 0; j < 3; j++) {
          const p = randomInArea({ x: BATTER.x, y: BATTER.y, rx: BATTER.rx * (0.5 + 0.5 * k), ry: BATTER.ry * (0.5 + 0.5 * k) });
          this.lumps.push(this.add.image(p.x, p.y, 'pa_lump').setDepth(32.5).setTint(INGREDIENT_TINT[ing]).setScale(0.8 + Math.random() * 0.5));
        }
        if (this.added >= this.recipe.ingredients.length) {
          this.badgeDone(0);
          this.time.delayedCall(700, () => this.startMix());
        }
      },
    });
  }

  // =================================================================
  // 2. Mescolare con la frusta
  // =================================================================
  private startMix(): void {
    this.step = 'mix';
    this.badgeActive(1);
    this.swirl.setTint(hex(this.recipe.batter)).setAlpha(0.7);
    this.whisk = this.add.image(1260, 300, 'pa_whisk').setOrigin(0.5, 0.88).setDepth(35).setAngle(22);
    this.tweens.add({ targets: this.whisk, x: BATTER.x + 110, y: BATTER.y + 10, duration: 500, ease: 'Back.easeOut' });
    this.lastAction = this.time.now;
    if (this.tutorial) this.time.delayedCall(600, () => this.showHint());
  }

  private onDown(p: Phaser.Input.Pointer): void {
    if (this.step === 'mix' && !this.busy && Phaser.Math.Distance.Between(p.worldX, p.worldY, BOWL.x, BATTER.y) < 520) {
      this.mixing = true;
      this.lastP = { x: p.worldX, y: p.worldY };
      this.hint.hide();
      this.whisk.setAngle(0);
      this.stirTo(p.worldX, p.worldY);
    } else if (this.step === 'bake' && this.oven && this.busy && Phaser.Math.Distance.Between(p.worldX, p.worldY, OVEN.x, COUNTER_Y - 250) < 280) {
      // durante la cottura il forno si può toccare: ballonzola e brilla
      sfx.bubble();
      this.tweens.add({ targets: this.oven, scaleY: OVEN.scale * 1.04, scaleX: OVEN.scale * 0.97, duration: 90, yoyo: true });
      burst(this, OVEN.x - 20, COUNTER_Y - 290, 'sparkle', { count: 6, tints: [0xffffff, 0xffe066], gravity: 0, life: 500, depth: 60 });
    }
  }

  private onMove(p: Phaser.Input.Pointer): void {
    if (!this.mixing || !p.isDown || this.step !== 'mix') return;
    const d = Math.min(120, Phaser.Math.Distance.Between(p.worldX, p.worldY, this.lastP.x, this.lastP.y));
    this.lastP = { x: p.worldX, y: p.worldY };
    this.stirTo(p.worldX, p.worldY);
    this.addMix(d);
  }

  private onUp(): void { this.mixing = false; }

  private stirTo(x: number, y: number): void {
    const c = clampToEllipse(x, y, BATTER.x, BATTER.y + 14, BATTER.rx - 20, BATTER.ry);
    this.whisk.setPosition(c.x, c.y);
  }

  private addMix(d: number): void {
    if (this.busy) return;
    this.mixDist += d;
    this.lastAction = this.time.now;
    const k = mixProgress(this.mixDist);
    this.lumps.forEach((l) => l.setAlpha(Math.max(0, 1 - k * 1.4)));
    this.swirl.setAlpha(0.25 + 0.5 * Math.abs(Math.sin(this.mixDist / 300)) * (1 - k * 0.6)).setScale(0.85 + 0.08 * Math.sin(this.mixDist / 200), 0.85);
    const a = Phaser.Display.Color.ValueToColor(0xf2ead8), b = Phaser.Display.Color.ValueToColor(hex(this.recipe.batter));
    const mixed = Phaser.Display.Color.Interpolate.ColorWithColor(a, b, 100, Math.round(k * 100));
    this.batter.setTint(Phaser.Display.Color.GetColor(mixed.r, mixed.g, mixed.b));
    if (this.mixDist - this.lastStir > 260) {
      this.lastStir = this.mixDist;
      sfx.stir();
      if (Math.random() < 0.5) burst(this, this.whisk.x, this.whisk.y - 10, 'dot', { count: 3, tints: [hex(this.recipe.batter)], speed: [120, 260], scale: [0.5, 0.1], gravity: 900, life: 500, depth: 37 });
    }
    if (k >= 1) this.finishMix();
  }

  private finishMix(): void {
    this.busy = true;
    this.mixing = false;
    this.lumps.forEach((l) => l.destroy());
    this.lumps = [];
    sfx.smooth();
    this.tweens.add({ targets: this.swirl, alpha: 0, duration: 300 });
    this.batterHl.setAlpha(0.9);
    burst(this, BATTER.x, BATTER.y, 'sparkle', { count: 16, tints: [0xffffff, 0xffe066, 0xffb3d9], gravity: 0, speed: [150, 400], life: 800, depth: 60 });
    this.tweens.add({ targets: this.whisk, x: 1500, y: -200, duration: 500, ease: 'Back.easeIn', onComplete: () => this.whisk.destroy() });
    this.badgeDone(1);
    this.time.delayedCall(800, () => { this.busy = false; this.startBake(); });
  }

  // =================================================================
  // 3. Nel forno (o nel freezer per il gelato)
  // =================================================================
  private startBake(): void {
    this.step = 'bake';
    this.badgeActive(2);
    this.tweens.add({
      targets: this.bowlParts, x: '-=1300', duration: 600, ease: 'Back.easeIn',
      onComplete: () => this.bowlParts.forEach((o) => o.destroy()),
    });
    const sh = this.add.image(600, COUNTER_Y + 10, 'shadow').setScale(1.6, 0.5).setDepth(39).setAlpha(0.8);
    this.mold = this.add.image(600, MOLD_Y, `pa_mold_${this.recipe.id}_raw`).setOrigin(0.5, 0.95).setDepth(40).setScale(0);
    this.tweens.add({
      targets: this.mold, scale: 1, duration: 400, delay: 450, ease: 'Back.easeOut',
      onComplete: () => { sfx.plop(); this.drag.add(this.mold, 'mold', sh); },
    });

    const k = this.recipe.cold ? 'pa_freezer' : 'pa_oven';
    const dx = 20 * OVEN.scale;
    this.oven = this.add.image(2500, COUNTER_Y + 18, k).setOrigin(0.5, 1).setScale(OVEN.scale).setDepth(30);
    this.ovenGlow = this.add.image(2500 - dx, this.cavity().y, 'glow').setDepth(31.5).setScale(2.6, 1.7).setAlpha(0)
      .setTint(this.recipe.cold ? 0x8fe8ff : 0xff9a3c).setBlendMode(Phaser.BlendModes.ADD);
    this.door = this.add.image(2500 - dx, COUNTER_Y + 18 - 122 * OVEN.scale, `${k}_door`).setOrigin(0.5, 1).setScale(OVEN.scale, OVEN.scale * 0.12).setDepth(33);
    this.tweens.add({ targets: this.oven, x: OVEN.x, duration: 700, ease: 'Cubic.easeOut' });
    this.tweens.add({ targets: [this.door, this.ovenGlow], x: OVEN.x - dx, duration: 700, ease: 'Cubic.easeOut' });
    this.time.delayedCall(720, () => sfx.doorOpen());
    this.lastAction = this.time.now;
    if (this.tutorial) this.time.delayedCall(1200, () => this.showHint());
  }

  /** Centro dell'interno del forno. */
  private cavity(): { x: number; y: number } {
    return { x: OVEN.x - 20 * OVEN.scale, y: COUNTER_Y + 18 - 248 * OVEN.scale };
  }

  private intoOven(it: DragItem): void {
    it.enabled = false;
    this.drag.items = [];
    it.shadow?.destroy();
    this.busy = true;
    this.hint.hide();
    const c = this.cavity();
    this.mold.setDepth(31);
    this.tweens.add({
      targets: this.mold, x: c.x, y: c.y + 90, scale: 0.72, duration: 350, ease: 'Quad.easeOut',
      onComplete: () => {
        sfx.doorClose();
        this.tweens.add({ targets: this.door, scaleY: OVEN.scale, duration: 300, ease: 'Back.easeOut' });
        this.tweens.add({ targets: this.ovenGlow, alpha: 0.75, duration: 500 });
        this.tweens.add({ targets: this.ovenGlow, scaleX: 2.9, duration: 400, yoyo: true, repeat: -1, delay: 500 });
        this.bakeTimer();
      },
    });
  }

  private bakeTimer(): void {
    const tx = OVEN.x - 360, ty = 330;
    const dial = this.add.circle(tx, ty, 66, 0xffffff).setDepth(60).setStrokeStyle(8, 0xe57aab);
    const arc = this.add.graphics().setDepth(61);
    const icon = this.add.image(tx, ty, this.recipe.cold ? 'sparkle' : 'glow').setDepth(62).setScale(this.recipe.cold ? 0.8 : 0.45)
      .setTint(this.recipe.cold ? 0x6fd0f5 : 0xff9a3c);
    const st = { k: 0 };
    let ticks = 0;
    this.tweens.add({
      targets: st, k: 1, duration: BAKE_MS,
      onUpdate: () => {
        arc.clear().fillStyle(this.recipe.cold ? 0x8fe3ff : 0xffb347, 1).slice(tx, ty, 54, -Math.PI / 2, -Math.PI / 2 + st.k * Math.PI * 2, false).fillPath();
        const n = Math.floor(st.k * 12);
        if (n > ticks) { ticks = n; sfx.tick(); if (n % 3 === 0) (this.recipe.cold ? sfx.freeze : sfx.bubble)(); }
        if (st.k > 0.55 && this.mold.texture.key.endsWith('_raw')) this.mold.setTexture(`pa_mold_${this.recipe.id}_done`);
      },
      onComplete: () => {
        sfx.ding();
        this.tweens.add({ targets: [dial, arc, icon], scale: 0, alpha: 0, duration: 250, onComplete: () => { dial.destroy(); arc.destroy(); icon.destroy(); } });
        this.outOfOven();
      },
    });
    this.tweens.add({ targets: this.oven, x: OVEN.x + 4, duration: 70, yoyo: true, repeat: 8, delay: 400 });
  }

  private outOfOven(): void {
    sfx.doorOpen();
    this.tweens.killTweensOf(this.ovenGlow);
    this.tweens.add({ targets: this.ovenGlow, alpha: 0, duration: 300 });
    this.tweens.add({ targets: this.door, scaleY: OVEN.scale * 0.12, duration: 300, ease: 'Quad.easeIn' });
    this.time.delayedCall(250, () => {
      this.mold.setDepth(40);
      this.tweens.add({
        targets: this.mold, x: 760, y: MOLD_Y, scale: 1, duration: 600, ease: 'Back.easeOut',
        onComplete: () => {
          if (this.recipe.cold) burst(this, 760, MOLD_Y - 120, 'sparkle', { count: 14, tints: [0xffffff, 0xbdf0ff], gravity: -100, life: 900, depth: 60 });
          else burst(this, 760, MOLD_Y - 100, 'pa_steam', { count: 8, speed: [40, 120], gravity: -300, scale: [0.9, 1.6], life: 1200, depth: 60 });
          this.badgeDone(2);
          this.time.delayedCall(900, () => { this.busy = false; this.startDecorate(); });
        },
      });
    });
  }

  // =================================================================
  // 4. Decorare: glassa (tocco sul sac à poche) e decorazioni (trascinamento)
  // =================================================================
  private startDecorate(): void {
    this.step = 'decorate';
    this.badgeActive(3);
    this.tweens.add({ targets: [this.oven, this.door, this.ovenGlow], x: '+=1200', duration: 600, ease: 'Cubic.easeIn' });
    this.tweens.add({ targets: this.mold, scale: 1.3, alpha: 0, duration: 350, onComplete: () => this.mold.destroy() });
    const cy = COUNTER_Y + 10 - this.recipe.plateDy;
    this.dessert = new Dessert(this, 960, cy, { r: this.recipe.id, c: null, t: [] }, { depth: 50 });
    this.dessert.c.setScale(0);
    sfx.magic();
    this.tweens.add({ targets: this.dessert.c, scale: 1, duration: 500, ease: 'Back.easeOut' });
    burst(this, 960, cy - 60, 'sparkle', { count: 22, tints: [0xffffff, 0xffe066, 0xffb3d9], gravity: 0, speed: [200, 600], life: 900, depth: 60 });

    const un = unlocked(save.state.served);
    this.trays.push(this.tray(70, 400, 470, 460));
    this.trays.push(this.tray(1370, 400, 500, 460));
    // sac à poche: un tocco mette la glassa
    un.colors.forEach((col, i) => {
      const x = 170 + (i % 3) * 140, y = 520 + Math.floor(i / 3) * 220;
      const bag = this.add.image(x, y + 400, 'pa_bag').setTint(hex(colorHex(col))).setScale(0.8).setDepth(41);
      const tip = this.add.image(x, y + 400, 'pa_bag_tip').setScale(0.8).setDepth(42);
      this.trays.push(bag, tip);
      this.tweens.add({ targets: [bag, tip], y, duration: 450, delay: 200 + i * 70, ease: 'Back.easeOut' });
      bag.setInteractive({ useHandCursor: true }).setData('color', col);
      bag.on('pointerdown', () => this.frost(bag, tip, col));
    });
    // decorazioni: si trascinano sul dolce (o si toccano)
    un.toppings.forEach((id, i) => {
      const x = 1450 + (i % 4) * 116, y = 500 + Math.floor(i / 4) * 170;
      const sh = this.add.image(x, y + 46, 'shadow').setScale(0.5, 0.25).setDepth(40).setAlpha(0.8);
      const img = this.add.image(x, y + 400, `pa_top_${id}`).setScale(1.15).setDepth(41);
      this.trays.push(sh, img);
      this.tweens.add({
        targets: img, y, duration: 450, delay: 300 + i * 70, ease: 'Back.easeOut',
        onComplete: () => this.drag.add(img, id, sh),
      });
    });
    this.lastAction = this.time.now;
    if (this.tutorial) this.time.delayedCall(1300, () => this.showHint());
  }

  /** Vassoio 2.5D (piano chiaro, spessore, ombra). */
  private tray(x: number, y: number, w: number, h: number): Phaser.GameObjects.Graphics {
    const g = this.add.graphics().setDepth(38);
    g.fillStyle(0x3a2a52, 0.18).fillRoundedRect(x + 10, y + 16, w, h, 34);
    g.fillStyle(0xe7a9c2, 1).fillRoundedRect(x, y + 10, w, h, 34);
    g.fillGradientStyle(0xfffafc, 0xfffafc, 0xffe3ee, 0xffe3ee, 1).fillRoundedRect(x, y, w, h, 34);
    g.lineStyle(4, 0xffffff, 0.9).strokeRoundedRect(x + 6, y + 6, w - 12, h - 12, 28);
    g.setAlpha(0);
    this.tweens.add({ targets: g, alpha: 1, duration: 300 });
    return g;
  }

  private frost(bag: Phaser.GameObjects.Image, tip: Phaser.GameObjects.Image, col: ColorId): void {
    if (this.busy || this.step !== 'decorate') return;
    this.busy = true;
    this.hint.hide();
    this.lastAction = this.time.now;
    const hx = bag.x, hy = bag.y;
    const top = this.dessert.c.y + this.recipe.frostDy - 140;
    bag.setDepth(1300); tip.setDepth(1301);
    this.tweens.add({
      targets: [bag, tip], x: 960, y: top, duration: 320, ease: 'Quad.easeOut',
      onComplete: () => {
        sfx.squeeze();
        this.tweens.add({ targets: [bag, tip], scaleY: 0.68, scaleX: 0.86, duration: 160, yoyo: true, repeat: 1 });
        this.time.delayedCall(180, () => {
          this.dessert.setColor(col);
          burst(this, 960, top + 160, 'dot', { count: 10, tints: [hex(colorHex(col))], speed: [150, 350], scale: [0.6, 0.1], gravity: 700, life: 500, depth: 60 });
        });
        this.time.delayedCall(650, () => {
          this.tweens.add({ targets: [bag, tip], x: hx, y: hy, duration: 350, ease: 'Back.easeOut', onComplete: () => { bag.setDepth(41); tip.setDepth(42); this.busy = false; } });
          this.checkServe();
        });
      },
    });
  }

  private putTopping(id: ToppingId, local: { x: number; y: number }): void {
    if (this.dessert.toppingCount >= MAX_TOPPINGS) { sfx.nope(); return; }
    this.dessert.addTopping(id, local.x, local.y);
    sfx.topping();
    const wx = this.dessert.c.x + local.x, wy = this.dessert.c.y + local.y;
    burst(this, wx, wy, 'sparkle', { count: 6, tints: [0xffffff, 0xffe066], gravity: 0, speed: [80, 220], scale: [0.5, 0], life: 450, depth: 60 });
    this.lastAction = this.time.now;
    this.checkServe();
  }

  private checkServe(): void {
    if (this.serveBtn || !canServe(this.dessert.frosted, this.dessert.toppingCount)) return;
    this.serveBtn = button(this, 1620, 960, 'pa_btn_serve', () => this.serve(), 0.75).setScale(0);
    this.tweens.add({ targets: this.serveBtn, scale: 0.75, duration: 400, ease: 'Back.easeOut', onComplete: () => this.serveBtn && pulse(this, this.serveBtn) });
  }

  // =================================================================
  // Trascinamenti (ingredienti, teglia, decorazioni)
  // =================================================================
  private onDrop(it: DragItem, x: number, y: number): boolean {
    if (this.busy) return false;
    if (this.step === 'ingredients') {
      if (Phaser.Math.Distance.Between(x, y, BOWL.x, BOWL.y - 60) < 330) { this.addIngredient(it); return true; }
    } else if (this.step === 'bake') {
      const c = this.cavity();
      if (Phaser.Math.Distance.Between(x, y, c.x, c.y) < 320) { this.intoOven(it); return true; }
    } else if (this.step === 'decorate') {
      const a = this.recipe.area;
      const l = this.dessert.toLocal(x, y);
      const big = { ...a, rx: a.rx * 1.9 + 60, ry: a.ry * 1.9 + 90 };
      if (((l.x - big.x) / big.rx) ** 2 + ((l.y - big.y) / big.ry) ** 2 <= 1) {
        this.putTopping(it.id as ToppingId, placeInArea(a, l.x, l.y));
        this.drag.home(it, true);
        it.obj.setAlpha(0);
        this.tweens.add({ targets: it.obj, alpha: 1, duration: 300 });
        return true;
      }
    }
    sfx.back();
    return false;
  }

  private onTapItem(it: DragItem): void {
    if (this.busy) return;
    if (this.step === 'ingredients') this.addIngredient(it);
    else if (this.step === 'bake') this.intoOven(it);
    else if (this.step === 'decorate') this.putTopping(it.id as ToppingId, randomInArea(this.recipe.area));
  }

  // =================================================================
  // 5. Il cliente torna e mangia
  // =================================================================
  private serve(): void {
    if (this.step !== 'decorate' || this.busy) return;
    this.step = 'serve';
    this.busy = true;
    this.hint.hide();
    this.drag.clear();
    this.badgeDone(3);
    this.serveBtn?.destroy();
    this.tweens.add({ targets: this.trays, alpha: 0, y: '+=200', duration: 400, onComplete: () => this.trays.forEach((o) => o.destroy()) });
    const creation = this.dessert.creation;
    const served = save.state.served + 1;
    save.update({ served, creations: addCreation(save.state.creations, creation), tutorialDone: true });

    const eatX = 1180;
    this.customer.enter(1600, () => {
      sfx.hello();
      this.customer.jump();
      this.tweens.add({
        targets: this.dessert.c, x: eatX, duration: 600, ease: 'Cubic.easeInOut',
        onComplete: () => this.chomp(0, eatX, served),
      });
    });
  }

  private chomp(n: number, x: number, served: number): void {
    const d = this.dessert.c;
    if (n >= 3) {
      d.destroy();
      this.customer.face('happy');
      this.customer.jump();
      sfx.yum();
      burst(this, 1600, 420, 'heart', { count: 12, speed: [250, 550], scale: [0.9, 0.3], gravity: 300, life: 1300, depth: 70 });
      const lbl = title3d(this, 1250, 300, t('pasticceria.yum'), 120).setScale(0);
      this.tweens.add({ targets: lbl, scale: 1, duration: 350, ease: 'Back.easeOut' });
      this.time.delayedCall(1800, () => goTo(this, 'pasticceria:Reward', { creation: this.dessert.creation, reward: rewardFor(served), served }));
      return;
    }
    this.customer.face('eat');
    this.tweens.add({
      targets: this.customer.img, x: 1500, duration: 220, yoyo: true, ease: 'Quad.easeOut',
      onYoyo: () => {
        sfx.chomp();
        burst(this, x + 80, d.y - 60, 'pa_crumb', { count: 10, tints: [0xffffff, hex(colorHex(this.dessert.creation.c ?? 'vanilla'))], speed: [200, 450], scale: [1.2, 0.4], gravity: 1200, life: 800, depth: 70 });
        this.tweens.add({ targets: d, scale: d.scale * 0.68, duration: 150, ease: 'Quad.easeOut' });
      },
      onComplete: () => {
        this.customer.face('idle');
        this.time.delayedCall(260, () => this.chomp(n + 1, x, served));
      },
    });
  }

  // =================================================================
  // Manina d'aiuto: subito al primo dolce, poi dopo qualche secondo senza azioni
  // =================================================================
  private idleCheck(): void {
    if (this.busy || this.hint.visible || this.drag.dragging || this.mixing) return;
    if (this.time.now - this.lastAction > IDLE_HINT_MS) this.showHint();
  }

  private showHint(): void {
    if (this.busy || this.drag.dragging || this.mixing) return;
    const live = this.drag.items.filter((i) => i.enabled);
    if (this.step === 'ingredients' && live[0]) {
      this.hint.drag(live[0].obj.x, live[0].obj.y - 100, BOWL.x, BOWL.y - 80);
    } else if (this.step === 'mix') {
      this.hint.circle(BATTER.x, BATTER.y + 20, 120, 40);
    } else if (this.step === 'bake' && live[0]) {
      const c = this.cavity();
      this.hint.drag(live[0].obj.x, live[0].obj.y - 90, c.x, c.y);
    } else if (this.step === 'decorate') {
      const bag = this.trays.find((o) => o instanceof Phaser.GameObjects.Image && o.texture.key === 'pa_bag') as Phaser.GameObjects.Image | undefined;
      if (!this.dessert.frosted && bag) this.hint.tap(bag.x, bag.y);
      else if (live[0]) {
        const a = this.recipe.area;
        this.hint.drag(live[0].obj.x, live[0].obj.y, this.dessert.c.x + a.x, this.dessert.c.y + a.y);
      }
    }
    this.lastAction = this.time.now;
  }

  // =================================================================
  // Solo test automatici (?debug=1): esegue l'azione del passo corrente
  // =================================================================
  autoStep(): string {
    if (this.busy) return `${this.step} (attendi)`;
    const live = this.drag.items.filter((i) => i.enabled);
    if (this.step === 'ingredients' && live[0]) this.addIngredient(live[0]);
    else if (this.step === 'mix') this.addMix(3000);
    else if (this.step === 'bake' && live[0]) this.intoOven(live[0]);
    else if (this.step === 'decorate') {
      if (!this.dessert.frosted) {
        const bag = this.trays.find((o) => o instanceof Phaser.GameObjects.Image && o.texture.key === 'pa_bag') as Phaser.GameObjects.Image;
        bag.emit('pointerdown');
      } else if (this.dessert.toppingCount < 3) live.slice(0, 3).forEach((it) => this.onTapItem(it));
      else this.serve();
    }
    return this.step;
  }
}
