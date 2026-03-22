"use client";

import { BookOpen } from "lucide-react";

// 1. Esqueleto para cuando los libros están cargando (Efecto brillo)
export function BookCardSkeleton() {
  return (
    <div className="relative aspect-[5/8] rounded-xl overflow-hidden bg-gray-200 dark:bg-white/5 animate-pulse border border-brand-gold/5">
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 dark:via-white/5 to-transparent -translate-x-full animate-[shimmer_1.5s_infinite]" />
    </div>
  );
}

// 2. Pantalla para cuando no hay resultados en un filtro o lista
interface EmptyStateProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
}

export function EmptyState({ title, description, icon }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center animate-fade-in">
      <div className="w-20 h-20 bg-brand-gold/10 rounded-full flex items-center justify-center mb-6 text-brand-gold">
        {icon || <BookOpen size={32} />}
      </div>
      <h3 className="text-xl font-serif italic text-brand-dark dark:text-gray-200 mb-2">
        {title}
      </h3>
      <p className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">
        {description}
      </p>
    </div>
  );
}