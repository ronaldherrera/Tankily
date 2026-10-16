'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function RegistroPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [cargando, setCargando] = useState(false);

  const handleRegistro = async (e) => {
    e.preventDefault();
    setCargando(true);
    setMensaje('');

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setMensaje(`Error: ${error.message}`);
    } else {
      setMensaje('¡Registro exitoso! Revisa tu email para confirmar la cuenta.');
    }
    setCargando(false);
  };

  return (
    <div style={{ maxWidth: '400px', margin: '4rem auto', padding: '2rem', border: '1px solid black' }}>
      <h1>Crear Cuenta</h1>
      <p>Únete a la comunidad de Tankily.</p>

      <form onSubmit={handleRegistro} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <label htmlFor="email">Email</label>
          <input 
            id="email"
            name="email"
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
            name="password"
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
          {cargando ? 'Registrando...' : 'Registrarse'}
        </button>
      </form>

      {mensaje && (
        <div style={{ marginTop: '1rem', padding: '1rem', border: '1px solid black', background: mensaje.includes('Error') ? '#fee' : '#efe' }}>
          {mensaje}
        </div>
      )}

      <p style={{ marginTop: '2rem' }}>
        ¿Ya tienes cuenta? <Link href="/acceder" style={{ fontWeight: 'bold' }}>Inicia sesión aquí</Link>
      </p>
    </div>
  );
}
