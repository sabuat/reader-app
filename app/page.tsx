import { supabase } from '@/lib/supabase';
import { BookOpen, User, ArrowRight } from 'lucide-react';

export default async function BookGallery() {
  const { data: books, error } = await supabase
    .from('books')
    .select('*')
    .eq('published', true);

  if (error) return <div className="p-10 text-red-500">Error: {error.message}</div>;

  return (
    <main className="min-h-screen bg-white">
      {/* Barra superior con color de marca */}
      <nav className="border-b border-gray-100 py-4 px-8 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-apapacho-primary rounded-full" /> 
          <span className="font-bold text-xl tracking-tighter text-apapacho-secondary">APAPACHO</span>
        </div>
      </nav>

      <section className="p-8 md:p-16 max-w-7xl mx-auto">
        <header className="mb-12">
          <h1 className="text-4xl font-light text-apapacho-secondary mb-2">
            Nuestros <span className="font-bold text-apapacho-primary">Libros</span>
          </h1>
          <div className="h-1 w-20 bg-apapacho-primary" />
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {books?.map((book) => (
            <div key={book.id} className="group cursor-pointer">
              {/* Portada con efecto de profundidad */}
              <div className="relative aspect-[2/3] mb-4 shadow-lg group-hover:shadow-2xl transition-all duration-300 transform group-hover:-translate-y-2">
                {book.cover_url ? (
                  <img 
                    src={book.cover_url} 
                    alt={book.title} 
                    className="object-cover w-full h-full rounded-sm"
                  />
                ) : (
                  <div className="bg-apapacho-light w-full h-full flex flex-col items-center justify-center border border-apapacho-primary/20">
                    <BookOpen className="text-apapacho-primary mb-2" size={40} />
                    <span className="text-[10px] uppercase font-bold text-apapacho-primary px-4 text-center">
                      {book.title}
                    </span>
                  </div>
                )}
                {/* Overlay al hacer hover */}
                <div className="absolute inset-0 bg-apapacho-secondary/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="bg-white text-apapacho-secondary px-4 py-2 text-xs font-bold rounded-full">
                    VER DETALLES
                  </span>
                </div>
              </div>

              {/* Info con estilo minimalista */}
              <h2 className="font-bold text-apapacho-secondary text-lg leading-tight truncate">
                {book.title}
              </h2>
              <div className="flex items-center gap-2 text-gray-500 text-sm mt-1">
                <User size={12} />
                <span>{book.author}</span>
              </div>
              
              <div className="mt-4 flex items-center gap-1 text-apapacho-accent font-bold text-xs group-hover:gap-2 transition-all">
                LEER AHORA <ArrowRight size={14} />
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}