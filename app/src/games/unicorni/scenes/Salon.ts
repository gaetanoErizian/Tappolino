import Phaser from 'phaser';
import { setupView, button, pin, burst, view, pulse } from '../../../core/ui';
import { urlParam } from '../../../core/platform';
import { muteButton, goTo } from '../../../core/hud';
import { Hint } from '../../../core/drag';
import { sound } from '../../../core/sound';
import {
  nextUnicorn, unlocked, rubProgress, rewardFor, addPhoto, isUnicornId, canPhoto, colorHex, RUB_GOAL,
  type AccessoryId, type ColorId, type Step, type UnicornId,
} from '../salon';
import { ScratchLayer, maskFromTexture } from '../scratch';
import { U } from '../art';
import { drawSalon, UnicornView, dullMane, hex, FLOOR_Y } from '../world';
import { save } from '../save';
import { sfx, playUnicorniMusic } from '../sfx';

type Phase = 'intro' | Step | 'photo';

const UNI_X = 930;
const DOCK = { x: 280, y: 740 };
const SHOWER_DOCK = { x: 1330, y: 250 };
const IDLE_HINT_MS = 5000;
const POT_X = [1500, 1660, 1820];
const POT_Y = [560, 770];
const POT_S = 1.2;
const TRAY_ITEMS = [[180, 530], [370, 530], [180, 740], [370, 740], [1550, 530], [1740, 530], [1550, 740], [1740, 740]];
/** Maschere (celle del bersaglio) calcolate una volta sola dalle texture. */
const MASKS = new Map<string, Uint8Array | null>();

/**
 * Una visita al salone: l'unicorno arriva sporco e spettinato → schiuma (strofinare con la spugna) →
 * risciacquo (strofinare sotto la doccetta) → spazzola sulla criniera → colore (tocco sul barattolo, poi strofinare)
 * → accessori (tocchi) → foto ricordo.
 */
export class Salon extends Phaser.Scene {
  private uni!: UnicornView;
  private phase: Phase = 'intro';
  private busy = false;
  private tutorial = false;
  private hint!: Hint;
  private badges: { bg: Phaser.GameObjects.Image; icon: Phaser.GameObjects.Image[]; star: Phaser.GameObjects.Image }[] = [];
  private lastAction = 0;
  private lastSfx = 0;
  private lastFx = 0;
  // strofinare
  private coatMask: Uint8Array | null = null;
  private messyMask: Uint8Array | null = null;
  private maneMask: Uint8Array | null = null;
  private mud!: ScratchLayer;
  private foam: ScratchLayer | null = null;
  private rub: ScratchLayer | null = null;
  private tool: Phaser.GameObjects.Image | null = null;
  private tip: Phaser.GameObjects.Image | null = null;
  private toolDock = DOCK;
  private toolBob?: Phaser.Tweens.Tween;
  private drops!: Phaser.GameObjects.Particles.ParticleEmitter;
  // colore
  private pots: { id: ColorId; paint: Phaser.GameObjects.Image; glass: Phaser.GameObjects.Image }[] = [];
  private chosen: ColorId | null = null;
  private colorDone = false;
  private nextBtn: Phaser.GameObjects.Image | null = null;
  // accessori
  private trayObjs: Phaser.GameObjects.GameObject[] = [];
  private items: { id: AccessoryId; img: Phaser.GameObjects.Image }[] = [];
  private photoBtn: Phaser.GameObjects.Image | null = null;
  private worn = 0;
  private flying = false;

  constructor() { super('unicorni:Salon'); }

