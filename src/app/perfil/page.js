'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function PerfilPage() {
  const [user, setUser] = useState(null);
  const [perfil, setPerfil] = useState(null);
  const [acuarios, setAcuarios] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    async function cargarDatos() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        // Cargar perfil
        const { data: perfilData } = await supabase
          .from('perfiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
        setPerfil(perfilData);

        // Cargar acuarios
        const { data: acuariosData } = await supabase
          .from('acuarios')
          .select('*')
          .eq('usuario_id', user.id);
        
        setAcuarios(acuariosData || []);
      }
      setCargando(false);
    }
    cargarDatos();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  if (cargando) return <div style={{ padding: '2rem' }}>Cargando perfil...</div>;

  if (!user) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h2>Debes iniciar sesión para ver tu perfil</h2>
        <Link href="/acceder">Ir a Iniciar Sesión</Link>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid black', paddingBottom: '1rem' }}>
        <h1>Mi Perfil</h1>
        <button onClick={handleLogout} style={{ background: 'white', border: '1px solid black', padding: '0.5rem 1rem', cursor: 'pointer' }}>
          Cerrar Sesión
        </button>
      </div>

      <div style={{ marginTop: '2rem' }}>
        <h3>Información Personal</h3>
        <p><strong>Usuario:</strong> {perfil?.nombre_usuario || 'Sin nombre configurado'}</p>
        <p><strong>Bio:</strong> {perfil?.biografia || 'Sin biografía'}</p>
        <p><strong>Karma:</strong> {perfil?.karma || 0} 🐟</p>
        <Link href="/perfil/editar" style={{ color: 'blue', textDecoration: 'underline' }}>Editar Perfil</Link>
      </div>

      <div style={{ marginTop: '3rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3>Mis Acuarios</h3>
          <Link href="/acuarios/nuevo" style={{ background: 'black', color: 'white', padding: '0.5rem 1rem', textDecoration: 'none' }}>
            + Nuevo Acuario
          </Link>
        </div>

        {acuarios.length === 0 ? (
          <p style={{ marginTop: '1rem', fontStyle: 'italic' }}>Aún no has registrado ningún acuario.</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
            {acuarios.map(a => (
              <div key={a.id} style={{ border: '1px solid black', padding: '1rem' }}>
                <h4>{a.nombre}</h4>
                <p>{a.litros} Litros - {a.tipo_agua}</p>
                <Link href={`/acuarios/${a.id}`} style={{ fontWeight: 'bold' }}>Ver detalles / Habitantes</Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
