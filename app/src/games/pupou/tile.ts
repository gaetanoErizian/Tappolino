import { svgDoc, type SvgTex } from '../../core/textures';
import { blur } from '../../core/art';
import { swirlBody, simpleFace, BODY_W, BODY_H } from './swirl';

/**
 * Illustrazione della tessera nel menu dei giochi: Pupou che ride con una puzzetta verde dietro e la mosca Zizzi.
 * Importa solo il disegno del corpo (swirl.ts): il resto del gioco si carica all'apertura.
 */
export function pupouTile(): SvgTex {
  const puff = (x: number, y: number, r: number, o: number) => `<g opacity="${o}"><circle cx="${x}" cy="${y}" r="${r}" fill="#c9e86a"/><circle cx="${x - r * 0.8}" cy="${y + r * 0.3}" r="${r * 0.7}" fill="#c9e86a"/>
    <circle cx="${x + r * 0.8}" cy="${y + r * 0.35}" r="${r * 0.65}" fill="#b6dc4f"/><ellipse cx="${x - r * 0.3}" cy="${y - r * 0.4}" rx="${r * 0.4}" ry="${r * 0.2}" fill="#fff" opacity=".6"/></g>`;
  return {
    key: 'tile_pupou', w: 360, h: 280, svg: svgDoc(360, 280, `<defs>
      <linearGradient id="tw" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff3c9"/><stop offset="1" stop-color="#ffd98a"/></linearGradient>
      <linearGradient id="tf" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8fd6c8"/><stop offset="1" stop-color="#5fb8a8"/></linearGradient>${blur('ts', 5)}</defs>
    <rect width="360" height="280" fill="url(#tw)"/>
    <g fill="#ffbf5e" opacity=".35">${[...Array(18)].map((_, i) => `<circle cx="${30 + (i % 6) * 62 + (Math.floor(i / 6) % 2) * 31}" cy="${28 + Math.floor(i / 6) * 58}" r="7"/>`).join('')}</g>
    <rect y="212" width="360" height="68" fill="url(#tf)"/><rect y="208" width="360" height="7" fill="#fff" opacity=".8"/>
    ${puff(78, 150, 30, 0.95)}${puff(46, 96, 20, 0.8)}${puff(70, 52, 13, 0.6)}
    <ellipse cx="186" cy="252" rx="96" ry="12" fill="#1d2440" opacity=".28" filter="url(#ts)"/>
    <g transform="translate(74 -8) scale(.48)"><svg width="${BODY_W}" height="${BODY_H}" viewBox="0 0 ${BODY_W} ${BODY_H}" overflow="visible">${swirlBody(3, 'tl')}${simpleFace()}</svg></g>
    <g transform="translate(292 70)"><ellipse cx="-9" cy="-10" rx="13" ry="8" fill="#dff4ff" stroke="#8fb9d6" stroke-width="2" transform="rotate(-25)"/><ellipse cx="9" cy="-10" rx="13" ry="8" fill="#dff4ff" stroke="#8fb9d6" stroke-width="2" transform="rotate(25)"/>
      <ellipse cx="0" cy="2" rx="12" ry="10" fill="#4a4f6a"/><circle cx="-5" cy="-1" r="4" fill="#fff"/><circle cx="5" cy="-1" r="4" fill="#fff"/><circle cx="-4" cy="0" r="1.8" fill="#222"/><circle cx="6" cy="0" r="1.8" fill="#222"/></g>
    <path d="M276 112 q-10 12 2 22 q12 10 0 22" fill="none" stroke="#4a4f6a" stroke-width="2.5" stroke-dasharray="3 6" stroke-linecap="round" opacity=".6"/>`),
  };
}
