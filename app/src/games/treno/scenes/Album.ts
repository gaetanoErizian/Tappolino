import Phaser from 'phaser';
import { setupView, button, pin, burst } from '../../../core/ui';
import { t } from '../../../core/i18n';
import { muteButton, goTo, title3d } from '../../../core/hud';
import { FONT } from '../../../core/brand';
import { AN } from '../animals';
import { STATIONS, ANIMAL_IDS, reached, type AnimalId, type StationId } from '../logic';
import { stationTint } from '../world';
import { save } from '../save';
import { sfx, playTrenoMusic } from '../sfx';

/** Colonne delle tre stazioni sulla mappa. */
const COL_X = [480, 960, 1440];
const EMB_Y = 330;
/** Posti dei 5 bollini sotto ogni stazione (3 sopra, 2 sotto). */
const STICK = [[-150, 590], [0, 590], [150, 590], [-75, 800], [75, 800]] as const;

interface Sticker { id: AnimalId; img: Phaser.GameObjects.Image; got: boolean; busy: boolean }

/**
 * Album delle stazioni (collezione): la linea del treno con la fattoria, la giungla e il polo.
 * Sotto ogni stazione i suoi 5 animali: quelli già portati a casa a colori, gli altri come ombre misteriose.
 * Una stazione mai raggiunta ha il lucchetto. Toccando un animale salta, fa il verso e dice il nome.
 */
export class Album extends Phaser.Scene {
  private stickers: Sticker[] = [];

  constructor() { super('treno:Album'); }

  create(): void {
    this.stickers = [];
    setupView(this);
    this.cameras.main.fadeIn(250, 143, 211, 255);
    playTrenoMusic();
    const delivered = save.state.delivered;
    const open = reached(delivered);

    // prato con il binario che unisce le stazioni
    const g = this.add.graphics().setDepth(0);
    g.fillGradientStyle(0x7fcfff, 0x7fcfff, 0xd6f1ff, 0xd6f1ff, 1).fillRect(-2000, -1600, 5920, 1860);
    g.fillGradientStyle(0x9ddc84, 0x9ddc84, 0x6cbf58, 0x6cbf58, 1).fillRect(-2000, 260, 5920, 1600);
    this.add.image(960, 300, 'tr_hills').setOrigin(0.5, 1).setScale(2).setDepth(0.5);
    this.add.image(1700, 120, 'cloud').setScale(0.6).setDepth(0.4);
    this.add.image(250, 90, 'cloud').setScale(0.5).setDepth(0.4);
    const rail = this.add.graphics().setDepth(1);
    const pts = [new Phaser.Math.Vector2(-200, 470), new Phaser.Math.Vector2(COL_X[0], EMB_Y + 70), new Phaser.Math.Vector2(720, 470), new Phaser.Math.Vector2(COL_X[1], EMB_Y + 70), new Phaser.Math.Vector2(1200, 470), new Phaser.Math.Vector2(COL_X[2], EMB_Y + 70), new Phaser.Math.Vector2(2120, 470)];
    const curve = new Phaser.Curves.Spline(pts);
    const path = curve.getSpacedPoints(160);
    rail.lineStyle(30, 0xb9a68c, 1).strokePoints(path);
    for (let i = 0; i < path.length; i += 2) {
      const a = path[Math.max(0, i - 1)], b = path[Math.min(path.length - 1, i + 1)];
      const nx = -(b.y - a.y), ny = b.x - a.x, l = Math.hypot(nx, ny) || 1;
      rail.lineStyle(9, 0x8a5530, 1).lineBetween(path[i].x - (nx / l) * 22, path[i].y - (ny / l) * 22, path[i].x + (nx / l) * 22, path[i].y + (ny / l) * 22);
    }
    rail.lineStyle(5, 0x9aa5b8, 1).strokePoints(path.map((p) => new Phaser.Math.Vector2(p.x, p.y - 7)));
    rail.lineStyle(5, 0x9aa5b8, 1).strokePoints(path.map((p) => new Phaser.Math.Vector2(p.x, p.y + 7)));

    title3d(this, 960, 92, t('treno.album'), 88);

    STATIONS.forEach((st, c) => this.stationColumn(st.id, c, open.includes(st.id), delivered));

    const got = delivered.filter((a) => (ANIMAL_IDS as readonly string[]).includes(a)).length;
    this.add.text(960, 1010, t('treno.count', { n: got, tot: ANIMAL_IDS.length }), {
      fontFamily: FONT, fontSize: '46px', fontStyle: '700', color: '#ffffff', stroke: '#a8352d', strokeThickness: 9,
    }).setOrigin(0.5).setDepth(900);

    muteButton(this);
    const home = button(this, 0, 0, 'btn_home', () => goTo(this, 'treno:Menu'), 0.85);
    pin(this, home, 'tl', 80, 80);
    const next = button(this, 0, 0, 'btn_play', () => goTo(this, 'treno:Station'), 0.6);
    pin(this, next, 'br', 130, 130);

    this.input.on('pointerdown', (p: Phaser.Input.Pointer, over: Phaser.GameObjects.GameObject[]) => {
      if (over.length) return;
      const s = this.stickers.find((x) => Phaser.Math.Distance.Between(p.worldX, p.worldY, x.img.x, x.img.y - 50) < 85);
      if (s) { this.tap(s); return; }
      burst(this, p.worldX, p.worldY, 'sparkle', { count: 6, tints: [0xffffff, 0xffe066], speed: [80, 220], scale: [0.45, 0], gravity: 0, life: 500 });
    });
  }

