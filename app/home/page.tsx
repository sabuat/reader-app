"use client";
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { BookOpen, X, FilterX } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import BookDetailSheet from '@/components/BookDetailSheet';

// Listas estáticas sacadas de tu base de datos (ENUMs)
const GENRES = [
  'Cuentos', 'Ensayos', 'Literatura Fantástica', 
  'Literatura Romántica', 'Microrelatos', 'Novela', 
  'Novela Corta', 'Poesia'
];
const LANGUAGES = ['EN', 'ES', 'IT', 'PT'];

export default function BookGallery() {
  const [books, setBooks] = useState<any[]>([]);
  const [selectedBook, setSelectedBook] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [newReleaseBook, setNewReleaseBook] = useState<any>(null);
  const [showNewModal, setShowNewModal] = useState(false);

  // Estados para los filtros
  const [selectedGenre, setSelectedGenre] = useState<string>('');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('');
  const [selectedAuthor, setSelectedAuthor] = useState<string>('');

  useEffect(() => {
    async function fetchBooks() {
      const { data } = await supabase
        .from('books')
        .select('*')
        .order('published', { ascending: false })
        .order('identificador', { ascending: true });

      if (data) {
        setBooks(data);
        
        const promotedBook = data.find(b => b.new === true);
        
        // Usamos localStorage y el ID del libro. Solo lo verá UNA vez.
        if (promotedBook && !localStorage.getItem(`apapacho_new_seen_${promotedBook.id}`)) {
          setNewReleaseBook(promotedBook);
          setShowNewModal(true);
          localStorage.setItem(`apapacho_new_seen_${promotedBook.id}`, 'true');
        }
      }
      setLoading(false);
    }

    fetchBooks();
  }, []);

  // 1. Extraemos los autores únicos de los libros para el filtro
  const authors = Array.from(new Set(books.map(b => b.author).filter(Boolean))) as string[];

  // 2. Aplicamos los filtros
  const filteredBooks = books.filter((book) => {
    const matchGenre = selectedGenre ? book.genre === selectedGenre : true;
    const matchLanguage = selectedLanguage ? book.language === selectedLanguage : true;
    const matchAuthor = selectedAuthor ? book.author === selectedAuthor : true;
    
    return matchGenre && matchLanguage && matchAuthor;
  });

  const hasActiveFilters = selectedGenre || selectedLanguage || selectedAuthor;

  if (loading) {
    return (
      <div className="p-20 text-center font-bold text-[11px] uppercase tracking-widest text-brand-gold">
        Cargando...
      </div>
    );
  }

  return (
    <div className="w-full px-6 pt-6 pb-20 overflow-x-hidden">
      
      {/* BARRA DE FILTROS DESLIZABLE */}
      <div className="flex gap-2 overflow-x-auto pb-4 mb-4 -mx-6 px-6 scrollbar-hide snap-x">
        <select
          value={selectedGenre}
          onChange={(e) => setSelectedGenre(e.target.value)}
          className="snap-start bg-white border border-brand-gold/20 text-brand-dark text-[10px] font-bold uppercase tracking-widest rounded-full px-4 py-2.5 outline-none focus:border-brand-gold shrink-0 appearance-none shadow-sm"
        >
          <option value="">Género: Todos</option>
          {GENRES.map(g => <option key={g} value={g}>{g}</option>)}
        </select>

        <select
          value={selectedLanguage}
          onChange={(e) => setSelectedLanguage(e.target.value)}
          className="snap-start bg-white border border-brand-gold/20 text-brand-dark text-[10px] font-bold uppercase tracking-widest rounded-full px-4 py-2.5 outline-none focus:border-brand-gold shrink-0 appearance-none shadow-sm"
        >
          <option value="">Idioma: Todos</option>
          {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
        </select>

        <select
          value={selectedAuthor}
          onChange={(e) => setSelectedAuthor(e.target.value)}
          className="snap-start bg-white border border-brand-gold/20 text-brand-dark text-[10px] font-bold uppercase tracking-widest rounded-full px-4 py-2.5 outline-none focus:border-brand-gold shrink-0 appearance-none shadow-sm"
        >
          <option value="">Autor: Todos</option>
          {authors.map(a => <option key={a} value={a}>{a}</option>)}
        </select>

        {/* Botón para limpiar filtros */}
        {hasActiveFilters && (
          <button 
            onClick={() => {
              setSelectedGenre('');
              setSelectedLanguage('');
              setSelectedAuthor('');
            }}
            className="snap-start flex items-center justify-center bg-red-50 text-brand-red border border-red-100 rounded-full px-4 py-2.5 shrink-0 active:scale-95 transition-transform"
          >
            <FilterX size={14} />
          </button>
        )}
      </div>

      {/* GALERÍA DE LIBROS */}
      {filteredBooks.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 items-start w-full">
          {filteredBooks.map((book) => (
            <div
              key={book.id}
              onClick={() => setSelectedBook(book)}
              className="relative aspect-[5/8] w-full bg-[#f2f2f2] rounded-md overflow-hidden shadow-lg active:scale-95 transition-transform cursor-pointer border border-brand-gold/5 block group"
            >
              {book.cover_url ? (
                <img 
                  src={book.cover_url} 
                  alt={book.title} 
                  className={`w-full h-full object-cover ${!book.published ? 'opacity-30' : ''}`} 
                />
              ) : (
                <div className="w-full h-full bg-brand-blue-bg flex items-center justify-center">
                  <BookOpen className="text-brand-dark/20" size={24} />
                </div>
              )}
              {/* Etiqueta de idioma */}
              {book.language && (
                <div className="absolute top-1 right-1 bg-black/60 backdrop-blur-sm text-white text-[8px] font-bold px-1.5 py-0.5 rounded-sm uppercase">
                  {book.language}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <p className="text-xs font-bold uppercase tracking-widest text-brand-dark/40 mb-2">No hay resultados</p>
          <p className="text-[10px] text-brand-dark/30">Intenta cambiar los filtros seleccionados.</p>
        </div>
      )}

      {/* MODAL DETALLES DEL LIBRO */}
      <AnimatePresence>
        {selectedBook && (
          <BookDetailSheet
            book={selectedBook}
            onClose={() => setSelectedBook(null)}
          />
        )}
      </AnimatePresence>

      {/* MODAL NUEVO LANZAMIENTO */}
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
              
              <div className="w-32 aspect-[5/8] mx-auto rounded-xl overflow-hidden shadow-lg mb-6 border border-brand-gold/20">
                {newReleaseBook.cover_url ? (
                  <img src={newReleaseBook.cover_url} alt={newReleaseBook.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-brand-blue-bg flex items-center justify-center">
                    <BookOpen className="text-brand-dark/20" size={32} />
                  </div>
                )}
              </div>

              <p className="text-sm font-texto text-brand-dark/80 mb-8 leading-relaxed px-2">
                El nuevo libro de <strong className="text-brand-dark font-bold">{newReleaseBook.author}</strong> está disponible en Apapacho Reader. ¡No dejes de leer <strong className="font-serif italic text-brand-gold">{newReleaseBook.title}</strong>!
              </p>

              <button 
                onClick={() => {
                  setShowNewModal(false);
                  setSelectedBook(newReleaseBook);
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