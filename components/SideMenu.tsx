"use client";

import { motion } from 'framer-motion';
import { X, Home, Bookmark, BookOpen, User, LogOut, ChevronRight, Globe, Instagram } from 'lucide-react';
import Link from 'next/link';

export default function SideMenu({ onClose }: { onClose: () => void }) {
  const menuItems = [
    { icon: Home, label: 'Home', href: '/home' },
    { icon: Bookmark, label: 'Mi lista', href: '/lista' },
    { icon: BookOpen, label: 'Lecturas', href: '/lecturas' },
    { icon: User, label: 'Mi cuenta', href: '/cuenta' },
    { icon: Globe, label: 'Web', href: 'https://editorialapapacho.com' },
    { icon: Instagram, label: 'Instagram', href: 'https://instagram.com/editorial.apapacho' },
  ];

  return (
    <div className="fixed inset-0 z-[60] overflow-hidden">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      <motion.div 
        initial={{ x: '100%' }} animate={{ x: '0%' }} exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="absolute inset-y-0 right-0 w-[75%] bg-brand-bg shadow-2xl flex flex-col border-l border-brand-gold/10"
        style={{ 
          // ESTO SOLUCIONA QUE LA 'X' Y LA VERSIÓN SE CORTEN EN EL TELÉFONO
          paddingTop: 'env(safe-area-inset-top)', 
          paddingBottom: 'env(safe-area-inset-bottom)' 
        }}
      >
        <div className="p-6 flex justify-end border-b border-brand-gold/5 shrink-0">
          <button onClick={onClose} className="p-2 active:scale-90 transition-transform">
            <X size={28} className="text-brand-dark" />
          </button>
        </div>

        <div className="flex-grow overflow-y-auto p-6 space-y-2">
          {menuItems.map((item) => (
            <Link 
              key={item.label} 
              href={item.href} 
              onClick={onClose} // Cierra el menú al navegar
              className="w-full flex items-center justify-between p-4 rounded-xl active:bg-brand-gold/5 group transition-colors"
            >
              <div className="flex items-center gap-4">
                <item.icon size={22} className="text-brand-gold" />
                <span className="font-bold text-sm uppercase tracking-widest text-brand-dark">{item.label}</span>
              </div>
              <ChevronRight size={16} className="text-brand-gold/30" />
            </Link>
          ))}
        </div>

        <div className="p-8 border-t border-brand-gold/5 shrink-0">
          <button className="w-full flex items-center gap-4 p-4 text-brand-red active:scale-95 transition-transform">
            <LogOut size={22} />
            <span className="font-bold text-sm uppercase tracking-widest">Sign Out</span>
          </button>
        </div>
        <div className="mt-auto pb-4 text-center shrink-0">
          <span className="text-[10px] font-bold tracking-widest text-gray-400 uppercase">
            Apapacho Reader - Versión 1.6.30
          </span>
        </div>
      </motion.div>
    </div>
  );
}