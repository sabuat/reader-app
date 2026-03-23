"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { Mail, Lock, User, Check, X } from 'lucide-react';

import { AuthService } from '@/services/authService';
import { getPrefs, updatePrefs } from '@/lib/preferences';
import { useLanguage } from '@/hooks/useLanguage';

const AVATARS = [
  '/avatar/avatar-1.png', '/avatar/avatar-2.png', '/avatar/avatar-3.png',
  '/avatar/avatar-4.png', '/avatar/avatar-5.png', '/avatar/avatar-6.png',
];

export default function AuthPage() {
  const router = useRouter();
  const { t } = useLanguage();
  
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [view, setView] = useState<'login' | 'register' | 'complete_profile'>('login');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  const [authUserId, setAuthUserId] = useState('');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const [selectedAvatar, setSelectedAvatar] = useState('');
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [dob, setDob] = useState('');
  const [country, setCountry] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [missingFields, setMissingFields] = useState<string[]>([]);
  const [showValidationModal, setShowValidationModal] = useState(false);

  // 🌟 FIX: Única función centralizada para procesar al usuario autenticado
  const processUserSession = async (user: any) => {
    try {
      const profile = await AuthService.getProfile(user.id);

      if (profile) {
        const prefs = getPrefs(); 
        router.push(prefs.lastRoute || '/home');
        // No apagamos el loader aquí para evitar el destello visual antes de que Next.js enrute
      } else {
        setAuthUserId(user.id);
        setRegEmail(user.email || '');
        setFullName(user.user_metadata?.full_name || '');
        setView('complete_profile');
        setIsCheckingSession(false);
        setLoading(false);
      }
    } catch (error) {
      console.error("Error al verificar perfil o caché corrupta:", error);
      await AuthService.signOut(); 
      setIsCheckingSession(false);
      setLoading(false);
    }
  };

  // 🌟 FIX: Bootstrap lineal sin listeners duplicados
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
  }, []); // Dependencias limpias, sin triggers externos

  const isOldEnough = (birthDateString: string) => {
    const today = new Date();
    const birthDate = new Date(birthDateString);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
    return age >= 14;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setErrorMsg('');
    try {
      const data = await AuthService.signInWithEmail(loginEmail, loginPassword);
      if (data.user) {
        await processUserSession(data.user);
      }
    } catch (error) {
      setErrorMsg(t('auth.invalid_credentials'));
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setErrorMsg('');

    const missing: string[] = [];
    if (!selectedAvatar) missing.push(t('auth.avatar'));
    if (!username) missing.push(t('auth.username'));
    if (!fullName) missing.push(t('auth.full_name'));
    if (!dob) missing.push(t('auth.dob'));
    if (!country) missing.push(t('auth.country'));
    if (!regEmail) missing.push(t('auth.email'));
    if (!regPassword) missing.push(t('auth.password'));
    if (!confirmPassword) missing.push(t('auth.confirm_password'));

    if (missing.length > 0) {
      setMissingFields(missing);
      setShowValidationModal(true);
      setLoading(false); 
      return;
    }

    if (regPassword !== confirmPassword) {
      setErrorMsg(t('auth.passwords_not_match'));
      setLoading(false); return;
    }
    if (!isOldEnough(dob)) {
      setErrorMsg(t('auth.age_requirement'));
      setLoading(false); return;
    }

    try {
      const authData = await AuthService.signUpWithEmail(regEmail, regPassword);
      if (authData.user) {
        await saveProfileData(authData.user.id);
      }
    } catch (error: any) {
      setErrorMsg(error.message);
      setLoading(false);
    }
  };

  const handleCompleteProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setErrorMsg('');

    const missing: string[] = [];
    if (!selectedAvatar) missing.push(t('auth.avatar'));
    if (!username) missing.push(t('auth.username_unique'));
    if (!dob) missing.push(t('auth.dob'));
    if (!country) missing.push(t('auth.country'));

    if (missing.length > 0) {
      setMissingFields(missing);
      setShowValidationModal(true);
      setLoading(false); return;
    }

    if (!isOldEnough(dob)) {
      setErrorMsg(t('auth.age_requirement'));
      setLoading(false); return;
    }

    await saveProfileData(authUserId);
  };

  const saveProfileData = async (userId: string) => {
    try {
      await AuthService.createProfile({
        id: userId,
        username,
        full_name: fullName,
        dob,
        country,
        avatar_url: selectedAvatar,
      });

      updatePrefs({ 
        nightMode: false, 
        fontSize: 'text-base',
        lastRoute: '/home'
      });

      router.push('/home');
    } catch (error) {
      console.error(error);
      setErrorMsg(t('auth.profile_error'));
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true); setErrorMsg('');
    try {
      const data = await AuthService.signInWithGoogle();
      if (data.user) {
        await processUserSession(data.user);
      }
    } catch (error) {
      console.error("Error nativo:", error);
      setErrorMsg(t('auth.google_error'));
      setLoading(false);
    }
  };

  if (isCheckingSession) {
    return (
      <div className="min-h-[100dvh] bg-[#F9F9F7] dark:bg-[#121212] flex flex-col items-center justify-center p-6 transition-colors duration-500">
        <motion.img 
          initial={{ opacity: 0.5, scale: 0.95 }} 
          animate={{ opacity: 1, scale: 1 }} 
          transition={{ repeat: Infinity, duration: 1, repeatType: "reverse" }}
          src="/logo-nuevo.png" alt={t('common.loading')} 
          className="w-48 object-contain drop-shadow-sm" 
        />
      </div>
    );
  }

  return (
    <div 
      className="min-h-[100dvh] bg-[#F9F9F7] dark:bg-[#121212] flex flex-col items-center overflow-y-auto px-6 transition-colors duration-500"
      style={{ 
        paddingTop: 'calc(2rem + env(safe-area-inset-top))',
        paddingBottom: 'calc(2rem + env(safe-area-inset-bottom))'
      }}
    >
      <motion.img 
        initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        src="/logo-nuevo.png" alt="Apapacho Logo" 
        className="w-48 object-contain mb-8 drop-shadow-sm shrink-0" 
      />

      <div className="w-full max-w-md bg-white dark:bg-[#1A1A1A] p-8 rounded-[2rem] shadow-xl border border-brand-gold/10 dark:border-brand-gold/20 mb-4 transition-colors duration-500">
        
        {view !== 'complete_profile' && (
          <div className="flex bg-gray-100 dark:bg-black/40 rounded-full p-1 mb-8 transition-colors">
            <button 
              type="button" onClick={() => { setView('login'); setErrorMsg(''); }}
              className={`flex-1 py-2 rounded-full text-[11px] font-bold uppercase tracking-widest transition-all ${view === 'login' ? 'bg-white dark:bg-[#2A2A2A] text-brand-dark dark:text-brand-gold shadow-sm' : 'text-gray-400 dark:text-gray-500'}`}
            >
              {t('auth.login_tab')}
            </button>
            <button 
              type="button" onClick={() => { setView('register'); setErrorMsg(''); }}
              className={`flex-1 py-2 rounded-full text-[11px] font-bold uppercase tracking-widest transition-all ${view === 'register' ? 'bg-white dark:bg-[#2A2A2A] text-brand-dark dark:text-brand-gold shadow-sm' : 'text-gray-400 dark:text-gray-500'}`}
            >
              {t('auth.register_tab')}
            </button>
          </div>
        )}

        {view === 'complete_profile' && (
          <div className="text-center mb-6">
            <h2 className="text-2xl font-serif italic text-brand-dark dark:text-gray-200 mb-2 transition-colors">{t('auth.almost_done')}</h2>
            <p className="text-[11px] font-bold uppercase tracking-widest text-brand-gold">
              {t('auth.need_more_data')}
            </p>
          </div>
        )}

        {errorMsg && (
          <div className="bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400 text-[11px] p-3 rounded-xl mb-6 font-bold uppercase tracking-widest text-center border border-red-100 dark:border-red-900/50 transition-colors">
            {errorMsg}
          </div>
        )}

        {view === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4">
            <GoogleButtonTop onClick={handleGoogleLogin} t={t} />
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" size={18} />
              <input 
                type="email" placeholder={t('auth.email')} required
                value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)}
                className="w-full bg-gray-50 dark:bg-black/30 border border-gray-100 dark:border-white/5 rounded-2xl py-4 pl-12 pr-4 text-sm focus:outline-none focus:border-brand-gold transition-colors text-brand-dark dark:text-gray-200"
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" size={18} />
              <input 
                type="password" placeholder={t('auth.password')} required
                value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)}
                className="w-full bg-gray-50 dark:bg-black/30 border border-gray-100 dark:border-white/5 rounded-2xl py-4 pl-12 pr-4 text-sm focus:outline-none focus:border-brand-gold transition-colors text-brand-dark dark:text-gray-200"
              />
            </div>
            <button disabled={loading} className="w-full bg-brand-gold text-white py-4 rounded-2xl font-bold text-[12px] uppercase tracking-widest shadow-lg shadow-brand-gold/20 active:scale-95 transition-all mt-6">
              {loading ? t('auth.entering') : t('auth.enter')}
            </button>
          </form>
        )}

        {view === 'register' && (
          <form onSubmit={handleRegister} className="space-y-4">
            <GoogleButtonTop onClick={handleGoogleLogin} t={t} />
            <AvatarSelector selected={selectedAvatar} onSelect={() => setShowAvatarModal(true)} t={t} />
            <div className="grid grid-cols-2 gap-3">
              <Input placeholder={t('auth.username')} value={username} onChange={setUsername} />
              <SelectCountry value={country} onChange={setCountry} t={t} />
            </div>
            <Input placeholder={t('auth.full_name')} value={fullName} onChange={setFullName} />
            <DateInput value={dob} onChange={setDob} t={t} />
            <Input placeholder={t('auth.email')} type="email" value={regEmail} onChange={setRegEmail} />
            <Input placeholder={t('auth.password')} type="password" value={regPassword} onChange={setRegPassword} />
            <Input placeholder={t('auth.confirm_password')} type="password" value={confirmPassword} onChange={setConfirmPassword} />
            <button disabled={loading} className="w-full bg-brand-dark-blue dark:bg-brand-gold text-white dark:text-brand-dark py-4 rounded-2xl font-bold text-[12px] uppercase tracking-widest shadow-lg shadow-brand-dark-blue/20 active:scale-95 transition-all mt-4">
              {loading ? t('auth.creating') : t('auth.create_account')}
            </button>
          </form>
        )}

        {view === 'complete_profile' && (
          <form onSubmit={handleCompleteProfile} className="space-y-4">
            <AvatarSelector selected={selectedAvatar} onSelect={() => setShowAvatarModal(true)} t={t} />
            
            <div className="bg-gray-50 dark:bg-black/30 p-4 rounded-xl border border-gray-100 dark:border-white/5 mb-4 opacity-70 transition-colors">
              <p className="text-[10px] uppercase font-bold text-gray-400 tracking-widest mb-1">{t('auth.linked_with_google')}</p>
              <p className="text-sm font-bold text-brand-dark dark:text-gray-200">{fullName}</p>
              <p className="text-sm text-gray-500">{regEmail}</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Input placeholder={t('auth.username_unique')} value={username} onChange={setUsername} />
              <SelectCountry value={country} onChange={setCountry} t={t} />
            </div>
            <DateInput value={dob} onChange={setDob} t={t} />

            <button disabled={loading} className="w-full bg-brand-gold text-white py-4 rounded-2xl font-bold text-[12px] uppercase tracking-widest shadow-lg active:scale-95 transition-all mt-4">
              {loading ? t('auth.saving') : t('auth.finish_registration')}
            </button>
          </form>
        )}
      </div>

      <AnimatePresence>
        {showAvatarModal && (
          <motion.div 
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} 
            transition={{ type: 'spring', damping: 25, stiffness: 200 }} 
            className="fixed inset-0 z-[60] bg-[#F9F9F7] dark:bg-[#121212] flex flex-col p-6 transition-colors duration-500"
            style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}
          >
            <div className="flex justify-between items-center mb-8 mt-6">
              <h2 className="text-2xl font-serif italic text-brand-dark dark:text-brand-gold transition-colors">{t('auth.choose_avatar')}</h2>
              <button type="button" onClick={() => setShowAvatarModal(false)} className="p-2 active:scale-90 bg-white dark:bg-black/40 rounded-full shadow-sm"><X size={24} className="text-brand-dark dark:text-gray-300 transition-colors" /></button>
            </div>
            <div className="grid grid-cols-2 gap-4 overflow-y-auto pb-10">
              {AVATARS.map((av) => (
                <div key={av} onClick={() => { setSelectedAvatar(av); setShowAvatarModal(false); }} className={`relative aspect-square rounded-2xl overflow-hidden cursor-pointer shadow-sm transition-transform active:scale-95 ${selectedAvatar === av ? 'border-4 border-brand-gold' : 'border-2 border-transparent'}`}>
                  <img src={av} alt="Avatar option" className="w-full h-full object-cover bg-brand-blue-bg dark:bg-black/50" />
                  {selectedAvatar === av && <div className="absolute inset-0 bg-black/40 flex items-center justify-center"><Check className="text-white drop-shadow-md" size={32} /></div>}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showValidationModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowValidationModal(false)}
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-[#1A1A1A] w-full max-w-sm p-8 rounded-3xl shadow-2xl relative z-10 border border-brand-gold/20"
            >
              <button type="button" onClick={() => setShowValidationModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-brand-dark dark:hover:text-gray-200 transition-colors">
                <X size={20} />
              </button>
              <h3 className="text-2xl font-serif italic text-brand-dark dark:text-brand-gold mb-2">{t('auth.missing_data')}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 font-texto">{t('auth.missing_data_desc')}</p>
              <ul className="space-y-2 mb-8">
                {missingFields.map(field => (
                  <li key={field} className="text-[11px] font-bold uppercase tracking-widest text-brand-dark-blue dark:text-brand-gold bg-brand-dark-blue/5 dark:bg-brand-gold/10 px-4 py-3 rounded-xl flex items-center gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-brand-dark-blue dark:bg-brand-gold" />
                    {field}
                  </li>
                ))}
              </ul>
              <button type="button" onClick={() => setShowValidationModal(false)} className="w-full py-4 bg-brand-gold text-white rounded-2xl font-bold text-[12px] uppercase tracking-widest shadow-lg active:scale-95 transition-transform">
                {t('auth.understood')}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

// COMPONENTES AUXILIARES ACTUALIZADOS PARA RECIBIR `t`
function GoogleButtonTop({ onClick, t }: { onClick: () => void, t: any }) {
  return (
    <div className="mb-2">
      <button type="button" onClick={onClick} className="w-full flex items-center justify-center gap-3 bg-white dark:bg-[#1A1A1A] border-2 border-gray-100 dark:border-white/5 text-brand-dark dark:text-gray-200 py-4 rounded-2xl font-bold text-[12px] uppercase tracking-widest active:scale-95 transition-all shadow-sm hover:bg-gray-50 dark:hover:bg-white/5">
        <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5" /> {t('auth.continue_with_google')}
      </button>
      <div className="relative flex items-center py-6">
        <div className="flex-grow border-t border-gray-200 dark:border-white/10 transition-colors"></div>
        <span className="flex-shrink-0 mx-4 text-gray-400 dark:text-gray-500 text-[10px] uppercase tracking-widest font-bold transition-colors">{t('auth.or_use_email')}</span>
        <div className="flex-grow border-t border-gray-200 dark:border-white/10 transition-colors"></div>
      </div>
    </div>
  );
}

function AvatarSelector({ selected, onSelect, t }: { selected: string, onSelect: () => void, t: any }) {
  return (
    <div className="flex flex-col items-center mb-6">
      <div className="relative w-24 h-24 rounded-full shadow-inner border-2 border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-black/30 flex items-center justify-center overflow-hidden mb-3 transition-colors">
        {selected ? <img src={selected} alt="Avatar" className="w-full h-full object-cover" /> : <User size={32} className="text-gray-300 dark:text-gray-600" />}
      </div>
      <button type="button" onClick={onSelect} className="text-[10px] font-bold uppercase tracking-widest text-brand-gold bg-brand-gold/10 px-4 py-2 rounded-full active:scale-95 transition-transform">
        {selected ? t('auth.change_avatar') : t('auth.choose_avatar')}
      </button>
    </div>
  );
}

function Input({ placeholder, type = "text", value, onChange }: any) {
  return (
    <input type={type} placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)}
      className="w-full bg-gray-50 dark:bg-black/30 border border-gray-100 dark:border-white/5 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-brand-gold transition-colors text-brand-dark dark:text-gray-200"
    />
  );
}

function DateInput({ value, onChange, t }: any) {
  return (
    <div className="relative">
      {!value && (
        <label className="absolute left-4 top-1/2 -translate-y-1/2 text-[10px] uppercase font-bold text-gray-400 dark:text-gray-500 tracking-widest pointer-events-none transition-colors">
          {t('auth.dob_placeholder')}
        </label>
      )}
      <input type="date" value={value} onChange={(e) => onChange(e.target.value)}
        className={`w-full bg-gray-50 dark:bg-black/30 border border-gray-100 dark:border-white/5 rounded-xl py-3 pr-4 text-sm focus:outline-none focus:border-brand-gold transition-colors ${
          !value ? 'pl-[100px] text-transparent' : 'pl-4 text-brand-dark dark:text-gray-200'
        }`}
      />
    </div>
  );
}

function SelectCountry({ value, onChange, t }: { value: string, onChange: (val: string) => void, t: any }) {
  const countries = ["Afganistán", "Albania", "Alemania", "Andorra", "Argentina", "Brasil", "Chile", "Colombia", "España", "Estados Unidos", "México", "Perú", "Portugal", "Uruguay", "Venezuela"]; 
  return (
    <select 
      value={value} 
      onChange={(e) => onChange(e.target.value)}
      className={`w-full bg-gray-50 dark:bg-black/30 border border-gray-100 dark:border-white/5 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-brand-gold transition-colors appearance-none ${!value ? 'text-gray-400 dark:text-gray-500' : 'text-brand-dark dark:text-gray-200'}`}
    >
      <option value="" disabled hidden>{t('auth.country_placeholder')}</option>
      {countries.map(c => <option key={c} value={c} className="text-brand-dark">{c}</option>)}
    </select>
  );
}