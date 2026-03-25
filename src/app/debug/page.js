'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function DebugPage() {
  const [status, setStatus] = useState('Comprobando...');
  const [envVars, setEnvVars] = useState({
    url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    key: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  });

  useEffect(() => {
    async function checkConnection() {
      try {
        // Intentamos una consulta simple que no requiere permisos (si es posible)
        // O simplemente verificamos que el auth no da error catastrófico
        const { data, error } = await supabase.from('_test').select('*').limit(1);
        
        if (error) {
          // Si el error es "relation does not exist", significa que conectó pero la tabla no existe
          if (error.code === 'PGRST116' || error.message.includes('not found')) {
            setStatus('¡Conectado! (La tabla de prueba no existe, pero la comunicación con Supabase funciona)');
          } else {
            setStatus(`Error de conexión: ${error.message}`);
          }
        } else {
          setStatus('¡Conectado con éxito!');
        }
      } catch (err) {
        setStatus(`Error inesperado: ${err.message}`);
      }
    }

    checkConnection();
  }, []);

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>Debug de Supabase</h1>
      <div style={{ 
        padding: '1rem', 
        borderRadius: '8px', 
        background: status.includes('¡Conectado!') ? '#d4edda' : '#f8d7da',
        color: status.includes('¡Conectado!') ? '#155724' : '#721c24',
        marginBottom: '1rem'
      }}>
        <strong>Estado:</strong> {status}
      </div>
      
      <div>
        <h3>Variables de Entorno:</h3>
        <ul>
          <li>URL configurada: {envVars.url ? '✅' : '❌'}</li>
          <li>Anon Key configurada: {envVars.key ? '✅' : '❌'}</li>
        </ul>
      </div>
      
      <p>
        <a href="/" style={{ color: '#0070f3' }}>Volver al Inicio</a>
      </p>
    </div>
  );
}
