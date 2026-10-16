"use client";

import { useEffect, useState } from 'react';
import Link from '@/components/Enlace';
import { Heart, MessageCircle, UserPlus, Repeat2, AtSign, MessagesSquare, CheckCircle2, Star, Fish } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useSesion } from '@/lib/sesion';
import { formatRelativeTime } from '@/lib/formatRelativeTime';
import { Avatar, RequiereSesion, Vacio, Cargando } from '@/components/ui';
import { useT } from '@/i18n/IdiomaProvider';

const ICONOS = {
  me_gusta: Heart, comentario: MessageCircle, seguidor: UserPlus, eco: Repeat2, mencion: AtSign,
  respuesta_foro: MessagesSquare, solucion: CheckCircle2, resena: Star, seguidor_tanque: Fish,
};

function enlace(n) {
  if (n.publicacion_id) return `/post/?id=${n.publicacion_id}`;
  if (n.hilo_id) return `/foro/hilo/?id=${n.hilo_id}`;
  if (n.tanque_id) return `/tanque/?id=${n.tanque_id}`;
  if (n.tienda?.slug) return `/tiendas/tienda/?s=${n.tienda.slug}`;
  return `/u/?n=${n.actor?.usuario}`;
}

export default function NotificacionesPage() {
  const { usuario, cargando } = useSesion();
  const [lista, setLista] = useState(null);
  const { t } = useT();

  useEffect(() => {
    if (!usuario) return;
    (async () => {
      const { data } = await supabase
        .from('notificaciones')
        .select('*, actor:perfiles!actor_id(usuario, nombre, avatar_url), tienda:tiendas(slug)')
        .eq('usuario_id', usuario.id)
        .order('creado_en', { ascending: false })
        .limit(80);
      setLista(data || []);
      if (data?.some((n) => !n.leida)) {
        await supabase.from('notificaciones').update({ leida: true }).eq('usuario_id', usuario.id).eq('leida', false);
        window.dispatchEvent(new Event('tk:leidos'));
      }
    })();
  }, [usuario]);

  if (cargando) return null;
  if (!usuario) return <div className="contenido"><RequiereSesion /></div>;

  return (
    <div className="contenido">
      <div className="columna">
        <h1 className="titulo-l" style={{ paddingTop: 12 }}>{t('notificaciones.titulo')}</h1>
        {lista === null ? <Cargando alto={64} n={5} /> : lista.length === 0 ? (
          <Vacio titulo={t('notificaciones.vacioTitulo')}>{t('notificaciones.vacioTexto')}</Vacio>
        ) : (
          <ul className="lista-filas cristal-suave" style={{ padding: '4px 12px' }}>
            {lista.map((n) => {
              const Icono = ICONOS[n.tipo] || Heart;
              const texto = t(`notificaciones.tipos.${n.tipo}`);
              return (
                <li key={n.id} style={{ background: n.leida ? undefined : 'var(--agua-tinta)', borderRadius: 12, paddingInline: 8 }}>
                  <Icono size={18} style={{ color: 'var(--agua)', flexShrink: 0 }} />
                  <Avatar perfil={n.actor} tamano={34} />
                  <Link href={enlace(n)} style={{ flex: 1, minWidth: 0 }}>
                    <strong>{n.actor?.nombre || n.actor?.usuario || t('notificaciones.alguien')}</strong> <span className="texto-2">{texto}</span>
                  </Link>
                  <span className="mini texto-3">{formatRelativeTime(n.creado_en)}</span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
