"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { BookOpen, FilterX } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import BookDetailSheet from '@/components/BookDetailSheet';

// Listas estáticas sacadas de tu base de datos (ENUMs)
const GENRES = [
  'Cuentos', 'Ensayos', 'Literatura Fantástica', 
  'Literatura Romántica', 'Microrelatos', 'Novela', 
  'Novela Corta', 'Poesia'
];
const LANGUAGES = ['EN', 'ES', 'IT', 'PT'];

export default function MiListaPage() {
  const [savedBooks, setSavedBooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBook, setSelectedBook] = useState<any>(null);

  // Estados para los filtros
  const [selectedGenre, setSelectedGenre] = useState<string>('');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('');
  const [selectedAuthor, setSelectedAuthor] = useState<string>('');

  useEffect(() => {
    async function fetchMyList() {
      const { data } = await supabase
        .from('my_list')
        .select(`
          id,
          book_id,
          books (*) 
        `) 
        .order('created_at', { ascending: false });

      if (data) setSavedBooks(data);
      setLoading(false);
    }
    fetchMyList();
  }, []);

  // 1. Extraemos los autores únicos de los libros guardados para el filtro
  const authors = Array.from(new Set(savedBooks.map((item) => {
    const book = Array.isArray(item.books) ? item.books[0] : item.books;
    return book?.author;
  }).filter(Boolean))) as string[];

  // 2. Aplicamos los filtros a la lista antes de mostrarla
  const filteredBooks = savedBooks.filter((item) => {
    const book = Array.isArray(item.books) ? item.books[0] : item.books;
    if (!book) return false;

    const matchGenre = selectedGenre ? book.genre === selectedGenre : true;
    const matchLanguage = selectedLanguage ? book.language === selectedLanguage : true;
    const matchAuthor = selectedAuthor ? book.author === selectedAuthor : true;

    return matchGenre && matchLanguage && matchAuthor;
  });

  const hasActiveFilters = selectedGenre || selectedLanguage || selectedAuthor;

  if (loading) return <div className="p-20 text-center font-bold text-[11px] uppercase tracking-widest text-brand-gold">Cargando...</div>;

  return (
    <div className="min-h-[100dvh] bg-brand-bg px-6 pb-24 overflow-x-hidden">
      <header className="pt-10 pb-6 border-b border-brand-gold/10 mb-6 flex justify-between items-end">
        <h1 className="text-3xl font-serif italic text-brand-dark">Mi Lista</h1>
      </header>

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

        {/* Botón para limpiar filtros si hay alguno activo */}
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

      {/* RESULTADOS */}
      {filteredBooks.length > 0 ? (
        <div className="grid grid-cols-3 gap-3 md:grid-cols-4 lg:grid-cols-6 items-start">
          {filteredBooks.map((item) => {
            const book = Array.isArray(item.books) ? item.books[0] : item.books;

            return (
              <div 
                key={item.id} 
                onClick={() => setSelectedBook(book)}
                className="relative aspect-[5/8] rounded-md overflow-hidden shadow-lg active:scale-95 transition-transform block bg-brand-blue-bg border border-brand-gold/5 cursor-pointer group"
              >
                {book.cover_url ? (
                  <img src={book.cover_url} alt={book.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <BookOpen className="text-brand-dark/20" size={24} />
                  </div>
                )}
                {/* Etiqueta de idioma en la esquina del libro (Opcional, pero se ve muy pro) */}
                {book.language && (
                  <div className="absolute top-1 right-1 bg-black/60 backdrop-blur-sm text-white text-[8px] font-bold px-1.5 py-0.5 rounded-sm uppercase">
                    {book.language}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-20">
          <p className="text-xs font-bold uppercase tracking-widest text-brand-dark/40 mb-2">No hay resultados</p>
          <p className="text-[10px] text-brand-dark/30">Intenta cambiar los filtros seleccionados.</p>
        </div>
      )}

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