import { supabase } from '@/lib/supabase';
import { Profile } from '@/lib/types';
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';

export const AuthService = {
  // Obtener la sesión actual de forma segura
  async getSession() {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    return data.session;
  },

  // Obtener el perfil del usuario validando errores
  async getProfile(userId: string): Promise<Profile | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') throw error;
    return data as Profile | null;
  },

  // Login con Correo
  async signInWithEmail(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  },

  // Registro con Correo
  async signUpWithEmail(email: string, password: string) {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
    return data;
  },

  // Login Nativo con Google
  async signInWithGoogle() {
    GoogleAuth.initialize();
    const googleUser = await GoogleAuth.signIn();
    const idToken = googleUser.authentication.idToken;
    if (!idToken) throw new Error('No se recibió token de Google');

    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: 'google',
      token: idToken,
    });
    if (error) throw error;
    return data;
  },

  // Guardar perfil en la base de datos
  async createProfile(profile: Partial<Profile>) {
    const { error } = await supabase.from('profiles').upsert(profile);
    if (error) throw error;
  },

  // Limpieza controlada al salir (evitar localStorage.clear() destructivo)
  async signOut() {
    await supabase.auth.signOut();
    
    if (typeof window !== 'undefined') {
      // Solo borramos las claves propias de la aplicación y de Supabase,
      // preservando configuraciones de otras posibles herramientas o integraciones
      const keysToRemove: string[] = [];
      for (let i = 0; i < window.localStorage.length; i++) {
        const key = window.localStorage.key(i);
        if (key && (key.startsWith('apapacho_') || key.startsWith('sb-'))) {
          keysToRemove.push(key);
        }
      }
      
      keysToRemove.forEach(key => window.localStorage.removeItem(key));
    }
  }
};