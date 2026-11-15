import Phaser from 'phaser';
import { setupView, button, pin, burst } from '../core/ui';
import { muteButton } from '../core/hud';
import { FONT } from '../core/brand';
import { t } from '../core/i18n';
import { isUnlocked, isMuted, onUnlockChange } from '../core/appState';
import { canPlay, type GameEntry } from '../core/module';
import { GAMES } from '../games/registry';
import { launchGame, isForcedLocked } from '../launcher';
import { openParents } from '../app';
import { isComingSoon, menuGames } from '../release';
import { hubSfx } from './sfx';

const PER_PAGE = 4;
const GROUND = 880;

/** Menu dei giochi Tappolino: tessere 2.5D, lucchetti sui giochi bloccati, area genitori. */
export class Hub extends Phaser.Scene {
  private page = 0;
  private cards: Phaser.GameObjects.GameObject[] = [];
  private pagerParts: Phaser.GameObjects.GameObject[] = [];
  private busy = false;

  constructor() { super('Hub'); }

  create(): void {
    this.busy = false;
    this.cards = [];
    this.pagerParts = [];
    setupView(this);
    this.cameras.main.fadeIn(250, 143, 211, 255);
    this.drawBackdrop();

    const logo = this.logo();
    this.tweens.add({ targets: logo, scale: 0.72, duration: 1500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    const mute = muteButton(this);
    const lock = button(this, 0, 0, 'btn_lock', () => openParents(this, () => mute.setTexture(isMuted() ? 'btn_sound_off' : 'btn_sound_on')), 0.9);
    pin(this, lock, 'tl', 70, 70);

    this.refresh();

    // Se l'acquisto arriva mentre il menu è aperto, i lucchetti spariscono subito.
    const off = onUnlockChange(() => this.refresh());
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

  /** Il marchio Tappolino (mascotte + scritta); toccandolo Tappo fa un saltello. */
  private logo(): Phaser.GameObjects.Image {
    const img = this.add.image(960, 162, 'brand_logo').setScale(0.7).setDepth(900);
    img.setInteractive({ useHandCursor: true });
    let hopping = false;
    img.on('pointerdown', () => {
      if (hopping) return;
      hopping = true;
      hubSfx.pop();
      burst(this, 960 - 290, 150, 'sparkle', { count: 10, tints: [0xffd23f, 0xff5e9a, 0x36a9f0], gravity: 0, life: 500 });
      this.tweens.add({ targets: img, y: 134, duration: 140, yoyo: true, ease: 'Quad.easeOut', onComplete: () => { hopping = false; } });
    });
    return img;
  }

  /** Ridisegna tessere e frecce: l'elenco dei giochi visibili può cambiare (acquisto, modalità prova). */
  private refresh(): void {
    const pages = Math.max(1, Math.ceil(menuGames(GAMES).length / PER_PAGE));
    this.page = Math.min(this.page, pages - 1);
    this.drawPage();
    this.pager(pages);
  }

  private drawPage(): void {
    this.cards.forEach((c) => c.destroy());
    this.cards = [];
    const games = menuGames(GAMES).slice(this.page * PER_PAGE, this.page * PER_PAGE + PER_PAGE);
    const gap = 490;
    const x0 = 960 - ((games.length - 1) * gap) / 2;
    games.forEach((g, i) => this.card(g, x0 + i * gap, 560, i));
  }

  private card(g: GameEntry, x: number, y: number, i: number): void {
    const soon = isComingSoon(g.id);
    const locked = !soon && (!canPlay(g, isUnlocked()) || isForcedLocked());
    const shadow = this.add.image(x, y + 250, 'shadow').setScale(2.1, 0.7).setDepth(9).setAlpha(0.8);
    const frame = this.add.image(x, y, 'hub_card').setDepth(10);
    const art = this.add.image(x, y - 34, `tile_${g.id}`).setDepth(11);
    const label = this.add.text(x, y + 150, t(g.titleKey), {
      fontFamily: FONT, fontSize: '42px', fontStyle: '600',
      color: '#3a2a52', align: 'center', wordWrap: { width: 380 },
    }).setOrigin(0.5).setDepth(12);
    const parts: Phaser.GameObjects.GameObject[] = [shadow, frame, art, label];
    let lockImg: Phaser.GameObjects.Image | null = null;
    if (locked) {
      art.setTint(0x8a93ab);
      lockImg = this.add.image(x + 150, y - 150, 'hub_lock').setScale(0.8).setDepth(13);
      parts.push(lockImg);
    }
    // Gioco "in arrivo" (decisione 24): nastro al posto del lucchetto, non si apre e non porta all'offerta.
    const ribbon: Phaser.GameObjects.GameObject[] = [];
    if (soon) {
      art.setTint(0xa9b6d6);
      const band = this.add.image(x, y + 62, 'hub_soon').setDepth(13);
      const txt = this.add.text(x, y + 58, t('hub.comingSoon'), {
        fontFamily: FONT, fontSize: '40px', fontStyle: '700', color: '#ffffff', stroke: '#2b2140', strokeThickness: 7,
      }).setOrigin(0.5).setDepth(14);
      if (txt.width > 330) txt.setScale(330 / txt.width);
      ribbon.push(band, txt);
      parts.push(band, txt);
    }
    this.cards.push(...parts);

    // Leggero dondolio sfasato; l'ombra si stringe e schiarisce quando la tessera sale.
    const bob = [frame, art, label, ...(lockImg ? [lockImg] : []), ...ribbon];
    this.tweens.add({ targets: bob, y: '-=10', duration: 1300, yoyo: true, repeat: -1, ease: 'Sine.easeInOut', delay: i * 260 });
    this.tweens.add({ targets: shadow, scaleX: 1.9, alpha: 0.6, duration: 1300, yoyo: true, repeat: -1, ease: 'Sine.easeInOut', delay: i * 260 });

    frame.setInteractive({ useHandCursor: true });
    frame.on('pointerdown', () => {
      if (this.busy) return;
      if (soon) {
        hubSfx.pop();
        burst(this, x, y + 60, 'sparkle', { count: 8, tints: [0xffd23f, 0xffffff], gravity: 0, life: 450 });
        this.tweens.add({ targets: ribbon, y: '-=14', duration: 110, yoyo: true, ease: 'Quad.easeOut' });
        return;
      }
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

  /**
   * Frecce per scorrere le pagine quando i giochi sono più di 4: stanno sotto le tessere, al centro, con i pallini
   * delle pagine in mezzo (ai lati coprirebbero la prima e l'ultima tessera, che riempiono tutta la larghezza).
   */
  private pager(pages: number): void {
    this.pagerParts.forEach((o) => o.destroy());
    this.pagerParts = [];
    if (pages < 2) return;
    const y = 925;
    const dots: Phaser.GameObjects.Arc[] = [];
    for (let k = 0; k < pages; k++) {
      dots.push(this.add.circle(960 + (k - (pages - 1) / 2) * 46, y, 13, 0xffffff).setStrokeStyle(5, 0x2b2140).setDepth(20));
    }
    const mark = () => dots.forEach((d, k) => d.setFillStyle(k === this.page ? 0xffc800 : 0xffffff).setScale(k === this.page ? 1.25 : 1));
    const go = (d: number) => { this.page = (this.page + d + pages) % pages; hubSfx.page(); this.drawPage(); mark(); };
    const side = ((pages - 1) / 2) * 46 + 120;
    const l = button(this, 960 - side, y, 'btn_back', () => go(-1), 0.9).setDepth(20);
    const r = button(this, 960 + side, y, 'btn_next', () => go(1), 0.62).setDepth(20);
    this.pagerParts = [...dots, l, r];
    mark();
  }
}
