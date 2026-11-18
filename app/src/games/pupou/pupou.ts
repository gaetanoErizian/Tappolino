import Phaser from 'phaser';
import { burst } from '../../core/ui';
import { STAGE_SCALE, STAGE_TIERS, type Mood, type Slot } from './logic';
import { BASE_Y, BODY_H, topOf } from './swirl';
import { sfx } from './sfx';

/** Dove va ogni cappello sul giro più alto (per un giro largo 92: i valori si adattano agli altri). */
const HAT: Record<string, { s: number; dy: number; dx?: number; center?: boolean }> = {
  bow: { s: 0.62, dy: 14, dx: 58, center: true },
  cap: { s: 0.8, dy: 40, dx: 16 },
  roll: { s: 0.84, dy: 36, dx: 12 },
  chef: { s: 0.82, dy: 44 },
  party: { s: 0.78, dy: 34 },
  crown: { s: 0.8, dy: 36 },
};
const NECK: Record<string, { s: number; y: number; oy: number }> = { bib: { s: 0.72, y: -30, oy: 0.1 }, bowtie: { s: 0.8, y: -18, oy: 0.5 }, medal: { s: 0.5, y: -40, oy: 0 } };
const EYES_Y = -126;
const MOUTH_Y = -56;

/**
 * Pupou in scena: un contenitore con i piedini nell'origine. Corpo a giri (cambia con la crescita), occhi e bocca
 * intercambiabili, braccine, sporco, vestiti. Tutte le animazioni sono scala/posizione (niente rotazioni di oggetti grandi).
 */
export class PupouView {
  readonly c: Phaser.GameObjects.Container;
  private inner: Phaser.GameObjects.Container;
  private shadow: Phaser.GameObjects.Image;
  private body: Phaser.GameObjects.Image;
  private eyes: Phaser.GameObjects.Image;
  private mouth: Phaser.GameObjects.Image;
  private dirt: Phaser.GameObjects.Image;
  private arms: Phaser.GameObjects.Image[];
  private hat: Phaser.GameObjects.Image;
  private glasses: Phaser.GameObjects.Image;
  private neck: Phaser.GameObjects.Image;
  private pacifier: Phaser.GameObjects.Image;
  private tipstar: Phaser.GameObjects.Image;
  private stinks: Phaser.GameObjects.Image[] = [];
  stage = 0;
  private base = 1;
  private mood: Mood = 'ok';
  private asleep = false;
  private clean = 100;
  private tempUntil = 0;
  private nextBlink = 0;
  private worn: Record<Slot, string> = { hat: '', eyes: '', neck: '' };
  private busyTween?: Phaser.Tweens.Tween;

