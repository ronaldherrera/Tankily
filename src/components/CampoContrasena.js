"use client";

import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { useT } from '@/i18n/IdiomaProvider';

// Campo de contraseña con el botón del ojo para mostrarla u ocultarla.
// `error` lo pinta en rojo y lo anuncia (p. ej. "no coinciden" en la confirmación).
export default function CampoContrasena({ etiqueta, valor, onCambio, autoComplete = 'current-password', ayuda, error, minLength }) {
  const { t } = useT();
  const [ver, setVer] = useState(false);
  const accion = t(ver ? 'contrasena.ocultar' : 'contrasena.mostrar');
  return (
    <label className="campo">
      <span>{etiqueta}</span>
      <span className="entrada-con-ojo">
        <input
          className="entrada"
          type={ver ? 'text' : 'password'}
          autoComplete={autoComplete}
          autoCapitalize="none"
          spellCheck={false}
          required
          minLength={minLength}
          value={valor}
          onChange={(e) => onCambio(e.target.value)}
          aria-invalid={error ? true : undefined}
        />
        <button type="button" className="entrada-ojo" onClick={() => setVer((v) => !v)} aria-label={accion} aria-pressed={ver} title={accion}>
          {ver ? <EyeOff size={18} aria-hidden /> : <Eye size={18} aria-hidden />}
        </button>
      </span>
      {error ? <small className="campo-error" role="alert">{error}</small> : ayuda && <small>{ayuda}</small>}
    </label>
  );
}
