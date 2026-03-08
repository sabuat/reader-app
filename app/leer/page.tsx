"use client";

import { useEffect, useState, Suspense } from 'react';
import { supabase } from '@/lib/supabase';
import { ChevronLeft, ChevronRight, BookOpen, X, Volume2, Play, Pause, Square, List, Moon, Sun } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { Capacitor } from '@capacitor/core';
import { AdMob } from '@capacitor-community/admob';

function ReaderContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const router = useRouter();

  const [userId, setUserId] = useState<string | null>(null);
  const [chapters, setChapters] = useState<any[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [completedChapters, setCompletedChapters] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);

  const [fontSize, setFontSize] = useState('text-lg');
  const [nightMode, setNightMode] = useState(false);

  const [sessionReads, setSessionReads] = useState(0);

  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [showChapterMenu, setShowChapterMenu] = useState(false);

  const safeCancelSpeech = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      setSpeechSupported(true);
    }

    if (Capacitor.isNativePlatform()) {
      AdMob.initialize({
        initializeForTesting: false, 
      }).catch(e => console.error("Error inicializando AdMob", e));
    }
  }, []);

  // 1. EFECTO PARA EL TEMA (Detecta el sistema si no hay preferencia guardada)
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const savedFontSize = localStorage.getItem('apapacho_fontSize');
    const savedNightMode = localStorage.getItem('apapacho_nightMode');

    if (savedFontSize) setFontSize(savedFontSize);

    if (savedNightMode !== null) {
      setNightMode(savedNightMode === 'true');
    } else {
      setNightMode(mediaQuery.matches);
    }

    const handleThemeChange = (e: MediaQueryListEvent) => {
      if (localStorage.getItem('apapacho_nightMode') === null) {
        setNightMode(e.matches);
      }
    };
    mediaQuery.addEventListener('change', handleThemeChange);

    return () => mediaQuery.removeEventListener('change', handleThemeChange);
  }, []);

  // 2. EFECTO PARA CARGAR DATOS
  useEffect(() => {
    async function loadData() {
      if (!id) return;
      setLoading(true);

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push('/');
          return;
        }
        setUserId(user.id);

        const { data: chs } = await supabase
          .from('chapters')
          .select('*')
          .eq('book_id', id)
          .order('chapter_number', { ascending: true });

        const { data: prog } = await supabase
          .from('reading_progress')
          .select('chapter_number, completed_chapters')
          .eq('book_id', id)
          .eq('user_id', user.id)
          .maybeSingle();

        if (chs) setChapters(chs);

        if (prog) {
          setCompletedChapters(prog.completed_chapters || []);
          const lastIndex = chs?.findIndex(c => c.chapter_number === prog.chapter_number);
          if (lastIndex !== undefined && lastIndex !== -1) setCurrentIdx(lastIndex);
        }
      } catch (err) {
        console.error("Error cargando datos:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();

    return () => safeCancelSpeech();
  }, [id, router]);

  useEffect(() => {
    safeCancelSpeech();
    setIsSpeaking(false);
    setIsPaused(false);
  }, [currentIdx]);

  // FUNCIÓN PARA ALTERNAR MODO NOCTURNO MANUALMENTE
  const handleToggleNightMode = () => {
    const newMode = !nightMode;
    setNightMode(newMode);
    localStorage.setItem('apapacho_nightMode', String(newMode));
    
    if (newMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const handleSpeak = () => {
    if (!speechSupported) {
      alert("Para escuchar capítulos, tu teléfono necesita tener activa la lectura por voz.");
      return;
    }
    const rawContent = chapters[currentIdx]?.content || '';
    if (!rawContent) return; 
    
    if (isPaused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
      setIsSpeaking(true);
      return;
    }
    const cleanText = rawContent.replace(/[*#_>]/g, '');
    safeCancelSpeech();
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'es-ES'; 
    utterance.rate = 0.95; 
    
    utterance.onend = () => {
      setIsSpeaking(false);
      setIsPaused(false);
    };
    
    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
    setIsPaused(false);
  };

  const handlePause = () => {
    if (speechSupported) {
      window.speechSynthesis.pause();
      setIsPaused(true);
      setIsSpeaking(false);
    }
  };

  const handleStop = () => {
    safeCancelSpeech();
    setIsSpeaking(false);
    setIsPaused(false);
  };

  const showRealAd = async () => {
    if (!Capacitor.isNativePlatform()) return; 
    try {
      await AdMob.prepareInterstitial({
        adId: 'ca-app-pub-6944764501142533/1335629634', 
        isTesting: false 
      });
      await AdMob.showInterstitial();

      if (id) {
        const { data } = await supabase.from('books').select('ad_views').eq('id', id).single();
        const currentViews = data?.ad_views || 0;
        await supabase.from('books').update({ ad_views: currentViews + 1 }).eq('id', id);
      }
    } catch (e) {
      console.error("No se pudo mostrar el anuncio", e);
    }
  };

  const handleNextChapter = async () => {
    if (currentIdx >= chapters.length - 1 || !userId || !id) return;

    const currentChapter = chapters[currentIdx];
    const nextChapter = chapters[currentIdx + 1];
    const newCompleted = Array.from(new Set([...completedChapters, currentChapter.chapter_number]));

    try {
      const { error } = await supabase.from('reading_progress').upsert({
        user_id: userId,
        book_id: id,
        chapter_number: nextChapter.chapter_number,
        completed_chapters: newCompleted,
        last_read_at: new Date().toISOString(),
      }, { onConflict: 'user_id,book_id' });

      if (error) throw error;

      setCompletedChapters(newCompleted);
      setCurrentIdx(currentIdx + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });

      setSessionReads((prev) => {
        const newCount = prev + 1;
        if (newCount % 2 === 0) {
          showRealAd(); 
        }
        return newCount;
      });
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
    <div className={`flex h-screen items-center justify-center ${nightMode ? 'bg-[#121212]' : 'bg-[#F9F9F7]'}`}>
      <div className="w-8 h-8 border-4 border-brand-gold border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (chapters.length === 0) return (
    <div className={`flex flex-col items-center justify-center h-screen px-10 text-center ${nightMode ? 'bg-[#121212] text-white' : 'bg-[#F9F9F7]'}`}>
      <BookOpen size={48} className="text-brand-gold/20 mb-6" />
      <h2 className="font-serif italic text-2xl text-brand-gold mb-4">PRÓXIMAMENTE</h2>
      <Link href="/home" className="inline-block border-b-2 border-brand-gold text-brand-gold text-[11px] font-bold uppercase tracking-[0.2em] pb-1">Regresar</Link>
    </div>
  );

  const currentChapter = chapters[currentIdx];
  if (!currentChapter) return null;

  const hasNext = currentIdx < chapters.length - 1;
  const hasPrev = currentIdx > 0;

  return (
    <div className={`min-h-[100dvh] flex flex-col antialiased transition-colors duration-500 ${nightMode ? 'bg-[#121212]' : 'bg-[#F9F9F7]'}`}>
      <nav 
        className={`px-6 pb-6 shrink-0 flex justify-between items-center sticky top-0 backdrop-blur-md z-20 transition-colors duration-500 ${nightMode ? 'bg-[#121212]/80' : 'bg-[#F9F9F7]/80'}`}
        style={{ paddingTop: 'calc(1.5rem + env(safe-area-inset-top))' }}
      >
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
        <header className="mb-14">
          <div className="flex justify-start items-center gap-3 mb-4">
            
            {/* NUEVO BOTÓN: Alternador de Modo Nocturno */}
            <button 
              onClick={handleToggleNightMode} 
              className={`p-2.5 rounded-full active:scale-90 transition-transform ${nightMode ? 'bg-brand-gold/20 text-brand-gold' : 'bg-brand-dark-blue/10 text-brand-dark-blue'}`}
            >
              {nightMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {!isSpeaking && !isPaused ? (
              <button 
                onClick={handleSpeak} 
                className={`p-2.5 rounded-full active:scale-90 transition-transform ${nightMode ? 'bg-brand-gold/20 text-brand-gold' : 'bg-brand-dark-blue/10 text-brand-dark-blue'}`}
              >
                <Volume2 size={18} />
              </button>
            ) : (
              <div className={`flex items-center gap-1 p-1 rounded-full ${nightMode ? 'bg-brand-gold/20' : 'bg-brand-dark-blue/10'}`}>
                {isPaused ? (
                  <button onClick={handleSpeak} className={`p-2 rounded-full active:scale-90 transition-transform ${nightMode ? 'text-brand-gold' : 'text-brand-dark-blue'}`}>
                    <Play size={16} fill="currentColor" />
                  </button>
                ) : (
                  <button onClick={handlePause} className={`p-2 rounded-full active:scale-90 transition-transform ${nightMode ? 'text-brand-gold' : 'text-brand-dark-blue'}`}>
                    <Pause size={16} fill="currentColor" />
                  </button>
                )}
                <button onClick={handleStop} className="p-2 rounded-full text-brand-red active:scale-90 transition-transform">
                  <Square size={16} fill="currentColor" />
                </button>
              </div>
            )}

            <button 
              onClick={() => setShowChapterMenu(true)} 
              className={`p-2.5 rounded-full active:scale-90 transition-transform ${nightMode ? 'bg-brand-gold/20 text-brand-gold' : 'bg-brand-dark-blue/10 text-brand-dark-blue'}`}
            >
              <List size={18} />
            </button>
          </div>

          <h1 className={`text-2xl font-serif italic leading-tight text-left transition-colors duration-500 ${nightMode ? 'text-brand-gold' : 'text-gray-800'}`}>
            {currentChapter.title}
          </h1>
          <div className="h-px bg-brand-gold/30 w-full mt-6" />
        </header>

        <div className={`font-texto leading-[1.25] text-justify mb-20 transition-all duration-500 ${fontSize} ${nightMode ? 'text-[#D4AF37]/90' : 'text-brand-dark/90'}`}>
          <ReactMarkdown
            components={{
              p: ({ children }) => <p className="mb-6 whitespace-pre-line">{children}</p>,
              strong: ({ children }) => <strong className="font-bold text-brand-dark-blue dark:text-brand-gold">{children}</strong>,
              em: ({ children }) => <em className="italic">{children}</em>
            }}
          >
            {currentChapter.content || ''}
          </ReactMarkdown>
        </div>

        <footer 
          className="mt-20 pt-10 border-t border-brand-gold/10 flex justify-between items-center"
          style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
          {hasPrev ? (
            <button onClick={handlePrevChapter} className={`inline-block border-b text-[11px] uppercase font-bold pb-1 transition-all ${nightMode ? 'border-brand-gold text-brand-gold' : 'border-gray-400 text-gray-400 hover:text-brand-gold'}`}>
              <ChevronLeft size={12} className="inline mr-1 mb-0.5" /> Anterior
            </button>
          ) : <div />}

          {hasNext ? (
            <button onClick={handleNextChapter} className={`inline-block border-b text-[11px] uppercase font-bold pb-1 transition-all ${nightMode ? 'border-brand-gold text-brand-gold' : 'border-gray-400 text-gray-400 hover:text-brand-gold'}`}>
              Siguiente <ChevronRight size={12} className="inline ml-1 mb-0.5" />
            </button>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">Fin de obra</span>
              <button onClick={async () => {
                if (!userId || !id) return;
                const finalCompleted = Array.from(new Set([...completedChapters, currentChapter.chapter_number]));
                await supabase.from('reading_progress').upsert({
                  user_id: userId,
                  book_id: id,
                  completed_chapters: finalCompleted,
                  last_read_at: new Date().toISOString()
                }, { onConflict: 'user_id,book_id' });
                setCompletedChapters(finalCompleted);
              }} className="text-[9px] text-brand-gold font-bold underline">
                Marcar como finalizado
              </button>
            </div>
          )}
        </footer>
      </article>

      <AnimatePresence>
        {showChapterMenu && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
            onClick={() => setShowChapterMenu(false)}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-end"
          >
            <motion.div 
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              onClick={(e) => e.stopPropagation()}
              className={`w-[85%] max-w-sm h-full shadow-2xl flex flex-col border-l border-brand-gold/10 ${nightMode ? 'bg-[#121212]' : 'bg-[#F9F9F7]'}`}
            >
              <div 
                className="p-6 border-b border-brand-gold/10 flex justify-between items-center shrink-0" 
                style={{ paddingTop: 'calc(1.5rem + env(safe-area-inset-top))' }}
              >
                <h2 className={`text-xl font-serif italic ${nightMode ? 'text-brand-gold' : 'text-brand-dark-blue'}`}>Índice</h2>
                <button onClick={() => setShowChapterMenu(false)} className={`p-2 active:scale-90 transition-transform ${nightMode ? 'text-brand-gold' : 'text-brand-dark-blue'}`}>
                  <X size={24} />
                </button>
              </div>
              <div className="flex-grow overflow-y-auto p-4 space-y-2">
                {chapters.map((chap, idx) => (
                  <button 
                    key={chap.id} 
                    onClick={() => {
                      setCurrentIdx(idx);
                      setShowChapterMenu(false);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className={`w-full text-left p-4 rounded-xl text-sm transition-colors ${
                      currentIdx === idx 
                        ? (nightMode ? 'bg-brand-gold/20 text-brand-gold font-bold' : 'bg-brand-dark-blue/10 text-brand-dark-blue font-bold') 
                        : (nightMode ? 'text-gray-300 active:bg-white/5' : 'text-brand-dark active:bg-black/5')
                    }`}
                  >
                    Capítulo {chap.chapter_number}
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function ReaderPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center bg-[#F9F9F7]"><div className="w-8 h-8 border-4 border-brand-gold border-t-transparent rounded-full animate-spin" /></div>}>
      <ReaderContent />
    </Suspense>
  );
}