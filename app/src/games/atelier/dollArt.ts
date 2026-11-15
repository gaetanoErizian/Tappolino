import type { SvgTex } from '../../core/textures';
import { lightGrad, ballGrad, blur, shade, starPath, uid } from '../../core/art';
import { CHARACTERS, SKINS, type Character, type ItemId, type SkinId } from './logic';

/**
 * Personaggi e guardaroba dell'Atelier, disegnati in codice SVG (originali, nessun personaggio esistente).
 * Tutto è disegnato nello "spazio del personaggio" (400 unità di larghezza, piedi a y=830): ogni pezzo ha
 * il suo riquadro (PART_BOX) e si posiziona da solo sul personaggio. Lo stesso disegno di un capo serve
 * per la vetrina (rimpicciolito) e per vestire il personaggio.
 * Stile 2.5D: luce dall'alto a sinistra, sfumature, riflessi, bordi in una tonalità scura dello stesso colore.
 */

export type Box = [x: number, y: number, w: number, h: number];

/** Riquadro di ogni pezzo nello spazio del personaggio (chiave della texture → [x, y, w, h]). */
export const PART_BOX: Record<string, Box> = {};

function part(key: string, box: Box, body: string): SvgTex {
  PART_BOX[key] = box;
  const [x, y, w, h] = box;
  return {
    key, w: Math.round(w), h: Math.round(h),
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="${Math.round(w)}" height="${Math.round(h)}" viewBox="${x} ${y} ${w} ${h}">${body}</svg>`,
  };
}

/** Tre toni di un colore: luce, base, ombra (+ bordo). */
const tones = (c: string) => ({ l: shade(c, 0.4), b: c, d: shade(c, -0.22), o: shade(c, -0.45) });

// =====================================================================
// Corpo (uguale per tutti, cambia solo la pelle): sottoveste panna e calzamaglia
// =====================================================================

export const ARM_L = { sx: 142, sy: 392, hx: 102, hy: 556 };
export const ARM_R = { sx: 258, sy: 392, hx: 298, hy: 556 };

function bodyTex(skin: SkinId): SvgTex {
  const s = tones(SKINS[skin]);
  const sk = uid('sk'), cm = uid('cm'), tg = uid('tg'), hd = uid('hd');
  const arm = (a: typeof ARM_L) => `
    <path d="M${a.sx} ${a.sy} L${a.hx} ${a.hy - 12}" stroke="${s.o}" stroke-width="40" stroke-linecap="round" opacity=".55"/>
    <path d="M${a.sx} ${a.sy} L${a.hx} ${a.hy - 12}" stroke="url(#${sk})" stroke-width="34" stroke-linecap="round"/>
    <circle cx="${a.hx}" cy="${a.hy}" r="21" fill="url(#${hd})" stroke="${s.o}" stroke-opacity=".55" stroke-width="3"/>`;
  const leg = (x: number) => `<path d="M${x} 594 H${x + 42} V800 Q${x + 42} 812 ${x + 21} 812 Q${x} 812 ${x} 800 Z" fill="url(#${tg})" stroke="#d8cbd6" stroke-width="3"/>`;
  return part(`at_body_${skin}`, BODY_BOX, `<defs>
      ${lightGrad(sk, s.l, s.b, s.d)}${ballGrad(hd, s.l, s.b, s.d)}
      ${lightGrad(cm, '#ffffff', '#fff3e4', '#ecd6c0')}${lightGrad(tg, '#ffffff', '#fbf4f6', '#e6dbe4')}</defs>
    <rect x="181" y="326" width="38" height="64" rx="12" fill="url(#${sk})"/>
    <path d="M181 360 Q200 372 219 360 V380 H181 Z" fill="${s.d}" opacity=".5"/>
    ${leg(152)}${leg(206)}
    <ellipse cx="170" cy="814" rx="27" ry="15" fill="url(#${tg})" stroke="#d8cbd6" stroke-width="3"/>
    <ellipse cx="230" cy="814" rx="27" ry="15" fill="url(#${tg})" stroke="#d8cbd6" stroke-width="3"/>
    ${arm(ARM_L)}${arm(ARM_R)}
    <path d="M140 386 Q200 372 260 386 L262 470 Q258 528 254 560 Q262 590 258 612 L142 612 Q138 590 146 560 Q142 528 138 470 Z" fill="url(#${cm})" stroke="#d9c2ae" stroke-width="3"/>
    <path d="M146 560 Q200 572 254 560" stroke="#e4cdb8" stroke-width="3" fill="none"/>
    <path d="M200 568 V612" stroke="#e4cdb8" stroke-width="3"/>
    <path d="M160 394 Q200 412 240 394" stroke="#f3b9cf" stroke-width="5" fill="none" stroke-linecap="round"/>
    <path d="M196 404 Q200 398 204 404 Q200 410 196 404 Z" fill="#ff9cc4"/>
    <ellipse cx="168" cy="420" rx="16" ry="30" fill="#fff" opacity=".55"/>`);
}

// =====================================================================
// Teste: viso, orecchie, guance, capelli davanti; capelli dietro a parte
// =====================================================================

function hairFront(c: Character, g: string): string {
  const h = tones(c.hairColor);
  const st = `fill="url(#${g})" stroke="${h.o}" stroke-width="3" stroke-linejoin="round"`;
  switch (c.hair) {
    case 'long':
      return `<path d="M76 250 Q66 106 200 92 Q334 106 324 250 Q318 196 290 168 Q246 198 182 190 Q140 184 118 160 Q96 192 92 250 Z" ${st}/>
        <path d="M80 214 Q66 290 86 340 Q102 300 100 240 Z" ${st}/><path d="M320 214 Q334 290 314 340 Q298 300 300 240 Z" ${st}/>
        <path d="M150 112 Q200 98 262 118" stroke="#fff" stroke-opacity=".35" stroke-width="8" fill="none" stroke-linecap="round"/>`;
    case 'curls': {
      let curls = '';
      for (let i = 0; i <= 10; i++) {
        const a = Math.PI * (1.05 + (i / 10) * 0.9);
        const x = 200 + Math.cos(a) * 118, y = 206 + Math.sin(a) * 108;
        curls += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${i % 2 ? 30 : 34}" ${st}/>`;
      }
      return `<path d="M84 232 Q80 112 200 104 Q320 112 316 232 Q300 176 200 166 Q100 176 84 232 Z" ${st}/>${curls}
        <circle cx="160" cy="112" r="26" ${st}/><circle cx="240" cy="112" r="26" ${st}/><circle cx="200" cy="100" r="28" ${st}/>
        <path d="M140 96 Q158 86 176 92" stroke="#fff" stroke-opacity=".3" stroke-width="6" fill="none" stroke-linecap="round"/>`;
    }
    case 'puffs': {
      const puff = (cx: number) => {
        let b = `<circle cx="${cx}" cy="116" r="64" ${st}/>`;
        for (let k = 0; k < 9; k++) {
          const a = (k / 9) * Math.PI * 2;
          b += `<circle cx="${(cx + Math.cos(a) * 56).toFixed(1)}" cy="${(116 + Math.sin(a) * 56).toFixed(1)}" r="16" fill="url(#${g})"/>`;
        }
        return b + `<ellipse cx="${cx - 18}" cy="92" rx="18" ry="10" fill="#fff" opacity=".22"/>`;
      };
      return `${puff(86)}${puff(314)}
        <path d="M82 236 Q76 114 200 104 Q324 114 318 236 Q306 168 200 152 Q94 168 82 236 Z" ${st}/>
        <path d="M150 122 Q200 110 250 122" stroke="#fff" stroke-opacity=".25" stroke-width="6" fill="none" stroke-linecap="round"/>
        <path d="M120 122 Q200 104 280 122" stroke="#ffcf3a" stroke-width="7" fill="none" stroke-linecap="round" opacity=".9"/>`;
    }
    case 'tousled':
      return `<path d="M80 232 Q72 120 200 100 Q328 120 320 232 Q312 184 292 170 L298 200 Q272 170 246 172 L252 196 Q222 168 196 172 L198 198 Q170 170 146 178 L148 204 Q120 178 104 190 Q88 204 80 232 Z" ${st}/>
        <path d="M112 128 Q132 76 172 94 Q192 62 228 86 Q266 70 286 112 Q300 120 304 140 Q250 108 200 112 Q140 112 112 128 Z" ${st}/>
        <path d="M150 104 Q170 90 186 96" stroke="#fff" stroke-opacity=".35" stroke-width="6" fill="none" stroke-linecap="round"/>`;
    case 'bob':
      return `<path d="M78 256 Q70 106 200 98 Q330 106 322 256 L324 330 Q306 340 292 324 L292 214 Q286 192 268 188 L132 188 Q114 192 108 214 L108 324 Q94 340 76 330 Z" ${st}/>
        <path d="M132 188 V176 M164 190 V174 M200 190 V172 M236 190 V174 M268 188 V176" stroke="${h.o}" stroke-opacity=".35" stroke-width="3"/>
        <path d="M130 118 Q200 100 270 118" stroke="#fff" stroke-opacity=".3" stroke-width="8" fill="none" stroke-linecap="round"/>`;
    case 'ringlets': {
      let top = '';
      for (let i = 0; i <= 8; i++) {
        const a = Math.PI * (1.08 + (i / 8) * 0.84);
        top += `<circle cx="${(200 + Math.cos(a) * 112).toFixed(1)}" cy="${(198 + Math.sin(a) * 104).toFixed(1)}" r="27" ${st}/>`;
      }
      return `<path d="M84 236 Q78 112 200 98 Q322 112 316 236 Q302 174 270 168 Q240 186 210 170 Q180 188 150 170 Q116 178 84 236 Z" ${st}/>${top}
        <path d="M150 100 Q200 84 250 100" stroke="#fff" stroke-opacity=".4" stroke-width="7" fill="none" stroke-linecap="round"/>`;
    }
  }
}

