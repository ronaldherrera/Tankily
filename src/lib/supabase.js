import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Faltan las variables de entorno de Supabase. Verifica tu archivo .env.local.')
}

export const supabase = createClient(supabaseUrl || 'http://localhost', supabaseAnonKey || 'sin-clave')

// Campos de autor que se incrustan en casi todas las consultas
export const AUTOR = 'autor:perfiles!usuario_id(id, usuario, nombre, avatar_url)'
