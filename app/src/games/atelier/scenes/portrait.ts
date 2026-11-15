import Phaser from 'phaser';
import type { Look } from '../logic';
import { Doll } from '../world';

/**
 * Ritratto in cornice dorata: lo sfondo scelto in miniatura e il personaggio con il suo look.
 * Usato dalla sfilata (il ritratto che vola nella galleria) e dalla galleria.
 * Restituisce un Container centrato sulla cornice (360×320 a scala 1); `doll` per animare il personaggio.
 */
export function portrait(scene: Phaser.Scene, x: number, y: number, look: Look, scale = 1): Phaser.GameObjects.Container & { doll?: Doll } {
  const c = scene.add.container(x, y).setScale(scale) as Phaser.GameObjects.Container & { doll?: Doll };
  const bg = scene.add.image(0, 0, `at_thumb_${look.bg ?? 'castle'}`).setDisplaySize(294, 254);
  const d = new Doll(scene, look, 0, 118, 0.255, { shadow: true });
  c.add([bg, d.c, scene.add.image(0, 0, 'at_frame')]);
  c.doll = d;
  return c;
}
