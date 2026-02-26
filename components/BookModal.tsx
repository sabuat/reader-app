"use client";

import { useState } from 'react';
import { ChevronRight, X } from 'lucide-react';

export function BookModal({ book }: { book: any }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <a 
        onClick={() => setIsOpen(true)}
        className="mt-3 h-[18px] mb-2 inline-block border-b border-black text-[11px] uppercase font-bold pb-1 hover:text-brand-gold hover:border-brand-gold transition cursor-pointer"
      >
        Ver detalle <ChevronRight size={10} className="inline-block mb-2" />
      </a>

      {isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#F9F9F7] max-w-lg w-full rounded-xl shadow-2xl relative border border-[#C5A059]/20 p-8">
            <button onClick={() => setIsOpen(false)} className="absolute top-4 right-4 text-[#2D2D2D]">
              <X size={24} />
            </button>
            <span className="text-[#C5A059] font-bold text-[10px] uppercase tracking-widest">{book.author}</span>
            <h2 className="text-2xl font-serif font-bold uppercase mt-1 mb-4 text-[#2D2D2D]">{book.title}</h2>
            <div className="h-px bg-[#C5A059]/20 w-full mb-6" />
            <p className="text-[#2D2D2D]/80 leading-relaxed text-sm">{book.description || "Sin descripción."}</p>
            <button onClick={() => setIsOpen(false)} className="mt-8 w-full bg-[#2D2D2D] text-white py-3 rounded-md font-bold uppercase text-[10px]">Cerrar</button>
          </div>
        </div>
      )}
    </>
  );
}