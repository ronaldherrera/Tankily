"use client";

import MenuMas from '@/components/shell/MenuMas';

// En el móvil, "Más" despliega la barra inferior (AppShell); esta página queda para el enlace directo
export default function MasPage() {
  return (
    <div className="contenido">
      <div className="columna">
        <MenuMas />
      </div>
    </div>
  );
}
