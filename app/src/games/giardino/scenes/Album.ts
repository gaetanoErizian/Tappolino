import Phaser from 'phaser';
import { setupView, button, pin, burst } from '../../../core/ui';
import { t } from '../../../core/i18n';
import { muteButton, title3d, goTo } from '../../../core/hud';
import { FONT } from '../../../core/brand';
import { FAIRY_IDS, FLOWER_IDS, TOTAL_PLOTS, bloomCount, currentBed, discoveredFlowers, fairiesFor, flowerById, type FairyId, type FlowerId } from '../logic';
import { drawMeadow, floatingLabel, hex } from '../world';
import { save } from '../save';
import { sfx, playGiardinoMusic } from '../sfx';

interface Card { x: number; y: number; img: Phaser.GameObjects.Image; card: Phaser.GameObjects.Image; kind: 'flower' | 'fairy'; id: string; known: boolean }

/** Album della collezione: gli 8 fiori magici e le 6 fatine. Quelli non ancora trovati sono ombre da scoprire. */
export class Album extends Phaser.Scene {
  private cards: Card[] = [];

  constructor() { super('giardino:Album'); }

  create(): void {
    this.cards = [];
    setupView(this);
    this.cameras.main.fadeIn(250, 143, 211, 255);
    playGiardinoMusic();
    const g = save.state.garden;
    drawMeadow(this, currentBed(g));
    // velo chiaro: i cartoncini si leggono meglio sul prato
    this.add.rectangle(960, 600, 4000, 2400, 0xffffff, 0.28).setDepth(5);
    title3d(this, 960, 110, t('giardino.album'), 96);

    const known = new Set<string>(discoveredFlowers(g));
    FLOWER_IDS.forEach((id, i) => {
      const x = 960 + (i - 3.5) * 212, y = 410;
      this.addCard(x, y, 'flower', id, known.has(id));
    });
    const nf = fairiesFor(bloomCount(g));
    FAIRY_IDS.forEach((id, i) => {
      const x = 960 + (i - 2.5) * 230, y = 735;
      this.addCard(x, y, 'fairy', id, i < nf);
    });

    this.add.text(960, 1000, t('giardino.count', { n: bloomCount(g), tot: TOTAL_PLOTS }), {
      fontFamily: FONT, fontSize: '44px', fontStyle: '700', color: '#ffffff', stroke: '#3f8a34', strokeThickness: 8,
    }).setOrigin(0.5).setDepth(900);

    muteButton(this);
    const home = button(this, 0, 0, 'btn_home', () => goTo(this, 'giardino:Menu'), 0.85);
    pin(this, home, 'tl', 80, 80);

    this.input.on('pointerdown', (p: Phaser.Input.Pointer, over: Phaser.GameObjects.GameObject[]) => {
      if (over.length) return;
      const c = this.cards.find((k) => Math.abs(p.worldX - k.x) < 100 && Math.abs(p.worldY - k.y) < 120);
      if (c) { this.tapCard(c); return; }
      burst(this, p.worldX, p.worldY, 'sparkle', { count: 6, tints: [0xffffff, 0xd6f7b0], speed: [80, 220], scale: [0.45, 0], gravity: 0, life: 500, depth: 760 });
    });
  }

  private addCard(x: number, y: number, kind: Card['kind'], id: string, known: boolean): void {
    const card = this.add.image(x, y, 'gi_card').setScale(0.88).setDepth(10);
    const img = kind === 'flower'
      ? this.add.image(x, y + 96, `gi_fl_${id}`).setOrigin(0.5, 1).setScale(0.46).setDepth(11)
      : this.add.image(x, y + 4, `gi_fairy_${id}`).setScale(0.8).setDepth(11);
    if (!known) img.setTint(0x6f8f6a).setAlpha(0.35);
    else if (kind === 'flower') {
      const gl = this.add.image(x, y - 34, 'glow').setScale(1.2).setTint(hex(flowerById(id as FlowerId).glow)).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0.45).setDepth(10.5);
      this.tweens.add({ targets: gl, alpha: 0.2, duration: 1500 + x, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }
    this.cards.push({ x, y, img, card, kind, id, known });
  }

  private tapCard(c: Card): void {
    const s = c.card.scale;
    this.tweens.add({ targets: c.card, scale: s * 1.08, duration: 90, yoyo: true });
    if (!c.known) { sfx.pop(); return; }
    const is = c.img.scale;
    this.tweens.add({ targets: c.img, scaleX: is * 1.15, scaleY: is * 0.92, duration: 110, yoyo: true });
    if (c.kind === 'flower') sfx.sing(c.id as FlowerId); else sfx.giggle();
    burst(this, c.x, c.y - 40, 'sparkle', { count: 10, tints: [0xffffff, 0xfff3a0], speed: [100, 260], scale: [0.5, 0], gravity: 0, life: 600, depth: 760 });
    const key = c.kind === 'flower' ? `giardino.flower.${c.id as FlowerId}` : `giardino.fairy.${c.id as FairyId}`;
    floatingLabel(this, c.x, c.y - 150, t(key), FONT, c.kind === 'flower' ? '#4f9e3a' : '#7d55c8');
  }

  get knownCount(): number { return this.cards.filter((c) => c.known).length; }
}
