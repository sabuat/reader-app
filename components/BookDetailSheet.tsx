"use client";

import { motion } from 'framer-motion';
import { X, Plus, BookOpen } from 'lucide-react';

export default function BookDetailSheet({ book, onClose }: { book: any, onClose: () => void }) {
  return (
    <motion.div 
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="fixed inset-0 z-50 bg-brand-bg flex flex-col overflow-hidden"
    >
      {/* 1. FONDO DEGRADADO/DESENFOCADO: Usa la portada para crear la atmósfera */}
      <div className="absolute inset-0 h-1/2 w-full overflow-hidden pointer-events-none">
        <img 
          src={book.cover_url} 
          className="w-full h-full object-cover scale-150 blur-[80px] opacity-30"
          alt=""
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-brand-bg" />
      </div>

      {/* Header Fijo con Transparencia (Glassmorphism) */}
      <div className="p-4 flex justify-between items-center border-b border-brand-gold/10 backdrop-blur-md bg-brand-bg/50 shrink-0 z-10">
        <button onClick={onClose} className="p-2 active:scale-90 transition-transform">
          <X size={28} />
        </button>
        <span className="text-[10px] font-bold tracking-[0.3em] text-brand-gold uppercase">
          Detalles
        </span>
        <div className="w-10" />
      </div>

      {/* Contenedor con Scroll */}
      <div className="flex-grow overflow-y-auto z-10 relative">
        <div className="p-6 flex flex-col items-center">
          
          {/* PORTADA: Con efecto de sombra profunda y reflejo */}
          <div className="relative w-[210px] h-[315px] shrink-0 mt-4 mb-8">
            {/* Sombra proyectada */}
            <div className="absolute inset-0 bg-black/40 blur-2xl translate-y-6 scale-90" />
            
            <div className="relative w-full h-full rounded-md overflow-hidden border border-white/20 shadow-2xl">
              <img 
                src={book.cover_url} 
                className="w-full h-full object-cover" 
                alt={book.title}
              />
            </div>
          </div>

          {/* Información del Libro */}
          <div className="w-full text-center mb-8">
            <h2 className="text-3xl font-serif italic text-brand-gold leading-tight mb-2 px-4">
              {book.title}
            </h2>
            <p className="text-xs font-texto uppercase tracking-[0.3em] text-brand-dark/60">
              {book.author}
            </p>
          </div>

          {/* Área de descripción */}
          <div className="w-full border-t border-brand-gold/10 pt-8 pb-12 px-2">
            <p className="text-brand-dark/80 font-texto leading-relaxed text-sm text-justify">
              {book.description || "Esta obra aún no cuenta con una descripción detallada en nuestro catálogo."}
            </p>
          </div>
        </div>
      </div>

      {/* Botones de Acción: Fijos al final con Glassmorphism */}
      <div className="p-6 grid grid-cols-2 gap-4 backdrop-blur-xl bg-white/70 border-t border-brand-gold/10 shrink-0 z-10">
        <button className="flex items-center justify-center gap-2 bg-brand-gold text-white py-4 rounded-2xl font-bold text-[11px] uppercase tracking-widest active:scale-95 transition-all shadow-lg shadow-brand-gold/20">
          <Plus size={16} /> Mi Lista
        </button>
        
        <button 
          disabled={!book.published}
          className={`flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-[11px] uppercase tracking-widest active:scale-95 transition-all shadow-lg ${
            book.published 
            ? 'bg-brand-dark-blue text-white shadow-brand-dark-blue/20' 
            : 'bg-gray-400 text-white cursor-not-allowed opacity-50'
          }`}
        >
          <BookOpen size={16} /> {book.published ? 'Leer ahora' : 'Pronto'}
        </button>
      </div>
    </motion.div>
  );
}