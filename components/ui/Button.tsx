"use client";

import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'outline';
  isLoading?: boolean;
  fullWidth?: boolean;
}

export function Button({ 
  children, 
  variant = 'primary', 
  isLoading = false, 
  fullWidth = true, 
  className = '',
  disabled,
  ...props 
}: ButtonProps) {
  
  const baseStyles = "relative flex items-center justify-center gap-2 py-4 rounded-full font-bold text-[11px] uppercase tracking-widest active:scale-95 transition-all shadow-sm overflow-hidden";
  const widthStyle = fullWidth ? "w-full" : "w-auto px-8";
  
  const variants = {
    primary: "bg-brand-gold text-white shadow-brand-gold/20 hover:bg-brand-gold/90",
    secondary: "bg-brand-dark-blue dark:bg-white text-white dark:text-brand-dark hover:bg-brand-dark-blue/90 dark:hover:bg-gray-100",
    danger: "bg-red-50 text-red-500 border border-red-100 hover:bg-red-100 dark:bg-red-900/20 dark:border-red-900/50",
    outline: "bg-transparent border-2 border-brand-gold/20 text-brand-dark dark:text-brand-gold hover:bg-brand-gold/5",
  };

  const isDisabled = disabled || isLoading;

  return (
    <button 
      className={`${baseStyles} ${widthStyle} ${variants[variant]} ${isDisabled ? 'opacity-70 pointer-events-none' : ''} ${className}`}
      disabled={isDisabled}
      {...props}
    >
      {isLoading && <Loader2 size={16} className="animate-spin absolute left-4" />}
      {children}
    </button>
  );
}