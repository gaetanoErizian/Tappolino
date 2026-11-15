import Phaser from 'phaser';
import { setupView, button, pin, burst } from '../../../core/ui';
import { muteButton, goTo } from '../../../core/hud';
import { urlParam } from '../../../core/platform';
import { HintHand } from '../../../core/ui';
import { drawAtelier, pedestal, Doll } from '../world';
import { CHARACTERS, signatureLook, unlockedChars, type CharId } from '../logic';
import { save } from '../save';
import { sfx, playAtelierMusic } from '../sfx';

const ROW_Y = 905;
const SCALE = 0.5;
const xOf = (i: number): number => 960 + (i - 2.5) * 292;

/**
 * Scelta del personaggio: sei pedane in fila. Chi è già arrivato si presenta con il suo stile
 * (principessa, principe, cavaliere…); chi deve ancora arrivare è un pacco regalo.
 */
export class Pick extends Phaser.Scene {
  private dolls: { id: CharId; doll: Doll }[] = [];
  private gifts: { img: Phaser.GameObjects.Image; x: number }[] = [];
  private chosen = false;
  private hint!: HintHand;

  constructor() { super('atelier:Pick'); }

  create(): void {
    this.dolls = [];
    this.gifts = [];
    this.chosen = false;
    setupView(this);
    this.cameras.main.fadeIn(250, 143, 211, 255);
    playAtelierMusic();
    drawAtelier(this, { mirror: true, chandeliers: true });

    const owned = unlockedChars(save.state.shows);
    CHARACTERS.forEach((c, i) => {
      const x = xOf(i);
      pedestal(this, x, ROW_Y + 4, 0.56, 20 + i);
      if (owned.has(c.id)) {
        const d = new Doll(this, signatureLook(c.id), x, ROW_Y, SCALE, { depth: 40 + i });
        d.c.y += 400;
        this.tweens.add({ targets: d.c, y: ROW_Y, duration: 500, delay: 120 + i * 90, ease: 'Back.easeOut', onStart: () => sfx.hop() });
        this.dolls.push({ id: c.id, doll: d });
      } else {
        const g = this.add.image(x, ROW_Y + 12, 'at_gift').setOrigin(0.5, 0.94).setDepth(40 + i).setScale(0);
        this.tweens.add({ targets: g, scale: 0.95, duration: 420, delay: 120 + i * 90, ease: 'Back.easeOut' });
        this.tweens.add({ targets: g, scaleY: 0.9, duration: 900 + i * 70, yoyo: true, repeat: -1, delay: 700, ease: 'Sine.easeInOut' });
        this.gifts.push({ img: g, x });
      }
    });

    const home = button(this, 0, 0, 'btn_home', () => goTo(this, 'atelier:Menu'), 0.85);
    pin(this, home, 'tl', 80, 80);
    muteButton(this);

    this.hint = new HintHand(this);
    if (!save.state.tutorialDone) this.time.delayedCall(1100, () => { if (!this.chosen) this.hint.show(xOf(0), ROW_Y - 240); });

    this.input.on('pointerdown', (p: Phaser.Input.Pointer, over: Phaser.GameObjects.GameObject[]) => {
      if (over.length || this.chosen) return;
      const x = p.worldX, y = p.worldY;
      const hit = this.dolls.find((d) => Math.abs(x - d.doll.c.x) < 140 && y > ROW_Y - 470 && y < ROW_Y + 80);
      if (hit) { this.choose(hit.id, hit.doll); return; }
      const gift = this.gifts.find((g) => Math.abs(x - g.x) < 130 && y > ROW_Y - 260 && y < ROW_Y + 80);
      if (gift) {
        // ancora un regalo: si muove un po', una sorpresa per le prossime sfilate
        sfx.gift();
        this.tweens.add({ targets: gift.img, x: gift.x + 10, duration: 60, yoyo: true, repeat: 3, onComplete: () => gift.img.setX(gift.x) });
        burst(this, gift.x, ROW_Y - 120, 'sparkle', { count: 6, tints: [0xffffff, 0xffd04d], speed: [80, 220], scale: [0.5, 0], gravity: 0, life: 500 });
        return;
      }
      burst(this, x, y, 'sparkle', { count: 5, tints: [0xffffff, 0xffc2dc], speed: [80, 200], scale: [0.4, 0], gravity: 0, life: 450 });
    });
    if (urlParam('debug')) Object.assign(window, { __atp: this });
  }

  /** Tocco su un personaggio: giravolta di gioia, poi tutti nell'atelier. */
  choose(id: CharId, doll?: Doll): void {
    if (this.chosen) return;
    this.chosen = true;
    this.hint.hide();
    const d = doll ?? this.dolls.find((x) => x.id === id)?.doll;
    sfx.choose();
    sfx.twirl();
    d?.twirl();
    if (d) burst(this, d.c.x, ROW_Y - 220, 'sparkle', { count: 16, tints: [0xffffff, 0xffd04d, 0xff9cc6], speed: [180, 420], scale: [0.8, 0], gravity: 0, life: 800, depth: 900 });
    this.dolls.filter((x) => x.id !== id).forEach((x, i) => this.tweens.add({ targets: x.doll.c, alpha: 0.4, duration: 300, delay: i * 30 }));
    this.time.delayedCall(850, () => goTo(this, 'atelier:Dress', { char: id }));
  }
}
