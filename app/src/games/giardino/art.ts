import { svgDoc, type SvgTex } from '../../core/textures';
import { lightGrad, ballGrad, blur, starPath, roundButton, shade, uid } from '../../core/art';
import { FLOWERS, FAIRIES, type FlowerDef, type FairyDef } from './logic';

/**
 * Grafica del Giardino delle Fate, tutta originale e disegnata in codice (SVG → texture, chiavi "gi_").
 * Stile 2.5D di Tappolino: luce fissa dall'alto a sinistra, volumi sfumati, riflessi, ombre a terra,
 * bordi in una tonalità più scura dello stesso colore. Fiori buffi con il viso, fatine tonde e gentili.
 */

const f1 = (n: number): string => n.toFixed(1);

// =====================================================================
// Paesaggio: radura al mattino
// =====================================================================

/** Colline lontane nella foschia del mattino, con alberelli tondi. */
function hillsFar(): SvgTex {
  const g = uid('hf'), hz = uid('hz');
  let trees = '';
  for (let i = 0; i < 16; i++) {
    const x = 70 + i * 150 + ((i * 37) % 60), y = 150 + ((i * 53) % 50);
    trees += `<ellipse cx="${x}" cy="${y}" rx="${26 + (i % 3) * 6}" ry="${30 + (i % 2) * 8}" fill="#9fcfa8" opacity=".8"/>`;
  }
  return {
    key: 'gi_hills_far', w: 2400, h: 360, svg: svgDoc(2400, 360, `<defs>${lightGrad(g, '#d8f0d6', '#bfe3c4', '#a6d4b0', true)}
      <linearGradient id="${hz}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff6e6" stop-opacity=".0"/><stop offset="1" stop-color="#fff6e6" stop-opacity=".55"/></linearGradient></defs>
      ${trees}
      <path d="M0 180 Q200 90 420 150 Q640 210 860 120 Q1080 40 1300 130 Q1520 210 1760 110 Q1980 30 2200 120 Q2320 160 2400 140 V360 H0 Z" fill="url(#${g})"/>
      <rect width="2400" height="360" fill="url(#${hz})"/>`),
  };
}

/** Colline vicine, più verdi, con cespugli e alberi tondi (piano medio). */
function hillsNear(): SvgTex {
  const g = uid('hn'), t = uid('tr'), sh = uid('sh');
  let trees = '';
  const spots = [[180, 120, 70], [420, 90, 54], [980, 70, 48], [1500, 110, 66], [1880, 80, 50], [2200, 120, 60]];
  for (const [x, y, r] of spots) {
    trees += `<ellipse cx="${x + 8}" cy="${y + r * 0.9}" rx="${r * 0.9}" ry="${r * 0.22}" fill="#3f8a3a" opacity=".25" filter="url(#${sh})"/>
      <rect x="${x - 7}" y="${y + r * 0.4}" width="14" height="${r * 0.55}" rx="6" fill="#8a5a3c"/>
      <circle cx="${x}" cy="${y}" r="${r}" fill="url(#${t})"/><circle cx="${x - r * 0.45}" cy="${y + r * 0.2}" r="${r * 0.7}" fill="url(#${t})"/>
      <circle cx="${x + r * 0.5}" cy="${y + r * 0.25}" r="${r * 0.65}" fill="url(#${t})"/>
      <ellipse cx="${x - r * 0.3}" cy="${y - r * 0.45}" rx="${r * 0.35}" ry="${r * 0.2}" fill="#fff" opacity=".22"/>`;
  }
  return {
    key: 'gi_hills_near', w: 2400, h: 300, svg: svgDoc(2400, 300, `<defs>${lightGrad(g, '#c4ecaa', '#9ed886', '#7cc468', true)}${ballGrad(t, '#c6f0a8', '#86cf6a', '#4f9e45')}${blur(sh, 5)}</defs>
      ${trees}
      <path d="M0 190 Q260 120 560 170 Q860 220 1160 150 Q1460 90 1760 160 Q2060 220 2400 150 V300 H0 Z" fill="url(#${g})"/>
      <path d="M0 190 Q260 120 560 170 Q860 220 1160 150 Q1460 90 1760 160 Q2060 220 2400 150" fill="none" stroke="#e8ffd8" stroke-width="5" opacity=".6"/>`),
  };
}

/** Erba alta e foglie sfocate in primo piano (si mette agli angoli in basso). */
function fgGrass(): SvgTex {
  const g = uid('fg'), b = uid('b');
  let blades = '';
  for (let i = 0; i < 22; i++) {
    const x = 20 + i * 38 + ((i * 17) % 20), h = 160 + ((i * 71) % 120), lean = ((i * 29) % 60) - 30;
    blades += `<path d="M${x - 14} 330 Q${x + lean * 0.3} ${330 - h * 0.6} ${x + lean} ${330 - h} Q${x + lean * 0.4 + 6} ${330 - h * 0.5} ${x + 14} 330 Z" fill="url(#${g})"/>`;
  }
  return {
    key: 'gi_fg_grass', w: 900, h: 330, svg: svgDoc(900, 330, `<defs>${lightGrad(g, '#b8ec8e', '#6fbf4e', '#3f8f34', true)}${blur(b, 4)}</defs>
      <g filter="url(#${b})">${blades}
      <circle cx="160" cy="150" r="22" fill="#ffd6ea"/><circle cx="160" cy="150" r="9" fill="#ffd23a"/>
      <circle cx="640" cy="120" r="18" fill="#d9ccff"/><circle cx="640" cy="120" r="7" fill="#fff3a0"/></g>`),
  };
}

