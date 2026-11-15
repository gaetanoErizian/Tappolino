import Phaser from 'phaser';
import { setupView, button, pulse, burst, view, pin } from '../../../core/ui';
import { HintHand } from '../../../core/ui';
import { urlParam } from '../../../core/platform';
import { t } from '../../../core/i18n';
import { muteButton, title3d, goTo } from '../../../core/hud';
import { addToAlbum, charById, rewardFor, sanitizeLook, emptyLook, type Look, type Reward } from '../logic';
import { PART_BOX } from '../dollArt';
import { drawBackdrop, Doll, STAGE_Y } from '../world';
import { portrait } from './portrait';
import { save } from '../save';
import { sfx, playAtelierMusic } from '../sfx';

const GALLERY_BTN = { dx: 150, dy: 150 };
const STAGE_X = 760;

/**
 * La sfilata: il personaggio arriva nello sfondo scelto (castello, bosco, festa), fa la giravolta tra coriandoli
 * e applausi; un lampo e il ritratto in cornice vola nella galleria. Poi il pacco regalo con la sorpresa
 * sbloccata (un capo nuovo o un nuovo amico).
 */
export class Show extends Phaser.Scene {
  private doll!: Doll;
  private reward: Reward | null = null;
  private gift?: Phaser.GameObjects.Image;
  private opened = false;
  private hint!: HintHand;
  /** la sfilata è finita e il regalo (se c'è) è aperto */
  done = false;

  constructor() { super('atelier:Show'); }

  create(data: { look?: Look }): void {
    const look = sanitizeLook(data?.look) ?? emptyLook('lia');
    const bg = look.bg ?? 'castle';
    this.opened = false;
    this.done = false;
    this.gift = undefined;
    // la sfilata conta subito: sorpresa, galleria e ultimo look
    this.reward = rewardFor(save.state.shows);
    save.update({ shows: save.state.shows + 1, album: addToAlbum(save.state.album, { ...look, bg }), last: { ...look, bg }, tutorialDone: true });

    setupView(this);
    this.cameras.main.fadeIn(250, 143, 211, 255);
    playAtelierMusic();
    drawBackdrop(this, bg);
    this.hint = new HintHand(this);

    const x0 = this.reward ? STAGE_X : 960;
    this.doll = new Doll(this, look, 2250, STAGE_Y + 220, 0.92, { depth: 50 });
    muteButton(this);
    const home = button(this, 0, 0, 'btn_home', () => goTo(this, 'atelier:Menu'), 0.85);
    pin(this, home, 'tl', 80, 80);
    const gal = button(this, 0, 0, 'at_btn_gallery', () => goTo(this, 'atelier:Gallery'), 0.8);
    pin(this, gal, 'bl', GALLERY_BTN.dx, GALLERY_BTN.dy);

    // passerella: entra a piccoli passi
    const steps = this.time.addEvent({ delay: 330, repeat: 5, callback: () => sfx.step() });
    this.doll.walkTo(x0, 2000, () => {
      steps.remove();
      sfx.fanfare();
      this.doll.twirl(() => this.doll.face('happy', 'smile', 1500));
      this.cheer(x0);
      this.time.delayedCall(1300, () => this.snapshot(look, gal));
    });

    this.input.on('pointerdown', (p: Phaser.Input.Pointer, over: Phaser.GameObjects.GameObject[]) => {
      if (over.length) return;
      if (this.gift && !this.opened && Phaser.Math.Distance.Between(p.worldX, p.worldY, this.gift.x, this.gift.y - 90) < 170) { this.openGift(); return; }
      if (this.doll.hit(p.worldX, p.worldY)) {
        this.doll.twirl();
        sfx.twirl();
        burst(this, p.worldX, p.worldY - 40, 'heart', { count: 6, speed: [150, 350], scale: [0.6, 0.2], gravity: 200, life: 900, depth: 700 });
        return;
      }
      burst(this, p.worldX, p.worldY, 'sparkle', { count: 5, tints: [0xffffff, 0xffd04d], speed: [80, 200], scale: [0.4, 0], gravity: 0, life: 450 });
    });
    if (urlParam('debug')) Object.assign(window, { __ats: this });
  }

  /** Applausi, coriandoli e il titolo. */
  private cheer(x: number): void {
    sfx.applause();
    const ttl = title3d(this, x, 130, t('atelier.bravo'), 110).setScale(0);
    this.tweens.add({ targets: ttl, scale: 1, duration: 420, delay: 150, ease: 'Back.easeOut' });
    for (let i = 0; i < 5; i++) {
      this.time.delayedCall(i * 260, () => burst(this, 260 + Math.random() * 1400, 100, 'confetti', {
        count: 18, tints: [0xff8cc6, 0xffd04d, 0xee6fa8, 0x8fd3ff, 0xb58cf0, 0xffffff], speed: [250, 700], scale: [1.3, 0.6], life: 1700, gravity: 800,
      }));
    }
    // scintille ai lati del personaggio (mai sul viso)
    for (const dx of [-230, 230]) burst(this, x + dx, STAGE_Y - 260, 'sparkle', { count: 12, tints: [0xffffff, 0xffd04d, 0xff9cc6], speed: [150, 420], scale: [0.9, 0], gravity: 0, life: 900, depth: 900 });
  }

