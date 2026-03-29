"use client";

import { useSearchParams } from 'next/navigation';
import AcuarioDetalle from './AcuarioDetalle';

export default function AcuarioPage() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id');

  if (!id) return <div style={{ padding: '2rem' }}>ID de acuario no proporcionado.</div>;

  return <AcuarioDetalle id={id} />;
}
