import Phaser from 'phaser';

/**
 * Trascinamento e manina d'aiuto (nati in Pasticceria Magica, decisione 17).
 *
 * DragManager: un solo listener di scena; al tocco prende l'oggetto trascinabile più vicino al dito
 * entro un raggio ampio (dita piccole), lo solleva e lo segue con una scia di scintille. Al rilascio
 * chiama onDrop: se il gioco lo accetta l'oggetto resta dov'è, altrimenti torna al suo posto con un
 * rimbalzo. Un tocco senza movimento chiama onTap (azione semplice per i più piccoli).
 * Usa le texture comuni 'sparkle' e 'hand'.
 *
 * Hint: manina che mostra il gesto (tocco, trascinamento da A a B, movimento circolare), senza testi.
 * Per il solo tocco c'è anche HintHand in core/ui.
 */

export interface DragItem {
  obj: Phaser.GameObjects.Image;
  id: string;
  homeX: number;
  homeY: number;
  baseScale: number;
  /** profondità a riposo (ripristinata quando l'oggetto torna al suo posto) */
  baseDepth: number;
  shadow?: Phaser.GameObjects.Image;
  enabled: boolean;
}

export interface DragHandlers {
  /** true = accettato (l'oggetto non torna a casa da solo) */
  onDrop: (item: DragItem, x: number, y: number) => boolean;
  /** tocco senza trascinamento */
  onTap?: (item: DragItem) => void;
  onPick?: (item: DragItem) => void;
}

export class DragManager {
  items: DragItem[] = [];
  enabled = true;
  private cur: DragItem | null = null;
  private off = { x: 0, y: 0 };
  private start = { x: 0, y: 0 };
  private moved = 0;
  private trail: Phaser.GameObjects.Particles.ParticleEmitter;

  constructor(private scene: Phaser.Scene, private h: DragHandlers, private radius = 170) {
    this.trail = scene.add.particles(0, 0, 'sparkle', {
      speed: { min: 10, max: 60 }, scale: { start: 0.45, end: 0 }, lifespan: 500, frequency: 50,
      tint: [0xffffff, 0xffe066, 0xffb3d9], emitting: false,
    }).setDepth(1490);
    scene.input.on('pointerdown', this.down, this);
    scene.input.on('pointermove', this.move, this);
    scene.input.on('pointerup', this.up, this);
    scene.input.on('pointerupoutside', this.up, this);
    scene.events.once('shutdown', () => {
      scene.input.off('pointerdown', this.down, this);
      scene.input.off('pointermove', this.move, this);
      scene.input.off('pointerup', this.up, this);
      scene.input.off('pointerupoutside', this.up, this);
    });
  }

  add(obj: Phaser.GameObjects.Image, id: string, shadow?: Phaser.GameObjects.Image): DragItem {
    const it: DragItem = { obj, id, homeX: obj.x, homeY: obj.y, baseScale: obj.scaleX, baseDepth: obj.depth, shadow, enabled: true };
    this.items.push(it);
    return it;
  }

  clear(): void { this.items = []; this.cur = null; this.trail.stop(); }

  get dragging(): boolean { return this.cur !== null; }

  private down(p: Phaser.Input.Pointer, over: Phaser.GameObjects.GameObject[]): void {
    if (!this.enabled || over.length || this.cur) return;
    let best: DragItem | null = null;
    let bd = this.radius;
    for (const it of this.items) {
      if (!it.enabled) continue;
      // centro visivo dell'oggetto (l'origine può essere in basso)
      const cy = it.obj.y - (it.obj.originY - 0.5) * it.obj.displayHeight;
      const d = Phaser.Math.Distance.Between(p.worldX, p.worldY, it.obj.x, cy);
      if (d < bd) { bd = d; best = it; }
    }
    if (!best) return;
    this.cur = best;
    this.off = { x: best.obj.x - p.worldX, y: best.obj.y - p.worldY };
    this.start = { x: p.worldX, y: p.worldY };
    this.moved = 0;
    this.scene.tweens.killTweensOf(best.obj);
    best.obj.setDepth(1400);
    this.scene.tweens.add({ targets: best.obj, scale: best.baseScale * 1.12, duration: 120, ease: 'Quad.easeOut' });
    if (best.shadow) this.scene.tweens.add({ targets: best.shadow, alpha: 0.25, duration: 120 });
    this.h.onPick?.(best);
  }

