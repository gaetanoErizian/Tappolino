import Phaser from 'phaser';
import { setupView, button, pin, burst } from '../../../core/ui';
import { muteButton, goTo } from '../../../core/hud';
import { urlParam } from '../../../core/platform';
import { TrainView, track, happyFace } from '../world';
import { RAIL_Y, SEAT_SCALE, isAnimalId, type AnimalId, type Trip } from '../logic';
import { sfx, playTrenoMusic } from '../sfx';

/** Durata del viaggio (il paesaggio scorre, il treno sbuffa). */
export const TRAVEL_MS = 4600;

/**
 * Il viaggio: il treno corre nella campagna (colline, alberi e pali del telegrafo che scorrono a velocità diverse),
 * le ruote girano, gli animali dondolano a tempo con le rotaie. Toccando un animale saluta, toccando la locomotiva fischia.
 */
export class Journey extends Phaser.Scene {
  private train!: TrainView;
  private layers: { o: Phaser.GameObjects.TileSprite; v: number }[] = [];
  private props: { o: Phaser.GameObjects.Image; v: number; wrap: number }[] = [];
  private speed = 0;
  private trip!: Trip;
  private seats: AnimalId[][] = [];

  constructor() { super('treno:Journey'); }

  create(data: { trip: Trip; seats: string[][] }): void {
    this.trip = data.trip;
    this.seats = (data.seats ?? []).map((l) => l.filter(isAnimalId));
    this.layers = [];
    this.props = [];
    this.speed = 0;
    setupView(this);
    this.cameras.main.fadeIn(250, 143, 211, 255);
    playTrenoMusic();

    const g = this.add.graphics().setDepth(0);
    g.fillGradientStyle(0x5fb8ff, 0x5fb8ff, 0xd6f1ff, 0xd6f1ff, 1).fillRect(-2000, -1600, 5920, 2300);
    this.add.image(1650, 130, 'sun').setDepth(0.5).setScale(0.8);
    const tile = (key: string, y: number, h: number, depth: number, v: number, scale = 2) => {
      const o = this.add.tileSprite(960, y, 5920 / scale, h, key).setOrigin(0.5, 1).setScale(scale).setDepth(depth);
      this.layers.push({ o, v });
      return o;
    };
    tile('tr_hills_far', 470, 180, 1, 0.06);
    tile('tr_hills', 520, 150, 1.5, 0.15);
    const grass = this.add.graphics().setDepth(2);
    grass.fillGradientStyle(0x8fd078, 0x8fd078, 0x6cbf58, 0x6cbf58, 1).fillRect(-2000, 500, 5920, 1700);
    // nuvole lente
    for (const [x, y, s] of [[300, 140, 0.8], [1100, 80, 0.55], [1700, 200, 0.6]] as const) this.props.push({ o: this.add.image(x, y, 'cloud').setScale(s).setDepth(0.6), v: 0.03, wrap: 2600 });
    // alberi e cespugli dietro il binario, pali del telegrafo, fiori nel prato davanti
    for (let i = 0; i < 6; i++) this.props.push({ o: this.add.image(i * 520, 590, i % 2 ? 'tr_tree' : 'tr_bush').setOrigin(0.5, 1).setScale(i % 2 ? 0.7 : 0.8).setDepth(3), v: 0.45, wrap: 3120 });
    for (let i = 0; i < 4; i++) this.props.push({ o: this.add.image(i * 700, 560, 'tr_pole').setOrigin(0.5, 1).setScale(0.9).setDepth(3.2), v: 0.55, wrap: 2800 });
    const rail = track(this);
    this.layers.push({ o: rail, v: 1 });
    const meadow = this.add.graphics().setDepth(6);
    meadow.fillGradientStyle(0x86cc6c, 0x86cc6c, 0x5cb04a, 0x5cb04a, 1).fillRect(-2000, RAIL_Y + 78, 5920, 1400);
    for (let i = 0; i < 8; i++) this.props.push({ o: this.add.image(i * 420, 1000 + (i % 3) * 40, 'tr_bush').setOrigin(0.5, 1).setScale(0.9).setDepth(7), v: 1.3, wrap: 3360 });
    for (let i = 0; i < 3; i++) this.props.push({ o: this.add.image(i * 1100, 1160, 'tr_fg_bush').setOrigin(0.5, 1).setScale(0.9).setDepth(800), v: 2.2, wrap: 3300 });

    // il treno con i passeggeri, al centro
    this.train = new TrainView(this, this.trip.kind, this.trip.wagons, this.trip.dest, 960);
    this.seats.forEach((list, i) => list.forEach((id) => { if (this.train.wagons[i]) this.train.seat(i, id); }));
    this.train.bob(true);
    this.time.delayedCall(200, () => this.train.whistle());
    this.tweens.add({ targets: this, speed: 26, duration: 1200, ease: 'Quad.easeOut' });
    this.time.delayedCall(TRAVEL_MS - 1200, () => { sfx.brake(); this.tweens.add({ targets: this, speed: 6, duration: 1000 }); });
    this.time.delayedCall(TRAVEL_MS, () => goTo(this, 'treno:Arrive', { trip: this.trip, seats: this.seats }));
    // ciuf-ciuf a tempo
    this.time.addEvent({ delay: 330, loop: true, callback: () => { if (this.speed > 4) { sfx.chuff(); this.train.puff(1); } } });

    muteButton(this);
    const home = button(this, 0, 0, 'btn_home', () => goTo(this, 'treno:Menu'), 0.85);
    pin(this, home, 'tl', 80, 80);

    this.input.on('pointerdown', (p: Phaser.Input.Pointer, over: Phaser.GameObjects.GameObject[]) => {
      if (over.length) return;
      const s = this.train.hitSeated(p.worldX, p.worldY);
      if (s) {
        happyFace(this, s.img, s.id);
        sfx.voice(s.id);
        this.tweens.add({ targets: s.img, scaleY: SEAT_SCALE * 1.12, duration: 120, yoyo: true });
        burst(this, p.worldX, p.worldY - 40, 'heart', { count: 4, speed: [120, 260], scale: [0.6, 0.2], gravity: -120, life: 900, depth: 900 });
        return;
      }
      if (this.train.hitLoco(p.worldX, p.worldY)) { this.train.whistle(); return; }
      burst(this, p.worldX, p.worldY, 'sparkle', { count: 5, tints: [0xffffff, 0xffe066], speed: [80, 200], scale: [0.4, 0], gravity: 0, life: 450, depth: 900 });
    });
    if (urlParam('debug')) Object.assign(window, { __trj: this });
  }

  update(_t: number, dt: number): void {
    const d = this.speed * Math.min(dt, 50) / 16.7;
    for (const l of this.layers) l.o.tilePositionX += (d * l.v) / l.o.scaleX;
    for (const p of this.props) {
      p.o.x -= d * p.v;
      if (p.o.x < -700) p.o.x += p.wrap;
    }
    // le ruote girano anche se il treno resta al centro
    this.train.spin(d);
  }
}
