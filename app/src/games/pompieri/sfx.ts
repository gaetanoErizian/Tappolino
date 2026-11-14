import { audio, noteFreq, type Song } from '../../core/audio';
import type { SirenKind } from './levels';

/** Effetti sonori sintetizzati del gioco. */
export const sfx = {
  pop(): void {
    audio.tone({ freq: 520, to: 880, type: 'sine', dur: 0.09, vol: 0.35 });
  },
  spray(): void {
    audio.noise({ filter: 'bandpass', freq: 2600, to: 900, q: 0.8, dur: 0.38, vol: 0.32, attack: 0.03 });
  },
  extinguish(): void {
    audio.noise({ filter: 'lowpass', freq: 4000, to: 250, dur: 0.55, vol: 0.35, delay: 0.02 });
    audio.tone({ freq: noteFreq('E6'), type: 'triangle', dur: 0.14, vol: 0.28, delay: 0.08 });
    audio.tone({ freq: noteFreq('A6'), type: 'triangle', dur: 0.22, vol: 0.28, delay: 0.17 });
  },
  flameAppear(): void {
    audio.tone({ freq: 260, to: 520, type: 'sine', dur: 0.2, vol: 0.18 });
    audio.noise({ filter: 'lowpass', freq: 900, dur: 0.18, vol: 0.12 });
  },
  star(): void {
    audio.tone({ freq: 1250, to: 1900, type: 'sine', dur: 0.12, vol: 0.18 });
  },
  meow(): void {
    audio.tone({ freq: 620, to: 1000, type: 'triangle', dur: 0.16, vol: 0.32, vibrato: 18, vibratoDepth: 10 });
    audio.tone({ freq: 1000, to: 560, type: 'triangle', dur: 0.36, vol: 0.3, delay: 0.15, vibrato: 14, vibratoDepth: 14 });
  },
  ladder(): void {
    for (let i = 0; i < 7; i++) audio.tone({ freq: 420 + i * 70, type: 'square', dur: 0.05, vol: 0.07, delay: i * 0.09 });
  },
  hearts(): void {
    ['C6', 'E6', 'G6', 'C7'].forEach((n, i) => audio.tone({ freq: noteFreq(n), type: 'triangle', dur: 0.22, vol: 0.25, delay: i * 0.09 }));
  },
  fanfare(): void {
    const seq: [string, number, number][] = [['C5', 0, 0.16], ['E5', 0.14, 0.16], ['G5', 0.28, 0.16], ['C6', 0.42, 0.5]];
    seq.forEach(([n, d, len]) => {
      audio.tone({ freq: noteFreq(n), type: 'square', dur: len, vol: 0.12, delay: d });
      audio.tone({ freq: noteFreq(n), type: 'triangle', dur: len, vol: 0.25, delay: d });
    });
    ['E5', 'G5'].forEach((n) => audio.tone({ freq: noteFreq(n), type: 'triangle', dur: 0.5, vol: 0.16, delay: 0.42 }));
  },
  medal(): void {
    ['G6', 'C7', 'E7'].forEach((n, i) => audio.tone({ freq: noteFreq(n), type: 'sine', dur: 0.5, vol: 0.2, delay: i * 0.07 }));
  },
  whoosh(): void {
    audio.noise({ filter: 'bandpass', freq: 400, to: 2400, q: 1.2, dur: 0.35, vol: 0.2 });
  },
  siren(kind: SirenKind): void {
    switch (kind) {
      case 'hilo':
        for (let i = 0; i < 4; i++) audio.tone({ freq: i % 2 ? 700 : 940, type: 'triangle', dur: 0.3, vol: 0.28, delay: i * 0.3, attack: 0.02 });
        break;
      case 'wail':
        audio.tone({ freq: 520, to: 1250, type: 'triangle', dur: 0.6, vol: 0.28 });
        audio.tone({ freq: 1250, to: 520, type: 'triangle', dur: 0.6, vol: 0.28, delay: 0.6 });
        break;
      case 'yelp':
        for (let i = 0; i < 6; i++) audio.tone({ freq: 600, to: 1300, type: 'triangle', dur: 0.18, vol: 0.25, delay: i * 0.19 });
        break;
      case 'honk':
        [0, 0.35].forEach((d) => {
          audio.tone({ freq: 330, type: 'sawtooth', dur: 0.26, vol: 0.12, delay: d });
          audio.tone({ freq: 415, type: 'sawtooth', dur: 0.26, vol: 0.12, delay: d });
        });
        break;
      case 'tune':
        ['C6', 'E6', 'G6', 'E6', 'C6'].forEach((n, i) => audio.tone({ freq: noteFreq(n), type: 'triangle', dur: 0.2, vol: 0.26, delay: i * 0.17 }));
        break;
      case 'space':
        audio.tone({ freq: 300, to: 1500, type: 'sine', dur: 0.9, vol: 0.26, vibrato: 9, vibratoDepth: 40 });
        audio.tone({ freq: 1500, to: 700, type: 'sine', dur: 0.4, vol: 0.2, delay: 0.85 });
        break;
    }
  },
};

/** Musica allegra in loop, volume basso. */
export const SONG: Song = {
  bpm: 112,
  tracks: [
    {
      wave: 'triangle', vol: 0.45,
      notes: [
        ['C5', 1], ['E5', 1], ['G5', 1], ['E5', 1], ['F5', 1], ['A5', 1], ['G5', 2],
        ['E5', 1], ['G5', 1], ['C6', 1], ['G5', 1], ['A5', 1], ['G5', 1], ['E5', 2],
        ['D5', 1], ['F5', 1], ['A5', 1], ['F5', 1], ['E5', 1], ['G5', 1], ['C6', 2],
        ['B5', 1], ['G5', 1], ['D5', 1], ['F5', 1], ['E5', 2], ['C5', 1], [null, 1],
      ],
    },
    {
      wave: 'sine', vol: 0.5,
      notes: [
        ['C3', 2], ['G2', 2], ['F2', 2], ['C3', 2], ['C3', 2], ['G2', 2], ['F2', 2], ['C3', 2],
        ['D3', 2], ['A2', 2], ['C3', 2], ['G2', 2], ['G2', 2], ['B2', 2], ['C3', 2], ['G2', 2],
      ],
    },
  ],
};
