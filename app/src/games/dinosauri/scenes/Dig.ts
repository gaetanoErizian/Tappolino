import Phaser from 'phaser';
import { setupView, button, pin, burst, pulse, view } from '../../../core/ui';
import { t } from '../../../core/i18n';
import { urlParam } from '../../../core/platform';
import { muteButton, title3d, goTo } from '../../../core/hud';
import { DragManager, Hint, type DragItem } from '../../../core/drag';
import { sound } from '../../../core/sound';
import {
  dinoById, nextDino, addFound, layoutDig, fitScale, stagePoint, dropsOnSkeleton, trayX, isDinoId,
  FLOOR, BONE_BOX, FOUND_AT, TRAY_Y, TRAY_BOX, STAGE, FRAME, GROUND, TREASURES, type Dino, type DinoId, type Treasure,
} from '../dinos';
import { piecesOf, type BonePiece } from '../skeleton';
import { ScratchLayer } from '../scratch';
import { drawDesert, drawPit, DinoView } from '../world';
import { save } from '../save';
import { sfx, playDinosauriMusic } from '../sfx';

type Step = 'dig' | 'build' | 'alive';

interface Buried {
  piece: BonePiece;
  img: Phaser.GameObjects.Image;
  /** area dell'osso nella buca (scena) per misurare quanto è scoperto */
  rect: Phaser.Geom.Rectangle;
  found: boolean;
  slot: { x: number; y: number };
  item?: DragItem;
}

const IDLE_HINT_MS = 5000;
const GLINT_MS = 2600;
const DUST = [0xb8743f, 0x9c5c30, 0xd9a46a, 0xe8c08a];

/**
 * Una partita: scavo (strofinare via la terra) → montaggio (ossa al loro posto, anche con un tocco)
 * → il dinosauro prende vita, ruggisce e finisce nell'album con una foto.
 */
export class Dig extends Phaser.Scene {
  private dino!: Dino;
  private step: Step = 'dig';
  private busy = false;
  private bones: Buried[] = [];
  private treasure: { img: Phaser.GameObjects.Image; rect: Phaser.Geom.Rectangle; found: boolean } | null = null;
  private scratch!: ScratchLayer;
  private hud: Phaser.GameObjects.Image[] = [];
  private brush!: Phaser.GameObjects.Image;
  private dust!: Phaser.GameObjects.Particles.ParticleEmitter;
  private hint!: Hint;
  private drag: DragManager | null = null;
  private ghosts = new Map<string, Phaser.GameObjects.Image>();
  private tray!: Phaser.GameObjects.Image;
  private foundCount = 0;
  private placed = 0;
  private lastAction = 0;
  private lastGlint = 0;
  private lastSound = 0;
  private lastDust = 0;
  private live: DinoView | null = null;

  constructor() { super('dinosauri:Dig'); }

