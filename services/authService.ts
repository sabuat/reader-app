import { supabase, SupabaseHelper } from '@/lib/supabase';
import { Profile } from '@/lib/types';
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';
import { Capacitor } from '@capacitor/core';

// Estado global para evitar inicializaciones múltiples del plugin de Google
let isGoogleAuthInitialized = false;

const initGoogleAuth = () => {
  if (!isGoogleAuthInitialized && typeof window !== 'undefined') {
    try {
      GoogleAuth.initialize();
      isGoogleAuthInitialized = true;
    } catch (error) {
      console.warn('[AuthService] Advertencia al inicializar GoogleAuth:', error);
    }
  }
};

// Payload estricto para la creación de perfiles, evitando inserciones corruptas o vacías
export interface CreateProfilePayload {
  id: string;
  username: string;
  full_name: string;
  dob: string;
  country: string;
  avatar_url?: string;
}

// Payload flexible y tipado para actualizaciones parciales
export type UpdateProfilePayload = Partial<Omit<CreateProfilePayload, 'id'>>;

export const AuthService = {
  // ==========================================
  // GESTIÓN DE SESIÓN
  // ==========================================
  
  async getSession() {
    // Delega la recuperación segura y manejo de caché corrupta al Helper
    return await SupabaseHelper.getSafeSession();
  },

  async signOut() {
    // Ejecuta el cierre de sesión remoto (si la red lo permite) e impone 
    // una limpieza drástica de la caché local para evitar "ghost sessions".
    await SupabaseHelper.resetSession();
  },

  // Helper integral para facilitar el flujo de arranque (bootstrap) en la UI
  async getCurrentUserWithProfile() {
    const session = await this.getSession();
    if (!session?.user) return null;

    const profile = await this.getProfile(session.user.id);
    return {
      user: session.user,
      profile
    };
  },

  // ==========================================
  // AUTENTICACIÓN PURA
  // ==========================================

  async signInWithEmail(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  },

  async signUpWithEmail(email: string, password: string) {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
    return data;
  },

  async signInWithGoogle() {
    // 🌟 BIFURCACIÓN: Detecta si estamos en Android/iOS o en la Web
    if (Capacitor.isNativePlatform()) {
      // 📱 Flujo para la App Nativa
      initGoogleAuth();
      
      const googleUser = await GoogleAuth.signIn();
      const idToken = googleUser.authentication.idToken;
      
      if (!idToken) throw new Error('No se recibió token de autenticación de Google');

      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: idToken,
      });
      
      if (error) throw error;
      return data;
      
    } else {
      // 💻 Flujo para la Web App (app.editorialapapacho.com)
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          // Redirige al inicio de la web para que AuthPage procese la sesión
          redirectTo: window.location.origin, 
        }
      });
      
      if (error) throw error;
      return data;
    }
  },

  // ==========================================
  // GESTIÓN DE PERFIL (BASE DE DATOS)
  // ==========================================

  async getProfile(userId: string): Promise<Profile | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    // Permitimos explícitamente que no exista el perfil (PGRST116) sin lanzar error fatal
    if (error && error.code !== 'PGRST116') throw error;
    return data as Profile | null;
  },

  async createProfile(payload: CreateProfilePayload) {
    // Validación de seguridad antes de intentar la creación
    if (!payload.id || !payload.username || !payload.full_name) {
      throw new Error('Faltan campos obligatorios para crear el perfil.');
    }

    const { error } = await supabase.from('profiles').upsert(payload);
    if (error) throw error;
  },

  async updateProfile(userId: string, payload: UpdateProfilePayload) {
    // Validación de seguridad para actualizaciones parciales
    if (!userId) {
      throw new Error('Se requiere un ID de usuario válido para actualizar el perfil.');
    }
    
    if (Object.keys(payload).length === 0) return;

    const { error } = await supabase
      .from('profiles')
      .update(payload)
      .eq('id', userId);

    if (error) throw error;
  }
};