import { NativePurchases, PURCHASE_TYPE } from '@capgo/native-purchases';
import { isNative, platform } from './platform';

/**
 * Acquisto unico non consumabile "togli pubblicità" (Play Billing / StoreKit 2 diretti,
 * nessun server di terzi). Sul web non è disponibile.
 */
export type BuyResult = 'ok' | 'cancel' | 'error' | 'unavailable';

async function supported(): Promise<boolean> {
  if (!isNative()) return false;
  try {
    return (await NativePurchases.isBillingSupported()).isBillingSupported;
  } catch {
    return false;
  }
}

/** Prezzo localizzato dallo store (mai scritto a mano: Apple lo richiede). */
export async function getPrice(productId: string): Promise<string | null> {
  if (!(await supported())) return null;
  try {
    const { product } = await NativePurchases.getProduct({ productIdentifier: productId, productType: PURCHASE_TYPE.INAPP });
    return product?.priceString ?? null;
  } catch {
    return null;
  }
}

/** true se l'acquisto risulta posseduto, false se no, null se non verificabile (offline, web). */
export async function checkOwned(productId: string): Promise<boolean | null> {
  if (!(await supported())) return null;
  try {
    const { purchases } = await NativePurchases.getPurchases({ productType: PURCHASE_TYPE.INAPP });
    const android = platform() === 'android';
    return purchases.some((p) =>
      p.productIdentifier === productId &&
      (android ? p.purchaseState === '1' || p.purchaseState === 'PURCHASED' : !p.revocationDate));
  } catch {
    return null;
  }
}

export async function buy(productId: string): Promise<BuyResult> {
  if (!(await supported())) return 'unavailable';
  try {
    await NativePurchases.purchaseProduct({ productIdentifier: productId, productType: PURCHASE_TYPE.INAPP, quantity: 1 });
    return 'ok';
  } catch (e) {
    const msg = String((e as Error)?.message ?? e).toLowerCase();
    if (msg.includes('cancel')) return 'cancel';
    // Già posseduto (es. reinstallazione): verifica e considera riuscito.
    if (msg.includes('own') && (await checkOwned(productId))) return 'ok';
    return 'error';
  }
}

/** "Ripristina acquisti": obbligatorio per Apple. */
export async function restore(productId: string): Promise<boolean | null> {
  if (!(await supported())) return null;
  try {
    await NativePurchases.restorePurchases();
  } catch {
    /* si verifica comunque sotto */
  }
  return checkOwned(productId);
}
