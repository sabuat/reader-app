import { supabase } from '@/lib/supabase';
import { BookOpen } from 'lucide-react';
import { BookModal } from '@/components/BookModal';

export default async function BookGallery() {
  // Eliminamos .eq('published', true) para que traiga todos los libros
  const { data: books, error } = await supabase
    .from('books')
    .select('*')
    .order('published', { ascending: false });

  if (error) return <div className="p-10 text-brand-red text-center">Error: {error.message}</div>;

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

      <div className="px-4 py-10 max-w-7xl mx-auto grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-3 gap-y-10">
        {books?.map((book) => (
          <div key={book.id} className="flex flex-col group h-full">
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

            <div className="mt-3 px-1 flex flex-col flex-grow">
              <h3 className="text-xl font-serif italic text-brand-gold mb-2 transition">
                {book.title}
              </h3>
              
              <p className="hidden md:block text-sm font-texto uppercase tracking-widest text-gray-500">
                {book.author}
              </p>

              <div className="mt-3">
                <BookModal book={book} />
              </div>

              {/* Lógica condicional para el botón */}
              {book.published ? (
                <button className="mt-auto w-full bg-brand-dark-blue text-white py-2 rounded-md text-[14px] font-bold active:scale-95 transition-transform">
                  LEER AHORA
                </button>
              ) : (
                <button 
                  disabled 
                  className="mt-auto w-full bg-gray-400 text-white py-2 rounded-md text-[14px] font-bold cursor-not-allowed opacity-70"
                >
                  PRÓXIMAMENTE
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}