  create(data: { dino?: string }): void {
    const id: DinoId = isDinoId(data?.dino) ? data.dino : nextDino(save.state.found, save.state.last);
    this.dino = dinoById(id);
    this.step = 'dig';
    this.busy = false;
    this.bones = [];
    this.treasure = null;
    this.hud = [];
    this.ghosts = new Map();
    this.drag = null;
    this.live = null;
    this.foundCount = 0;
    this.placed = 0;
    this.lastAction = this.time.now;

    setupView(this, (v) => this.hud.forEach((h) => { h.y = v.top + 76; }));
    this.cameras.main.fadeIn(250, 143, 211, 255);
    playDinosauriMusic();
    drawDesert(this, { horizon: 190, props: 'dig' });
    drawPit(this);
    this.tray = this.add.image(960, TRAY_Y + 14, 'di_tray').setDepth(18).setScale(0.95, 0.9);

    this.buryBones();
    this.scratch = new ScratchLayer(this, {
      x: FLOOR.x, y: FLOOR.y, w: FLOOR.w, h: FLOOR.h, cover: 'di_soil', radius: 74, depth: 10,
      shadow: { dx: 12, dy: 15, alpha: 0.42 },
      onStart: (x, y) => this.onScrubStart(x, y),
      onScrub: (x, y, fresh) => this.onScrub(x, y, fresh),
      onEnd: () => this.brush.setVisible(false),
    });
    this.brush = this.add.image(0, 0, 'di_brush').setOrigin(40 / 220, 100 / 140).setDepth(13).setVisible(false);
    this.dust = this.add.particles(0, 0, 'dot', {
      speed: { min: 60, max: 240 }, angle: { min: 200, max: 340 }, scale: { start: 0.7, end: 0 }, lifespan: 600,
      gravityY: 700, tint: DUST, emitting: false,
    }).setDepth(14);
    this.buildHud();
    this.hint = new Hint(this);

    const home = button(this, 0, 0, 'btn_home', () => goTo(this, 'dinosauri:Menu'), 0.85);
    pin(this, home, 'tl', 80, 80);
    muteButton(this);

    this.input.on('pointerdown', (p: Phaser.Input.Pointer, over: Phaser.GameObjects.GameObject[]) => { if (!over.length) this.onTap(p.worldX, p.worldY); });
    this.time.addEvent({ delay: 400, loop: true, callback: () => this.idleCheck() });
    if (urlParam('debug')) Object.assign(window, { __di: this, __sound: sound });

    if (!save.state.tutorialDig) this.time.delayedCall(700, () => this.showDigHint());
  }

  // =================================================================
  // Scavo
  // =================================================================

  private buryBones(): void {
    const pieces = piecesOf(this.dino.id);
    const lay = layoutDig(pieces.length);
    pieces.forEach((p, i) => {
      const spot = lay.bones[i];
      const s = fitScale(p.w, p.h, BONE_BOX);
      const img = this.add.image(spot.x, spot.y, `di_bone_${this.dino.id}_${p.id}`).setScale(s).setDepth(8);
      // area da scoprire: il cuore dell'osso (un po' più piccola del riquadro)
      const w = img.displayWidth * 0.7, h = img.displayHeight * 0.7;
      this.bones.push({ piece: p, img, rect: new Phaser.Geom.Rectangle(spot.x - w / 2, spot.y - h / 2, w, h), found: false, slot: stagePoint(p.cx, p.cy) });
    });
    if (lay.treasure) {
      const kind: Treasure = TREASURES[Math.floor(Math.random() * TREASURES.length)];
      const img = this.add.image(lay.treasure.x, lay.treasure.y, `di_tr_${kind}`).setScale(0.9).setDepth(8);
      this.treasure = { img, rect: new Phaser.Geom.Rectangle(img.x - 40, img.y - 40, 80, 80), found: false };
    }
  }

  private buildHud(): void {
    const n = this.bones.length;
    const top = view(this).top + 76;
    for (let i = 0; i < n; i++) {
      const icon = this.add.image(960 + (i - (n - 1) / 2) * 96, top, 'di_bone_slot').setDepth(900).setScale(0.95);
      this.hud.push(icon);
    }
  }

  private onScrubStart(x: number, y: number): void {
    if (this.step !== 'dig') return;
    this.brush.setVisible(true).setPosition(x, y);
  }

  private onScrub(x: number, y: number, fresh: number): void {
    if (this.step !== 'dig') return;
    const now = this.time.now;
    this.lastAction = now;
    this.hint.hide();
    this.brush.setPosition(x, y).setAngle(Math.sin(now / 45) * 9);
    if (now - this.lastSound > 110) { this.lastSound = now; sfx.brush(); }
    if (fresh > 0 && now - this.lastDust > 50) { this.lastDust = now; this.dust.explode(4, x, y); }
    for (const b of this.bones) {
      if (!b.found && this.scratch.fractionIn(b.rect.x, b.rect.y, b.rect.width, b.rect.height) >= FOUND_AT) this.boneFound(b);
    }
    const tr = this.treasure;
    if (tr && !tr.found && this.scratch.fractionIn(tr.rect.x, tr.rect.y, tr.rect.width, tr.rect.height) >= 0.5) this.treasureFound();
  }

