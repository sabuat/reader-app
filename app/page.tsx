import { supabase } from '@/lib/supabase';
import { BookOpen, ChevronRight } from 'lucide-react';

export default async function BookGallery() {
  const { data: books, error } = await supabase
    .from('books')
    .select('*')
    .eq('published', true);

  if (error) {
    return (
      <div className="p-10 text-brand-red text-center font-bold bg-brand-bg min-h-screen">
        Error de conexión con la base de datos.
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-brand-bg text-brand-dark">
      {/* Header con colores de marca */}
      <header className="px-6 pt-12 pb-6 max-w-7xl mx-auto border-b border-brand-gold/20">
        <span className="text-brand-gold font-bold tracking-[0.2em] text-[10px] uppercase">
          Catálogo Editorial
        </span>
        <h1 className="text-3xl font-light mt-1">
          Nuestras <span className="font-bold italic">Publicaciones</span>
        </h1>
      </header>

      {/* Grid: 3 columnas en móvil (grid-cols-3) y 5 en desktop */}
      <div className="px-4 py-10 max-w-7xl mx-auto grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-3 gap-y-10">
        {books?.map((book) => (
          <div key={book.id} className="flex flex-col group">
            {/* Contenedor de Portada - Mantiene proporción original sin cortes */}
            <div className="relative w-full rounded-md overflow-hidden shadow-sm bg-white border border-brand-dark/5">
              {book.cover_url ? (
                <img 
                  src={book.cover_url} 
                  alt={book.title} 
                  className="w-full h-auto object-contain" 
                />
              ) : (
                <div className="aspect-[2/3] flex items-center justify-center bg-brand-blue-bg">
                  <BookOpen size={20} className="text-brand-dark/20" />
                </div>
              )}
            </div>

            {/* Información del Libro */}
            <div className="mt-3 px-1">
              <h2 className="text-[16px] leading-[1.1] font-semibold text-brand-dark uppercase line-clamp-2">
                {book.title}
              </h2>
              <h2 className="text-[14px] italic mt-2 Smd:text-xs font-medium leading-tight line-clamp-2 uppercase">
                {book.author}
              </h2>              
              <button className="mt-1 text-[14px] text-brand-blue flex items-center gap-0.5 font-medium italic hover:underline hover:text-brand-dark-blue transition-colors">
                Ver detalle <ChevronRight size={10} />
              </button>

              {/* Botón de acción con color brand-dark-blue */}
              <button className="mt-4 w-full bg-brand-dark-blue text-white py-2 rounded-md text-[14px] font-bold hover:opacity-90 transition-opacity">
                LEER AHORA
              </button>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}