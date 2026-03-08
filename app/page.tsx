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

  // --- SISTEMA BLINDADO DE AUTO-RECUPERACIÓN ---
  useEffect(() => {
    let isMounted = true;

    const checkCurrentSession = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        // Si hay un error al leer la caché, lanzamos el error para que el catch lo limpie
        if (sessionError) throw sessionError;
        
        if (session?.user && isMounted) {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('id')
            .eq('id', session.user.id)
            .maybeSingle();

          if (profileError && profileError.code !== 'PGRST116') {
             console.error("Error validando perfil:", profileError);
          }

          if (profile) {
            const lastRoute = localStorage.getItem('apapacho_last_route') || '/home';
            router.push(lastRoute);
            // Mantenemos la pantalla de carga 1 segundito más para que la transición sea suave
            setTimeout(() => { if (isMounted) setIsCheckingSession(false); }, 1000);
            return; 
          } else {
            setAuthUserId(session.user.id);
            setRegEmail(session.user.email || '');
            setFullName(session.user.user_metadata?.full_name || '');
            setView('complete_profile');
          }
        }
      } catch (error) {
        console.error("Caché corrupta detectada, forzando limpieza...", error);
        // MAGIA: Si la sesión está trabada, esto limpia la basura del teléfono
        await supabase.auth.signOut(); 
      }
      
      // Si todo sale bien o si la caché se limpió, apagamos la carga
      if (isMounted) {
        setIsCheckingSession(false); 
      }
    };

    checkCurrentSession();

    // SALVAVIDAS EXTREMO: Si pasan 7 segundos y la app sigue cargando (por mal internet, etc), 
    // forzamos a que aparezca la pantalla de login. ¡Adiós cargas infinitas!
    const fallbackTimer = setTimeout(() => {
      if (isMounted) setIsCheckingSession(false);
    }, 7000);

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session?.user && isMounted) {
        setIsCheckingSession(true); 
        checkCurrentSession();
      }
    });

    return () => { 
      isMounted = false;
      clearTimeout(fallbackTimer);
      authListener.subscription.unsubscribe(); 
    };
  }, [router]);
  // ----------------------------------------------

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

    const missing: string[] = [];
    if (!selectedAvatar) missing.push('Avatar');
    if (!username) missing.push('Usuario');
    if (!fullName) missing.push('Nombre Completo');
    if (!dob) missing.push('Fecha de Nacimiento');
    if (!country) missing.push('País');
    if (!regEmail) missing.push('Correo Electrónico');
    if (!regPassword) missing.push('Contraseña');
    if (!confirmPassword) missing.push('Confirmar Contraseña');

    if (missing.length > 0) {
      setMissingFields(missing);
      setShowValidationModal(true);
      setLoading(false); 
      return;
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

    const missing: string[] = [];
    if (!selectedAvatar) missing.push('Avatar');
    if (!username) missing.push('Usuario único');
    if (!dob) missing.push('Fecha de Nacimiento');
    if (!country) missing.push('País');

    if (missing.length > 0) {
      setMissingFields(missing);
      setShowValidationModal(true);
      setLoading(false); 
      return;
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

  if (isCheckingSession) {
    return (
      <div className="min-h-[100dvh] bg-[#F9F9F7] dark:bg-[#121212] flex flex-col items-center justify-center p-6 transition-colors duration-500">
        <motion.img 
          initial={{ opacity: 0.5, scale: 0.95 }} 
          animate={{ opacity: 1, scale: 1 }} 
          transition={{ repeat: Infinity, duration: 1, repeatType: "reverse" }}
          src="/logo-nuevo.png" alt="Cargando Apapacho..." 
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
              Iniciar Sesión
            </button>
            <button 
              type="button" onClick={() => { setView('register'); setErrorMsg(''); }}
              className={`flex-1 py-2 rounded-full text-[11px] font-bold uppercase tracking-widest transition-all ${view === 'register' ? 'bg-white dark:bg-[#2A2A2A] text-brand-dark dark:text-brand-gold shadow-sm' : 'text-gray-400 dark:text-gray-500'}`}
            >
              Crear Cuenta
            </button>
          </div>
        )}

        {view === 'complete_profile' && (
          <div className="text-center mb-6">
            <h2 className="text-2xl font-serif italic text-brand-dark dark:text-gray-200 mb-2 transition-colors">¡Casi listo!</h2>
            <p className="text-[11px] font-bold uppercase tracking-widest text-brand-gold">
              Solo necesitamos unos datos más para tu cuenta de Google.
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
            <GoogleButtonTop onClick={handleGoogleLogin} />
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" size={18} />
              <input 
                type="email" placeholder="Correo Electrónico" required
                value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)}
                className="w-full bg-gray-50 dark:bg-black/30 border border-gray-100 dark:border-white/5 rounded-2xl py-4 pl-12 pr-4 text-sm focus:outline-none focus:border-brand-gold transition-colors text-brand-dark dark:text-gray-200"
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" size={18} />
              <input 
                type="password" placeholder="Contraseña" required
                value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)}
                className="w-full bg-gray-50 dark:bg-black/30 border border-gray-100 dark:border-white/5 rounded-2xl py-4 pl-12 pr-4 text-sm focus:outline-none focus:border-brand-gold transition-colors text-brand-dark dark:text-gray-200"
              />
            </div>
            <button disabled={loading} className="w-full bg-brand-gold text-white py-4 rounded-2xl font-bold text-[12px] uppercase tracking-widest shadow-lg shadow-brand-gold/20 active:scale-95 transition-all mt-6">
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
        )}

        {view === 'register' && (
          <form onSubmit={handleRegister} className="space-y-4">
            <GoogleButtonTop onClick={handleGoogleLogin} />
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
            <button disabled={loading} className="w-full bg-brand-dark-blue dark:bg-brand-gold text-white dark:text-brand-dark py-4 rounded-2xl font-bold text-[12px] uppercase tracking-widest shadow-lg shadow-brand-dark-blue/20 active:scale-95 transition-all mt-4">
              {loading ? 'Creando...' : 'Crear Cuenta'}
            </button>
          </form>
        )}

        {view === 'complete_profile' && (
          <form onSubmit={handleCompleteProfile} className="space-y-4">
            <AvatarSelector selected={selectedAvatar} onSelect={() => setShowAvatarModal(true)} />
            
            <div className="bg-gray-50 dark:bg-black/30 p-4 rounded-xl border border-gray-100 dark:border-white/5 mb-4 opacity-70 transition-colors">
              <p className="text-[10px] uppercase font-bold text-gray-400 tracking-widest mb-1">Vinculado con Google</p>
              <p className="text-sm font-bold text-brand-dark dark:text-gray-200">{fullName}</p>
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
            className="fixed inset-0 z-[60] bg-[#F9F9F7] dark:bg-[#121212] flex flex-col p-6 transition-colors duration-500"
            style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}
          >
            <div className="flex justify-between items-center mb-8 mt-6">
              <h2 className="text-2xl font-serif italic text-brand-dark dark:text-brand-gold transition-colors">Elige tu Avatar</h2>
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
              <h3 className="text-2xl font-serif italic text-brand-dark dark:text-brand-gold mb-2">Faltan datos</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 font-texto">Por favor, completa los siguientes campos para continuar:</p>
              <ul className="space-y-2 mb-8">
                {missingFields.map(field => (
                  <li key={field} className="text-[11px] font-bold uppercase tracking-widest text-brand-dark-blue dark:text-brand-gold bg-brand-dark-blue/5 dark:bg-brand-gold/10 px-4 py-3 rounded-xl flex items-center gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-brand-dark-blue dark:bg-brand-gold" />
                    {field}
                  </li>
                ))}
              </ul>
              <button type="button" onClick={() => setShowValidationModal(false)} className="w-full py-4 bg-brand-gold text-white rounded-2xl font-bold text-[12px] uppercase tracking-widest shadow-lg active:scale-95 transition-transform">
                Entendido
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

function GoogleButtonTop({ onClick }: { onClick: () => void }) {
  return (
    <div className="mb-2">
      <button type="button" onClick={onClick} className="w-full flex items-center justify-center gap-3 bg-white dark:bg-[#1A1A1A] border-2 border-gray-100 dark:border-white/5 text-brand-dark dark:text-gray-200 py-4 rounded-2xl font-bold text-[12px] uppercase tracking-widest active:scale-95 transition-all shadow-sm hover:bg-gray-50 dark:hover:bg-white/5">
        <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5" /> Continuar con Google
      </button>
      <div className="relative flex items-center py-6">
        <div className="flex-grow border-t border-gray-200 dark:border-white/10 transition-colors"></div>
        <span className="flex-shrink-0 mx-4 text-gray-400 dark:text-gray-500 text-[10px] uppercase tracking-widest font-bold transition-colors">O usa tu correo</span>
        <div className="flex-grow border-t border-gray-200 dark:border-white/10 transition-colors"></div>
      </div>
    </div>
  );
}

function AvatarSelector({ selected, onSelect }: { selected: string, onSelect: () => void }) {
  return (
    <div className="flex flex-col items-center mb-6">
      <div className="relative w-24 h-24 rounded-full shadow-inner border-2 border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-black/30 flex items-center justify-center overflow-hidden mb-3 transition-colors">
        {selected ? <img src={selected} alt="Avatar" className="w-full h-full object-cover" /> : <User size={32} className="text-gray-300 dark:text-gray-600" />}
      </div>
      <button type="button" onClick={onSelect} className="text-[10px] font-bold uppercase tracking-widest text-brand-gold bg-brand-gold/10 px-4 py-2 rounded-full active:scale-95 transition-transform">
        {selected ? 'Cambiar Avatar' : 'Elegir Avatar'}
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

function DateInput({ value, onChange }: any) {
  return (
    <div className="relative">
      {!value && (
        <label className="absolute left-4 top-1/2 -translate-y-1/2 text-[10px] uppercase font-bold text-gray-400 dark:text-gray-500 tracking-widest pointer-events-none transition-colors">
          Nacimiento
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
      value={value} 
      onChange={(e) => onChange(e.target.value)}
      className={`w-full bg-gray-50 dark:bg-black/30 border border-gray-100 dark:border-white/5 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-brand-gold transition-colors appearance-none ${!value ? 'text-gray-400 dark:text-gray-500' : 'text-brand-dark dark:text-gray-200'}`}
    >
      <option value="" disabled hidden>Selecciona tu país</option>
      {countries.map(c => (
        <option key={c} value={c} className="text-brand-dark">{c}</option>
      ))}
    </select>
  );
}