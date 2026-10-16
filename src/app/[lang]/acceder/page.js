'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function AccederPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [cargando, setCargando] = useState(false);

  const handleAcceso = async (e) => {
    e.preventDefault();
    setCargando(true);
    setMensaje('');

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setMensaje(`Error: ${error.message}`);
    } else {
      setMensaje('¡Bienvenido de nuevo!');
      window.location.href = '/'; // Redirección simple
    }
    setCargando(false);
  };

  return (
    <div style={{ maxWidth: '400px', margin: '4rem auto', padding: '2rem', border: '1px solid black' }}>
      <h1>Inicia Sesión</h1>
      <p>Accede a tu cuenta de Tankily.</p>

      <form onSubmit={handleAcceso} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <label htmlFor="email">Email</label>
          <input 
            id="email"
            type="email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            required 
            style={{ padding: '0.5rem', border: '1px solid black' }}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <label htmlFor="password">Contraseña</label>
          <input 
            id="password"
            type="password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required 
            style={{ padding: '0.5rem', border: '1px solid black' }}
          />
        </div>

        <button 
          type="submit" 
          disabled={cargando}
          style={{ 
            padding: '1rem', 
            background: 'black', 
            color: 'white', 
            border: 'none', 
            cursor: cargando ? 'not-allowed' : 'pointer' 
          }}
        >
          {cargando ? 'Accediendo...' : 'Entrar'}
        </button>
      </form>

      {mensaje && (
        <div style={{ marginTop: '1rem', padding: '1rem', border: '1px solid black', background: mensaje.includes('Error') ? '#fee' : '#efe' }}>
          {mensaje}
        </div>
      )}

      <p style={{ marginTop: '2rem' }}>
        ¿No tienes cuenta? <Link href="/registro" style={{ fontWeight: 'bold' }}>Regístrate aquí</Link>
      </p>
    </div>
  );
}
