"use client";

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, User as UserIcon, Mail, MapPin, Calendar, BookOpen, Hash, Lock, X, Camera, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { AuthService } from '@/services/authService';
import { BookService, ReadingBookItem } from '@/services/bookService';
import { PreferencesService } from '@/lib/preferences';
import { useLanguage } from '@/hooks/useLanguage';
import { Profile } from '@/lib/types';
import { supabase } from '@/lib/supabase';

// ==========================================
// AVATARES PREDEFINIDOS
// ==========================================
const PRESET_AVATARS = [
  '/avatars/1.png', '/avatars/2.png', '/avatars/3.png', 
  '/avatars/4.png', '/avatars/5.png', '/avatars/6.png'
];

export default function CuentaPage() {
  const router = useRouter();
  const { t, isReady } = useLanguage();

  // ==========================================
  // ESTADOS DEL DOMINIO
  // ==========================================
  const [profile, setProfile] = useState<Profile | null>(null);
  const [userEmail, setUserEmail] = useState<string>('');
  const [readerSince, setReaderSince] = useState<string>('');
  
  const [stats, setStats] = useState({ totalBooks: 0, chaptersRead: 0 });
  
  const [loading, setLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // ==========================================
  // ESTADOS DE UI (MODALES)
  // ==========================================
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  // ==========================================
  // DATA FETCHING & CÁLCULOS
  // ==========================================
  const loadUserData = useCallback(async (ignore: boolean) => {
    try {
      const result = await AuthService.getCurrentUserWithProfile();
      
      if (!result?.user) {
        if (!ignore) router.push('/');
        return;
      }
      
      if (!ignore) {
        setProfile(result.profile);
        setUserEmail(result.user.email || '');
        
        // Calcular "Lector desde"
        const createdDate = new Date(result.user.created_at);
        setReaderSince(createdDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' }));
      }

      // Obtener estadísticas de lectura
      const readings = await BookService.getMyReadings(result.user.id);
      
      if (!ignore) {
        const totalBooks = readings.length;
        // Sumar todos los capítulos completados de todos los libros
        const chaptersRead = readings.reduce((acc: number, curr: ReadingBookItem) => {
          return acc + (curr.completed_chapters?.length || 0);
        }, 0);

        setStats({ totalBooks, chaptersRead });
      }

    } catch (error) {
      console.error("[CuentaPage] Error cargando perfil:", error);
    } finally {
      if (!ignore) setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    if (!isReady) return;
    let ignore = false;
    
    setLoading(true);
    loadUserData(ignore);

    return () => { ignore = true; };
  }, [isReady, loadUserData]);

  // ==========================================
  // ACCIONES
  // ==========================================
  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await AuthService.signOut();
      PreferencesService.clearEphemeralState();
      router.push('/');
    } catch (error) {
      console.error("[CuentaPage] Error cerrando sesión:", error);
      setIsLoggingOut(false);
    }
  };

  const updateAvatar = async (avatarUrl: string) => {
    if (!profile) return;
    try {
      // 🌟 Usamos la nueva función updateProfile para actualizaciones parciales y tipadas
      await AuthService.updateProfile(profile.id, {
        avatar_url: avatarUrl
      });
      setProfile({ ...profile, avatar_url: avatarUrl });
      setShowAvatarModal(false);
    } catch (error) {
      console.error("[CuentaPage] Error actualizando avatar:", error);
    }
  };

  // ==========================================
  // RENDERIZADO PRINCIPAL
  // ==========================================
  if (!isReady || loading) {
    return (
      <div className="min-h-[100dvh] bg-brand-bg dark:bg-[#121212] flex items-center justify-center transition-colors">
        <div className="w-8 h-8 border-4 border-brand-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="w-full px-6 pt-6 pb-24 overflow-x-hidden relative bg-brand-bg dark:bg-[#121212] min-h-[100dvh] transition-colors duration-500">
      
      {/* HEADER (Alineado a la izquierda, igual que Home y Lista) */}
      <header className="mb-8">
        <h1 className="text-2xl font-serif italic text-brand-dark dark:text-brand-gold transition-colors">
          {t('menu.account') || 'Mi Cuenta'}
        </h1>
      </header>

      {/* SECCIÓN DE AVATAR Y CABECERA (Centrado y Grande) */}
      <section className="flex flex-col items-center mb-10">
        <div 
          onClick={() => setShowAvatarModal(true)}
          className="relative w-32 h-32 rounded-full overflow-hidden bg-white dark:bg-[#1A1A1A] border-4 border-brand-gold/30 shadow-xl cursor-pointer group active:scale-95 transition-all mb-4"
        >
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover group-hover:opacity-80 transition-opacity" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-black/50">
              <UserIcon size={48} className="text-brand-dark/20 dark:text-gray-600" />
            </div>
          )}
          {/* Overlay de edición */}
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <Camera size={28} className="text-white drop-shadow-md" />
          </div>
        </div>
        
        <h2 className="text-2xl font-bold text-brand-dark dark:text-white transition-colors mb-1 text-center">
          {profile?.full_name || 'Usuario Apapacho'}
        </h2>
        <p className="text-xs font-bold uppercase tracking-widest text-brand-gold mb-6 text-center">
          @{profile?.username || 'user'}
        </p>

        {/* ESTADÍSTICAS RÁPIDAS (Invertidas: Título, Número, Icono) */}
        <div className="w-full max-w-sm grid grid-cols-2 gap-4">
          <div className="bg-white dark:bg-[#1A1A1A] p-4 rounded-2xl shadow-sm border border-brand-gold/10 flex flex-col items-center justify-center transition-colors">
            <span className="text-[9px] uppercase tracking-widest text-gray-400 font-bold text-center mb-1">
              {t('account.stats_books') || 'Libros en curso'}
            </span>
            <span className="text-2xl font-black text-brand-dark dark:text-gray-200 mb-2">{stats.totalBooks}</span>
            <BookOpen size={20} className="text-brand-dark-blue dark:text-brand-gold" />
          </div>
          <div className="bg-white dark:bg-[#1A1A1A] p-4 rounded-2xl shadow-sm border border-brand-gold/10 flex flex-col items-center justify-center transition-colors">
            <span className="text-[9px] uppercase tracking-widest text-gray-400 font-bold text-center mb-1">
              {t('account.stats_chapters') || 'Capítulos leídos'}
            </span>
            <span className="text-2xl font-black text-brand-dark dark:text-gray-200 mb-2">{stats.chaptersRead}</span>
            <Hash size={20} className="text-brand-dark-blue dark:text-brand-gold" />
          </div>
        </div>
      </section>

      {/* INFORMACIÓN Y CONFIGURACIÓN (Dos filas por box) */}
      <section className="bg-white dark:bg-[#1A1A1A] rounded-[2rem] p-2 shadow-xl border border-brand-gold/10 mb-8 transition-colors">
        
        <InfoRow icon={<Mail size={20} />} label={t('auth.email') || 'Correo electrónico'} value={userEmail} />
        <div className="w-full h-[1px] bg-gray-100 dark:bg-white/5" />
        
        <InfoRow icon={<MapPin size={20} />} label={t('auth.country') || 'Región'} value={profile?.country || t('account.not_specified')} />
        <div className="w-full h-[1px] bg-gray-100 dark:bg-white/5" />
        
        <InfoRow icon={<Calendar size={20} />} label={t('account.reader_since') || 'Lector desde'} value={readerSince} />
        <div className="w-full h-[1px] bg-gray-100 dark:bg-white/5" />
        
        {/* Botón de contraseña con el mismo layout pero interactivo */}
        <button 
          onClick={() => setShowPasswordModal(true)}
          className="w-full flex items-center p-4 gap-4 rounded-xl active:bg-gray-50 dark:active:bg-white/5 transition-colors group text-left"
        >
          <div className="p-3 bg-brand-dark-blue/5 dark:bg-brand-gold/10 rounded-full group-active:scale-95 transition-transform shrink-0">
            <Lock size={20} className="text-brand-dark-blue dark:text-brand-gold" />
          </div>
          <div className="flex flex-col gap-1 w-full overflow-hidden">
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">
              {t('account.security') || 'Seguridad'}
            </span>
            <span className="text-sm font-bold text-brand-dark dark:text-gray-200 truncate">
              {t('account.change_password') || 'Cambiar Contraseña'}
            </span>
          </div>
        </button>

      </section>

      {/* BOTÓN DE LOGOUT */}
      <button 
        onClick={handleLogout}
        disabled={isLoggingOut}
        className="w-full flex items-center justify-center gap-3 bg-red-50 dark:bg-red-900/20 text-brand-red dark:text-red-400 border border-red-100 dark:border-red-900/50 py-4 rounded-full font-bold text-[11px] uppercase tracking-widest active:scale-95 transition-all shadow-sm disabled:opacity-50"
      >
        <LogOut size={18} />
        {isLoggingOut ? (t('common.loading') || 'SALIENDO...') : (t('account.logout') || 'CERRAR SESIÓN')}
      </button>

      {/* ============================== */}
      {/* MODALES                        */}
      {/* ============================== */}
      <AnimatePresence>
        {showAvatarModal && (
          <AvatarSelectionModal 
            t={t}
            currentAvatar={profile?.avatar_url}
            onClose={() => setShowAvatarModal(false)}
            onSelect={updateAvatar}
          />
        )}
        
        {showPasswordModal && (
          <PasswordChangeModal 
            t={t}
            onClose={() => setShowPasswordModal(false)}
          />
        )}
      </AnimatePresence>

    </div>
  );
}

// ==========================================
// SUBCOMPONENTES LOCALES
// ==========================================

function InfoRow({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) {
  return (
    <div className="w-full flex items-center p-4 gap-4">
      <div className="p-3 bg-gray-50 dark:bg-black/30 rounded-full text-brand-dark-blue dark:text-brand-gold shrink-0">
        {icon}
      </div>
      <div className="flex flex-col gap-1 w-full overflow-hidden">
        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">
          {label}
        </span>
        <span className="text-sm font-bold text-brand-dark dark:text-gray-200 truncate">
          {value}
        </span>
      </div>
    </div>
  );
}

// ==========================================
// MODAL: CAMBIO DE AVATAR
// ==========================================
function AvatarSelectionModal({ t, currentAvatar, onClose, onSelect }: any) {
  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/80 flex flex-col items-center justify-center p-6 backdrop-blur-sm"
    >
      <motion.div 
        initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }}
        className="bg-brand-bg dark:bg-[#1A1A1A] w-full max-w-sm rounded-[2rem] shadow-2xl overflow-hidden flex flex-col"
      >
        <div className="p-6 border-b border-brand-gold/10 flex justify-between items-center">
          <h3 className="font-serif italic text-xl text-brand-dark dark:text-brand-gold">
            {t('auth.choose_avatar') || 'Elige tu Avatar'}
          </h3>
          <button onClick={onClose} className="p-2 bg-gray-100 dark:bg-white/5 rounded-full active:scale-90">
            <X size={18} className="text-brand-dark dark:text-gray-300" />
          </button>
        </div>
        
        <div className="p-8 grid grid-cols-3 gap-6 overflow-y-auto">
          {PRESET_AVATARS.map((url, idx) => (
            <div 
              key={idx} 
              onClick={() => onSelect(url)}
              className={`aspect-square rounded-full overflow-hidden cursor-pointer active:scale-90 transition-transform border-4 relative ${currentAvatar === url ? 'border-brand-gold' : 'border-transparent hover:border-brand-gold/30'}`}
            >
              <img 
                src={url} 
                alt={`Avatar ${idx + 1}`} 
                className="w-full h-full object-cover"
              />
              
              {currentAvatar === url && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <Check size={24} className="text-white drop-shadow-md" />
                </div>
              )}
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ==========================================
// MODAL: CAMBIO DE CONTRASEÑA
// ==========================================
function PasswordChangeModal({ t, onClose }: any) {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    
    if (password.length < 6) {
      setErrorMsg('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (password !== confirm) {
      setErrorMsg(t('auth.passwords_not_match') || 'Las contraseñas no coinciden.');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      
      if (error) throw error;
      setSuccess(true);
      setTimeout(() => { onClose(); }, 2000);

    } catch (error: any) {
      setErrorMsg(error.message || t('account.error_save'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/80 flex flex-col items-center justify-center p-6 backdrop-blur-sm"
    >
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
        className="bg-brand-bg dark:bg-[#1A1A1A] w-full max-w-sm rounded-[2rem] shadow-2xl overflow-hidden p-8 relative"
      >
        <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-gray-100 dark:bg-white/5 rounded-full active:scale-90">
          <X size={18} className="text-brand-dark dark:text-gray-300" />
        </button>

        <h3 className="font-serif italic text-2xl text-brand-dark dark:text-brand-gold mb-6 text-center pr-4">
          {t('account.change_password') || 'Cambiar Contraseña'}
        </h3>

        {success ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4 text-green-600 dark:text-green-400">
              <Check size={32} />
            </div>
            <p className="font-bold text-sm text-brand-dark dark:text-gray-200">
              {t('account.success_save') || '¡Configuración guardada!'}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input 
                type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder={t('auth.password') || 'Nueva Contraseña'}
                className="w-full bg-white dark:bg-[#121212] border border-brand-gold/20 dark:border-brand-gold/30 text-brand-dark dark:text-gray-200 text-sm font-bold rounded-2xl px-5 py-4 outline-none focus:border-brand-dark-blue dark:focus:border-brand-gold transition-colors"
              />
            </div>
            <div>
              <input 
                type="password" required value={confirm} onChange={(e) => setConfirm(e.target.value)}
                placeholder={t('auth.confirm_password') || 'Confirmar Contraseña'}
                className="w-full bg-white dark:bg-[#121212] border border-brand-gold/20 dark:border-brand-gold/30 text-brand-dark dark:text-gray-200 text-sm font-bold rounded-2xl px-5 py-4 outline-none focus:border-brand-dark-blue dark:focus:border-brand-gold transition-colors"
              />
            </div>

            {errorMsg && <p className="text-red-500 text-xs text-center font-bold px-2">{errorMsg}</p>}

            <button 
              type="submit" disabled={loading}
              className="w-full bg-brand-dark-blue dark:bg-brand-gold text-white dark:text-[#121212] py-4 rounded-full font-bold text-[11px] uppercase tracking-widest active:scale-95 transition-all shadow-lg mt-4 disabled:opacity-50"
            >
              {loading ? (t('common.loading') || 'Cargando...') : (t('account.save_config') || 'Guardar')}
            </button>
          </form>
        )}
      </motion.div>
    </motion.div>
  );
}