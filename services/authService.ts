import { supabase, SupabaseHelper } from '@/lib/supabase';
import { Profile } from '@/lib/types';
import { Capacitor } from '@capacitor/core';

export interface CreateProfilePayload {
  id: string;
  username: string;
  full_name: string;
  dob: string;
  country: string;
  avatar_url?: string;
}

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
  // AUTENTICACIÓN UNIVERSAL (WEB Y ANDROID)
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
    // Definimos a dónde debe regresar Supabase después del login en Google
    const redirectTo = typeof window !== 'undefined' && Capacitor.isNativePlatform()
      ? 'apapacho://home' // Deep Link para Android
      : typeof window !== 'undefined' 
        ? `${window.location.origin}/home` // URL normal para Web
        : '';

    // Utilizamos el flujo OAuth estándar de Supabase para AMBAS plataformas
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
        skipBrowserRedirect: false,
      }
    });

    if (error) throw error;
    return data;
  },

  // ==========================================
  // GESTIÓN DE PERFIL
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