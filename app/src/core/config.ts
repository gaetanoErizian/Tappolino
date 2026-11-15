/** Configurazione dell'app (src/config.ts la implementa). */
export interface HouseAd {
  /** chiave di traduzione del nome del gioco, o nome già scritto */
  name: string;
  /** link App Store del gioco/app promosso */
  url: string;
  color: string;
  /** emoji o breve simbolo mostrato come icona */
  icon: string;
}

export interface AppConfig {
  appId: string;
  version: string;
  developer: string;
  /** prodotto non consumabile unico: sblocca tutti i giochi e toglie la pubblicità */
  productId: string;
  privacyUrl: string;
  admob: {
    /** ID unità banner Android. In sviluppo usare l'ID di test di Google. */
    androidBannerId: string;
    /** true = annunci di prova (OBBLIGATORIO finché non si pubblica) */
    testing: boolean;
  };
  /**
   * Banner della casa su iOS (altri nostri giochi). Nel collettore Tappolino è spento:
   * resta disponibile per le future app singole.
   */
  /**
   * Giochi "in arrivo" (decisione 24): id dei giochi già nell'app ma non ancora pubblicati.
   * Per pubblicarne uno con un aggiornamento: toglierlo da questo elenco.
   */
  comingSoon: string[];
  houseBannerOnIOS: boolean;
  houseAds: HouseAd[];
}

/** ID ufficiali di TEST di Google (sicuri da usare in sviluppo). */
export const ADMOB_TEST = {
  appIdAndroid: 'ca-app-pub-3940256099942544~3347511713',
  bannerAndroid: 'ca-app-pub-3940256099942544/9214589741',
};
