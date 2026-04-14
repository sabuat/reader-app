"use client";

import { useState } from 'react';
import { Mail, Lock, User, Check, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { AuthService } from '@/services/authService';

const AVATARS = [
  '/avatar/avatar-1.png', '/avatar/avatar-2.png', '/avatar/avatar-3.png',
  '/avatar/avatar-4.png', '/avatar/avatar-5.png', '/avatar/avatar-6.png',
];

const COUNTRIES = [
  "Afganistán", "Albania", "Alemania", "Andorra", "Argentina", "Brasil", 
  "Chile", "Colombia", "España", "Estados Unidos", "México", "Perú", 
  "Portugal", "Uruguay", "Venezuela"
];

const isOldEnough = (birthDateString: string) => {
  const today = new Date();
  const birthDate = new Date(birthDateString);
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
  return age >= 14;
};

// ==========================================
// 1. FORMULARIO DE LOGIN
// ==========================================
export function LoginForm({ t, onSessionSuccess }: { t: any, onSessionSuccess: (user: any) => Promise<void> }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setErrorMsg('');
    try {
      const data = await AuthService.signInWithEmail(email, password);
      if (data.user) await onSessionSuccess(data.user);
    } catch (error) {
      setErrorMsg(t('auth.invalid_credentials'));
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true); setErrorMsg('');
    try {
      // Flujo Limpio: Devuelve un 'User' (App) o 'null' (Web)
      const user = await AuthService.signInWithGoogle();
      
      if (user) {
        await onSessionSuccess(user);
      }
    } catch (error) {
      setErrorMsg(t('auth.google_error'));
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleLogin} className="space-y-4">
      {errorMsg && <ErrorBadge msg={errorMsg} />}
      <GoogleButtonTop onClick={handleGoogleLogin} t={t} />
      <div className="relative">
        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input type="email" placeholder={t('auth.email')} required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-gray-50 dark:bg-black/30 border border-gray-100 dark:border-white/5 rounded-2xl py-4 pl-12 pr-4 text-sm focus:outline-none focus:border-brand-gold text-brand-dark dark:text-gray-200 transition-colors" />
      </div>
      <div className="relative">
        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input type="password" placeholder={t('auth.password')} required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-gray-50 dark:bg-black/30 border border-gray-100 dark:border-white/5 rounded-2xl py-4 pl-12 pr-4 text-sm focus:outline-none focus:border-brand-gold text-brand-dark dark:text-gray-200 transition-colors" />
      </div>
      <button disabled={loading} className="w-full bg-brand-gold text-white py-4 rounded-2xl font-bold text-[12px] uppercase tracking-widest shadow-lg active:scale-95 transition-all mt-6">
        {loading ? t('auth.entering') : t('auth.enter')}
      </button>
    </form>
  );
}

