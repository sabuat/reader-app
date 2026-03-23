"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { LogOut, Moon, Sun, Type, Check, X, Edit3, KeyRound, Save } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

// IMPORTAMOS LOS SERVICIOS Y EL TRADUCTOR
import { AuthService } from '@/services/authService';
import { updatePrefs } from '@/lib/preferences';
import { useLanguage } from '@/hooks/useLanguage';

const AVATARS = [
  '/avatar/avatar-1.png',
  '/avatar/avatar-2.png',
  '/avatar/avatar-3.png',
  '/avatar/avatar-4.png',
  '/avatar/avatar-5.png',
  '/avatar/avatar-6.png',
];

const FONT_SIZES = [
  { id: 'text-sm', label: 'A', size: '14px' },
  { id: 'text-base', label: 'A', size: '16px' },
  { id: 'text-lg', label: 'A', size: '18px' },
  { id: 'text-xl', label: 'A', size: '20px' },
];

export default function CuentaPage() {
  const router = useRouter();
  
  // INICIALIZAMOS EL TRADUCTOR
  const { t } = useLanguage();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  
  const [userEmail, setUserEmail] = useState<string>('');
  const [username, setUsername] = useState<string>('');
  
  const [selectedAvatar, setSelectedAvatar] = useState<string>(AVATARS[0]);
  const [nightMode, setNightMode] = useState<boolean>(false);
  const [fontSize, setFontSize] = useState<string>('text-base');

  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    async function loadProfile() {
      const session = await AuthService.getSession();
      const user = session?.user;
      
      if (user) {
        setUserId(user.id);
        setUserEmail(user.email ?? '');

        const profile = await AuthService.getProfile(user.id);

        if (profile) {
          setUsername(profile.username || t('account.not_specified'));
          setSelectedAvatar(profile.avatar_url || AVATARS[0]);
          setNightMode(profile.night_mode || false);
          setFontSize(profile.font_size || 'text-base');
        }
      }
      setLoading(false);
    }
    loadProfile();
  }, [t]);

  const handleSave = async () => {
    if (!userId) return;
    setSaving(true);
    setMessage('');

    try {
      // Centralizamos la lógica de base de datos usando nuestro servicio unificado
      await AuthService.createProfile({
        id: userId,
        username: username, 
        avatar_url: selectedAvatar,
        font_size: fontSize,
        night_mode: nightMode,
        updated_at: new Date().toISOString(),
      });

      //  Persistencia limpia y centralizada
      updatePrefs({ 
        nightMode: nightMode, 
        fontSize: fontSize 
      });

      // Le avisamos al sistema nativo que cambie el tema sin recargar
      if (nightMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }

      setMessage(t('account.success_save'));
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      console.error(err);
      setMessage(t('account.error_save'));
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!userEmail) return;
    const { error } = await supabase.auth.resetPasswordForEmail(userEmail);
    if (error) {
      setMessage(t('account.error_email'));
    } else {
      setMessage(t('account.success_email'));
    }
    setTimeout(() => setMessage(''), 4000);
  };

  const handleSignOut = async () => {
    await AuthService.signOut();
    router.push('/'); 
  };

  if (loading) return (
    <div className={`flex h-screen items-center justify-center ${nightMode ? 'bg-[#121212]' : 'bg-brand-bg'}`}>
      <div className="w-8 h-8 border-4 border-brand-gold border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-brand-bg dark:bg-[#121212] transition-colors duration-500 px-6 pb-32 pt-12 relative overflow-hidden">
      
      <header className="mb-10 text-center flex flex-col items-center relative">
        <div className="relative w-28 h-28 rounded-full mb-3 shadow-lg border-2 border-brand-gold/50 overflow-hidden bg-brand-blue-bg">
          <img src={selectedAvatar} alt="Mi Avatar" className="w-full h-full object-cover" />
        </div>
        
        <button 
          onClick={() => setShowAvatarModal(true)}
          className="flex items-center gap-2 bg-brand-gold/10 text-brand-gold px-4 py-2 rounded-full active:scale-95 transition-transform mb-6"
        >
          <Edit3 size={14} />
          <span className="text-[10px] font-bold uppercase tracking-widest">{t('account.change_avatar')}</span>
        </button>

        <h1 className="text-3xl font-serif italic text-brand-dark dark:text-brand-gold mb-1 transition-colors">{t('account.title')}</h1>
      </header>

      <div className="mb-8 space-y-4">
        <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-dark/50 dark:text-gray-400 ml-2 transition-colors">{t('account.personal_data')}</h2>
        
        <div className="bg-white dark:bg-[#1A1A1A] rounded-3xl p-5 shadow-sm border border-brand-gold/5 dark:border-brand-gold/10 space-y-5 transition-colors duration-500">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-brand-gold mb-2">{t('account.username')}</label>
            <div className="w-full bg-gray-50 dark:bg-black/30 border border-gray-100 dark:border-white/5 rounded-xl py-3 px-4 text-brand-dark/70 dark:text-gray-300 font-bold text-sm transition-colors">
              {username || t('account.not_specified')}
            </div>
          </div>
          
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-brand-gold mb-2">{t('account.email')}</label>
            <div className="w-full bg-gray-50 dark:bg-black/30 border border-gray-100 dark:border-white/5 rounded-xl py-3 px-4 text-brand-dark/70 dark:text-gray-300 font-bold text-sm transition-colors">
              {userEmail}
            </div>
          </div>

          <button 
            onClick={handlePasswordReset}
            className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-brand-dark dark:text-gray-300 hover:text-brand-gold dark:hover:text-brand-gold transition-colors pt-2"
          >
            <KeyRound size={16} /> {t('account.change_password')}
          </button>
        </div>
      </div>

      <div className="mb-8">
        <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-dark/50 dark:text-gray-400 mb-4 ml-2 transition-colors">{t('account.reading_prefs')}</h2>
        <div className="bg-white dark:bg-[#1A1A1A] rounded-3xl p-2 shadow-sm border border-brand-gold/5 dark:border-brand-gold/10 transition-colors duration-500">
          
          <div className="p-4 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 text-brand-dark/70 dark:text-gray-300 transition-colors">
                <Type size={20} />
                <span className="font-bold text-[12px] uppercase tracking-widest">{t('account.size')}</span>
              </div>
              <div className="flex gap-2">
                {FONT_SIZES.map((fs) => (
                  <button
                    key={fs.id}
                    onClick={() => setFontSize(fs.id)}
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                      fontSize === fs.id ? 'bg-brand-gold text-white shadow-md' : 'bg-gray-100 dark:bg-black/40 text-brand-dark dark:text-gray-400'
                    }`}
                    style={{ fontSize: fs.size }}
                  >
                    {fs.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-brand-blue-bg/20 dark:bg-black/20 border border-brand-dark-blue/10 dark:border-white/5 py-5 px-4 rounded-2xl text-center flex flex-col items-center justify-center min-h-[100px] mt-2 transition-colors">
              <span className="text-[9px] uppercase tracking-[0.3em] text-gray-400 block mb-3 font-bold">{t('account.preview')}</span>
              <p className={`font-texto transition-all duration-300 text-brand-dark-blue dark:text-brand-gold ${fontSize}`}>
                {t('account.preview_text')}
              </p>
            </div>
          </div>

          <div className="h-px bg-brand-gold/5 dark:bg-brand-gold/10 mx-4" />

          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3 text-brand-dark/70 dark:text-gray-300 transition-colors">
              {nightMode ? <Moon size={20} /> : <Sun size={20} />}
              <span className="font-bold text-[12px] uppercase tracking-widest">{t('account.night_mode')}</span>
            </div>
            <button 
              onClick={() => setNightMode(!nightMode)}
              className={`w-12 h-6 rounded-full p-1 transition-colors ${nightMode ? 'bg-brand-gold' : 'bg-gray-200 dark:bg-gray-700'}`}
            >
              <div className={`w-4 h-4 rounded-full bg-white transition-transform ${nightMode ? 'translate-x-6' : 'translate-x-0'}`} />
            </button>
          </div>

        </div>
      </div>

      {message && (
        <div className="text-center mb-4 text-[11px] font-bold text-brand-gold uppercase tracking-widest">
          {message}
        </div>
      )}

      <button 
        onClick={handleSave}
        disabled={saving}
        className="w-full flex items-center justify-center gap-2 bg-brand-gold text-white py-4 rounded-2xl font-bold text-[12px] uppercase tracking-widest shadow-lg shadow-brand-gold/20 active:scale-95 transition-all mb-6"
      >
        <Save size={18} />
        {saving ? t('account.saving') : t('account.save_config')}
      </button>

      <button 
        onClick={handleSignOut}
        className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-[11px] uppercase tracking-widest text-red-400 dark:text-red-400 border border-red-100 dark:border-red-900/50 bg-white dark:bg-[#1A1A1A] active:scale-95 transition-all"
      >
        <LogOut size={16} /> {t('menu.sign_out')}
      </button>

      <AnimatePresence>
        {showAvatarModal && (
          <motion.div 
            initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-50 bg-brand-bg dark:bg-[#121212] transition-colors duration-500 flex flex-col p-6"
          >
            <div className="flex justify-between items-center mb-8 mt-6">
              <h2 className="text-2xl font-serif italic text-brand-dark dark:text-brand-gold">{t('auth.choose_avatar')}</h2>
              <button onClick={() => setShowAvatarModal(false)} className="p-2 active:scale-90 bg-white dark:bg-black/40 rounded-full shadow-sm">
                <X size={24} className="text-brand-dark dark:text-gray-300" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {AVATARS.map((av) => (
                <div 
                  key={av}
                  onClick={() => { setSelectedAvatar(av); setShowAvatarModal(false); }}
                  className={`relative aspect-square rounded-2xl overflow-hidden cursor-pointer shadow-sm transition-transform active:scale-95 ${
                    selectedAvatar === av ? 'border-4 border-brand-gold' : 'border-2 border-transparent'
                  }`}
                >
                  <img src={av} alt="Avatar option" className="w-full h-full object-cover bg-brand-blue-bg" />
                  {selectedAvatar === av && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <Check className="text-white drop-shadow-md" size={32} />
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            <p className="text-center mt-auto pb-10 text-[10px] uppercase tracking-widest text-brand-dark/40 dark:text-gray-500 font-bold">
              {t('account.touch_avatar')}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}