  create(data: { u?: string }): void {
    const id: UnicornId = isUnicornId(data?.u) ? data.u : nextUnicorn(save.state.visits, save.state.groomed, save.state.last || null);
    save.update({ last: id });
    this.phase = 'intro';
    this.busy = false;
    this.tutorial = !save.state.tutorialDone;
    this.badges = [];
    this.foam = null;
    this.rub = null;
    this.tool = null;
    this.tip = null;
    this.pots = [];
    this.chosen = null;
    this.colorDone = false;
    this.nextBtn = null;
    this.trayObjs = [];
    this.items = [];
    this.photoBtn = null;
    this.worn = 0;
    this.flying = false;
    this.lastAction = this.time.now;

    setupView(this, (v) => this.badges.forEach((b) => {
      const y = v.top + 78;
      b.bg.y = y; b.star.y = y + 34;
      b.icon.forEach((o) => { o.y = y + ((o.getData('dy') as number) ?? 0); });
    }));
    this.cameras.main.fadeIn(250, 143, 211, 255);
    playUnicorniMusic();
    drawSalon(this, { fgAside: true, platformX: UNI_X });

    this.uni = new UnicornView(this, 2500, FLOOR_Y, { u: id, c: null, a: [] }, { messy: true, depth: 50 });
    const mask = (key: string) => {
      if (!MASKS.get(key)) MASKS.set(key, maskFromTexture(this, key));
      return MASKS.get(key) ?? null;
    };
    this.coatMask = mask('un_coat');
    this.messyMask = mask('un_mane_messy');
    this.maneMask = mask('un_mane');
    // il fango c'è già all'arrivo; si toglie solo nella tappa della schiuma
    this.mud = new ScratchLayer(this, { ...this.full(), cover: 'un_mud', mask: this.coatMask, radius: 72, index: this.uni.indexFor('mud') });
    this.mud.enabled = false;

    this.drops = this.add.particles(0, 0, 'un_drop', {
      speedY: { min: 700, max: 900 }, speedX: { min: -60, max: 60 }, gravityY: 900, lifespan: 380, scale: { start: 0.9, end: 0.6 },
      alpha: { start: 0.95, end: 0.4 }, emitting: false,
    }).setDepth(640);

    this.hint = new Hint(this);
    this.buildBadges();
    const home = button(this, 0, 0, 'btn_home', () => goTo(this, 'unicorni:Menu'), 0.85);
    pin(this, home, 'tl', 80, 80);
    muteButton(this);

    this.input.on('pointerdown', (p: Phaser.Input.Pointer, over: Phaser.GameObjects.GameObject[]) => { if (!over.length) this.onDown(p); });
    this.time.addEvent({ delay: 400, loop: true, callback: () => this.idleCheck() });
    if (urlParam('debug')) Object.assign(window, { __un: this, __sound: sound });

    this.uni.trotIn(2500, UNI_X, () => {
      sfx.neigh();
      this.uni.hop(() => this.startWash());
    });
    this.time.delayedCall(200, () => sfx.hop());
  }

  /** Rettangolo degli strati da strofinare: tutta la tela dell'unicorno, dentro il suo Container. */
  private full(): { parent: Phaser.GameObjects.Container; x: number; y: number; w: number; h: number } {
    return { parent: this.uni.c, x: -U.OX, y: -U.OY, w: U.W, h: U.H };
  }

  // =================================================================
  // Indicatore delle 5 tappe
  // =================================================================
  private buildBadges(): void {
    const icons: [string, number, number, number?][] = [['un_sponge', 0.44, 0], ['un_shower', 0.4, 0], ['un_brush', 0.38, 0], ['un_pot_paint', 0.5, -2, hex(colorHex('pink'))], ['un_acc_bow', 0.6, 0]];
    const top = view(this).top + 78;
    icons.forEach(([k, s, dy, tint], i) => {
      const x = 960 + (i - 2) * 140;
      const bg = this.add.image(x, top, 'un_badge').setScale(0.82).setDepth(900);
      const ic = [this.add.image(x, top + dy, k).setScale(s).setDepth(901).setData('dy', dy)];
      if (tint !== undefined) {
        ic[0].setTint(tint);
        ic.push(this.add.image(x, top + dy, 'un_pot_glass').setScale(s).setDepth(902).setData('dy', dy));
      }
      const star = this.add.image(x + 38, top + 34, 'star').setScale(0).setDepth(903);
      this.badges.push({ bg, icon: ic, star });
    });
  }

