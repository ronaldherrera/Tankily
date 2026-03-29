"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function TopBar() {
  const [showModal, setShowModal] = useState(false);
  const [acuarios, setAcuarios] = useState([]);
  const [loading, setLoading] = useState(false);

  // Formulario medición
  const [acuarioId, setAcuarioId] = useState('');
  const [parametro, setParametro] = useState('pH');
  const [valor, setValor] = useState('');

  useEffect(() => {
    if (showModal) {
      cargarAcuarios();
    }
  }, [showModal]);

  async function cargarAcuarios() {
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    if (user) {
      const { data } = await supabase.from('acuarios').select('id, nombre').eq('usuario_id', user.id);
      setAcuarios(data || []);
      if (data?.length > 0) setAcuarioId(data[0].id.toString());
    }
  }

  async function guardarMedicion(e) {
    e.preventDefault();
    if (!acuarioId || !valor) return;
    setLoading(true);
    const { error } = await supabase.from('mediciones').insert([{ 
      acuario_id: Number(acuarioId), 
      parametro, 
      valor 
    }]);
    setLoading(false);
    if (!error) {
      setShowModal(false);
      setValor('');
      alert("✅ Medición registrada con éxito");
    }
  }

  return (
    <div style={{ 
      height: '70px', 
      borderBottom: '1px solid #eee', 
      display: 'flex', 
      alignItems: 'center', 
      padding: '0 2rem',
      justifyContent: 'space-between',
      background: 'rgba(255, 255, 255, 0.8)',
      backdropFilter: 'blur(10px)',
      position: 'sticky',
      top: 0,
      zIndex: 900
    }}>
      <div style={{ flex: 1, maxWidth: '500px', position: 'relative' }}>
        <input 
          placeholder="🔍 Buscar tanques, especies o acuaristas..."
          style={{ 
            width: '100%', 
            padding: '0.6rem 1rem 0.6rem 2.5rem', 
            borderRadius: '20px', 
            border: '1px solid #eee',
            background: '#f8f8f8',
            marginBottom: 0
          }}
        />
      </div>

      <div style={{ display: 'flex', gap: '1rem' }}>
        <button 
          onClick={() => setShowModal(true)}
          style={{ 
            background: 'black', color: 'white', padding: '0.6rem 1.2rem', 
            borderRadius: '20px', fontWeight: 'bold', fontSize: '0.85rem'
          }}
        >
          + Medición Rápida
        </button>
      </div>

      {/* MODAL DE MEDICIÓN */}
      {showModal && (
        <div style={{ 
          position: 'fixed', 
          top: 0, 
          left: 0, 
          width: '100vw', 
          height: '100vh', 
          background: 'rgba(0,0,0,0.6)', 
          zIndex: 9999, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center'
        }}>
          <div style={{ background: 'white', padding: '2.5rem', borderRadius: '16px', width: '100%', maxWidth: '450px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            <h2 style={{ fontSize: '1.6rem', marginBottom: '1.5rem', fontWeight: '800' }}>Añadir Medición</h2>
            <form onSubmit={guardarMedicion} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '0.4rem', color: '#555' }}>
                  Selecciona tu Acuario
                </label>
                {acuarios.length > 0 ? (
                  <select 
                    value={acuarioId} 
                    onChange={e => setAcuarioId(e.target.value)}
                    style={{ width: '100%', padding: '0.7rem', borderRadius: '8px', border: '1px solid #ddd', background: 'white', color: 'black' }}
                  >
                    {acuarios.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
                  </select>
                ) : (
                  <div style={{ color: '#856404', background: '#fff3cd', padding: '0.7rem', borderRadius: '8px', fontSize: '0.8rem', border: '1px solid #ffeeba' }}>
                    ⚠️ No tienes acuarios creados aún.
                  </div>
                )}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '0.4rem', color: '#555' }}>
                  Parámetro a medir
                </label>
                <select 
                  value={parametro} 
                  onChange={e => setParametro(e.target.value)}
                  style={{ width: '100%', padding: '0.7rem', borderRadius: '8px', border: '1px solid #ddd', background: 'white', color: 'black' }}
                >
                  <option value="pH">pH</option>
                  <option value="Temperatura">Temperatura</option>
                  <option value="NO3">Nitratos (NO3)</option>
                  <option value="KH">KH</option>
                  <option value="Salinidad">Salinidad</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '0.4rem', color: '#555' }}>
                  Valor actual
                </label>
                <input 
                  placeholder="Ej: 8.2" 
                  value={valor} 
                  onChange={e => setValor(e.target.value)}
                  style={{ width: '100%', padding: '0.7rem', borderRadius: '8px', border: '1px solid #ddd', color: 'black' }}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '0.8rem', marginTop: '1rem' }}>
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)}
                  style={{ flex: 1, background: '#eee', color: 'black', border: 'none', padding: '0.75rem', borderRadius: '8px' }}
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  disabled={loading}
                  style={{ flex: 1, background: 'black', color: 'white', border: 'none', padding: '0.75rem', borderRadius: '8px', fontWeight: 'bold' }}
                >
                  {loading ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