  /** La terra attorno all'osso crolla, l'osso salta fuori e vola nel vassoio. */
  private boneFound(b: Buried): void {
    b.found = true;
    const i = this.foundCount++;
    if (!save.state.tutorialDig) save.update({ tutorialDig: true });
    sfx.crumble();
    const r = b.img.getBounds();
    let k = 0;
    for (let yy = r.y + 30; yy < r.bottom; yy += 60) {
      for (let xx = r.x + 30; xx < r.right; xx += 60) {
        const px = xx, py = yy;
        this.time.delayedCall(k++ * 12, () => { this.scratch.eraseAt(px, py, 0.9); this.dust.explode(2, px, py); });
      }
    }
    this.time.delayedCall(260, () => {
      sfx.found();
      b.img.setDepth(15);
      const s = b.img.scale;
      const glow = this.add.image(b.img.x, b.img.y, 'glow').setScale(2.6).setAlpha(0).setTint(0xfff0b0).setBlendMode(Phaser.BlendModes.ADD).setDepth(14);
      this.tweens.add({ targets: glow, alpha: 0.8, duration: 160, yoyo: true, hold: 200, onComplete: () => glow.destroy() });
      burst(this, b.img.x, b.img.y, 'sparkle', { count: 12, tints: [0xffffff, 0xffe066], speed: [150, 400], gravity: 0, life: 700, depth: 16 });
      this.tweens.add({
        targets: b.img, scale: s * 1.18, y: b.img.y - 30, duration: 220, ease: 'Back.easeOut',
        onComplete: () => this.flyToTray(b, i),
      });
      const icon = this.hud[i];
      if (icon) {
        icon.setTexture('di_bone_icon');
        this.tweens.add({ targets: icon, scale: 1.35, duration: 160, yoyo: true, ease: 'Quad.easeOut' });
      }
    });
  }

  private flyToTray(b: Buried, i: number): void {
    sfx.whoosh();
    const n = this.bones.length;
    const s = fitScale(b.piece.w, b.piece.h, TRAY_BOX);
    b.img.setDepth(21);
    this.tweens.add({
      targets: b.img, x: trayX(i, n), y: TRAY_Y - 6, scale: s, duration: 520, ease: 'Cubic.easeInOut',
      onComplete: () => {
        sfx.thud();
        this.tweens.add({ targets: b.img, scaleY: s * 0.85, duration: 80, yoyo: true });
        if (this.bones.every((x) => x.found) && this.step === 'dig') this.time.delayedCall(450, () => this.startBuild());
      },
    });
  }

  private treasureFound(): void {
    const tr = this.treasure!;
    tr.found = true;
    sfx.treasure();
    tr.img.setDepth(15);
    burst(this, tr.img.x, tr.img.y, 'star', { count: 10, speed: [200, 500], scale: [0.5, 0], gravity: 300, life: 900, depth: 16 });
    this.tweens.add({ targets: tr.img, scale: 1.4, y: tr.img.y - 120, duration: 500, ease: 'Back.easeOut' });
    this.tweens.add({ targets: tr.img, alpha: 0, scale: 0.6, delay: 1100, duration: 400, onComplete: () => tr.img.destroy() });
  }

  private showDigHint(): void {
    const b = this.bones.find((x) => !x.found);
    if (!b || this.step !== 'dig' || this.scratch.active) return;
    this.hint.circle(b.img.x, b.img.y - 10, 80, 40);
  }

  // =================================================================
  // Montaggio
  // =================================================================