/** Il vecchio albero gentile, con la porticina delle fate alla base. */
function bigTree(): SvgTex {
  const tr = uid('tk'), le = uid('le'), sh = uid('sh'), dr = uid('dr');
  const blobs = [[260, 200, 150], [140, 270, 110], [380, 270, 115], [200, 130, 100], [330, 120, 95], [260, 320, 120]];
  return {
    key: 'gi_tree', w: 520, h: 760, svg: svgDoc(520, 760, `<defs>${lightGrad(tr, '#c99a6a', '#9a6a40', '#6a4426')}${ballGrad(le, '#d6f7b0', '#8ad46a', '#4c9a3e')}
      ${lightGrad(dr, '#ffd9a8', '#e8a65a', '#b8742e')}${blur(sh, 10)}</defs>
      <ellipse cx="270" cy="736" rx="200" ry="22" fill="#1d4020" opacity=".3" filter="url(#${sh})"/>
      <path d="M200 740 Q220 600 210 420 Q206 380 230 360 L300 360 Q322 380 318 420 Q306 600 340 740 Q300 728 270 732 Q236 728 200 740 Z" fill="url(#${tr})" stroke="#5e3a1e" stroke-width="4"/>
      <path d="M228 420 Q236 520 226 640 M296 430 Q290 540 304 660" stroke="#7a5030" stroke-width="5" fill="none" opacity=".5"/>
      <path d="M238 736 V672 Q238 640 266 640 Q294 640 294 672 V736 Z" fill="url(#${dr})" stroke="#8a5424" stroke-width="4"/>
      <circle cx="284" cy="694" r="5" fill="#ffe36a"/><circle cx="266" cy="664" r="9" fill="#bfeaff" stroke="#8a5424" stroke-width="3"/>
      ${blobs.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="url(#${le})"/>`).join('')}
      <ellipse cx="200" cy="90" rx="70" ry="30" fill="#fff" opacity=".22" transform="rotate(-20 200 90)"/>
      ${[[150, 220], [330, 180], [250, 300], [400, 300], [120, 330]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="10" fill="#ff8fb8" stroke="#d9578c" stroke-width="2"/><circle cx="${x}" cy="${y}" r="4" fill="#fff3a0"/>`).join('')}`),
  };
}

