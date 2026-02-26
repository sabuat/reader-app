"use client";

import { useState } from 'react';
import { X } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export function BookModal({ book }: { book: any }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);

  const handleNotifyMe = async () => {
    // Aquí asumo que tienes una tabla llamada 'notifications' con 'book_id'
    // Puedes ajustar esto según tu esquema de base de datos
    const { error } = await supabase
      .from('notifications')
      .insert([{ book_id: book.id }]);

    if (!error) {
      setIsSubscribed(true);
      setTimeout(() => setIsOpen(false), 2000); // Cierra el modal tras 2 segundos
    }
  };

  return (
    <>
      <a 
        onClick={() => setIsOpen(true)}
        className="inline-block border-b border-black text-[11px] uppercase font-bold pb-0.5 mb-2 hover:text-brand-gold hover:border-brand-gold transition cursor-pointer"
      >
        Ver detalle
      </a>

      {isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 text-left">
          <div className="bg-[#F9F9F7] max-w-lg w-full rounded-xl shadow-2xl relative border border-[#C5A059]/20 p-8">
            <button onClick={() => setIsOpen(false)} className="absolute top-4 right-4 text-[#2D2D2D]">
              <X size={24} />
            </button>
            
            <span className="text-[#C5A059] font-bold text-[10px] uppercase tracking-widest">{book.author}</span>
            <h2 className="text-2xl font-serif font-bold uppercase mt-1 mb-4 text-[#2D2D2D]">{book.title}</h2>
            <div className="h-px bg-[#C5A059]/20 w-full mb-6" />
            
            <p className="text-[#2D2D2D]/80 leading-relaxed text-sm mb-8">
              {book.description || "Sin descripción disponible."}
            </p>

            {/* Lógica de botones del Modal */}
            {book.published ? (
              <button 
                onClick={() => setIsOpen(false)} 
                className="w-full bg-[#2D2D2D] text-white py-3 rounded-md font-bold uppercase text-[10px] tracking-widest"
              >
                Cerrar
              </button>
            ) : (
              <button 
                onClick={handleNotifyMe}
                disabled={isSubscribed}
                className={`w-full py-3 rounded-md font-bold uppercase text-[10px] tracking-widest transition-all ${
                  isSubscribed 
                  ? "bg-green-600 text-white cursor-default" 
                  : "bg-[#C5A059] text-white hover:bg-[#b38f4d] active:scale-95"
                }`}
              >
                {isSubscribed ? "¡TE AVISAREMOS!" : "AVISARME CUANDO ESTÉ DISPONIBLE"}
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
}