  private move(p: Phaser.Input.Pointer): void {
    if (!this.cur || !p.isDown) return;
    this.cur.obj.setPosition(p.worldX + this.off.x, p.worldY + this.off.y);
    this.moved = Math.max(this.moved, Phaser.Math.Distance.Between(p.worldX, p.worldY, this.start.x, this.start.y));
    if (this.moved > 30) { this.trail.setPosition(p.worldX, p.worldY); if (!this.trail.emitting) this.trail.start(); }
  }

  private up(p: Phaser.Input.Pointer): void {
    const it = this.cur;
    if (!it) return;
    this.cur = null;
    this.trail.stop();
    if (this.moved < 30 && this.h.onTap) {
      this.home(it, true);
      this.h.onTap(it);
      return;
    }
    if (!this.h.onDrop(it, p.worldX, p.worldY)) this.home(it);
  }

  /** Riporta l'oggetto al suo posto (rimbalzo). */
  home(it: DragItem, instant = false): void {
    it.obj.setDepth(it.baseDepth);
    if (it.shadow) this.scene.tweens.add({ targets: it.shadow, alpha: 0.8, duration: 200 });
    if (instant) { it.obj.setPosition(it.homeX, it.homeY).setScale(it.baseScale); return; }
    this.scene.tweens.add({ targets: it.obj, x: it.homeX, y: it.homeY, scale: it.baseScale, duration: 380, ease: 'Back.easeOut' });
  }
}

export class Hint {
  private hand: Phaser.GameObjects.Image;
  private timer?: Phaser.Time.TimerEvent;
  private tweens: Phaser.Tweens.Tween[] = [];

  constructor(private scene: Phaser.Scene) {
    this.hand = scene.add.image(0, 0, 'hand').setOrigin(0.42, 0.04).setVisible(false).setDepth(2001);
  }

  get visible(): boolean { return this.hand.visible; }

  drag(x1: number, y1: number, x2: number, y2: number): void {
    this.hide();
    const run = () => {
      this.hand.setPosition(x1, y1).setVisible(true).setAlpha(0).setScale(1);
      this.tweens.push(this.scene.tweens.chain({
        targets: this.hand,
        tweens: [
          { alpha: 1, duration: 200 },
          { scale: 0.85, duration: 150 },
          { x: x2, y: y2, duration: 900, ease: 'Sine.easeInOut' },
          { scale: 1, duration: 150 },
          { alpha: 0, duration: 250, delay: 150 },
        ],
      }) as unknown as Phaser.Tweens.Tween);
    };
    run();
    this.timer = this.scene.time.addEvent({ delay: 2200, loop: true, callback: run });
  }

  tap(x: number, y: number): void {
    this.hide();
    this.hand.setPosition(x, y + 20).setVisible(true).setAlpha(1).setScale(1);
    this.tweens.push(this.scene.tweens.add({ targets: this.hand, y: y - 6, scale: 0.88, duration: 320, yoyo: true, repeat: -1, ease: 'Quad.easeInOut' }));
  }

  circle(cx: number, cy: number, rx: number, ry: number): void {
    this.hide();
    this.hand.setVisible(true).setAlpha(1).setScale(0.9);
    const st = { a: 0 };
    this.tweens.push(this.scene.tweens.add({
      targets: st, a: Math.PI * 2, duration: 1300, repeat: -1,
      onUpdate: () => this.hand.setPosition(cx + Math.cos(st.a) * rx, cy + Math.sin(st.a) * ry),
    }));
  }

  hide(): void {
    this.timer?.remove();
    this.timer = undefined;
    this.tweens.forEach((t) => t.stop());
    this.tweens = [];
    this.hand.setVisible(false);
  }
}