  private stationColumn(id: StationId, c: number, open: boolean, delivered: readonly string[]): void {
    const x = COL_X[c];
    this.add.image(x, EMB_Y + 8, 'shadow').setScale(1.1, 0.45).setDepth(2);
    const emb = this.add.image(x, EMB_Y - 30, `tr_emb_${id}`).setScale(1.05).setDepth(3);
    if (!open) {
      emb.setTint(0xb0b8c8);
      this.add.image(x + 56, EMB_Y + 30, 'btn_lock').setScale(0.6).setDepth(4);
    } else {
      this.tweens.add({ targets: emb, scale: 1.1, duration: 1300 + c * 200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }
    this.add.text(x, EMB_Y + 92, open ? t(`treno.station.${id}`) : '?', {
      fontFamily: FONT, fontSize: '44px', fontStyle: '700', color: '#ffffff', stroke: open ? '#' + stationTint(id).toString(16).padStart(6, '0') : '#7a849a', strokeThickness: 9,
    }).setOrigin(0.5).setDepth(5);
    const st = STATIONS.find((s) => s.id === id)!;
    st.animals.forEach((a, k) => {
      const [dx, y] = STICK[k];
      const got = delivered.includes(a);
      this.add.image(x + dx, y - 56, 'tr_sticker').setScale(0.82).setDepth(6);
      const img = this.add.image(x + dx, y + 8, `tr_an_${a}`).setOrigin(0.5, AN.ground / AN.h).setScale(0.42).setDepth(7);
      if (!got) {
        img.setTint(0x9aa8bf).setTintMode(Phaser.TintModes.FILL).setAlpha(0.55);
        this.add.text(x + dx, y - 64, '?', { fontFamily: FONT, fontSize: '56px', fontStyle: '700', color: '#ffffff', stroke: '#7a849a', strokeThickness: 8 }).setOrigin(0.5).setDepth(8);
      }
      this.stickers.push({ id: a, img, got, busy: false });
    });
  }

  private tap(s: Sticker): void {
    if (s.busy) return;
    s.busy = true;
    const y = s.img.y;
    this.tweens.add({ targets: s.img, y: y - 40, duration: 180, yoyo: true, ease: 'Quad.easeOut', onComplete: () => { s.img.y = y; s.busy = false; } });
    if (!s.got) { sfx.pop(); return; }
    s.img.setTexture(`tr_an_${s.id}_happy`);
    this.time.delayedCall(900, () => s.img.setTexture(`tr_an_${s.id}`));
    sfx.voice(s.id);
    burst(this, s.img.x, s.img.y - 80, 'heart', { count: 4, speed: [120, 260], scale: [0.6, 0.2], gravity: -120, life: 900, depth: 900 });
    const name = this.add.text(s.img.x, s.img.y - 170, t(`treno.animal.${s.id}`), {
      fontFamily: FONT, fontSize: '40px', fontStyle: '700', color: '#ffffff', stroke: '#a8352d', strokeThickness: 8,
    }).setOrigin(0.5).setDepth(950).setScale(0);
    this.tweens.add({ targets: name, scale: 1, y: name.y - 20, duration: 300, ease: 'Back.easeOut' });
    this.tweens.add({ targets: name, alpha: 0, duration: 400, delay: 1300, onComplete: () => name.destroy() });
  }

  get count(): number { return this.stickers.filter((s) => s.got).length; }
}
