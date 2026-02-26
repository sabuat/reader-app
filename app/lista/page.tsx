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

  if (loading) return <div className="p-20 text-center font-bold text-brand-gold">Cargando...</div>;

  return (
    <div className="p-4 mt-4">
      {/* Usamos 'items-start' para que cada contenedor 
          se ajuste a su propio contenido sin estirarse 
      */}
      <div className="grid grid-cols-3 gap-3 md:grid-cols-4 lg:grid-cols-6 items-start">
        {books.map((book) => (
          <div 
            key={book.id} 
            onClick={() => setSelectedBook(book)}
            /* ELIMINAMOS 'aspect-[2/3]' y 'h-full'.
               El div ahora es un envoltorio transparente que se pega a la imagen.
            */
            className="relative w-full rounded-md overflow-hidden shadow-lg active:scale-95 transition-transform cursor-pointer border border-brand-gold/5 bg-transparent"
          >
            {book.cover_url ? (
              <img 
                src={book.cover_url} 
                alt={book.title} 
                /* 'w-full' asegura que ocupe el ancho de la columna.
                   'h-auto' y 'display: block' eliminan cualquier espacio extra o líneas.
                */
                className="w-full h-auto block" 
              />
            ) : (
              /* Solo para libros sin portada mantenemos una proporción base */
              <div className="aspect-[2/3] bg-brand-blue-bg flex items-center justify-center">
                <BookOpen className="text-brand-dark/20" size={24} />
              </div>
            )}
          </div>
        ))}
      </div>

      <AnimatePresence>
        {selectedBook && (
          <BookDetailSheet book={selectedBook} onClose={() => setSelectedBook(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}