  constructor(private scene: Phaser.Scene, x: number, y: number, depth = 100, private size = 1) {
    this.shadow = scene.add.image(x, y + 6, 'shadow').setDepth(depth - 1).setScale(2.2, 1.4);
    this.c = scene.add.container(x, y).setDepth(depth);
    this.inner = scene.add.container(0, 0);
    this.body = scene.add.image(0, 0, 'pp_body_2').setOrigin(0.5, BASE_Y / BODY_H);
    this.dirt = scene.add.image(0, -120, 'pp_dirt').setAlpha(0);
    this.neck = scene.add.image(0, -20, 'pp_wear_bib').setVisible(false);
    this.eyes = scene.add.image(0, EYES_Y, 'pp_eyes_open');
    this.mouth = scene.add.image(0, MOUTH_Y, 'pp_mouth_smile');
    this.glasses = scene.add.image(0, EYES_Y, 'pp_wear_round').setVisible(false).setScale(0.86);
    this.pacifier = scene.add.image(0, MOUTH_Y + 12, 'pp_pacifier').setVisible(false).setScale(0.9);
    this.arms = [scene.add.image(-176, -92, 'pp_arm').setOrigin(0.82, 0.5).setRotation(-0.35), scene.add.image(176, -92, 'pp_arm').setOrigin(0.18, 0.5).setRotation(0.35)];
    this.hat = scene.add.image(0, 0, 'pp_wear_cap').setVisible(false);
    this.tipstar = scene.add.image(0, 0, 'pp_tipstar').setVisible(false);
    this.inner.add([this.arms[0], this.arms[1], this.body, this.dirt, this.neck, this.eyes, this.mouth, this.glasses, this.pacifier, this.hat, this.tipstar]);
    this.c.add(this.inner);
    for (let i = 0; i < 3; i++) this.stinks.push(scene.add.image(0, 0, 'pp_stink').setDepth(depth + 1).setAlpha(0).setScale(0.8));
    // respiro
    scene.tweens.add({ targets: this.inner, scaleY: 1.025, scaleX: 0.99, duration: 1300, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    scene.tweens.add({ targets: this.arms, y: -98, duration: 1300, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    this.setStage(0);
  }

  get x(): number { return this.c.x; }
  get y(): number { return this.c.y; }
  get scale(): number { return this.base; }
  /** altezza a schermo (dai piedini alla punta del ricciolo) */
  get height(): number { return (-topOf(STAGE_TIERS[this.stage]).y + 70) * this.base; }
  mouthPos(): { x: number; y: number } { return { x: this.c.x, y: this.c.y + MOUTH_Y * this.base }; }
  headPos(): { x: number; y: number } { return { x: this.c.x, y: this.c.y - this.height }; }
  hit(x: number, y: number, pad = 30): boolean {
    return Math.abs(x - this.c.x) < 200 * this.base + pad && y < this.c.y + pad && y > this.c.y - this.height - pad;
  }

  moveTo(x: number, y: number): void { this.c.setPosition(x, y); this.shadow.setPosition(x, y + 6); }
  setVisible(v: boolean): void { this.c.setVisible(v); this.shadow.setVisible(v); this.stinks.forEach((s) => s.setVisible(v)); }

  setStage(stage: number): void {
    this.stage = Math.max(0, Math.min(STAGE_SCALE.length - 1, stage));
    this.base = STAGE_SCALE[this.stage] * this.size;
    this.c.setScale(this.base);
    this.shadow.setScale(2.2 * this.base, 1.4 * this.base);
    this.body.setTexture(`pp_body_${STAGE_TIERS[this.stage]}`);
    const top = topOf(STAGE_TIERS[this.stage]);
    this.tipstar.setPosition(top.rx * 0.5 + 4, top.y - 62).setVisible(this.stage >= 4).setScale(0.7);
    this.layoutWear();
    this.face();
  }

  setWear(worn: Record<Slot, string>): void { this.worn = { ...worn }; this.layoutWear(); }

  private layoutWear(): void {
    const top = topOf(STAGE_TIERS[this.stage]);
    const k = top.rx / 92;
    const h = HAT[this.worn.hat];
    this.hat.setVisible(!!h);
    if (h) {
      this.hat.setTexture(`pp_wear_${this.worn.hat}`).setOrigin(0.5, h.center ? 0.5 : 1).setScale(h.s * k).setPosition((h.dx ?? 0) * k, top.y + h.dy * k);
    }
    this.glasses.setVisible(!!this.worn.eyes);
    if (this.worn.eyes) this.glasses.setTexture(`pp_wear_${this.worn.eyes}`);
    const n = NECK[this.worn.neck];
    this.neck.setVisible(!!n);
    if (n) this.neck.setTexture(`pp_wear_${this.worn.neck}`).setOrigin(0.5, n.oy).setScale(n.s).setPosition(0, n.y);
  }

  setState(mood: Mood, clean: number, asleep: boolean): void {
    this.mood = mood; this.clean = clean; this.asleep = asleep;
    this.dirt.setAlpha(clean >= 60 ? 0 : Math.min(0.9, (60 - clean) / 50));
    if (this.scene.time.now >= this.tempUntil) this.face();
  }

  private face(): void {
    let eyes = 'open', mouth = 'smile';
    if (this.asleep) { eyes = 'blink'; mouth = 'zip'; }
    else if (this.mood === 'sad') { eyes = 'sad'; mouth = 'sad'; }
    else if (this.mood === 'happy') mouth = 'open';
    this.eyes.setTexture(`pp_eyes_${eyes}`);
    this.mouth.setTexture(`pp_mouth_${mouth}`).setVisible(true);
    // il ciuccio è del cucciolo: lo tiene quando è tranquillo
    this.pacifier.setVisible(this.stage === 0 && (this.asleep || this.mood === 'ok'));
    if (this.pacifier.visible) this.mouth.setVisible(false);
  }

  /** Espressione temporanea (poi torna quella dell'umore). */
  express(eyes: string, mouth: string, ms = 900): void {
    this.eyes.setTexture(`pp_eyes_${eyes}`);
    this.mouth.setTexture(`pp_mouth_${mouth}`).setVisible(true);
    this.pacifier.setVisible(false);
    this.tempUntil = this.scene.time.now + ms;
  }

  update(time: number): void {
    if (this.tempUntil && time >= this.tempUntil) { this.tempUntil = 0; this.face(); }
    if (!this.tempUntil && !this.asleep && this.mood !== 'sad' && time > this.nextBlink) {
      this.nextBlink = time + 2200 + Math.random() * 2600;
      this.eyes.setTexture('pp_eyes_blink');
      this.scene.time.delayedCall(130, () => { if (!this.tempUntil && !this.asleep) this.face(); });
    }
    // puzza: lineette verdi che salgono quando è sporco
    const stinky = this.clean < 38 && this.c.visible;
    this.stinks.forEach((s, i) => {
      if (!stinky) { s.setAlpha(0); return; }
      const ph = ((time / 1700) + i / 3) % 1;
      s.setPosition(this.c.x + (i - 1) * 150 * this.base, this.c.y - this.height * (0.75 + ph * 0.5)).setAlpha(Math.sin(ph * Math.PI) * 0.8);
    });
  }

  private pulse(sx: number, sy: number, dur = 120, then?: () => void): void {
    this.busyTween?.stop();
    this.c.setScale(this.base);
    this.busyTween = this.scene.tweens.add({ targets: this.c, scaleX: this.base * sx, scaleY: this.base * sy, duration: dur, yoyo: true, ease: 'Quad.easeOut', onComplete: () => { this.c.setScale(this.base); then?.(); } });
  }

  hop(height = 60, dur = 220): void {
    const y0 = this.shadow.y - 6;
    this.scene.tweens.add({ targets: this.c, y: y0 - height, duration: dur, yoyo: true, ease: 'Quad.easeOut', onComplete: () => { this.c.y = y0; this.pulse(1.08, 0.92, 90); } });
  }

  wave(): void {
    this.scene.tweens.add({ targets: this.arms[1], rotation: -0.7, duration: 140, yoyo: true, repeat: 3, onComplete: () => this.arms[1].setRotation(0.35) });
  }

  giggle(): void {
    this.express('happy', 'grin', 700);
    this.pulse(1.06, 0.95, 90);
    this.wave();
  }

  /** Mangia: bocca aperta, mastica, poi contento. */
  eat(drink: boolean, done?: () => void): void {
    this.express('happy', 'open', 1600);
    this.scene.time.delayedCall(200, () => { this.express('happy', 'chew', 1200); this.pulse(1.05, 0.96, 110); (drink ? sfx.gulp : sfx.chomp)(); });
    this.scene.time.delayedCall(520, () => { this.pulse(1.05, 0.96, 110); (drink ? sfx.gulp : sfx.chomp)(); });
    this.scene.time.delayedCall(900, () => { this.express('happy', 'grin', 600); done?.(); });
    const m = this.mouthPos();
    burst(this.scene, m.x, m.y, 'dot', { count: 8, tints: drink ? [0x8fd3ff, 0xffffff] : [0xffd98a, 0xff9a3c, 0xffffff], speed: [80, 260], scale: [0.5, 0.1], life: 600, depth: this.c.depth + 2 });
  }

  /** Puzzetta: si strizza, nuvolette verdi dal sederino, saltello (quella gigante lo fa decollare). */
  fart(size: number): void {
    this.express('strain', 'o', 380);
    this.pulse(1.12, 0.86, 130, () => {
      this.express('happy', 'grin', 1100);
      if (size >= 2) this.hop(size >= 3 ? 260 : 90, size >= 3 ? 420 : 240);
    });
    sfx.fart(size);
    const n = [0, 3, 6, 14][size] ?? 3;
    const bx = this.c.x - 150 * this.base, by = this.c.y - 40 * this.base;
    const e = this.scene.add.particles(bx, by, size >= 3 ? 'pp_cloud' : 'pp_cloud', {
      speedX: { min: -420 - size * 80, max: -120 }, speedY: { min: -260, max: 40 }, scale: { start: 0.35 + size * 0.14, end: 0.9 + size * 0.25 },
      alpha: { start: 0.95, end: 0 }, lifespan: 900 + size * 250, gravityY: -120, emitting: false,
    }).setDepth(this.c.depth - 1);
    e.explode(n);
    this.scene.time.delayedCall(2200, () => e.destroy());
    if (size >= 3) {
      this.scene.cameras.main.shake(380, 0.012);
      for (const key of ['pp_cloud_y', 'pp_cloud_p']) {
        const e2 = this.scene.add.particles(bx, by, key, { speed: { min: 200, max: 700 }, angle: { min: 150, max: 290 }, scale: { start: 0.4, end: 1.1 }, alpha: { start: 0.9, end: 0 }, lifespan: 1400, gravityY: -100, emitting: false }).setDepth(this.c.depth - 1);
        e2.explode(6);
        this.scene.time.delayedCall(2200, () => e2.destroy());
      }
      burst(this.scene, bx, by, 'star', { count: 10, speed: [300, 700], scale: [0.6, 0.1], life: 1000, depth: this.c.depth + 2 });
    }
  }

  /** Crescita: lampo, si gonfia e cambia forma. */
  grow(stage: number): void {
    const s = this.scene;
    s.tweens.add({ targets: this.c, scaleX: this.base * 1.25, scaleY: this.base * 0.8, duration: 160, yoyo: true, repeat: 2, onComplete: () => {
      this.setStage(stage);
      const from = this.base * 0.6;
      this.c.setScale(from);
      s.tweens.add({ targets: this.c, scaleX: this.base, scaleY: this.base, duration: 500, ease: 'Back.easeOut' });
      this.express('happy', 'grin', 1800);
      const h = this.headPos();
      burst(s, this.c.x, (this.c.y + h.y) / 2, 'star', { count: 22, speed: [300, 800], scale: [0.8, 0.1], life: 1200, depth: this.c.depth + 3 });
      burst(s, this.c.x, (this.c.y + h.y) / 2, 'confetti', { count: 30, tints: [0xff5e9a, 0x36a9f0, 0xffd23a, 0x35c46a], speed: [300, 900], life: 1400, depth: this.c.depth + 3 });
    } });
  }

  destroy(): void { this.c.destroy(); this.shadow.destroy(); this.stinks.forEach((s) => s.destroy()); }
}
