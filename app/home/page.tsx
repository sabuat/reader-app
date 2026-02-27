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
      const { data } = await supabase
        .from('books')
        .select('*')
        .order('published', { ascending: false });

      if (data) setBooks(data);
      setLoading(false);
    }

    fetchBooks();
  }, []);

  if (loading) {
    return (
      <div className="p-20 text-center font-bold text-brand-gold">
        Cargando...
      </div>
    );
  }

  return (
    <div className="p-4 mt-4">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 items-start">
        {books.map((book) => (
          <div
            key={book.id}
            onClick={() => setSelectedBook(book)}
            className="relative aspect-[5/8] bg-[#f2f2f2] rounded-md overflow-hidden shadow-lg active:scale-95 transition-transform cursor-pointer border border-brand-gold/5"
          >
            {book.cover_url ? (
              <img
                src={book.cover_url}
                alt={book.title}
                className="absolute inset-0 w-full h-full object-cover block"
              />
            ) : (
              <div className="w-full h-full bg-brand-blue-bg flex items-center justify-center">
                <BookOpen className="text-brand-dark/20" size={24} />
              </div>
            )}
          </div>
        ))}
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