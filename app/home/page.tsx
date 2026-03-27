"use client";

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { BookOpen, X, Filter, FilterX, ChevronRight, PlayCircle, Star, ArrowLeft } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

import { Book } from '@/lib/types';
import { BookService, ReadingBookItem } from '@/services/bookService';
import { AuthService } from '@/services/authService';
import { useLanguage } from '@/hooks/useLanguage';
import { StorageService } from '@/lib/storage';
import BookDetailSheet from '@/components/BookDetailSheet';

// ==========================================
// CONSTANTES Y TIPOS
// ==========================================
const GENRES = [
  'Cuentos', 'Ensayos', 'Literatura Fantástica', 
  'Literatura Romántica', 'Microrelatos', 'Novela', 
  'Novela Corta', 'Poesia'
];
const LANGUAGES = ['EN', 'ES', 'IT', 'PT'];

interface FiltersState {
  genre: string;
  language: string;
  author: string;
}

export default function HomePage() {
  const router = useRouter();
  const { t, lang, isReady } = useLanguage();
  
  // ==========================================
  // ESTADOS DE DOMINIO
  // ==========================================
  const [books, setBooks] = useState<Book[]>([]);
  const [readings, setReadings] = useState<ReadingBookItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  
  // ==========================================
  // ESTADOS DE UI & MERCHANDISING
  // ==========================================
  const [newReleaseBook, setNewReleaseBook] = useState<Book | null>(null);
  const [showNewModal, setShowNewModal] = useState(false);
  const [showFilterPanel, setShowFilterPanel] = useState(false);

  const [activeList, setActiveList] = useState<{ title: string; data: Book[] } | null>(null);

  // ==========================================
  // ESTADOS DE FILTROS
  // ==========================================
  const [filters, setFilters] = useState<FiltersState>({ genre: '', language: '', author: '' });

  // ==========================================
  // LÓGICA DE MERCHANDISING
  // ==========================================
  const handleMerchandising = useCallback((fetchedBooks: Book[]) => {
    const promotedBook = fetchedBooks.find(b => b.new === true);
    if (!promotedBook) return;

    const promoKey = `promo_seen_${promotedBook.id}`;
    if (!StorageService.has(promoKey)) {
      setNewReleaseBook(promotedBook);
      setShowNewModal(true);
      StorageService.setRaw(promoKey, 'true');
    }
  }, []);

  // ==========================================
  // DATA FETCHING
  // ==========================================
  useEffect(() => {
    if (!isReady) return;
    let ignore = false;

    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const session = await AuthService.getSession();
        const uid = session?.user?.id;

        const [fetchedBooks, userReadings] = await Promise.all([
          BookService.getAllBooks(lang),
          uid ? BookService.getMyReadings(uid) : Promise.resolve([])
        ]);

        if (!ignore) {
          setBooks(fetchedBooks);
          setReadings(userReadings);
          handleMerchandising(fetchedBooks);
        }
      } catch (error) {
        console.error("[HomePage] Error cargando dashboard:", error);
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    fetchDashboardData();
    return () => { ignore = true; };
  }, [lang, isReady, handleMerchandising]);

  // ==========================================
  // LÓGICA DERIVADA (FILTROS)
  // ==========================================
  const authors = useMemo(() => {
    return Array.from(new Set(books.map(b => b.author || '').filter(Boolean))) as string[];
  }, [books]);

  const filteredBooks = useMemo(() => {
    return books.filter((book) => {
      const matchGenre = filters.genre ? book.genre === filters.genre : true;
      const matchLanguage = filters.language ? book.language === filters.language : true;
      const matchAuthor = filters.author ? book.author === filters.author : true;
      return matchGenre && matchLanguage && matchAuthor;
    });
  }, [books, filters]);

  const hasActiveFilters = Object.values(filters).some(val => val !== '');
  
  const clearFilters = () => {
    setFilters({ genre: '', language: '', author: '' });
    setActiveList(null);
  };

  // ==========================================
  // LÓGICA DERIVADA (RAILS EDITORIALES)
  // ==========================================
  const dashboardData = useMemo(() => {
    const featured = books.find(b => b.new && b.published) || books.find(b => b.published);
    const continueReadingBooks = readings.map(r => Array.isArray(r.books) ? r.books[0] : r.books).filter(Boolean) as Book[];
    const newReleases = books.filter(b => b.new && b.id !== featured?.id);
    const inLanguage = books.filter(b => b.language?.toLowerCase() === lang.toLowerCase() && b.id !== featured?.id);
    const comingSoon = books.filter(b => !b.published);

    return { featured, continueReadingBooks, newReleases, inLanguage, comingSoon };
  }, [books, readings, lang]);

  const openListView = (title: string, data: Book[]) => {
    setActiveList({ title, data });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ==========================================
  // RENDERIZADO
  // ==========================================
  if (!isReady || loading) return <HomeSkeleton />;

  const { featured, continueReadingBooks, newReleases, inLanguage, comingSoon } = dashboardData;

  return (
    <div className="w-full pb-24 overflow-x-hidden relative bg-brand-bg dark:bg-[#121212] min-h-[100dvh] transition-colors duration-500">
      
      <header className="px-6 pt-6 flex justify-between items-center mb-6">
        {activeList && !hasActiveFilters ? (
          <button 
            onClick={() => setActiveList(null)} 
            className="flex items-center gap-2 text-xl font-serif italic text-brand-dark-blue dark:text-brand-gold active:scale-95 transition-transform"
          >
            <ArrowLeft size={24} />
            <span className="truncate max-w-[200px]">{activeList.title}</span>
          </button>
        ) : (
          <h1 className="text-2xl font-serif italic text-brand-dark dark:text-brand-gold transition-colors">
            {t('menu.home') || 'Catálogo'}
          </h1>
        )}
        
        <button 
          onClick={() => setShowFilterPanel(true)}
          className={`relative p-3 rounded-full transition-colors ${hasActiveFilters ? 'bg-brand-dark-blue/10 dark:bg-brand-gold/20' : 'bg-transparent active:bg-brand-gold/5'}`}
        >
          <Filter size={22} className="text-brand-dark-blue dark:text-brand-gold transition-colors" />
          {hasActiveFilters && (
            <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-brand-gold rounded-full border-2 border-brand-bg dark:border-[#121212]" />
          )}
        </button>
      </header>

      {hasActiveFilters ? (
        <div className="px-6">
          {filteredBooks.length > 0 ? (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 items-start w-full">
              {filteredBooks.map((book) => (
                <BookCard key={book.id} book={book} onClick={() => setSelectedBook(book)} />
              ))}
            </div>
          ) : (
            <EmptyCatalogState t={t} />
          )}
        </div>
      ) : activeList ? (
        <div className="px-6">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 items-start w-full">
            {activeList.data.map((book) => (
              <BookCard key={book.id} book={book} onClick={() => setSelectedBook(book)} />
            ))}
          </div>
        </div>
      ) : (
        <div className="flex flex-col w-full pb-8">
          
          {featured && (
            <section 
              className="relative w-full h-[55vh] min-h-[400px] max-h-[550px] flex flex-col justify-end p-6 cursor-pointer group mb-8" 
              onClick={() => setSelectedBook(featured)}
            >
              <div className="absolute inset-0 z-0 overflow-hidden bg-brand-dark">
                <img 
                  src={featured.cover_url || ''} 
                  alt={featured.title} 
                  className="w-full h-full object-cover opacity-60 group-active:scale-105 transition-transform duration-700" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-brand-bg dark:from-[#121212] via-brand-bg/40 dark:via-[#121212]/60 to-transparent transition-colors duration-500" />
              </div>
              
              <div className="relative z-10 w-full max-w-md mx-auto flex flex-col items-center text-center pb-4">
                <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-brand-gold mb-3 bg-white/80 dark:bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-full border border-brand-gold/20 shadow-sm">
                  <Star size={12} fill="currentColor" /> {t('home.new_release_title') || 'Destacado'}
                </span>
                <h2 className="text-4xl font-serif italic text-brand-dark dark:text-white mb-2 leading-tight drop-shadow-sm">
                  {featured.title}
                </h2>
                <p className="text-xs font-bold uppercase tracking-widest text-brand-dark/70 dark:text-gray-300 mb-6 drop-shadow-sm">
                  {featured.author}
                </p>
                <button className="bg-brand-dark-blue dark:bg-brand-gold text-white dark:text-[#121212] px-8 py-3.5 rounded-full font-bold text-[11px] uppercase tracking-widest shadow-xl active:scale-95 transition-transform flex items-center gap-2">
                  <BookOpen size={16} />
                  {t('home.see_details') || 'Ver Detalles'}
                </button>
              </div>
            </section>
          )}

          <div className="px-6 space-y-10">
            
            {continueReadingBooks.length > 0 && (
              <BookRail 
                title={t('home.continue_reading') || 'Sigue leyendo'} 
                books={continueReadingBooks} 
                onSelect={(book) => router.push(`/leer?bookId=${book.id}`)} 
                onViewAll={() => router.push('/lecturas')}
                showPlayIcon
                t={t}
              />
            )}

            {newReleases.length > 0 && (
              <BookRail 
                title={t('home.new_releases') || 'Novedades'} 
                books={newReleases} 
                onSelect={setSelectedBook}
                onViewAll={() => openListView(t('home.new_releases') || 'Novedades', newReleases)}
                highlightNew
                t={t}
              />
            )}

            {inLanguage.length > 0 && (
              <BookRail 
                title={`${t('filters.language')} (${lang.toUpperCase()})`} 
                books={inLanguage} 
                onSelect={setSelectedBook}
                onViewAll={() => openListView(`${t('filters.language')} (${lang.toUpperCase()})`, inLanguage)}
                t={t}
              />
            )}

            {comingSoon.length > 0 && (
              <BookRail 
                title={t('common.coming_soon') || 'Próximamente'} 
                books={comingSoon} 
                onSelect={setSelectedBook} 
                onViewAll={() => openListView(t('common.coming_soon') || 'Próximamente', comingSoon)}
                isComingSoon
                t={t}
              />
            )}

            {books.length > 0 && (
              <BookRail 
                title={t('menu.home') || 'Catálogo Completo'} 
                books={books.slice(0, 8)} 
                onSelect={setSelectedBook} 
                onViewAll={() => openListView(t('menu.home') || 'Catálogo Completo', books)}
                showViewMoreCard
                t={t}
              />
            )}

          </div>
        </div>
      )}

      <AnimatePresence>
        {showFilterPanel && (
          <FilterSidebar 
            t={t}
            filters={filters}
            setFilters={setFilters}
            authors={authors}
            onClose={() => setShowFilterPanel(false)}
            onClear={clearFilters}
            hasActiveFilters={hasActiveFilters}
          />
        )}

        {selectedBook && (
          <BookDetailSheet
            book={selectedBook}
            onClose={() => setSelectedBook(null)}
          />
        )}

        {showNewModal && newReleaseBook && (
          <NewReleaseModal 
            t={t}
            book={newReleaseBook}
            onClose={() => setShowNewModal(false)}
            onRead={() => {
              setShowNewModal(false);
              setSelectedBook(newReleaseBook);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ==========================================
// COMPONENTE: RAIL HORIZONTAL (CARRUSEL)
// ==========================================
interface BookRailProps {
  title: string;
  books: Book[];
  onSelect: (book: Book) => void;
  onViewAll?: () => void;
  showPlayIcon?: boolean;
  highlightNew?: boolean;
  isComingSoon?: boolean;
  showViewMoreCard?: boolean;
  t: (key: string) => string;
}

function BookRail({ title, books, onSelect, onViewAll, showPlayIcon, highlightNew, isComingSoon, showViewMoreCard, t }: BookRailProps) {
  return (
    <section className="w-full">
      <div 
        className={`flex items-center justify-between mb-4 ${onViewAll ? 'cursor-pointer active:opacity-70 transition-opacity' : ''}`}
        onClick={onViewAll}
      >
        <h2 className="text-lg font-serif italic text-brand-dark dark:text-brand-gold">{title}</h2>
        {onViewAll && <ChevronRight size={18} className="text-gray-400" />}
      </div>
      
      <div 
        className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide"
        style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}
      >
        {books.map((book) => (
          <div 
            key={book.id} 
            onClick={() => onSelect(book)}
            className="relative w-[120px] shrink-0 snap-start cursor-pointer group flex flex-col"
          >
            <div className={`relative aspect-[5/8] w-full rounded-xl overflow-hidden shadow-md mb-3 border border-brand-gold/10 transition-transform duration-300 group-active:scale-95 ${isComingSoon ? 'opacity-60 grayscale-[50%]' : ''}`}>
              {book.cover_url ? (
                <img src={book.cover_url} alt={book.title || 'Libro'} className="w-full h-full object-cover" loading="lazy" />
              ) : (
                <div className="w-full h-full bg-gray-100 dark:bg-black/50 flex items-center justify-center">
                  <BookOpen size={24} className="text-gray-300" />
                </div>
              )}

              {isComingSoon && (
                <div className="absolute top-2 left-2 bg-black/80 backdrop-blur-sm text-white text-[8px] px-2 py-1 rounded-full uppercase tracking-widest border border-white/10">
                  Próximamente
                </div>
              )}
              {highlightNew && book.published && (
                <div className="absolute top-2 left-2 bg-brand-gold text-white dark:text-[#121212] text-[8px] px-2 py-1 rounded-full uppercase tracking-widest font-bold shadow-md">
                  Novedad
                </div>
              )}

              {showPlayIcon && (
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="w-12 h-12 flex items-center justify-center bg-black/40 backdrop-blur-md border border-white/20 text-white rounded-full shadow-xl">
                    <PlayCircle size={28} fill="currentColor" className="opacity-90" />
                  </div>
                </div>
              )}
            </div>
            <h3 className="text-sm font-bold text-brand-dark dark:text-gray-200 line-clamp-2 leading-tight mb-1">{book.title}</h3>
            <p className="text-[9px] uppercase font-bold tracking-widest text-brand-gold line-clamp-1">{book.author}</p>
          </div>
        ))}
        
        {/* TARJETA EXTRA PARA "VER MÁS" */}
        {showViewMoreCard && onViewAll && (
          <div 
            onClick={onViewAll}
            className="relative w-[120px] shrink-0 snap-start cursor-pointer group flex flex-col justify-start"
          >
            <div className="relative aspect-[5/8] w-full rounded-xl overflow-hidden shadow-inner mb-3 border border-brand-gold/20 dark:border-brand-gold/30 bg-brand-gold/5 dark:bg-[#1A1A1A] flex flex-col items-center justify-center transition-transform duration-300 group-active:scale-95">
              <div className="w-12 h-12 rounded-full bg-brand-gold/20 dark:bg-brand-gold/10 flex items-center justify-center mb-3">
                <ChevronRight size={28} className="text-brand-gold" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-brand-gold text-center px-2">{t('common.more') || 'Ver más'}</span>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

// ==========================================
// SKELETON LOADER
// ==========================================
function HomeSkeleton() {
  return (
    <div className="w-full pb-24 bg-brand-bg dark:bg-[#121212] min-h-[100dvh] overflow-hidden transition-colors duration-500 pt-6">
      <div className="px-6 flex justify-between items-center mb-6">
        <div className="w-32 h-6 bg-gray-200 dark:bg-white/5 rounded animate-pulse" />
        <div className="w-10 h-10 bg-gray-200 dark:bg-white/5 rounded-full animate-pulse" />
      </div>

      <div className="w-full h-[55vh] min-h-[400px] max-h-[550px] bg-gray-200 dark:bg-white/5 animate-pulse flex flex-col justify-end p-6 mb-8">
        <div className="w-32 h-6 bg-gray-300 dark:bg-white/10 rounded-full mx-auto mb-4" />
        <div className="w-3/4 h-10 bg-gray-300 dark:bg-white/10 rounded-lg mx-auto mb-2" />
        <div className="w-1/2 h-4 bg-gray-300 dark:bg-white/10 rounded-full mx-auto mb-6" />
        <div className="w-40 h-12 bg-gray-300 dark:bg-white/10 rounded-full mx-auto mb-8" />
      </div>

      <div className="px-6 space-y-10">
        {[1, 2].map((rail) => (
          <div key={rail} className="w-full">
            <div className="w-40 h-5 bg-gray-200 dark:bg-white/5 rounded-full mb-4 animate-pulse" />
            <div className="flex gap-4 overflow-hidden">
              {[1, 2, 3].map((card) => (
                <div key={card} className="w-[120px] shrink-0 flex flex-col">
                  <div className="aspect-[5/8] w-full bg-gray-200 dark:bg-white/5 rounded-xl mb-3 animate-pulse" />
                  <div className="w-full h-3 bg-gray-200 dark:bg-white/5 rounded-full mb-2 animate-pulse" />
                  <div className="w-2/3 h-2 bg-gray-200 dark:bg-white/5 rounded-full animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ==========================================
// COMPONENTES EXISTENTES (GRID & FILTROS)
// ==========================================
function BookCard({ book, onClick }: { book: Book; onClick: () => void }) {
  return (
    <div onClick={onClick} className="cursor-pointer group flex flex-col w-full">
      <div className="relative aspect-[5/8] w-full rounded-xl overflow-hidden shadow-md mb-3 border border-brand-gold/5 dark:border-brand-gold/10 active:scale-95 transition-all duration-500 bg-[#f2f2f2] dark:bg-[#1A1A1A]">
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
        {!book.published && (
          <div className="absolute top-2 left-2 bg-black/80 backdrop-blur-sm text-white text-[8px] px-2 py-1 rounded-full uppercase tracking-widest border border-white/10">
            Próximamente
          </div>
        )}
        {book.new && book.published && (
          <div className="absolute top-2 left-2 bg-brand-gold text-white dark:text-[#121212] text-[8px] px-2 py-1 rounded-full uppercase tracking-widest font-bold shadow-md">
            Novedad
          </div>
        )}
      </div>
      <h3 className="text-sm font-bold text-brand-dark dark:text-gray-200 line-clamp-2 leading-tight mb-1">{book.title}</h3>
      <p className="text-[9px] uppercase font-bold tracking-widest text-brand-gold line-clamp-1">{book.author}</p>
    </div>
  );
}

function EmptyCatalogState({ t }: { t: (key: string) => string }) {
  return (
    <div className="text-center py-20">
      <p className="text-xs font-bold uppercase tracking-widest text-brand-dark/40 dark:text-gray-400 mb-2 transition-colors">
        {t('common.no_results')}
      </p>
      <p className="text-[10px] text-brand-dark/30 dark:text-gray-500 transition-colors">
        {t('common.no_results_desc')}
      </p>
    </div>
  );
}

interface FilterSidebarProps {
  t: (key: string) => string;
  filters: FiltersState;
  setFilters: (filters: FiltersState) => void;
  authors: string[];
  onClose: () => void;
  onClear: () => void;
  hasActiveFilters: boolean;
}

function FilterSidebar({ t, filters, setFilters, authors, onClose, onClear, hasActiveFilters }: FilterSidebarProps) {
  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
      onClick={onClose}
      className="fixed inset-0 z-[70] bg-black/40 dark:bg-black/70 backdrop-blur-sm transition-colors"
    >
      <motion.div 
        initial={{ x: '100%' }} animate={{ x: '0%' }} exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        onClick={(e) => e.stopPropagation()}
        className="absolute inset-y-0 right-0 w-[85%] max-w-sm bg-brand-bg dark:bg-[#121212] transition-colors duration-500 shadow-2xl flex flex-col border-l border-brand-gold/10 dark:border-brand-gold/20"
        style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="p-6 flex justify-between items-center border-b border-brand-gold/5 dark:border-brand-gold/10 shrink-0">
          <h2 className="text-2xl font-serif italic text-brand-dark-blue dark:text-brand-gold transition-colors">{t('common.filters')}</h2>
          <button onClick={onClose} className="p-2 active:scale-90 transition-transform">
            <X size={26} className="text-brand-dark-blue dark:text-gray-300 transition-colors" />
          </button>
        </div>

        <div className="flex-grow overflow-y-auto p-6 space-y-8 scrollbar-hide">
          <FilterSelect 
            label={t('filters.genre')} 
            value={filters.genre} 
            onChange={(v: string) => setFilters({ ...filters, genre: v })}
            options={GENRES.map(g => ({ value: g, label: t(`genres_db.${g}`) || g }))}
            defaultLabel={t('filters.all_genres')}
          />
          <FilterSelect 
            label={t('filters.language')} 
            value={filters.language} 
            onChange={(v: string) => setFilters({ ...filters, language: v })}
            options={LANGUAGES.map(l => ({ value: l, label: l }))}
            defaultLabel={t('filters.all_languages')}
          />
          <FilterSelect 
            label={t('filters.author')} 
            value={filters.author} 
            onChange={(v: string) => setFilters({ ...filters, author: v })}
            options={authors.map(a => ({ value: a, label: a }))}
            defaultLabel={t('filters.all_authors')}
          />
        </div>

        <div className="p-6 border-t border-brand-gold/5 dark:border-brand-gold/10 shrink-0 space-y-3">
          <button onClick={onClose} className="w-full bg-brand-dark-blue dark:bg-brand-gold text-white dark:text-[#121212] py-4 rounded-full font-bold text-[11px] uppercase tracking-widest active:scale-95 transition-all shadow-lg shadow-brand-dark-blue/20 dark:shadow-brand-gold/10">
            {t('common.apply_filters')}
          </button>
          {hasActiveFilters && (
            <button onClick={onClear} className="w-full flex items-center justify-center gap-2.5 bg-red-50 dark:bg-red-900/20 text-brand-red dark:text-red-400 border border-red-100 dark:border-red-900/50 py-4 rounded-full font-bold text-[11px] uppercase tracking-widest active:scale-95 transition-all shadow-sm">
              <FilterX size={16} /> {t('common.clear_filters')}
            </button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

interface FilterSelectProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  options: { value: string; label: string }[];
  defaultLabel: string;
}

function FilterSelect({ label, value, onChange, options, defaultLabel }: FilterSelectProps) {
  return (
    <div>
      <label className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-gold mb-3 block">{label}</label>
      <select 
        value={value} 
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-white dark:bg-[#1A1A1A] border border-brand-gold/20 dark:border-brand-gold/30 text-brand-dark-blue dark:text-gray-200 text-xs font-bold uppercase tracking-widest rounded-full px-5 py-3.5 outline-none focus:border-brand-dark-blue dark:focus:border-brand-gold transition-colors appearance-none shadow-sm"
      >
        <option value="">{defaultLabel}</option>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

interface NewReleaseModalProps {
  t: (key: string) => string;
  book: Book;
  onClose: () => void;
  onRead: () => void;
}

function NewReleaseModal({ t, book, onClose, onRead }: NewReleaseModalProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }}
      className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-6 backdrop-blur-sm"
    >
      <div className="bg-white dark:bg-[#1A1A1A] transition-colors duration-500 rounded-[2rem] p-6 max-w-sm w-full text-center shadow-2xl relative">
        <button onClick={onClose} className="absolute top-4 right-4 p-1.5 active:scale-90 bg-gray-100 dark:bg-white/10 rounded-full transition-colors">
          <X size={16} className="text-gray-500 dark:text-gray-300" />
        </button>

        <div className="mt-2 mb-6 text-center">
          <span className="text-[10px] uppercase tracking-[0.3em] text-brand-gold font-black mb-1 block">{t('home.new_release_title')}</span>
          <span className="text-[9px] uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500 font-bold block transition-colors">{t('home.new_release_subtitle')}</span>
        </div>
        
        <div className="w-32 aspect-[5/8] mx-auto rounded-xl overflow-hidden shadow-lg mb-6 border border-brand-gold/20 dark:border-brand-gold/30 transition-colors">
          {book.cover_url ? (
            <img src={book.cover_url} alt={book.title || 'Libro'} className={`w-full h-full object-cover ${!book.published ? 'opacity-[0.45]' : ''}`} />
          ) : (
            <div className="w-full h-full bg-brand-blue-bg dark:bg-black/50 flex items-center justify-center transition-colors">
              <BookOpen className="text-brand-dark/20 dark:text-gray-600" size={32} />
            </div>
          )}
        </div>

        <p className="text-sm font-texto text-brand-dark/80 dark:text-gray-300 mb-8 leading-relaxed px-2 transition-colors">
          {t('home.discover_new_book')} <strong className="text-brand-dark dark:text-white font-bold transition-colors">{book.author}</strong> {t('home.in_apapacho')} <strong className="font-serif italic text-brand-gold text-base">{book.title}</strong>!
        </p>

        <button onClick={onRead} className="w-full bg-brand-dark-blue dark:bg-brand-gold text-white dark:text-[#121212] py-4 rounded-full font-bold text-[11px] uppercase tracking-widest active:scale-95 transition-all shadow-lg shadow-brand-dark-blue/20 dark:shadow-brand-gold/10">
          {t('home.see_details')}
        </button>
      </div>
    </motion.div>
  );
}