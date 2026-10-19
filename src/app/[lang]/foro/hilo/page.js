"use client";

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import HiloForo from '@/components/paginas/HiloForo';

function PorId() {
  return <HiloForo id={useSearchParams().get('id')} />;
}

export default function HiloPage() {
  return <Suspense><PorId /></Suspense>;
}