  /** Lampo e ritratto in cornice che vola nella galleria. */
  private snapshot(look: Look, gal: Phaser.GameObjects.Image): void {
    sfx.flash();
    const v = view(this);
    const flash = this.add.rectangle(v.left, v.top, v.right - v.left, v.bottom - v.top, 0xffffff, 1).setOrigin(0).setDepth(1800);
    this.tweens.add({ targets: flash, alpha: 0, duration: 450, onComplete: () => flash.destroy() });
    const pr = portrait(this, 1330, 470, look, 1.15).setDepth(1200).setScale(0);
    this.tweens.chain({
      targets: pr,
      tweens: [
        { scale: 1.15, duration: 420, ease: 'Back.easeOut' },
        { scale: 1.15, duration: 1000 },
        { x: gal.x, y: gal.y, scale: 0.1, alpha: 0.6, duration: 620, ease: 'Cubic.easeIn' },
      ],
      onComplete: () => {
        pr.destroy(true);
        sfx.sparkle();
        this.tweens.add({ targets: gal, scale: 0.92, duration: 140, yoyo: true });
        burst(this, gal.x, gal.y, 'star', { count: 8, speed: [150, 350], scale: [0.5, 0.1], gravity: 300, life: 800, depth: 1300 });
        if (this.reward) this.time.delayedCall(300, () => this.dropGift());
        else this.finish();
      },
    });
  }

  // =================================================================
  // La sorpresa
  // =================================================================
  private dropGift(): void {
    const g = this.add.image(1400, -200, 'at_gift').setOrigin(0.5, 0.94).setDepth(60).setScale(1.25);
    this.gift = g;
    sfx.gift();
    this.tweens.add({
      targets: g, y: STAGE_Y + 150, duration: 600, ease: 'Bounce.easeOut',
      onComplete: () => {
        this.tweens.add({ targets: g, scaleX: 1.32, scaleY: 1.18, duration: 380, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
        this.time.delayedCall(900, () => { if (!this.opened) this.hint.show(g.x, g.y - 110); });
      },
    });
  }

  openGift(): void {
    if (!this.gift || this.opened || !this.reward) return;
    this.opened = true;
    this.hint.hide();
    const g = this.gift;
    const r = this.reward;
    this.tweens.killTweensOf(g);
    sfx.open();
    const at = { x: g.x, y: g.y - 120 };
    this.tweens.add({ targets: g, scale: 1.6, alpha: 0, duration: 320, ease: 'Back.easeIn', onComplete: () => g.destroy() });
    const glow = this.add.image(at.x, at.y, 'glow').setScale(5).setAlpha(0).setTint(0xfff3c4).setBlendMode(Phaser.BlendModes.ADD).setDepth(55);
    this.tweens.add({ targets: glow, alpha: 0.9, duration: 300, yoyo: true, hold: 700 });
    burst(this, at.x, at.y, 'star', { count: 16, speed: [250, 600], scale: [0.7, 0.2], gravity: 500, life: 1200, depth: 900 });
    burst(this, at.x, at.y, 'confetti', { count: 24, tints: [0xff8cc6, 0xffd04d, 0xee6fa8, 0x8fd3ff], speed: [250, 650], scale: [1.2, 0.5], life: 1400, gravity: 800, depth: 900 });

    let label: string;
    if (r.kind === 'item') {
      const key = `at_item_${r.id}`;
      const [, , w, h] = PART_BOX[key];
      const s = Math.min(380 / w, 420 / h, 1.4);
      const im = this.add.image(at.x, at.y - 40, key).setDepth(70).setScale(0);
      this.tweens.add({ targets: im, scale: s, duration: 520, delay: 200, ease: 'Back.easeOut' });
      this.tweens.add({ targets: im, y: im.y - 16, duration: 1200, yoyo: true, repeat: -1, delay: 800, ease: 'Sine.easeInOut' });
      label = t('atelier.new.item');
    } else {
      const d = new Doll(this, { char: r.id }, at.x, STAGE_Y + 150, 0.62, { depth: 70 });
      d.c.setScale(0);
      this.tweens.add({ targets: d.c, scale: 0.62, duration: 520, delay: 200, ease: 'Back.easeOut', onComplete: () => d.giggle() });
      label = t(charById(r.id).girl ? 'atelier.new.char.f' : 'atelier.new.char.m');
    }
    const ttl = title3d(this, at.x, 300, label, 76).setScale(0).setDepth(950);
    this.tweens.add({ targets: ttl, scale: 1, duration: 380, delay: 350, ease: 'Back.easeOut' });
    this.time.delayedCall(900, () => this.finish());
  }

  private finish(): void {
    if (this.done) return;
    this.done = true;
    const next = button(this, 0, 0, 'btn_next', () => goTo(this, 'atelier:Pick'), 1).setAlpha(0);
    pin(this, next, 'br', 170, 150);
    this.tweens.add({ targets: next, alpha: 1, duration: 300, onComplete: () => pulse(this, next) });
  }
}