function hairBack(c: Character, g: string): string | null {
  const h = tones(c.hairColor);
  const st = `fill="url(#${g})" stroke="${h.o}" stroke-width="3" stroke-linejoin="round"`;
  switch (c.hair) {
    case 'long':
      return `<path d="M76 190 Q68 116 130 90 Q200 64 270 90 Q332 116 324 190 L332 420 Q338 520 304 566 Q292 542 272 560 Q252 524 232 550 L168 550 Q148 524 128 560 Q108 542 96 566 Q62 520 68 420 Z" ${st}/>
        <path d="M100 300 Q92 420 110 520 M300 300 Q308 420 290 520" stroke="${h.o}" stroke-opacity=".3" stroke-width="4" fill="none"/>`;
    case 'bob':
      return `<path d="M70 210 Q68 96 200 90 Q332 96 330 210 L336 344 Q300 362 200 356 Q100 362 64 344 Z" ${st}/>`;
    case 'ringlets': {
      let r = '';
      for (const [x, dx] of [[78, -1], [104, -1], [296, 1], [322, 1]] as const) for (let k = 0; k < 4; k++) r += `<circle cx="${x + (k % 2 ? 7 : -7) * dx}" cy="${236 + k * 42}" r="${26 - k * 2}" ${st}/>`;
      return `<path d="M78 220 Q70 104 200 96 Q330 104 322 220 Q300 300 200 300 Q100 300 78 220 Z" ${st}/>${r}`;
    }
    default:
      return null;
  }
}

