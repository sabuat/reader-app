"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { ChevronLeft, ChevronRight, BookOpen } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function ReaderPage() {
  const params = useParams();
  const [chapters, setChapters] = useState<any[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [completedChapters, setCompletedChapters] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);

  // 1. CARGA INICIAL: Capítulos y Progreso existente
  useEffect(() => {
    async function loadData() {
      if (!params.id) return;
      setLoading(true);
      
      try {
        // Traer capítulos
        const { data: chs } = await supabase
          .from('chapters')
          .select('*')
          .eq('book_id', params.id)
          .order('chapter_number', { ascending: true });

        // Traer progreso
        const { data: prog } = await supabase
          .from('reading_progress')
          .select('chapter_number, completed_chapters')
          .eq('book_id', params.id)
          .maybeSingle();

        if (chs) setChapters(chs);
        
        if (prog) {
          setCompletedChapters(prog.completed_chapters || []);
          // Posicionar al usuario en el último capítulo guardado
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
  }, [params.id]);

  // 2. FUNCIÓN PARA AVANZAR Y GUARDAR PROGRESO
  const handleNextChapter = async () => {
    if (currentIdx >= chapters.length - 1) return;

    const currentChapter = chapters[currentIdx];
    const nextChapter = chapters[currentIdx + 1];

    // Añadir el capítulo actual a la lista de completados (sin duplicados)
    const newCompleted = Array.from(new Set([...completedChapters, currentChapter.chapter_number]));
    
    try {
      // Guardar en la DB: el siguiente capítulo como actual y el actual como completado
      const { error } = await supabase
        .from('reading_progress')
        .upsert({
          book_id: params.id,
          chapter_number: nextChapter.chapter_number, // El que va a leer ahora
          completed_chapters: newCompleted,           // El que acaba de terminar
          last_read_at: new Date().toISOString(),
        }, { 
          onConflict: 'book_id' 
        });

      if (error) throw error;

      // Actualizar estado local y mover scroll
      setCompletedChapters(newCompleted);
      setCurrentIdx(currentIdx + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      
    } catch (err) {
      console.error("Error al salvar progreso:", err);
    }
  };

  // 3. FUNCIÓN PARA VOLVER ATRÁS (Solo actualiza UI y posición, no marca completados)
  const handlePrevChapter = () => {
    if (currentIdx > 0) {
      setCurrentIdx(currentIdx - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  if (loading) return (
    <div className="flex h-screen bg-[#F9F9F7] items-center justify-center">
      <div className="w-8 h-8 border-4 border-brand-gold border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (chapters.length === 0) return (
    <div className="flex flex-col items-center justify-center h-screen bg-[#F9F9F7] px-10 text-center">
      <BookOpen size={48} className="text-brand-gold/20 mb-6" />
      <h2 className="font-serif italic text-2xl text-brand-dark mb-4">PRÓXIMAMENTE</h2>
      <Link href="/" className="inline-block border-b-2 border-brand-gold text-brand-gold text-[11px] font-bold uppercase tracking-[0.2em] pb-1">Regresar</Link>
    </div>
  );

  const currentChapter = chapters[currentIdx];
  const hasNext = currentIdx < chapters.length - 1;
  const hasPrev = currentIdx > 0;

  return (
    <div className="min-h-screen bg-[#F9F9F7] flex flex-col antialiased">
      {/* Header del Lector */}
      <nav className="p-6 shrink-0 flex justify-between items-center sticky top-0 bg-[#F9F9F7]/80 backdrop-blur-sm z-20">
        <Link href="/" className="flex items-center gap-2 text-brand-gold active:scale-90 transition-transform">
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
          <h1 className="text-4xl font-serif italic text-brand-dark leading-tight">
            {currentChapter.title}
          </h1>
          <div className="h-px bg-brand-gold/30 w-12 mx-auto mt-10" />
        </header>

        <div className="prose prose-stone">
          <p className="text-brand-dark/90 font-texto leading-[2] text-[18px] whitespace-pre-line text-justify mb-20">
            {currentChapter.content}
          </p>
        </div>

        {/* NAVEGACIÓN */}
        <footer className="mt-20 pt-10 border-t border-brand-gold/10 flex justify-between items-center">
          {hasPrev ? (
            <button 
              onClick={handlePrevChapter}
              className="inline-block border-b border-black text-[11px] uppercase font-bold pb-1 hover:text-brand-gold transition-all"
            >
              <ChevronLeft size={12} className="inline mr-1 mb-0.5" /> Anterior
            </button>
          ) : <div />}

          {hasNext ? (
            <button 
              onClick={handleNextChapter}
              className="inline-block border-b border-black text-[11px] uppercase font-bold pb-1 hover:text-brand-gold transition-all"
            >
              Siguiente <ChevronRight size={12} className="inline ml-1 mb-0.5" />
            </button>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">Fin de obra</span>
              {/* Botón final para marcar el último capítulo como leído si se desea */}
              <button 
                onClick={async () => {
                  const finalCompleted = Array.from(new Set([...completedChapters, currentChapter.chapter_number]));
                  await supabase.from('reading_progress').upsert({
                    book_id: params.id,
                    completed_chapters: finalCompleted,
                    last_read_at: new Date().toISOString()
                  }, { onConflict: 'book_id' });
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