  private startBuild(): void {
    if (this.step !== 'dig') return;
    this.step = 'build';
    this.hint.hide();
    this.brush.setVisible(false);
    this.scratch.clearAll(700);
    this.treasure?.img.destroy();
    this.treasure = null;
    sfx.poof();
    for (let i = 0; i < 6; i++) this.time.delayedCall(i * 60, () => this.dust.explode(8, FLOOR.x + Math.random() * FLOOR.w, FLOOR.y + Math.random() * FLOOR.h));
    // impronte dello scheletro nella roccia
    for (const b of this.bones) {
      const gh = this.add.image(b.slot.x, b.slot.y, `di_ghost_${this.dino.id}_${b.piece.id}`).setDepth(30).setScale(STAGE.scale).setAlpha(0);
      this.tweens.add({ targets: gh, alpha: 0.95, duration: 500, delay: 400 });
      this.ghosts.set(b.piece.id, gh);
    }
    this.drag = new DragManager(this, {
      onDrop: (it, x, y) => this.onDrop(it, x, y),
      onTap: (it) => this.place(it),
      onPick: (it) => this.onPick(it),
    }, 150);
    for (const b of this.bones) b.item = this.drag.add(b.img, b.piece.id);
    this.lastAction = this.time.now;
    if (!save.state.tutorialBuild) this.time.delayedCall(900, () => this.showBuildHint());
  }

  private boneOf(it: DragItem): Buried | undefined {
    return this.bones.find((b) => b.item === it);
  }

  private onPick(it: DragItem): void {
    this.lastAction = this.time.now;
    sfx.pick();
    this.hint.hide();
    const gh = this.ghosts.get(it.id);
    if (gh) this.tweens.add({ targets: gh, alpha: 0.5, duration: 160, yoyo: true, repeat: 2 });
  }

  private onDrop(it: DragItem, x: number, y: number): boolean {
    this.lastAction = this.time.now;
    const b = this.boneOf(it);
    if (!b) return false;
    if (dropsOnSkeleton(x, y, b.slot)) { this.place(it); return true; }
    sfx.back();
    return false;
  }

  /** L'osso vola al suo posto nello scheletro (con il tocco come con il trascinamento). */
  private place(it: DragItem): void {
    const b = this.boneOf(it);
    if (!b || !it.enabled || this.step !== 'build') return;
    it.enabled = false;
    this.lastAction = this.time.now;
    this.hint.hide();
    if (!save.state.tutorialBuild) save.update({ tutorialBuild: true });
    const order = this.placed++;
    // ordine di disegno: ali e zampe lontane dietro, testa davanti
    const depthRank = ['wingL', 'wingR', 'tail', 'back', 'legs', 'plates', 'ribs', 'arms', 'front', 'neck', 'skull'].indexOf(b.piece.id);
    b.img.setDepth(40 + Math.max(0, depthRank));
    sfx.whoosh();
    this.tweens.add({
      targets: b.img, x: b.slot.x, y: b.slot.y, scale: STAGE.scale, duration: 420, ease: 'Back.easeOut',
      onComplete: () => {
        sfx.snap(order);
        burst(this, b.slot.x, b.slot.y, 'dot', { count: 10, tints: DUST, speed: [100, 300], scale: [0.7, 0], life: 500, gravity: 500, depth: 60 });
        burst(this, b.slot.x, b.slot.y, 'sparkle', { count: 6, tints: [0xffffff, 0xffe066], speed: [80, 220], gravity: 0, life: 500, depth: 60 });
        this.tweens.add({ targets: this.ghosts.get(b.piece.id), alpha: 0, duration: 250 });
        this.tweens.add({ targets: b.img, scaleY: STAGE.scale * 0.92, duration: 90, yoyo: true });
        if (this.placed === this.bones.length) this.time.delayedCall(350, () => this.comeAlive());
      },
    });
  }

  private showBuildHint(): void {
    if (this.step !== 'build' || this.drag?.dragging) return;
    const b = this.bones.find((x) => x.item?.enabled);
    if (b) this.hint.drag(b.img.x, b.img.y, b.slot.x, b.slot.y);
  }

  // =================================================================
  // Il dinosauro prende vita
  // =================================================================

