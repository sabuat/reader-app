"use client";

import { User, LogOut } from 'lucide-react';

export default function CuentaPage() {
  return (
    <div className="min-h-screen bg-brand-bg px-6 pb-20">
      <header className="pt-8 pb-6 border-b border-brand-gold/10 mb-8">
        <span className="text-brand-gold font-bold tracking-[0.2em] text-[10px] uppercase">Perfil</span>
        <h1 className="text-3xl font-serif italic text-brand-dark">Mi Cuenta</h1>
      </header>
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-brand-gold/5 flex flex-col items-center">
        <div className="w-20 h-20 bg-brand-gold/10 rounded-full flex items-center justify-center mb-4">
          <User size={40} className="text-brand-gold" />
        </div>
        <h2 className="text-xl font-serif italic text-brand-dark">Lector Apapacho</h2>
        <p className="text-xs text-gray-400 uppercase tracking-widest mt-1 mb-8">Usuario Invitado</p>
        <button className="w-full flex items-center justify-center gap-2 p-4 text-brand-red font-bold text-xs uppercase tracking-widest border border-brand-red/20 rounded-2xl active:scale-95 transition-transform">
          <LogOut size={18} /> Cerrar Sesión
        </button>
      </div>
    </div>
  );
}