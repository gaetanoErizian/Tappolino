import Phaser from 'phaser';
import { setupView, button, pin, burst, view } from '../core/ui';
import { muteButton, title } from '../core/hud';
import { t } from '../core/i18n';
import { isUnlocked, isMuted, onUnlockChange } from '../core/appState';
import { canPlay, type GameEntry } from '../core/module';
import { GAMES } from '../games/registry';
import { launchGame, isForcedLocked } from '../launcher';
import { openParents } from '../app';
import { hubSfx } from './sfx';

const PER_PAGE = 4;
const GROUND = 880;

/** Menu dei giochi Tappolino: tessere 2.5D, lucchetti sui giochi bloccati, area genitori. */
export class Hub extends Phaser.Scene {
  private page = 0;
  private cards: Phaser.GameObjects.GameObject[] = [];
  private busy = false;

  constructor() { super('Hub'); }

  create(): void {
    this.busy = false;
    this.cards = [];
    setupView(this);
    this.cameras.main.fadeIn(250, 143, 211, 255);
    this.drawBackdrop();

    const logo = this.logo();
    this.tweens.add({ targets: logo, scale: 1.04, duration: 1500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    const mute = muteButton(this);
    const lock = button(this, 0, 0, 'btn_lock', () => openParents(this, () => mute.setTexture(isMuted() ? 'btn_sound_off' : 'btn_sound_on')), 0.9);
    pin(this, lock, 'tl', 70, 70);

    this.drawPage();
    if (GAMES.length > PER_PAGE) this.pager();

    // Se l'acquisto arriva mentre il menu è aperto, i lucchetti spariscono subito.
    const off = onUnlockChange(() => this.drawPage());
    this.events.once('shutdown', off);
  }

  private drawBackdrop(): void {
    const g = this.add.graphics().setDepth(0);
    g.fillGradientStyle(0x4fb3f2, 0x6cc4f7, 0xd4f0ff, 0xe2f5ff, 1).fillRect(-2000, -1600, 5920, 2600);
    const sun = this.add.image(250, 210, 'sun').setDepth(1);
    this.tweens.add({ targets: sun, scale: 1.06, duration: 2200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    for (let i = 0; i < 5; i++) {
      const far = i < 2;
      const c = this.add.image(-200 + i * 560, far ? 330 : 120 + (i % 2) * 100, 'cloud').setDepth(far ? 1.5 : 2.5)
        .setAlpha(far ? 0.6 : 0.95).setScale(far ? 0.45 : 0.7);
      this.tweens.add({ targets: c, x: c.x + 2600, duration: (far ? 200000 : 110000) + i * 7000, repeat: -1, onRepeat: () => { c.x = -1200; } });
    }
    const far = this.add.tileSprite(-2000, 760, 5920, 320, 'hub_hills_far').setOrigin(0, 1).setDepth(3);
    const mid = this.add.tileSprite(-2000, 900, 5920, 280, 'hub_hills_mid').setOrigin(0, 1).setDepth(4);
    const ground = this.add.graphics().setDepth(5);
    ground.fillGradientStyle(0x8fd977, 0x8fd977, 0x4c9c44, 0x4c9c44, 1).fillRect(-2000, GROUND - 20, 5920, 1400);
    const fgL = this.add.image(60, 1120, 'hub_grass_fg').setOrigin(0.5, 1).setScale(1.3).setDepth(800);
    const fgR = this.add.image(1860, 1120, 'hub_grass_fg').setOrigin(0.5, 1).setScale(1.3).setFlipX(true).setDepth(800);
    // parallasse d'ingresso
    ([[far, 40], [mid, 90], [fgL, 240], [fgR, 240]] as const).forEach(([o, dx]) => {
      const x = o.x;
      o.x += dx;
      this.tweens.add({ targets: o, x, duration: 1400, ease: 'Cubic.easeOut' });
    });
  }

  private logo(): Phaser.GameObjects.Text {
    const txt = title(this, 960, 150, t('app.title'), 150);
    const grad = txt.context.createLinearGradient(0, 0, txt.width, 0);
    ['#ff6b6b', '#ffb02e', '#ffe14d', '#5ed06a', '#4fb3f7', '#a97cf2'].forEach((c, i, a) => grad.addColorStop(i / (a.length - 1), c));
    txt.setFill(grad);
    return txt;
  }

  private drawPage(): void {
    this.cards.forEach((c) => c.destroy());
    this.cards = [];
    const games = GAMES.slice(this.page * PER_PAGE, this.page * PER_PAGE + PER_PAGE);
    const gap = 490;
    const x0 = 960 - ((games.length - 1) * gap) / 2;
    games.forEach((g, i) => this.card(g, x0 + i * gap, 560, i));
  }

  private card(g: GameEntry, x: number, y: number, i: number): void {
    const locked = !canPlay(g, isUnlocked()) || isForcedLocked();
    const shadow = this.add.image(x, y + 250, 'shadow').setScale(2.1, 0.7).setDepth(9).setAlpha(0.8);
    const frame = this.add.image(x, y, 'hub_card').setDepth(10);
    const art = this.add.image(x, y - 34, `tile_${g.id}`).setDepth(11);
    const label = this.add.text(x, y + 150, t(g.titleKey), {
      fontFamily: '"Trebuchet MS", "Arial Rounded MT Bold", Verdana, sans-serif', fontSize: '40px', fontStyle: 'bold',
      color: '#3a2a52', align: 'center', wordWrap: { width: 380 },
    }).setOrigin(0.5).setDepth(12);
    const parts: Phaser.GameObjects.GameObject[] = [shadow, frame, art, label];
    let lockImg: Phaser.GameObjects.Image | null = null;
    if (locked) {
      art.setTint(0x8a93ab);
      lockImg = this.add.image(x + 150, y - 150, 'hub_lock').setScale(0.8).setDepth(13);
      parts.push(lockImg);
    }
    this.cards.push(...parts);

    // Leggero dondolio sfasato; l'ombra si stringe e schiarisce quando la tessera sale.
    const bob = [frame, art, label, ...(lockImg ? [lockImg] : [])];
    this.tweens.add({ targets: bob, y: '-=10', duration: 1300, yoyo: true, repeat: -1, ease: 'Sine.easeInOut', delay: i * 260 });
    this.tweens.add({ targets: shadow, scaleX: 1.9, alpha: 0.6, duration: 1300, yoyo: true, repeat: -1, ease: 'Sine.easeInOut', delay: i * 260 });

    frame.setInteractive({ useHandCursor: true });
    frame.on('pointerdown', () => {
      if (this.busy) return;
      if (locked) {
        hubSfx.locked();
        this.tweens.add({ targets: lockImg, scale: 0.95, duration: 90, yoyo: true, repeat: 1 });
        this.tweens.add({ targets: bob, x: '+=10', duration: 50, yoyo: true, repeat: 3 });
        this.busy = true;
        void launchGame(this, g).finally(() => { this.busy = false; });
        return;
      }
      this.busy = true;
      hubSfx.open();
      burst(this, x, y - 40, 'sparkle', { count: 14, tints: [0xffffff, 0xffe066], gravity: 0, life: 600 });
      this.tweens.add({
        targets: bob, scale: '*=1.06', duration: 110, yoyo: true,
        onComplete: () => { void launchGame(this, g).finally(() => { this.busy = false; }); },
      });
    });
  }

  /** Frecce per scorrere le pagine quando i giochi sono più di 4. */
  private pager(): void {
    const pages = Math.ceil(GAMES.length / PER_PAGE);
    const go = (d: number) => { this.page = (this.page + d + pages) % pages; this.drawPage(); };
    const l = button(this, 0, 560, 'btn_back', () => go(-1), 0.9);
    const r = button(this, 0, 560, 'btn_next', () => go(1), 0.62);
    const place = () => { const v = view(this); l.x = Math.max(v.left + 90, 90); r.x = Math.min(v.right - 90, 1830); };
    place();
    this.scale.on('resize', place);
    this.events.once('shutdown', () => this.scale.off('resize', place));
  }
}
