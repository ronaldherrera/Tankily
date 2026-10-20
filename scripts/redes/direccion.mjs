// Dirección de arte por pieza (skill director-arte-redes): paleta, imagen del gancho y portada.
// Las familias de portada rotan para que la cuadrícula del perfil no parezca una sola publicación repetida:
//   foto · tipografica · movil · cifra · versus · krill
import { foto, pag } from './piezas.mjs';

export const DIRECCION = {
  26: { paleta: 'abismo', paletaCifra: 'hondo', paletaMeme: 'coral', ganchoVideo: { clave: 'arrecife', inicio: 1 }, portada: { familia: 'movil', titulo: 'Esto es Tankily:\nla red social\nde la acuariofilia', tam: 0.072, paleta: 'agua', visual: pag('/es/', { desde: 0, alto: 900 }) } },
  25: { paletaFinal: 'abismo', portada: { familia: 'movil', titulo: 'Esto es Tankily:\nla red social\nde la acuariofilia', tam: 0.072, paleta: 'agua', visual: pag('/es/', { desde: 0, alto: 900 }) } },
  1: { paleta: 'abismo', paletaCifra: 'hondo', paletaMeme: 'coral', ganchoVideo: { clave: 'plantado', inicio: 1 }, portada: { familia: 'movil', titulo: 'El diario de tu acuario', paleta: 'agua', visual: pag('/es/', { desde: 0, alto: 900 }) } },
  2: { paleta: 'abismo', paletaCifra: 'coral', paletaMeme: 'agua', ganchoVisual: foto('Betta splendens'), portada: { familia: 'foto', titulo: '¿Un betta en una pecera de un litro?', visual: foto('Betta splendens') } },
  3: { paleta: 'agua', paletaCifra: 'hondo', paletaMeme: 'arena', ganchoVideo: { clave: 'plantado', inicio: 1 }, portada: { familia: 'cifra', cifra: '60 L ≠ 60 L', titulo: 'Los litros reales de tu acuario', paleta: 'hondo' } },
  4: { paleta: 'abismo', paletaCifra: 'coral', paletaMeme: 'coral', ganchoVisual: foto('Neocaridina davidi'), portada: { familia: 'versus', titulo: 'Betta y gambas: ¿sí o no?', visuales: [foto('Betta splendens'), foto('Neocaridina davidi')] } },
  5: { paleta: 'arena', paletaCifra: 'musgo', paletaMeme: 'agua', ganchoVisual: foto('Corydoras aeneus'), portada: { familia: 'krill', titulo: 'Un corydoras solo es un corydoras triste', paleta: 'arena', expresion: 'harto' } },
  6: { paleta: 'abismo', paletaCifra: 'coral', paletaMeme: 'coral', ganchoVideo: { clave: 'boka', inicio: 1 }, portada: { familia: 'tipografica', titulo: 'No metas peces el primer día', paleta: 'coral' } },
  7: { portada: { familia: 'versus', titulo: 'Neón o cardenal', visuales: [foto('Paracheirodon innesi'), foto('Paracheirodon axelrodi')] } },
  8: { paleta: 'agua', paletaCifra: 'hondo', paletaMeme: 'arena', ganchoVideo: { clave: 'neones', inicio: 1 }, portada: { familia: 'krill', titulo: '¿Cuándo cambiaste el agua?', paleta: 'agua', expresion: 'pensando' } },
  9: { paleta: 'musgo', paletaCifra: 'hondo', paletaMeme: 'agua', ganchoVideo: { clave: 'payasos', inicio: 1 }, portada: { familia: 'cifra', cifra: '1.847', titulo: 'especies con ficha, gratis', paleta: 'musgo' } },
  10: { portada: { familia: 'tipografica', titulo: '5 cosas antes de comprar un acuario', paleta: 'hondo' } },
  11: { paleta: 'arena', paletaCifra: 'hondo', paletaMeme: 'agua', portada: { familia: 'movil', titulo: '¿Tienes tienda de acuariofilia?', paleta: 'arena', visual: pag('/es/tiendas/', { desde: 0, alto: 900 }) } },
  12: { paleta: 'agua', paletaCifra: 'coral', paletaMeme: 'coral', ganchoVisual: foto('Neocaridina davidi'), portada: { familia: 'foto', titulo: 'La gamba perfecta para empezar', visual: foto('Neocaridina davidi') } },
  13: { portada: { familia: 'tipografica', titulo: 'Tu primer acuario: dónde ponerlo', paleta: 'arena' } },
  14: { paleta: 'abismo', paletaCifra: 'coral', paletaMeme: 'arena', ganchoVisual: foto('Carassius auratus'), portada: { familia: 'versus', titulo: 'Goldfish y tropicales', visuales: [foto('Carassius auratus'), foto('Poecilia reticulata')] } },
  15: { paleta: 'coral', paletaCifra: 'hondo', paletaMeme: 'agua', ganchoVideo: { clave: 'guppys', inicio: 1 }, ganchoVisual: foto('Poecilia reticulata'), portada: { familia: 'krill', titulo: 'El pez que se multiplica solo', paleta: 'coral', expresion: 'sorpresa' } },
  16: { paleta: 'musgo', paletaCifra: 'hondo', paletaMeme: 'coral', portada: { familia: 'cifra', cifra: '4–8', titulo: 'semanas antes de meter peces', paleta: 'agua' } },
  17: { paleta: 'agua', paletaCifra: 'hondo', paletaMeme: 'arena', ganchoVideo: { clave: 'boka', inicio: 1 }, portada: { familia: 'movil', titulo: '¿Cómo ha cambiado tu agua?', paleta: 'abismo', visual: pag('/es/tanque/arrecife-del-salon-900200/', { ancla: 'Temperatura', desde: -200, alto: 900, ejemplo: true, esperar: 'Nitrato' }) } },
  18: { paleta: 'arena', paletaCifra: 'coral', paletaMeme: 'agua', ganchoVideo: { clave: 'plantado', inicio: 1 }, portada: { familia: 'tipografica', titulo: 'Nunca laves el filtro con agua del grifo', paleta: 'agua' } },
  19: { portada: { familia: 'foto', titulo: '5 peces para empezar', visual: foto('Xiphophorus maculatus') } },
  20: { paleta: 'abismo', paletaCifra: 'musgo', paletaMeme: 'arena', ganchoVisual: foto('Xiphophorus maculatus'), portada: { familia: 'krill', titulo: 'Si tu agua es dura, este es tu pez', paleta: 'musgo', expresion: 'feliz' } },
  21: { paleta: 'abismo', paletaCifra: 'coral', paletaMeme: 'coral', ganchoVideo: { clave: 'neones', inicio: 1 }, ganchoVisual: foto('Pterophyllum scalare'), portada: { familia: 'versus', titulo: 'Escalares y neones', visuales: [foto('Pterophyllum scalare'), foto('Paracheirodon innesi')] } },
  22: { portada: { familia: 'cifra', cifra: '20 min', titulo: 'a la semana para un acuario sano', paleta: 'hondo' } },
  23: { paleta: 'coral', paletaCifra: 'hondo', paletaMeme: 'agua', ganchoVideo: { clave: 'boka', inicio: 1 }, portada: { familia: 'tipografica', titulo: '¿Te han regalado un acuario?', paleta: 'coral' } },
  24: { paleta: 'musgo', paletaCifra: 'agua', paletaMeme: 'arena', ganchoVisual: foto('Neritina natalensis'), portada: { familia: 'foto', titulo: 'El caracol que limpia y no se multiplica', visual: foto('Neritina natalensis') } },
  // Diciembre (20/10/2026)
  27: { paleta: 'hondo', paletaCifra: 'abismo', paletaMeme: 'coral', ganchoVideo: { clave: 'neones', inicio: 40 }, portada: { familia: 'foto', titulo: 'El pez más vendido… y el que más se compra mal', visual: foto('Paracheirodon innesi') } },
  28: { paletaFinal: 'coral', portada: { familia: 'krill', titulo: 'Regalos para un acuarista (que sí va a usar)', paleta: 'coral', expresion: 'feliz' } },
  29: { paleta: 'abismo', paletaCifra: 'musgo', paletaMeme: 'agua', ganchoVideo: { clave: 'guppys', inicio: 30 }, portada: { familia: 'versus', titulo: 'Guppy y platy: ¿juntos?', visuales: [foto('Poecilia reticulata'), foto('Xiphophorus maculatus')] } },
  30: { paletaFinal: 'hondo', portada: { familia: 'tipografica', titulo: 'Te vas por Navidad: ¿y el acuario?', paleta: 'hondo' } },
  31: { paleta: 'abismo', paletaCifra: 'agua', paletaMeme: 'arena', ganchoVideo: { clave: 'payasos', inicio: 5 }, portada: { familia: 'krill', titulo: '¿Un pez payaso para empezar?', paleta: 'agua', expresion: 'sorpresa' } },
  32: { paletaFinal: 'musgo', portada: { familia: 'cifra', cifra: '2027', titulo: '5 propósitos de acuarista', paleta: 'musgo' } },
};
