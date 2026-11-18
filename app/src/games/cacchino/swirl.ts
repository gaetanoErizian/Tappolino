import { ballGrad, blur } from '../../core/art';

/**
 * Il corpo di Cacchino: una cacchina a "giri" (2 da cucciolo, 3 da bimbo, 4 da grande) con il ricciolo in cima.
 * File piccolo e autonomo: lo usano sia la tessera del menu sia la grafica del gioco.
 * Disegno originale: giri morbidi color caramello, ricciolo piegato a destra, guance rosa, piedini.
 */
export const BODY_W = 440;
export const BODY_H = 580;
/** y dei piedini dentro la texture (l'origine dello sprite va messa qui) */
export const BASE_Y = 550;

const TIER_RX: Record<number, number[]> = { 2: [185, 118], 3: [190, 142, 92], 4: [190, 150, 110, 72] };
export interface Tier { cx: number; cy: number; rx: number; ry: number }

export function tierGeom(tiers: number): Tier[] {
  const rxs = TIER_RX[tiers] ?? TIER_RX[3];
  const out: Tier[] = [];
  let cy = BASE_Y - 98;
  rxs.forEach((rx, i) => {
    const ry = i === 0 ? 100 : rx * 0.56;
    if (i > 0) { const p = out[i - 1]; cy = p.cy - p.ry * 0.58 - ry * 0.55; }
    out.push({ cx: BODY_W / 2, cy, rx, ry });
  });
  return out;
}

/** Punto più alto dell'ultimo giro, rispetto ai piedini (negativo = verso l'alto) e mezza larghezza: per i cappelli. */
export function topOf(tiers: number): { y: number; rx: number } {
  const g = tierGeom(tiers);
  const t = g[g.length - 1];
  return { y: t.cy - t.ry - BASE_Y, rx: t.rx };
}

export const CACCHINO = { light: '#eab679', base: '#bd7b3d', dark: '#7c4619', line: '#5a3212' };

/** Contenuto SVG del corpo (senza faccia): da mettere in un documento BODY_W×BODY_H. `p` = prefisso degli id. */
export function swirlBody(tiers: number, p = 'pb'): string {
  const g = tierGeom(tiers);
  const top = g[g.length - 1];
  const t = top.cy - top.ry;
  const { cx, rx, ry, cy } = top;
  const tip = `M${cx - rx * 0.6} ${cy - ry * 0.3} C${cx - rx * 0.35} ${t - 34} ${cx - 2} ${t - 78} ${cx + rx * 0.5} ${t - 60}
    C${cx + rx * 0.16} ${t - 44} ${cx + rx * 0.62} ${t - 8} ${cx + rx * 0.6} ${cy - ry * 0.3} Z`;
  let s = `<defs>${ballGrad(`${p}g`, CACCHINO.light, CACCHINO.base, CACCHINO.dark)}${blur(`${p}b`, 7)}
    <radialGradient id="${p}c"><stop offset="0" stop-color="#ff7d8e" stop-opacity=".75"/><stop offset="1" stop-color="#ff7d8e" stop-opacity="0"/></radialGradient></defs>`;
  // piedini
  for (const fx of [cx - 78, cx + 78]) s += `<ellipse cx="${fx}" cy="${BASE_Y - 6}" rx="40" ry="17" fill="${CACCHINO.dark}" stroke="${CACCHINO.line}" stroke-width="4"/>
    <ellipse cx="${fx - 8}" cy="${BASE_Y - 11}" rx="18" ry="6" fill="${CACCHINO.base}" opacity=".7"/>`;
  s += `<path d="${tip}" fill="url(#${p}g)" stroke="${CACCHINO.line}" stroke-width="4" stroke-linejoin="round"/>
    <ellipse cx="${cx - rx * 0.1}" cy="${t - 34}" rx="${rx * 0.16}" ry="${rx * 0.09}" fill="#fff" opacity=".5" transform="rotate(-38 ${cx - rx * 0.1} ${t - 34})"/>`;
  const draw: string[] = [];
  g.forEach((tr, i) => {
    let d = `<ellipse cx="${tr.cx}" cy="${tr.cy}" rx="${tr.rx}" ry="${tr.ry}" fill="url(#${p}g)" stroke="${CACCHINO.line}" stroke-width="4"/>
      <ellipse cx="${tr.cx - tr.rx * 0.42}" cy="${tr.cy - tr.ry * 0.52}" rx="${tr.rx * 0.3}" ry="${tr.ry * 0.16}" fill="#fff" opacity=".42" transform="rotate(-16 ${tr.cx - tr.rx * 0.42} ${tr.cy - tr.ry * 0.52})"/>`;
    // ombra del giro di sopra su questo giro
    const up = g[i + 1];
    if (up) d += `<ellipse cx="${up.cx + 6}" cy="${up.cy + up.ry * 0.72}" rx="${up.rx * 0.94}" ry="${up.ry * 0.5}" fill="${CACCHINO.line}" opacity=".32" filter="url(#${p}b)"/>`;
    draw.push(d);
  });
  s += draw.join('');
  // guance
  const f = g[0];
  s += `<circle cx="${f.cx - 120}" cy="${f.cy + 14}" r="30" fill="url(#${p}c)"/><circle cx="${f.cx + 120}" cy="${f.cy + 14}" r="30" fill="url(#${p}c)"/>`;
  return s;
}

/** Faccia semplice (occhi aperti e sorriso) per la tessera del menu: stesse posizioni usate nel gioco. */
export function simpleFace(): string {
  const cy = BASE_Y - 98, cx = BODY_W / 2;
  const eye = (x: number) => `<ellipse cx="${x}" cy="${cy - 28}" rx="27" ry="31" fill="#fff" stroke="${CACCHINO.line}" stroke-width="4"/>
    <circle cx="${x + 3}" cy="${cy - 24}" r="16" fill="#2b1a12"/><circle cx="${x - 3}" cy="${cy - 31}" r="6.5" fill="#fff"/><circle cx="${x + 9}" cy="${cy - 18}" r="3" fill="#fff"/>`;
  return `${eye(cx - 58)}${eye(cx + 58)}
    <path d="M${cx - 40} ${cy + 22} Q${cx} ${cy + 62} ${cx + 40} ${cy + 22} Q${cx} ${cy + 36} ${cx - 40} ${cy + 22} Z" fill="#7a2a2a" stroke="${CACCHINO.line}" stroke-width="4" stroke-linejoin="round"/>
    <path d="M${cx - 16} ${cy + 44} Q${cx} ${cy + 34} ${cx + 16} ${cy + 44} Q${cx} ${cy + 56} ${cx - 16} ${cy + 44} Z" fill="#ff8fa0"/>`;
}
