"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { BookOpen } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import BookDetailSheet from '@/components/BookDetailSheet';

export default function BookGallery() {
  const [books, setBooks] = useState<any[]>([]);
  const [selectedBook, setSelectedBook] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchBooks() {
      const { data } = await supabase.from('books').select('*').order('published', { ascending: false });
      if (data) setBooks(data);
      setLoading(false);
    }
    fetchBooks();
  }, []);

  if (loading) return <div className="min-h-screen bg-brand-bg flex items-center justify-center font-bold text-brand-dark">Cargando...</div>;

  return (
    <main className="min-h-screen bg-brand-bg pb-20">
      <header className="px-4 pt-10 pb-4">
        <h1 className="text-xl font-sans tracking-widest text-brand-dark uppercase">Librería</h1>
      </header>

      {/* Grid de portadas simple: 3 columnas siempre */}
      <div className="px-2 grid grid-cols-3 gap-2 md:grid-cols-4 lg:grid-cols-6">
        {books.map((book) => (
          <div 
            key={book.id} 
            onClick={() => setSelectedBook(book)}
            className="relative aspect-[2/3] rounded-sm overflow-hidden shadow-md active:scale-95 transition-transform cursor-pointer"
          >
            {book.cover_url ? (
              <img src={book.cover_url} alt={book.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-brand-blue-bg flex items-center justify-center">
                <BookOpen className="text-brand-dark/20" />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Pantalla de detalle que desliza desde la derecha */}
      <AnimatePresence>
        {selectedBook && (
          <BookDetailSheet 
            book={selectedBook} 
            onClose={() => setSelectedBook(null)} 
          />
        )}
      </AnimatePresence>
    </main>
  );
}