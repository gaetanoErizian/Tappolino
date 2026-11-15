/**
 * RUOTE (ed eliche) A FOTOGRAMMI, comune a tutti i giochi (nato nel Treno, riusato dal Monster Truck; unificato in
 * regia: decisione 23).
 *
 * Perché: nel browser di prova Phaser 4 taglia "a triangoli" le immagini ruotate. Una ruota quindi non si ruota:
 * si preparano `frames` texture con i raggi ridisegnati sfasati, e in gioco si cambia texture.
 * Il disegno deve ripetersi ogni `sectorDeg` gradi (es. 8 raggi → 45°, 6 raggi → 60°): i fotogrammi coprono un
 * settore, sfasati di `sectorDeg / frames` gradi l'uno dall'altro.
 */

/** Sfasamento in gradi del fotogramma k (da usare quando si disegnano le texture). */
export function wheelPhase(k: number, frames: number, sectorDeg: number): number {
  return (k * sectorDeg) / frames;
}

/**
 * Fotogramma da mostrare per una ruota di raggio `r` che ha percorso `dist` (stessa unità di `r`).
 * Positivo = la ruota avanza verso destra. Sempre tra 0 e frames-1, anche andando all'indietro.
 */
export function wheelFrame(dist: number, r: number, frames: number, sectorDeg: number): number {
  const deg = (dist / r) * (180 / Math.PI);
  return ((Math.floor(deg / (sectorDeg / frames)) % frames) + frames) % frames;
}
