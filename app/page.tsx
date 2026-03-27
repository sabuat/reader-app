"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

import { AuthService } from '@/services/authService';
import { PreferencesService } from '@/lib/preferences';
import { useLanguage } from '@/hooks/useLanguage';

import { LoginForm, RegisterForm, CompleteProfileForm } from '@/components/auth/AuthForms';

export default function AuthPage() {
  const router = useRouter();
  const { t, isReady } = useLanguage();
  
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [view, setView] = useState<'login' | 'register' | 'complete_profile'>('login');
  
  const [authUserId, setAuthUserId] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [fullNameInitial, setFullNameInitial] = useState('');

  const processAuthState = useCallback(async () => {
    try {
      const result = await AuthService.getCurrentUserWithProfile();
      
      // 1. Sin user -> Stop (Mostrar Login)
      if (!result || !result.user) {
        setIsCheckingSession(false);
        return;
      }

      const { user, profile } = result;

      // 2. User + Profile -> Redirect
      if (profile) {
        const lastRoute = PreferencesService.getLastRoute() || '/home';
        router.push(lastRoute);
        return;
      }

      // 3. User sin profile -> Onboarding (Completar Perfil)
      setAuthUserId(user.id);
      setRegEmail(user.email || '');
      setFullNameInitial(user.user_metadata?.full_name || '');
      setView('complete_profile');
      setIsCheckingSession(false);

    } catch (error) {
      console.error("[AuthPage] Error crítico verificando sesión:", error);
      // Fallback seguro en caso de caché corrupta o token inválido
      await AuthService.signOut();
      setIsCheckingSession(false);
    }
  }, [router]);

  useEffect(() => {
    // Eliminado el patrón isMounted (obsoleto en React 18+)
    if (isReady) {
      processAuthState();
    }
  }, [isReady, processAuthState]);

  const handleSessionSuccess = async () => {
    setIsCheckingSession(true);
    await processAuthState();
  };

  const handleProfileCreated = () => {
    PreferencesService.updatePrefs({ nightMode: null, fontSize: 'text-base' });
    PreferencesService.setLastRoute('/home');
    router.push('/home');
  };

  // Pantalla de carga mientras resuelve i18n o verifica sesión
  if (!isReady || isCheckingSession) {
    return (
      <div className="min-h-[100dvh] bg-[#F9F9F7] dark:bg-[#121212] flex flex-col items-center justify-center p-6 transition-colors duration-500">
        <motion.div 
          animate={{ rotate: 360 }} 
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="w-8 h-8 border-4 border-brand-gold border-t-transparent rounded-full" 
        />
      </div>
    );
  }

  return (
    <div 
      className="min-h-[100dvh] bg-[#F9F9F7] dark:bg-[#121212] flex flex-col items-center overflow-y-auto px-6 transition-colors duration-500"
      style={{ paddingTop: 'calc(2rem + env(safe-area-inset-top))', paddingBottom: 'calc(2rem + env(safe-area-inset-bottom))' }}
    >
      <img src="/logo-nuevo.png" alt="Apapacho Logo" className="w-48 object-contain mb-8 drop-shadow-sm shrink-0" />

      <div className="w-full max-w-md bg-white dark:bg-[#1A1A1A] p-8 rounded-[2rem] shadow-xl border border-brand-gold/10 dark:border-brand-gold/20 mb-4 transition-colors duration-500">
        
        {view !== 'complete_profile' && (
          <div className="flex bg-gray-100 dark:bg-black/40 rounded-full p-1 mb-8 transition-colors">
            <button 
              type="button" onClick={() => setView('login')}
              className={`flex-1 py-2 rounded-full text-[11px] font-bold uppercase tracking-widest transition-all ${view === 'login' ? 'bg-white dark:bg-[#2A2A2A] text-brand-dark dark:text-brand-gold shadow-sm' : 'text-gray-400 dark:text-gray-500'}`}
            >
              {t('auth.login_tab')}
            </button>
            <button 
              type="button" onClick={() => setView('register')}
              className={`flex-1 py-2 rounded-full text-[11px] font-bold uppercase tracking-widest transition-all ${view === 'register' ? 'bg-white dark:bg-[#2A2A2A] text-brand-dark dark:text-brand-gold shadow-sm' : 'text-gray-400 dark:text-gray-500'}`}
            >
              {t('auth.register_tab')}
            </button>
          </div>
        )}

        {view === 'complete_profile' && (
          <div className="text-center mb-6">
            <h2 className="text-2xl font-serif italic text-brand-dark dark:text-gray-200 mb-2 transition-colors">{t('auth.almost_done')}</h2>
            <p className="text-[11px] font-bold uppercase tracking-widest text-brand-gold">{t('auth.need_more_data')}</p>
          </div>
        )}

        {view === 'login' && <LoginForm t={t} onSessionSuccess={handleSessionSuccess} />}
        {view === 'register' && <RegisterForm t={t} onSessionSuccess={handleSessionSuccess} onProfileCreated={handleProfileCreated} />}
        {view === 'complete_profile' && <CompleteProfileForm t={t} authUserId={authUserId} regEmail={regEmail} fullNameInitial={fullNameInitial} onProfileCreated={handleProfileCreated} />}
      </div>
    </div>
  );
}