import Phaser from 'phaser';
import { Boot } from './scenes/Boot';
import { Menu } from './scenes/Menu';
import { Game } from './scenes/Game';
import { Reward } from './scenes/Reward';
import { Garage } from './scenes/Garage';
import { DESIGN_W, DESIGN_H } from './core/ui';
import { platform, urlParam } from './core/platform';

document.body.classList.toggle('web', platform() === 'web');

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  backgroundColor: '#8fd3ff',
  banner: false,
  scale: {
    mode: Phaser.Scale.EXPAND,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: DESIGN_W,
    height: DESIGN_H,
  },
  input: { activePointers: 3 },
  render: { antialias: true },
  scene: [Boot, Menu, Game, Reward, Garage],
});

// Solo per test automatici nel browser (?debug=1).
if (urlParam('debug')) (window as unknown as { __game: Phaser.Game }).__game = game;
