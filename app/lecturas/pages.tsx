"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { BookOpen, ChevronRight, Clock } from 'lucide-react';
import Link from 'next/link';

export default function MisLecturasPage() {
  const [readings, setReadings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMyReadings() {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('reading_progress')
          .select(`
            chapter_number,
            completed_chapters,
            last_read_at,
            book_id,
            books (id, title, author, cover_url, chapters)
          `)
          .order('last_read_at', { ascending: false });

        if (error) throw error;
        setReadings(data || []);
      } catch (err) {
        console.error("Error cargando mis lecturas:", err);
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
    <div className="min-h-screen bg-brand-bg px-6 pb-20">
      <header className="pt-8 pb-6 border-b border-brand-gold/10 mb-8">
        <span className="text-brand-gold font-bold tracking-[0.2em] text-[10px] uppercase">Biblioteca</span>
        <h1 className="text-3xl font-serif italic text-brand-dark">Mis Lecturas</h1>
      </header>

      {readings.length === 0 ? (
        <div className="py-20 text-center opacity-40">
          <BookOpen size={48} className="mx-auto mb-4" />
          <p className="text-sm italic">Aún no has comenzado ninguna lectura.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {readings.map((item) => {
            const book = item.books;
            const totalCh = book.chapters || 1;
            const completedCount = item.completed_chapters?.length || 0;
            const progressPercent = Math.min(Math.round((completedCount / totalCh) * 100), 100);

            return (
              <Link key={book.id} href={`/leer/${book.id}`} className="flex gap-4 bg-white p-4 rounded-3xl shadow-sm border border-brand-gold/5 active:scale-95 transition-transform">
                <div className="relative w-24 h-36 shrink-0 rounded-xl overflow-hidden shadow-md bg-brand-blue-bg">
                  <img src={book.cover_url} alt={book.title} className="w-full h-full object-cover" />
                </div>
                <div className="flex flex-col justify-between py-1 flex-grow">
                  <div>
                    <h3 className="font-serif italic text-lg text-brand-dark leading-tight mb-1">{book.title}</h3>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-brand-gold">{book.author}</p>
                  </div>
                  <div className="space-y-3">
                    <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-brand-dark-blue transition-all" style={{ width: `${progressPercent}%` }} />
                    </div>
                    <div className="flex justify-between items-center text-[10px] font-bold uppercase">
                      <span className="text-brand-dark-blue">{progressPercent}% Completado</span>
                      <span className="text-gray-400">Cap. {item.chapter_number}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center text-brand-gold/30 px-1"><ChevronRight size={20} /></div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}