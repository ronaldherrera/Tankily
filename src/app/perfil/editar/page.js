'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function EditarPerfilPage() {
  const [nombreUsuario, setNombreUsuario] = useState('');
  const [bio, setBio] = useState('');
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function cargarPerfil() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: perfil } = await supabase
          .from('perfiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
        if (perfil) {
          setNombreUsuario(perfil.nombre_usuario || '');
          setBio(perfil.biografia || '');
        }
      }
      setCargando(false);
    }
    cargarPerfil();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGuardando(true);

    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase
      .from('perfiles')
      .upsert({
        id: user.id,
        nombre_usuario: nombreUsuario,
        biografia: bio,
      });

    if (error) {
      alert(`Error al guardar: ${error.message}`);
    } else {
      router.push('/perfil');
    }
    setGuardando(false);
  };

  if (cargando) return <div style={{ padding: '2rem' }}>Cargando datos...</div>;

  return (
    <div style={{ maxWidth: '500px', margin: '2rem auto', padding: '2rem', border: '1px solid black' }}>
      <h1>Editar Mi Perfil</h1>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '1rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <label>Nombre de Usuario (Único)</label>
          <input 
            type="text" 
            value={nombreUsuario}
            onChange={(e) => setNombreUsuario(e.target.value)}
            required
            style={{ padding: '0.5rem', border: '1px solid black' }}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <label>Biografía / Descripción</label>
          <textarea 
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            style={{ padding: '0.5rem', border: '1px solid black', minHeight: '100px' }}
            placeholder="Cuéntanos sobre tu afición..."
          />
        </div>

        <div style={{ display: 'flex', gap: '1rem' }}>
          <button 
            type="submit" 
            disabled={guardando}
            style={{ 
              flex: 1,
              background: 'black', 
              color: 'white', 
              padding: '1rem', 
              border: 'none', 
              cursor: guardando ? 'not-allowed' : 'pointer' 
            }}
          >
            {guardando ? 'Guardando...' : 'Guardar Cambios'}
          </button>
          <button 
            type="button"
            onClick={() => router.back()}
            style={{ padding: '1rem', border: '1px solid black', background: 'white', cursor: 'pointer' }}
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
