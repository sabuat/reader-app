"use client";

import { useEffect, useState } from 'react';
import { BookOpen, Clock } from 'lucide-react';
import Link from 'next/link';
import { AuthService } from '@/services/authService';
import { BookService } from '@/services/bookService';
import { EmptyState } from '@/components/ui/StateComponents';
import { useLanguage } from '@/hooks/useLanguage';
import { Book, ReadingProgress } from '@/lib/types';

// Tipamos estrictamente el objeto combinado que devuelve Supabase
type ReadingItem = ReadingProgress & {
  books: Book | Book[];
};

export default function MisLecturasPage() {
  // FIX: Tipado estricto en el estado en lugar de 'any[]'
  const [readings, setReadings] = useState<ReadingItem[]>([]);
  const [loading, setLoading] = useState(true);

  // INICIALIZAMOS EL TRADUCTOR
  const { t } = useLanguage();

  useEffect(() => {
    async function fetchMyReadings() {
      setLoading(true);
      try {
        const session = await AuthService.getSession();
        
        // Verificación blindada para TypeScript
        const user = session?.user;
        if (!user?.id) {
          setLoading(false);
          return;
        }

        // LLAMADA LIMPIA USANDO EL SERVICIO
        const data = await BookService.getMyReadings(user.id);
        setReadings((data as unknown as ReadingItem[]) || []);
      } catch (err) {
        console.error("Error cargando lecturas:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchMyReadings();
  }, []);

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-brand-bg dark:bg-[#121212] transition-colors duration-500">
      <div className="w-8 h-8 border-4 border-brand-gold border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-[100dvh] bg-brand-bg dark:bg-[#121212] transition-colors duration-500 px-6 pb-24 overflow-x-hidden">
      <header className="pt-10 pb-6 border-b border-brand-gold/10 dark:border-brand-gold/20 mb-6 transition-colors">
        {/* TÍTULO TRADUCIDO */}
        <h1 className="text-xl font-serif italic text-brand-dark dark:text-brand-gold transition-colors">
          {t('menu.readings')}
        </h1>
      </header>

      {/* ESTADO VACÍO TRADUCIDO */}
      {readings.length === 0 ? (
        <EmptyState 
          title={t('common.no_readings')} 
          description={t('common.no_readings_desc')} 
          icon={<Clock size={32} />} 
        />
      ) : (
        <div className="flex flex-col gap-4">
          {readings.map((item) => {
            const book = Array.isArray(item.books) ? item.books[0] : item.books;
            if (!book) return null;

            // FIX: Tipado seguro para propiedades dinámicas de base de datos
            const totalChapters = (book as Book & { chapters?: number }).chapters || 1; 
            const completedCount = item.completed_chapters ? item.completed_chapters.length : 0;
            const progressPercent = Math.min(Math.round((completedCount / totalChapters) * 100), 100);

            return (
              <Link 
                href={`/leer?id=${book.id}`}
                key={item.book_id} 
                className="flex gap-4 p-4 rounded-xl bg-white dark:bg-[#1A1A1A] shadow-sm border border-brand-gold/10 dark:border-brand-gold/5 active:scale-95 transition-all duration-500"
              >
                <div className="w-[4.5rem] min-w-[4.5rem] shrink-0 self-center">
                  {book.cover_url ? (
                    <img 
                      src={book.cover_url} 
                      alt={book.title || 'Libro'} 
                      className="w-full h-auto rounded bg-brand-blue-bg dark:bg-black/50 shadow-sm" 
                    />
                  ) : (
                    <div className="w-full aspect-[5/8] rounded bg-brand-blue-bg dark:bg-black/50 flex items-center justify-center shadow-sm">
                      <BookOpen className="text-brand-dark/20 dark:text-gray-500" size={16} />
                    </div>
                  )}
                </div>
                
                <div className="flex flex-col justify-between py-1 flex-grow">
                  <div>
                    <h3 className="font-serif italic text-lg text-brand-dark dark:text-gray-200 leading-tight mb-1 line-clamp-2 transition-colors">{book.title || 'Libro sin título'}</h3>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-brand-gold">{book.author || ''}</p>
                  </div>

                  <div className="space-y-3 mt-2">
                    <div className="w-full h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden transition-colors">
                      <div 
                        className="h-full bg-brand-dark-blue dark:bg-brand-gold transition-all duration-700 ease-out" 
                        style={{ width: `${progressPercent}%` }} 
                      />
                    </div>
                    
                    <div className="flex justify-between items-center text-[10px] font-bold uppercase">
                      {/* 🌟 PROGRESO TRADUCIDO */}
                      <span className="text-brand-dark-blue dark:text-brand-gold transition-colors">
                        {progressPercent}% {t('reader.read_percent')}
                      </span>
                      <span className="text-gray-400 dark:text-gray-500 transition-colors">
                        {t('reader.cap')} {item.chapter_number}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}