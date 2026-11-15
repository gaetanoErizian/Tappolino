// Impronta della password della pagina di prova (decisione 28), come la calcola src/core/testGate.ts.
// Uso (nel flusso di pubblicazione):  TEST_PAGE_PASSWORD=... node scripts/gate-hash.mjs
// La password non va mai scritta nel repository: sta nel segreto TEST_PAGE_PASSWORD di GitHub.
import { pbkdf2Sync } from 'node:crypto';

const pw = (process.env.TEST_PAGE_PASSWORD ?? '').trim().toLowerCase();
if (pw.length < 8) {
  console.error('TEST_PAGE_PASSWORD mancante o troppo corta (minimo 8 caratteri): la pagina NON viene pubblicata senza password.');
  process.exit(1);
}
process.stdout.write(pbkdf2Sync(pw, 'tappolino-pagina-di-prova', 100_000, 32, 'sha256').toString('hex'));
