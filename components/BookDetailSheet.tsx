"use client";

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { AuthService } from '@/services/authService';
import { BookService } from '@/services/bookService';
import { useLanguage } from '@/hooks/useLanguage';

export default function BookDetailSheet({ book, onClose }: { book: any, onClose: () => void }) {
  const router = useRouter();
  const [hasProgress, setHasProgress] = useState(false);
  const [isInList, setIsInList] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  
  const [isToggling, setIsToggling] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);

  const { t } = useLanguage();

  useEffect(() => {
    let ignore = false;
    
    async function checkData() {
      if (!book || !book.id) return;

      const session = await AuthService.getSession();
      const user = session?.user;
      
      if (!user || ignore) return;
      setUserId(user.id);

      try {
        const progress = await BookService.getReadingProgress(user.id, book.id);
        if (ignore) return;
        if (progress) setHasProgress(true);

        const inList = await BookService.checkIfInMyList(user.id, book.id);
        if (ignore) return;
        setIsInList(inList);
      } catch (error) {
        console.error("[BookDetailSheet] Error verificando datos del libro:", error);
      }
    }
    
    checkData();
    return () => { ignore = true; };
  }, [book]);

  const toggleList = async () => {
    if (!userId || isToggling || !book?.id) return; 
    setIsToggling(true);
    try {
      if (isInList) {
        await BookService.removeFromMyList(userId, book.id);
        setIsInList(false);
      } else {
        await BookService.addToMyList(userId, book.id);
        setIsInList(true);
      }
    } catch (error) {
      console.error("[BookDetailSheet] Error al modificar la lista:", error);
    } finally {
      setIsToggling(false);
    }
  };

  const handleReadClick = () => {
    if (!book?.id) return;
    if (book.published) {
      router.push(`/leer?bookId=${book.id}`);
    }
  };

  if (!book) return null; 

  return (
    <>
      <motion.div 
        initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
        className="fixed inset-0 z-[100] flex flex-col bg-brand-bg dark:bg-[#121212] transition-colors duration-500"
      >
        <div className="absolute inset-0 h-1/2 overflow-hidden pointer-events-none z-0">
          <img src={book.cover_url} className="w-full h-full object-cover scale-150 blur-[80px] opacity-30 dark:opacity-20 transition-opacity" alt="" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-brand-bg dark:to-[#121212] transition-colors" />
        </div>

        <div 
          className="flex justify-between items-center border-b border-brand-gold/10 dark:border-brand-gold/20 backdrop-blur-md bg-brand-bg/80 dark:bg-[#121212]/80 z-20 shrink-0 transition-colors"
          style={{ 
            paddingTop: 'calc(1rem + env(safe-area-inset-top))', 
            paddingBottom: '1rem', paddingLeft: '1rem', paddingRight: '1rem' 
          }}
        >
          <button onClick={onClose} className="p-2 active:scale-90 transition-transform"><X size={28} className="text-brand-dark dark:text-gray-300" /></button>
          <span className="text-[10px] font-bold tracking-[0.3em] text-brand-gold uppercase">{t('common.details') || 'Detalles'}</span>
          <div className="w-10" />
        </div>

        <div className="flex-grow overflow-y-auto z-10 flex flex-col items-center px-6 pt-8 pb-10">
          
          <div 
            onClick={() => setIsZoomed(true)}
            className="relative w-[210px] h-[315px] shrink-0 mb-8 shadow-2xl rounded-md overflow-hidden border border-brand-gold/5 dark:border-brand-gold/10 cursor-zoom-in active:scale-95 transition-transform"
          >
            <img src={book.cover_url} className={`w-full h-full object-cover transition-opacity duration-300 ${!book.published ? 'opacity-70 grayscale-[30%]' : ''}`} alt={book.title} />
          </div>
          
          <h2 className="text-3xl font-serif italic text-brand-gold text-center mb-2">{book.title}</h2>
          <p className="text-xs font-texto uppercase tracking-[0.3em] text-brand-dark/60 dark:text-gray-400 mb-8 transition-colors">{book.author}</p>
          
          {/* 🌟 NUEVO: Separación UX de párrafos para la sinopsis */}
          <div className="w-full border-t border-brand-gold/10 dark:border-brand-gold/20 pt-8 text-sm text-justify leading-relaxed text-brand-dark dark:text-gray-300 transition-colors">
            {book.description ? (
              book.description.split('\n').map((paragraph: string, idx: number) => (
                paragraph.trim() ? <p key={idx} className="mb-4">{paragraph}</p> : null
              ))
            ) : (
              <p>{t('common.no_description') || 'Sin descripción disponible.'}</p>
            )}
          </div>
        </div>

        <div 
          className="grid grid-cols-2 gap-4 backdrop-blur-xl bg-white/90 dark:bg-[#121212]/95 border-t border-brand-gold/10 dark:border-brand-gold/20 z-20 shrink-0 transition-colors duration-500 shadow-[0_-10px_30px_rgba(0,0,0,0.05)] dark:shadow-[0_-10px_30px_rgba(0,0,0,0.5)]"
          style={{ 
            paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom))', 
            paddingTop: '1.5rem', paddingLeft: '1.5rem', paddingRight: '1.5rem' 
          }}
        >
          <button 
            onClick={toggleList}
            disabled={isToggling}
            className={`flex items-center justify-center py-4 rounded-2xl font-bold text-[11px] uppercase tracking-widest shadow-lg text-center active:scale-95 transition-transform disabled:opacity-70 ${
              isInList 
                ? 'bg-red-50 dark:bg-red-900/20 text-brand-red dark:text-red-400 border border-red-100 dark:border-red-900/50' 
                : 'bg-brand-gold text-white dark:text-[#121212]'
            }`}
          >
            {isInList ? (t('common.remove_list') || 'Quitar de la lista') : (t('common.add_list') || 'Agregar a mi lista')}
          </button>
          <button 
            onClick={handleReadClick}
            disabled={!book.published}
            className={`flex items-center justify-center py-4 rounded-2xl font-bold text-[11px] uppercase tracking-widest shadow-lg text-center transition-all ${
              book.published 
                ? 'bg-brand-dark-blue dark:bg-brand-gold text-white dark:text-[#121212] active:scale-95' 
                : 'bg-gray-400 dark:bg-gray-600 text-white dark:text-gray-300 cursor-not-allowed'
            }`}
          >
            {hasProgress ? (t('reader.continue') || 'Continuar') : (book.published ? (t('reader.read_now') || 'Leer ahora') : (t('common.coming_soon') || 'Próximamente'))}
          </button>
        </div>
      </motion.div>

      <AnimatePresence>
        {isZoomed && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsZoomed(false)}
            className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-md flex items-center justify-center p-4 cursor-zoom-out"
          >
            <img 
              src={book.cover_url} 
              alt={book.title} 
              className="max-w-full max-h-[90vh] object-contain rounded-md shadow-2xl" 
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}