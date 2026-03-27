"use client";

import { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  ArrowLeft, ChevronLeft, ChevronRight, Settings, Moon, Sun, 
  Type, List, Volume2, Play, Pause, Square, X 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Capacitor } from '@capacitor/core';
import { AdMob } from '@capacitor-community/admob';
import ReactMarkdown from 'react-markdown';

import { supabase } from '@/lib/supabase';
import { BookService } from '@/services/bookService';
import { PreferencesService, AppPreferences } from '@/lib/preferences';
import { Chapter } from '@/lib/types';
import { useLanguage } from '@/hooks/useLanguage';
import { AuthService } from '@/services/authService';

// ==========================================
// COMPONENTE ENVOLTORIO PARA SUSPENSE
// ==========================================
export default function LeerPage() {
  return (
    <Suspense fallback={<ReaderSkeleton />}>
      <ReaderContent />
    </Suspense>
  );
}

// ==========================================
// COMPONENTE PRINCIPAL DEL LECTOR
// ==========================================
function ReaderContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const bookId = searchParams.get('bookId');
  
  const { t, isReady: langReady } = useLanguage();
  const contentRef = useRef<HTMLDivElement>(null);

  // ==========================================
  // ESTADOS DEL DOMINIO
  // ==========================================
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [currentChapterIdx, setCurrentChapterIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  // ==========================================
  // ESTADOS DE PREFERENCIAS Y UI
  // ==========================================
  const [prefs, setPrefs] = useState<AppPreferences>(PreferencesService.getPrefs());
  const [showControls, setShowControls] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showChapterMenu, setShowChapterMenu] = useState(false);

  // ==========================================
  // ESTADOS DE NEGOCIO (Ads & Accesibilidad)
  // ==========================================
  const [sessionReads, setSessionReads] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);

  // ==========================================
  // INICIALIZACIÓN DE SERVICIOS NATIVOS
  // ==========================================
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      setSpeechSupported(true);
    }

    if (Capacitor.isNativePlatform()) {
      AdMob.initialize({
        initializeForTesting: false, 
      }).catch(e => console.error("[Reader] Error inicializando AdMob", e));
    }
  }, []);

  const safeCancelSpeech = useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }, []);

  // ==========================================
  // DATA FETCHING
  // ==========================================
  useEffect(() => {
    if (!bookId || !langReady) return;

    let ignore = false; 

    const initReader = async () => {
      setLoading(true);
      try {
        const session = await AuthService.getSession();
        const uid = session?.user?.id;
        
        if (uid && !ignore) setUserId(uid);

        const fetchedChapters = await BookService.getChapters(bookId);
        if (ignore) return;
        
        setChapters(fetchedChapters);

        if (uid) {
          const progress = await BookService.getReadingProgress(uid, bookId);
          if (ignore) return;
          
          if (progress) {
            const lastReadIdx = fetchedChapters.findIndex(c => c.chapter_number === progress.chapter_number);
            if (lastReadIdx !== -1) setCurrentChapterIdx(lastReadIdx);
          }
        }
      } catch (error) {
        console.error("[Reader] Error inicializando el lector:", error);
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    initReader();

    return () => { 
      ignore = true; 
      safeCancelSpeech();
    };
  }, [bookId, langReady, safeCancelSpeech]);

  useEffect(() => {
    safeCancelSpeech();
    setIsSpeaking(false);
    setIsPaused(false);
  }, [currentChapterIdx, safeCancelSpeech]);

  // ==========================================
  // LÓGICA DE PROGRESO Y PUBLICIDAD (AdMob)
  // ==========================================
  const saveProgress = useCallback(async (chapterIndex: number) => {
    if (!userId || !bookId || chapters.length === 0) return;
    
    const chapterNumber = chapters[chapterIndex].chapter_number;
    
    try {
      await BookService.updateProgress({
        user_id: userId,
        book_id: bookId,
        chapter_number: chapterNumber,
        last_read_at: new Date().toISOString()
      });
    } catch (error) {
      console.error("[Reader] Error guardando progreso:", error);
    }
  }, [userId, bookId, chapters]);

  const showRealAd = async () => {
    if (!Capacitor.isNativePlatform()) {
      console.log("💰 [AdMob SIMULADOR]: Anuncio Intersticial disparado.");
      if (bookId) {
        const { data } = await supabase.from('books').select('ad_views').eq('id', bookId).single();
        const currentViews = data?.ad_views || 0;
        await supabase.from('books').update({ ad_views: currentViews + 1 }).eq('id', bookId);
      }
      return; 
    }

    try {
      await AdMob.prepareInterstitial({
        adId: 'ca-app-pub-6944764501142533/1335629634', 
        isTesting: false 
      });
      await AdMob.showInterstitial();

      if (bookId) {
        const { data } = await supabase.from('books').select('ad_views').eq('id', bookId).single();
        const currentViews = data?.ad_views || 0;
        await supabase.from('books').update({ ad_views: currentViews + 1 }).eq('id', bookId);
      }
    } catch (e) {
      console.error("[Reader] No se pudo mostrar el anuncio nativo", e);
    }
  };

  const handleNextChapter = () => {
    if (currentChapterIdx >= chapters.length - 1) return;

    const newReads = sessionReads + 1;
    setSessionReads(newReads);

    if (newReads % 2 === 0) {
      showRealAd(); 
    }

    const nextIdx = currentChapterIdx + 1;
    setCurrentChapterIdx(nextIdx);
    saveProgress(nextIdx);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePrevChapter = () => {
    if (currentChapterIdx > 0) {
      const prevIdx = currentChapterIdx - 1;
      setCurrentChapterIdx(prevIdx);
      saveProgress(prevIdx);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // ==========================================
  // ACCESIBILIDAD (TTS)
  // ==========================================
  const handleSpeak = () => {
    if (!speechSupported) {
      alert(t('reader.speech_alert'));
      return;
    }
    const rawContent = chapters[currentChapterIdx]?.content || '';
    if (!rawContent) return; 
    
    if (isPaused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
      setIsSpeaking(true);
      return;
    }
    
    const cleanText = rawContent.replace(/<[^>]+>/g, '').replace(/[*#_>]/g, '');
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

  // ==========================================
  // MANEJO DE PREFERENCIAS
  // ==========================================
  const toggleNightMode = () => {
    const newMode = !prefs.nightMode;
    setPrefs(prev => ({ ...prev, nightMode: newMode }));
    PreferencesService.updatePrefs({ nightMode: newMode });
    if (newMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  };

  const setSpecificFontSize = (newSize: AppPreferences['fontSize']) => {
    setPrefs(prev => ({ ...prev, fontSize: newSize }));
    PreferencesService.updatePrefs({ fontSize: newSize });
  };

  // ==========================================
  // RENDERIZADO
  // ==========================================
  const currentChapter = chapters[currentChapterIdx];

  if (loading || !langReady) return <ReaderSkeleton />;

  if (!currentChapter) {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-brand-bg dark:bg-[#121212]">
        <p className="text-gray-500">{t('reader.no_content') || 'No se pudo cargar el contenido.'}</p>
        <button onClick={() => router.back()} className="mt-4 text-brand-gold uppercase tracking-widest text-xs font-bold">
          {t('common.back')}
        </button>
      </div>
    );
  }

  return (
    <div className={`min-h-[100dvh] transition-colors duration-500 ease-in-out relative ${prefs.nightMode ? 'bg-[#121212] text-[#E0E0E0]' : 'bg-[#F9F9F7] text-[#2D2D2D]'}`}>
      
      <div 
        className="fixed inset-0 z-10" 
        onClick={() => {
          setShowControls(!showControls);
          setShowSettings(false);
        }} 
      />

      <AnimatePresence>
        {showControls && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 pointer-events-none flex flex-col justify-start"
          >
            <div className="bg-white/95 dark:bg-[#1A1A1A]/95 backdrop-blur-md p-4 flex items-center justify-between border-b border-gray-200 dark:border-white/10 pointer-events-auto shadow-sm" style={{ paddingTop: 'calc(1rem + env(safe-area-inset-top))' }}>
              <button onClick={() => router.back()} className="p-2 active:scale-90 transition-transform">
                <ArrowLeft size={24} className="text-brand-dark dark:text-gray-300" />
              </button>
              
              <div className="flex items-center gap-2 pr-2">
                {!isSpeaking && !isPaused ? (
                  <button onClick={handleSpeak} className="p-2 active:scale-90 transition-transform text-brand-dark dark:text-brand-gold">
                    <Volume2 size={22} />
                  </button>
                ) : (
                  <div className="flex items-center bg-brand-dark-blue/5 dark:bg-brand-gold/10 rounded-full px-1 py-0.5">
                    {isPaused ? (
                      <button onClick={handleSpeak} className="p-1.5 active:scale-90 transition-transform text-brand-dark dark:text-brand-gold">
                        <Play size={18} fill="currentColor" />
                      </button>
                    ) : (
                      <button onClick={handlePause} className="p-1.5 active:scale-90 transition-transform text-brand-dark dark:text-brand-gold">
                        <Pause size={18} fill="currentColor" />
                      </button>
                    )}
                    <button onClick={handleStop} className="p-1.5 active:scale-90 transition-transform text-brand-red">
                      <Square size={16} fill="currentColor" />
                    </button>
                  </div>
                )}

                <button onClick={() => { setShowChapterMenu(true); setShowControls(false); }} className="p-2 active:scale-90 transition-transform">
                  <List size={24} className="text-brand-dark dark:text-gray-300" />
                </button>

                <button onClick={() => setShowSettings(!showSettings)} className="p-2 active:scale-90 transition-transform relative">
                  <Settings size={24} className="text-brand-dark dark:text-gray-300" />
                  {showSettings && (
                    <div className="absolute top-full right-0 mt-2 bg-white dark:bg-[#2A2A2A] rounded-2xl shadow-2xl border border-gray-100 dark:border-white/10 p-4 w-64 flex flex-col gap-4">
                      
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">{t('reader.theme')}</span>
                        <button onClick={toggleNightMode} className="p-3 bg-gray-50 dark:bg-black/30 rounded-full active:scale-90">
                          {prefs.nightMode ? <Sun size={18} className="text-brand-gold" /> : <Moon size={18} className="text-brand-dark-blue" />}
                        </button>
                      </div>

                      <div className="flex justify-between items-center mt-4">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">{t('reader.font_size')}</span>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => setSpecificFontSize('text-base')} 
                            className={`p-3 rounded-full active:scale-90 transition-colors ${prefs.fontSize === 'text-base' ? 'bg-brand-gold text-white dark:text-[#121212]' : 'bg-gray-50 dark:bg-black/30 text-brand-dark dark:text-gray-300'}`}
                          >
                            <Type size={14} />
                          </button>
                          
                          <button 
                            onClick={() => setSpecificFontSize('text-lg')} 
                            className={`p-3 rounded-full active:scale-90 transition-colors ${prefs.fontSize === 'text-lg' ? 'bg-brand-gold text-white dark:text-[#121212]' : 'bg-gray-50 dark:bg-black/30 text-brand-dark dark:text-gray-300'}`}
                          >
                            <Type size={18} />
                          </button>

                          <button 
                            onClick={() => setSpecificFontSize('text-xl')} 
                            className={`p-3 rounded-full active:scale-90 transition-colors ${prefs.fontSize === 'text-xl' ? 'bg-brand-gold text-white dark:text-[#121212]' : 'bg-gray-50 dark:bg-black/30 text-brand-dark dark:text-gray-300'}`}
                          >
                            <Type size={22} />
                          </button>
                        </div>
                      </div>

                    </div>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showChapterMenu && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
            onClick={() => setShowChapterMenu(false)}
            className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex justify-end"
          >
            <motion.div 
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              onClick={(e) => e.stopPropagation()}
              className={`w-[85%] max-w-sm h-full shadow-2xl flex flex-col border-l border-brand-gold/10 ${prefs.nightMode ? 'bg-[#1A1A1A]' : 'bg-[#F9F9F7]'}`}
            >
              <div 
                className="p-6 border-b border-brand-gold/10 flex justify-between items-center shrink-0" 
                style={{ paddingTop: 'calc(1.5rem + env(safe-area-inset-top))' }}
              >
                <h2 className={`text-xl font-serif italic ${prefs.nightMode ? 'text-brand-gold' : 'text-brand-dark-blue'}`}>{t('reader.index')}</h2>
                <button onClick={() => setShowChapterMenu(false)} className={`p-2 active:scale-90 transition-transform ${prefs.nightMode ? 'text-brand-gold' : 'text-brand-dark-blue'}`}>
                  <X size={24} />
                </button>
              </div>
              <div className="flex-grow overflow-y-auto p-4 space-y-2 pb-24">
                {chapters.map((chap, idx) => (
                  <button 
                    key={chap.id} 
                    onClick={() => {
                      setCurrentChapterIdx(idx);
                      setShowChapterMenu(false);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className={`w-full text-left p-4 rounded-xl text-sm transition-colors ${
                      currentChapterIdx === idx 
                        ? (prefs.nightMode ? 'bg-brand-gold/20 text-brand-gold font-bold' : 'bg-brand-dark-blue/10 text-brand-dark-blue font-bold') 
                        : (prefs.nightMode ? 'text-gray-300 active:bg-white/5' : 'text-brand-dark active:bg-black/5')
                    }`}
                  >
                    {chap.title || `${t('reader.chapter')} ${chap.chapter_number}`}
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <main 
        ref={contentRef}
        className="relative z-20 pointer-events-none px-6 sm:px-12 py-24 mx-auto w-full max-w-2xl flex flex-col min-h-screen"
      >
        <h1 className="font-serif italic text-3xl md:text-4xl mb-12 text-center opacity-90">
          {currentChapter.title}
        </h1>
        
        <div className={`font-texto leading-loose tracking-wide ${prefs.fontSize} text-justify opacity-90 flex-grow [&_img]:max-w-full [&_img]:h-auto [&_img]:rounded-lg [&_img]:mx-auto [&_img]:my-8`}>
          <ReactMarkdown>
            {currentChapter.content || ''}
          </ReactMarkdown>
        </div>

        <footer 
          className="mt-16 pt-8 border-t border-brand-gold/20 flex justify-between items-center pointer-events-auto"
          style={{ paddingBottom: 'calc(2rem + env(safe-area-inset-bottom))' }}
        >
          {currentChapterIdx > 0 ? (
            <button 
              onClick={handlePrevChapter} 
              className={`flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest transition-colors ${prefs.nightMode ? 'text-gray-400 hover:text-brand-gold' : 'text-gray-500 hover:text-brand-dark-blue'}`}
            >
              <ChevronLeft size={16} />
              {t('reader.prev')}
            </button>
          ) : <div />}

          {currentChapterIdx < chapters.length - 1 ? (
            <button 
              onClick={handleNextChapter} 
              className={`flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest transition-colors ${prefs.nightMode ? 'text-gray-400 hover:text-brand-gold' : 'text-gray-500 hover:text-brand-dark-blue'}`}
            >
              {t('reader.next')} 
              <ChevronRight size={16} />
            </button>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">{t('reader.end_of_book')}</span>
              <button 
                onClick={() => saveProgress(currentChapterIdx)} 
                className="text-[9px] text-brand-gold font-bold underline active:scale-95"
              >
                {t('reader.mark_completed')}
              </button>
            </div>
          )}
        </footer>
      </main>
    </div>
  );
}

// ==========================================
// SKELETON LOADER
// ==========================================
function ReaderSkeleton() {
  return (
    <div className="min-h-[100dvh] bg-[#F9F9F7] dark:bg-[#121212] px-6 py-24 mx-auto max-w-2xl transition-colors duration-500">
      <div className="w-3/4 h-10 bg-gray-200 dark:bg-white/5 rounded-lg mx-auto mb-16 animate-pulse" />
      <div className="space-y-6">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className={`h-4 bg-gray-200 dark:bg-white/5 rounded-full animate-pulse ${i % 3 === 0 ? 'w-5/6' : 'w-full'}`} />
        ))}
      </div>
    </div>
  );
}