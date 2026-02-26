"use client";

import { motion } from 'framer-motion';
// Asegúrate de que 'X' esté incluido en la importación de lucide-react
import { X, Home, Bookmark, BookOpen, User, LogOut, ChevronRight, Globe } from 'lucide-react';

export default function SideMenu({ onClose }: { onClose: () => void }) {
  const menuItems = [
    { icon: Home, label: 'Home', href: '/' },
    { icon: Bookmark, label: 'Mi lista', href: '/lista' },
    { icon: BookOpen, label: 'Lecturas', href: '/lecturas' },
    { icon: User, label: 'Mi cuenta', href: '/cuenta' },
    { icon: Globe, label: 'Website', href: 'https://editorialapapacho.com' },
  ];

  return (
    <div className="fixed inset-0 z-[60] overflow-hidden">
      {/* Overlay oscuro */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
      />

      {/* Contenedor del Menú (75% ancho) */}
      <motion.div 
        initial={{ x: '100%' }}
        animate={{ x: '0%' }} // Ajustado para que el contenedor ocupe su ancho real desde la derecha
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="absolute inset-y-0 right-0 w-[75%] bg-brand-bg shadow-2xl flex flex-col border-l border-brand-gold/10"
      >
        {/* Header del Menú */}
        <div className="p-6 flex justify-end border-b border-brand-gold/5">
          <button onClick={onClose} className="p-2 active:scale-90 transition-transform">
            {/* El error indicaba que X no estaba siendo reconocido */}
            <X size={28} className="text-brand-dark" />
          </button>
        </div>

        {/* Enlaces del Menú */}
        <div className="flex-grow p-6 space-y-2">
          {menuItems.map((item) => (
            <button 
              key={item.label}
              className="w-full flex items-center justify-between p-4 rounded-xl active:bg-brand-gold/5 group transition-colors"
            >
              <div className="flex items-center gap-4">
                <item.icon size={22} className="text-brand-gold" />
                <span className="font-bold text-sm uppercase tracking-widest text-brand-dark">
                  {item.label}
                </span>
              </div>
              <ChevronRight size={16} className="text-brand-gold/30 group-active:translate-x-1 transition-transform" />
            </button>
          ))}
        </div>

        {/* Botón Sign Out */}
        <div className="p-8 border-t border-brand-gold/5">
          <button className="w-full flex items-center gap-4 p-4 text-brand-red active:scale-95 transition-transform">
            <LogOut size={22} />
            <span className="font-bold text-sm uppercase tracking-widest">Sign Out</span>
          </button>
          <p className="mt-4 text-[10px] text-center text-gray-400 font-medium uppercase tracking-[0.3em]">
            Apapacho v1.0
          </p>
        </div>
      </motion.div>
    </div>
  );
}