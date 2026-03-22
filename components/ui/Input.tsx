"use client";

import { InputHTMLAttributes, ReactNode } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  icon?: ReactNode;
  label?: string;
}

export function Input({ icon, label, className = '', ...props }: InputProps) {
  return (
    <div className="w-full flex flex-col gap-1.5">
      {label && (
        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-gold ml-2">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500">
            {icon}
          </div>
        )}
        <input 
          className={`w-full bg-gray-50 dark:bg-black/30 border border-gray-100 dark:border-white/5 rounded-2xl py-4 pr-4 text-sm focus:outline-none focus:border-brand-gold transition-colors text-brand-dark dark:text-gray-200 ${icon ? 'pl-12' : 'pl-4'} ${className}`}
          {...props}
        />
      </div>
    </div>
  );
}