  private comeAlive(): void {
    if (this.step !== 'build') return;
    this.step = 'alive';
    this.busy = true;
    this.hint.hide();
    if (this.drag) this.drag.enabled = false;
    const d = this.dino;
    const isNew = !save.state.found.includes(d.id);
    save.update({ found: addFound(save.state.found, d.id), digs: save.state.digs + 1, last: d.id });
    void save.flush();

    sfx.magic();
    const center = stagePoint(FRAME.w / 2, FRAME.h / 2);
    const glow = this.add.image(center.x, center.y, 'glow').setScale(1).setAlpha(0).setTint(0xfff3c0).setBlendMode(Phaser.BlendModes.ADD).setDepth(35);
    this.tweens.add({ targets: glow, alpha: 0.9, scale: 6, duration: 900, ease: 'Sine.easeIn' });
    for (const b of this.bones) this.tweens.add({ targets: b.img, y: b.img.y - 8, duration: 70, yoyo: true, repeat: 6, delay: Math.random() * 120 });
    this.tweens.add({ targets: [...this.hud, this.tray], alpha: 0, duration: 500 });

    this.time.delayedCall(1100, () => {
      sfx.poof();
      const flash = this.add.rectangle(-2000, -1600, 5920, 3200, 0xffffff, 0.85).setOrigin(0).setDepth(880);
      this.tweens.add({ targets: flash, alpha: 0, duration: 450, onComplete: () => flash.destroy() });
      burst(this, center.x, center.y + 120, 'dot', { count: 40, tints: DUST, speed: [200, 700], scale: [1.4, 0], life: 900, gravity: 300, depth: 70 });
      this.tweens.add({ targets: glow, alpha: 0, duration: 800 });
      for (const b of this.bones) b.img.destroy();
      const foot = stagePoint(FRAME.w / 2, GROUND);
      this.live = new DinoView(this, d.id, foot.x, foot.y - 70, STAGE.scale, { depth: 50 });
      this.live.c.setAlpha(0);
      this.tweens.add({ targets: this.live.c, alpha: 1, duration: 150 });
      this.tweens.add({
        targets: this.live.c, y: foot.y, duration: 520, ease: 'Bounce.easeOut',
        onComplete: () => { sfx.thud(); this.roarFx(); },
      });
    });

    this.time.delayedCall(1900, () => {
      const name = t(`dinosauri.dino.${d.id}`);
      const top = title3d(this, 960, 118, isNew ? t('dinosauri.new') : t('dinosauri.again'), 78).setScale(0);
      const big = title3d(this, 960, 212, name, 92).setScale(0);
      this.tweens.add({ targets: top, scale: 1, duration: 380, ease: 'Back.easeOut' });
      this.tweens.add({ targets: big, scale: 1, duration: 420, delay: 150, ease: 'Back.easeOut' });
      if (isNew) for (let i = 0; i < 3; i++) {
        this.time.delayedCall(i * 280, () => burst(this, 300 + Math.random() * 1320, 140, 'confetti', {
          count: 20, tints: [0xff5a5f, 0xffc800, 0x35c46a, 0x36a9f0, 0x8a5cf6], speed: [250, 650], scale: [1.4, 0.6], life: 1500, gravity: 800, depth: 890,
        }));
      }
    });

    this.time.delayedCall(3100, () => this.takePhoto());
  }

  private roarFx(): void {
    const v = this.live;
    if (!v) return;
    v.roar();
    const h = v.headPoint();
    burst(this, h.x + 40, h.y - 20, 'di_note', { count: 5, speed: [180, 360], scale: [0.9, 0.3], gravity: -120, life: 1100, depth: 70 });
  }

