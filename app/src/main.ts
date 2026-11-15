import Phaser from 'phaser';
import { Boot } from './Boot';
import { Hub } from './hub/Hub';
import { DESIGN_W, DESIGN_H } from './core/ui';
import { platform, urlParam } from './core/platform';
import { testGate } from './core/testGate';

document.body.classList.toggle('web', platform() === 'web');

// Pagina di prova per i tester (solo build `--mode pages`): prima la password, poi il gioco. Altrove parte subito.
void testGate().then(() => {
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
  // I giochi aggiungono le loro scene quando vengono aperti (import dinamico).
  scene: [Boot, Hub],
});

// Solo per test automatici nel browser (?debug=1).
if (urlParam('debug')) (window as unknown as { __game: Phaser.Game }).__game = game;
});
