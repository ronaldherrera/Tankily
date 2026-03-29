"use client";

import { useSearchParams } from 'next/navigation';
import AcuarioDetalle from './AcuarioDetalle';
import { Suspense } from 'react';

function AcuarioContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id');

  if (!id) return <div style={{ padding: '2rem' }}>ID de acuario no proporcionado.</div>;

  return <AcuarioDetalle id={id} />;
}

export default function AcuarioPage() {
  return (
    <Suspense fallback={<div style={{ padding: '2rem' }}>Cargando acuario...</div>}>
      <AcuarioContent />
    </Suspense>
  );
}