// ==========================================
// 2. FORMULARIO DE REGISTRO
// ==========================================
export function RegisterForm({ t, onSessionSuccess, onProfileCreated }: { t: any, onSessionSuccess: (user: any) => Promise<void>, onProfileCreated: () => void }) {
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [dob, setDob] = useState('');
  const [country, setCountry] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [missingFields, setMissingFields] = useState<string[]>([]);
  const [showValidationModal, setShowValidationModal] = useState(false);

  const handleGoogleLogin = async () => {
    setLoading(true); setErrorMsg('');
    try {
      // Flujo Limpio actualizado aquí también
      const user = await AuthService.signInWithGoogle();
      if (user) {
        await onSessionSuccess(user);
      }
    } catch (error) {
      setErrorMsg(t('auth.google_error'));
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
    if (!email) missing.push(t('auth.email'));
    if (!password) missing.push(t('auth.password'));
    if (!confirmPassword) missing.push(t('auth.confirm_password'));

    if (missing.length > 0) {
      setMissingFields(missing); setShowValidationModal(true); setLoading(false); return;
    }
    if (password !== confirmPassword) {
      setErrorMsg(t('auth.passwords_not_match')); setLoading(false); return;
    }
    if (!isOldEnough(dob)) {
      setErrorMsg(t('auth.age_requirement')); setLoading(false); return;
    }

    try {
      const authData = await AuthService.signUpWithEmail(email, password);
      if (authData.user) {
        await AuthService.createProfile({
          id: authData.user.id, username, full_name: fullName, dob, country, avatar_url: selectedAvatar,
        });
        onProfileCreated();
      }
    } catch (error: any) {
      setErrorMsg(error.message); setLoading(false);
    }
  };

  return (
    <form onSubmit={handleRegister} className="space-y-4">
      {errorMsg && <ErrorBadge msg={errorMsg} />}
      <GoogleButtonTop onClick={handleGoogleLogin} t={t} />
      <AvatarSelector selected={selectedAvatar} onSelect={() => setShowAvatarModal(true)} t={t} />
      <div className="grid grid-cols-2 gap-3">
        <Input placeholder={t('auth.username')} value={username} onChange={setUsername} />
        <SelectCountry value={country} onChange={setCountry} t={t} />
      </div>
      <Input placeholder={t('auth.full_name')} value={fullName} onChange={setFullName} />
      <DateInput value={dob} onChange={setDob} t={t} />
      <Input placeholder={t('auth.email')} type="email" value={email} onChange={setEmail} />
      <Input placeholder={t('auth.password')} type="password" value={password} onChange={setPassword} />
      <Input placeholder={t('auth.confirm_password')} type="password" value={confirmPassword} onChange={setConfirmPassword} />
      <button disabled={loading} className="w-full bg-brand-dark-blue dark:bg-brand-gold text-white dark:text-brand-dark py-4 rounded-2xl font-bold text-[12px] uppercase tracking-widest shadow-lg active:scale-95 transition-all mt-4">
        {loading ? t('auth.creating') : t('auth.create_account')}
      </button>
      <AvatarModal isOpen={showAvatarModal} onClose={() => setShowAvatarModal(false)} selected={selectedAvatar} onSelect={setSelectedAvatar} t={t} />
      <ValidationModal isOpen={showValidationModal} onClose={() => setShowValidationModal(false)} missingFields={missingFields} t={t} />
    </form>
  );
}

// ==========================================
// 3. FORMULARIO COMPLETAR PERFIL (GOOGLE)
// ==========================================
export function CompleteProfileForm({ t, authUserId, regEmail, fullNameInitial, onProfileCreated }: { t: any, authUserId: string, regEmail: string, fullNameInitial: string, onProfileCreated: () => void }) {
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState(fullNameInitial || '');
  const [dob, setDob] = useState('');
  const [country, setCountry] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [missingFields, setMissingFields] = useState<string[]>([]);
  const [showValidationModal, setShowValidationModal] = useState(false);

  const handleCompleteProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setErrorMsg('');

    const missing: string[] = [];
    if (!selectedAvatar) missing.push(t('auth.avatar'));
    if (!username) missing.push(t('auth.username_unique'));
    if (!dob) missing.push(t('auth.dob'));
    if (!country) missing.push(t('auth.country'));

    if (missing.length > 0) {
      setMissingFields(missing); setShowValidationModal(true); setLoading(false); return;
    }
    if (!isOldEnough(dob)) {
      setErrorMsg(t('auth.age_requirement')); setLoading(false); return;
    }

    try {
      await AuthService.createProfile({
        id: authUserId, username, full_name: fullName, dob, country, avatar_url: selectedAvatar,
      });
      onProfileCreated();
    } catch (error: any) {
      setErrorMsg(error.message); setLoading(false);
    }
  };

  return (
    <form onSubmit={handleCompleteProfile} className="space-y-4">
      {errorMsg && <ErrorBadge msg={errorMsg} />}
      <AvatarSelector selected={selectedAvatar} onSelect={() => setShowAvatarModal(true)} t={t} />
      <div className="bg-gray-50 dark:bg-black/30 p-4 rounded-xl border border-gray-100 dark:border-white/5 mb-4 opacity-70">
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
      <AvatarModal isOpen={showAvatarModal} onClose={() => setShowAvatarModal(false)} selected={selectedAvatar} onSelect={setSelectedAvatar} t={t} />
      <ValidationModal isOpen={showValidationModal} onClose={() => setShowValidationModal(false)} missingFields={missingFields} t={t} />
    </form>
  );
}

// ==========================================
// COMPONENTES DE UI COMPARTIDOS (Módulos internos)
// ==========================================
function ErrorBadge({ msg }: { msg: string }) {
  return <div className="bg-red-50 dark:bg-red-900/20 text-red-500 text-[11px] p-3 rounded-xl mb-6 font-bold uppercase tracking-widest text-center border border-red-100">{msg}</div>;
}

function GoogleButtonTop({ onClick, t }: any) {
  return (
    <div className="mb-2">
      <button type="button" onClick={onClick} className="w-full flex items-center justify-center gap-3 bg-white dark:bg-[#1A1A1A] border-2 border-gray-100 dark:border-white/5 text-brand-dark dark:text-gray-200 py-4 rounded-2xl font-bold text-[12px] uppercase tracking-widest active:scale-95 transition-all shadow-sm">
        <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5" /> {t('auth.continue_with_google')}
      </button>
      <div className="relative flex items-center py-6">
        <div className="flex-grow border-t border-gray-200 dark:border-white/10"></div>
        <span className="flex-shrink-0 mx-4 text-gray-400 text-[10px] uppercase tracking-widest font-bold">{t('auth.or_use_email')}</span>
        <div className="flex-grow border-t border-gray-200 dark:border-white/10"></div>
      </div>
    </div>
  );
}

