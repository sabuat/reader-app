import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Faltan las variables de entorno de Supabase');
}

// Filtro de seguridad extremo: Intercepta la memoria antes de que Supabase la lea.
// Si la memoria tiene basura (ej. JSON incompleto), la destruye antes de que la app se congele.
const robustStorage = {
  getItem: (key: string) => {
    if (typeof window === 'undefined') return null;
    try {
      const item = window.localStorage.getItem(key);
      if (item) {
        // Intentamos descifrarlo. Si está corrupto, esto fallará y saltará directamente al catch.
        JSON.parse(item);
      }
      return item;
    } catch (error) {
      console.warn('¡Caché corrupta detectada! Limpiando sector...', key);
      window.localStorage.removeItem(key);
      return null; // Devuelve null para forzar un inicio limpio en lugar de congelarse
    }
  },
  setItem: (key: string, value: string) => {
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(key, value);
      } catch (err) {
        console.error('Error guardando en caché', err);
      }
    }
  },
  removeItem: (key: string) => {
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.removeItem(key);
      } catch (err) {
        console.error('Error eliminando caché', err);
      }
    }
  }
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: robustStorage,
    autoRefreshToken: true,
    persistSession: true,
    // FUNDAMENTAL: Evita que Supabase intente leer parámetros extraños en la URL móvil y se bloquee
    detectSessionInUrl: false 
  }
});