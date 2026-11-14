import { platform, urlParam } from './platform';
import { setFooterHeight, footerEl } from './layout';
import { parentalGate } from './parentalGate';
import { t } from './i18n';
import type { AppConfig, HouseAd } from './config';

/**
 * Banner nel footer, mai sopra il gioco. Niente video, interstitial o rewarded: non esistono in questo codice.
 *  - Android: AdMob banner adattivo, child-directed, non personalizzato, contenuti max "G".
 *  - iOS: nessun SDK pubblicitario. Nel collettore nessun banner; nelle app singole (houseBannerOnIOS)
 *    un "banner della casa" in HTML con i nostri giochi, dietro parental gate.
 *  - Web: nessun banner (con ?banner=1 o ?banner=house si simula lo spazio per i test).
 */
let active: 'admob' | 'house' | 'placeholder' | null = null;
let houseTimer: ReturnType<typeof setInterval> | null = null;

export async function initAds(cfg: AppConfig, adsRemoved: boolean): Promise<void> {
  if (adsRemoved) {
    setFooterHeight(0);
    return;
  }
  const p = platform();
  if (p === 'android') {
    await showAdMob(cfg);
  } else if (p === 'ios') {
    if (cfg.houseBannerOnIOS) showHouse(cfg.houseAds);
    else setFooterHeight(0);
  } else {
    const b = urlParam('banner');
    if (b === 'house') showHouse(cfg.houseAds);
    else if (b) showPlaceholder();
  }
}

export async function removeAds(): Promise<void> {
  if (active === 'admob') {
    try {
      const { AdMob } = await import('@capacitor-community/admob');
      await AdMob.removeBanner();
    } catch { /* già rimosso */ }
  }
  if (houseTimer) clearInterval(houseTimer);
  houseTimer = null;
  footerEl().innerHTML = '';
  active = null;
  setFooterHeight(0);
}

async function showAdMob(cfg: AppConfig): Promise<void> {
  try {
    const { AdMob, BannerAdSize, BannerAdPosition, BannerAdPluginEvents, MaxAdContentRating } = await import('@capacitor-community/admob');
    await AdMob.initialize({
      tagForChildDirectedTreatment: true,
      tagForUnderAgeOfConsent: true,
      maxAdContentRating: MaxAdContentRating.General,
      initializeForTesting: cfg.admob.testing,
    });
    await AdMob.addListener(BannerAdPluginEvents.SizeChanged, (size) => {
      if (active === 'admob') setFooterHeight(size.height);
    });
    active = 'admob';
    // Spazio riservato subito (altezza tipica) per evitare salti quando arriva il banner.
    setFooterHeight(56);
    await AdMob.showBanner({
      adId: cfg.admob.androidBannerId,
      adSize: BannerAdSize.ADAPTIVE_BANNER,
      position: BannerAdPosition.BOTTOM_CENTER,
      margin: 0,
      npa: true,
      isTesting: cfg.admob.testing,
    });
  } catch {
    // Nessun annuncio (offline, errore): il gioco occupa tutto lo schermo.
    active = null;
    setFooterHeight(0);
  }
}

function safeBottom(): number {
  const probe = document.createElement('div');
  probe.style.cssText = 'position:fixed;bottom:0;height:0;padding-bottom:env(safe-area-inset-bottom);visibility:hidden';
  document.body.appendChild(probe);
  const v = parseFloat(getComputedStyle(probe).paddingBottom) || 0;
  probe.remove();
  return v;
}

function showHouse(list: HouseAd[]): void {
  active = 'house';
  const f = footerEl();
  const sb = safeBottom();
  const h = 60;
  f.innerHTML = '';
  f.style.paddingBottom = `${sb}px`;
  const bar = document.createElement('div');
  bar.style.cssText = `height:${h}px;display:flex;align-items:center;justify-content:center;gap:12px;color:#fff;
    font:bold 17px "Trebuchet MS",system-ui,sans-serif;background:#2b2140;cursor:pointer;transition:background .4s`;
  f.appendChild(bar);
  let i = 0;
  const render = () => {
    if (!list.length) {
      bar.style.cursor = 'default';
      bar.innerHTML = `<span style="font-size:26px">🎈</span><span>Tappolino Games · ${t('house.soon')}</span>`;
      return;
    }
    const ad = list[i % list.length];
    bar.style.background = ad.color;
    bar.innerHTML = `<span style="font-size:30px">${ad.icon}</span><span>${t(ad.name)}</span>
      <span style="background:#fff;color:#2b2140;border-radius:14px;padding:4px 12px;font-size:15px">${t('house.discover')}</span>`;
  };
  render();
  if (list.length > 1) houseTimer = setInterval(() => { i++; render(); }, 8000);
  bar.addEventListener('click', async () => {
    if (!list.length) return;
    const ad = list[i % list.length];
    if (await parentalGate()) window.open(ad.url, '_blank');
  });
  setFooterHeight(h + sb);
}

function showPlaceholder(): void {
  active = 'placeholder';
  const f = footerEl();
  f.innerHTML = `<div style="height:50px;display:flex;align-items:center;justify-content:center;color:#fff;opacity:.6;
    font:14px system-ui,sans-serif;border-top:2px dashed #fff">Banner 320×50 — test</div>`;
  setFooterHeight(50);
}