function AvatarSelector({ selected, onSelect, t }: any) {
  return (
    <div className="flex flex-col items-center mb-6">
      <div className="relative w-24 h-24 rounded-full shadow-inner border-2 border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-black/30 flex items-center justify-center overflow-hidden mb-3">
        {selected ? <img src={selected} alt="Avatar" className="w-full h-full object-cover" /> : <User size={32} className="text-gray-300 dark:text-gray-600" />}
      </div>
      <button type="button" onClick={onSelect} className="text-[10px] font-bold uppercase tracking-widest text-brand-gold bg-brand-gold/10 px-4 py-2 rounded-full active:scale-95 transition-transform">{selected ? t('auth.change_avatar') : t('auth.choose_avatar')}</button>
    </div>
  );
}

function Input({ placeholder, type = "text", value, onChange }: any) {
  return <input type={type} placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} className="w-full bg-gray-50 dark:bg-black/30 border border-gray-100 dark:border-white/5 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-brand-gold text-brand-dark dark:text-gray-200" />;
}

function DateInput({ value, onChange, t }: any) {
  return (
    <div className="relative">
      {!value && <label className="absolute left-4 top-1/2 -translate-y-1/2 text-[10px] uppercase font-bold text-gray-400 tracking-widest pointer-events-none">{t('auth.dob_placeholder')}</label>}
      <input type="date" value={value} onChange={(e) => onChange(e.target.value)} className={`w-full bg-gray-50 dark:bg-black/30 border border-gray-100 dark:border-white/5 rounded-xl py-3 pr-4 text-sm focus:outline-none focus:border-brand-gold ${!value ? 'pl-[100px] text-transparent' : 'pl-4 text-brand-dark dark:text-gray-200'}`} />
    </div>
  );
}

function SelectCountry({ value, onChange, t }: any) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className={`w-full bg-gray-50 dark:bg-black/30 border border-gray-100 dark:border-white/5 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-brand-gold appearance-none ${!value ? 'text-gray-400' : 'text-brand-dark dark:text-gray-200'}`}>
      <option value="" disabled hidden>{t('auth.country_placeholder')}</option>
      {COUNTRIES.map(c => <option key={c} value={c} className="text-brand-dark">{c}</option>)}
    </select>
  );
}

function AvatarModal({ isOpen, onClose, selected, onSelect, t }: any) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="fixed inset-0 z-[60] bg-[#F9F9F7] dark:bg-[#121212] flex flex-col p-6" style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}>
          <div className="flex justify-between items-center mb-8 mt-6">
            <h2 className="text-2xl font-serif italic text-brand-dark dark:text-brand-gold">{t('auth.choose_avatar')}</h2>
            <button type="button" onClick={onClose} className="p-2 active:scale-90 bg-white dark:bg-black/40 rounded-full shadow-sm"><X size={24} className="text-brand-dark dark:text-gray-300" /></button>
          </div>
          <div className="grid grid-cols-2 gap-4 overflow-y-auto pb-10">
            {AVATARS.map((av) => (
              <div key={av} onClick={() => { onSelect(av); onClose(); }} className={`relative aspect-square rounded-2xl overflow-hidden cursor-pointer shadow-sm transition-transform active:scale-95 ${selected === av ? 'border-4 border-brand-gold' : 'border-2 border-transparent'}`}>
                <img src={av} alt="Avatar" className="w-full h-full object-cover bg-brand-blue-bg dark:bg-black/50" />
                {selected === av && <div className="absolute inset-0 bg-black/40 flex items-center justify-center"><Check className="text-white drop-shadow-md" size={32} /></div>}
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function ValidationModal({ isOpen, onClose, missingFields, t }: any) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white dark:bg-[#1A1A1A] w-full max-w-sm p-8 rounded-3xl shadow-2xl relative z-10 border border-brand-gold/20">
            <button type="button" onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-brand-dark transition-colors"><X size={20} /></button>
            <h3 className="text-2xl font-serif italic text-brand-dark dark:text-brand-gold mb-2">{t('auth.missing_data')}</h3>
            <p className="text-sm text-gray-500 mb-6">{t('auth.missing_data_desc')}</p>
            <ul className="space-y-2 mb-8">
              {missingFields.map((field: string) => (
                <li key={field} className="text-[11px] font-bold uppercase tracking-widest text-brand-dark-blue dark:text-brand-gold bg-brand-dark-blue/5 dark:bg-brand-gold/10 px-4 py-3 rounded-xl flex items-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-brand-dark-blue dark:bg-brand-gold" />{field}
                </li>
              ))}
            </ul>
            <button type="button" onClick={onClose} className="w-full py-4 bg-brand-gold text-white rounded-2xl font-bold text-[12px] uppercase tracking-widest shadow-lg active:scale-95 transition-transform">{t('auth.understood')}</button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}