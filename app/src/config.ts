import { ADMOB_TEST, type AppConfig } from './core/config';

/** Configurazione dell'app Tappolino (collettore di giochi). */
export const CONFIG: AppConfig = {
  appId: 'it.tappolino.app',
  version: '1.0.0',
  developer: 'Tappolino Games',
  productId: 'it.tappolino.app.unlock_all',
  // TODO prima della pubblicazione: pagina privacy pubblica (vedi store/privacy-policy.html)
  privacyUrl: 'https://tappolino.it/privacy',
  admob: {
    // TODO prima della pubblicazione: ID unità banner reale da AdMob e testing: false
    androidBannerId: ADMOB_TEST.bannerAndroid,
    testing: true,
  },
  // v1.0: aperti i giochi 1–5; i giochi 6–10 escono uno alla volta con gli aggiornamenti (decisione 24).
  comingSoon: ['cuccioli', 'monstertruck', 'giardino', 'treno', 'atelier'],
  houseBannerOnIOS: false,
  houseAds: [],
};
