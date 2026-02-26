"use client";

import './globals.css';
import Image from 'next/image';
import { useState } from 'react';
import { Home, Bookmark, BookOpen, User, Menu } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import SideMenu from '@/components/SideMenu';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <html lang="es">
      <body className="bg-brand-bg text-brand-dark min-h-screen flex flex-col overflow-x-hidden font-sans">
        
        {/* BARRA SUPERIOR */}
        <header className="fixed top-0 w-full h-16 bg-brand-bg/80 backdrop-blur-md z-40 px-6 flex justify-between items-center border-b border-brand-gold/10">
          <div className="flex items-center">
            <Image 
              src="/logo.png" 
              alt="Logo Apapacho" 
              width={110} 
              height={35} 
              className="object-contain"
              priority
            />
          </div>
          
          <button 
            onClick={() => setIsMenuOpen(true)}
            className="p-2 active:scale-90 transition-transform"
          >
            <Menu size={24} className="text-brand-dark" />
          </button>
        </header>

        {/* MENÚ LATERAL DESLIZANTE */}
        <AnimatePresence>
          {isMenuOpen && (
            <SideMenu onClose={() => setIsMenuOpen(false)} />
          )}
        </AnimatePresence>

        <main className="flex-grow pt-20 pb-24">
          {children}
        </main>

        {/* NAVEGACIÓN INFERIOR */}
        <nav className="fixed bottom-0 w-full h-20 bg-white/90 backdrop-blur-lg border-t border-brand-gold/10 px-8 flex justify-between items-center z-40 pb-4 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
          <button className="flex flex-col items-center gap-1 text-brand-dark-blue">
            <Home size={22} />
            <span className="text-[10px] font-bold uppercase tracking-tighter">Home</span>
          </button>
          
          <button className="flex flex-col items-center gap-1 text-gray-400">
            <Bookmark size={22} />
            <span className="text-[10px] font-bold uppercase tracking-tighter">Mi Lista</span>
          </button>

          <button className="flex flex-col items-center gap-1 text-gray-400">
            <BookOpen size={22} />
            <span className="text-[10px] font-bold uppercase tracking-tighter">Lecturas</span>
          </button>

          <button className="flex flex-col items-center gap-1 text-gray-400">
            <User size={22} />
            <span className="text-[10px] font-bold uppercase tracking-tighter">Cuenta</span>
          </button>
        </nav>
      </body>
    </html>
  );
}