"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { BookOpen } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import BookDetailSheet from '@/components/BookDetailSheet';

export default function MiListaPage() {
  const [savedBooks, setSavedBooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBook, setSelectedBook] = useState<any>(null);

  useEffect(() => {
    async function fetchMyList() {
      const { data } = await supabase
        .from('my_list')
        .select(`
          id,
          book_id,
          books (*) 
        `) // <-- EL SECRETO: El asterisco trae el ID, description y published, igual que en el Home
        .order('created_at', { ascending: false });

      if (data) setSavedBooks(data);
      setLoading(false);
    }
    fetchMyList();
  }, []);

  if (loading) return <div className="p-20 text-center font-bold text-brand-gold">Cargando...</div>;

  return (
    <div className="min-h-screen bg-brand-bg px-6 pb-20">
      <header className="pt-8 pb-6 border-b border-brand-gold/10 mb-8">
        <h1 className="text-3xl font-serif italic text-brand-dark">Mi Lista</h1>
      </header>

      <div className="grid grid-cols-3 gap-3 md:grid-cols-4 lg:grid-cols-6 items-start">
        {savedBooks.map((item) => {
          if (!item.books) return null;

          // Este 'book' ahora tiene exactamente los mismos datos que el 'book' del Home
          const book = Array.isArray(item.books) ? item.books[0] : item.books;

          return (
            <div 
              key={item.id} 
              // Se lo pasamos al panel exactamente igual que en el Home
              onClick={() => setSelectedBook(book)}
              className="relative aspect-[5/8] rounded-md overflow-hidden shadow-lg active:scale-95 transition-transform block bg-brand-blue-bg border border-brand-gold/5 cursor-pointer"
            >
              {book.cover_url ? (
                <img src={book.cover_url} alt={book.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <BookOpen className="text-brand-dark/20" size={24} />
                </div>
              )}
            </div>
          );
        })}
      </div>

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