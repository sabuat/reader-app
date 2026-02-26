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
      {/* Header Fijo */}
      <div className="p-4 flex justify-between items-center border-b border-brand-gold/10 bg-brand-bg shrink-0">
        <button onClick={onClose} className="p-2 active:scale-90 transition-transform">
          <X size={28} />
        </button>
        <span className="text-[10px] font-bold tracking-widest uppercase text-brand-gold">
          Detalles del Libro
        </span>
        <div className="w-10" />
      </div>

      {/* Contenedor con Scroll */}
      <div className="flex-grow overflow-y-auto custom-scrollbar">
        <div className="p-6 flex flex-col items-center">
          
          {/* PORTADA: Tamaño blindado (min-w y min-h) para que NUNCA cambie */}
          <div className="w-[200px] h-[300px] shrink-0 shadow-2xl rounded-md overflow-hidden mb-8 border border-brand-gold/10 bg-white">
            <img 
              src={book.cover_url} 
              alt={book.title} 
              className="w-full h-full object-cover" 
            />
          </div>

          {/* Información del Libro */}
          <div className="w-full text-center mb-6">
            <h2 className="text-3xl font-serif italic text-brand-gold leading-tight mb-2">
              {book.title}
            </h2>
            <p className="text-sm font-texto uppercase tracking-[0.2em] text-gray-500">
              {book.author}
            </p>
          </div>

          {/* Área de descripción: Aquí es donde ocurre el scroll si el texto es largo */}
          <div className="w-full border-t border-brand-gold/10 pt-6 pb-10">
            <p className="text-brand-dark/80 font-texto leading-relaxed text-sm text-justify">
              {book.description || "Esta obra aún no cuenta con una descripción detallada."}
            </p>
          </div>
        </div>
      </div>

      {/* Botones de Acción: Fijos al final */}
      <div className="p-6 grid grid-cols-2 gap-4 bg-white border-t border-brand-gold/10 shrink-0">
        <button className="flex items-center justify-center gap-2 bg-brand-gold text-white py-4 rounded-xl font-bold text-[11px] uppercase tracking-widest active:scale-95 transition-transform">
          <Plus size={16} /> Mi Lista
        </button>
        
        <button 
          disabled={!book.published}
          className={`flex items-center justify-center gap-2 py-4 rounded-xl font-bold text-[11px] uppercase tracking-widest active:scale-95 transition-transform ${
            book.published ? 'bg-brand-dark-blue text-white' : 'bg-gray-400 text-white cursor-not-allowed'
          }`}
        >
          <BookOpen size={16} /> {book.published ? 'Leer ahora' : 'Pronto'}
        </button>
      </div>
    </motion.div>
  );
}