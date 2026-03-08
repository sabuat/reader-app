"use client";

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function BookDetailSheet({ book, onClose }: { book: any, onClose: () => void }) {
  const router = useRouter();
  const [hasProgress, setHasProgress] = useState(false);
  const [isInList, setIsInList] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    async function checkData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      const { data: prog } = await supabase
        .from('reading_progress')
        .select('id')
        .eq('book_id', book.id)
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (prog) setHasProgress(true);

      const { data: listData } = await supabase
        .from('my_list')
        .select('id')
        .eq('book_id', book.id)
        .eq('user_id', user.id)
        .maybeSingle();

      if (listData) setIsInList(true);
    }
    checkData();
  }, [book.id]);

  const toggleList = async () => {
    if (!userId) return;

    if (isInList) {
      await supabase.from('my_list').delete().eq('book_id', book.id).eq('user_id', userId);
      setIsInList(false);
    } else {
      await supabase.from('my_list').insert({ book_id: book.id, user_id: userId });
      setIsInList(true);
    }
  };

  return (
    <motion.div 
      initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
      className="fixed inset-0 z-[100] flex flex-col bg-brand-bg dark:bg-[#121212] transition-colors duration-500"
    >
      {/* Fondo difuminado */}
      <div className="absolute inset-0 h-1/2 overflow-hidden pointer-events-none z-0">
        <img src={book.cover_url} className="w-full h-full object-cover scale-150 blur-[80px] opacity-30 dark:opacity-20 transition-opacity" alt="" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-brand-bg dark:to-[#121212] transition-colors" />
      </div>

      {/* CABECERA: Fija arriba (shrink-0 para que no se aplaste) */}
      <div 
        className="flex justify-between items-center border-b border-brand-gold/10 dark:border-brand-gold/20 backdrop-blur-md bg-brand-bg/80 dark:bg-[#121212]/80 z-20 shrink-0 transition-colors"
        style={{ 
          paddingTop: 'calc(1rem + env(safe-area-inset-top))', 
          paddingBottom: '1rem', paddingLeft: '1rem', paddingRight: '1rem' 
        }}
      >
        <button onClick={onClose} className="p-2 active:scale-90 transition-transform"><X size={28} className="text-brand-dark dark:text-gray-300" /></button>
        <span className="text-[10px] font-bold tracking-[0.3em] text-brand-gold uppercase">Detalles</span>
        <div className="w-10" />
      </div>

      {/* CONTENIDO: Toma todo el espacio disponible en el medio y permite hacer scroll (flex-grow overflow-y-auto) */}
      <div className="flex-grow overflow-y-auto z-10 flex flex-col items-center px-6 pt-8 pb-10">
        <div className="relative w-[210px] h-[315px] shrink-0 mb-8 shadow-2xl rounded-md overflow-hidden border border-brand-gold/5 dark:border-brand-gold/10">
          <img src={book.cover_url} className="w-full h-full object-cover transition-opacity duration-300" alt={book.title} />
        </div>
        <h2 className="text-3xl font-serif italic text-brand-gold text-center mb-2">{book.title}</h2>
        <p className="text-xs font-texto uppercase tracking-[0.3em] text-brand-dark/60 dark:text-gray-400 mb-8 transition-colors">{book.author}</p>
        <div className="w-full border-t border-brand-gold/10 dark:border-brand-gold/20 pt-8 text-sm text-justify leading-relaxed text-brand-dark dark:text-gray-300 transition-colors">
          {book.description || "Sin descripción disponible."}
        </div>
      </div>

      {/* BOTONES: Fijos abajo (shrink-0) */}
      <div 
        className="grid grid-cols-2 gap-4 backdrop-blur-xl bg-white/90 dark:bg-[#121212]/95 border-t border-brand-gold/10 dark:border-brand-gold/20 z-20 shrink-0 transition-colors duration-500 shadow-[0_-10px_30px_rgba(0,0,0,0.05)] dark:shadow-[0_-10px_30px_rgba(0,0,0,0.5)]"
        style={{ 
          paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom))', 
          paddingTop: '1.5rem', paddingLeft: '1.5rem', paddingRight: '1.5rem' 
        }}
      >
        <button 
          onClick={toggleList}
          className={`flex items-center justify-center py-4 rounded-2xl font-bold text-[11px] uppercase tracking-widest shadow-lg text-center active:scale-95 transition-transform ${
            isInList 
              ? 'bg-red-50 dark:bg-red-900/20 text-brand-red dark:text-red-400 border border-red-100 dark:border-red-900/50' 
              : 'bg-brand-gold text-white dark:text-[#121212]'
          }`}
        >
          {isInList ? '- Quitar' : '+ Mi Lista'}
        </button>
        <button 
          onClick={() => router.push(`/leer?id=${book.id}`)}
          disabled={!book.published}
          className={`flex items-center justify-center py-4 rounded-2xl font-bold text-[11px] uppercase tracking-widest shadow-lg text-center transition-all ${
            book.published 
              ? 'bg-brand-dark-blue dark:bg-brand-gold text-white dark:text-[#121212] active:scale-95' 
              : 'bg-gray-400 dark:bg-gray-600 text-white dark:text-gray-300 cursor-not-allowed'
          }`}
        >
          {hasProgress ? 'Continuar' : (book.published ? 'Leer ahora' : 'Proximamente')}
        </button>
      </div>
    </motion.div>
  );
}