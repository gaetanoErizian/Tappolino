/** Configurazione per gioco: ogni gioco ha il suo src/game.config.ts che implementa questa interfaccia. */
export interface HouseAd {
  /** chiave di traduzione del nome del gioco, o nome già scritto */
  name: string;
  /** link App Store (iOS) del gioco promosso */
  url: string;
  /** colore di sfondo della card */
  color: string;
  /** emoji o breve simbolo mostrato come icona */
  icon: string;
}

export interface GameConfig {
  appId: string;
  version: string;
  developer: string;
  /** id del prodotto non consumabile "togli pubblicità" (uguale su Play e App Store) */
  productId: string;
  privacyUrl: string;
  admob: {
    /** ID unità banner Android. In sviluppo usare l'ID di test di Google. */
    androidBannerId: string;
    /** true = annunci di prova (OBBLIGATORIO finché non si pubblica) */
    testing: boolean;
  };
  /** banner della casa su iOS: altri giochi Tappolino */
  houseAds: HouseAd[];
}

/** ID ufficiali di TEST di Google (sicuri da usare in sviluppo). */
export const ADMOB_TEST = {
  appIdAndroid: 'ca-app-pub-3940256099942544~3347511713',
  bannerAndroid: 'ca-app-pub-3940256099942544/9214589741',
};
