"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { LogOut, Moon, Sun, Type, Check, X, Edit3, KeyRound, Save } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

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
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  
  // Datos del usuario (Solo lectura)
  const [userEmail, setUserEmail] = useState<string>('');
  const [username, setUsername] = useState<string>('');
  
  // Configuraciones (Editables)
  const [selectedAvatar, setSelectedAvatar] = useState<string>(AVATARS[0]);
  const [nightMode, setNightMode] = useState<boolean>(false);
  const [fontSize, setFontSize] = useState<string>('text-base');

  // UI States
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        setUserId(user.id);
        setUserEmail(user.email ?? '');

        // Buscar perfil en la base de datos
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();

        if (profile) {
          setUsername(profile.username || 'Usuario');
          setSelectedAvatar(profile.avatar_url || AVATARS[0]);
          setNightMode(profile.night_mode || false);
          setFontSize(profile.font_size || 'text-base');
        }
      }
      setLoading(false);
    }
    loadProfile();
  }, []);

  const handleSave = async () => {
    if (!userId) return;
    setSaving(true);
    setMessage('');

    try {
      // Guardar configuraciones en Supabase
      const { error } = await supabase.from('profiles').upsert({
        id: userId,
        username: username, // Mantenemos el mismo porque no se edita aquí
        avatar_url: selectedAvatar,
        font_size: fontSize,
        night_mode: nightMode,
        updated_at: new Date().toISOString(),
      });

      if (error) throw error;

      // Guardar en localStorage para acceso instantáneo
      localStorage.setItem('apapacho_avatar', selectedAvatar);
      localStorage.setItem('apapacho_nightMode', String(nightMode));
      localStorage.setItem('apapacho_fontSize', fontSize);

      setMessage('¡Configuración guardada con éxito!');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      console.error(err);
      setMessage('Error al guardar. Intenta de nuevo.');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!userEmail) return;
    const { error } = await supabase.auth.resetPasswordForEmail(userEmail);
    if (error) {
      setMessage('Error al enviar el correo de recuperación.');
    } else {
      setMessage('Te enviamos un correo para cambiar tu contraseña.');
    }
    setTimeout(() => setMessage(''), 4000);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/'); 
  };

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-brand-bg">
      <div className="w-8 h-8 border-4 border-brand-gold border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-brand-bg px-6 pb-32 pt-12 relative overflow-hidden">
      
      {/* HEADER Y AVATAR */}
      <header className="mb-10 text-center flex flex-col items-center relative">
        <div className="relative w-28 h-28 rounded-full mb-3 shadow-lg border-2 border-brand-gold/50 overflow-hidden bg-brand-blue-bg">
          <img src={selectedAvatar} alt="Mi Avatar" className="w-full h-full object-cover" />
        </div>
        
        {/* BOTÓN EXPLÍCITO PARA CAMBIAR AVATAR */}
        <button 
          onClick={() => setShowAvatarModal(true)}
          className="flex items-center gap-2 bg-brand-gold/10 text-brand-gold px-4 py-2 rounded-full active:scale-95 transition-transform mb-6"
        >
          <Edit3 size={14} />
          <span className="text-[10px] font-bold uppercase tracking-widest">Cambiar Avatar</span>
        </button>

        <h1 className="text-3xl font-serif italic text-brand-dark mb-1">Mi Perfil</h1>
      </header>

      {/* DATOS DEL USUARIO (SOLO LECTURA) */}
      <div className="mb-8 space-y-4">
        <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-dark/50 ml-2">Datos Personales</h2>
        
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-brand-gold/5 space-y-5">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-brand-gold mb-2">Nombre de Usuario</label>
            <div className="w-full bg-gray-50 border border-gray-100 rounded-xl py-3 px-4 text-brand-dark/70 font-bold text-sm">
              {username || 'No especificado'}
            </div>
          </div>
          
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-brand-gold mb-2">Correo Electrónico</label>
            <div className="w-full bg-gray-50 border border-gray-100 rounded-xl py-3 px-4 text-brand-dark/70 font-bold text-sm">
              {userEmail}
            </div>
          </div>

          <button 
            onClick={handlePasswordReset}
            className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-brand-dark hover:text-brand-gold transition-colors pt-2"
          >
            <KeyRound size={16} /> Cambiar Contraseña
          </button>
        </div>
      </div>

      {/* PREFERENCIAS DE LECTURA */}
      <div className="mb-8">
        <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-dark/50 mb-4 ml-2">Preferencias de Lectura</h2>
        <div className="bg-white rounded-3xl p-2 shadow-sm border border-brand-gold/5">
          
          {/* Tamaño de Letra */}
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3 text-brand-dark/70">
              <Type size={20} />
              <span className="font-bold text-[12px] uppercase tracking-widest">Tamaño</span>
            </div>
            <div className="flex gap-2">
              {FONT_SIZES.map((fs) => (
                <button
                  key={fs.id}
                  onClick={() => setFontSize(fs.id)}
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                    fontSize === fs.id ? 'bg-brand-gold text-white shadow-md' : 'bg-gray-100 text-brand-dark'
                  }`}
                  style={{ fontSize: fs.size }}
                >
                  {fs.label}
                </button>
              ))}
            </div>
          </div>

          <div className="h-px bg-brand-gold/5 mx-4" />

          {/* Modo Nocturno */}
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3 text-brand-dark/70">
              {nightMode ? <Moon size={20} /> : <Sun size={20} />}
              <span className="font-bold text-[12px] uppercase tracking-widest">Modo Nocturno</span>
            </div>
            <button 
              onClick={() => setNightMode(!nightMode)}
              className={`w-12 h-6 rounded-full p-1 transition-colors ${nightMode ? 'bg-brand-gold' : 'bg-gray-200'}`}
            >
              <div className={`w-4 h-4 rounded-full bg-white transition-transform ${nightMode ? 'translate-x-6' : 'translate-x-0'}`} />
            </button>
          </div>

        </div>
      </div>

      {/* MENSAJE DE ESTADO */}
      {message && (
        <div className="text-center mb-4 text-[11px] font-bold text-brand-gold uppercase tracking-widest">
          {message}
        </div>
      )}

      {/* BOTÓN GUARDAR */}
      <button 
        onClick={handleSave}
        disabled={saving}
        className="w-full flex items-center justify-center gap-2 bg-brand-gold text-white py-4 rounded-2xl font-bold text-[12px] uppercase tracking-widest shadow-lg shadow-brand-gold/20 active:scale-95 transition-all mb-6"
      >
        <Save size={18} />
        {saving ? 'Guardando...' : 'Guardar Configuración'}
      </button>

      {/* BOTÓN CERRAR SESIÓN */}
      <button 
        onClick={handleSignOut}
        className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-[11px] uppercase tracking-widest text-red-400 border border-red-100 bg-white active:scale-95 transition-all"
      >
        <LogOut size={16} /> Cerrar Sesión
      </button>

      {/* MODAL DE AVATARES */}
      <AnimatePresence>
        {showAvatarModal && (
          <motion.div 
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-50 bg-brand-bg flex flex-col p-6"
          >
            <div className="flex justify-between items-center mb-8 mt-6">
              <h2 className="text-2xl font-serif italic text-brand-dark">Elige tu Avatar</h2>
              <button onClick={() => setShowAvatarModal(false)} className="p-2 active:scale-90 bg-white rounded-full shadow-sm">
                <X size={24} className="text-brand-dark" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {AVATARS.map((av) => (
                <div 
                  key={av}
                  onClick={() => {
                    setSelectedAvatar(av);
                    setShowAvatarModal(false); // Cierra automáticamente al elegir
                  }}
                  className={`relative aspect-square rounded-2xl overflow-hidden cursor-pointer shadow-sm transition-transform active:scale-95 ${
                    selectedAvatar === av ? 'border-4 border-brand-gold' : 'border-2 border-transparent'
                  }`}
                >
                  <img src={av} alt="Avatar option" className="w-full h-full object-cover bg-brand-blue-bg" />
                  {selectedAvatar === av && (
                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                      <Check className="text-white drop-shadow-md" size={32} />
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            <p className="text-center mt-auto pb-10 text-[10px] uppercase tracking-widest text-brand-dark/40 font-bold">
              Toca un avatar para seleccionarlo.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}