/** Cespuglio tondo fiorito. */
function bush(): SvgTex {
  const le = uid('bu'), sh = uid('sh');
  return {
    key: 'gi_bush', w: 340, h: 220, svg: svgDoc(340, 220, `<defs>${ballGrad(le, '#d6f7b0', '#86cf6a', '#4c9a3e')}${blur(sh, 6)}</defs>
      <ellipse cx="170" cy="204" rx="150" ry="14" fill="#1d4020" opacity=".3" filter="url(#${sh})"/>
      <circle cx="100" cy="140" r="70" fill="url(#${le})"/><circle cx="240" cy="140" r="72" fill="url(#${le})"/><circle cx="170" cy="100" r="86" fill="url(#${le})"/>
      <rect x="40" y="140" width="260" height="66" rx="33" fill="url(#${le})"/>
      <ellipse cx="140" cy="50" rx="40" ry="16" fill="#fff" opacity=".25" transform="rotate(-20 140 50)"/>
      ${[[90, 120], [170, 70], [250, 110], [210, 160], [120, 170]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="9" fill="#fff" stroke="#e6c6e4" stroke-width="2"/><circle cx="${x}" cy="${y}" r="3.5" fill="#ffd23a"/>`).join('')}`),
  };
}

/** Lo stagno con le ninfee e le canne. */
function pond(): SvgTex {
  const w = uid('pw'), sh = uid('sh'), lp = uid('lp'), rd = uid('rd');
  return {
    key: 'gi_pond', w: 640, h: 260, svg: svgDoc(640, 260, `<defs>
      <radialGradient id="${w}" cx=".4" cy=".35" r=".8"><stop offset="0" stop-color="#d6f4ff"/><stop offset=".5" stop-color="#8fd0f0"/><stop offset="1" stop-color="#4f9ec8"/></radialGradient>
      ${ballGrad(lp, '#c6f0a8', '#78c45e', '#3f8a3a')}${lightGrad(rd, '#c6e88a', '#8ab84a', '#5e8a2a', true)}${blur(sh, 6)}</defs>
      <ellipse cx="320" cy="190" rx="290" ry="66" fill="#7a5a3a" opacity=".55"/>
      <ellipse cx="320" cy="184" rx="280" ry="60" fill="url(#${w})" stroke="#c9a46a" stroke-width="6"/>
      <path d="M140 176 Q230 166 310 176 M360 196 Q440 188 520 198" stroke="#fff" stroke-width="5" opacity=".6" stroke-linecap="round"/>
      ${[[200, 196, 40], [420, 178, 34], [300, 210, 26]].map(([x, y, r]) => `<path d="M${x} ${y} m${r} 0 a${r} ${r * 0.42} 0 1 1 -${r * 0.3} -${r * 0.36} L${x} ${y} Z" fill="url(#${lp})" stroke="#3f8a3a" stroke-width="2"/>`).join('')}
      <circle cx="208" cy="186" r="12" fill="#ffd0e4" stroke="#e07aa8" stroke-width="2"/><circle cx="208" cy="186" r="5" fill="#fff3a0"/>
      ${[[560, 40], [580, 10], [600, 50], [70, 60], [90, 30]].map(([x, h]) => `<path d="M${x} 190 Q${x + 4} ${h + 60} ${x + 10} ${h}" stroke="url(#${rd})" stroke-width="8" fill="none" stroke-linecap="round"/><ellipse cx="${x + 10}" cy="${h + 10}" rx="7" ry="20" fill="#9a6a40"/>`).join('')}`),
  };
}

/** Fungo buffo a pallini (bianco e rosa: niente funghi "veri" da imitare). */
function mushroom(): SvgTex {
  const c = uid('mc'), st = uid('ms'), sh = uid('sh');
  return {
    key: 'gi_mushroom', w: 220, h: 240, svg: svgDoc(220, 240, `<defs>${lightGrad(c, '#ffd6ea', '#ff8fb8', '#d9578c')}${lightGrad(st, '#fffaf0', '#f6ead6', '#d9c4a0')}${blur(sh, 5)}</defs>
      <ellipse cx="112" cy="226" rx="80" ry="10" fill="#1d4020" opacity=".3" filter="url(#${sh})"/>
      <path d="M80 226 Q74 170 86 130 H138 Q150 170 144 226 Z" fill="url(#${st})" stroke="#c9b08a" stroke-width="3"/>
      <ellipse cx="100" cy="190" rx="5" ry="7" fill="#5e3a2a"/><ellipse cx="124" cy="190" rx="5" ry="7" fill="#5e3a2a"/>
      <path d="M104 206 Q112 212 120 206" stroke="#5e3a2a" stroke-width="3" fill="none" stroke-linecap="round"/>
      <path d="M14 136 Q20 30 112 24 Q204 30 208 136 Q160 150 112 148 Q62 150 14 136 Z" fill="url(#${c})" stroke="#c4467a" stroke-width="4"/>
      ${[[60, 90, 16], [112, 62, 20], [160, 92, 15], [86, 124, 10], [140, 126, 10]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#fff" opacity=".92"/>`).join('')}
      <ellipse cx="70" cy="56" rx="26" ry="10" fill="#fff" opacity=".45" transform="rotate(-25 70 56)"/>`),
  };
}

/** Arcobaleno morbido nel cielo (terza aiuola). */
function rainbow(): SvgTex {
  const cols = ['#ffadad', '#ffd6a5', '#fdffb6', '#caffbf', '#9bf6ff', '#a0c4ff', '#d4b8ff'];
  const b = uid('rb');
  return {
    key: 'gi_rainbow', w: 1400, h: 560, svg: svgDoc(1400, 560, `<defs>${blur(b, 6)}</defs><g filter="url(#${b})" fill="none" stroke-width="34" opacity=".7">
      ${cols.map((c, i) => `<path d="M${80 + i * 32} 560 A${620 - i * 32} ${500 - i * 32} 0 0 1 ${1320 - i * 32} 560" stroke="${c}"/>`).join('')}</g>`),
  };
}

// =====================================================================
// Terra, semi, germogli, boccioli e fiori
// =====================================================================

/** Montagnola di terra soffice con un anello di sassolini; `wet` è la terra appena bagnata. */
function soil(wet: boolean): SvgTex {
  const g = uid('so'), sh = uid('sh'), st = uid('st');
  const [l, b, d] = wet ? ['#a8744a', '#7a4a2a', '#4e2c16'] : ['#d9a070', '#a8704a', '#74462a'];
  let pebbles = '';
  for (let i = 0; i < 13; i++) {
    const a = Math.PI * (0.98 + i * 0.087);
    const x = 150 + Math.cos(a) * 128, y = 92 - Math.sin(a) * 30;
    pebbles += `<ellipse cx="${f1(x)}" cy="${f1(y + 4)}" rx="${12 + (i % 3) * 2}" ry="8" fill="url(#${st})" stroke="#9aa0b0" stroke-width="1.5"/>`;
  }
  return {
    key: wet ? 'gi_soil_wet' : 'gi_soil', w: 300, h: 140, svg: svgDoc(300, 140, `<defs>${lightGrad(g, l, b, d, true)}${lightGrad(st, '#ffffff', '#dfe3ec', '#aab2c4')}${blur(sh, 6)}</defs>
      <ellipse cx="156" cy="112" rx="140" ry="22" fill="#2a4a1a" opacity=".35" filter="url(#${sh})"/>
      <path d="M26 100 Q40 46 150 42 Q260 46 274 100 Q240 120 150 120 Q60 120 26 100 Z" fill="url(#${g})" stroke="${shade(d, -0.2)}" stroke-width="3"/>
      <path d="M70 66 Q110 52 150 54" stroke="#fff" stroke-width="6" opacity="${wet ? 0.5 : 0.25}" fill="none" stroke-linecap="round"/>
      ${[[110, 80], [180, 72], [200, 96], [90, 100], [150, 92]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="4" fill="${d}" opacity=".6"/>`).join('')}
      ${wet ? '<ellipse cx="120" cy="66" rx="14" ry="5" fill="#fff" opacity=".55"/><ellipse cx="196" cy="80" rx="9" ry="3.5" fill="#fff" opacity=".45"/>' : ''}
      ${pebbles}`),
  };
}

/** Seme lucido appena piantato, con un filo di luce magica. */
function seed(): SvgTex {
  const g = uid('se');
  return {
    key: 'gi_seed', w: 80, h: 80, svg: svgDoc(80, 80, `<defs>${ballGrad(g, '#f6d6a8', '#c98a55', '#8a5424')}</defs>
      <path d="M40 12 Q62 34 58 54 Q54 70 40 70 Q26 70 22 54 Q18 34 40 12 Z" fill="url(#${g})" stroke="#6a3a1a" stroke-width="3"/>
      <path d="M40 22 Q46 40 44 60" stroke="#8a5424" stroke-width="2.5" fill="none" opacity=".6"/>
      <ellipse cx="33" cy="36" rx="5" ry="10" fill="#fff" opacity=".6" transform="rotate(15 33 36)"/>`),
  };
}

/** Germoglio con due foglioline (origine in basso). */
function sprout(): SvgTex {
  const st = uid('sp'), lf = uid('lf');
  return {
    key: 'gi_sprout', w: 160, h: 150, svg: svgDoc(160, 150, `<defs>${lightGrad(st, '#c6f0a0', '#7cc95a', '#4a9a3a', true)}${lightGrad(lf, '#d6f7b0', '#86d466', '#3f9a3a')}</defs>
      <path d="M76 150 Q72 110 80 64 L86 64 Q82 110 86 150 Z" fill="url(#${st})" stroke="#3f8a34" stroke-width="2.5"/>
      <path d="M82 70 Q40 30 10 50 Q30 92 82 74 Z" fill="url(#${lf})" stroke="#3f8a34" stroke-width="3"/>
      <path d="M82 70 Q124 22 152 40 Q136 88 82 74 Z" fill="url(#${lf})" stroke="#3f8a34" stroke-width="3"/>
      <path d="M78 70 Q46 52 22 54 M86 70 Q116 46 140 44" stroke="#3f8a34" stroke-width="2" fill="none" opacity=".6"/>
      <ellipse cx="40" cy="52" rx="12" ry="5" fill="#fff" opacity=".5" transform="rotate(-15 40 52)"/>`),
  };
}

/** Stelo con due foglie, dalla base (cx, h) fino a y0. */
function stem(cx: number, y0: number, h: number, leafY: number[]): string {
  const st = uid('stm'), lf = uid('lf');
  const leaves = leafY.map((y, i) => {
    const s = i % 2 ? 1 : -1;
    return `<path d="M${cx} ${y} Q${cx + s * 50} ${y - 46} ${cx + s * 92} ${y - 30} Q${cx + s * 60} ${y + 18} ${cx} ${y + 6} Z" fill="url(#${lf})" stroke="#3f8a34" stroke-width="3"/>
      <path d="M${cx + s * 4} ${y + 2} Q${cx + s * 44} ${y - 20} ${cx + s * 80} ${y - 28}" stroke="#3f8a34" stroke-width="2" fill="none" opacity=".55"/>`;
  }).join('');
  return `<defs>${lightGrad(st, '#c6f0a0', '#78c45a', '#3f8a34', true)}${lightGrad(lf, '#d6f7b0', '#86d466', '#3f9a3a')}</defs>
    <path d="M${cx - 6} ${h} Q${cx - 12} ${(y0 + h) / 2} ${cx - 5} ${y0} L${cx + 5} ${y0} Q${cx - 2} ${(y0 + h) / 2} ${cx + 6} ${h} Z" fill="url(#${st})" stroke="#3f8a34" stroke-width="2.5"/>${leaves}`;
}

/** Bocciolo chiuso del colore del fiore (origine in basso). */
function bud(fl: FlowerDef): SvgTex {
  const g = uid('bd'), se = uid('sp');
  const [l, b, d] = fl.petal;
  return {
    key: `gi_bud_${fl.id}`, w: 200, h: 280, svg: svgDoc(200, 280, `${stem(100, 96, 280, [200])}
      <defs>${ballGrad(g, l, b, d)}${lightGrad(se, '#c6f0a0', '#78c45a', '#3f8a34')}</defs>
      <path d="M100 18 Q144 60 136 92 Q128 116 100 116 Q72 116 64 92 Q56 60 100 18 Z" fill="url(#${g})" stroke="${shade(d, -0.25)}" stroke-width="3"/>
      <path d="M100 30 Q112 60 108 100" stroke="${shade(d, -0.1)}" stroke-width="2.5" fill="none" opacity=".5"/>
      <path d="M62 92 Q72 128 100 122 Q86 108 84 88 Z M138 92 Q128 128 100 122 Q114 108 116 88 Z" fill="url(#${se})" stroke="#3f8a34" stroke-width="2.5"/>
      <ellipse cx="86" cy="54" rx="8" ry="16" fill="#fff" opacity=".55" transform="rotate(20 86 54)"/>`),
  };
}

/** Faccina felice al centro del fiore (occhi chiusi a sorriso, guance rosa). */
function face(cx: number, cy: number, s: number, ink = '#6a3a2a'): string {
  return `<path d="M${cx - 16 * s} ${cy - 2 * s} Q${cx - 10 * s} ${cy - 10 * s} ${cx - 4 * s} ${cy - 2 * s} M${cx + 4 * s} ${cy - 2 * s} Q${cx + 10 * s} ${cy - 10 * s} ${cx + 16 * s} ${cy - 2 * s}" stroke="${ink}" stroke-width="${3.4 * s}" fill="none" stroke-linecap="round"/>
    <path d="M${cx - 8 * s} ${cy + 8 * s} Q${cx} ${cy + 16 * s} ${cx + 8 * s} ${cy + 8 * s}" stroke="${ink}" stroke-width="${3.2 * s}" fill="none" stroke-linecap="round"/>
    <ellipse cx="${cx - 21 * s}" cy="${cy + 7 * s}" rx="${6 * s}" ry="${4 * s}" fill="#ff7fa8" opacity=".45"/><ellipse cx="${cx + 21 * s}" cy="${cy + 7 * s}" rx="${6 * s}" ry="${4 * s}" fill="#ff7fa8" opacity=".45"/>`;
}

/** Corolla del fiore centrata in (130, 130). */
function corolla(fl: FlowerDef): string {
  const pg = uid('pt'), hg = uid('ht');
  const [pl, pb, pd] = fl.petal;
  const [hl, hb, hd] = fl.heart;
  const defs = `<defs>${lightGrad(pg, pl, pb, pd)}${ballGrad(hg, hl, hb, hd)}</defs>`;
  const ring = (n: number, rx: number, ry: number, dist: number, fill: string, stroke: string, off = 0, op = 1): string => {
    let s = '';
    for (let i = 0; i < n; i++) {
      const a = off + (i * 360) / n;
      s += `<ellipse cx="130" cy="${130 - dist}" rx="${rx}" ry="${ry}" fill="${fill}" stroke="${stroke}" stroke-width="2.5" opacity="${op}" transform="rotate(${f1(a)} 130 130)"/>`;
    }
    return s;
  };
  const heart = (r: number) => `<circle cx="130" cy="130" r="${r}" fill="url(#${hg})" stroke="${shade(hd, -0.2)}" stroke-width="3"/>
    <ellipse cx="${130 - r * 0.35}" cy="${130 - r * 0.45}" rx="${r * 0.3}" ry="${r * 0.18}" fill="#fff" opacity=".6"/>`;
  switch (fl.id) {
    case 'daisy':
      return defs + ring(14, 15, 46, 58, `url(#${pg})`, '#d9b8d6') + heart(40) + face(130, 132, 1);
    case 'tulip':
      return `${defs}<path d="M58 90 Q60 200 130 206 Q200 200 202 90 Q170 130 130 82 Q90 130 58 90 Z" fill="url(#${pg})" stroke="${shade(pd, -0.25)}" stroke-width="3"/>
        <path d="M82 70 Q130 30 178 70 Q170 150 130 160 Q90 150 82 70 Z" fill="${pb}" stroke="${shade(pd, -0.25)}" stroke-width="3"/>
        <path d="M104 82 Q130 56 156 82" stroke="#fff" stroke-width="6" opacity=".45" fill="none" stroke-linecap="round"/>
        <ellipse cx="80" cy="120" rx="10" ry="28" fill="#fff" opacity=".35"/>${face(130, 150, 1.05, '#7a1a3a')}`;
    case 'bell': {
      const bell = (x: number, y: number, s: number) => `<path d="M${x - 44 * s} ${y + 40 * s} Q${x - 46 * s} ${y - 40 * s} ${x} ${y - 46 * s} Q${x + 46 * s} ${y - 40 * s} ${x + 44 * s} ${y + 40 * s}
          Q${x + 30 * s} ${y + 54 * s} ${x + 15 * s} ${y + 42 * s} Q${x} ${y + 56 * s} ${x - 15 * s} ${y + 42 * s} Q${x - 30 * s} ${y + 54 * s} ${x - 44 * s} ${y + 40 * s} Z" fill="url(#${pg})" stroke="${shade(pd, -0.25)}" stroke-width="3"/>
        <ellipse cx="${x - 20 * s}" cy="${y - 20 * s}" rx="${9 * s}" ry="${18 * s}" fill="#fff" opacity=".5"/>`;
      return `${defs}<path d="M130 200 Q130 40 60 60 M130 120 Q160 40 206 66" stroke="#5aa83f" stroke-width="7" fill="none" stroke-linecap="round"/>
        ${bell(62, 92, 0.62)}${bell(206, 98, 0.58)}${bell(130, 150, 1)}<circle cx="130" cy="204" r="9" fill="url(#${hg})"/>${face(130, 150, 1.05, '#3a2a6a')}`;
    }
    case 'sun': {
      let p = '';
      for (let i = 0; i < 18; i++) {
        const a = (i * 20) * Math.PI / 180;
        const tip = [130 + Math.sin(a) * 118, 130 - Math.cos(a) * 118];
        const l1 = [130 + Math.sin(a - 0.17) * 56, 130 - Math.cos(a - 0.17) * 56];
        const r1 = [130 + Math.sin(a + 0.17) * 56, 130 - Math.cos(a + 0.17) * 56];
        p += `<path d="M${f1(l1[0])} ${f1(l1[1])} Q${f1((l1[0] + tip[0]) / 2 - Math.cos(a) * 12)} ${f1((l1[1] + tip[1]) / 2 - Math.sin(a) * 12)} ${f1(tip[0])} ${f1(tip[1])} Q${f1((r1[0] + tip[0]) / 2 + Math.cos(a) * 12)} ${f1((r1[1] + tip[1]) / 2 + Math.sin(a) * 12)} ${f1(r1[0])} ${f1(r1[1])} Z" fill="url(#${pg})" stroke="#d98a00" stroke-width="2.5"/>`;
      }
      let dots = '';
      for (let i = 0; i < 26; i++) {
        const a = i * 2.4, r = 10 + (i % 6) * 7;
        dots += `<circle cx="${f1(130 + Math.cos(a) * r)}" cy="${f1(130 + Math.sin(a) * r)}" r="2.6" fill="#3e2410" opacity=".55"/>`;
      }
      return defs + p + heart(58) + dots + face(130, 132, 1.25, '#fff3d0');
    }
    case 'rose': {
      let s = defs + ring(6, 40, 46, 46, `url(#${pg})`, shade(pd, -0.2), 30) + ring(5, 30, 34, 26, pb, shade(pd, -0.2));
      s += `<circle cx="130" cy="130" r="44" fill="url(#${pg})" stroke="${shade(pd, -0.2)}" stroke-width="3"/>
        <path d="M100 120 Q110 92 140 96 Q166 104 158 130" stroke="${shade(pd, -0.15)}" stroke-width="3" fill="none"/>
        <path d="M112 112 Q126 100 142 110" stroke="#fff" stroke-width="4" opacity=".5" fill="none" stroke-linecap="round"/>`;
      return s + face(130, 140, 0.9, '#7a2a1a');
    }
    case 'star':
      return `${defs}<path d="${starPath(130, 134, 120, 0.5)}" fill="url(#${pg})" stroke="#e0a000" stroke-width="4" stroke-linejoin="round"/>
        <path d="${starPath(130, 134, 70, 0.5)}" fill="#fff" opacity=".35"/>${heart(40)}${face(130, 134, 1, '#8a5a00')}`;
    case 'moon':
      return `${defs}${ring(6, 44, 52, 62, `url(#${pg})`, '#8ac6ea')}${ring(6, 16, 24, 70, '#ffffff', 'none', 0, 0.45)}
        ${heart(44)}<path d="M154 92 A26 26 0 1 1 154 130 A20 20 0 1 0 154 92 Z" fill="#fff6c8" stroke="#e0c060" stroke-width="2" transform="translate(-8 -40)"/>${face(130, 134, 1, '#3a5a8a')}`;
    case 'rainbow': {
      const cols = [['#ffd0d0', '#ff8a8a', '#e05a5a'], ['#ffe6c8', '#ffb46a', '#e08a3a'], ['#fff8c0', '#ffe36a', '#e0b400'], ['#d8f8c8', '#8ade6a', '#4aa83a'],
        ['#d0f0ff', '#6ac8ff', '#3a8ad8'], ['#e0d8ff', '#a08cff', '#6a52d8'], ['#ffd8f0', '#ff8ad0', '#d84aa0']];
      let s = '<defs>';
      cols.forEach((c, i) => { s += lightGrad(`${pg}r${i}`, c[0], c[1], c[2]); });
      s += `${ballGrad(hg, hl, hb, hd)}</defs>`;
      cols.forEach((c, i) => { s += `<ellipse cx="130" cy="72" rx="34" ry="54" fill="url(#${pg}r${i})" stroke="${c[2]}" stroke-width="2.5" transform="rotate(${f1((i * 360) / 7)} 130 130)"/>`; });
      return s + heart(42) + face(130, 132, 1, '#8a5a00');
    }
  }
}

/** Fiore sbocciato: stelo, foglie e corolla con il viso (origine in basso al centro). */
function bloom(fl: FlowerDef): SvgTex {
  return {
    key: `gi_fl_${fl.id}`, w: 260, h: 420, svg: svgDoc(260, 420, `${stem(130, 170, 420, [330, 270])}${corolla(fl)}`),
  };
}

// =====================================================================
// Nuvola, pioggia, fumetto della sete
// =====================================================================

function cloudFace(rain: boolean): SvgTex {
  const c = uid('cl'), sh = uid('cs');
  const eyes = rain
    ? `<path d="M140 124 Q150 112 160 124 M220 124 Q230 112 240 124" stroke="#4a5a8a" stroke-width="7" fill="none" stroke-linecap="round"/>
       <ellipse cx="190" cy="150" rx="13" ry="15" fill="#4a5a8a"/><ellipse cx="190" cy="156" rx="8" ry="7" fill="#ff8aa8"/>`
    : `<ellipse cx="150" cy="122" rx="11" ry="14" fill="#3a4a7a"/><ellipse cx="230" cy="122" rx="11" ry="14" fill="#3a4a7a"/>
       <circle cx="146" cy="116" r="4.5" fill="#fff"/><circle cx="226" cy="116" r="4.5" fill="#fff"/>
       <path d="M174 146 Q190 160 206 146" stroke="#3a4a7a" stroke-width="6" fill="none" stroke-linecap="round"/>`;
  return {
    key: rain ? 'gi_cloud_rain' : 'gi_cloud', w: 380, h: 230, svg: svgDoc(380, 230, `<defs>
      <linearGradient id="${c}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset=".6" stop-color="#f2f8ff"/><stop offset="1" stop-color="${rain ? '#b9cde6' : '#cfe0f4'}"/></linearGradient>${blur(sh, 6)}</defs>
      <g fill="#7a90b8" opacity=".25" filter="url(#${sh})"><circle cx="110" cy="132" r="64"/><circle cx="196" cy="104" r="80"/><circle cx="284" cy="134" r="60"/><rect x="70" y="130" width="250" height="70" rx="35"/></g>
      <g fill="url(#${c})" stroke="#b4c8e4" stroke-width="3"><circle cx="104" cy="120" r="64"/><circle cx="190" cy="92" r="80"/><circle cx="278" cy="122" r="60"/><rect x="64" y="118" width="250" height="70" rx="35"/></g>
      <rect x="70" y="120" width="238" height="64" rx="30" fill="url(#${c})"/>
      <ellipse cx="160" cy="46" rx="42" ry="16" fill="#fff" opacity=".95"/>
      ${eyes}<ellipse cx="124" cy="148" rx="15" ry="9" fill="#ff9fbf" opacity=".5"/><ellipse cx="256" cy="148" rx="15" ry="9" fill="#ff9fbf" opacity=".5"/>`),
  };
}

function drop(): SvgTex {
  const g = uid('dp');
  return {
    key: 'gi_drop', w: 30, h: 44, svg: svgDoc(30, 44, `<defs>${ballGrad(g, '#ffffff', '#9fdcff', '#4aa8e0')}</defs>
      <path d="M15 2 Q28 24 26 31 Q24 42 15 42 Q6 42 4 31 Q2 24 15 2 Z" fill="url(#${g})" stroke="#3a90c8" stroke-width="1.5"/>
      <ellipse cx="11" cy="28" rx="3" ry="6" fill="#fff" opacity=".8"/>`),
  };
}

/** Fumetto con la goccia: "ho sete!". */
function thirstBubble(): SvgTex {
  const g = uid('tb'), d = uid('dp');
  return {
    key: 'gi_bubble', w: 130, h: 130, svg: svgDoc(130, 130, `<defs>${lightGrad(g, '#ffffff', '#f6fbff', '#d6e6f6')}${ballGrad(d, '#ffffff', '#8fd6ff', '#3a98d8')}</defs>
      <circle cx="30" cy="118" r="7" fill="url(#${g})" stroke="#a9c4e0" stroke-width="2"/><circle cx="44" cy="102" r="10" fill="url(#${g})" stroke="#a9c4e0" stroke-width="2"/>
      <circle cx="78" cy="56" r="48" fill="url(#${g})" stroke="#a9c4e0" stroke-width="3"/>
      <path d="M78 22 Q100 52 98 64 Q96 84 78 84 Q60 84 58 64 Q56 52 78 22 Z" fill="url(#${d})" stroke="#2a80c0" stroke-width="2.5"/>
      <ellipse cx="70" cy="60" rx="5" ry="10" fill="#fff" opacity=".8"/>`),
  };
}

// =====================================================================
// Farfalle e fatine
// =====================================================================

function butterfly(fl: FlowerDef): SvgTex {
  const g = uid('bw'), g2 = uid('bw2');
  const base = fl.id === 'daisy' ? '#ffd23a' : fl.glow;
  const dark = shade(base, -0.35);
  return {
    key: `gi_bf_${fl.id}`, w: 140, h: 120, svg: svgDoc(140, 120, `<defs>${ballGrad(g, '#ffffff', base, dark)}${ballGrad(g2, '#ffffff', shade(base, 0.2), shade(base, -0.2))}</defs>
      <path d="M68 56 Q40 4 14 18 Q-2 34 24 58 Q40 70 68 60 Z" fill="url(#${g})" stroke="${shade(dark, -0.2)}" stroke-width="3"/>
      <path d="M72 56 Q100 4 126 18 Q142 34 116 58 Q100 70 72 60 Z" fill="url(#${g})" stroke="${shade(dark, -0.2)}" stroke-width="3"/>
      <path d="M68 64 Q36 76 32 96 Q40 110 58 98 Q68 88 68 68 Z" fill="url(#${g2})" stroke="${shade(dark, -0.2)}" stroke-width="3"/>
      <path d="M72 64 Q104 76 108 96 Q100 110 82 98 Q72 88 72 68 Z" fill="url(#${g2})" stroke="${shade(dark, -0.2)}" stroke-width="3"/>
      <circle cx="38" cy="36" r="8" fill="#fff" opacity=".7"/><circle cx="102" cy="36" r="8" fill="#fff" opacity=".7"/>
      <ellipse cx="70" cy="66" rx="7" ry="26" fill="#5a3a5a"/><circle cx="70" cy="40" r="8" fill="#5a3a5a"/>
      <path d="M66 34 Q58 18 52 14 M74 34 Q82 18 88 14" stroke="#5a3a5a" stroke-width="3" fill="none" stroke-linecap="round"/>
      <circle cx="52" cy="14" r="3.5" fill="#5a3a5a"/><circle cx="88" cy="14" r="3.5" fill="#5a3a5a"/>`),
  };
}

/** Ala di fatina (destra), chiara e trasparente: si colora con il tint della fatina. */
function wing(): SvgTex {
  const g = uid('wg');
  return {
    key: 'gi_wing', w: 150, h: 150, svg: svgDoc(150, 150, `<defs><radialGradient id="${g}" cx=".2" cy=".5" r=".9"><stop offset="0" stop-color="#ffffff" stop-opacity=".95"/><stop offset="1" stop-color="#ffffff" stop-opacity=".45"/></radialGradient></defs>
      <path d="M8 74 Q40 4 110 10 Q150 18 136 56 Q124 84 8 80 Z" fill="url(#${g})" stroke="#ffffff" stroke-width="3"/>
      <path d="M8 82 Q90 86 112 116 Q118 144 84 142 Q40 134 8 88 Z" fill="url(#${g})" stroke="#ffffff" stroke-width="3"/>
      <path d="M12 76 Q60 40 116 28 M12 80 Q70 70 126 58 M12 86 Q60 104 92 132" stroke="#ffffff" stroke-width="2.5" fill="none" opacity=".9"/>
      <circle cx="100" cy="34" r="6" fill="#fff"/><circle cx="90" cy="122" r="5" fill="#fff"/>`),
  };
}

function hairBack(f: FairyDef, hg: string): string {
  switch (f.style) {
    case 'long': return `<path d="M44 64 Q40 150 60 170 Q86 150 85 120 Q84 150 110 170 Q130 150 126 64 Z" fill="url(#${hg})" stroke="${shade(f.hair[1], -0.2)}" stroke-width="3"/>`;
    case 'pigtails': return `<circle cx="38" cy="82" r="20" fill="url(#${hg})" stroke="${shade(f.hair[1], -0.2)}" stroke-width="3"/><circle cx="132" cy="82" r="20" fill="url(#${hg})" stroke="${shade(f.hair[1], -0.2)}" stroke-width="3"/>`;
    case 'curly': return [[48, 60], [122, 60], [42, 86], [128, 86], [56, 104], [114, 104]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="17" fill="url(#${hg})" stroke="${shade(f.hair[1], -0.2)}" stroke-width="2.5"/>`).join('');
    case 'bob': return `<path d="M46 66 Q42 112 60 112 H110 Q128 112 124 66 Z" fill="url(#${hg})" stroke="${shade(f.hair[1], -0.2)}" stroke-width="3"/>`;
    default: return '';
  }
}

function hairFront(f: FairyDef, hg: string): string {
  const st = `stroke="${shade(f.hair[1], -0.2)}" stroke-width="3"`;
  const fringe = `<path d="M50 70 Q48 28 85 26 Q122 28 120 70 Q108 52 96 56 Q86 44 74 56 Q62 50 50 70 Z" fill="url(#${hg})" ${st}/>`;
  switch (f.style) {
    case 'bun': return `<circle cx="85" cy="22" r="20" fill="url(#${hg})" ${st}/>${fringe}<ellipse cx="78" cy="14" rx="7" ry="4" fill="#fff" opacity=".5"/>`;
    case 'short': return `<path d="M48 70 Q44 26 85 24 Q126 26 122 70 Q116 54 104 60 Q98 44 86 52 Q74 44 66 58 Q54 54 48 70 Z" fill="url(#${hg})" ${st}/>
      <path d="M58 36 Q85 4 112 36 Q85 26 58 36 Z" fill="#7fcf6a" stroke="#3f9a3a" stroke-width="3"/><path d="M85 14 V4" stroke="#3f9a3a" stroke-width="4" stroke-linecap="round"/>`;
    case 'curly': return `${fringe}${[[60, 36], [85, 28], [110, 36]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="15" fill="url(#${hg})" ${st}/>`).join('')}`;
    default: return fringe;
  }
}

/** Fatina senza ali (le ali sono a parte e sbattono): testa tonda, vestito a petalo, bacchetta con la stellina. */
function fairy(f: FairyDef): SvgTex {
  const sk = uid('sk'), hg = uid('hg'), dr = uid('dr'), sh = uid('sh');
  const [dl, db, dd] = f.dress;
  const boy = f.style === 'short';
  const dress = boy
    ? `<path d="M60 112 Q58 150 64 168 H106 Q112 150 110 112 Q85 104 60 112 Z" fill="url(#${dr})" stroke="${shade(dd, -0.2)}" stroke-width="3"/>
       <path d="M60 162 L68 178 L77 164 L85 180 L93 164 L102 178 L110 162" fill="url(#${dr})" stroke="${shade(dd, -0.2)}" stroke-width="3" stroke-linejoin="round"/>
       <rect x="62" y="134" width="46" height="8" rx="4" fill="#9a6a3a"/>`
    : `<path d="M66 110 Q85 102 104 110 L130 176 Q120 188 108 178 Q98 192 85 180 Q72 192 62 178 Q50 188 40 176 Z" fill="url(#${dr})" stroke="${shade(dd, -0.2)}" stroke-width="3" stroke-linejoin="round"/>
       <path d="M78 116 Q70 150 60 172 M92 116 Q100 150 110 172" stroke="${dd}" stroke-width="2" fill="none" opacity=".5"/>`;
  const wandGlow = f.id === 'firefly' ? '#fff3a0' : '#ffe36a';
  return {
    key: `gi_fairy_${f.id}`, w: 170, h: 230, svg: svgDoc(170, 230, `<defs>${ballGrad(sk, shade(f.skin, 0.35), f.skin, shade(f.skin, -0.18))}${lightGrad(hg, shade(f.hair[0], 0.3), f.hair[0], f.hair[1])}
      ${lightGrad(dr, dl, db, dd)}${blur(sh, 3)}<radialGradient id="${sh}g"><stop offset="0" stop-color="${wandGlow}" stop-opacity=".9"/><stop offset="1" stop-color="${wandGlow}" stop-opacity="0"/></radialGradient></defs>
      ${hairBack(f, hg)}
      <path d="M76 178 L74 206 M94 178 L96 206" stroke="${shade(f.skin, -0.15)}" stroke-width="8" stroke-linecap="round"/>
      <ellipse cx="72" cy="208" rx="10" ry="6" fill="${dd}"/><ellipse cx="98" cy="208" rx="10" ry="6" fill="${dd}"/>
      ${dress}
      <path d="M66 120 Q48 140 44 150" stroke="${f.skin}" stroke-width="10" fill="none" stroke-linecap="round"/>
      <path d="M104 120 Q124 120 136 104" stroke="${f.skin}" stroke-width="10" fill="none" stroke-linecap="round"/>
      <path d="M138 104 L150 60" stroke="#c98a55" stroke-width="5" stroke-linecap="round"/>
      <circle cx="152" cy="54" r="24" fill="url(#${sh}g)"/><path d="${starPath(152, 54, 15)}" fill="${wandGlow}" stroke="#e0a000" stroke-width="2.5" stroke-linejoin="round"/>
      <circle cx="85" cy="70" r="40" fill="url(#${sk})" stroke="${shade(f.skin, -0.3)}" stroke-width="3"/>
      ${hairFront(f, hg)}
      <ellipse cx="71" cy="76" rx="6.5" ry="8.5" fill="#3a2a4a"/><ellipse cx="99" cy="76" rx="6.5" ry="8.5" fill="#3a2a4a"/>
      <circle cx="69" cy="73" r="2.6" fill="#fff"/><circle cx="97" cy="73" r="2.6" fill="#fff"/>
      <path d="M77 92 Q85 99 93 92" stroke="#a03a4a" stroke-width="3.5" fill="none" stroke-linecap="round"/>
      <ellipse cx="60" cy="88" rx="7" ry="4.5" fill="#ff7fa8" opacity=".5"/><ellipse cx="110" cy="88" rx="7" ry="4.5" fill="#ff7fa8" opacity=".5"/>
      <ellipse cx="68" cy="52" rx="9" ry="5" fill="#fff" opacity=".35" transform="rotate(-25 68 52)"/>`),
  };
}

// =====================================================================
// Interfaccia
// =====================================================================

/** Icona dell'album: un fiore con la stellina (per il pulsante tondo). */
const ALBUM_ICON = `<g><circle cx="50" cy="30" r="15" fill="#fff"/><circle cx="30" cy="48" r="15" fill="#fff"/><circle cx="70" cy="48" r="15" fill="#fff"/>
  <circle cx="38" cy="70" r="15" fill="#fff"/><circle cx="62" cy="70" r="15" fill="#fff"/><circle cx="50" cy="52" r="13" fill="#ffd23a" stroke="#fff" stroke-width="3"/></g>`;

/** Cartoncino dell'album (fiore o fatina). */
function card(): SvgTex {
  const g = uid('cd'), sh = uid('sh');
  return {
    key: 'gi_card', w: 220, h: 240, svg: svgDoc(220, 240, `<defs>${lightGrad(g, '#ffffff', '#fbfff4', '#e2f2d2', true)}${blur(sh, 6)}</defs>
      <rect x="16" y="22" width="194" height="210" rx="34" fill="#2a5a2a" opacity=".25" filter="url(#${sh})"/>
      <rect x="10" y="10" width="196" height="212" rx="34" fill="url(#${g})" stroke="#9ad48a" stroke-width="5"/>
      <rect x="22" y="20" width="172" height="40" rx="20" fill="#fff" opacity=".6"/>`),
  };
}

/** Pallino d'avanzamento dell'aiuola (vaso ancora da far fiorire). */
function slot(): SvgTex {
  const g = uid('sl');
  return {
    key: 'gi_slot', w: 70, h: 70, svg: svgDoc(70, 70, `<defs>${ballGrad(g, '#e6c09a', '#b07a50', '#7a4a2a')}</defs>
      <circle cx="35" cy="35" r="28" fill="#fff" fill-opacity=".55" stroke="#ffffff" stroke-width="4"/>
      <circle cx="35" cy="38" r="12" fill="url(#${g})" opacity=".85"/>`),
  };
}

export function gameTextures(): SvgTex[] {
  return [
    hillsFar(), hillsNear(), fgGrass(), bigTree(), bush(), pond(), mushroom(), rainbow(),
    soil(false), soil(true), seed(), sprout(),
    ...FLOWERS.map(bud), ...FLOWERS.map(bloom), ...FLOWERS.map(butterfly),
    cloudFace(false), cloudFace(true), drop(), thirstBubble(),
    wing(), ...FAIRIES.map(fairy),
    card(), slot(),
    roundButton('gi_btn_album', '#5fbf6a', ALBUM_ICON, 200),
  ];
}
