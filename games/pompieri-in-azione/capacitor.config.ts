import type { CapacitorConfig } from '@capacitor/cli';

// Plugin comuni a entrambe le piattaforme.
const common = ['@capacitor/preferences', '@capgo/native-purchases'];

const config: CapacitorConfig = {
  appId: 'it.tappolino.pompieri',
  appName: 'Pompieri in Azione',
  webDir: 'dist',
  backgroundColor: '#8fd3ff',
  android: {
    // AdMob SOLO su Android.
    includePlugins: [...common, '@capacitor-community/admob'],
  },
  ios: {
    // Su iOS nessun SDK pubblicitario di terzi (categoria Kids, linea guida 1.3).
    includePlugins: common,
    contentInset: 'never',
  },
  plugins: {
    NativePurchases: { autoFinishTransactions: true },
  },
};

export default config;
