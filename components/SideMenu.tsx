"use client";

import { useEffect, useMemo } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Home, BookOpen, User, LogOut, ChevronRight, Globe, Instagram, Languages } from 'lucide-react';

import { useLanguage } from '@/hooks/useLanguage';
import { AuthService } from '@/services/authService';
import { PreferencesService, SupportedLanguage } from '@/lib/preferences';

// ==========================================
// INTERFACES Y CONSTANTES
// ==========================================
interface SideMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

// 🌟 Alineamos con las rutas seguras del NavigationWrapper
const VALID_ROUTES = ['/home', '/lecturas', '/cuenta'];

// ==========================================
// COMPONENTE PRINCIPAL
// ==========================================
export default function SideMenu({ isOpen, onClose }: SideMenuProps) {
  const pathname = usePathname();
  const router = useRouter();
  
  const { t, lang, setLang, isReady } = useLanguage();

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const handleNavigation = (path: string) => {
    onClose();
    
    if (path.startsWith('http')) {
      window.open(path, '_blank');
      return;
    }

    if (pathname !== path) {
      router.push(path);
      // 🌟 Delegamos la responsabilidad de guardar el LastRoute al NavigationWrapper
      // para evitar colisiones y condiciones de carrera.
    }
  };

  const handleLogout = async () => {
    try {
      await AuthService.signOut();
      PreferencesService.clearEphemeralState();
      onClose();
      router.push('/');
    } catch (error) {
      console.error("[SideMenu] Error al cerrar sesión:", error);
    }
  };

  const handleLanguageChange = (nextLang: SupportedLanguage) => {
    if (nextLang === lang) {
      onClose();
      return;
    }

    // 🌟 Validación estricta: Solo salvamos la ruta antes del reload si es segura.
    // Esto evita que un reload en /leer (sin ID) rompa el bootstrap futuro.
    if (pathname && VALID_ROUTES.includes(pathname)) {
      PreferencesService.setLastRoute(pathname);
    }
    
    setLang(nextLang);
    onClose();

    // Forzar actualización global tras el cambio
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        window.location.reload();
      });
    });
  };

  const MENU_ITEMS = useMemo(() => [
    { icon: Home, label: isReady ? t('menu.home') : 'Catálogo', path: '/home' },
    { icon: BookOpen, label: isReady ? t('menu.readings') : 'Mis Lecturas', path: '/lecturas' },
    { icon: User, label: isReady ? t('menu.account') : 'Mi Cuenta', path: '/cuenta' },
    { icon: Globe, label: 'Web', path: 'https://editorialapapacho.com' }, 
    { icon: Instagram, label: 'Instagram', path: 'https://instagram.com/editorial.apapacho' }, 
  ], [t, isReady]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] overflow-hidden">
          
          {/* BACKDROP */}
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            transition={{ duration: 0.2 }}
            onClick={onClose} 
            className="absolute inset-0 bg-black/40 backdrop-blur-sm" 
          />

          {/* PANEL LATERAL */}
          <motion.div 
            initial={{ x: '100%' }} 
            animate={{ x: '0%' }} 
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="absolute inset-y-0 right-0 w-[85%] max-w-sm bg-[#F9F9F7] dark:bg-[#1A1A1A] shadow-2xl flex flex-col border-l border-brand-gold/10 transition-colors duration-500 z-[90]"
          >
            {/* HEADER DEL MENÚ */}
            <div className="p-6 border-b border-brand-gold/10 flex justify-between items-center shrink-0" style={{ paddingTop: 'calc(1.5rem + env(safe-area-inset-top))' }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-brand-gold/10 rounded-full flex items-center justify-center">
                  <User size={20} className="text-brand-gold" />
                </div>
                <span className="font-serif italic text-xl text-brand-dark dark:text-gray-200">
                  {isReady ? (t('menu.title') || 'Menú') : 'Menú'}
                </span>
              </div>
              <button onClick={onClose} className="p-2 active:scale-90 transition-transform bg-white dark:bg-black/30 rounded-full shadow-sm">
                <X size={28} className="text-brand-dark dark:text-gray-300 transition-colors" />
              </button>
            </div>

            {/* ENLACES DE NAVEGACIÓN */}
            <div className="flex-grow overflow-y-auto p-6 space-y-2">
              {MENU_ITEMS.map((item) => (
                <button 
                  key={item.path} 
                  onClick={() => handleNavigation(item.path)}
                  className="w-full flex items-center justify-between p-4 rounded-xl active:bg-brand-gold/5 group transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <item.icon size={22} className="text-brand-gold" />
                    <span className="font-bold text-sm uppercase tracking-widest text-brand-dark dark:text-gray-300 transition-colors">
                      {item.label}
                    </span>
                  </div>
                  <ChevronRight size={16} className="text-brand-gold/30" />
                </button>
              ))}
            </div>

            {/* FOOTER: SELECTOR DE IDIOMA Y LOGOUT */}
            <div className="p-8 border-t border-brand-gold/5 shrink-0 space-y-8" style={{ paddingBottom: 'calc(2rem + env(safe-area-inset-bottom))' }}>
              
              {/* SELECTOR DE IDIOMA */}
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2 text-brand-dark dark:text-gray-400 pl-4">
                  <Languages size={18} className="text-brand-gold" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">
                    {isReady ? (t('menu.language') || 'Idioma / Language') : 'Idioma / Language'}
                  </span>
                </div>
                <div className="flex bg-gray-100 dark:bg-black/40 rounded-full p-1 transition-colors">
                  {(['es', 'en', 'pt'] as SupportedLanguage[]).map((l) => (
                    <button 
                      key={l}
                      onClick={() => handleLanguageChange(l)}
                      className={`flex-1 py-2 rounded-full text-[11px] font-bold uppercase tracking-widest transition-all ${lang === l ? 'bg-white dark:bg-[#2A2A2A] text-brand-dark dark:text-brand-gold shadow-sm' : 'text-gray-400 dark:text-gray-500'}`}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </div>

              {/* BOTÓN DE CERRAR SESIÓN */}
              <button 
                onClick={handleLogout}
                className="w-full flex items-center gap-4 p-4 text-brand-red hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl active:scale-95 transition-all"
              >
                <LogOut size={22} />
                <span className="font-bold text-sm uppercase tracking-widest">
                  {isReady ? (t('menu.sign_out') || 'Cerrar sesión') : 'Cerrar sesión'}
                </span>
              </button>
              
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}