"use client";

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { BookOpen, X, Play, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { BookService, ReadingBookItem, SavedBookItem } from '@/services/bookService';
import { AuthService } from '@/services/authService';
import { useLanguage } from '@/hooks/useLanguage';
import { Book } from '@/lib/types';
import BookDetailSheet from '@/components/BookDetailSheet';

// ==========================================
// TIPOS DE PESTAÑAS
// ==========================================
type TabType = 'leyendo' | 'guardados';

export default function LecturasPage() {
  const router = useRouter();
  const { t, isReady: langReady } = useLanguage();

  // ==========================================
  // ESTADOS DEL DOMINIO
  // ==========================================
  const [userId, setUserId] = useState<string | null>(null);
  const [readingList, setReadingList] = useState<ReadingBookItem[]>([]);
  const [savedList, setSavedList] = useState<SavedBookItem[]>([]);
  const [loading, setLoading] = useState(true);

  // ==========================================
  // ESTADOS DE UI
  // ==========================================
  const [activeTab, setActiveTab] = useState<TabType>('leyendo');
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [isRemoving, setIsRemoving] = useState<string | null>(null);

  // ==========================================
  // DATA FETCHING
  // ==========================================
  const fetchLists = useCallback(async (uid: string) => {
    // 🌟 Gracias a la caché en BookService, esta llamada será instantánea si se hizo hace poco
    const [readings, saved] = await Promise.all([
      BookService.getMyReadings(uid),
      BookService.getMyList(uid)
    ]);

    return { readings, saved };
  }, []);

  useEffect(() => {
    if (!langReady) return;

    let ignore = false;

    const init = async () => {
      setLoading(true);
      try {
        const session = await AuthService.getSession();
        if (!session?.user) {
          router.push('/');
          return;
        }

        if (!ignore) setUserId(session.user.id);
        const { readings, saved } = await fetchLists(session.user.id);

        if (!ignore) {
          setReadingList(readings);
          setSavedList(saved);
        }

      } catch (error) {
        console.error("[LecturasPage] Error cargando listas:", error);
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    init();

    return () => { ignore = true; };
  }, [langReady, router, fetchLists]);

  // ==========================================
  // ACCIONES
  // ==========================================
  const handleRemoveSaved = async (bookId: string) => {
    if (!userId) return;
    setIsRemoving(bookId);
    try {
      await BookService.removeFromMyList(userId, bookId);
      setSavedList(prev => prev.filter(item => item.book_id !== bookId));
    } catch (error) {
      console.error("[LecturasPage] Error removiendo libro:", error);
    } finally {
      setIsRemoving(null);
    }
  };

  const handleContinueReading = (bookId: string) => {
    router.push(`/leer?bookId=${bookId}`);
  };

  // ==========================================
  // RENDERIZADO
  // ==========================================
  if (!langReady || loading) {
    return (
      <div className="min-h-[100dvh] bg-brand-bg dark:bg-[#121212] flex items-center justify-center transition-colors duration-500">
        <div className="w-8 h-8 border-4 border-brand-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="w-full px-6 pt-6 pb-24 overflow-x-hidden relative bg-brand-bg dark:bg-[#121212] min-h-[100dvh] transition-colors duration-500">
      
      {/* HEADER & TABS */}
      <header className="mb-8">
        <h1 className="text-2xl font-serif italic text-brand-dark dark:text-brand-gold mb-6 transition-colors">
          {t('menu.readings') || 'Mis Lecturas'}
        </h1>

        <div className="flex bg-gray-100 dark:bg-black/40 rounded-full p-1 transition-colors">
          <button 
            onClick={() => setActiveTab('leyendo')}
            className={`flex-1 py-3 rounded-full text-[11px] font-bold uppercase tracking-widest transition-all ${activeTab === 'leyendo' ? 'bg-white dark:bg-[#2A2A2A] text-brand-dark dark:text-brand-gold shadow-sm' : 'text-gray-400 dark:text-gray-500'}`}
          >
            {t('list.reading_tab') || 'Leyendo'}
          </button>
          <button 
            onClick={() => setActiveTab('guardados')}
            className={`flex-1 py-3 rounded-full text-[11px] font-bold uppercase tracking-widest transition-all ${activeTab === 'guardados' ? 'bg-white dark:bg-[#2A2A2A] text-brand-dark dark:text-brand-gold shadow-sm' : 'text-gray-400 dark:text-gray-500'}`}
          >
            {t('list.saved_tab') || 'Guardados'}
          </button>
        </div>
      </header>

      {/* CONTENIDO DE TABS */}
      <main className="w-full">
        {activeTab === 'leyendo' && (
          <div className="space-y-4">
            {readingList.length > 0 ? (
              readingList.map((item) => (
                <ReadingCard 
                  key={item.book_id} 
                  item={item} 
                  onContinue={() => handleContinueReading(item.book_id)}
                  t={t}
                />
              ))
            ) : (
              <EmptyState 
                title={t('list.empty_reading') || 'Nada por aquí'} 
                desc={t('list.empty_reading_desc') || 'Aún no has comenzado ninguna lectura.'} 
                actionText={t('common.explore') || 'Explorar'}
                onAction={() => router.push('/home')}
              />
            )}
          </div>
        )}

        {activeTab === 'guardados' && (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {savedList.length > 0 ? (
              savedList.map((item) => (
                <SavedCard 
                  key={item.id} 
                  item={item} 
                  onClick={() => setSelectedBook(item.book)}
                  onRemove={() => handleRemoveSaved(item.book_id)}
                  isRemoving={isRemoving === item.book_id}
                />
              ))
            ) : (
              <div className="col-span-full">
                <EmptyState 
                  title={t('list.empty_saved') || 'Nada por aquí'} 
                  desc={t('list.empty_saved_desc') || 'No tienes libros guardados.'} 
                  actionText={t('common.explore') || 'Explorar'}
                  onAction={() => router.push('/home')}
                />
              </div>
            )}
          </div>
        )}
      </main>

      {/* DETALLE DEL LIBRO (OVERLAY) */}
      <AnimatePresence>
        {selectedBook && (
          <BookDetailSheet
            book={selectedBook}
            onClose={() => setSelectedBook(null)}
          />
        )}
      </AnimatePresence>
      
    </div>
  );
}

// ==========================================
// SUBCOMPONENTES
// ==========================================

function ReadingCard({ item, onContinue, t }: { item: ReadingBookItem; onContinue: () => void; t: (path: string) => string }) {
  // 🌟 Se elimina resolveBook con any y se usa directamente item.book tipado
  const book = item.book;

  if (!book) return null;

  const totalChapters = book.chapters || 1;
  const progressPercent = Math.min(100, Math.round((item.chapter_number / totalChapters) * 100));
  
  const dateStr = new Date(item.last_read_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

  return (
    <div className="bg-white dark:bg-[#1A1A1A] p-4 rounded-2xl shadow-sm border border-brand-gold/10 flex gap-4 transition-colors relative overflow-hidden group">
      
      {/* CONTENEDOR DE LA PORTADA */}
      <div className="relative w-24 aspect-[5/8] bg-gray-100 dark:bg-black/50 rounded-lg overflow-hidden shrink-0 shadow-inner cursor-pointer" onClick={onContinue}>
        {book.cover_url ? (
          <img src={book.cover_url} alt={book.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center"><BookOpen size={20} className="text-gray-400" /></div>
        )}
        
        {/* BOTÓN PLAY REDISEÑADO */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-14 h-14 flex items-center justify-center bg-black/40 backdrop-blur-md border border-white/20 text-white rounded-full shadow-xl transition-transform group-active:scale-90">
            <Play size={28} fill="currentColor" className="ml-1 opacity-100" />
          </div>
        </div>
      </div>
      
      <div className="flex flex-col justify-center flex-grow py-1">
        <h3 className="font-serif italic text-lg text-brand-dark dark:text-gray-200 line-clamp-2 leading-tight mb-1">{book.title}</h3>
        <p className="text-[10px] uppercase font-bold tracking-widest text-brand-gold mb-3 line-clamp-1">{book.author}</p>
        
        <div className="flex items-center gap-2 mb-2">
          <Clock size={12} className="text-gray-400" />
          <span className="text-[10px] text-gray-500 uppercase tracking-wider">{t('list.last_read')} {dateStr}</span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex-grow h-1.5 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
            <div className="h-full bg-brand-gold transition-all duration-500" style={{ width: `${progressPercent}%` }} />
          </div>
          <span className="text-[10px] font-bold text-brand-dark-blue dark:text-brand-gold w-8 text-right">{progressPercent}%</span>
        </div>
      </div>
    </div>
  );
}

function SavedCard({ item, onClick, onRemove, isRemoving }: { item: SavedBookItem; onClick: () => void; onRemove: () => void; isRemoving: boolean }) {
  // 🌟 Consumo directo de la nueva estructura de caché normalizada
  const book = item.book;
  if (!book) return null;

  return (
    <div className="relative aspect-[5/8] w-full bg-[#f2f2f2] dark:bg-[#1A1A1A] rounded-md overflow-hidden shadow-lg border border-brand-gold/5 dark:border-brand-gold/10 group transition-colors">
      <div onClick={onClick} className="w-full h-full cursor-pointer active:scale-95 transition-transform duration-500">
        {book.cover_url ? (
          <img src={book.cover_url} alt={book.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center"><BookOpen size={24} className="text-gray-400" /></div>
        )}
      </div>
      
      {/* BOTÓN X CON FONDO TRASLÚCIDO AL 30% */}
      <button 
        onClick={(e) => { e.stopPropagation(); onRemove(); }}
        disabled={isRemoving}
        className="absolute top-2 right-2 p-1.5 bg-black/30 backdrop-blur-sm rounded-full shadow-md text-white hover:bg-black/40 active:scale-90 transition-all disabled:opacity-50"
      >
        <X size={16} />
      </button>
    </div>
  );
}

function EmptyState({ title, desc, actionText, onAction }: { title: string; desc: string; actionText: string; onAction: () => void }) {
  return (
    <div className="text-center py-20 px-6">
      <div className="w-16 h-16 bg-gray-100 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
        <BookOpen size={24} className="text-gray-400 dark:text-gray-600" />
      </div>
      <h3 className="text-lg font-serif italic text-brand-dark dark:text-gray-200 mb-2 transition-colors">{title || 'Nada por aquí'}</h3>
      <p className="text-[11px] uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-8 font-bold leading-relaxed transition-colors">
        {desc || 'Explora el catálogo para agregar libros.'}
      </p>
      <button 
        onClick={onAction}
        className="bg-brand-dark-blue dark:bg-brand-gold text-white dark:text-[#121212] px-8 py-4 rounded-full font-bold text-[11px] uppercase tracking-widest shadow-lg active:scale-95 transition-transform"
      >
        {actionText || 'Ir al Catálogo'}
      </button>
    </div>
  );
}