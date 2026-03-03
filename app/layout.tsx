"use client";

import './globals.css';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Home, Bookmark, BookOpen, User, Menu } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import SideMenu from '@/components/SideMenu';
import Link from 'next/link';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  // Ajuste: Detecta el modo lectura si la ruta comienza con /leer (sin importar parámetros de URL)
  const isReadingMode = pathname?.startsWith('/leer'); 
  const showNav = pathname !== '/';

  useEffect(() => {
    if (pathname && pathname !== '/') {
      localStorage.setItem('apapacho_last_route', pathname);
    }
  }, [pathname]);

  const isActive = (path: string) => pathname === path;

  return (
    <html lang="es">
      <body className="bg-brand-bg text-brand-dark min-h-[100dvh] flex flex-col overflow-x-hidden antialiased">
        
        {/* Ajuste: Se oculta el header si es modo lectura */}
        {showNav && !isReadingMode && (
          <header 
            className="fixed top-0 w-full bg-brand-bg/80 backdrop-blur-md z-40 px-6 flex justify-between items-center border-b border-brand-gold/10"
            style={{ 
              paddingTop: 'env(safe-area-inset-top)', 
              height: 'calc(4rem + env(safe-area-inset-top))' 
            }}
          >
            <Link href="/home" className="flex items-center active:scale-95 transition-transform">
              <Image src="/logo.png" alt="Logo" width={110} height={35} className="object-contain" priority />
            </Link>
            
            <button onClick={() => setIsMenuOpen(true)} className="p-2 active:scale-90 transition-transform">
              <Menu size={24} className="text-brand-dark" />
            </button>
          </header>
        )}

        <AnimatePresence>
          {isMenuOpen && <SideMenu onClose={() => setIsMenuOpen(false)} />}
        </AnimatePresence>

        <main 
          className="flex-grow w-full overflow-x-hidden"
          style={{ 
            // Ajuste: Elimina paddings adicionales en modo lectura para usar toda la pantalla
            paddingTop: (!showNav || isReadingMode) ? 'env(safe-area-inset-top)' : 'calc(4rem + env(safe-area-inset-top))',
            paddingBottom: (!showNav || isReadingMode) ? 'env(safe-area-inset-bottom)' : 'calc(5rem + env(safe-area-inset-bottom))'
          }}
        >
          {children}
        </main>

        {/* Ajuste: Se oculta el nav inferior si es modo lectura */}
        {showNav && !isReadingMode && (
          <nav 
            className="fixed bottom-0 w-full bg-white/90 backdrop-blur-lg border-t border-brand-gold/10 px-8 flex justify-between items-center z-40 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]"
            style={{ 
              paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))', 
              height: 'calc(5rem + env(safe-area-inset-bottom))' 
            }}
          >
            <Link href="/home" className={`flex flex-col items-center gap-1 transition-all active:scale-90 ${isActive('/home') ? 'text-brand-dark-blue' : 'text-gray-400'}`}>
              <Home size={22} />
              <span className="text-[10px] font-bold uppercase tracking-tighter">Home</span>
            </Link>
            
            <Link href="/lista" className={`flex flex-col items-center gap-1 transition-all active:scale-90 ${isActive('/lista') ? 'text-brand-dark-blue' : 'text-gray-400'}`}>
              <Bookmark size={22} />
              <span className="text-[10px] font-bold uppercase tracking-tighter">Mi Lista</span>
            </Link>

            <Link href="/lecturas" className={`flex flex-col items-center gap-1 transition-all active:scale-90 ${isActive('/lecturas') ? 'text-brand-dark-blue' : 'text-gray-400'}`}>
              <BookOpen size={22} />
              <span className="text-[10px] font-bold uppercase tracking-tighter">Lecturas</span>
            </Link>

            <Link href="/cuenta" className={`flex flex-col items-center gap-1 transition-all active:scale-90 ${isActive('/cuenta') ? 'text-brand-dark-blue' : 'text-gray-400'}`}>
              <User size={22} />
              <span className="text-[10px] font-bold uppercase tracking-tighter">Cuenta</span>
            </Link>
          </nav>
        )}
      </body>
    </html>
  );
}