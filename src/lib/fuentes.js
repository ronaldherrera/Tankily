import { Fredoka, Geist } from 'next/font/google';

// Geist para toda la interfaz (títulos y texto)
export const geist = Geist({
  subsets: ['latin'],
  variable: '--font-geist',
  display: 'swap',
});

// Solo para el logotipo ("ankily" junto a la t de ola)
export const fredoka = Fredoka({
  subsets: ['latin'],
  weight: '500',
  variable: '--font-fredoka',
  display: 'swap',
});
