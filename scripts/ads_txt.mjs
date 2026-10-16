// Genera public/ads.txt a partir de NEXT_PUBLIC_ADSENSE_CLIENT (se ejecuta antes de cada build).
// Google exige este archivo en la raíz del dominio para pagar los anuncios servidos.
import fs from 'fs';

const cliente = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;
if (!cliente) {
  console.log('ads.txt: sin NEXT_PUBLIC_ADSENSE_CLIENT, no se genera');
  process.exit(0);
}
const pub = cliente.replace(/^ca-/, '');
fs.writeFileSync('public/ads.txt', `google.com, ${pub}, DIRECT, f08c47fec0942fa0\n`);
console.log(`ads.txt generado para ${pub}`);
