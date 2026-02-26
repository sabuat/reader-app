"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Bookmark, BookOpen } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function MiListaPage() {
  const [savedBooks, setSavedBooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter(); // Inicializamos el enrutador programático

  useEffect(() => {
    async function fetchMyList() {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('my_list')
          .select(`
            id,
            book_id,
            books (
              id,
              title,
              cover_url
            )
          `)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setSavedBooks(data || []);
      } catch (err) {
        console.error("Error cargando Mi Lista:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchMyList();
  }, []);

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-brand-bg">
      <div className="w-8 h-8 border-4 border-brand-gold border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-brand-bg px-6 pb-20">
      <header className="pt-8 pb-6 border-b border-brand-gold/10 mb-8">
        <span className="text-brand-gold font-bold tracking-[0.2em] text-[10px] uppercase">
          Guardados
        </span>
        <h1 className="text-3xl font-serif italic text-brand-dark">
          Mi Lista
        </h1>
      </header>

      {savedBooks.length === 0 ? (
        <div className="py-20 text-center opacity-40">
          <Bookmark size={48} className="mx-auto mb-4" />
          <p className="text-sm italic text-brand-dark">Aún no has guardado ningún libro.</p>
          <button 
            onClick={() => router.push('/')} 
            className="inline-block mt-4 border-b border-brand-gold text-brand-gold font-bold text-xs uppercase tracking-widest pb-1"
          >
            Explorar librería
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3 md:grid-cols-4 lg:grid-cols-6 items-start">
          {savedBooks.map((item) => {
            const book = Array.isArray(item.books) ? item.books[0] : item.books;
            
            // ESCUDO: Si el libro viene vacío de la base de datos, lo saltamos y evitamos el error.
            if (!book?.id) return null;

            return (
              <div 
                key={item.id} 
                // NAVEGACIÓN DIRECTA: Usamos onClick + router.push en lugar de <Link>
                onClick={() => router.push(`/leer/${book.id}`)}
                className="relative aspect-[5/8] rounded-md overflow-hidden shadow-lg active:scale-95 transition-transform cursor-pointer border border-brand-gold/5 block bg-brand-blue-bg"
              >
                {book.cover_url ? (
                  <img 
                    src={book.cover_url} 
                    alt={book.title} 
                    className="w-full h-full object-cover" 
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <BookOpen className="text-brand-dark/20" size={24} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}