import { supabase } from '@/lib/supabase';
import { BookOpen, ChevronRight } from 'lucide-react';

export default async function BookGallery() {
  // Realizamos la consulta directamente en el servidor para asegurar visibilidad inmediata
  const { data: books, error } = await supabase
    .from('books')
    .select('*')
    .eq('published', true);

  if (error) return <div className="p-10 text-brand-red text-center font-bold">Error de conexión: {error.message}</div>;

  return (
    <main className="min-h-screen bg-brand-bg text-brand-dark">
      <header className="px-6 pt-12 pb-6 max-w-7xl mx-auto border-b border-brand-gold/20">
        <span className="text-brand-gold font-bold tracking-[0.2em] text-[10px] uppercase">
          Catálogo Editorial
        </span>
        <h1 className="text-3xl font-light mt-1">
          Nuestras <span className="font-bold italic">Publicaciones</span>
        </h1>
      </header>

      {/* Grid: 3 columnas en móvil, 5 en escritorio */}
      <div className="px-4 py-10 max-w-7xl mx-auto grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-3 gap-y-10">
        {books?.map((book) => (
          <div key={book.id} className="flex flex-col group">
            {/* Contenedor de Portada */}
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

            <div className="mt-3 px-1">
              {/* Título con estilo original */}
              <h3 className="text-2xl font-serif italic text-brand-gold mb-2 group-hover:text-brand-gold transition">
                {book.title}
              </h3>
              
              {/* Autor: Visible por defecto según tu última versión funcional */}
              <p className="text-sm font-texto uppercase tracking-widest text-gray-500">
                {book.author}
              </p>

              <a className="mt-3 h-[18px] inline-block border-b border-black text-[11px] uppercase font-bold pb-1 hover:text-brand-gold hover:border-brand-gold transition cursor-pointer">
                Ver detalle <ChevronRight size={10} />
              </a>

              <button className="mt-4 w-full bg-brand-dark-blue text-white py-2 rounded-md text-[14px] font-bold active:scale-95 transition-transform">
                LEER AHORA
              </button>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}