function headTex(c: Character): SvgTex[] {
  const s = tones(SKINS[c.skin]);
  const h = tones(c.hairColor);
  const fg = uid('fa'), hg = uid('ha'), eg = uid('ea');
  const freckles = c.freckles
    ? [[118, 262], [132, 274], [110, 278], [282, 262], [268, 274], [290, 278]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3.2" fill="${shade(SKINS[c.skin], -0.35)}" opacity=".6"/>`).join('')
    : '';
  const brow = (x: number, dir: 1 | -1) => `<path d="M${x - 20 * dir} 200 Q${x} 188 ${x + 20 * dir} 196" stroke="${h.o}" stroke-width="6" fill="none" stroke-linecap="round"/>`;
  const out: SvgTex[] = [part(`at_head_${c.id}`, HEAD_BOX, `<defs>
      ${ballGrad(fg, s.l, s.b, s.d)}${ballGrad(eg, s.l, s.b, s.d)}${lightGrad(hg, h.l, h.b, h.d)}</defs>
    <ellipse cx="80" cy="238" rx="22" ry="28" fill="url(#${eg})" stroke="${s.o}" stroke-opacity=".5" stroke-width="3"/>
    <ellipse cx="320" cy="238" rx="22" ry="28" fill="url(#${eg})" stroke="${s.o}" stroke-opacity=".5" stroke-width="3"/>
    <ellipse cx="200" cy="224" rx="122" ry="116" fill="url(#${fg})" stroke="${s.o}" stroke-opacity=".5" stroke-width="3"/>
    <ellipse cx="200" cy="330" rx="40" ry="8" fill="${s.d}" opacity=".35"/>
    <ellipse cx="128" cy="270" rx="22" ry="13" fill="#ff7f9e" opacity=".42"/><ellipse cx="272" cy="270" rx="22" ry="13" fill="#ff7f9e" opacity=".42"/>
    ${freckles}
    <path d="M193 262 Q200 270 207 262" stroke="${s.o}" stroke-opacity=".6" stroke-width="4" fill="none" stroke-linecap="round"/>
    ${brow(157, 1)}${brow(243, -1)}
    ${hairFront(c, hg)}`)];
  const back = hairBack(c, hg);
  if (back) out.push(part(`at_hairback_${c.id}`, HAIRBACK_BOX, `<defs>${lightGrad(hg, h.l, h.b, h.d)}</defs>${back}`));
  return out;
}

/** Occhi e bocche comuni (espressioni). */
function faceTex(): SvgTex[] {
  const e = (key: string, body: string): SvgTex => ({ key, w: 48, h: 60, svg: `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="60" viewBox="0 0 48 60">${body}</svg>` });
  const m = (key: string, body: string): SvgTex => ({ key, w: 72, h: 48, svg: `<svg xmlns="http://www.w3.org/2000/svg" width="72" height="48" viewBox="0 0 72 48">${body}</svg>` });
  return [
    e('at_eye', `<ellipse cx="24" cy="30" rx="17" ry="23" fill="#2b2140"/><ellipse cx="24" cy="36" rx="12" ry="12" fill="#5b3f7a" opacity=".6"/>
      <circle cx="17" cy="21" r="6.5" fill="#fff"/><circle cx="30" cy="40" r="3" fill="#fff" opacity=".85"/>`),
    e('at_eye_closed', `<path d="M6 30 Q24 44 42 30" stroke="#2b2140" stroke-width="5" fill="none" stroke-linecap="round"/>`),
    e('at_eye_happy', `<path d="M6 36 Q24 14 42 36" stroke="#2b2140" stroke-width="5.5" fill="none" stroke-linecap="round"/>`),
    m('at_mouth_smile', `<path d="M14 12 Q36 40 58 12 Q36 22 14 12 Z" fill="#c9465a" stroke="#8a2a3a" stroke-width="3" stroke-linejoin="round"/>
      <path d="M26 24 Q36 30 46 24" stroke="#ff9db0" stroke-width="4" fill="none" stroke-linecap="round"/>`),
    m('at_mouth_open', `<path d="M12 10 Q36 6 60 10 Q58 42 36 44 Q14 42 12 10 Z" fill="#a8364a" stroke="#7a2234" stroke-width="3" stroke-linejoin="round"/>
      <path d="M16 12 Q36 9 56 12 L54 18 Q36 15 18 18 Z" fill="#fff"/><ellipse cx="36" cy="34" rx="14" ry="7" fill="#ff8aa0"/>`),
    m('at_mouth_o', `<ellipse cx="36" cy="24" rx="11" ry="13" fill="#a8364a" stroke="#7a2234" stroke-width="3"/><ellipse cx="36" cy="30" rx="6" ry="4" fill="#ff8aa0"/>`),
  ];
}

// =====================================================================
// Guardaroba
// =====================================================================

/** Maniche lunghe sopra le braccia (cappotto, cotta di maglia). */
function sleeves(fill: string, stroke: string, cuff?: string): string {
  const one = (a: typeof ARM_L) => `
    <path d="M${a.sx} ${a.sy} L${a.hx + (a.hx < 200 ? 2 : -2)} ${a.hy - 22}" stroke="${stroke}" stroke-width="46" stroke-linecap="round"/>
    <path d="M${a.sx} ${a.sy} L${a.hx + (a.hx < 200 ? 2 : -2)} ${a.hy - 22}" stroke="${fill}" stroke-width="40" stroke-linecap="round"/>
    ${cuff ? `<ellipse cx="${a.hx + (a.hx < 200 ? 3 : -3)}" cy="${a.hy - 24}" rx="25" ry="12" fill="${cuff}" stroke="${shade(cuff, -0.4)}" stroke-width="2"/>` : ''}`;
  return one(ARM_L) + one(ARM_R);
}

const sparkle = (x: number, y: number, r: number, c = '#fff') =>
  `<path d="M${x} ${y - r} Q${x + r * 0.15} ${y - r * 0.15} ${x + r} ${y} Q${x + r * 0.15} ${y + r * 0.15} ${x} ${y + r} Q${x - r * 0.15} ${y + r * 0.15} ${x - r} ${y} Q${x - r * 0.15} ${y - r * 0.15} ${x} ${y - r} Z" fill="${c}"/>`;

const flower = (x: number, y: number, r: number, petal: string, center = '#ffd84a') => {
  let p = '';
  for (let k = 0; k < 5; k++) {
    const a = (k / 5) * Math.PI * 2 - Math.PI / 2;
    p += `<circle cx="${(x + Math.cos(a) * r * 0.62).toFixed(1)}" cy="${(y + Math.sin(a) * r * 0.62).toFixed(1)}" r="${(r * 0.5).toFixed(1)}" fill="${petal}" stroke="${shade(petal, -0.3)}" stroke-width="1.5"/>`;
  }
  return p + `<circle cx="${x}" cy="${y}" r="${(r * 0.36).toFixed(1)}" fill="${center}" stroke="${shade(center, -0.3)}" stroke-width="1.5"/>`;
};

/** Gonna a campana con orlo smerlato (da x1..x2 in vita a X1..X2 sull'orlo). */
function bellSkirt(yTop: number, yHem: number, x1: number, x2: number, X1: number, X2: number, scallops: number): string {
  let hem = '';
  const w = (X2 - X1) / scallops;
  for (let i = scallops - 1; i >= 0; i--) {
    const xa = X1 + (i + 1) * w, xb = X1 + i * w;
    hem += ` Q${((xa + xb) / 2).toFixed(1)} ${yHem + 16} ${xb.toFixed(1)} ${yHem}`;
  }
  const midY = yTop + (yHem - yTop) * 0.45;
  return `M${x1} ${yTop} L${x2} ${yTop} Q${x2 + (X2 - x2) * 0.35} ${midY} ${X2} ${yHem}${hem} Q${x1 - (x1 - X1) * 0.35} ${midY} ${x1} ${yTop} Z`;
}

const bodice = (y1: number, y2: number, dip = 14) =>
  `M144 ${y1 + 8} Q172 ${y1 - 4} 200 ${y1 + dip} Q228 ${y1 - 4} 256 ${y1 + 8} L260 470 Q256 ${y2 - 20} 250 ${y2} L150 ${y2} Q144 ${y2 - 20} 140 470 Z`;

type ItemDraw = { box: Box; body: (g: (l: string, b: string, d: string, v?: boolean) => string) => string };

const ITEM_ART: Record<ItemId, ItemDraw> = {
  // ---------------------------------------------------------------- abiti
  gown_pink: {
    box: [24, 356, 352, 476],
    body: (g) => {
      const a = g('#ffe0ee', '#ff9cc6', '#e45f9c'), b = g('#fff2f8', '#ffc2dc', '#f08ab6');
      return `<path d="${bellSkirt(540, 798, 152, 248, 44, 356, 9)}" fill="url(#${a})" stroke="#c4467e" stroke-width="3" stroke-linejoin="round"/>
        <path d="${bellSkirt(540, 700, 156, 244, 92, 308, 7)}" fill="url(#${b})" stroke="#e070a4" stroke-width="3" stroke-linejoin="round"/>
        <path d="M176 560 Q160 660 128 760 M224 560 Q240 660 272 760 M200 560 V790" stroke="#c4467e" stroke-opacity=".3" stroke-width="4" fill="none"/>
        <path d="${bodice(372, 548)}" fill="url(#${a})" stroke="#c4467e" stroke-width="3" stroke-linejoin="round"/>
        <ellipse cx="140" cy="398" rx="31" ry="26" fill="url(#${b})" stroke="#e070a4" stroke-width="3"/><ellipse cx="260" cy="398" rx="31" ry="26" fill="url(#${b})" stroke="#e070a4" stroke-width="3"/>
        <rect x="146" y="532" width="108" height="20" rx="8" fill="#fff4f9" stroke="#e070a4" stroke-width="2.5"/>
        <path d="M200 542 L170 526 Q162 542 170 558 Z M200 542 L230 526 Q238 542 230 558 Z" fill="#ff7fb5" stroke="#c4467e" stroke-width="2.5"/>
        <circle cx="200" cy="542" r="8" fill="#ffd84a" stroke="#d99a1a" stroke-width="2"/>
        ${flower(120, 700, 16, '#fff')}${flower(200, 724, 18, '#fff')}${flower(280, 700, 16, '#fff')}
        <ellipse cx="168" cy="430" rx="10" ry="26" fill="#fff" opacity=".45"/>
        ${sparkle(110, 620, 9)}${sparkle(300, 600, 8)}${sparkle(170, 650, 6)}`;
    },
  },
  tunic: {
    box: [96, 360, 208, 296],
    body: (g) => {
      const a = g('#9cc4ff', '#3d72dc', '#24499c');
      return `<path d="M140 380 Q200 392 260 380 L266 470 L274 630 Q200 650 126 630 L134 470 Z" fill="url(#${a})" stroke="#1b3a80" stroke-width="3" stroke-linejoin="round"/>
        <path d="M126 616 Q200 636 274 616 L274 630 Q200 650 126 630 Z" fill="#ffcf4a" stroke="#c98a12" stroke-width="2"/>
        <path d="M172 382 L200 430 L228 382" fill="#fff6e6" stroke="#d9c2ae" stroke-width="3" stroke-linejoin="round"/>
        <ellipse cx="138" cy="398" rx="30" ry="25" fill="url(#${a})" stroke="#1b3a80" stroke-width="3"/><ellipse cx="262" cy="398" rx="30" ry="25" fill="url(#${a})" stroke="#1b3a80" stroke-width="3"/>
        <path d="M110 412 Q138 426 166 412 M234 412 Q262 426 290 412" stroke="#ffcf4a" stroke-width="5" fill="none" stroke-linecap="round"/>
        <rect x="134" y="536" width="132" height="22" rx="6" fill="#8a5a34" stroke="#5a361c" stroke-width="2.5"/>
        <rect x="186" y="532" width="28" height="30" rx="5" fill="#ffd84a" stroke="#c98a12" stroke-width="3"/>
        ${[448, 482, 508].map((y) => `<circle cx="200" cy="${y}" r="7" fill="#ffd84a" stroke="#c98a12" stroke-width="2"/>`).join('')}
        <path d="M170 576 L160 616 M230 576 L240 616" stroke="#1b3a80" stroke-opacity=".3" stroke-width="4"/>
        <ellipse cx="160" cy="440" rx="10" ry="30" fill="#fff" opacity=".3"/>`;
    },
  },
  armor: {
    box: [76, 360, 248, 280],
    body: (g) => {
      const a = g('#ffffff', '#c9d4e2', '#8695ab'), m = g('#d6dde8', '#a9b4c6', '#76839a');
      let mail = '';
      for (const arm of [ARM_L, ARM_R]) for (let k = 1; k < 6; k++) {
        const x = arm.sx + ((arm.hx - arm.sx) * k) / 6, y = arm.sy + ((arm.hy - 22 - arm.sy) * k) / 6;
        mail += `<path d="M${x - 14} ${y} Q${x} ${y + 8} ${x + 14} ${y}" stroke="#6f7c93" stroke-width="2.5" fill="none"/>`;
      }
      return `${sleeves(`url(#${m})`, '#6f7c93', '#c9d4e2')}${mail}
        <path d="M140 588 L260 588 L268 632 Q200 644 132 632 Z" fill="url(#${a})" stroke="#5f6c84" stroke-width="3" stroke-linejoin="round"/>
        <path d="M144 548 L256 548 L262 596 Q200 606 138 596 Z" fill="url(#${a})" stroke="#5f6c84" stroke-width="3" stroke-linejoin="round"/>
        <path d="M140 384 Q200 370 260 384 L262 470 Q258 538 200 556 Q142 538 138 470 Z" fill="url(#${a})" stroke="#5f6c84" stroke-width="3" stroke-linejoin="round"/>
        <path d="M200 380 V552" stroke="#8695ab" stroke-width="3" opacity=".6"/>
        <path d="M200 488 Q170 466 172 446 Q174 428 192 430 Q198 432 200 440 Q202 432 208 430 Q226 428 228 446 Q230 466 200 488 Z" fill="#ff5e7a" stroke="#c4245f" stroke-width="3"/>
        <ellipse cx="190" cy="442" rx="6" ry="4" fill="#fff" opacity=".8"/>
        <ellipse cx="134" cy="398" rx="34" ry="26" fill="url(#${a})" stroke="#5f6c84" stroke-width="3"/><ellipse cx="266" cy="398" rx="34" ry="26" fill="url(#${a})" stroke="#5f6c84" stroke-width="3"/>
        <path d="M108 408 Q134 420 160 408 M240 408 Q266 420 292 408" stroke="#5f6c84" stroke-width="3" fill="none"/>
        ${[[152, 400], [248, 400], [150, 572], [250, 572]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="4.5" fill="#fff" stroke="#5f6c84" stroke-width="2"/>`).join('')}
        <ellipse cx="164" cy="432" rx="11" ry="36" fill="#fff" opacity=".7"/>`;
    },
  },
  party: {
    box: [56, 360, 288, 362],
    body: (g) => {
      const a = g('#fff6c4', '#ffcf4a', '#e3981a'), t = g('#fffbe8', '#ffe58a', '#f2bd3a');
      let stars = '';
      for (const [x, y, r] of [[130, 650, 9], [178, 610, 7], [232, 640, 9], [276, 600, 7], [110, 600, 6], [210, 690, 8], [292, 668, 8], [158, 690, 7]]) stars += `<path d="${starPath(x, y, r)}" fill="#fff" opacity=".9"/>`;
      return `<path d="${bellSkirt(530, 700, 150, 250, 62, 338, 8)}" fill="url(#${a})" stroke="#c07a10" stroke-width="3" stroke-linejoin="round"/>
        <path d="${bellSkirt(530, 650, 152, 248, 92, 308, 7)}" fill="url(#${t})" stroke="#e0a222" stroke-width="2.5" stroke-linejoin="round" opacity=".92"/>
        <path d="${bellSkirt(530, 598, 154, 246, 122, 278, 5)}" fill="url(#${a})" stroke="#c07a10" stroke-width="2.5" stroke-linejoin="round"/>
        ${stars}
        <path d="${bodice(380, 538, 10)}" fill="url(#${a})" stroke="#c07a10" stroke-width="3" stroke-linejoin="round"/>
        <path d="M152 388 L146 368 M248 388 L254 368" stroke="#e3981a" stroke-width="6" stroke-linecap="round"/>
        ${[[176, 420], [224, 420], [200, 452], [172, 486], [228, 486], [200, 510]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="4" fill="#fff" opacity=".9"/>`).join('')}
        <rect x="148" y="522" width="104" height="16" rx="7" fill="#ff8cc6" stroke="#c4467e" stroke-width="2"/>
        <ellipse cx="166" cy="440" rx="9" ry="24" fill="#fff" opacity=".5"/>`;
    },
  },
  fairy: {
    box: [40, 356, 320, 370],
    body: (g) => {
      const a = g('#e2ffee', '#86e2ae', '#3ea876'), b = g('#f4fff8', '#b8f2d0', '#6fcf9a');
      let petals = '';
      const leaf = (cx: number, cy: number, rot: number, len: number, fill: string) =>
        `<path d="M0 0 Q${len * 0.4} ${-len * 0.26} ${len} 0 Q${len * 0.4} ${len * 0.26} 0 0 Z" transform="translate(${cx} ${cy}) rotate(${rot})" fill="${fill}" stroke="#2e8a5c" stroke-width="2.5" stroke-linejoin="round"/>`;
      for (let k = 0; k < 9; k++) petals += leaf(200, 540, 50 + k * 10, 175 - Math.abs(k - 4) * 6, `url(#${a})`);
      for (let k = 0; k < 7; k++) petals += leaf(200, 540, 60 + k * 10, 128, `url(#${b})`);
      return `${petals}
        <path d="${bodice(380, 548, 18)}" fill="url(#${a})" stroke="#2e8a5c" stroke-width="3" stroke-linejoin="round"/>
        <path d="M150 400 Q200 470 250 400 M150 470 Q200 520 250 470" stroke="#2e8a5c" stroke-opacity=".35" stroke-width="3" fill="none"/>
        ${leaf(150, 392, 200, 46, `url(#${b})`)}${leaf(250, 392, -20, 46, `url(#${b})`)}
        ${flower(200, 540, 20, '#ff9cc6')}
        ${sparkle(96, 640, 9)}${sparkle(300, 670, 8)}${sparkle(160, 690, 6)}${sparkle(246, 620, 6)}`;
    },
  },
  coat: {
    box: [70, 356, 260, 312],
    body: (g) => {
      const a = g('#ff9a9a', '#d8343f', '#981e2b');
      return `${sleeves(`url(#${a})`, '#7a1622', '#ffd84a')}
        <path d="M136 380 Q200 396 264 380 L272 480 L288 652 Q200 668 112 652 L128 480 Z" fill="url(#${a})" stroke="#7a1622" stroke-width="3" stroke-linejoin="round"/>
        <path d="M184 392 L200 652 L216 392" fill="#fff6e6" stroke="#d9c2ae" stroke-width="3" stroke-linejoin="round"/>
        <path d="M112 640 Q200 656 288 640 L288 652 Q200 668 112 652 Z" fill="#ffd84a" stroke="#c98a12" stroke-width="2"/>
        ${[420, 456, 492, 528].map((y) => `<rect x="160" y="${y}" width="80" height="9" rx="4.5" fill="#ffd84a" stroke="#c98a12" stroke-width="2"/><circle cx="164" cy="${y + 4.5}" r="5" fill="#ffd84a" stroke="#c98a12" stroke-width="2"/><circle cx="236" cy="${y + 4.5}" r="5" fill="#ffd84a" stroke="#c98a12" stroke-width="2"/>`).join('')}
        <path d="M176 382 Q160 400 180 410 Q164 424 186 432 Q172 446 196 450 L204 450 Q228 446 214 432 Q236 424 220 410 Q240 400 224 382 Z" fill="#ffffff" stroke="#d9c2ae" stroke-width="2.5" stroke-linejoin="round"/>
        <path d="M132 560 L120 640 M268 560 L280 640" stroke="#7a1622" stroke-opacity=".4" stroke-width="4"/>
        <ellipse cx="152" cy="460" rx="10" ry="36" fill="#fff" opacity=".28"/>`;
    },
  },
  gown_lilac: {
    box: [24, 356, 352, 476],
    body: (g) => {
      const a = g('#f4e8ff', '#c49ff4', '#8a62c9'), b = g('#faf4ff', '#dcc4fa', '#a885e0');
      let fl = '';
      for (const [x, y, r] of [[110, 760, 14], [170, 776, 15], [230, 776, 15], [290, 760, 14], [140, 660, 12], [260, 660, 12], [200, 620, 13]]) fl += flower(x, y, r, '#ffb3d6');
      return `<path d="${bellSkirt(540, 800, 152, 248, 40, 360, 10)}" fill="url(#${a})" stroke="#6d47ad" stroke-width="3" stroke-linejoin="round"/>
        <path d="M60 740 Q200 780 340 740" stroke="#fff" stroke-opacity=".6" stroke-width="6" fill="none"/>
        <path d="M100 650 Q200 690 300 650" stroke="#fff" stroke-opacity=".5" stroke-width="5" fill="none"/>
        <path d="${bodice(392, 548, 6)}" fill="url(#${a})" stroke="#6d47ad" stroke-width="3" stroke-linejoin="round"/>
        <path d="M116 396 Q140 378 160 396 Q180 380 200 398 Q220 380 240 396 Q260 378 284 396 Q276 420 252 410 Q230 426 200 414 Q170 426 148 410 Q124 420 116 396 Z" fill="url(#${b})" stroke="#8a62c9" stroke-width="2.5" stroke-linejoin="round"/>
        ${fl}
        <path d="M150 544 Q200 556 250 544" stroke="#ffd84a" stroke-width="7" fill="none" stroke-linecap="round"/>
        <ellipse cx="168" cy="460" rx="9" ry="28" fill="#fff" opacity=".45"/>`;
    },
  },
  rainbow: {
    box: [46, 360, 308, 420],
    body: (g) => {
      const tiers = ['#ff9cc6', '#ffb38a', '#ffe07a', '#8fe0b0', '#8fc8ff'];
      let sk = '';
      for (let i = tiers.length - 1; i >= 0; i--) {
        const gg = g(shade(tiers[i], 0.5), tiers[i], shade(tiers[i], -0.2));
        const hem = 580 + i * 40;
        sk += `<path d="${bellSkirt(540, hem, 152, 248, 152 - (hem - 540) * 0.9, 248 + (hem - 540) * 0.9, 5 + i)}" fill="url(#${gg})" stroke="${shade(tiers[i], -0.4)}" stroke-width="2.5" stroke-linejoin="round"/>`;
      }
      const w = g('#ffffff', '#fff3fa', '#f0d6e6');
      return `${sk}
        <path d="${bodice(380, 548, 12)}" fill="url(#${w})" stroke="#d9a8c4" stroke-width="3" stroke-linejoin="round"/>
        <path d="M200 488 Q176 470 178 454 Q180 440 194 442 Q198 444 200 450 Q202 444 206 442 Q220 440 222 454 Q224 470 200 488 Z" fill="#ff5e9a"/>
        <ellipse cx="140" cy="398" rx="28" ry="24" fill="#8fc8ff" stroke="#4f8ad0" stroke-width="2.5"/><ellipse cx="260" cy="398" rx="28" ry="24" fill="#ff9cc6" stroke="#c4467e" stroke-width="2.5"/>
        ${sparkle(100, 700, 8)}${sparkle(300, 720, 8)}`;
    },
  },
  // ---------------------------------------------------------------- copricapi (disegnati per capelli con la cima a y=100)
  tiara: {
    box: [112, 50, 176, 84],
    body: (g) => {
      const a = g('#ffffff', '#dfe6f2', '#9aa8c0');
      return `<path d="M120 124 Q200 92 280 124 L272 132 Q200 104 128 132 Z" fill="url(#${a})" stroke="#7a88a2" stroke-width="2.5"/>
        <path d="M134 118 L146 88 L162 108 L182 70 L200 96 L218 70 L238 108 L254 88 L266 118 Q200 96 134 118 Z" fill="url(#${a})" stroke="#7a88a2" stroke-width="2.5" stroke-linejoin="round"/>
        <circle cx="200" cy="104" r="9" fill="#ff6fae" stroke="#c4245f" stroke-width="2"/><circle cx="196" cy="100" r="3" fill="#fff"/>
        <circle cx="182" cy="74" r="5" fill="#8fd3ff" stroke="#4a9ad0" stroke-width="1.5"/><circle cx="218" cy="74" r="5" fill="#8fd3ff" stroke="#4a9ad0" stroke-width="1.5"/>
        <circle cx="146" cy="92" r="4" fill="#ffd84a"/><circle cx="254" cy="92" r="4" fill="#ffd84a"/>`;
    },
  },
  crown: {
    box: [108, 6, 184, 130],
    body: (g) => {
      const a = g('#fff6c0', '#ffcf3a', '#d98a10');
      return `<path d="M120 126 L112 40 L154 78 L200 22 L246 78 L288 40 L280 126 Q200 110 120 126 Z" fill="url(#${a})" stroke="#a8650a" stroke-width="3" stroke-linejoin="round"/>
        <path d="M118 104 Q200 88 282 104 L280 126 Q200 110 120 126 Z" fill="#e8a21a" stroke="#a8650a" stroke-width="2.5"/>
        <circle cx="112" cy="38" r="9" fill="url(#${a})" stroke="#a8650a" stroke-width="2.5"/><circle cx="288" cy="38" r="9" fill="url(#${a})" stroke="#a8650a" stroke-width="2.5"/>
        <circle cx="200" cy="18" r="11" fill="url(#${a})" stroke="#a8650a" stroke-width="2.5"/>
        <ellipse cx="200" cy="108" rx="11" ry="9" fill="#ff4f6e" stroke="#a8243f" stroke-width="2"/>
        <ellipse cx="160" cy="112" rx="8" ry="7" fill="#46b8ff" stroke="#22709e" stroke-width="2"/><ellipse cx="240" cy="112" rx="8" ry="7" fill="#46d39a" stroke="#1f8a5c" stroke-width="2"/>
        <ellipse cx="150" cy="70" rx="7" ry="16" fill="#fff" opacity=".55" transform="rotate(-30 150 70)"/>`;
    },
  },
  helmet: {
    box: [60, -30, 280, 300],
    body: (g) => {
      const a = g('#ffffff', '#c9d4e2', '#7e8ca4'), p = g('#ff9aa6', '#ff4f6e', '#c42548');
      return `<path d="M210 54 Q236 -26 290 -14 Q256 4 248 40 Q276 6 314 20 Q270 30 252 64 Z" fill="url(#${p})" stroke="#9c1c3a" stroke-width="2.5" stroke-linejoin="round"/>
        <path d="M68 250 Q60 66 200 52 Q340 66 332 250 L300 262 Q304 226 300 200 Q290 128 200 124 Q110 128 100 200 Q96 226 100 262 Z" fill="url(#${a})" stroke="#5f6c84" stroke-width="3" stroke-linejoin="round"/>
        <path d="M100 160 Q200 112 300 160" stroke="#8695ab" stroke-width="5" fill="none"/>
        <path d="M200 54 V124" stroke="#8695ab" stroke-width="5"/>
        <rect x="186" y="40" width="28" height="22" rx="6" fill="#ffcf3a" stroke="#a8650a" stroke-width="2.5"/>
        ${[[84, 196], [316, 196], [82, 232], [318, 232]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="5" fill="#fff" stroke="#5f6c84" stroke-width="2"/>`).join('')}
        <ellipse cx="140" cy="96" rx="34" ry="14" fill="#fff" opacity=".7" transform="rotate(-25 140 96)"/>`;
    },
  },
  wreath: {
    box: [76, 60, 248, 110],
    body: (g) => {
      const l = g('#c8f5b8', '#6fc45f', '#3f8a3a');
      let leaves = '', fl = '';
      const n = 11;
      for (let k = 0; k < n; k++) {
        const a = Math.PI * (1.04 + (k / (n - 1)) * 0.92);
        const x = 200 + Math.cos(a) * 118, y = 150 + Math.sin(a) * 52;
        leaves += `<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="20" ry="9" fill="url(#${l})" stroke="#2f6e2a" stroke-width="2" transform="rotate(${((a * 180) / Math.PI + 90).toFixed(0)} ${x.toFixed(1)} ${y.toFixed(1)})"/>`;
      }
      const cols = ['#ff8fbf', '#ffffff', '#ffd84a', '#c49ff4', '#ff8fbf', '#ffffff', '#ffd84a'];
      for (let k = 0; k < 7; k++) {
        const a = Math.PI * (1.1 + (k / 6) * 0.8);
        fl += flower(+(200 + Math.cos(a) * 116).toFixed(1), +(150 + Math.sin(a) * 50).toFixed(1), 17, cols[k], k % 2 ? '#ff9e3a' : '#ffd84a');
      }
      return leaves + fl;
    },
  },
  hat: {
    box: [52, -40, 330, 186],
    body: (g) => {
      const a = g('#d9c4ff', '#9a6be0', '#5f3aa0'), f = g('#fff0f7', '#ffa8d0', '#e0609a');
      return `<path d="M244 70 Q270 -30 360 -30 Q330 -6 318 20 Q352 2 370 12 Q330 30 300 64 Q330 54 344 62 Q300 80 262 92 Z" fill="url(#${f})" stroke="#c4467e" stroke-width="2.5" stroke-linejoin="round"/>
        <path d="M270 82 Q300 20 350 -20" stroke="#c4467e" stroke-width="3" fill="none"/>
        <ellipse cx="200" cy="120" rx="144" ry="28" fill="url(#${a})" stroke="#4a2a80" stroke-width="3"/>
        <path d="M118 118 Q114 46 200 38 Q286 46 282 118 Q200 134 118 118 Z" fill="url(#${a})" stroke="#4a2a80" stroke-width="3" stroke-linejoin="round"/>
        <path d="M120 100 Q200 116 280 100 L282 118 Q200 134 118 118 Z" fill="#ffcf3a" stroke="#a8650a" stroke-width="2.5"/>
        <ellipse cx="160" cy="62" rx="22" ry="10" fill="#fff" opacity=".4" transform="rotate(-20 160 62)"/>`;
    },
  },
  star_tiara: {
    box: [112, 0, 176, 136],
    body: (g) => {
      const a = g('#fff6c0', '#ffcf3a', '#d98a10'), s = g('#fffbe0', '#ffe066', '#f0a500');
      return `<path d="M120 126 Q200 94 280 126 L272 134 Q200 106 128 134 Z" fill="url(#${a})" stroke="#a8650a" stroke-width="2.5"/>
        <path d="${starPath(200, 62, 54)}" fill="url(#${s})" stroke="#c98a12" stroke-width="3" stroke-linejoin="round"/>
        <path d="${starPath(200, 62, 26)}" fill="#fff" opacity=".35"/>
        <path d="${starPath(150, 104, 16)}" fill="url(#${s})" stroke="#c98a12" stroke-width="2"/><path d="${starPath(250, 104, 16)}" fill="url(#${s})" stroke="#c98a12" stroke-width="2"/>
        <ellipse cx="186" cy="44" rx="8" ry="5" fill="#fff" opacity=".9" transform="rotate(-30 186 44)"/>`;
    },
  },
  hennin: {
    box: [96, -180, 270, 520],
    body: (g) => {
      const a = g('#ffe6f2', '#ff8cc0', '#d4508e'), v = g('#ffffff', '#f4f8ff', '#d6e2f4');
      return `<path d="M200 -160 Q256 -40 290 80 Q316 190 312 300 Q300 284 290 300 Q282 200 262 110 Q236 0 200 -160 Z" fill="url(#${v})" stroke="#b8c6dc" stroke-width="2.5" opacity=".75"/>
        <path d="M200 -170 L278 118 Q200 134 122 118 Z" fill="url(#${a})" stroke="#a83a70" stroke-width="3" stroke-linejoin="round"/>
        <path d="M180 -96 L222 -88 M168 -48 L236 -36 M154 4 L250 18 M140 56 L262 70" stroke="#ffd84a" stroke-width="5" stroke-linecap="round"/>
        <path d="M122 110 Q200 92 278 110 L278 124 Q200 140 122 124 Z" fill="#ffcf3a" stroke="#a8650a" stroke-width="2.5"/>
        <circle cx="200" cy="-170" r="9" fill="#ffd84a" stroke="#a8650a" stroke-width="2"/>
        <path d="M176 -60 L160 60" stroke="#fff" stroke-opacity=".5" stroke-width="8" stroke-linecap="round"/>`;
    },
  },
  bow: {
    box: [100, 10, 200, 130],
    body: (g) => {
      const a = g('#ffc8dc', '#ff5e8e', '#c42a5a');
      return `<path d="M200 96 Q150 30 108 52 Q90 96 120 128 Q160 136 200 96 Z" fill="url(#${a})" stroke="#9c1c44" stroke-width="3" stroke-linejoin="round"/>
        <path d="M200 96 Q250 30 292 52 Q310 96 280 128 Q240 136 200 96 Z" fill="url(#${a})" stroke="#9c1c44" stroke-width="3" stroke-linejoin="round"/>
        <path d="M140 66 Q160 90 186 96 M260 66 Q240 90 214 96" stroke="#9c1c44" stroke-opacity=".4" stroke-width="3" fill="none"/>
        <ellipse cx="200" cy="98" rx="22" ry="20" fill="url(#${a})" stroke="#9c1c44" stroke-width="3"/>
        <ellipse cx="130" cy="64" rx="12" ry="6" fill="#fff" opacity=".7" transform="rotate(-30 130 64)"/>
        ${[[150, 80], [252, 74], [270, 106], [132, 108]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="5" fill="#fff" opacity=".85"/>`).join('')}`;
    },
  },
  // ---------------------------------------------------------------- scarpe
  slippers: {
    box: [128, 730, 144, 104],
    body: (g) => {
      const a = g('#ffe0ee', '#ff9cc6', '#e0609a');
      const one = (x: number) => `<path d="M${x - 10} 800 L${x + 14} 744 M${x + 10} 800 L${x - 14} 744 M${x - 14} 776 L${x + 14} 776" stroke="#ff7fb5" stroke-width="4" stroke-linecap="round"/>
        <path d="M${x - 28} 812 Q${x - 26} 796 ${x} 796 Q${x + 26} 796 ${x + 28} 812 Q${x + 26} 830 ${x} 830 Q${x - 26} 830 ${x - 28} 812 Z" fill="url(#${a})" stroke="#c4467e" stroke-width="3"/>
        <path d="M${x - 6} 800 L${x} 806 L${x + 6} 800 L${x} 796 Z" fill="#fff"/><ellipse cx="${x - 12}" cy="806" rx="7" ry="3.5" fill="#fff" opacity=".7"/>`;
      return one(170) + one(230);
    },
  },
  boots: {
    box: [134, 704, 132, 132],
    body: (g) => {
      const a = g('#d9a06a', '#9a5e30', '#62381a');
      const one = (x: number) => `<path d="M${x - 24} 720 H${x + 24} V800 L${x + 28} 812 Q${x + 26} 832 ${x} 832 Q${x - 28} 832 ${x - 28} 812 L${x - 24} 800 Z" fill="url(#${a})" stroke="#4a2810" stroke-width="3" stroke-linejoin="round"/>
        <path d="M${x - 27} 712 H${x + 27} Q${x + 30} 724 ${x + 26} 738 H${x - 26} Q${x - 30} 724 ${x - 27} 712 Z" fill="#c4874e" stroke="#4a2810" stroke-width="3"/>
        <rect x="${x - 6}" y="760" width="12" height="10" rx="3" fill="#ffd84a" stroke="#a8650a" stroke-width="1.5"/>
        <ellipse cx="${x - 12}" cy="770" rx="5" ry="22" fill="#fff" opacity=".25"/>`;
      return one(173) + one(227);
    },
  },
  sparkle: {
    box: [128, 760, 144, 76],
    body: (g) => {
      const a = g('#fff6c0', '#ffcf3a', '#d98a10');
      const one = (x: number) => `<path d="M${x - 29} 812 Q${x - 27} 792 ${x} 792 Q${x + 27} 792 ${x + 29} 812 Q${x + 27} 832 ${x} 832 Q${x - 27} 832 ${x - 29} 812 Z" fill="url(#${a})" stroke="#a8650a" stroke-width="3"/>
        <path d="${starPath(x, 802, 10)}" fill="#ff8cc6" stroke="#c4467e" stroke-width="1.5"/>
        ${sparkle(x - 16, 818, 4)}${sparkle(x + 16, 816, 4)}<ellipse cx="${x - 12}" cy="800" rx="7" ry="3" fill="#fff" opacity=".8"/>`;
      return one(170) + one(230);
    },
  },
  knight_boots: {
    box: [132, 666, 136, 170],
    body: (g) => {
      const a = g('#ffffff', '#c9d4e2', '#7e8ca4');
      const one = (x: number) => `<path d="M${x - 24} 696 H${x + 24} V800 L${x + 30} 814 Q${x + 26} 834 ${x} 834 Q${x - 30} 834 ${x - 30} 814 L${x - 24} 800 Z" fill="url(#${a})" stroke="#5f6c84" stroke-width="3" stroke-linejoin="round"/>
        <ellipse cx="${x}" cy="690" rx="22" ry="18" fill="url(#${a})" stroke="#5f6c84" stroke-width="3"/>
        <path d="M${x - 24} 740 H${x + 24} M${x - 24} 778 H${x + 24}" stroke="#7e8ca4" stroke-width="3"/>
        <circle cx="${x}" cy="690" r="5" fill="#ffcf3a" stroke="#a8650a" stroke-width="1.5"/>
        <ellipse cx="${x - 12}" cy="740" rx="5" ry="26" fill="#fff" opacity=".7"/>`;
      return one(173) + one(227);
    },
  },
  // ---------------------------------------------------------------- accessori
  necklace: {
    box: [150, 372, 100, 86],
    body: () => {
      let pearls = '';
      for (let k = 0; k <= 10; k++) {
        const tt = k / 10, x = 160 + 80 * tt, y = 382 + Math.sin(tt * Math.PI) * 34;
        pearls += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="6" fill="#fffaf2" stroke="#c9b8a0" stroke-width="1.5"/><circle cx="${(x - 2).toFixed(1)}" cy="${(y - 2).toFixed(1)}" r="2" fill="#fff"/>`;
      }
      return `${pearls}<path d="M200 452 Q182 438 184 426 Q186 416 196 418 Q199 420 200 424 Q201 420 204 418 Q214 416 216 426 Q218 438 200 452 Z" fill="#ff5e9a" stroke="#c4245f" stroke-width="2"/>
        <circle cx="194" cy="426" r="3" fill="#fff" opacity=".9"/>`;
    },
  },
  bowtie: {
    box: [158, 362, 84, 48],
    body: (g) => {
      const a = g('#9cc4ff', '#3d72dc', '#24499c');
      return `<path d="M200 386 L164 368 Q156 386 164 404 Z M200 386 L236 368 Q244 386 236 404 Z" fill="url(#${a})" stroke="#1b3a80" stroke-width="2.5" stroke-linejoin="round"/>
        <rect x="190" y="376" width="20" height="20" rx="6" fill="url(#${a})" stroke="#1b3a80" stroke-width="2.5"/>
        <circle cx="174" cy="380" r="3" fill="#fff"/><circle cx="226" cy="392" r="3" fill="#fff"/>`;
    },
  },
  cape: {
    box: [36, 340, 328, 490],
    body: (g) => {
      const a = g('#c9a6ff', '#7a45d0', '#4c2896', true), r = g('#e8dcff', '#a77df0', '#6a3dc0');
      return `<path d="M124 380 Q200 360 276 380 Q322 580 356 806 Q300 826 252 812 Q200 830 148 812 Q100 826 44 806 Q78 580 124 380 Z" fill="url(#${a})" stroke="#321a6e" stroke-width="3" stroke-linejoin="round"/>
        <path d="M60 790 Q100 804 148 796 Q200 812 252 796 Q300 804 340 790" stroke="#ffd84a" stroke-width="7" fill="none" stroke-linecap="round"/>
        <path d="M142 350 Q200 324 258 350 L270 392 Q200 372 130 392 Z" fill="url(#${r})" stroke="#321a6e" stroke-width="3" stroke-linejoin="round"/>
        <path d="M100 520 Q90 660 80 780 M300 520 Q310 660 320 780" stroke="#321a6e" stroke-opacity=".35" stroke-width="5" fill="none"/>
        ${[[96, 600], [304, 640], [84, 720], [316, 740]].map(([x, y]) => `<path d="${starPath(x, y, 9)}" fill="#ffd84a" opacity=".9"/>`).join('')}`;
    },
  },
  wings: {
    box: [8, 296, 384, 320],
    body: () => {
      const wg = uid('wg');
      const lobe = (cx: number, cy: number, rx: number, ry: number, rot: number) =>
        `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" transform="rotate(${rot} ${cx} ${cy})" fill="url(#${wg})" stroke="#9a7ad8" stroke-width="3" opacity=".9"/>`;
      return `<defs><radialGradient id="${wg}" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#ffffff"/><stop offset=".45" stop-color="#d6f2ff"/><stop offset=".8" stop-color="#e3cfff"/><stop offset="1" stop-color="#ffc2e4"/></radialGradient></defs>
        ${lobe(104, 396, 96, 66, -28)}${lobe(296, 396, 96, 66, 28)}${lobe(130, 520, 62, 44, 24)}${lobe(270, 520, 62, 44, -24)}
        <path d="M190 440 Q120 400 40 360 M190 450 Q140 420 70 440 M192 470 Q150 500 100 540" stroke="#fff" stroke-width="3" fill="none" opacity=".8"/>
        <path d="M210 440 Q280 400 360 360 M210 450 Q260 420 330 440 M208 470 Q250 500 300 540" stroke="#fff" stroke-width="3" fill="none" opacity=".8"/>
        ${sparkle(60, 380, 9)}${sparkle(340, 380, 9)}${sparkle(110, 560, 6)}${sparkle(290, 560, 6)}`;
    },
  },
  wand: {
    box: [264, 382, 130, 210],
    body: (g) => {
      const s = g('#fffbe0', '#ffe066', '#f0a500');
      return `<path d="M300 572 L344 448" stroke="#a8650a" stroke-width="12" stroke-linecap="round"/>
        <path d="M300 572 L344 448" stroke="#fff4d0" stroke-width="7" stroke-linecap="round"/>
        <path d="M306 556 L312 540 M318 522 L324 506 M330 488 L336 472" stroke="#ff8cc6" stroke-width="7" stroke-linecap="round"/>
        <path d="${starPath(348, 434, 40)}" fill="url(#${s})" stroke="#c98a12" stroke-width="3" stroke-linejoin="round"/>
        <path d="${starPath(348, 434, 18)}" fill="#fff" opacity=".4"/>
        ${sparkle(296, 412, 9)}${sparkle(384, 480, 7)}${sparkle(380, 396, 6)}`;
    },
  },
  shield: {
    box: [236, 452, 164, 196],
    body: (g) => {
      const a = g('#9cc4ff', '#3d72dc', '#24499c'), r = g('#ffffff', '#c9d4e2', '#7e8ca4');
      return `<path d="M246 470 Q318 448 390 470 Q392 580 318 640 Q244 580 246 470 Z" fill="url(#${r})" stroke="#5f6c84" stroke-width="3" stroke-linejoin="round"/>
        <path d="M260 482 Q318 464 376 482 Q376 572 318 622 Q260 572 260 482 Z" fill="url(#${a})" stroke="#1b3a80" stroke-width="2.5"/>
        <path d="M318 580 Q286 556 288 532 Q290 514 308 516 Q314 518 318 526 Q322 518 328 516 Q346 514 348 532 Q350 556 318 580 Z" fill="#ffcf3a" stroke="#a8650a" stroke-width="3"/>
        <ellipse cx="282" cy="500" rx="9" ry="20" fill="#fff" opacity=".35"/>`;
    },
  },
  bouquet: {
    box: [252, 456, 140, 136],
    body: () => `<path d="M300 578 L318 520 M300 578 L300 516 M300 578 L282 522" stroke="#3f8a3a" stroke-width="5" stroke-linecap="round"/>
      <ellipse cx="282" cy="520" rx="16" ry="8" fill="#6fc45f" transform="rotate(-40 282 520)"/><ellipse cx="342" cy="520" rx="16" ry="8" fill="#6fc45f" transform="rotate(40 342 520)"/>
      ${flower(318, 490, 22, '#ff8fbf')}${flower(284, 500, 18, '#ffffff')}${flower(350, 496, 17, '#ffd84a', '#ff9e3a')}${flower(316, 524, 16, '#c49ff4')}
      <path d="M292 562 Q300 550 310 562 L304 576 Z" fill="#ff5e9a" stroke="#c4245f" stroke-width="2"/>
      <path d="M300 566 Q284 584 278 590 M302 566 Q318 584 326 588" stroke="#ff5e9a" stroke-width="4" fill="none" stroke-linecap="round"/>`,
  },
  parasol: {
    box: [218, 158, 212, 430],
    body: (g) => {
      const a = g('#fff0f7', '#ffb8d8', '#e078a8');
      let scal = '';
      for (let k = 0; k < 6; k++) { const x = 238 + k * 30; scal += `<path d="M${x} 262 Q${x + 15} 282 ${x + 30} 262" fill="#fff" stroke="#e078a8" stroke-width="2.5"/>`; }
      return `<path d="M300 574 L330 200" stroke="#8a5a34" stroke-width="7" stroke-linecap="round"/>
        <path d="M300 574 Q290 588 300 594" stroke="#8a5a34" stroke-width="7" fill="none" stroke-linecap="round"/>
        <path d="M238 262 Q238 172 328 170 Q418 172 418 262 Z" fill="url(#${a})" stroke="#c4467e" stroke-width="3" stroke-linejoin="round"/>
        ${scal}
        <path d="M268 262 Q280 200 328 172 M388 262 Q376 200 328 172 M328 172 V262" stroke="#c4467e" stroke-opacity=".5" stroke-width="2.5" fill="none"/>
        <circle cx="328" cy="166" r="7" fill="#ffd84a" stroke="#a8650a" stroke-width="2"/>
        <ellipse cx="282" cy="208" rx="16" ry="8" fill="#fff" opacity=".6" transform="rotate(-35 282 208)"/>`;
    },
  },
};

/** I copricapi che calzano sulla testa (non seguono il volume dei capelli). */
export const FIT_HEAD = new Set<ItemId>(['helmet']);

function itemTex(id: ItemId): SvgTex {
  const def = ITEM_ART[id];
  const defs: string[] = [];
  const g = (l: string, b: string, d: string, v = false) => { const k = uid('it'); defs.push(lightGrad(k, l, b, d, v)); return k; };
  const body = def.body(g);
  return part(`at_item_${id}`, def.box, `<defs>${defs.join('')}</defs>${body}`);
}

/** Sagoma del manichino nell'atelier (stesse misure del corpo: i capi gli calzano a pennello). */
function mannequinTex(): SvgTex {
  const a = uid('mq'), w = uid('mw'), s = uid('ms');
  return part('at_mannequin', [96, 316, 208, 528], `<defs>${lightGrad(a, '#fffaf2', '#f3e2cc', '#d4b896')}${lightGrad(w, '#e8c37a', '#b98a44', '#7a5520')}${blur(s, 5)}</defs>
    <ellipse cx="200" cy="828" rx="80" ry="12" fill="#1d2440" opacity=".25" filter="url(#${s})"/>
    <path d="M194 560 V812 M206 560 V812" stroke="url(#${w})" stroke-width="10"/>
    <path d="M140 820 Q200 790 260 820 Q200 832 140 820 Z" fill="url(#${w})" stroke="#6a4818" stroke-width="2.5"/>
    <rect x="186" y="326" width="28" height="40" rx="10" fill="url(#${a})" stroke="#bfa27c" stroke-width="2.5"/>
    <ellipse cx="200" cy="326" rx="18" ry="10" fill="url(#${w})" stroke="#6a4818" stroke-width="2"/>
    <path d="M132 392 Q200 360 268 392 Q270 470 258 520 Q262 556 254 572 L146 572 Q138 556 142 520 Q130 470 132 392 Z" fill="url(#${a})" stroke="#bfa27c" stroke-width="3"/>
    <path d="M200 372 V570" stroke="#bfa27c" stroke-width="2" stroke-dasharray="6 6"/>
    <ellipse cx="166" cy="430" rx="10" ry="30" fill="#fff" opacity=".6"/>`);
}

// Riquadri noti fin dal caricamento del modulo (servono a world.ts anche se le texture sono già pronte).
const BODY_BOX: Box = [60, 326, 280, 514];
const HEAD_BOX: Box = [24, 0, 352, 400];
const HAIRBACK_BOX: Box = [36, 80, 328, 500];
for (const c of CHARACTERS) {
  PART_BOX[`at_body_${c.skin}`] = BODY_BOX;
  PART_BOX[`at_head_${c.id}`] = HEAD_BOX;
  PART_BOX[`at_hairback_${c.id}`] = HAIRBACK_BOX;
}
for (const [id, d] of Object.entries(ITEM_ART)) PART_BOX[`at_item_${id}`] = d.box;
PART_BOX.at_mannequin = [96, 316, 208, 528];

/** Il personaggio ha i capelli lunghi dietro le spalle? */
export const hasHairBack = (c: Character): boolean => ['long', 'bob', 'ringlets'].includes(c.hair);

export function dollTextures(): SvgTex[] {
  const skins = new Set(CHARACTERS.map((c) => c.skin));
  return [
    ...[...skins].map(bodyTex),
    ...CHARACTERS.flatMap(headTex),
    ...faceTex(),
    ...(Object.keys(ITEM_ART) as ItemId[]).map(itemTex),
    mannequinTex(),
  ];
}
