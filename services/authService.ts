import { supabase, SupabaseHelper } from '@/lib/supabase';
import { Profile } from '@/lib/types';
import { Capacitor } from '@capacitor/core';

// Estado global para evitar inicializaciones múltiples del plugin de Google
let isGoogleAuthInitialized = false;

const initGoogleAuth = async () => {
  // 🌟 Importación dinámica: Solo se ejecuta si estamos en el cliente Y en la app nativa
  if (!isGoogleAuthInitialized && typeof window !== 'undefined' && Capacitor.isNativePlatform()) {
    try {
      const { GoogleAuth } = await import('@codetrix-studio/capacitor-google-auth');
      GoogleAuth.initialize();
      isGoogleAuthInitialized = true;
    } catch (error) {
      console.warn('[AuthService] Advertencia al inicializar GoogleAuth:', error);
    }
  }
};

// Payload estricto para la creación de perfiles
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
    return await SupabaseHelper.getSafeSession();
  },

  async signOut() {
    await SupabaseHelper.resetSession();
  },

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
    // 🌟 Bifurcación limpia y protegida contra Server-Side Rendering (SSR)
    if (typeof window !== 'undefined' && Capacitor.isNativePlatform()) {
      
      // 📱 Flujo App Nativa (Android/iOS)
      await initGoogleAuth();
      const { GoogleAuth } = await import('@codetrix-studio/capacitor-google-auth');
      
      const googleUser = await GoogleAuth.signIn();
      const idToken = googleUser.authentication.idToken;
      
      if (!idToken) throw new Error('No se recibió token de autenticación de Google');

      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: idToken,
      });
      
      if (error) throw error;
      
      // Devolvemos el usuario directamente para que la UI lo consuma sin hacer adivinanzas
      return data.user;
      
    } else {
      
      // 💻 Flujo Web App (Navegador)
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: typeof window !== 'undefined' ? window.location.origin : '', 
        }
      });
      
      if (error) throw error;
      
      // En la web, la página se recargará hacia Google. Devolvemos null.
      return null;
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

    if (error && error.code !== 'PGRST116') throw error;
    return data as Profile | null;
  },

  async createProfile(payload: CreateProfilePayload) {
    if (!payload.id || !payload.username || !payload.full_name) {
      throw new Error('Faltan campos obligatorios para crear el perfil.');
    }

    const { error } = await supabase.from('profiles').upsert(payload);
    if (error) throw error;
  },

  async updateProfile(userId: string, payload: UpdateProfilePayload) {
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