"use client";
import { useEffect, useState } from 'react';
import { BookOpen, X, Filter, FilterX } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import BookDetailSheet from '@/components/BookDetailSheet';

// 🌟 IMPORTAMOS TIPOS ESTRICTOS
import { Book } from '@/lib/types';

import { BookService } from '@/services/bookService';
import { useLanguage } from '@/hooks/useLanguage';

// Listas estáticas sacadas de tu base de datos (ENUMs)
const GENRES = [
  'Cuentos', 'Ensayos', 'Literatura Fantástica', 
  'Literatura Romántica', 'Microrelatos', 'Novela', 
  'Novela Corta', 'Poesia'
];
const LANGUAGES = ['EN', 'ES', 'IT', 'PT'];

export default function BookGallery() {
  // 🌟 FIX: Tipos estrictos en lugar de 'any'
  const [books, setBooks] = useState<Book[]>([]);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);

  const [newReleaseBook, setNewReleaseBook] = useState<Book | null>(null);
  const [showNewModal, setShowNewModal] = useState(false);

  // Estados para los filtros y el panel
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [selectedGenre, setSelectedGenre] = useState<string>('');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('');
  const [selectedAuthor, setSelectedAuthor] = useState<string>('');

  const { t } = useLanguage();

  useEffect(() => {
    async function fetchBooks() {
      try {
        const data = await BookService.getAllBooks();

        if (data && data.length > 0) {
          setBooks(data);
          
          const promotedBook = data.find((b: Book) => b.new === true);
          
          if (promotedBook && !localStorage.getItem(`apapacho_new_seen_${promotedBook.id}`)) {
            setNewReleaseBook(promotedBook);
            setShowNewModal(true);
            localStorage.setItem(`apapacho_new_seen_${promotedBook.id}`, 'true');
          }
        }
      } catch (error) {
        console.error("Error cargando libros:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchBooks();
  }, []);

  // 1. Extraemos los autores únicos de los libros para el filtro (protegiendo contra null)
  const authors = Array.from(new Set(books.map(b => b.author || '').filter(Boolean))) as string[];

  // 2. Aplicamos los filtros
  const filteredBooks = books.filter((book) => {
    const matchGenre = selectedGenre ? book.genre === selectedGenre : true;
    const matchLanguage = selectedLanguage ? book.language === selectedLanguage : true;
    const matchAuthor = selectedAuthor ? book.author === selectedAuthor : true;
    
    return matchGenre && matchLanguage && matchAuthor;
  });

  const hasActiveFilters = selectedGenre || selectedLanguage || selectedAuthor;

  if (loading) {
    return (
      <div className="p-20 text-center font-bold text-[11px] uppercase tracking-widest text-brand-gold bg-brand-bg dark:bg-[#121212] min-h-[100dvh] transition-colors duration-500">
        {t('common.loading')}
      </div>
    );
  }

  return (
    <div className="w-full px-6 pt-6 pb-20 overflow-x-hidden relative bg-brand-bg dark:bg-[#121212] min-h-[100dvh] transition-colors duration-500">
      
      {/* HEADER CON BOTÓN DE FILTRO REDISEÑADO */}
      <div className="flex justify-between items-center mb-6">
        <button 
          onClick={() => setShowFilterPanel(true)}
          className={`relative p-3 rounded-full transition-colors ${hasActiveFilters ? 'bg-brand-dark-blue/10 dark:bg-brand-gold/20' : 'bg-transparent active:bg-brand-gold/5'}`}
        >
          <Filter size={22} className="text-brand-dark-blue dark:text-brand-gold transition-colors" />
          {hasActiveFilters && (
            <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-brand-gold rounded-full border-2 border-brand-bg dark:border-[#121212]"></span>
          )}
        </button>
      </div>

      {/* GALERÍA DE LIBROS */}
      {filteredBooks.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 items-start w-full">
          {filteredBooks.map((book) => (
            <div
              key={book.id}
              onClick={() => setSelectedBook(book)}
              className="relative aspect-[5/8] w-full bg-[#f2f2f2] dark:bg-[#1A1A1A] rounded-md overflow-hidden shadow-lg active:scale-95 transition-all duration-500 cursor-pointer border border-brand-gold/5 dark:border-brand-gold/10 block group"
            >
              {book.cover_url ? (
                <img 
                  src={book.cover_url} 
                  alt={book.title || 'Libro'} 
                  className={`w-full h-full object-cover ${!book.published ? 'opacity-[0.45]' : ''}`} 
                />
              ) : (
                <div className="w-full h-full bg-brand-blue-bg dark:bg-black/50 flex items-center justify-center transition-colors">
                  <BookOpen className="text-brand-dark/20 dark:text-gray-600" size={24} />
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <p className="text-xs font-bold uppercase tracking-widest text-brand-dark/40 dark:text-gray-400 mb-2 transition-colors">{t('common.no_results')}</p>
          <p className="text-[10px] text-brand-dark/30 dark:text-gray-500 transition-colors">{t('common.no_results_desc')}</p>
        </div>
      )}

      {/* ANIME PRESENCE PARA MODALES Y PANEL */}
      <AnimatePresence>
        
        {/* PANEL LATERAL DE FILTROS (SLIDE) */}
        {showFilterPanel && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
            onClick={() => setShowFilterPanel(false)} // Cierra al tocar el overlay
            className="fixed inset-0 z-[70] bg-black/40 dark:bg-black/70 backdrop-blur-sm transition-colors"
          >
            <motion.div 
              initial={{ x: '100%' }} animate={{ x: '0%' }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              onClick={(e) => e.stopPropagation()} // Evita cerrar al tocar dentro
              className="absolute inset-y-0 right-0 w-[85%] max-w-sm bg-brand-bg dark:bg-[#121212] transition-colors duration-500 shadow-2xl flex flex-col border-l border-brand-gold/10 dark:border-brand-gold/20"
              style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}
            >
              <div className="p-6 flex justify-between items-center border-b border-brand-gold/5 dark:border-brand-gold/10 shrink-0 transition-colors">
                <h2 className="text-2xl font-serif italic text-brand-dark-blue dark:text-brand-gold transition-colors">{t('common.filters')}</h2>
                <button onClick={() => setShowFilterPanel(false)} className="p-2 active:scale-90 transition-transform">
                  <X size={26} className="text-brand-dark-blue dark:text-gray-300 transition-colors" />
                </button>
              </div>

              <div className="flex-grow overflow-y-auto p-6 space-y-8 scrollbar-hide">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-gold mb-3 block">{t('filters.genre')}</label>
                  <select value={selectedGenre} onChange={(e) => setSelectedGenre(e.target.value)}
                    className="w-full bg-white dark:bg-[#1A1A1A] border border-brand-gold/20 dark:border-brand-gold/30 text-brand-dark-blue dark:text-gray-200 text-xs font-bold uppercase tracking-widest rounded-full px-5 py-3.5 outline-none focus:border-brand-dark-blue dark:focus:border-brand-gold transition-colors appearance-none shadow-sm"
                  >
                    <option value="">{t('filters.all_genres')}</option>
                    {GENRES.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-gold mb-3 block">{t('filters.language')}</label>
                  <select value={selectedLanguage} onChange={(e) => setSelectedLanguage(e.target.value)}
                    className="w-full bg-white dark:bg-[#1A1A1A] border border-brand-gold/20 dark:border-brand-gold/30 text-brand-dark-blue dark:text-gray-200 text-xs font-bold uppercase tracking-widest rounded-full px-5 py-3.5 outline-none focus:border-brand-dark-blue dark:focus:border-brand-gold transition-colors appearance-none shadow-sm"
                  >
                    <option value="">{t('filters.all_languages')}</option>
                    {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-gold mb-3 block">{t('filters.author')}</label>
                  <select value={selectedAuthor} onChange={(e) => setSelectedAuthor(e.target.value)}
                    className="w-full bg-white dark:bg-[#1A1A1A] border border-brand-gold/20 dark:border-brand-gold/30 text-brand-dark-blue dark:text-gray-200 text-xs font-bold uppercase tracking-widest rounded-full px-5 py-3.5 outline-none focus:border-brand-dark-blue dark:focus:border-brand-gold transition-colors appearance-none shadow-sm"
                  >
                    <option value="">{t('filters.all_authors')}</option>
                    {authors.map(a => <option key={a} value={a}>{a}</option>)}
                  </select>
                </div>
              </div>

              <div className="p-6 border-t border-brand-gold/5 dark:border-brand-gold/10 shrink-0 space-y-3 transition-colors">
                <button 
                  onClick={() => setShowFilterPanel(false)}
                  className="w-full bg-brand-dark-blue dark:bg-brand-gold text-white dark:text-[#121212] py-4 rounded-full font-bold text-[11px] uppercase tracking-widest active:scale-95 transition-all shadow-lg shadow-brand-dark-blue/20 dark:shadow-brand-gold/10"
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
                    className="w-full flex items-center justify-center gap-2.5 bg-red-50 dark:bg-red-900/20 text-brand-red dark:text-red-400 border border-red-100 dark:border-red-900/50 py-4 rounded-full font-bold text-[11px] uppercase tracking-widest active:scale-95 transition-all shadow-sm"
                  >
                    <FilterX size={16} /> {t('common.clear_filters')}
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* MODAL DETALLES DEL LIBRO */}
        {selectedBook && (
          <BookDetailSheet
            book={selectedBook}
            onClose={() => setSelectedBook(null)}
          />
        )}

        {/* MODAL NUEVO LANZAMIENTO */}
        {showNewModal && newReleaseBook && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }}
            className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-6 backdrop-blur-sm"
          >
            <div className="bg-white dark:bg-[#1A1A1A] transition-colors duration-500 rounded-[2rem] p-6 max-w-sm w-full text-center shadow-2xl relative">
              <button onClick={() => setShowNewModal(false)} className="absolute top-4 right-4 p-1.5 active:scale-90 bg-gray-100 dark:bg-white/10 rounded-full transition-colors">
                <X size={16} className="text-gray-500 dark:text-gray-300" />
              </button>

              <div className="mt-2 mb-6 text-center">
                <span className="text-[10px] uppercase tracking-[0.3em] text-brand-gold font-black mb-1 block">{t('home.new_release_title')}</span>
                <span className="text-[9px] uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500 font-bold block transition-colors">{t('home.new_release_subtitle')}</span>
              </div>
              
              <div className="w-32 aspect-[5/8] mx-auto rounded-xl overflow-hidden shadow-lg mb-6 border border-brand-gold/20 dark:border-brand-gold/30 transition-colors">
                {newReleaseBook.cover_url ? (
                  <img src={newReleaseBook.cover_url} alt={newReleaseBook.title || 'Libro'} className={`w-full h-full object-cover ${!newReleaseBook.published ? 'opacity-[0.45]' : ''}`} />
                ) : (
                  <div className="w-full h-full bg-brand-blue-bg dark:bg-black/50 flex items-center justify-center transition-colors">
                    <BookOpen className="text-brand-dark/20 dark:text-gray-600" size={32} />
                  </div>
                )}
              </div>

              <p className="text-sm font-texto text-brand-dark/80 dark:text-gray-300 mb-8 leading-relaxed px-2 transition-colors">
                {t('home.discover_new_book')} <strong className="text-brand-dark dark:text-white font-bold transition-colors">{newReleaseBook.author}</strong> {t('home.in_apapacho')} <strong className="font-serif italic text-brand-gold text-base">{newReleaseBook.title}</strong>!
              </p>

              <button 
                onClick={() => {
                  setShowNewModal(false);
                  setSelectedBook(newReleaseBook);
                }}
                className="w-full bg-brand-dark-blue dark:bg-brand-gold text-white dark:text-[#121212] py-4 rounded-full font-bold text-[11px] uppercase tracking-widest active:scale-95 transition-all shadow-lg shadow-brand-dark-blue/20 dark:shadow-brand-gold/10"
              >
                {t('home.see_details')}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}