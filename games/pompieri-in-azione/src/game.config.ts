import { ADMOB_TEST, type GameConfig } from './core/config';

export const CONFIG: GameConfig = {
  appId: 'it.tappolino.pompieri',
  version: '1.0.0',
  developer: 'Tappolino Games',
  productId: 'it.tappolino.pompieri.remove_ads',
  // TODO prima della pubblicazione: pagina privacy pubblica (vedi store/privacy-policy.html)
  privacyUrl: 'https://tappolino.it/privacy',
  admob: {
    // TODO prima della pubblicazione: ID unità banner reale da AdMob e testing: false
    androidBannerId: ADMOB_TEST.bannerAndroid,
    testing: true,
  },
  // Banner della casa su iOS: aggiungere qui gli altri giochi Tappolino man mano che escono.
  houseAds: [],
};
