import Phaser from 'phaser';

/**
 * Manina del gesto "tieni premuto" (non c'è ancora in core/: candidata per la regia, serve anche al gioco 7).
 * La mano scende, resta premuta mentre un anello si allarga, poi si solleva; accanto al razzo lampeggiano
 * due frecce verso l'alto (tenere premuto = salire). Nessun testo.
 */
export class HoldHint {
  private hand: Phaser.GameObjects.Image;
  private rings: Phaser.GameObjects.Arc[] = [];
  private arrows: Phaser.GameObjects.Graphics;
  private timer?: Phaser.Time.TimerEvent;
  private tweens: Phaser.Tweens.Tween[] = [];
  /** la mano è "premuta" in questo momento dell'animazione (le frecce si accendono) */
  pressed = false;

  constructor(private scene: Phaser.Scene, depth = 2000) {
    this.hand = scene.add.image(0, 0, 'hand').setOrigin(0.42, 0.04).setVisible(false).setDepth(depth + 1);
    for (let i = 0; i < 2; i++) this.rings.push(scene.add.circle(0, 0, 44).setStrokeStyle(9, 0xffffff, 0.9).setFillStyle().setVisible(false).setDepth(depth));
    this.arrows = scene.add.graphics().setDepth(depth).setVisible(false);
  }

  get visible(): boolean { return this.hand.visible; }

  /** Mostra la manina in (x, y) e le frecce sopra il punto (ax, ay) (il razzo). */
  show(x: number, y: number, ax: number, ay: number): void {
    this.hide();
    const run = () => {
      this.hand.setPosition(x + 10, y + 50).setVisible(true).setAlpha(0).setScale(1);
      this.tweens.push(this.scene.tweens.chain({
        targets: this.hand,
        tweens: [
          { alpha: 1, y: y + 40, duration: 220 },
          {
            y: y + 6, scale: 0.9, duration: 220, ease: 'Quad.easeIn',
            onComplete: () => {
              this.pressed = true;
              this.rings.forEach((r, i) => {
                r.setPosition(x, y).setVisible(true).setScale(0.35).setAlpha(1);
                this.tweens.push(this.scene.tweens.add({ targets: r, scale: 1.5, alpha: 0, duration: 900, delay: i * 450, repeat: 0 }));
              });
            },
          },
          { y: y + 6, duration: 1300 },
          { y: y + 44, scale: 1, duration: 240, ease: 'Quad.easeOut', onStart: () => { this.pressed = false; } },
          { alpha: 0, duration: 220, delay: 200 },
        ],
      }) as unknown as Phaser.Tweens.Tween);
    };
    run();
    this.timer = this.scene.time.addEvent({ delay: 2700, loop: true, callback: run });
    this.arrowsAt(ax, ay);
  }

  /** Aggiorna la posizione delle frecce (il razzo si muove). */
  arrowsAt(ax: number, ay: number): void {
    const g = this.arrows;
    g.clear().setVisible(this.hand.visible);
    if (!this.hand.visible) return;
    const a = this.pressed ? 1 : 0.35;
    for (let k = 0; k < 2; k++) {
      const yy = ay - 120 - k * 46 - (this.pressed ? (this.scene.time.now / 6) % 30 : 0);
      g.lineStyle(14, 0x2b2140, 0.35 * a).beginPath().moveTo(ax - 34, yy + 26).lineTo(ax, yy - 6).lineTo(ax + 34, yy + 26).strokePath();
      g.lineStyle(10, 0xffffff, a).beginPath().moveTo(ax - 34, yy + 22).lineTo(ax, yy - 10).lineTo(ax + 34, yy + 22).strokePath();
    }
  }

  hide(): void {
    this.timer?.remove();
    this.timer = undefined;
    this.tweens.forEach((t) => t.stop());
    this.tweens = [];
    this.pressed = false;
    this.hand.setVisible(false);
    this.rings.forEach((r) => r.setVisible(false));
    this.arrows.clear().setVisible(false);
  }
}
