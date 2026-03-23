"use client";

import { useEffect, useState } from 'react';
import { Filter, FilterX, X, Bookmark } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import BookDetailSheet from '@/components/BookDetailSheet';
import { AuthService } from '@/services/authService';
import { BookService } from '@/services/bookService';
import { Book } from '@/lib/types';
import { BookCard } from '@/components/ui/BookCard';
import { BookCardSkeleton, EmptyState } from '@/components/ui/StateComponents';
import { useLanguage } from '@/hooks/useLanguage';

const GENRES = [
  'Cuentos', 'Ensayos', 'Literatura Fantástica', 
  'Literatura Romántica', 'Microrelatos', 'Novela', 
  'Novela Corta', 'Poesia'
];
const LANGUAGES = ['EN', 'ES', 'IT', 'PT'];

export default function MiListaPage() {
  const [savedBooks, setSavedBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);

  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [selectedGenre, setSelectedGenre] = useState<string>('');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('');
  const [selectedAuthor, setSelectedAuthor] = useState<string>('');

  // INICIALIZAMOS EL TRADUCTOR
  const { t } = useLanguage();

  const fetchMyList = async (isSilentRefresh = false) => {
    if (!isSilentRefresh) setLoading(true);
    
    try {
      const session = await AuthService.getSession();
      
      if (!session?.user) {
        if (!isSilentRefresh) setLoading(false);
        return;
      }

      const data = await BookService.getMyList(session.user.id);
      
      if (data) {
        // Formateamos y validamos la data cruda antes de guardarla en el estado
        const formatted = data
          .map((item: any) => Array.isArray(item.books) ? item.books[0] : item.books)
          .filter(Boolean) as Book[];
        
        setSavedBooks(formatted);
      }

    } catch (error) {
      console.error("Error al cargar Mi Lista:", error);
    } finally {
      if (!isSilentRefresh) setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyList();
  }, []);

  // Protección contra valores null al extraer autores
  const authors = Array.from(new Set(savedBooks.map(b => b.author || '').filter(Boolean))) as string[];

  const filteredBooks = savedBooks.filter((book) => {
    const matchGenre = selectedGenre ? book.genre === selectedGenre : true;
    const matchLanguage = selectedLanguage ? book.language === selectedLanguage : true;
    const matchAuthor = selectedAuthor ? book.author === selectedAuthor : true;

    return matchGenre && matchLanguage && matchAuthor;
  });

  const hasActiveFilters = selectedGenre || selectedLanguage || selectedAuthor;

  return (
    <div className="min-h-[100dvh] bg-brand-bg dark:bg-[#121212] transition-colors duration-500 px-6 pb-24 overflow-x-hidden relative">
      <header className="pt-10 pb-6 border-b border-brand-gold/10 dark:border-brand-gold/20 mb-6 flex justify-between items-end transition-colors">
        {/* TÍTULO TRADUCIDO */}
        <h1 className="text-xl font-serif italic text-brand-dark dark:text-brand-gold transition-colors">
          {t('menu.my_list')}
        </h1>
        <button 
          onClick={() => setShowFilterPanel(true)}
          className={`relative p-3 rounded-full transition-colors ${hasActiveFilters ? 'bg-brand-dark-blue/10 dark:bg-brand-gold/20' : 'bg-transparent active:bg-brand-gold/5'}`}
        >
          <Filter size={22} className="text-brand-dark-blue dark:text-brand-gold transition-colors" />
          {hasActiveFilters && (
            <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-brand-gold rounded-full border-2 border-brand-bg dark:border-[#121212]"></span>
          )}
        </button>
      </header>

      {loading ? (
        <div className="grid grid-cols-3 gap-3 md:grid-cols-4 lg:grid-cols-6 items-start">
          {Array.from({ length: 6 }).map((_, i) => (
            <BookCardSkeleton key={i} />
          ))}
        </div>
      ) : filteredBooks.length > 0 ? (
        <div className="grid grid-cols-3 gap-3 md:grid-cols-4 lg:grid-cols-6 items-start">
          {filteredBooks.map((book) => (
            <BookCard key={book.id} book={book} onClick={setSelectedBook} />
          ))}
        </div>
      ) : (
        <EmptyState 
          // ESTADOS VACÍOS TRADUCIDOS
          title={hasActiveFilters ? t('common.no_results') : t('common.empty_list')} 
          description={hasActiveFilters ? t('common.no_results_desc') : t('common.empty_list_desc')} 
          icon={<Bookmark size={32} />} 
        />
      )}

      <AnimatePresence>
        {showFilterPanel && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
            onClick={() => setShowFilterPanel(false)} 
            className="fixed inset-0 z-[70] bg-black/40 dark:bg-black/70 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ x: '100%' }} animate={{ x: '0%' }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              onClick={(e) => e.stopPropagation()}
              className="absolute inset-y-0 right-0 w-[85%] max-w-sm bg-brand-bg dark:bg-[#121212] transition-colors duration-500 shadow-2xl flex flex-col border-l border-brand-gold/10 dark:border-brand-gold/20"
              style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}
            >
              <div className="p-6 flex justify-between items-center border-b border-brand-gold/5 dark:border-brand-gold/10 shrink-0">
                <h2 className="text-2xl font-serif italic text-brand-dark-blue dark:text-brand-gold transition-colors">
                  {t('common.filters')}
                </h2>
                <button onClick={() => setShowFilterPanel(false)} className="p-2 active:scale-90 transition-transform">
                  <X size={26} className="text-brand-dark-blue dark:text-gray-300 transition-colors" />
                </button>
              </div>

              <div className="flex-grow overflow-y-auto p-6 space-y-8 scrollbar-hide">
                {/* FILTROS TRADUCIDOS */}
                <div>
                  <label className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-gold mb-3 block">
                    {t('filters.genre')}
                  </label>
                  <select value={selectedGenre} onChange={(e) => setSelectedGenre(e.target.value)}
                    className="w-full bg-white dark:bg-[#1A1A1A] border border-brand-gold/20 dark:border-brand-gold/30 text-brand-dark-blue dark:text-gray-200 text-xs font-bold uppercase tracking-widest rounded-full px-5 py-3.5 outline-none transition-colors appearance-none shadow-sm"
                  >
                    <option value="">{t('filters.all_genres')}</option>
                    {/* FIX: Texto traducido, 'value' original para la DB */}
                    {GENRES.map(g => <option key={g} value={g}>{t(`genres_db.${g}`)}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-gold mb-3 block">
                    {t('filters.language')}
                  </label>
                  <select value={selectedLanguage} onChange={(e) => setSelectedLanguage(e.target.value)}
                    className="w-full bg-white dark:bg-[#1A1A1A] border border-brand-gold/20 dark:border-brand-gold/30 text-brand-dark-blue dark:text-gray-200 text-xs font-bold uppercase tracking-widest rounded-full px-5 py-3.5 outline-none transition-colors appearance-none shadow-sm"
                  >
                    <option value="">{t('filters.all_languages')}</option>
                    {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-gold mb-3 block">
                    {t('filters.author')}
                  </label>
                  <select value={selectedAuthor} onChange={(e) => setSelectedAuthor(e.target.value)}
                    className="w-full bg-white dark:bg-[#1A1A1A] border border-brand-gold/20 dark:border-brand-gold/30 text-brand-dark-blue dark:text-gray-200 text-xs font-bold uppercase tracking-widest rounded-full px-5 py-3.5 outline-none transition-colors appearance-none shadow-sm"
                  >
                    <option value="">{t('filters.all_authors')}</option>
                    {authors.map(a => <option key={a} value={a}>{a}</option>)}
                  </select>
                </div>
              </div>

              <div className="p-6 border-t border-brand-gold/5 dark:border-brand-gold/10 shrink-0 space-y-3">
                <button 
                  onClick={() => setShowFilterPanel(false)}
                  className="w-full bg-brand-dark-blue dark:bg-brand-gold text-white dark:text-[#121212] py-4 rounded-full font-bold text-[11px] uppercase tracking-widest active:scale-95 transition-all shadow-lg"
                >
                  {t('common.apply_filters')}
                </button>
                {hasActiveFilters && (
                  <button 
                    onClick={() => {
                      setSelectedGenre('');
                      setSelectedLanguage('');
                      setSelectedAuthor('');
                    }}
                    className="w-full flex items-center justify-center gap-2.5 bg-red-50 dark:bg-red-900/20 text-brand-red border border-red-100 dark:border-red-900/50 py-4 rounded-full font-bold text-[11px] uppercase tracking-widest active:scale-95 transition-all shadow-sm"
                  >
                    <FilterX size={16} /> {t('common.clear_filters')}
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}

        {selectedBook && (
          <BookDetailSheet 
            book={selectedBook} 
            onClose={() => {
              setSelectedBook(null);
              fetchMyList(true); 
            }} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}