"use client";
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { BookOpen, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import BookDetailSheet from '@/components/BookDetailSheet';

export default function BookGallery() {
  const [books, setBooks] = useState<any[]>([]);
  const [selectedBook, setSelectedBook] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // NUEVO: Estados para el modal de lanzamiento
  const [newReleaseBook, setNewReleaseBook] = useState<any>(null);
  const [showNewModal, setShowNewModal] = useState(false);

  useEffect(() => {
    async function fetchBooks() {
      const { data } = await supabase
        .from('books')
        .select('*')
        .order('published', { ascending: false });

      if (data) {
        setBooks(data);
        
        // Buscamos si hay algún libro marcado como "new" (true)
        const promotedBook = data.find(b => b.new === true);
        
        // Si existe un libro nuevo Y el usuario no ha visto el modal en esta sesión
        if (promotedBook && !sessionStorage.getItem('apapacho_new_seen')) {
          setNewReleaseBook(promotedBook);
          setShowNewModal(true);
          // Marcamos en la memoria temporal que ya lo vio
          sessionStorage.setItem('apapacho_new_seen', 'true');
        }
      }
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
    <div className="w-full px-6 pt-6 pb-20 overflow-x-hidden">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 items-start w-full">
        {books.map((book) => (
          <div
            key={book.id}
            onClick={() => setSelectedBook(book)}
            className="relative aspect-[5/8] w-full bg-[#f2f2f2] rounded-md overflow-hidden shadow-lg active:scale-95 transition-transform cursor-pointer border border-brand-gold/5 block"
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

      {/* MODAL DEL LIBRO (El panel deslizable normal) */}
      <AnimatePresence>
        {selectedBook && (
          <BookDetailSheet
            book={selectedBook}
            onClose={() => setSelectedBook(null)}
          />
        )}
      </AnimatePresence>

      {/* MODAL DE NUEVO LANZAMIENTO (Aparece una vez por sesión) */}
      <AnimatePresence>
        {showNewModal && newReleaseBook && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-6 backdrop-blur-sm"
          >
            <div className="bg-white rounded-[2rem] p-6 max-w-sm w-full text-center shadow-2xl">
              <div className="flex justify-between items-center mb-6">
                <span className="text-[10px] uppercase tracking-[0.3em] text-brand-gold font-bold">¡Nuevo Lanzamiento!</span>
                <button onClick={() => setShowNewModal(false)} className="p-1 active:scale-90 bg-gray-100 rounded-full">
                  <X size={16} className="text-gray-500" />
                </button>
              </div>
              
              {/* Portada del libro promocionado */}
              <div className="w-32 aspect-[5/8] mx-auto rounded-xl overflow-hidden shadow-lg mb-6 border border-brand-gold/20">
                {newReleaseBook.cover_url ? (
                  <img src={newReleaseBook.cover_url} alt={newReleaseBook.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-brand-blue-bg flex items-center justify-center">
                    <BookOpen className="text-brand-dark/20" size={32} />
                  </div>
                )}
              </div>

              {/* Mensaje dinámico */}
              <p className="text-sm font-texto text-brand-dark/80 mb-8 leading-relaxed px-2">
                El nuevo libro de <strong className="text-brand-dark font-bold">{newReleaseBook.author}</strong> está disponible en Apapacho Reader. ¡No dejes de leer <strong className="font-serif italic text-brand-gold">{newReleaseBook.title}</strong>!
              </p>

              <button 
                onClick={() => {
                  setShowNewModal(false);
                  setSelectedBook(newReleaseBook); // Si tocan el botón, se cierra el modal y abre los detalles de ese libro automáticamente
                }}
                className="w-full bg-brand-dark-blue text-white py-4 rounded-2xl font-bold text-[11px] uppercase tracking-widest active:scale-95 transition-all shadow-lg shadow-brand-dark-blue/20"
              >
                Ver Detalles
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}