import { svgDoc, type SvgTex } from '../../core/textures';
import { lightGrad, ballGrad, blur, starPath, shade, roundButton, uid } from '../../core/art';
import { PLANETS, HOME, ROCKETS, type Planet, type Rocket } from './planets';
import { rng } from './course';

/**
 * Grafica di Razzo tra le Stelle: tutta originale, disegnata in SVG (stile 2.5D Tappolino:
 * luce dall'alto a sinistra, volume con sfumature, riflessi, bordi in una tonalità scura dello stesso colore).
 */

/** Riquadro comune delle texture dei pianeti: la sfera ha sempre lo stesso centro e raggio. */
export const PF = { w: 600, h: 480, cx: 300, cy: 240, r: 200 } as const;
/** Occhi del pianeta (coordinate della texture) e palpebra che li copre. */
export const EYES = { y: 236, dx: 42, lidW: 150, lidH: 72 } as const;

/** Riquadro dei razzi (orizzontali, punta a destra) e punto dello scarico. */
export const RF = { w: 300, h: 160, tailX: 34 } as const;

// ---------------------------------------------------------------- cielo

/**
 * Cielo con le stelle lontane già dentro (un solo piano a tutto schermo: meno lavoro per i telefoni economici).
 * Alto quanto l'area di design e ripetibile in orizzontale: in scena scorre come TileSprite.
 */
function skyTex(): SvgTex {
  const r = rng(11);
  const cols = ['#ffffff', '#ffffff', '#fff3c4', '#cfe3ff', '#ffd6f0'];
  let dots = '';
  for (const [n, rMin, rMax, op] of [[170, 0.8, 1.6, 0.8], [46, 1.5, 2.6, 1]] as const) {
    for (let i = 0; i < n; i++) {
      const x = 8 + r() * 496, y = 8 + r() * 1064, rr = rMin + r() * (rMax - rMin);
      dots += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${rr.toFixed(2)}" fill="${cols[i % cols.length]}" opacity="${(op * (0.45 + r() * 0.55)).toFixed(2)}"/>`;
    }
  }
  return {
    key: 'rz_sky', w: 512, h: 1080, svg: svgDoc(512, 1080, `<defs><linearGradient id="s" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${SKY_TOP}"/><stop offset=".45" stop-color="#121c66"/><stop offset=".8" stop-color="#2a37a0"/><stop offset="1" stop-color="${SKY_BOTTOM}"/></linearGradient></defs>
      <rect width="512" height="1080" fill="url(#s)"/>${dots}`),
  };
}

export const SKY_TOP = '#060a2a';
export const SKY_BOTTOM = '#3c4fc4';

/** Stellina scintillante del piano vicino (poche immagini piccole invece di un piano a tutto schermo). */
function twinkleTex(): SvgTex {
  return {
    key: 'rz_twinkle', w: 64, h: 64, svg: svgDoc(64, 64, `<defs><radialGradient id="gl"><stop offset="0" stop-color="#fff" stop-opacity=".7"/><stop offset="1" stop-color="#bcd4ff" stop-opacity="0"/></radialGradient></defs>
      <circle cx="32" cy="32" r="16" fill="url(#gl)"/>
      <path d="M32 6 Q34.5 29.5 58 32 Q34.5 34.5 32 58 Q29.5 34.5 6 32 Q29.5 29.5 32 6 Z" fill="#ffffff"/>`),
  };
}

const NEB: Record<string, [string, string, string]> = {
  pink: ['#ff6fb5', '#b45cf0', '#ffb36b'],
  teal: ['#39d0c8', '#3c7cf0', '#9cf06a'],
  gold: ['#ffb84a', '#ff6f6f', '#b45cf0'],
  violet: ['#9a6cff', '#ff7ad1', '#4fb8ff'],
};

function nebulaTex(kind: string): SvgTex {
  const [a, b, c] = NEB[kind];
  return {
    key: `rz_neb_${kind}`, w: 640, h: 400, svg: svgDoc(640, 400, `<defs>${blur('b', 34)}${blur('b2', 18)}</defs>
      <g filter="url(#b)">
        <ellipse cx="270" cy="210" rx="150" ry="80" fill="${a}" opacity=".75"/>
        <ellipse cx="380" cy="180" rx="120" ry="70" fill="${b}" opacity=".7"/>
        <ellipse cx="330" cy="240" rx="90" ry="50" fill="${c}" opacity=".6"/>
      </g>
      <g filter="url(#b2)"><ellipse cx="300" cy="200" rx="60" ry="26" fill="#ffffff" opacity=".35"/></g>`),
  };
}

