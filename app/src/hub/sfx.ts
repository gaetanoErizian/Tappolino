import { audio, noteFreq, type Song } from '../core/audio';

/** Suoni del menu dei giochi. */
export const hubSfx = {
  pop(): void {
    audio.tone({ freq: 520, to: 880, type: 'sine', dur: 0.09, vol: 0.35 });
  },
  open(): void {
    ['C5', 'E5', 'G5', 'C6'].forEach((n, i) => audio.tone({ freq: noteFreq(n), type: 'triangle', dur: 0.16, vol: 0.25, delay: i * 0.06 }));
  },
  locked(): void {
    audio.tone({ freq: 330, to: 260, type: 'triangle', dur: 0.14, vol: 0.25 });
    audio.tone({ freq: 330, to: 260, type: 'triangle', dur: 0.14, vol: 0.2, delay: 0.16 });
  },
};

/** Musichetta del menu: allegra e leggera, a volume basso. */
export const HUB_SONG: Song = {
  bpm: 100,
  tracks: [
    {
      wave: 'triangle', vol: 0.4,
      notes: [
        ['G5', 1], ['E5', 0.5], ['G5', 0.5], ['A5', 1], ['G5', 1], ['E5', 1], ['C5', 1], ['D5', 2],
        ['E5', 1], ['G5', 0.5], ['E5', 0.5], ['D5', 1], ['C5', 1], ['D5', 1], ['E5', 1], ['C5', 2],
        ['F5', 1], ['A5', 0.5], ['F5', 0.5], ['G5', 1], ['E5', 1], ['F5', 1], ['D5', 1], ['G5', 2],
        ['E5', 1], ['G5', 1], ['C6', 1], ['B5', 1], ['A5', 1], ['G5', 1], ['C5', 1], [null, 1],
      ],
    },
    {
      wave: 'sine', vol: 0.45,
      notes: [
        ['C3', 2], ['G2', 2], ['A2', 2], ['G2', 2], ['C3', 2], ['G2', 2], ['F2', 2], ['C3', 2],
        ['F2', 2], ['C3', 2], ['D3', 2], ['G2', 2], ['C3', 2], ['E3', 2], ['F2', 2], ['G2', 2],
      ],
    },
  ],
};
