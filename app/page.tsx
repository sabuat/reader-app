"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

import { AuthService } from '@/services/authService';
import { getPrefs, updatePrefs } from '@/lib/preferences';
import { useLanguage } from '@/hooks/useLanguage';

//  IMPORTAMOS LOS COMPONENTES DE FORMULARIO MODULARIZADOS
import { LoginForm, RegisterForm, CompleteProfileForm } from '@/components/auth/AuthForms';

export default function AuthPage() {
  const router = useRouter();
  const { t } = useLanguage();
  
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [view, setView] = useState<'login' | 'register' | 'complete_profile'>('login');
  
  const [authUserId, setAuthUserId] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [fullNameInitial, setFullNameInitial] = useState('');

  // 1. PROCESAMIENTO CENTRALIZADO DE SESIÓN
  const processUserSession = async (user: any) => {
    try {
      const profile = await AuthService.getProfile(user.id);

      if (profile) {
        const prefs = getPrefs(); 
        router.push(prefs.lastRoute || '/home');
        // No apagamos el loader aquí para evitar destellos visuales antes de enrutar
      } else {
        setAuthUserId(user.id);
        setRegEmail(user.email || '');
        setFullNameInitial(user.user_metadata?.full_name || '');
        setView('complete_profile');
        setIsCheckingSession(false);
      }
    } catch (error) {
      console.error("Error al verificar perfil o caché corrupta:", error);
      await AuthService.signOut(); 
      setIsCheckingSession(false);
    }
  };

  // 2. BOOTSTRAP LINEAL Y SEGURO
  useEffect(() => {
    let isMounted = true;

    const bootstrap = async () => {
      try {
        const session = await AuthService.getSession();
        
        if (session?.user && isMounted) {
          await processUserSession(session.user);
        } else if (isMounted) {
          setIsCheckingSession(false);
        }
      } catch (error) {
        console.error("Error inicializando sesión:", error);
        await AuthService.signOut();
        if (isMounted) setIsCheckingSession(false);
      }
    };

    bootstrap();

    return () => { isMounted = false; };
  }, []);

  // 3. CALLBACKS DE ÉXITO DESDE LOS FORMULARIOS MODULARES
  const handleSessionSuccess = async (user: any) => {
    setIsCheckingSession(true); // Levanta el loader global mientras procesa el perfil
    await processUserSession(user);
  };

  const handleProfileCreated = () => {
    updatePrefs({ 
      nightMode: false, 
      fontSize: 'text-base',
      lastRoute: '/home'
    });
    router.push('/home');
  };

  if (isCheckingSession) {
    return (
      <div className="min-h-[100dvh] bg-[#F9F9F7] dark:bg-[#121212] flex flex-col items-center justify-center p-6 transition-colors duration-500">
        <motion.img 
          initial={{ opacity: 0.5, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} 
          transition={{ repeat: Infinity, duration: 1, repeatType: "reverse" }}
          src="/logo-nuevo.png" alt={t('common.loading')} className="w-48 object-contain drop-shadow-sm" 
        />
      </div>
    );
  }

  return (
    <div 
      className="min-h-[100dvh] bg-[#F9F9F7] dark:bg-[#121212] flex flex-col items-center overflow-y-auto px-6 transition-colors duration-500"
      style={{ paddingTop: 'calc(2rem + env(safe-area-inset-top))', paddingBottom: 'calc(2rem + env(safe-area-inset-bottom))' }}
    >
      <motion.img 
        initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        src="/logo-nuevo.png" alt="Apapacho Logo" className="w-48 object-contain mb-8 drop-shadow-sm shrink-0" 
      />

      <div className="w-full max-w-md bg-white dark:bg-[#1A1A1A] p-8 rounded-[2rem] shadow-xl border border-brand-gold/10 dark:border-brand-gold/20 mb-4 transition-colors duration-500">
        
        {/* TABS DE LOGIN/REGISTRO */}
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

        {/* HEADER COMPLETAR PERFIL */}
        {view === 'complete_profile' && (
          <div className="text-center mb-6">
            <h2 className="text-2xl font-serif italic text-brand-dark dark:text-gray-200 mb-2 transition-colors">{t('auth.almost_done')}</h2>
            <p className="text-[11px] font-bold uppercase tracking-widest text-brand-gold">{t('auth.need_more_data')}</p>
          </div>
        )}

        {/* RENDERIZADO MODULAR DE FORMULARIOS */}
        {view === 'login' && (
          <LoginForm t={t} onSessionSuccess={handleSessionSuccess} />
        )}
        
        {view === 'register' && (
          <RegisterForm t={t} onSessionSuccess={handleSessionSuccess} onProfileCreated={handleProfileCreated} />
        )}

        {view === 'complete_profile' && (
          <CompleteProfileForm 
            t={t} 
            authUserId={authUserId} 
            regEmail={regEmail} 
            fullNameInitial={fullNameInitial} 
            onProfileCreated={handleProfileCreated} 
          />
        )}

      </div>
    </div>
  );
}