function dustTex(): SvgTex {
  return {
    key: 'rz_dust', w: 240, h: 30, svg: svgDoc(240, 30, `<defs>${blur('b', 3)}<linearGradient id="d" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".8" stop-color="#e8f0ff" stop-opacity=".9"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient></defs>
      <rect x="10" y="11" width="220" height="8" rx="4" fill="url(#d)" filter="url(#b)"/>`),
  };
}

// ---------------------------------------------------------------- pianeti

const FACE = (dark: string): string => {
  const { y, dx } = EYES;
  const eye = (x: number) => `<ellipse cx="${x}" cy="${y}" rx="23" ry="27" fill="#ffffff" stroke="${dark}" stroke-width="3"/>
    <circle cx="${x + 4}" cy="${y + 5}" r="14" fill="#2b2140"/><circle cx="${x - 1}" cy="${y - 1}" r="5.5" fill="#fff"/>`;
  return `${eye(PF.cx - dx)}${eye(PF.cx + dx)}
    <ellipse cx="${PF.cx - 84}" cy="${y + 40}" rx="20" ry="11" fill="#ff6f8f" opacity=".45"/>
    <ellipse cx="${PF.cx + 84}" cy="${y + 40}" rx="20" ry="11" fill="#ff6f8f" opacity=".45"/>
    <path d="M${PF.cx - 30} ${y + 44} Q${PF.cx} ${y + 76} ${PF.cx + 30} ${y + 44}" stroke="#2b2140" stroke-width="7" fill="#7a2a3a" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M${PF.cx - 14} ${y + 60} Q${PF.cx} ${y + 70} ${PF.cx + 14} ${y + 60}" stroke="#ff8fa3" stroke-width="5" fill="none" stroke-linecap="round"/>`;
};

