"use client";

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import FichaTanque from '@/components/paginas/FichaTanque';

function PorId() {
  return <FichaTanque id={useSearchParams().get('id')} />;
}

export default function TanquePage() {
  return <Suspense><PorId /></Suspense>;
}
