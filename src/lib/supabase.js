import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Faltan las variables de entorno de Supabase. Verifica tu archivo .env.local.')
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '')

// Mock functions for development until DB is ready
export const mockApi = {
  getProfile: async (id) => {
    console.log("Obteniendo perfil para:", id);
    return { username: "AcuaristaPro", karma: 120, bio: "Apasionado de los acuarios plantados y los discos." };
  },
  getAquariums: async (userId) => {
    return [{ id: 1, name: "Tanque Gran Barerra", volume: 300, type: "Dulce", ph: 6.5, temp: 26 }];
  }
};
