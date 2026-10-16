"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useSesion } from '@/lib/sesion';
import { colorAgua } from '@/lib/constantes';
import { Avatar, SubidorImagenes } from '@/components/ui';
import { SELECT_POST } from './Feed';
import { useT } from '@/i18n/IdiomaProvider';
import { detectarIdioma } from '@/lib/traduccion';
import { mensajeError } from '@/lib/errores';

export default function PostComposer({ onPublicado, tanqueFijo = null }) {
  const { usuario, perfil } = useSesion();
  const { t, lang } = useT();
  const [texto, setTexto] = useState('');
  const [imagenes, setImagenes] = useState([]);
  const [tanques, setTanques] = useState([]);
  const [tanqueId, setTanqueId] = useState(tanqueFijo ? String(tanqueFijo) : '');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!usuario || tanqueFijo) return;
    supabase.from('tanques').select('id, nombre, tipo').eq('usuario_id', usuario.id).order('creado_en')
      .then(({ data }) => setTanques(data || []));
  }, [usuario, tanqueFijo]);

  if (!usuario) return null;

  const tanqueElegido = tanques.find((t) => String(t.id) === tanqueId);
  const puedePublicar = (texto.trim() || imagenes.length) && !enviando;

  async function publicar(e) {
    e.preventDefault();
    if (!puedePublicar) return;
    setEnviando(true);
    setError('');
    const { data, error } = await supabase
      .from('publicaciones')
      .insert({ contenido: texto.trim(), imagenes, tanque_id: tanqueId ? Number(tanqueId) : null, idioma: await detectarIdioma(texto, lang) })
      .select(SELECT_POST)
      .single();
    setEnviando(false);
    if (error) {
      setError(t('compositor.error', { error: mensajeError(error, t) }));
      return;
    }
    setTexto('');
    setImagenes([]);
    onPublicado?.(data);
  }

  return (
    <form onSubmit={publicar} className="compositor cristal" style={{ '--agua': tanqueElegido ? colorAgua(tanqueElegido.tipo) : undefined }}>
      <div style={{ display: 'flex', gap: 12 }}>
        <Avatar perfil={perfil} tamano={42} />
        <textarea
          className="entrada compositor-texto"
          placeholder={tanqueFijo ? t('compositor.placeholderTanque') : t('compositor.placeholder')}
          value={texto}
          maxLength={2000}
          onChange={(e) => setTexto(e.target.value)}
          aria-label={t('compositor.etiqueta')}
        />
      </div>
      <SubidorImagenes valor={imagenes} onCambio={setImagenes} carpeta="posts" compacto={false} />
      {error && <p className="aviso error">{error}</p>}
      <div className="compositor-pie">
        {!tanqueFijo && tanques.length > 0 && (
          <select className="entrada" style={{ width: 'auto', minHeight: 36, height: 36, paddingBlock: 0 }} value={tanqueId} onChange={(e) => setTanqueId(e.target.value)} aria-label={t('compositor.tanqueRelacionado')}>
            <option value="">{t('compositor.sinTanque')}</option>
            {tanques.map((t) => <option key={t.id} value={t.id}>{t.nombre}</option>)}
          </select>
        )}
        <span className="texto-3 mini" style={{ marginLeft: 'auto' }}>{texto.length > 1800 ? `${2000 - texto.length}` : ''}</span>
        <button className="btn btn-primario btn-s" disabled={!puedePublicar}>{enviando ? t('comun.publicando') : t('comun.publicar')}</button>
      </div>
    </form>
  );
}
