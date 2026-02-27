"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { Mail, Lock, User, Check, X } from 'lucide-react';

const AVATARS = [
  '/avatar/avatar-1.png',
  '/avatar/avatar-2.png',
  '/avatar/avatar-3.png',
  '/avatar/avatar-4.png',
  '/avatar/avatar-5.png',
  '/avatar/avatar-6.png',
];

export default function AuthPage() {
  const router = useRouter();
  
  // Vistas: 'login' | 'register' | 'complete_profile'
  const [view, setView] = useState<'login' | 'register' | 'complete_profile'>('login');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  // Datos del Usuario Autenticado (para el flujo de Google)
  const [authUserId, setAuthUserId] = useState('');

  // Estados para Login
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Estados para Registro y Completar Perfil
  const [selectedAvatar, setSelectedAvatar] = useState('');
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [dob, setDob] = useState('');
  const [country, setCountry] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showAvatarModal, setShowAvatarModal] = useState(false);

  // VIGILANTE DE SESIÓN (Detecta cuando alguien entra con Google)
  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        // Alguien inició sesión (puede ser con Google o normal). Revisamos si ya tiene perfil.
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', session.user.id)
          .maybeSingle();

        if (profile) {
          // Ya tiene cuenta completa, lo mandamos al home
          router.push('/home');
        } else {
          // Es un usuario NUEVO que entró con Google. 
          // Rescatamos los datos que Google sí nos dio.
          setAuthUserId(session.user.id);
          setRegEmail(session.user.email || '');
          setFullName(session.user.user_metadata?.full_name || '');
          
          // Lo mandamos a la vista de completar lo que falta
          setView('complete_profile');
        }
      }
    });

    return () => { authListener.subscription.unsubscribe(); };
  }, [router]);

  // Validar edad
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
    const { error } = await supabase.auth.signInWithPassword({ email: loginEmail, password: loginPassword });
    if (error) {
      setErrorMsg('Correo o contraseña incorrectos.');
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setErrorMsg('');

    if (!selectedAvatar || !username || !fullName || !dob || !country || !regEmail || !regPassword || !confirmPassword) {
      setErrorMsg('Todos los campos son obligatorios.');
      setLoading(false); return;
    }
    if (regPassword !== confirmPassword) {
      setErrorMsg('Las contraseñas no coinciden.');
      setLoading(false); return;
    }
    if (!isOldEnough(dob)) {
      setErrorMsg('Debes tener al menos 14 años para unirte.');
      setLoading(false); return;
    }

    const { data: authData, error: authError } = await supabase.auth.signUp({ email: regEmail, password: regPassword });
    if (authError) {
      setErrorMsg(authError.message);
      setLoading(false); return;
    }

    if (authData.user) {
      await saveProfileData(authData.user.id);
    }
  };

  // Guardar datos después de Google
  const handleCompleteProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setErrorMsg('');

    if (!selectedAvatar || !username || !dob || !country) {
      setErrorMsg('Por favor completa todos los campos obligatorios.');
      setLoading(false); return;
    }
    if (!isOldEnough(dob)) {
      setErrorMsg('Debes tener al menos 14 años para unirte.');
      setLoading(false); return;
    }

    await saveProfileData(authUserId);
  };

  const saveProfileData = async (userId: string) => {
    const { error } = await supabase.from('profiles').upsert({
      id: userId,
      username,
      full_name: fullName,
      dob,
      country,
      avatar_url: selectedAvatar,
      font_size: 'text-base',
      night_mode: false,
    });
    if (error) console.error(error);
    router.push('/home');
  };

  const handleGoogleLogin = async () => {
    // Esto enviará al usuario a Google. Cuando vuelva, el useEffect de arriba lo atajará.
    await supabase.auth.signInWithOAuth({ provider: 'google' });
  };

  return (
    <div className="min-h-screen bg-[#F9F9F7] flex flex-col items-center justify-center p-6 relative">
      <motion.img 
        initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        src="/logo-nuevo.png" alt="Apapacho Logo" 
        className="w-48 object-contain mb-8 drop-shadow-sm" 
      />

      <div className="w-full max-w-md bg-white p-8 rounded-[2rem] shadow-xl border border-brand-gold/10">
        
        {view !== 'complete_profile' && (
          <div className="flex bg-gray-100 rounded-full p-1 mb-8">
            <button 
              type="button" onClick={() => { setView('login'); setErrorMsg(''); }}
              className={`flex-1 py-2 rounded-full text-[11px] font-bold uppercase tracking-widest transition-all ${view === 'login' ? 'bg-white text-brand-dark shadow-sm' : 'text-gray-400'}`}
            >
              Iniciar Sesión
            </button>
            <button 
              type="button" onClick={() => { setView('register'); setErrorMsg(''); }}
              className={`flex-1 py-2 rounded-full text-[11px] font-bold uppercase tracking-widest transition-all ${view === 'register' ? 'bg-white text-brand-dark shadow-sm' : 'text-gray-400'}`}
            >
              Crear Cuenta
            </button>
          </div>
        )}

        {view === 'complete_profile' && (
          <div className="text-center mb-6">
            <h2 className="text-2xl font-serif italic text-brand-dark mb-2">¡Casi listo!</h2>
            <p className="text-[11px] font-bold uppercase tracking-widest text-brand-gold">
              Solo necesitamos unos datos más para tu cuenta de Google.
            </p>
          </div>
        )}

        {errorMsg && (
          <div className="bg-red-50 text-red-500 text-[11px] p-3 rounded-xl mb-6 font-bold uppercase tracking-widest text-center border border-red-100">
            {errorMsg}
          </div>
        )}

        {/* ----------------- LOGIN NORMAL ----------------- */}
        {view === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="email" placeholder="Correo Electrónico" required
                value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)}
                className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-4 pl-12 pr-4 text-sm focus:outline-none focus:border-brand-gold transition-colors text-brand-dark"
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="password" placeholder="Contraseña" required
                value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)}
                className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-4 pl-12 pr-4 text-sm focus:outline-none focus:border-brand-gold transition-colors text-brand-dark"
              />
            </div>
            <button disabled={loading} className="w-full bg-brand-gold text-white py-4 rounded-2xl font-bold text-[12px] uppercase tracking-widest shadow-lg shadow-brand-gold/20 active:scale-95 transition-all mt-6">
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
            <DividerGoogle onClick={handleGoogleLogin} />
          </form>
        )}

        {/* ----------------- REGISTRO NORMAL ----------------- */}
        {view === 'register' && (
          <form onSubmit={handleRegister} className="space-y-4">
            <AvatarSelector selected={selectedAvatar} onSelect={() => setShowAvatarModal(true)} />
            <div className="grid grid-cols-2 gap-3">
              <Input placeholder="Usuario" value={username} onChange={setUsername} />
              <Input placeholder="País" value={country} onChange={setCountry} />
            </div>
            <Input placeholder="Nombre Completo" value={fullName} onChange={setFullName} />
            <DateInput value={dob} onChange={setDob} />
            <Input placeholder="Correo Electrónico" type="email" value={regEmail} onChange={setRegEmail} />
            <Input placeholder="Contraseña" type="password" value={regPassword} onChange={setRegPassword} />
            <Input placeholder="Confirmar Contraseña" type="password" value={confirmPassword} onChange={setConfirmPassword} />
            <button disabled={loading} className="w-full bg-brand-dark-blue text-white py-4 rounded-2xl font-bold text-[12px] uppercase tracking-widest shadow-lg shadow-brand-dark-blue/20 active:scale-95 transition-all mt-4">
              {loading ? 'Creando...' : 'Crear Cuenta'}
            </button>
            <DividerGoogle onClick={handleGoogleLogin} />
          </form>
        )}

        {/* ----------------- COMPLETAR PERFIL (GOOGLE) ----------------- */}
        {view === 'complete_profile' && (
          <form onSubmit={handleCompleteProfile} className="space-y-4">
            <AvatarSelector selected={selectedAvatar} onSelect={() => setShowAvatarModal(true)} />
            
            {/* Estos campos los llenó Google, se los mostramos deshabilitados */}
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 mb-4 opacity-70">
              <p className="text-[10px] uppercase font-bold text-gray-400 tracking-widest mb-1">Vinculado con Google</p>
              <p className="text-sm font-bold text-brand-dark">{fullName}</p>
              <p className="text-sm text-gray-500">{regEmail}</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Input placeholder="Usuario único" value={username} onChange={setUsername} />
              <Input placeholder="País" value={country} onChange={setCountry} />
            </div>
            <DateInput value={dob} onChange={setDob} />

            <button disabled={loading} className="w-full bg-brand-gold text-white py-4 rounded-2xl font-bold text-[12px] uppercase tracking-widest shadow-lg active:scale-95 transition-all mt-4">
              {loading ? 'Guardando...' : 'Finalizar Registro'}
            </button>
          </form>
        )}
      </div>

      {/* MODAL DE AVATARES */}
      <AnimatePresence>
        {showAvatarModal && (
          <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="fixed inset-0 z-50 bg-[#F9F9F7] flex flex-col p-6">
            <div className="flex justify-between items-center mb-8 mt-6">
              <h2 className="text-2xl font-serif italic text-brand-dark">Elige tu Avatar</h2>
              <button type="button" onClick={() => setShowAvatarModal(false)} className="p-2 active:scale-90 bg-white rounded-full shadow-sm"><X size={24} className="text-brand-dark" /></button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {AVATARS.map((av) => (
                <div key={av} onClick={() => { setSelectedAvatar(av); setShowAvatarModal(false); }} className={`relative aspect-square rounded-2xl overflow-hidden cursor-pointer shadow-sm transition-transform active:scale-95 ${selectedAvatar === av ? 'border-4 border-brand-gold' : 'border-2 border-transparent'}`}>
                  <img src={av} alt="Avatar option" className="w-full h-full object-cover bg-brand-blue-bg" />
                  {selectedAvatar === av && <div className="absolute inset-0 bg-black/20 flex items-center justify-center"><Check className="text-white drop-shadow-md" size={32} /></div>}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ---- Mini componentes para limpiar el código visualmente ----

function AvatarSelector({ selected, onSelect }: { selected: string, onSelect: () => void }) {
  return (
    <div className="flex flex-col items-center mb-6">
      <div className="relative w-24 h-24 rounded-full shadow-inner border-2 border-dashed border-gray-300 bg-gray-50 flex items-center justify-center overflow-hidden mb-3">
        {selected ? <img src={selected} alt="Avatar" className="w-full h-full object-cover" /> : <User size={32} className="text-gray-300" />}
      </div>
      <button type="button" onClick={onSelect} className="text-[10px] font-bold uppercase tracking-widest text-brand-gold bg-brand-gold/10 px-4 py-2 rounded-full active:scale-95 transition-transform">
        {selected ? 'Cambiar Avatar' : 'Elegir Avatar'}
      </button>
    </div>
  );
}

function Input({ placeholder, type = "text", value, onChange }: any) {
  return (
    <input type={type} placeholder={placeholder} required value={value} onChange={(e) => onChange(e.target.value)}
      className="w-full bg-gray-50 border border-gray-100 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-brand-gold transition-colors text-brand-dark"
    />
  );
}

function DateInput({ value, onChange }: any) {
  return (
    <div className="relative">
      <label className="absolute left-4 top-1/2 -translate-y-1/2 text-[10px] uppercase font-bold text-gray-400 tracking-widest pointer-events-none">Nacimiento</label>
      <input type="date" required value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full bg-gray-50 border border-gray-100 rounded-xl py-3 pl-[100px] pr-4 text-sm focus:outline-none focus:border-brand-gold transition-colors text-brand-dark"
      />
    </div>
  );
}

function DividerGoogle({ onClick }: { onClick: () => void }) {
  return (
    <>
      <div className="relative flex items-center py-4">
        <div className="flex-grow border-t border-gray-200"></div>
        <span className="flex-shrink-0 mx-4 text-gray-400 text-[10px] uppercase tracking-widest font-bold">O continúa con</span>
        <div className="flex-grow border-t border-gray-200"></div>
      </div>
      <button type="button" onClick={onClick} className="w-full flex items-center justify-center gap-3 bg-white border-2 border-gray-100 text-brand-dark py-4 rounded-2xl font-bold text-[12px] uppercase tracking-widest active:scale-95 transition-all">
        <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5" /> Google
      </button>
    </>
  );
}