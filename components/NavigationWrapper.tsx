"use client";

import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Home, BookOpen, User, Menu } from 'lucide-react'; // Eliminamos BookOpen
import { AnimatePresence } from 'framer-motion';

import SideMenu from '@/components/SideMenu';
import ThemeProvider from '@/components/ThemeProvider';
import { useLanguage } from '@/hooks/useLanguage';
import { PreferencesService } from '@/lib/preferences';

export default function NavigationWrapper({ children }: { children: React.ReactNode }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();
  const { t, lang } = useLanguage();

  const isReadingMode = pathname?.startsWith('/leer'); 
  const showNav = pathname && pathname !== '/';

  useEffect(() => {
    if (pathname && pathname !== '/') {
      PreferencesService.setLastRoute(pathname);
    }
  }, [pathname]);

  const isActive = (path: string) => pathname === path;

  return (
    <ThemeProvider>
      {showNav && !isReadingMode && (
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

      <main className={`flex-grow w-full overflow-x-hidden ${(!showNav || isReadingMode) ? 'pt-0' : 'pt-[calc(4rem+env(safe-area-inset-top))]'} ${!showNav || isReadingMode ? 'pb-0' : 'pb-[calc(5rem+env(safe-area-inset-bottom))]'}`}>
        {children}
      </main>

      {/* BOTONERA INFERIOR (Ajustada a 3 botones) */}
      {showNav && !isReadingMode && (
        <nav className="fixed bottom-0 w-full bg-brand-bg dark:bg-[#121212] backdrop-blur-lg dark:backdrop-blur-none border-t border-brand-gold/10 dark:border-brand-gold/20 px-8 flex justify-around items-center z-40 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] dark:shadow-none transition-colors duration-500 pb-[calc(1rem+env(safe-area-inset-bottom))] h-[calc(5rem+env(safe-area-inset-bottom))]">
          <Link href="/home" className={`flex flex-col items-center gap-1 transition-all active:scale-90 ${isActive('/home') ? 'text-brand-dark-blue dark:text-brand-gold' : 'text-gray-400 dark:text-gray-500'}`}>
            <Home size={22} />
            <span className="text-[10px] font-bold uppercase tracking-tighter">{t('box.home')}</span>
          </Link>
          
          <Link href="/lecturas" className={`flex flex-col items-center gap-1 transition-all active:scale-90 ${isActive('/lecturas') ? 'text-brand-dark-blue dark:text-brand-gold' : 'text-gray-400 dark:text-gray-500'}`}>
            <BookOpen size={22} />
            <span className="text-[10px] font-bold uppercase tracking-tighter">{t('box.readings')}</span>
          </Link>

          <Link href="/cuenta" className={`flex flex-col items-center gap-1 transition-all active:scale-90 ${isActive('/cuenta') ? 'text-brand-dark-blue dark:text-brand-gold' : 'text-gray-400 dark:text-gray-500'}`}>
            <User size={22} />
            <span className="text-[10px] font-bold uppercase tracking-tighter">{t('box.account')}</span>
          </Link>
        </nav>
      )}
    </ThemeProvider>
  );
}