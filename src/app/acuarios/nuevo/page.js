'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function NuevoAcuarioPage() {
  const [nombre, setNombre] = useState('');
  const [litros, setLitros] = useState('');
  const [tipoAgua, setTipoAgua] = useState('Dulce');
  const [cargando, setCargando] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setCargando(true);

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      alert("Debes estar conectado");
      return;
    }

    const { error } = await supabase
      .from('acuarios')
      .insert([
        { 
          nombre, 
          litros: parseInt(litros), 
          tipo_agua: tipoAgua,
          usuario_id: user.id 
        }
      ]);

    if (error) {
      alert(`Error: ${error.message}`);
    } else {
      router.push('/perfil');
    }
    setCargando(false);
  };

  return (
    <div style={{ maxWidth: '500px', margin: '2rem auto', padding: '2rem', border: '1px solid black' }}>
      <h1>Añadir Nuevo Acuario</h1>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '1rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <label>Nombre del Tanque</label>
          <input 
            type="text" 
            placeholder="Ej: Mi Reef de 200L"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            required
            style={{ padding: '0.5rem', border: '1px solid black' }}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <label>Capacidad (Litros)</label>
          <input 
            type="number" 
            value={litros}
            onChange={(e) => setLitros(e.target.value)}
            required
            style={{ padding: '0.5rem', border: '1px solid black' }}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <label>Tipo de Agua</label>
          <select 
            value={tipoAgua}
            onChange={(e) => setTipoAgua(e.target.value)}
            style={{ padding: '0.5rem', border: '1px solid black' }}
          >
            <option value="Dulce">Dulce</option>
            <option value="Salada">Salada (Reef/Marino)</option>
            <option value="Salobre">Salobre</option>
          </select>
        </div>

        <button 
          type="submit" 
          disabled={cargando}
          style={{ 
            background: 'black', 
            color: 'white', 
            padding: '1rem', 
            border: 'none', 
            cursor: cargando ? 'not-allowed' : 'pointer' 
          }}
        >
          {cargando ? 'Guardando...' : 'Crear Acuario'}
        </button>
      </form>
    </div>
  );
}
