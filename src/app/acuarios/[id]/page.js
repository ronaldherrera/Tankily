'use client';

import { useEffect, useState, use } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function DetalleAcuarioPage({ params }) {
  const { id } = use(params);
  const [acuario, setAcuario] = useState(null);
  const [habitantes, setHabitantes] = useState([]);
  const [cargando, setCargando] = useState(true);

  // Formulario nuevo habitante
  const [nombreH, setNombreH] = useState('');
  const [cantidadH, setCantidadH] = useState(1);
  const [tipoH, setTipoH] = useState('Pez');

  useEffect(() => {
    async function cargarDatos() {
      // Cargar acuario
      const { data: acuarioData } = await supabase
        .from('acuarios')
        .select('*')
        .eq('id', id)
        .single();
      
      setAcuario(acuarioData);

      // Cargar habitantes
      const { data: habitantesData } = await supabase
        .from('habitantes')
        .select('*')
        .eq('acuario_id', id);
      
      setHabitantes(habitantesData || []);
      setCargando(false);
    }
    cargarDatos();
  }, [id]);

  const añadirHabitante = async (e) => {
    e.preventDefault();
    const { error } = await supabase
      .from('habitantes')
      .insert([
        { 
          nombre: nombreH, 
          cantidad: parseInt(cantidadH), 
          tipo: tipoH, 
          acuario_id: id 
        }
      ]);

    if (!error) {
      setNombreH('');
      setCantidadH(1);
      // Recargar lista
      const { data } = await supabase.from('habitantes').select('*').eq('acuario_id', id);
      setHabitantes(data);
    } else {
      alert(error.message);
    }
  };

  const borrarHabitante = async (hid) => {
    const { error } = await supabase.from('habitantes').delete().eq('id', hid);
    if (!error) {
      setHabitantes(habitantes.filter(h => h.id !== hid));
    }
  };

  if (cargando) return <div style={{ padding: '2rem' }}>Cargando acuario...</div>;
  if (!acuario) return <div style={{ padding: '2rem' }}>Acuario no encontrado.</div>;

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <Link href="/perfil" style={{ color: 'gray', textDecoration: 'none' }}>← Volver al Perfil</Link>
      
      <div style={{ marginTop: '1rem', borderBottom: '2px solid black', paddingBottom: '1rem' }}>
        <h1>{acuario.nombre}</h1>
        <p><strong>{acuario.litros} Litros</strong> | Tipo: {acuario.tipo_agua}</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem', marginTop: '2rem' }}>
        {/* Lista de habitantes */}
        <div>
          <h3>Habitantes Actuales</h3>
          {habitantes.length === 0 ? (
            <p style={{ fontStyle: 'italic' }}>Este acuario aún está vacío.</p>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {habitantes.map(h => (
                <li key={h.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem', borderBottom: '1px solid #eee' }}>
                  <span><strong>{h.cantidad}x</strong> {h.nombre} ({h.tipo})</span>
                  <button onClick={() => borrarHabitante(h.id)} style={{ background: 'none', border: 'none', color: 'red', cursor: 'pointer' }}>Eliminar</button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Formulario */}
        <div style={{ border: '1px solid black', padding: '1.5rem', background: '#f9f9f9' }}>
          <h3>Añadir Habitante</h3>
          <form onSubmit={añadirHabitante} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
            <input 
              placeholder="Nombre (ej: Guppy)" 
              value={nombreH}
              onChange={e => setNombreH(e.target.value)}
              required
              style={{ padding: '0.5rem', border: '1px solid black' }}
            />
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input 
                type="number" 
                value={cantidadH}
                onChange={e => setCantidadH(e.target.value)}
                min="1"
                required
                style={{ width: '60px', padding: '0.5rem', border: '1px solid black' }}
              />
              <select 
                value={tipoH}
                onChange={e => setTipoH(e.target.value)}
                style={{ flex: 1, padding: '0.5rem', border: '1px solid black' }}
              >
                <option value="Pez">Pez</option>
                <option value="Planta">Planta</option>
                <option value="Invertebrado">Invertebrado / Gamba</option>
                <option value="Otro">Otro</option>
              </select>
            </div>
            <button type="submit" style={{ background: 'black', color: 'white', padding: '0.7rem', border: 'none', cursor: 'pointer' }}>
              Añadir al Tanque
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
