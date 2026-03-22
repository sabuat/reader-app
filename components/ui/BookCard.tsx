"use client";

import { Book } from '@/lib/types';
import { BookOpen } from 'lucide-react';

interface BookCardProps {
  book: Book;
  onClick: (book: Book) => void;
}

export function BookCard({ book, onClick }: BookCardProps) {
  return (
    <div 
      onClick={() => onClick(book)}
      className="relative aspect-[5/8] rounded-xl overflow-hidden shadow-md active:scale-95 transition-transform bg-brand-blue-bg dark:bg-black/50 border border-brand-gold/10 cursor-pointer group"
    >
      {book.cover_url ? (
        <>
          <img 
            src={book.cover_url} 
            alt={book.title} 
            className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 ${!book.published ? 'opacity-50 grayscale' : ''}`} 
          />
          {/* Gradiente sutil en la parte inferior para mejorar lectura si decides poner títulos sobre la imagen */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        </>
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center">
          <BookOpen className="text-brand-dark/20 dark:text-gray-600 mb-2" size={32} />
          <span className="text-[10px] font-bold uppercase tracking-widest text-brand-dark/40 dark:text-gray-500 line-clamp-2">
            {book.title}
          </span>
        </div>
      )}
      
      {!book.published && (
        <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm text-white text-[8px] font-bold uppercase tracking-widest px-2 py-1 rounded-sm">
          Próximamente
        </div>
      )}
    </div>
  );
}