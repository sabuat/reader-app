"use client";

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { X, Plus, BookOpen } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function BookDetailSheet({ book, onClose }: { book: any, onClose: () => void }) {
  const router = useRouter();
  const [hasProgress, setHasProgress] = useState(false);

  useEffect(() => {
    async function checkProgress() {
      const { data } = await supabase
        .from('reading_progress')
        .select('id')
        .eq('book_id', book.id)
        .single();
      
      if (data) setHasProgress(true);
    }
    checkProgress();
  }, [book.id]);

  return (
    <motion.div 
      initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
      className="fixed inset-0 z-50 bg-brand-bg flex flex-col overflow-hidden"
    >
      {/* Fondo ambiental */}
      <div className="absolute inset-0 h-1/2 overflow-hidden pointer-events-none">
        <img src={book.cover_url} className="w-full h-full object-cover scale-150 blur-[80px] opacity-30" alt="" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-brand-bg" />
      </div>

      <div className="p-4 flex justify-between items-center border-b border-brand-gold/10 backdrop-blur-md bg-brand-bg/50 shrink-0 z-10">
        <button onClick={onClose} className="p-2"><X size={28} /></button>
        <span className="text-[10px] font-bold tracking-[0.3em] text-brand-gold uppercase">Detalles</span>
        <div className="w-10" />
      </div>

      <div className="flex-grow overflow-y-auto z-10 relative p-6 flex flex-col items-center">
        <div className="relative w-[210px] h-[315px] shrink-0 mb-8 shadow-2xl rounded-md overflow-hidden">
          <img src={book.cover_url} className="w-full h-full object-cover" alt={book.title} />
        </div>
        <h2 className="text-3xl font-serif italic text-brand-gold text-center mb-2 uppercase">{book.title}</h2>
        <p className="text-xs font-texto uppercase tracking-[0.3em] text-brand-dark/60 mb-8">{book.author}</p>
        <div className="w-full border-t border-brand-gold/10 pt-8 pb-24 text-sm text-justify leading-relaxed">
          {book.description || "Sin descripción disponible."}
        </div>
      </div>

      <div className="p-6 grid grid-cols-2 gap-4 backdrop-blur-xl bg-white/70 border-t border-brand-gold/10 shrink-0 z-10">
        <button className="flex items-center justify-center gap-2 bg-brand-gold text-white py-4 rounded-2xl font-bold text-[11px] uppercase tracking-widest shadow-lg">
          <Plus size={16} /> Mi Lista
        </button>
        <button 
          onClick={() => router.push(`/leer/${book.id}`)}
          disabled={!book.published}
          className={`flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-[11px] uppercase tracking-widest shadow-lg ${
            book.published ? 'bg-brand-dark-blue text-white' : 'bg-gray-400 text-white cursor-not-allowed'
          }`}
        >
          <BookOpen size={16} /> 
          {hasProgress ? 'Continuar leyendo' : (book.published ? 'Leer ahora' : 'Pronto')}
        </button>
      </div>
    </motion.div>
  );
}