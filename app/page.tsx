"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { Mail, Lock, User, Check, X } from 'lucide-react';
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth'; 

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

  useEffect(() => {
    let isMounted = true;

    const checkCurrentSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user && isMounted) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', session.user.id)
          .maybeSingle();

        if (profile) {
          const lastRoute = localStorage.getItem('apapacho_last_route') || '/home';
          router.push(lastRoute);
        } else {
          setAuthUserId(session.user.id);
          setRegEmail(session.user.email || '');
          setFullName(session.user.user_metadata?.full_name || '');
          setView('complete_profile');
        }
      }
    };

    checkCurrentSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session?.user && isMounted) {
        checkCurrentSession();
      }
    });

    return () => { 
      isMounted = false;
      authListener.subscription.unsubscribe(); 
    };
  }, [router]);

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
    try {
      GoogleAuth.initialize();
      const googleUser = await GoogleAuth.signIn();
      const idToken = googleUser.authentication.idToken;
      
      if (idToken) {
        const { error } = await supabase.auth.signInWithIdToken({
          provider: 'google',
          token: idToken,
        });
        
        if (error) throw error;
      }
    } catch (error) {
      console.error("Error nativo:", error);
      setErrorMsg('Error al iniciar sesión con Google.');
    }
  };

  return (
    <div 
      className="min-h-[100dvh] bg-[#F9F9F7] flex flex-col items-center overflow-y-auto px-6"
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

      <div className="w-full max-w-md bg-white p-8 rounded-[2rem] shadow-xl border border-brand-gold/10 mb-4">
        
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

        {view === 'register' && (
          <form onSubmit={handleRegister} className="space-y-4">
            <AvatarSelector selected={selectedAvatar} onSelect={() => setShowAvatarModal(true)} />
            <div className="grid grid-cols-2 gap-3">
              <Input placeholder="Usuario" value={username} onChange={setUsername} />
              <SelectCountry value={country} onChange={setCountry} />
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

        {view === 'complete_profile' && (
          <form onSubmit={handleCompleteProfile} className="space-y-4">
            <AvatarSelector selected={selectedAvatar} onSelect={() => setShowAvatarModal(true)} />
            
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 mb-4 opacity-70">
              <p className="text-[10px] uppercase font-bold text-gray-400 tracking-widest mb-1">Vinculado con Google</p>
              <p className="text-sm font-bold text-brand-dark">{fullName}</p>
              <p className="text-sm text-gray-500">{regEmail}</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Input placeholder="Usuario único" value={username} onChange={setUsername} />
              <SelectCountry value={country} onChange={setCountry} />
            </div>
            <DateInput value={dob} onChange={setDob} />

            <button disabled={loading} className="w-full bg-brand-gold text-white py-4 rounded-2xl font-bold text-[12px] uppercase tracking-widest shadow-lg active:scale-95 transition-all mt-4">
              {loading ? 'Guardando...' : 'Finalizar Registro'}
            </button>
          </form>
        )}
      </div>

      <AnimatePresence>
        {showAvatarModal && (
          <motion.div 
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} 
            transition={{ type: 'spring', damping: 25, stiffness: 200 }} 
            className="fixed inset-0 z-50 bg-[#F9F9F7] flex flex-col p-6"
            style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}
          >
            <div className="flex justify-between items-center mb-8 mt-6">
              <h2 className="text-2xl font-serif italic text-brand-dark">Elige tu Avatar</h2>
              <button type="button" onClick={() => setShowAvatarModal(false)} className="p-2 active:scale-90 bg-white rounded-full shadow-sm"><X size={24} className="text-brand-dark" /></button>
            </div>
            <div className="grid grid-cols-2 gap-4 overflow-y-auto pb-10">
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

// Mini componentes (Mantienen estilos originales)
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
      {!value && (
        <label className="absolute left-4 top-1/2 -translate-y-1/2 text-[10px] uppercase font-bold text-gray-400 tracking-widest pointer-events-none">
          Nacimiento
        </label>
      )}
      <input type="date" required value={value} onChange={(e) => onChange(e.target.value)}
        className={`w-full bg-gray-50 border border-gray-100 rounded-xl py-3 pr-4 text-sm focus:outline-none focus:border-brand-gold transition-colors text-brand-dark ${
          !value ? 'pl-[100px] text-transparent' : 'pl-4 text-brand-dark'
        }`}
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
      <button type="button" onClick={onClick} className="w-full flex items-center justify-center gap-3 bg-white border-2 border-gray-100 text-brand-dark py-4 rounded-2xl font-bold text-[12px] uppercase tracking-widest active:scale-90 transition-all">
        <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5" /> Google
      </button>
    </>
  );
}

function SelectCountry({ value, onChange }: { value: string, onChange: (val: string) => void }) {
  const countries = [
    "Afganistán", "Albania", "Alemania", "Andorra", "Angola", "Antigua y Barbuda", 
    "Arabia Saudita", "Argelia", "Argentina", "Armenia", "Australia", "Austria", 
    "Azerbaiyán", "Bahamas", "Bangladés", "Barbados", "Baréin", "Bélgica", "Belice", 
    "Benín", "Bielorrusia", "Birmania", "Bolivia", "Bosnia y Herzegovina", "Botsuana", 
    "Brasil", "Brunéi", "Bulgaria", "Burkina Faso", "Burundi", "Bután", "Cabo Verde", 
    "Camboya", "Camerún", "Canadá", "Catar", "Chad", "Chile", "China", "Chipre", 
    "Ciudad del Vaticano", "Colombia", "Comoras", "Corea del Norte", "Corea del Sur", 
    "Costa de Marfil", "Costa Rica", "Croacia", "Cuba", "Dinamarca", "Dominica", 
    "Ecuador", "Egipto", "El Salvador", "Emiratos Árabes Unidos", "Eritrea", 
    "Eslovaquia", "Eslovenia", "España", "Estados Unidos", "Estonia", "Etiopía", 
    "Fiyi", "Filipinas", "Finlandia", "Francia", "Gabon", "Gambia", "Georgia", 
    "Ghana", "Granada", "Grecia", "Guatemala", "Guinea", "Guinea-Bisáu", 
    "Guinea Ecuatorial", "Guyana", "Haití", "Honduras", "Hungría", "India", 
    "Indonesia", "Irak", "Irán", "Irlanda", "Islandia", "Islas Marshall", 
    "Islas Salomón", "Israel", "Italia", "Jamaica", "Japón", "Jordania", 
    "Kazajistán", "Kenia", "Kiribati", "Kuwait", "Kyrgyzstán", "Laos", "Letonia", 
    "Líbano", "Lesoto", "Liberia", "Libia", "Liechtenstein", "Lituania", 
    "Luxemburgo", "Macedonia del Norte", "Madagascar", "Malasia", "Malaui", 
    "Maldivas", "Mali", "Malta", "Mauritania", "Mauricio", "México", "Moldavia", 
    "Mónaco", "Mongolia", "Montenegro", "Marruecos", " Mozambique", "Myanmar", 
    "Namibia", "Nauru", "Nepal", "Nicaragua", "Níger", "Nigeria", "Noruega", 
    "Nueva Zelanda", "Omán", "Países Bajos", "Pakistán", "Palau", "Panamá", 
    "Papúa Nueva Guinea", "Paraguay", "Perú", "Polonia", "Portugal", "Qatar", 
    "Reino Unido", "República Centroafricana", "República Checa", "República Dominicana", 
    "Ruanda", "Rumania", "Rusia", "San Cristóbal y Nieves", "San Marino", 
    "San Vicente y las Granadinas", "Santo Tomé y Príncipe", "Santa Lucía", "Senegal", 
    "Serbia", "Seychelles", "Sierra Leona", "Singapur", "Siria", "Somalia", 
    "Sudáfrica", "Sudán", "Sudán del Sur", "Surinam", "Suecia", "Suiza", "Tailandia", 
    "Tanzania", "Tayikistán", "Timor Oriental", "Togo", "Tonga", "Trinidad y Tobago", 
    "Túnez", "Turkmenistán", "Turquía", "Tuvalu", "Ucrania", "Uganda", "Uruguay", 
    "Uzbekistán", "Vanuatu", "Venezuela", "Vietnam", "Yemen", "Zambia", "Zimbabue"
  ];

  return (
    <select 
      required 
      value={value} 
      onChange={(e) => onChange(e.target.value)}
      className={`w-full bg-gray-50 border border-gray-100 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-brand-gold transition-colors appearance-none ${!value ? 'text-gray-400' : 'text-brand-dark'}`}
    >
      <option value="" disabled hidden>Selecciona tu país</option>
      {countries.map(c => (
        <option key={c} value={c} className="text-brand-dark">{c}</option>
      ))}
    </select>
  );
}