  private badgeActive(i: number): void {
    this.badges.forEach((b, j) => {
      this.tweens.killTweensOf(b.bg);
      b.bg.setScale(0.82);
      if (j === i) this.tweens.add({ targets: b.bg, scale: 0.94, duration: 500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    });
  }

  private badgeDone(i: number): void {
    const b = this.badges[i];
    if (!b) return;
    sfx.step();
    this.tweens.add({ targets: b.star, scale: 0.5, duration: 400, ease: 'Back.easeOut' });
    burst(this, b.bg.x, b.bg.y, 'sparkle', { count: 10, tints: [0xffffff, 0xffe066, 0xffb3d9], gravity: 0, life: 600, depth: 950 });
  }

  /** Festa breve a fine tappa: faccia felice, saltello, scintille sul manto. */
  private cheer(then: () => void): void {
    this.uni.face('happy');
    sfx.shine();
    for (let k = 0; k < 5; k++) {
      const p = this.uni.toScene(200 + Math.random() * 460, 150 + Math.random() * 360);
      this.time.delayedCall(k * 90, () => burst(this, p.x, p.y, 'sparkle', { count: 5, tints: [0xffffff, 0xfff3a0, 0xffc8ec], speed: [60, 200], gravity: 0, scale: [0.9, 0], life: 600, depth: 700 }));
    }
    this.uni.hop(() => this.time.delayedCall(250, () => { this.uni.face('open'); then(); }));
  }

  // =================================================================
  // Attrezzo che segue il dito (spugna, doccetta, spazzola, pennello)
  // =================================================================
  private showTool(key: string, dock: { x: number; y: number }, ox: number, oy: number, tipTint?: number): void {
    this.hideTool();
    this.toolDock = dock;
    this.tool = this.add.image(dock.x - 500, dock.y, key).setOrigin(ox, oy).setDepth(650);
    if (tipTint !== undefined) this.tip = this.add.image(dock.x - 500, dock.y, 'un_wand_tip').setOrigin(ox, oy).setDepth(651).setTint(tipTint);
    const objs = [this.tool, this.tip].filter(Boolean) as Phaser.GameObjects.Image[];
    sfx.whoosh();
    this.tweens.add({ targets: objs, x: dock.x, duration: 500, ease: 'Back.easeOut', onComplete: () => this.bobTool() });
  }

  private bobTool(): void {
    this.toolBob?.stop();
    const objs = [this.tool, this.tip].filter(Boolean) as Phaser.GameObjects.Image[];
    if (objs.length) this.toolBob = this.tweens.add({ targets: objs, y: this.toolDock.y - 14, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  }

  private toolTo(x: number, y: number): void {
    if (!this.tool) return;
    this.toolBob?.stop();
    this.toolBob = undefined;
    this.tweens.killTweensOf([this.tool, this.tip].filter(Boolean) as Phaser.GameObjects.Image[]);
    const wob = Math.sin(this.time.now / 60) * 6;
    this.tool.setPosition(x + wob, y);
    this.tip?.setPosition(x + wob, y);
  }

  private toolHome(): void {
    const objs = [this.tool, this.tip].filter(Boolean) as Phaser.GameObjects.Image[];
    if (!objs.length) return;
    this.tweens.add({ targets: objs, x: this.toolDock.x, y: this.toolDock.y, duration: 380, ease: 'Back.easeOut', onComplete: () => this.bobTool() });
  }

  private hideTool(): void {
    this.toolBob?.stop();
    const objs = [this.tool, this.tip].filter(Boolean) as Phaser.GameObjects.Image[];
    this.tool = null;
    this.tip = null;
    if (!objs.length) return;
    this.tweens.killTweensOf(objs);
    this.tweens.add({ targets: objs, x: '-=700', duration: 450, ease: 'Back.easeIn', onComplete: () => objs.forEach((o) => o.destroy()) });
  }

  /** Strato da strofinare della tappa: i callback comuni muovono l'attrezzo e controllano l'avanzamento. */
  private rubOpts(onScrub: (x: number, y: number, fresh: number) => void) {
    return {
      ...this.full(),
      onStart: (x: number, y: number) => { this.hint.hide(); this.lastAction = this.time.now; this.moveTool(x, y); },
      onScrub: (x: number, y: number, fresh: number) => { this.lastAction = this.time.now; this.moveTool(x, y); onScrub(x, y, fresh); this.checkRub(); },
      onEnd: () => this.toolHome(),
    };
  }

  private moveTool(x: number, y: number): void {
    if (this.phase === 'rinse') this.toolTo(x, Math.max(view(this).top + 150, y - 250));
    else this.toolTo(x, y);
  }

  private every(ms: number): boolean {
    const now = this.time.now;
    if (now - this.lastSfx < ms) return false;
    this.lastSfx = now;
    return true;
  }

  private fx(ms: number): boolean {
    const now = this.time.now;
    if (now - this.lastFx < ms) return false;
    this.lastFx = now;
    return true;
  }

  private checkRub(): void {
    if (this.busy || !this.rub) return;
    const ph = this.phase;
    if (ph !== 'wash' && ph !== 'rinse' && ph !== 'brush' && ph !== 'color') return;
    if (ph === 'color' && (!this.chosen || this.colorDone)) return;
    if (rubProgress(ph, this.rub.fraction()) >= 1) {
      if (ph === 'wash') this.finishWash();
      else if (ph === 'rinse') this.finishRinse();
      else if (ph === 'brush') this.finishBrush();
      else this.finishColor();
    }
  }

  // =================================================================
  // 1. Schiuma: il fango va via e la spugna lascia bolle
  // =================================================================
  private startWash(): void {
    this.phase = 'wash';
    this.badgeActive(0);
    this.showTool('un_sponge', DOCK, 0.5, 0.5);
    // la spugna toglie il fango (strato sotto) e intanto lascia la schiuma (strato sopra)
    const o = this.full();
    this.mud.destroy();
    this.mud = new ScratchLayer(this, { ...o, rt: this.mud.layer, mask: this.coatMask, radius: 72 });
    this.foam = new ScratchLayer(this, {
      ...this.rubOpts((x, y, fresh) => {
        if (this.every(150)) sfx.squish();
        if (fresh > 0 && this.fx(90)) {
          burst(this, x, y - 20, 'un_foam', { count: 2, speed: [60, 160], scale: [0.45, 0.1], gravity: -280, life: 900, depth: 660 });
          if (Math.random() < 0.4) sfx.bubble();
        }
      }),
      mode: 'paint', brush: 'un_foam', mask: this.coatMask, radius: 72, index: this.uni.c.getIndex(this.mud.layer) + 1,
    });
    this.rub = this.foam;
    this.lastAction = this.time.now;
    if (this.tutorial) this.time.delayedCall(500, () => this.showHint());
  }

  private finishWash(): void {
    this.busy = true;
    this.hint.hide();
    this.mud.dispose(450);
    this.foam?.stop();
    this.rub = null;
    this.hideTool();
    this.badgeDone(0);
    this.cheer(() => { this.busy = false; this.startRinse(); });
  }

  // =================================================================
  // 2. Risciacquo: la doccetta segue il dito e porta via la schiuma
  // =================================================================
  private startRinse(): void {
    this.phase = 'rinse';
    this.badgeActive(1);
    this.showTool('un_shower', SHOWER_DOCK, 0.48, 0.55);
    this.rub = new ScratchLayer(this, {
      ...this.rubOpts((x, y) => {
        if (this.every(240)) sfx.water();
        if (this.tool && this.fx(40)) this.drops.explode(4, this.tool.x + (Math.random() * 2 - 1) * 40, this.tool.y + 50);
        if (Math.random() < 0.05) burst(this, x, y, 'un_foam', { count: 1, speed: [80, 180], scale: [0.4, 0.1], gravity: -200, life: 700, depth: 660 });
      }),
      rt: this.foam!.layer, mask: this.coatMask, radius: 84,
    });
    this.lastAction = this.time.now;
    if (this.tutorial) this.time.delayedCall(700, () => this.showHint());
  }

  private finishRinse(): void {
    this.busy = true;
    this.hint.hide();
    this.rub?.dispose(500);
    this.rub = null;
    this.hideTool();
    this.badgeDone(1);
    // si scrolla l'acqua di dosso
    this.time.delayedCall(250, () => {
      sfx.shake();
      this.uni.shake();
      const c = this.uni.toScene(380, 380);
      burst(this, c.x, c.y, 'un_drop', { count: 22, speed: [400, 800], scale: [1, 0.5], gravity: 1200, life: 800, depth: 700 });
    });
    this.time.delayedCall(800, () => this.cheer(() => { this.busy = false; this.startBrush(); }));
  }

  // =================================================================
  // 3. Spazzola: la criniera arruffata diventa morbida e ondulata
  // =================================================================
  private startBrush(): void {
    this.phase = 'brush';
    this.badgeActive(2);
    this.showTool('un_brush', DOCK, 150 / 220, 84 / 120);
    // l'immagine arruffata lascia il posto allo strato da spazzolare (sopra i riflessi, che così si vedono solo pettinando)
    this.uni.setMessy(false, true);
    const tint = dullMane(this.uni.u);
    this.rub = new ScratchLayer(this, {
      ...this.rubOpts((x, y, fresh) => {
        if (this.every(130)) sfx.brush();
        if (fresh > 0 && this.fx(70)) burst(this, x, y, 'un_tuft', { count: 2, tints: [tint, 0xffffff], speed: [80, 220], scale: [0.9, 0.3], gravity: 600, life: 700, depth: 660 });
      }),
      cover: 'un_mane_messy', coverTint: tint, mask: this.messyMask, radius: 62, index: this.uni.indexFor('messyCover'),
    });
    this.lastAction = this.time.now;
    if (this.tutorial) this.time.delayedCall(700, () => this.showHint());
  }

  private finishBrush(): void {
    this.busy = true;
    this.hint.hide();
    this.rub?.dispose(450);
    this.rub = null;
    this.hideTool();
    this.badgeDone(2);
    this.cheer(() => { this.busy = false; this.startColor(); });
  }

  // =================================================================
  // 4. Colore: tocco sul barattolo, poi si strofina la criniera con il pennello magico
  // =================================================================
  private startColor(): void {
    this.phase = 'color';
    this.badgeActive(3);
    const un = unlocked(save.state.visits);
    const rows = Math.ceil(un.colors.length / 3);
    this.trayObjs.push(this.tray(1405, 450, 500, rows * 210 + 20));
    un.colors.forEach((c, i) => {
      const x = POT_X[i % 3], y = POT_Y[Math.floor(i / 3)];
      const paint = c === 'rainbow' ? this.add.image(x, y + 400, 'un_pot_rainbow') : this.add.image(x, y + 400, 'un_pot_paint').setTint(hex(colorHex(c)));
      const glass = this.add.image(x, y + 400, 'un_pot_glass');
      for (const o of [paint, glass]) o.setDepth(paint === o ? 41 : 42).setScale(POT_S);
      glass.setInteractive({ useHandCursor: true }).on('pointerdown', () => this.choose(c));
      this.pots.push({ id: c, paint, glass });
      this.trayObjs.push(paint, glass);
      this.tweens.add({ targets: [paint, glass], y, duration: 450, delay: 150 + i * 70, ease: 'Back.easeOut' });
    });
    this.showTool('un_wand', DOCK, 196 / 220, 0.5, 0xe9e6f2);
    this.lastAction = this.time.now;
    if (this.tutorial) this.time.delayedCall(900, () => this.showHint());
  }

  /** Vassoio 2.5D (piano chiaro, spessore, ombra). */
  private tray(x: number, y: number, w: number, h: number): Phaser.GameObjects.Graphics {
    const g = this.add.graphics().setDepth(38);
    g.fillStyle(0x3a2a52, 0.18).fillRoundedRect(x + 10, y + 16, w, h, 40);
    g.fillStyle(0xc7a6e8, 1).fillRoundedRect(x, y + 10, w, h, 40);
    g.fillGradientStyle(0xfffaff, 0xfffaff, 0xf0e6ff, 0xf0e6ff, 1).fillRoundedRect(x, y, w, h, 40);
    g.lineStyle(4, 0xffffff, 0.9).strokeRoundedRect(x + 7, y + 7, w - 14, h - 14, 33);
    g.setAlpha(0);
    this.tweens.add({ targets: g, alpha: 1, duration: 300 });
    return g;
  }

  /** Sceglie un colore. Prima volta: nasce lo strato da strofinare; dopo la tappa, il colore cambia per magia. */
  private choose(c: ColorId, startWith?: Phaser.Input.Pointer): void {
    if (this.phase !== 'color' || this.busy) return;
    this.lastAction = this.time.now;
    this.hint.hide();
    const pot = this.pots.find((p) => p.id === c);
    if (pot) {
      this.tweens.killTweensOf([pot.paint, pot.glass]);
      for (const o of [pot.paint, pot.glass]) o.setScale(POT_S);
      this.tweens.add({ targets: [pot.paint, pot.glass], scaleY: POT_S * 0.84, scaleX: POT_S * 1.07, duration: 90, yoyo: true });
    }
    sfx.pick();
    const tipTint = c === 'rainbow' ? 0xffd6f0 : hex(colorHex(c));
    this.tip?.setTint(tipTint);
    if (pot && this.tip) {
      // il pennello va a intingersi nel barattolo e torna
      this.toolBob?.stop();
      const objs = [this.tool!, this.tip];
      this.tweens.killTweensOf(objs);
      this.tweens.add({ targets: objs, x: pot.paint.x + 60, y: pot.paint.y - 50, duration: 200, yoyo: !startWith, ease: 'Quad.easeOut', onComplete: () => { if (!startWith) this.bobTool(); } });
      burst(this, pot.paint.x, pot.paint.y - 40, 'dot', { count: 8, tints: [tipTint, 0xffffff], speed: [100, 260], scale: [0.6, 0], gravity: 600, life: 500, depth: 700 });
    }
    if (this.colorDone) {
      if (c === this.uni.color) return;
      this.uni.setMane(c);
      sfx.magic();
      this.maneSparkle(c);
      this.uni.face('happy');
      this.time.delayedCall(700, () => this.uni.face('open'));
      return;
    }
    if (c === this.chosen) return;
    if (this.rub) this.rub.dispose(200);
    // sopra: la criniera com'è ora; sotto: il colore nuovo. Strofinando si scopre.
    const now = this.uni.maneTint();
    this.chosen = c;
    this.rub = new ScratchLayer(this, {
      ...this.rubOpts((x, y, fresh) => {
        if (this.every(160)) sfx.paint();
        if (fresh > 0 && this.fx(80)) burst(this, x, y, 'sparkle', { count: 2, tints: [tipTint, 0xffffff], speed: [60, 200], scale: [0.6, 0], gravity: 0, life: 500, depth: 660 });
      }),
      cover: now === null ? 'un_mane_rainbow' : 'un_mane', coverTint: now ?? undefined, mask: this.maneMask, radius: 60, index: this.uni.indexFor('maneCover'),
    });
    this.uni.setMane(c);
    if (startWith) this.rub.begin(startWith);
    if (this.tutorial) this.time.delayedCall(500, () => { if (!this.rub?.active) this.showHint(); });
  }

  private maneSparkle(c: ColorId): void {
    const tint = c === 'rainbow' ? [0xff8a9c, 0xffe073, 0x8ee39a, 0x74c8ff, 0xb892ff] : [hex(colorHex(c)), 0xffffff];
    const pts: [number, number][] = [[500, 110], [470, 200], [440, 290], [560, 120], [180, 400], [150, 470], [200, 520]];
    pts.forEach(([x, y], i) => {
      const p = this.uni.toScene(x, y);
      this.time.delayedCall(i * 60, () => burst(this, p.x, p.y, 'sparkle', { count: 5, tints: tint, speed: [60, 220], gravity: 0, scale: [0.9, 0], life: 600, depth: 700 }));
    });
  }

  private finishColor(): void {
    this.busy = true;
    this.hint.hide();
    this.rub?.dispose(400);
    this.rub = null;
    this.colorDone = true;
    sfx.magic();
    this.maneSparkle(this.chosen ?? 'pink');
    this.toolHome();
    this.badgeDone(3);
    this.cheer(() => {
      this.busy = false;
      this.hideTool();
      this.nextBtn = button(this, 1660, 965, 'btn_next', () => this.startDecorate(), 0.8).setScale(0);
      this.tweens.add({ targets: this.nextBtn, scale: 0.8, duration: 400, ease: 'Back.easeOut', onComplete: () => this.nextBtn && pulse(this, this.nextBtn) });
      this.lastAction = this.time.now;
    });
  }

  // =================================================================
  // 5. Accessori: un tocco e l'accessorio vola al suo posto
  // =================================================================
  private startDecorate(): void {
    if (this.phase !== 'color' || this.busy) return;
    this.phase = 'decorate';
    this.hint.hide();
    this.badgeActive(4);
    this.nextBtn?.destroy();
    this.nextBtn = null;
    sfx.whoosh();
    const old = this.trayObjs;
    this.trayObjs = [];
    this.tweens.add({ targets: old, alpha: 0, y: '+=200', duration: 400, onComplete: () => old.forEach((o) => o.destroy()) });
    this.pots = [];

    const un = unlocked(save.state.visits);
    const n = un.accessories.length;
    this.trayObjs.push(this.tray(80, 420, 400, n > 2 ? 430 : 220));
    if (n > 4) this.trayObjs.push(this.tray(1450, 420, 400, n > 6 ? 430 : 220));
    un.accessories.forEach((id, i) => {
      const [x, y] = TRAY_ITEMS[i];
      const sh = this.add.image(x, y + 62, 'shadow').setScale(0.55, 0.26).setDepth(40).setAlpha(0.7);
      const img = this.add.image(x, y + 400, `un_acc_${id}`).setDepth(41).setScale(this.trayScale(id));
      img.setInteractive({ useHandCursor: true }).on('pointerdown', () => this.wearAcc(id, img));
      this.items.push({ id, img });
      this.trayObjs.push(sh, img);
      this.tweens.add({ targets: img, y, duration: 450, delay: 200 + i * 70, ease: 'Back.easeOut' });
    });
    this.lastAction = this.time.now;
    if (this.tutorial) this.time.delayedCall(1100, () => this.showHint());
  }

  /** Scala nel vassoio: tutti gli accessori più o meno della stessa grandezza. */
  private trayScale(id: AccessoryId): number {
    return Math.min(1.9, 150 / UnicornView.accSize(id));
  }

  private wearAcc(id: AccessoryId, from: Phaser.GameObjects.Image): void {
    if (this.phase !== 'decorate' || this.busy || this.flying) return;
    this.flying = true;
    this.lastAction = this.time.now;
    this.hint.hide();
    sfx.pick();
    const to = this.uni.targetFor(id);
    const fly = this.add.image(from.x, from.y, `un_acc_${id}`).setScale(this.trayScale(id)).setDepth(1300);
    const s0 = this.trayScale(id);
    this.tweens.killTweensOf(from);
    from.setScale(s0);
    this.tweens.add({ targets: from, scaleY: s0 * 0.85, duration: 80, yoyo: true });
    this.tweens.add({
      targets: fly, x: to.x, y: to.y, scale: this.uni.scale, duration: 320, ease: 'Cubic.easeOut',
      onComplete: () => {
        fly.destroy();
        this.uni.wear(id);
        sfx.pop(this.worn++);
        burst(this, to.x, to.y, 'sparkle', { count: 8, tints: [0xffffff, 0xffe066, 0xffb3d9], speed: [80, 260], gravity: 0, scale: [0.7, 0], life: 550, depth: 700 });
        this.uni.face('happy');
        this.time.delayedCall(600, () => this.uni.face('open'));
        this.flying = false;
        this.checkPhoto();
      },
    });
  }

  private checkPhoto(): void {
    if (this.photoBtn || !canPhoto(this.uni.accessories)) return;
    this.photoBtn = button(this, 1660, 965, 'un_btn_photo', () => this.photo(), 0.8).setScale(0);
    this.tweens.add({ targets: this.photoBtn, scale: 0.8, duration: 400, ease: 'Back.easeOut', onComplete: () => this.photoBtn && pulse(this, this.photoBtn) });
  }

  // =================================================================
  // Foto ricordo
  // =================================================================
  private photo(): void {
    if (this.phase !== 'decorate' || this.busy) return;
    this.phase = 'photo';
    this.busy = true;
    this.hint.hide();
    this.badgeDone(4);
    const look = { u: this.uni.u.id, c: this.uni.color ?? 'pink', a: [...this.uni.accessories] };
    const visits = save.state.visits + 1;
    const groomed = save.state.groomed.includes(look.u) ? save.state.groomed : [...save.state.groomed, look.u];
    save.update({ visits, photos: addPhoto(save.state.photos, look), groomed, tutorialDone: true });
    this.time.delayedCall(450, () => goTo(this, 'unicorni:Photo', { look, reward: rewardFor(visits), visits }));
  }

  // =================================================================
  // Tocchi liberi: sull'unicorno fa un saltello (quando non si strofina)
  // =================================================================
  private onDown(p: Phaser.Input.Pointer): void {
    if (this.busy) return;
    if (this.phase === 'color' && !this.chosen && !this.colorDone) {
      // strofina la criniera senza aver scelto: il pennello prende un colore a sorpresa
      const local = this.uni.c.pointToContainer({ x: p.worldX, y: p.worldY });
      const cx = local.x + U.OX, cy = local.y + U.OY;
      const cell = 20, cols = Math.ceil(U.W / cell);
      const i = Math.floor(cy / cell) * cols + Math.floor(cx / cell);
      if (cx >= 0 && cy >= 0 && cx < U.W && cy < U.H && this.maneMask?.[i]) {
        const cs = unlocked(save.state.visits).colors.filter((c) => c !== 'rainbow');
        this.choose(cs[Math.floor(Math.random() * cs.length)], p);
        return;
      }
    }
    if (this.phase === 'decorate' || (this.phase === 'color' && this.colorDone)) {
      const b = this.uni.c.getBounds();
      if (b.contains(p.worldX, p.worldY)) {
        sfx.neigh();
        this.uni.hop();
      }
    }
  }

  // =================================================================
  // Manina d'aiuto: subito alla prima visita, poi dopo qualche secondo senza azioni
  // =================================================================
  private idleCheck(): void {
    if (this.busy || this.hint.visible || this.rub?.active || this.flying) return;
    if (this.time.now - this.lastAction > IDLE_HINT_MS) this.showHint();
  }

  private showHint(): void {
    if (this.busy || this.rub?.active) return;
    const ph = this.phase;
    if (ph === 'wash' || ph === 'rinse') {
      const c = this.uni.toScene(330, 410);
      this.hint.circle(c.x, c.y, 130, 50);
    } else if (ph === 'brush') {
      const c = this.uni.toScene(452, 214);
      this.hint.circle(c.x, c.y, 40, 80);
    } else if (ph === 'color') {
      if (this.colorDone && this.nextBtn) this.hint.tap(this.nextBtn.x, this.nextBtn.y);
      else if (!this.chosen && this.pots[0]) this.hint.tap(this.pots[0].glass.x, this.pots[0].glass.y);
      else {
        const c = this.uni.toScene(452, 214);
        this.hint.circle(c.x, c.y, 40, 80);
      }
    } else if (ph === 'decorate') {
      if (this.photoBtn && this.worn >= 2) this.hint.tap(this.photoBtn.x, this.photoBtn.y);
      else if (this.items[0]) this.hint.tap(this.items[this.worn % this.items.length].img.x, this.items[this.worn % this.items.length].img.y);
    }
    this.lastAction = this.time.now;
  }

  // =================================================================
  // Solo test automatici (?debug=1): esegue la tappa corrente
  // =================================================================
  /** Strofina da codice lo strato attivo (cella per cella del bersaglio) fino alla quota indicata. */
  rubTo(share: number): void {
    const layer = this.rub;
    if (!layer) return;
    const g = layer.grid;
    for (let row = 0; row < g.rows && layer.fraction() < share; row++) {
      for (let col = 0; col < g.cols && layer.fraction() < share; col++) {
        const lx = (col + 0.5) * g.cell, ly = (row + 0.5) * g.cell;
        if (!g.inMask(lx, ly) || g.isClear(lx, ly)) continue;
        const p = layer.toScene(lx, ly);
        layer.eraseAt(p.x, p.y);
        if (this.phase === 'wash') this.mud.eraseAt(p.x, p.y);
      }
    }
  }

  autoStep(): string {
    if (this.busy || this.flying) return `${this.phase} (attendi)`;
    const ph = this.phase;
    if (ph === 'wash' || ph === 'rinse' || ph === 'brush') { this.rubTo(RUB_GOAL[ph] + 0.02); this.checkRub(); }
    else if (ph === 'color') {
      if (this.colorDone) this.startDecorate();
      else {
        if (!this.chosen) this.choose(this.pots[1]?.id ?? 'pink');
        this.rubTo(RUB_GOAL.color + 0.02);
        this.checkRub();
      }
    } else if (ph === 'decorate') {
      if (this.uni.accessories.length < 3 && this.items[this.uni.accessories.length]) {
        const it = this.items[this.uni.accessories.length];
        this.wearAcc(it.id, it.img);
      } else this.photo();
    }
    return this.phase;
  }
}
