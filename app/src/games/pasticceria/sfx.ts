import { sound } from './sound';

/**
 * Effetti sonori di Pasticceria Magica: file preparati offline (scripts/audio/pasticceria_sfx.py),
 * suonati con piccole variazioni di tono. I volumi relativi si regolano qui.
 */
export const sfx = {
  pick: (): void => sound.play('pick', { vol: 0.6, jitter: 0.06 }),
  back: (): void => sound.play('back', { vol: 0.5 }),
  plop: (): void => sound.play('plop', { vol: 0.9, jitter: 0.08 }),
  ding: (): void => sound.play('ding', { vol: 0.8, jitter: 0 }),
  stir: (): void => sound.play('stir', { vol: 0.55, jitter: 0.12 }),
  smooth: (): void => sound.play('smooth', { vol: 0.7, jitter: 0 }),
  doorOpen: (): void => sound.play('doorOpen', { vol: 0.6 }),
  doorClose: (): void => sound.play('doorClose', { vol: 0.75 }),
  tick: (): void => sound.play('tick', { vol: 0.35, jitter: 0.02 }),
  bubble: (): void => sound.play('bubble', { vol: 0.5, jitter: 0.1 }),
  freeze: (): void => sound.play('freeze', { vol: 0.45, jitter: 0.03 }),
  squeeze: (): void => sound.play('squeeze', { vol: 0.85, jitter: 0.06 }),
  topping: (): void => sound.play('topping', { vol: 0.6, jitter: 0.1 }),
  nope: (): void => sound.play('nope', { vol: 0.55, jitter: 0 }),
  magic: (): void => sound.play('magic', { vol: 0.65, jitter: 0 }),
  chomp: (): void => sound.play('chomp', { vol: 0.95, jitter: 0.08 }),
  yum: (): void => sound.play('yum', { vol: 0.75, jitter: 0 }),
  hello: (): void => sound.play('hello', { vol: 0.6, jitter: 0.02 }),
  fanfare: (): void => sound.play('fanfare', { vol: 0.65, jitter: 0 }),
  whoosh: (): void => sound.play('whoosh', { vol: 0.4, jitter: 0.1 }),
};
