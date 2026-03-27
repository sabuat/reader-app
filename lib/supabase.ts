import { createClient } from '@supabase/supabase-js';
import { StorageService } from './storage';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Faltan las variables de entorno NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY.');
}

export const SUPABASE_SESSION_KEY = 'apapacho_v2_session';

// Adaptador de storage personalizado para integrarse con el entorno seguro
// Evita crasheos de la aplicación si el JSON de la sesión nativa se corrompe
const customAuthStorage = {
  getItem: (key: string): string | null => {
    if (typeof window === 'undefined') return null;
    try {
      // Usamos el acceso nativo aquí para la validación de Supabase, 
      // asegurando que sea un JSON parseable antes de devolverlo.
      const item = window.localStorage.getItem(key);
      if (!item) return null;
      JSON.parse(item);
      return item;
    } catch (error) {
      console.warn(`[Supabase Storage] Cache corrupta detectada en "${key}". Purgando...`);
      window.localStorage.removeItem(key);
      return null;
    }
  },
  setItem: (key: string, value: string): void => {
    StorageService.setRaw(key, value);
  },
  removeItem: (key: string): void => {
    StorageService.remove(key);
  }
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: customAuthStorage,
    storageKey: SUPABASE_SESSION_KEY,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

export const SupabaseHelper = {
  // Recupera la sesión de forma segura, interceptando errores fatales de caché
  async getSafeSession() {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) throw error;
      return session;
    } catch (error) {
      console.error('[SupabaseHelper] Error crítico de sesión. Forzando limpieza...', error);
      await this.resetSession();
      return null;
    }
  },

  // Logout estricto: destruye la sesión remotamente y purga los residuos locales
  async resetSession() {
    try {
      await supabase.auth.signOut({ scope: 'local' });
    } catch (error) {
      console.warn('[SupabaseHelper] Advertencia durante el signOut de Supabase.', error);
    } finally {
      // Borramos explícitamente la llave de la sesión actual
      StorageService.remove(SUPABASE_SESSION_KEY);
      
      // Limpiamos como fallback el namespace legacy de Supabase por si quedaron residuos
      StorageService.clearNamespace('sb-');
    }
  }
};