/** Dettagli della superficie di ogni pianeta (dentro la sfera). */
function surface(p: Planet | 'casa'): { inside: string; back?: string; front?: string } {
  const { cx, cy } = PF;
  switch (p === 'casa' ? 'casa' : p.id) {
    case 'casa':
      return {
        inside: `<path d="M120 170 Q170 120 230 140 Q260 170 220 200 Q180 230 140 220 Q110 200 120 170 Z" fill="#6cc24a"/>
          <path d="M360 120 Q430 110 470 160 Q480 210 430 220 Q390 200 370 170 Q350 140 360 120 Z" fill="#6cc24a"/>
          <path d="M330 340 Q380 320 430 350 Q440 390 390 410 Q340 400 330 340 Z" fill="#6cc24a"/>
          <path d="M150 330 Q190 320 210 360 Q190 390 160 380 Z" fill="#8fd96a"/>
          <path d="M90 110 Q160 80 230 96" stroke="#fff" stroke-width="14" fill="none" stroke-linecap="round" opacity=".8"/>
          <path d="M300 420 Q380 440 450 410" stroke="#fff" stroke-width="12" fill="none" stroke-linecap="round" opacity=".7"/>`,
      };
    case 'luna':
      return {
        inside: [[190, 140, 34], [395, 160, 24], [400, 340, 42], [190, 350, 28], [305, 95, 16], [130, 260, 18], [470, 250, 16]]
          .map(([x, y, r]) => `<ellipse cx="${x}" cy="${y}" rx="${r}" ry="${r * 0.82}" fill="#8a7e5c" opacity=".32"/>
            <ellipse cx="${x + r * 0.12}" cy="${y + r * 0.14}" rx="${r * 0.78}" ry="${r * 0.62}" fill="#fff8e0" opacity=".45"/>`).join(''),
      };
    case 'anelli': {
      const ring = (half: 'back' | 'front') => {
        const d = half === 'back' ? `M10 300 A290 62 0 0 1 590 300` : `M10 300 A290 62 0 0 0 590 300`;
        return `<path d="${d}" fill="none" stroke="#a8401e" stroke-width="30" opacity=".45" transform="translate(0 6)"/>
          <path d="${d}" fill="none" stroke="url(#ring)" stroke-width="26"/>
          <path d="${d}" fill="none" stroke="#fff6dc" stroke-width="5" opacity=".7" transform="translate(0 -8)"/>`;
      };
      return {
        inside: `<rect x="0" y="110" width="600" height="34" fill="#ffd6a0" opacity=".7"/>
          <rect x="0" y="160" width="600" height="16" fill="#e0884a" opacity=".55"/>
          <rect x="0" y="330" width="600" height="28" fill="#e0884a" opacity=".5"/>
          <rect x="0" y="372" width="600" height="40" fill="#ffd6a0" opacity=".55"/>`,
        back: ring('back'), front: ring('front'),
      };
    }
    case 'bolle':
      return {
        inside: `<path d="M60 150 Q130 120 200 150 T340 150 T480 150 T620 150" stroke="#a6ecff" stroke-width="22" fill="none" opacity=".7"/>
          <path d="M40 360 Q110 330 180 360 T320 360 T460 360 T600 360" stroke="#a6ecff" stroke-width="26" fill="none" opacity=".6"/>
          <path d="M60 410 Q130 390 200 410 T340 410 T480 410" stroke="#2a8cc4" stroke-width="18" fill="none" opacity=".5"/>`,
        front: [[470, 90, 22], [505, 150, 13], [118, 92, 16], [520, 330, 18], [86, 370, 12]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#dff8ff" fill-opacity=".35" stroke="#ffffff" stroke-width="3" stroke-opacity=".9"/>
          <ellipse cx="${x - r * 0.35}" cy="${y - r * 0.4}" rx="${r * 0.32}" ry="${r * 0.2}" fill="#fff"/>`).join(''),
      };
    case 'giungla':
      return {
        inside: `${[[150, 150, 60], [430, 140, 54], [420, 360, 70], [170, 360, 56], [300, 70, 40]].map(([x, y, r]) => `<path d="M${x - r} ${y} Q${x - r * 0.8} ${y - r} ${x} ${y - r * 0.9} Q${x + r * 0.9} ${y - r} ${x + r} ${y} Q${x + r * 0.7} ${y + r * 0.85} ${x} ${y + r * 0.7} Q${x - r * 0.8} ${y + r * 0.8} ${x - r} ${y} Z" fill="#3f9a32" opacity=".75"/>`).join('')}
          ${[[130, 130], [440, 130], [430, 350], [180, 370], [300, 64]].map(([x, y]) => `<path d="M${x - 22} ${y + 8} Q${x - 8} ${y - 26} ${x + 20} ${y - 18} Q${x + 10} ${y + 10} ${x - 22} ${y + 8} Z" fill="#a6e86a"/>
            <path d="M${x - 16} ${y + 4} Q${x} ${y - 8} ${x + 14} ${y - 14}" stroke="#3f8a2c" stroke-width="3" fill="none"/>`).join('')}`,
      };
    case 'caramella':
      return {
        inside: `<g opacity=".55">${[-300, -180, -60, 60, 180, 300, 420].map((o) => `<path d="M${o} 480 L${o + 70} 480 L${o + 410} 0 L${o + 340} 0 Z" fill="#ffffff"/>`).join('')}</g>
          ${[[170, 150, '#ffd23f'], [420, 130, '#36a9f0'], [450, 340, '#7ad66a'], [180, 350, '#ffd23f'], [320, 410, '#36a9f0'], [120, 250, '#7ad66a'], [480, 240, '#ff5a5f'], [300, 92, '#ff5a5f']]
            .map(([x, y, c], i) => `<rect x="${Number(x) - 12}" y="${Number(y) - 5}" width="24" height="10" rx="5" fill="${c}" transform="rotate(${(i * 47) % 180} ${x} ${y})"/>`).join('')}`,
      };
    case 'ghiaccio':
      return {
        inside: `<path d="M60 120 Q300 20 540 120 L540 150 Q500 140 490 170 Q470 140 430 150 Q410 185 380 150 Q350 140 330 165 Q300 140 270 160 Q240 190 220 150 Q190 135 170 160 Q150 140 120 155 Q100 135 60 150 Z" fill="#ffffff"/>
          ${[[150, 320, 40], [440, 300, 34], [320, 410, 28], [470, 400, 20]].map(([x, y, s]) => `<path d="M${x} ${y - s} L${x + s * 0.7} ${y} L${x} ${y + s} L${x - s * 0.7} ${y} Z" fill="#ffffff" opacity=".55"/>`).join('')}`,
      };
    case 'vulcano':
      return {
        inside: `<path d="M110 300 Q170 280 200 320 T300 350 T420 330 T520 350" stroke="#ffd23f" stroke-width="14" fill="none" stroke-linecap="round" opacity=".9"/>
          <path d="M110 300 Q170 280 200 320 T300 350 T420 330 T520 350" stroke="#fff3b0" stroke-width="5" fill="none" stroke-linecap="round"/>
          <path d="M140 400 Q220 380 260 410" stroke="#ffb84a" stroke-width="10" fill="none" stroke-linecap="round" opacity=".8"/>
          ${[[175, 140], [420, 120]].map(([x, y]) => `<path d="M${x - 50} ${y + 40} L${x - 18} ${y - 20} Q${x} ${y - 30} ${x + 18} ${y - 20} L${x + 50} ${y + 40} Z" fill="#a8401e"/>
            <path d="M${x - 40} ${y + 40} L${x - 14} ${y - 14} Q${x - 6} ${y - 20} ${x} ${y - 20} L${x - 12} ${y + 40} Z" fill="#d86a3a"/>
            <ellipse cx="${x}" cy="${y - 21}" rx="18" ry="6" fill="#ffd23f"/>`).join('')}`,
        front: [[175, 72, 22], [196, 52, 16], [420, 52, 20], [438, 34, 14]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#e8e0f0" opacity=".9"/><circle cx="${x - r * 0.3}" cy="${y - r * 0.3}" r="${r * 0.45}" fill="#fff"/>`).join(''),
      };
    case 'arcobaleno': {
      const cols = ['#ff5a5f', '#ff9f3a', '#ffd23f', '#6cc24a', '#36a9f0', '#8a5cf0'];
      return {
        inside: cols.map((c, i) => `<circle cx="${cx}" cy="${cy + 380}" r="${470 - i * 44}" fill="none" stroke="${c}" stroke-width="46" opacity=".8"/>`).join('')
          + `<g fill="#ffffff">${[[130, 400], [470, 395]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="38"/><circle cx="${x + 40}" cy="${y - 14}" r="34"/><circle cx="${x - 40}" cy="${y - 8}" r="30"/>`).join('')}</g>`,
      };
    }
  }
}

function planetTex(p: Planet | 'casa'): SvgTex {
  const key = p === 'casa' ? 'rz_planet_casa' : `rz_planet_${p.id}`;
  const c = p === 'casa' ? HOME : p;
  const { cx, cy, r } = PF;
  const s = surface(p);
  const ring = p !== 'casa' && p.id === 'anelli'
    ? `<linearGradient id="ring" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ffcf8a"/><stop offset=".5" stop-color="#fff0c8"/><stop offset="1" stop-color="#e09a5a"/></linearGradient>` : '';
  return {
    key, w: PF.w, h: PF.h, svg: svgDoc(PF.w, PF.h, `<defs>${ballGrad('pb', c.light, c.base, c.dark)}${ring}
      <radialGradient id="sh" cx=".78" cy=".82" r=".8"><stop offset="0" stop-color="#140c3a" stop-opacity=".55"/><stop offset=".55" stop-color="#140c3a" stop-opacity=".12"/><stop offset="1" stop-color="#140c3a" stop-opacity="0"/></radialGradient>
      <radialGradient id="at" cx=".5" cy=".5" r=".5"><stop offset=".86" stop-color="${c.light}" stop-opacity="0"/><stop offset=".95" stop-color="${c.light}" stop-opacity=".55"/><stop offset="1" stop-color="${c.light}" stop-opacity="0"/></radialGradient>
      <clipPath id="cp"><circle cx="${cx}" cy="${cy}" r="${r}"/></clipPath></defs>
      <circle cx="${cx}" cy="${cy}" r="${r + 16}" fill="url(#at)"/>
      ${s.back ?? ''}
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#pb)"/>
      <g clip-path="url(#cp)">${s.inside}<circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#sh)"/></g>
      <circle cx="${cx}" cy="${cy}" r="${r - 2}" fill="none" stroke="${shade(c.dark, -0.3)}" stroke-width="4" opacity=".6"/>
      <path d="M${cx - 150} ${cy - 90} Q${cx - 120} ${cy - 160} ${cx - 40} ${cy - 182}" stroke="#ffffff" stroke-width="16" fill="none" stroke-linecap="round" opacity=".55"/>
      <ellipse cx="${cx - 128}" cy="${cy - 40}" rx="9" ry="16" fill="#fff" opacity=".45" transform="rotate(20 ${cx - 128} ${cy - 40})"/>
      ${FACE(shade(c.dark, -0.2))}
      ${s.front ?? ''}`),
  };
}

/** Palpebre del pianeta (in grigio: in scena prendono il colore del pianeta con setTint). */
function lidTex(): SvgTex {
  const { lidW: w, lidH: h, dx } = EYES;
  const g = uid('l');
  return {
    key: 'rz_lid', w, h, svg: svgDoc(w, h, `<defs>${lightGrad(g, '#ffffff', '#e8e8e8', '#b8b8b8', true)}</defs>
      ${[w / 2 - dx, w / 2 + dx].map((x) => `<ellipse cx="${x}" cy="${h / 2}" rx="27" ry="31" fill="url(#${g})"/>
        <path d="M${x - 22} ${h / 2 + 4} Q${x} ${h / 2 + 20} ${x + 22} ${h / 2 + 4}" stroke="#2b2140" stroke-width="5" fill="none" stroke-linecap="round"/>`).join('')}`),
  };
}

// ---------------------------------------------------------------- razzi

function rocketBody(ro: Rocket): { body: string; nose: string; finTop: string; finBot: string; top: number; bot: number } {
  if (ro.shape === 'round') {
    return {
      body: 'M74 38 H186 Q268 38 292 80 Q268 122 186 122 H74 Q42 122 42 80 Q42 38 74 38 Z',
      nose: 'M222 39 Q270 44 292 80 Q270 116 222 121 Q240 80 222 39 Z',
      finTop: 'M126 42 Q92 26 66 4 Q52 -4 46 12 L52 46 Z',
      finBot: 'M126 118 Q92 134 66 156 Q52 164 46 148 L52 114 Z',
      top: 38, bot: 122,
    };
  }
  return {
    body: 'M64 50 H206 Q262 50 292 80 Q262 110 206 110 H64 Q48 110 48 80 Q48 50 64 50 Z',
    nose: 'M226 52 Q266 56 292 80 Q266 104 226 108 Q240 80 226 52 Z',
    finTop: 'M122 52 Q88 38 62 10 Q50 0 44 14 L52 54 Z',
    finBot: 'M122 108 Q88 122 62 150 Q50 160 44 146 L52 106 Z',
    top: 50, bot: 110,
  };
}

function pattern(ro: Rocket, top: number, bot: number): string {
  const t = ro.trim;
  switch (ro.pattern) {
    case 'band': return `<rect x="118" y="0" width="26" height="160" fill="${t}"/><rect x="150" y="0" width="8" height="160" fill="${t}"/>`;
    case 'stripes': return [92, 116, 140].map((x) => `<rect x="${x}" y="0" width="12" height="160" fill="${t}"/>`).join('');
    case 'dots': return [[100, 62], [130, 98], [108, 104], [150, 58], [84, 86], [218, 70]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="9" fill="${t}"/>`).join('');
    case 'stars': return [[100, 64, 13], [138, 100, 11], [96, 102, 9], [222, 66, 8]].map(([x, y, r]) => `<path d="${starPath(x, y, r)}" fill="${t}"/>`).join('');
    case 'checker': {
      let s = '';
      for (let i = 0; i < 4; i++) for (let j = 0; j < 8; j++) if ((i + j) % 2 === 0) s += `<rect x="${104 + i * 12}" y="${top + j * ((bot - top) / 8)}" width="12" height="${(bot - top) / 8 + 0.5}" fill="${t}"/>`;
      return s;
    }
    case 'zigzag': return `<path d="M60 ${top + 24} L80 ${top + 12} L100 ${top + 24} L120 ${top + 12} L140 ${top + 24} L160 ${top + 12} L180 ${top + 24} L200 ${top + 12} L220 ${top + 24}" stroke="${t}" stroke-width="9" fill="none" stroke-linejoin="round"/>
      <path d="M60 ${bot - 22} L80 ${bot - 10} L100 ${bot - 22} L120 ${bot - 10} L140 ${bot - 22} L160 ${bot - 10} L180 ${bot - 22}" stroke="${t}" stroke-width="7" fill="none" stroke-linejoin="round" opacity=".9"/>`;
  }
}

function rocketTex(ro: Rocket): SvgTex {
  const b = rocketBody(ro);
  const out = shade(ro.body, -0.48);
  const ids = { bd: uid('bd'), fn: uid('fn'), ns: uid('ns'), gl: uid('gl'), cp: uid('cp'), nz: uid('nz'), sh: uid('sh') };
  return {
    key: `rz_rocket_${ro.id}`, w: RF.w, h: RF.h, svg: svgDoc(RF.w, RF.h, `<defs>
      ${lightGrad(ids.bd, shade(ro.body, 0.55), ro.body, shade(ro.body, -0.28), true)}
      ${lightGrad(ids.fn, shade(ro.fin, 0.35), ro.fin, shade(ro.fin, -0.35), true)}
      ${lightGrad(ids.ns, shade(ro.trim, 0.4), ro.trim, shade(ro.trim, -0.32), true)}
      ${ballGrad(ids.gl, '#ffffff', '#9fdcff', '#3a7ac4')}
      ${lightGrad(ids.nz, '#c9d2e6', '#7a86a3', '#3a4258', true)}
      <linearGradient id="${ids.sh}" x1="0" y1="0" x2="0" y2="1"><stop offset=".5" stop-color="#1d1440" stop-opacity="0"/><stop offset="1" stop-color="#1d1440" stop-opacity=".35"/></linearGradient>
      <clipPath id="${ids.cp}"><path d="${b.body}"/></clipPath></defs>
      <path d="${b.finTop}" fill="url(#${ids.fn})" stroke="${shade(ro.fin, -0.5)}" stroke-width="3" stroke-linejoin="round"/>
      <rect x="24" y="64" width="30" height="32" rx="8" fill="url(#${ids.nz})" stroke="#2b3146" stroke-width="3"/>
      <path d="${b.body}" fill="url(#${ids.bd})"/>
      <g clip-path="url(#${ids.cp})">${pattern(ro, b.top, b.bot)}<path d="${b.nose}" fill="url(#${ids.ns})"/>
        <rect x="0" y="0" width="300" height="160" fill="url(#${ids.sh})"/></g>
      <path d="${b.body}" fill="none" stroke="${out}" stroke-width="3.5" stroke-linejoin="round"/>
      <path d="M70 ${b.top + 9} H200 Q236 ${b.top + 10} 258 ${b.top + 22}" stroke="#ffffff" stroke-width="8" fill="none" stroke-linecap="round" opacity=".6"/>
      <path d="M58 80 Q84 72 120 78" stroke="${shade(ro.fin, -0.3)}" stroke-width="10" fill="none" stroke-linecap="round" opacity=".55"/>
      <circle cx="186" cy="80" r="25" fill="${shade(ro.trim, -0.2)}"/>
      <circle cx="186" cy="80" r="25" fill="none" stroke="#e8ecf6" stroke-width="7"/>
      <circle cx="186" cy="80" r="18" fill="url(#${ids.gl})"/>
      <ellipse cx="180" cy="73" rx="8" ry="5" fill="#fff" opacity=".9" transform="rotate(-30 180 73)"/>
      <circle cx="186" cy="80" r="28.5" fill="none" stroke="${out}" stroke-width="2.5"/>
      <path d="${b.finBot}" fill="url(#${ids.fn})" stroke="${shade(ro.fin, -0.5)}" stroke-width="3" stroke-linejoin="round"/>`),
  };
}

/** Fiamma del motore (punta a sinistra: origine a destra, attaccata allo scarico). */
function flameTex(): SvgTex {
  return {
    key: 'rz_flame', w: 220, h: 110, svg: svgDoc(220, 110, `<defs>${blur('b', 3)}
      <linearGradient id="o" x1="1" y1="0" x2="0" y2="0"><stop offset="0" stop-color="#ffb02e"/><stop offset=".6" stop-color="#ff6a3d"/><stop offset="1" stop-color="#ff3d6a" stop-opacity="0"/></linearGradient>
      <linearGradient id="y" x1="1" y1="0" x2="0" y2="0"><stop offset="0" stop-color="#fff6b0"/><stop offset=".7" stop-color="#ffd23f"/><stop offset="1" stop-color="#ffb02e" stop-opacity="0"/></linearGradient></defs>
      <path d="M216 55 Q176 6 76 30 Q8 55 76 80 Q176 104 216 55 Z" fill="url(#o)" filter="url(#b)"/>
      <path d="M216 55 Q184 26 120 40 Q84 55 120 70 Q184 84 216 55 Z" fill="url(#y)"/>
      <ellipse cx="196" cy="55" rx="22" ry="12" fill="#ffffff" opacity=".9"/>`),
  };
}

// ---------------------------------------------------------------- asteroidi di gomma e stelle

const ROCK_COLS: [string, string, string][] = [['#d9c2ff', '#a77be0', '#6a44a8'], ['#ffd2e2', '#ff8fb1', '#c94a7a'], ['#c8fff6', '#5fc9c0', '#2a8a86']];

function rockTex(i: number): SvgTex {
  const [l, b, d] = ROCK_COLS[i];
  const r = rng(40 + i);
  const ph = r() * 6;
  const pts: string[] = [];
  for (let k = 0; k < 48; k++) {
    const a = (k / 48) * Math.PI * 2;
    const rr = 92 + 7 * Math.sin(3 * a + ph) + 4 * Math.sin(5 * a + ph * 2);
    pts.push(`${(120 + Math.cos(a) * rr).toFixed(1)} ${(122 + Math.sin(a) * rr * 0.94).toFixed(1)}`);
  }
  const path = `M${pts.join(' L')} Z`;
  const g = uid('rk');
  return {
    key: `rz_rock_${i}`, w: 240, h: 240, svg: svgDoc(240, 240, `<defs>${ballGrad(g, l, b, d)}</defs>
      <path d="${path}" fill="${shade(d, -0.2)}" transform="translate(4 6)" opacity=".5"/>
      <path d="${path}" fill="url(#${g})" stroke="${shade(d, -0.25)}" stroke-width="4" stroke-linejoin="round"/>
      ${[[78, 168, 16], [172, 160, 12], [166, 78, 10], [62, 104, 9]].map(([x, y, s]) => `<ellipse cx="${x}" cy="${y}" rx="${s}" ry="${s * 0.75}" fill="${d}" opacity=".35"/><ellipse cx="${x + 2}" cy="${y + 3}" rx="${s * 0.6}" ry="${s * 0.4}" fill="${l}" opacity=".45"/>`).join('')}
      <ellipse cx="84" cy="70" rx="34" ry="20" fill="#ffffff" opacity=".55" transform="rotate(-28 84 70)"/>
      <circle cx="66" cy="94" r="6" fill="#fff" opacity=".7"/>
      <path d="M92 120 Q102 108 112 120 M132 120 Q142 108 152 120" stroke="#2b2140" stroke-width="6" fill="none" stroke-linecap="round"/>
      <path d="M110 140 Q122 152 134 140" stroke="#2b2140" stroke-width="5" fill="none" stroke-linecap="round"/>
      <ellipse cx="86" cy="138" rx="12" ry="7" fill="#ff6f8f" opacity=".45"/><ellipse cx="158" cy="138" rx="12" ry="7" fill="#ff6f8f" opacity=".45"/>`),
  };
}

function bigStarTex(): SvgTex {
  return {
    key: 'rz_bigstar', w: 180, h: 180, svg: svgDoc(180, 180, `<defs>
      <radialGradient id="g" cx=".38" cy=".32" r=".8"><stop offset="0" stop-color="#ffffff"/><stop offset=".3" stop-color="#ffe066"/><stop offset=".65" stop-color="#ff9fd0"/><stop offset="1" stop-color="#8a7bff"/></radialGradient></defs>
      <path d="${starPath(92, 96, 78)}" fill="#6a4cc4" opacity=".45"/>
      <path d="${starPath(90, 92, 78)}" fill="url(#g)" stroke="#ffffff" stroke-width="5" stroke-linejoin="round"/>
      <path d="${starPath(90, 92, 40)}" fill="#fff" opacity=".22"/>
      <ellipse cx="70" cy="66" rx="14" ry="8" fill="#fff" opacity=".9" transform="rotate(-30 70 66)"/>
      <circle cx="78" cy="96" r="6" fill="#2b2140"/><circle cx="102" cy="96" r="6" fill="#2b2140"/>
      <path d="M80 110 Q90 120 100 110" stroke="#2b2140" stroke-width="4.5" fill="none" stroke-linecap="round"/>`),
  };
}

// ---------------------------------------------------------------- scenario e interfaccia

function trackTex(): SvgTex {
  let dots = '';
  for (let i = 0; i < 17; i++) dots += `<circle cx="${70 + i * 41}" cy="35" r="5" fill="#ffffff" opacity=".75"/>`;
  return {
    key: 'rz_track', w: 820, h: 70, svg: svgDoc(820, 70, `<rect x="4" y="12" width="812" height="46" rx="23" fill="#0b1240" opacity=".55"/>
      <rect x="4" y="12" width="812" height="46" rx="23" fill="none" stroke="#9fb0ff" stroke-width="3" opacity=".6"/>${dots}`),
  };
}

function flagTex(): SvgTex {
  const g = uid('fl');
  return {
    key: 'rz_flag', w: 120, h: 160, svg: svgDoc(120, 160, `<defs>${lightGrad(g, '#ffe28a', '#ffc21f', '#f08c00')}</defs>
      <rect x="14" y="10" width="8" height="146" rx="4" fill="#c9d2e6" stroke="#5a6480" stroke-width="2"/>
      <circle cx="18" cy="10" r="8" fill="#ffd23f" stroke="#c78a00" stroke-width="2"/>
      <path d="M22 18 Q60 8 108 24 Q86 44 108 66 Q60 54 22 66 Z" fill="url(#${g})" stroke="#c78a00" stroke-width="3" stroke-linejoin="round"/>
      <path d="${starPath(58, 42, 14)}" fill="#ff5a5f"/>`),
  };
}

function padTex(): SvgTex {
  const g = uid('pd');
  return {
    key: 'rz_pad', w: 340, h: 110, svg: svgDoc(340, 110, `<defs>${lightGrad(g, '#e8ecf6', '#9aa6c4', '#56607e', true)}${blur('s', 6)}</defs>
      <ellipse cx="170" cy="92" rx="150" ry="14" fill="#060a2a" opacity=".45" filter="url(#s)"/>
      <path d="M60 50 L40 92 M280 50 L300 92 M130 56 L124 94 M210 56 L216 94" stroke="#56607e" stroke-width="10" stroke-linecap="round"/>
      <ellipse cx="170" cy="46" rx="150" ry="28" fill="#3a4258"/>
      <ellipse cx="170" cy="40" rx="150" ry="28" fill="url(#${g})"/>
      <ellipse cx="170" cy="36" rx="110" ry="15" fill="#ffffff" opacity=".25"/>
      ${[50, 110, 170, 230, 290].map((x, i) => `<circle cx="${x}" cy="${44 + (i % 2) * 6}" r="6" fill="${i % 2 ? '#ffd23f' : '#5ff0c8'}"/>`).join('')}`),
  };
}

const ICON_PLANET = `<circle cx="50" cy="50" r="23" fill="#ffffff" stroke="#6a44c4" stroke-width="4"/>
  <path d="M10 60 Q50 74 90 40" fill="none" stroke="#ffffff" stroke-width="8" stroke-linecap="round"/>
  <circle cx="42" cy="44" r="5" fill="#d9ccff"/><circle cx="58" cy="58" r="4" fill="#d9ccff"/>`;
const ICON_ROCKET = `<path d="M30 70 Q30 40 62 22 Q80 14 84 16 Q86 20 78 38 Q60 70 30 70 Z" fill="#ffffff"/>
  <circle cx="64" cy="36" r="7" fill="#ff8a3d"/>
  <path d="M34 54 L18 54 L30 42 Z M46 66 L46 82 L58 70 Z" fill="#ffffff"/>
  <path d="M28 72 Q18 78 14 86 Q22 82 28 80" fill="#ffe066" stroke="#ffe066" stroke-width="3" stroke-linejoin="round"/>`;

/** Tutte le texture del gioco (rasterizzate all'apertura del gioco, una volta sola). */
export function gameTextures(): SvgTex[] {
  return [
    skyTex(),
    twinkleTex(),
    ...Object.keys(NEB).map(nebulaTex),
    dustTex(),
    ...PLANETS.map(planetTex),
    planetTex('casa'),
    lidTex(),
    ...ROCKETS.map(rocketTex),
    flameTex(),
    rockTex(0), rockTex(1), rockTex(2),
    bigStarTex(),
    trackTex(),
    flagTex(),
    padTex(),
    roundButton('rz_btn_planets', '#8a5cf0', ICON_PLANET, 200),
    roundButton('rz_btn_hangar', '#ff8a3d', ICON_ROCKET, 200),
  ];
}
