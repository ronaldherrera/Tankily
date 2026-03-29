"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function Header() {
  const [session, setSession] = useState(null);
  const router = useRouter();

  useEffect(() => {
    // Obtener sesión actual
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    // Escuchar cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const cerrarSesion = async () => {
    await supabase.auth.signOut();
    router.push('/acceder');
  };

  return (
    <header style={{ 
      width: '260px', 
      height: '100vh', 
      position: 'sticky', 
      top: 0, 
      display: 'flex', 
      flexDirection: 'column', 
      padding: '2rem 1.5rem',
      background: 'white',
      borderRight: '1px solid #eee',
      zIndex: 1000
    }}>
      <Link href="/" style={{ textDecoration: 'none', color: 'black', marginBottom: '3rem' }}>
        <h1 style={{ margin: 0, fontSize: '1.8rem', letterSpacing: '-1px' }}>TANKILY</h1>
      </Link>
      
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
        <Link href="/" style={linkStyle}>🏠 Muro</Link>
        <Link href="/acuarios" style={linkStyle}>🐠 Acuarios</Link>
        <Link href="/wiki" style={linkStyle}>📖 Wiki</Link>
        <Link href="/perfil" style={linkStyle}>👤 Perfil</Link>
      </nav>

      <div style={{ marginTop: 'auto', paddingTop: '2rem', borderTop: '1px solid #f5f5f5' }}>
        {session ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'gray' }}>Sesión activa como <br/><strong>{session.user.email.split('@')[0]}</strong></span>
            <button 
              onClick={cerrarSesion} 
              style={{ 
                background: '#fff', border: '1px solid #ff4444', color: '#ff4444', 
                padding: '0.5rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' 
              }}
            >
              Cerrar Sesión
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
            <Link href="/acceder" style={linkStyle}>Entrar</Link>
            <Link href="/registro" style={{ 
              ...linkStyle, background: 'black', color: 'white', textAlign: 'center', borderRadius: '8px' 
            }}>Unirse</Link>
          </div>
        )}
      </div>
    </header>
  );
}

const linkStyle = {
  textDecoration: 'none',
  color: 'black',
  padding: '0.8rem 1rem',
  borderRadius: '8px',
  fontSize: '1rem',
  fontWeight: '500',
  transition: 'all 0.2s',
  display: 'block'
};