  /** Foto ricordo: flash, la foto appare e vola nell'album. Poi "ancora" e "album". */
  private takePhoto(): void {
    const d = this.dino;
    sfx.camera();
    const flash = this.add.rectangle(-2000, -1600, 5920, 3200, 0xffffff, 0.9).setOrigin(0).setDepth(880);
    this.tweens.add({ targets: flash, alpha: 0, duration: 380, onComplete: () => flash.destroy() });
    const album = button(this, 230, 930, 'di_btn_album', () => goTo(this, 'dinosauri:Album'), 0.95).setAlpha(0);
    this.tweens.add({ targets: album, alpha: 1, duration: 250 });
    const s = 0.3;
    const pic = this.add.container(960, 560, [
      this.add.image(0, 0, 'di_photo'),
      this.add.image(0, -35 + (GROUND - FRAME.h / 2) * s, `di_dino_${d.id}`).setOrigin(0.5, GROUND / FRAME.h).setScale(s),
    ]).setDepth(870).setScale(0);
    this.tweens.chain({
      targets: pic,
      tweens: [
        { scale: 1.1, duration: 320, ease: 'Back.easeOut' },
        { scale: 1.1, duration: 600 },
        { x: album.x, y: album.y, scale: 0.12, alpha: 0.6, duration: 600, ease: 'Cubic.easeIn' },
      ],
      onComplete: () => {
        pic.destroy();
        sfx.fanfare();
        burst(this, album.x, album.y, 'star', { count: 10, speed: [200, 500], scale: [0.6, 0.1], gravity: 400, life: 900, depth: 950 });
        this.tweens.add({ targets: album, scale: 1.2, duration: 160, yoyo: true, ease: 'Quad.easeOut' });
        const next = button(this, 1690, 930, 'btn_next', () => goTo(this, 'dinosauri:Dig'), 1).setAlpha(0);
        this.tweens.add({ targets: next, alpha: 1, duration: 300, onComplete: () => pulse(this, next) });
        this.busy = false;
        this.lastAction = this.time.now;
      },
    });
  }

  // =================================================================
  // Tocchi e aiuti
  // =================================================================

  private onTap(x: number, y: number): void {
    this.lastAction = this.time.now;
    if (this.step === 'alive' && this.live?.hit(x, y)) {
      this.live.hop();
      this.roarFx();
    }
  }

  private idleCheck(): void {
    const idle = this.time.now - this.lastAction;
    if (this.step === 'dig') {
      if (this.scratch.active) return;
      if (idle > GLINT_MS && this.time.now - this.lastGlint > GLINT_MS) {
        this.lastGlint = this.time.now;
        const left = this.bones.filter((b) => !b.found);
        const b = left[Math.floor(Math.random() * left.length)];
        if (b) {
          const sp = this.add.image(b.img.x + (Math.random() - 0.5) * 80, b.img.y - 20, 'sparkle').setDepth(12).setScale(0).setAlpha(0.95);
          this.tweens.add({ targets: sp, scale: 1.1, duration: 300, yoyo: true, hold: 120, onComplete: () => sp.destroy() });
        }
      }
      if (idle > IDLE_HINT_MS && !this.hint.visible) this.showDigHint();
    } else if (this.step === 'build') {
      if (idle > IDLE_HINT_MS && !this.hint.visible && !this.drag?.dragging) this.showBuildHint();
    }
  }

  // =================================================================
  // Solo test automatici (?debug=1): scorciatoie per catture e prove
  // =================================================================

  /** Scopre un osso ancora sepolto (come se il bambino l'avesse strofinato). */
  autoDigOne(): boolean {
    const b = this.bones.find((x) => !x.found);
    if (!b || this.step !== 'dig') return false;
    const r = b.rect;
    for (let y = r.y; y <= r.bottom + 20; y += 40) for (let x = r.x; x <= r.right + 20; x += 40) this.scratch.eraseAt(x, y);
    this.onScrub(r.centerX, r.centerY, 1);
    return true;
  }

  /** Mette al suo posto il prossimo osso del vassoio. */
  autoPlaceOne(): boolean {
    const b = this.bones.find((x) => x.item?.enabled);
    if (!b?.item || this.step !== 'build') return false;
    this.place(b.item);
    return true;
  }

  get state(): { step: Step; busy: boolean; found: number; placed: number; total: number } {
    return { step: this.step, busy: this.busy, found: this.foundCount, placed: this.placed, total: this.bones.length };
  }
}
