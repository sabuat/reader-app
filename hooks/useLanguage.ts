import { useState, useEffect, useCallback } from 'react';
import { getPrefs, updatePrefs } from '@/lib/preferences';
import { dictionaries, Language } from '@/lib/i18n/dictionaries';

// 1. ESTADO GLOBAL EN MEMORIA: Todas las pantallas mirarán esta misma variable
let globalLang: Language = 'en'; // Fallback inicial seguro

// Función pura para detectar el idioma del OS/Navegador según reglas de negocio
function getOSLanguage(): Language {
  if (typeof window === 'undefined') return 'en';
  
  // Obtenemos el idioma del sistema (soporta navegadores modernos y webviews de Capacitor)
  const navigatorLang = window.navigator.language || (window.navigator as any).userLanguage || '';
  const lowerLang = navigatorLang.toLowerCase();

  // Regla: ES -> ES, PT -> PT, OTHERS -> EN
  if (lowerLang.startsWith('es')) return 'es';
  if (lowerLang.startsWith('pt')) return 'pt';
  
  return 'en';
}

// 2. SISTEMA DE TRANSMISIÓN: Aquí guardamos a todos los componentes que necesitan enterarse del cambio
const listeners = new Set<(lang: Language) => void>();

// Carga inicial segura cuando la aplicación arranca
if (typeof window !== 'undefined') {
  const prefs = getPrefs();
  
  // Verificamos si el usuario ya eligió un idioma manualmente
  if (prefs?.language && dictionaries[prefs.language as Language]) {
    globalLang = prefs.language as Language;
  } else {
    // Si no hay preferencia, calculamos el idioma según el OS
    globalLang = getOSLanguage();
    // Guardamos silenciosamente la preferencia detectada para mantener consistencia
    updatePrefs({ language: globalLang });
  }
}

export function useLanguage() {
  const [lang, setLang] = useState<Language>(globalLang);

  useEffect(() => {
    // Suscripción al cambio de idioma global
    const handleLanguageChange = (newLang: Language) => {
      setLang(newLang);
    };
    
    listeners.add(handleLanguageChange);
    
    // Sincronización en caso de que el hook se monte después de un cambio global
    if (lang !== globalLang) {
      setLang(globalLang);
    }

    return () => {
      listeners.delete(handleLanguageChange);
    };
  }, [lang]);

  const changeLanguage = (newLang: Language) => {
    // 1. Actualizamos la memoria global
    globalLang = newLang; 
    
    // 2. Persistimos en localStorage
    updatePrefs({ language: newLang }); 
    
    // 3. Notificamos a todos los componentes suscritos
    listeners.forEach(listener => listener(newLang));
  };

  const t = useCallback((path: string) => {
    const keys = path.split('.');
    let value: any = dictionaries[lang];
    
    for (const key of keys) {
      // Retornamos el path original si falta una traducción para evitar crashes
      if (value?.[key] === undefined) return path; 
      value = value[key];
    }
    
    return value as string;
  }, [lang]);

  return { lang, changeLanguage, t };
}