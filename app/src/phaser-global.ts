// Solo per la versione web di test pubblicata come pagina: Phaser arriva da CDN (window.Phaser).
const P = (window as unknown as { Phaser: typeof import('phaser') }).Phaser;
export default P;
