import Phaser from 'phaser';
import { setupView, button, pin, burst, pulse } from '../../../core/ui';
import { t } from '../../../core/i18n';
import { muteButton, title3d, goTo } from '../../../core/hud';
import { FONT } from '../../../core/brand';
import { ALBUM_MAX, CHARACTERS, unlockedChars, unlockedItems, ITEMS, isComplete, signatureLook } from '../logic';
import { drawAtelier, Doll } from '../world';
import { portrait } from './portrait';
import { save } from '../save';
import { sfx, playAtelierMusic } from '../sfx';

const COLS = [560, 960, 1360];
const ROWS = [395, 715];
const FRAME_SCALE = 0.86;

/**
 * La galleria: gli ultimi 6 ritratti in cornice (si toccano per far fare la giravolta), in basso gli amici
 * dell'atelier (chi deve ancora arrivare è un pacco regalo) e quanti capi ci sono nel guardaroba.
 */
export class Gallery extends Phaser.Scene {
  constructor() { super('atelier:Gallery'); }

  create(): void {
    setupView(this);
    this.cameras.main.fadeIn(250, 143, 211, 255);
    playAtelierMusic();
    drawAtelier(this, { mirror: false, chandeliers: true });
    title3d(this, 960, 110, t('atelier.gallery'), 96);

    const album = save.state.album;
    const dolls: { d: Doll; x: number; y: number }[] = [];
    for (let i = 0; i < ALBUM_MAX; i++) {
      const x = COLS[i % 3], y = ROWS[Math.floor(i / 3)];
      const look = album[i];
      if (look) {
        const pr = portrait(this, x, y, look, 0).setDepth(100);
        this.tweens.add({ targets: pr, scale: FRAME_SCALE, duration: 380, delay: 100 + i * 80, ease: 'Back.easeOut' });
        if (pr.doll) dolls.push({ d: pr.doll, x, y });
      } else {
        const bg = this.add.rectangle(x, y, 294 * FRAME_SCALE, 254 * FRAME_SCALE, 0xfff6ea, 0.85).setDepth(99);
        this.add.image(x, y, 'at_frame').setScale(FRAME_SCALE).setDepth(100).setAlpha(0.75);
        const s = this.add.image(x, y, 'sparkle').setScale(1.2).setAlpha(0.5).setTint(0xe8b84a).setDepth(101);
        this.tweens.add({ targets: s, scale: 1.5, alpha: 0.25, duration: 1200 + i * 90, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
        void bg;
      }
    }

    // gli amici dell'atelier
    const owned = unlockedChars(save.state.shows);
    const heads: { x: number; d?: Doll; g?: Phaser.GameObjects.Image }[] = [];
    CHARACTERS.forEach((c, i) => {
      const x = 960 + (i - 2.5) * 150, y = 1000;
      if (owned.has(c.id)) {
        const d = new Doll(this, signatureLook(c.id, unlockedItems(save.state.shows)), x, 1050, 0.22, { depth: 200 });
        heads.push({ x, d });
      } else {
        heads.push({ x, g: this.add.image(x, y - 10, 'at_gift').setScale(0.5).setDepth(200) });
      }
    });
    // capi nel guardaroba: una stellina e il numero, oppure "completo"
    const n = unlockedItems(save.state.shows).size;
    const star = this.add.image(250, 1000, 'star').setScale(0.8).setDepth(200);
    if (isComplete(save.state.shows)) {
      // guardaroba completo: la stellina brilla
      const g = this.add.image(250, 1000, 'glow').setScale(1.6).setTint(0xffe066).setBlendMode(Phaser.BlendModes.ADD).setDepth(199);
      this.tweens.add({ targets: g, alpha: 0.4, scale: 2, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }
    this.add.text(300, 1000, `${n} / ${ITEMS.length}`, {
      fontFamily: FONT, fontSize: '54px', fontStyle: '700', color: '#ffffff', stroke: '#7a3a52', strokeThickness: 10,
    }).setOrigin(0, 0.5).setDepth(200);
    void star;

    const home = button(this, 0, 0, 'btn_home', () => goTo(this, 'atelier:Menu'), 0.85);
    pin(this, home, 'tl', 80, 80);
    muteButton(this);
    const play = button(this, 0, 0, 'btn_next', () => goTo(this, 'atelier:Pick'), 0.85);
    pin(this, play, 'br', 150, 140);
    pulse(this, play);

    this.input.on('pointerdown', (p: Phaser.Input.Pointer, over: Phaser.GameObjects.GameObject[]) => {
      if (over.length) return;
      const pr = dolls.find((o) => Math.abs(p.worldX - o.x) < 150 && Math.abs(p.worldY - o.y) < 130);
      if (pr) { pr.d.twirl(); sfx.twirl(); burst(this, p.worldX, p.worldY, 'sparkle', { count: 10, tints: [0xffffff, 0xffd04d], speed: [120, 300], scale: [0.6, 0], gravity: 0, life: 600, depth: 900 }); return; }
      const h = heads.find((o) => Math.abs(p.worldX - o.x) < 70 && p.worldY > 880);
      if (h?.d) { h.d.giggle(); sfx.hop(); return; }
      if (h?.g) { sfx.gift(); this.tweens.add({ targets: h.g, x: h.x + 8, duration: 60, yoyo: true, repeat: 3, onComplete: () => h.g?.setX(h.x) }); return; }
      burst(this, p.worldX, p.worldY, 'sparkle', { count: 5, tints: [0xffffff, 0xffc2dc], speed: [80, 200], scale: [0.4, 0], gravity: 0, life: 450 });
    });
  }
}
