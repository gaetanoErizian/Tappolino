import { audio, noteFreq, type Song } from '../../core/audio';

/** Effetti sonori sintetizzati di Pasticceria Magica. */
export const sfx = {
  pick(): void {
    audio.tone({ freq: 480, to: 760, type: 'sine', dur: 0.08, vol: 0.25 });
  },
  back(): void {
    audio.tone({ freq: 560, to: 360, type: 'sine', dur: 0.12, vol: 0.2 });
  },
  plop(): void {
    audio.tone({ freq: 700, to: 180, type: 'sine', dur: 0.18, vol: 0.4 });
    audio.noise({ filter: 'lowpass', freq: 1400, to: 300, dur: 0.16, vol: 0.18, delay: 0.04 });
  },
  ding(): void {
    ['E6', 'B6'].forEach((n, i) => audio.tone({ freq: noteFreq(n), type: 'sine', dur: 0.9, vol: 0.28, delay: i * 0.12 }));
  },
  stir(): void {
    audio.noise({ filter: 'bandpass', freq: 700, to: 1100, q: 2, dur: 0.16, vol: 0.12 });
  },
  smooth(): void {
    ['C6', 'E6', 'G6', 'C7'].forEach((n, i) => audio.tone({ freq: noteFreq(n), type: 'triangle', dur: 0.2, vol: 0.22, delay: i * 0.08 }));
  },
  doorOpen(): void {
    audio.tone({ freq: 220, to: 140, type: 'triangle', dur: 0.25, vol: 0.2 });
  },
  doorClose(): void {
    audio.tone({ freq: 160, to: 90, type: 'square', dur: 0.12, vol: 0.12 });
    audio.noise({ filter: 'lowpass', freq: 600, dur: 0.1, vol: 0.2 });
  },
  tick(): void {
    audio.tone({ freq: 1800, type: 'square', dur: 0.03, vol: 0.05 });
  },
  bubble(): void {
    audio.tone({ freq: 300 + Math.random() * 200, to: 900, type: 'sine', dur: 0.08, vol: 0.12 });
  },
  freeze(): void {
    for (let i = 0; i < 5; i++) audio.tone({ freq: 1800 + i * 300, type: 'sine', dur: 0.12, vol: 0.08, delay: i * 0.06 });
  },
  squeeze(): void {
    audio.noise({ filter: 'bandpass', freq: 500, to: 260, q: 1.5, dur: 0.45, vol: 0.25 });
    audio.tone({ freq: 300, to: 200, type: 'sine', dur: 0.35, vol: 0.12 });
  },
  topping(): void {
    audio.tone({ freq: 900, to: 1500, type: 'sine', dur: 0.08, vol: 0.22 });
    audio.tone({ freq: 1500, type: 'triangle', dur: 0.1, vol: 0.1, delay: 0.06 });
  },
  nope(): void {
    audio.tone({ freq: 300, to: 240, type: 'triangle', dur: 0.14, vol: 0.18 });
    audio.tone({ freq: 240, to: 200, type: 'triangle', dur: 0.16, vol: 0.18, delay: 0.15 });
  },
  magic(): void {
    ['C6', 'E6', 'G6', 'B6', 'D7', 'G7'].forEach((n, i) => audio.tone({ freq: noteFreq(n), type: 'sine', dur: 0.3, vol: 0.16, delay: i * 0.06 }));
  },
  chomp(): void {
    audio.noise({ filter: 'lowpass', freq: 2200, to: 400, dur: 0.12, vol: 0.35 });
    audio.noise({ filter: 'lowpass', freq: 1800, to: 300, dur: 0.1, vol: 0.25, delay: 0.14 });
  },
  yum(): void {
    audio.tone({ freq: 420, to: 640, type: 'triangle', dur: 0.2, vol: 0.28, vibrato: 7, vibratoDepth: 12 });
    audio.tone({ freq: 640, to: 520, type: 'triangle', dur: 0.36, vol: 0.28, delay: 0.2, vibrato: 7, vibratoDepth: 12 });
  },
  hello(): void {
    audio.tone({ freq: 520, to: 880, type: 'triangle', dur: 0.14, vol: 0.25 });
    audio.tone({ freq: 700, to: 1000, type: 'triangle', dur: 0.18, vol: 0.25, delay: 0.16 });
  },
  fanfare(): void {
    const seq: [string, number, number][] = [['G5', 0, 0.14], ['C6', 0.13, 0.14], ['E6', 0.26, 0.14], ['G6', 0.39, 0.5]];
    seq.forEach(([n, d, len]) => {
      audio.tone({ freq: noteFreq(n), type: 'triangle', dur: len, vol: 0.25, delay: d });
      audio.tone({ freq: noteFreq(n) / 2, type: 'sine', dur: len, vol: 0.15, delay: d });
    });
  },
  whoosh(): void {
    audio.noise({ filter: 'bandpass', freq: 400, to: 2400, q: 1.2, dur: 0.3, vol: 0.18 });
  },
};

/** Valzerino dolce in 3/4, volume basso. */
export const SONG: Song = {
  bpm: 132,
  tracks: [
    {
      wave: 'triangle', vol: 0.4,
      notes: [
        ['A5', 2], ['C6', 1], ['A5', 2], ['F5', 1], ['G5', 2], ['A5', 1], ['G5', 3],
        ['F5', 2], ['A5', 1], ['C6', 2], ['D6', 1], ['C6', 2], ['A5', 1], ['G5', 3],
        ['A5', 2], ['C6', 1], ['F6', 2], ['E6', 1], ['D6', 2], ['C6', 1], ['A5', 3],
        ['G5', 2], ['A5', 1], ['B5', 2], ['G5', 1], ['F5', 3], [null, 3],
      ],
    },
    {
      wave: 'sine', vol: 0.45,
      notes: [
        ['F3', 1], ['A3', 1], ['C4', 1], ['F3', 1], ['A3', 1], ['C4', 1], ['C3', 1], ['E3', 1], ['G3', 1], ['C3', 1], ['E3', 1], ['G3', 1],
        ['D3', 1], ['F3', 1], ['A3', 1], ['A2', 1], ['C3', 1], ['E3', 1], ['C3', 1], ['E3', 1], ['G3', 1], ['C3', 1], ['E3', 1], ['G3', 1],
        ['F3', 1], ['A3', 1], ['C4', 1], ['A#3', 1], ['D4', 1], ['F4', 1], ['F3', 1], ['A3', 1], ['C4', 1], ['D3', 1], ['F3', 1], ['A3', 1],
        ['C3', 1], ['E3', 1], ['G3', 1], ['C3', 1], ['E3', 1], ['G3', 1], ['F3', 1], ['A3', 1], ['C4', 1], ['F3', 3],
      ],
    },
  ],
};
