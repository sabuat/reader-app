"use client";

import { motion } from 'framer-motion';
// 🌟 IMPORTAMOS EL ÍCONO "Languages" PARA EL SELECTOR
import { X, Home, Bookmark, BookOpen, User, LogOut, ChevronRight, Globe, Instagram, Languages } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

// 🌟 IMPORTAMOS EL SERVICIO DE AUTH Y EL HOOK DE IDIOMAS
import { AuthService } from '@/services/authService';
import { useLanguage } from '@/hooks/useLanguage';
// Importamos el tipo Language de nuestro diccionario
import { Language } from '@/lib/i18n/dictionaries'; 

export default function SideMenu({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  
  // 🌟 AHORA TAMBIÉN TRAEMOS `lang` (idioma actual) Y `changeLanguage` (función para cambiarlo)
  const { t, lang, changeLanguage } = useLanguage();

  const menuItems = [
    { icon: Home, label: t('menu.home'), href: '/home' },
    { icon: Bookmark, label: t('menu.my_list'), href: '/lista' },
    { icon: BookOpen, label: t('menu.readings'), href: '/lecturas' },
    { icon: User, label: t('menu.account'), href: '/cuenta' },
    { icon: Globe, label: 'Web', href: 'https://editorialapapacho.com' }, 
    { icon: Instagram, label: 'Instagram', href: 'https://instagram.com/editorial.apapacho' }, 
  ];

  const handleSignOut = async () => {
    try {
      await AuthService.signOut();
      if (onClose) onClose();
      router.push('/');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] overflow-hidden">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      <motion.div 
        initial={{ x: '100%' }} animate={{ x: '0%' }} exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="absolute inset-y-0 right-0 w-[85%] max-w-sm bg-[#F9F9F7] dark:bg-[#1A1A1A] shadow-2xl flex flex-col border-l border-brand-gold/10 transition-colors duration-500"
      >
        <div className="p-6 border-b border-brand-gold/10 flex justify-between items-center shrink-0" style={{ paddingTop: 'calc(1.5rem + env(safe-area-inset-top))' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-brand-gold/10 rounded-full flex items-center justify-center">
              <User size={20} className="text-brand-gold" />
            </div>
            <span className="font-serif italic text-xl text-brand-dark dark:text-gray-200">Menú</span>
          </div>
          <button onClick={onClose} className="p-2 active:scale-90 transition-transform bg-white dark:bg-black/30 rounded-full shadow-sm">
            <X size={28} className="text-brand-dark dark:text-gray-300 transition-colors" />
          </button>
        </div>

        <div className="flex-grow overflow-y-auto p-6 space-y-2">
          {menuItems.map((item) => (
            <Link 
              key={item.href} 
              href={item.href} 
              onClick={onClose}
              className="w-full flex items-center justify-between p-4 rounded-xl active:bg-brand-gold/5 group transition-colors"
            >
              <div className="flex items-center gap-4">
                <item.icon size={22} className="text-brand-gold" />
                <span className="font-bold text-sm uppercase tracking-widest text-brand-dark dark:text-gray-300 transition-colors">{item.label}</span>
              </div>
              <ChevronRight size={16} className="text-brand-gold/30" />
            </Link>
          ))}
        </div>

        {/* 🌟 HEMOS AMPLIADO ESTA SECCIÓN PARA METER EL SELECTOR Y EL BOTÓN DE SALIDA */}
        <div className="p-8 border-t border-brand-gold/5 shrink-0 space-y-8" style={{ paddingBottom: 'calc(2rem + env(safe-area-inset-bottom))' }}>
          
          {/* SELECTOR DE IDIOMA */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 text-brand-dark dark:text-gray-400 pl-4">
              <Languages size={18} className="text-brand-gold" />
              <span className="text-[10px] font-bold uppercase tracking-widest">Idioma / Language</span>
            </div>
            <div className="flex bg-gray-100 dark:bg-black/40 rounded-full p-1 transition-colors">
              {(['es', 'en', 'pt'] as Language[]).map((l) => (
                <button 
                  key={l}
                  onClick={() => changeLanguage(l)}
                  className={`flex-1 py-2 rounded-full text-[11px] font-bold uppercase tracking-widest transition-all ${lang === l ? 'bg-white dark:bg-[#2A2A2A] text-brand-dark dark:text-brand-gold shadow-sm' : 'text-gray-400 dark:text-gray-500'}`}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>

          {/* BOTÓN DE CERRAR SESIÓN */}
          <button 
            onClick={handleSignOut}
            className="w-full flex items-center gap-4 p-4 text-brand-red hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl active:scale-95 transition-all"
          >
            <LogOut size={22} />
            <span className="font-bold text-sm uppercase tracking-widest">{t('menu.sign_out')}</span>
          </button>
          
        </div>
      </motion.div>
    </div>
  );
}