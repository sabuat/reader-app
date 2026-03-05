"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { BookOpen, Clock } from 'lucide-react';
import Link from 'next/link';

export default function MisLecturasPage() {
  const [readings, setReadings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMyReadings() {
      setLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          setLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from('reading_progress')
          .select(`
            chapter_number,
            completed_chapters,
            last_read_at,
            book_id,
            books (
              id,
              title,
              author,
              cover_url,
              chapters
            )
          `)
          .eq('user_id', user.id) 
          .order('last_read_at', { ascending: false });

        if (error) throw error;
        setReadings(data || []);
      } catch (err) {
        console.error("Error cargando lecturas:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchMyReadings();
  }, []);

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-brand-bg">
      <div className="w-8 h-8 border-4 border-brand-gold border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-[100dvh] bg-brand-bg px-6 pb-24 overflow-x-hidden">
      <header className="pt-10 pb-6 border-b border-brand-gold/10 mb-6">
        <h1 className="text-xl font-serif italic text-brand-dark">Mis Lecturas</h1>
      </header>

      {readings.length === 0 ? (
        <div className="text-center py-20">
          <Clock className="mx-auto text-brand-dark/20 mb-4" size={32} />
          <p className="text-xs font-bold uppercase tracking-widest text-brand-dark/40 mb-2">Aún no hay lecturas</p>
          <p className="text-[10px] text-brand-dark/30">Los libros que comiences a leer aparecerán aquí.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {readings.map((item) => {
            const book = Array.isArray(item.books) ? item.books[0] : item.books;
            if (!book) return null;

            const totalChapters = book.chapters || 1; 
            const completedCount = item.completed_chapters ? item.completed_chapters.length : 0;
            const progressPercent = Math.min(Math.round((completedCount / totalChapters) * 100), 100);

            return (
              <Link 
                href={`/leer?id=${book.id}`}
                key={item.book_id} 
                className="flex gap-4 p-4 rounded-xl bg-white shadow-sm border border-brand-gold/10 active:scale-95 transition-transform"
              >
                {/* CONTENEDOR DE LA PORTADA BLINDADO CONTRA APLASTAMIENTO */}
                <div className="w-[4.5rem] min-w-[4.5rem] aspect-[5/8] shrink-0 rounded overflow-hidden bg-brand-blue-bg relative">
                  {book.cover_url ? (
                    <img src={book.cover_url} alt={book.title} className="absolute inset-0 w-full h-full object-cover" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <BookOpen className="text-brand-dark/20" size={16} />
                    </div>
                  )}
                </div>
                
                <div className="flex flex-col justify-between py-1 flex-grow">
                  <div>
                    <h3 className="font-serif italic text-lg text-brand-dark leading-tight mb-1 line-clamp-2">{book.title}</h3>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-brand-gold">{book.author}</p>
                  </div>

                  <div className="space-y-3 mt-2">
                    <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-brand-dark-blue transition-all duration-700 ease-out" 
                        style={{ width: `${progressPercent}%` }} 
                      />
                    </div>
                    
                    <div className="flex justify-between items-center text-[10px] font-bold uppercase">
                      <span className="text-brand-dark-blue">{progressPercent}% Leído</span>
                      <span className="text-gray-400">Cap. {item.chapter_number}</span>
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