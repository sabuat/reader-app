"use client";
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { BookOpen, X, Filter, FilterX } from 'lucide-react';
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

  // Estados para los filtros y el panel
  const [showFilterPanel, setShowFilterPanel] = useState(false);
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
    <div className="w-full px-6 pt-6 pb-20 overflow-x-hidden relative">
      
      {/* HEADER CON BOTÓN DE FILTRO REDISEÑADO */}
      <div className="flex justify-between items-center mb-6">
        <button 
          onClick={() => setShowFilterPanel(true)}
          className={`relative p-3 rounded-full transition-colors ${hasActiveFilters ? 'bg-brand-dark-blue/10' : 'bg-transparent active:bg-brand-gold/5'}`}
        >
          <Filter size={22} className="text-brand-dark-blue" />
          {hasActiveFilters && (
            <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-brand-gold rounded-full border-2 border-brand-bg"></span>
          )}
        </button>
      </div>

      {/* GALERÍA DE LIBROS LIMPIA (SIN ETIQUETAS DE IDIOMA) */}
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
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <p className="text-xs font-bold uppercase tracking-widest text-brand-dark/40 mb-2">No hay resultados</p>
          <p className="text-[10px] text-brand-dark/30">Intenta cambiar los filtros seleccionados.</p>
        </div>
      )}

      {/* ANIME PRESENCE PARA MODALES Y PANEL */}
      <AnimatePresence>
        
        {/* PANEL LATERAL DE FILTROS (SLIDE) */}
        {showFilterPanel && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
            onClick={() => setShowFilterPanel(false)} // Cierra al tocar el overlay
            className="fixed inset-0 z-[70] bg-black/40 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ x: '100%' }} animate={{ x: '0%' }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              onClick={(e) => e.stopPropagation()} // Evita cerrar al tocar dentro
              className="absolute inset-y-0 right-0 w-[85%] max-w-sm bg-brand-bg shadow-2xl flex flex-col border-l border-brand-gold/10"
              style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}
            >
              <div className="p-6 flex justify-between items-center border-b border-brand-gold/5 shrink-0">
                <h2 className="text-2xl font-serif italic text-brand-dark-blue">Filtros</h2>
                <button onClick={() => setShowFilterPanel(false)} className="p-2 active:scale-90 transition-transform">
                  <X size={26} className="text-brand-dark-blue" />
                </button>
              </div>

              {/* CONTENIDO DEL PANEL CON SCROLL INTERNO */}
              <div className="flex-grow overflow-y-auto p-6 space-y-8 scrollbar-hide">
                
                {/* Género */}
                <div>
                  <label className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-gold mb-3 block">Género</label>
                  <select value={selectedGenre} onChange={(e) => setSelectedGenre(e.target.value)}
                    className="w-full bg-white border border-brand-gold/20 text-brand-dark-blue text-xs font-bold uppercase tracking-widest rounded-full px-5 py-3.5 outline-none focus:border-brand-dark-blue transition-colors appearance-none shadow-sm"
                  >
                    <option value="">Todos los géneros</option>
                    {GENRES.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>

                {/* Idioma */}
                <div>
                  <label className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-gold mb-3 block">Idioma</label>
                  <select value={selectedLanguage} onChange={(e) => setSelectedLanguage(e.target.value)}
                    className="w-full bg-white border border-brand-gold/20 text-brand-dark-blue text-xs font-bold uppercase tracking-widest rounded-full px-5 py-3.5 outline-none focus:border-brand-dark-blue transition-colors appearance-none shadow-sm"
                  >
                    <option value="">Todos los idiomas</option>
                    {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>

                {/* Autor */}
                <div>
                  <label className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-gold mb-3 block">Autor</label>
                  <select value={selectedAuthor} onChange={(e) => setSelectedAuthor(e.target.value)}
                    className="w-full bg-white border border-brand-gold/20 text-brand-dark-blue text-xs font-bold uppercase tracking-widest rounded-full px-5 py-3.5 outline-none focus:border-brand-dark-blue transition-colors appearance-none shadow-sm"
                  >
                    <option value="">Todos los autores</option>
                    {authors.map(a => <option key={a} value={a}>{a}</option>)}
                  </select>
                </div>

              </div>

              {/* PIE DEL PANEL FIJO CON BOTONES */}
              <div className="p-6 border-t border-brand-gold/5 shrink-0 space-y-3">
                <button 
                  onClick={() => setShowFilterPanel(false)}
                  className="w-full bg-brand-dark-blue text-white py-4 rounded-full font-bold text-[11px] uppercase tracking-widest active:scale-95 transition-all shadow-lg shadow-brand-dark-blue/20"
                >
                  Aplicar Filtros
                </button>
                {hasActiveFilters && (
                  <button 
                    onClick={() => {
                      setSelectedGenre('');
                      setSelectedLanguage('');
                      setSelectedAuthor('');
                    }}
                    className="w-full flex items-center justify-center gap-2.5 bg-red-50 text-brand-red border border-red-100 py-4 rounded-full font-bold text-[11px] uppercase tracking-widest active:scale-95 transition-all shadow-sm"
                  >
                    <FilterX size={16} /> Limpiar Filtros
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* MODAL DETALLES DEL LIBRO */}
        {selectedBook && (
          <BookDetailSheet
            book={selectedBook}
            onClose={() => setSelectedBook(null)}
          />
        )}

        {/* MODAL NUEVO LANZAMIENTO */}
        {showNewModal && newReleaseBook && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }}
            className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-6 backdrop-blur-sm"
          >
            <div className="bg-white rounded-[2rem] p-6 max-w-sm w-full text-center shadow-2xl relative">
              <button onClick={() => setShowNewModal(false)} className="absolute top-4 right-4 p-1.5 active:scale-90 bg-gray-100 rounded-full">
                <X size={16} className="text-gray-500" />
              </button>

              <div className="mt-2 mb-6 text-center">
                <span className="text-[10px] uppercase tracking-[0.3em] text-brand-gold font-black mb-1 block">¡Novedad Editorial!</span>
                <span className="text-[9px] uppercase tracking-[0.2em] text-gray-400 font-bold block">Recién llegado a la librería</span>
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
                Descubre el nuevo libro de <strong className="text-brand-dark font-bold">{newReleaseBook.author}</strong> en Apapacho Reader. ¡No te pierdas <strong className="font-serif italic text-brand-gold text-base">{newReleaseBook.title}</strong>!
              </p>

              <button 
                onClick={() => {
                  setShowNewModal(false);
                  setSelectedBook(newReleaseBook);
                }}
                className="w-full bg-brand-dark-blue text-white py-4 rounded-full font-bold text-[11px] uppercase tracking-widest active:scale-95 transition-all shadow-lg shadow-brand-dark-blue/20"
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