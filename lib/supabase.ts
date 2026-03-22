import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Faltan las variables de entorno de Supabase');
}

// Definimos la versión actual de la app para el caché
const APP_VERSION = 'v2';

// Filtro de seguridad: Intercepta la memoria antes de que Supabase la lea.
const robustStorage = {
  getItem: (key: string) => {
    if (typeof window === 'undefined') return null;
    try {
      const item = window.localStorage.getItem(key);
      if (item) {
        JSON.parse(item); // Probamos si el JSON es válido
      }
      return item;
    } catch (error) {
      console.warn(`[Storage] Caché corrupta en la clave ${key}. Limpiando solo esta entrada...`);
      // ATENCIÓN: Solo borramos la clave corrupta, NO hacemos signOut destructivo
      window.localStorage.removeItem(key);
      return null; 
    }
  },
  setItem: (key: string, value: string) => {
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(key, value);
      } catch (err) {
        console.error('[Storage] Error guardando en caché', err);
      }
    }
  },
  removeItem: (key: string) => {
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.removeItem(key);
      } catch (err) {
        console.error('[Storage] Error eliminando caché', err);
      }
    }
  }
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: robustStorage,
    // MAGIA: Supabase ahora guardará la sesión bajo este nombre único.
    storageKey: `apapacho_${APP_VERSION}_session`, 
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false 
  }
});