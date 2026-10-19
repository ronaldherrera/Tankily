"use client";

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import FichaAnuncio from '@/components/paginas/FichaAnuncio';

function PorId() {
  return <FichaAnuncio id={useSearchParams().get('id')} />;
}

export default function AnuncioPage() {
  return <Suspense><PorId /></Suspense>;
}
