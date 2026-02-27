"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { ChevronLeft, ChevronRight, BookOpen } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

export default function ReaderPage() {
  const params = useParams();
  const router = useRouter();
  
  const [userId, setUserId] = useState<string | null>(null);
  const [chapters, setChapters] = useState<any[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [completedChapters, setCompletedChapters] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);

  const [fontSize, setFontSize] = useState('text-lg');
  const [nightMode, setNightMode] = useState(false);

  useEffect(() => {
    const savedFontSize = localStorage.getItem('apapacho_fontSize');
    const savedNightMode = localStorage.getItem('apapacho_nightMode') === 'true';
    if (savedFontSize) setFontSize(savedFontSize);
    if (savedNightMode) setNightMode(savedNightMode);

    async function loadData() {
      if (!params.id) return;
      setLoading(true);
      
      try {
        // 1. Validar al usuario activo
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push('/'); // Si no está logueado, lo mandamos al login
          return;
        }
        setUserId(user.id);

        // 2. Cargar los capítulos del libro
        const { data: chs } = await supabase
          .from('chapters')
          .select('*')
          .eq('book_id', params.id)
          .order('chapter_number', { ascending: true });

        // 3. Cargar el progreso ESPECÍFICO de este usuario y este libro
        const { data: prog } = await supabase
          .from('reading_progress')
          .select('chapter_number, completed_chapters')
          .eq('book_id', params.id)
          .eq('user_id', user.id) // <-- AQUÍ FILTRAMOS POR USUARIO
          .maybeSingle();

        if (chs) setChapters(chs);
        
        if (prog) {
          setCompletedChapters(prog.completed_chapters || []);
          const lastIndex = chs?.findIndex(c => c.chapter_number === prog.chapter_number);
          if (lastIndex !== -1) setCurrentIdx(lastIndex);
        }
      } catch (err) {
        console.error("Error cargando datos:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [params.id, router]);

  const handleNextChapter = async () => {
    if (currentIdx >= chapters.length - 1 || !userId) return;
    
    const currentChapter = chapters[currentIdx];
    const nextChapter = chapters[currentIdx + 1];
    const newCompleted = Array.from(new Set([...completedChapters, currentChapter.chapter_number]));
    
    try {
      // AQUÍ GUARDAMOS USANDO LA CLAVE COMPUESTA
      const { error } = await supabase.from('reading_progress').upsert({
        user_id: userId,
        book_id: params.id,
        chapter_number: nextChapter.chapter_number,
        completed_chapters: newCompleted,
        last_read_at: new Date().toISOString(),
      }, { onConflict: 'user_id,book_id' }); // IMPORTANTE: Declarar el onConflict compuesto

      if (error) throw error;
      setCompletedChapters(newCompleted);
      setCurrentIdx(currentIdx + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error("Error al salvar progreso:", err);
    }
  };

  const handlePrevChapter = () => {
    if (currentIdx > 0) {
      setCurrentIdx(currentIdx - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  if (loading) return (
    <div className={`flex h-screen items-center justify-center ${nightMode ? 'bg-brand-dark' : 'bg-[#F9F9F7]'}`}>
      <div className="w-8 h-8 border-4 border-brand-gold border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (chapters.length === 0) return (
    <div className={`flex flex-col items-center justify-center h-screen px-10 text-center ${nightMode ? 'bg-brand-dark text-white' : 'bg-[#F9F9F7]'}`}>
      <BookOpen size={48} className="text-brand-gold/20 mb-6" />
      <h2 className="font-serif italic text-2xl text-brand-gold mb-4">PRÓXIMAMENTE</h2>
      <Link href="/home" className="inline-block border-b-2 border-brand-gold text-brand-gold text-[11px] font-bold uppercase tracking-[0.2em] pb-1">Regresar</Link>
    </div>
  );

  const currentChapter = chapters[currentIdx];
  const hasNext = currentIdx < chapters.length - 1;
  const hasPrev = currentIdx > 0;

  return (
    <div className={`min-h-screen flex flex-col antialiased transition-colors duration-500 ${nightMode ? 'bg-[#121212]' : 'bg-[#F9F9F7]'}`}>
      
      <nav className={`p-6 shrink-0 flex justify-between items-center sticky top-0 backdrop-blur-md z-20 transition-colors duration-500 ${nightMode ? 'bg-[#121212]/80' : 'bg-[#F9F9F7]/80'}`}>
        <Link href="/home" className="flex items-center gap-2 text-brand-gold active:scale-90 transition-transform">
          <ChevronLeft size={20} />
          <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Cerrar</span>
        </Link>
        <div className="flex flex-col items-end">
          <span className="text-[9px] font-bold text-gray-400 uppercase tracking-[0.3em]">
            Capítulo {currentChapter.chapter_number} de {chapters.length}
          </span>
          {completedChapters.includes(currentChapter.chapter_number) && (
            <span className="text-[8px] text-green-600 font-bold uppercase tracking-tighter">Completado</span>
          )}
        </div>
      </nav>

      <article className="flex-grow px-6 max-w-2xl mx-auto w-full pt-4 pb-32">
        <header className="mb-14 text-center">
          <h1 className={`text-4xl font-serif italic leading-tight transition-colors duration-500 ${nightMode ? 'text-brand-gold' : 'text-brand-dark'}`}>
            {currentChapter.title}
          </h1>
          <div className="h-px bg-brand-gold/30 w-12 mx-auto mt-10" />
        </header>

        <div className="prose prose-stone">
          <p className={`font-texto leading-[2] whitespace-pre-line text-justify mb-20 transition-all duration-500 ${fontSize} ${nightMode ? 'text-[#D4AF37]/90' : 'text-brand-dark/90'}`}>
            {currentChapter.content}
          </p>
        </div>

        <footer className="mt-20 pt-10 border-t border-brand-gold/10 flex justify-between items-center">
          {hasPrev ? (
            <button 
              onClick={handlePrevChapter}
              className={`inline-block border-b text-[11px] uppercase font-bold pb-1 transition-all ${nightMode ? 'border-brand-gold text-brand-gold' : 'border-black text-black hover:text-brand-gold'}`}
            >
              <ChevronLeft size={12} className="inline mr-1 mb-0.5" /> Anterior
            </button>
          ) : <div />}

          {hasNext ? (
            <button 
              onClick={handleNextChapter}
              className={`inline-block border-b text-[11px] uppercase font-bold pb-1 transition-all ${nightMode ? 'border-brand-gold text-brand-gold' : 'border-black text-black hover:text-brand-gold'}`}
            >
              Siguiente <ChevronRight size={12} className="inline ml-1 mb-0.5" />
            </button>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">Fin de obra</span>
              <button 
                onClick={async () => {
                  if (!userId) return;
                  const finalCompleted = Array.from(new Set([...completedChapters, currentChapter.chapter_number]));
                  await supabase.from('reading_progress').upsert({
                    user_id: userId,
                    book_id: params.id,
                    completed_chapters: finalCompleted,
                    last_read_at: new Date().toISOString()
                  }, { onConflict: 'user_id,book_id' });
                  setCompletedChapters(finalCompleted);
                }}
                className="text-[9px] text-brand-gold font-bold underline"
              >
                Marcar como finalizado
              </button>
            </div>
          )}
        </footer>
      </article>
    </div>
  );
}