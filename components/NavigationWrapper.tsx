"use client";

import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Home, BookOpen, User, Menu } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';

import SideMenu from '@/components/SideMenu';
import ThemeProvider from '@/components/ThemeProvider';
import { useLanguage } from '@/hooks/useLanguage';
import { PreferencesService } from '@/lib/preferences';

const VALID_ROUTES = ['/home', '/lecturas', '/cuenta'];

export default function NavigationWrapper({ children }: { children: React.ReactNode }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();
  const { t, isReady } = useLanguage();

  const isReadingMode = pathname?.startsWith('/leer'); 
  const isAuthPage = pathname === '/';
  const showNav = !!pathname && !isAuthPage && !isReadingMode;

  useEffect(() => {
    if (pathname && VALID_ROUTES.includes(pathname)) {
      PreferencesService.setLastRoute(pathname);
    }
  }, [pathname]);

  // 🌟 INTERCEPTOR DE DEEP LINKS (OAUTH NATIVO)
  useEffect(() => {
    let listenerHandle: any = null;

    const initDeepLinks = async () => {
      if (typeof window !== 'undefined') {
        const { Capacitor } = await import('@capacitor/core');
        if (Capacitor.isNativePlatform()) {
          const { App } = await import('@capacitor/app');
          listenerHandle = await App.addListener('appUrlOpen', (event) => {
            if (event.url.includes('apapacho://')) {
              const url = new URL(event.url);
              // Transforma apapacho://home#token a /home#token para el WebView
              const pathAndHash = `/${url.host}${url.pathname !== '/' ? url.pathname : ''}${url.search}${url.hash}`;
              window.location.assign(pathAndHash);
            }
          });
        }
      }
    };

    initDeepLinks();

    return () => {
      if (listenerHandle) {
        listenerHandle.remove();
      }
    };
  }, []);

  const isActive = (path: string) => pathname === path;

  return (
    <ThemeProvider>
      {showNav && (
        <header className="fixed top-0 w-full bg-brand-bg/80 dark:bg-[#121212]/90 backdrop-blur-md z-40 px-6 flex justify-between items-center border-b border-brand-gold/10 dark:border-brand-gold/20 transition-colors duration-500 pt-[env(safe-area-inset-top)] h-[calc(4rem+env(safe-area-inset-top))]">
          <Link href="/home" className="flex items-center active:scale-95 transition-transform">
            <Image src="/logo.png" alt="Logo" width={110} height={35} className="object-contain" priority />
          </Link>
          
          <button onClick={() => setIsMenuOpen(true)} className="p-2 active:scale-90 transition-transform">
            <Menu size={24} className="text-brand-dark dark:text-brand-gold transition-colors" />
          </button>
        </header>
      )}

      <AnimatePresence>
        {isMenuOpen && <SideMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />}
      </AnimatePresence>

      <main className={`flex-grow w-full overflow-x-hidden transition-all duration-300 ${!showNav ? 'pt-0 pb-0' : 'pt-[calc(4rem+env(safe-area-inset-top))] pb-[calc(5rem+env(safe-area-inset-bottom))]'}`}>
        {children}
      </main>

      {showNav && (
        <nav className="fixed bottom-0 w-full bg-brand-bg dark:bg-[#121212] backdrop-blur-lg dark:backdrop-blur-none border-t border-brand-gold/10 dark:border-brand-gold/20 px-8 flex justify-around items-center z-40 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] dark:shadow-none transition-colors duration-500 pb-[calc(1rem+env(safe-area-inset-bottom))] h-[calc(5rem+env(safe-area-inset-bottom))]">
          <Link href="/home" className={`flex flex-col items-center gap-1 transition-all active:scale-90 ${isActive('/home') ? 'text-brand-dark-blue dark:text-brand-gold' : 'text-gray-400 dark:text-gray-500'}`}>
            <Home size={22} />
            <span className="text-[10px] font-bold uppercase tracking-tighter">
              {isReady ? (t('box.home') || 'Inicio') : 'Inicio'}
            </span>
          </Link>
          
          <Link href="/lecturas" className={`flex flex-col items-center gap-1 transition-all active:scale-90 ${isActive('/lecturas') ? 'text-brand-dark-blue dark:text-brand-gold' : 'text-gray-400 dark:text-gray-500'}`}>
            <BookOpen size={22} />
            <span className="text-[10px] font-bold uppercase tracking-tighter">
              {isReady ? (t('box.readings') || 'Lecturas') : 'Lecturas'}
            </span>
          </Link>

          <Link href="/cuenta" className={`flex flex-col items-center gap-1 transition-all active:scale-90 ${isActive('/cuenta') ? 'text-brand-dark-blue dark:text-brand-gold' : 'text-gray-400 dark:text-gray-500'}`}>
            <User size={22} />
            <span className="text-[10px] font-bold uppercase tracking-tighter">
              {isReady ? (t('box.account') || 'Cuenta') : 'Cuenta'}
            </span>
          </Link>
        </nav>
      )}
    </ThemeProvider>
  );
}