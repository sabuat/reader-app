import { useState, useEffect, useCallback } from 'react';
import { getPrefs, updatePrefs } from '@/lib/preferences';
import { dictionaries, Language } from '@/lib/i18n/dictionaries';

// 1. ESTADO GLOBAL EN MEMORIA: Todas las pantallas mirarán esta misma variable
let globalLang: Language = 'es';

// 2. SISTEMA DE TRANSMISIÓN: Aquí guardamos a todos los componentes que necesitan enterarse del cambio
const listeners = new Set<(lang: Language) => void>();

// Carga inicial segura cuando la aplicación arranca
if (typeof window !== 'undefined') {
  const prefs = getPrefs();
  if (prefs?.language && dictionaries[prefs.language as Language]) {
    globalLang = prefs.language as Language;
  }
}

export function useLanguage() {
  const [lang, setLang] = useState<Language>(globalLang);

  useEffect(() => {
    // Cuando una pantalla o la botonera carga, se "suscribe" a la transmisión de idiomas
    const handleLanguageChange = (newLang: Language) => {
      setLang(newLang);
    };
    
    listeners.add(handleLanguageChange);
    
    // Si la pantalla cargó un poco tarde y el idioma global ya había cambiado, se sincroniza
    if (lang !== globalLang) {
      setLang(globalLang);
    }

    // Cuando sales de la pantalla, se "desuscribe" para no gastar memoria
    return () => {
      listeners.delete(handleLanguageChange);
    };
  }, [lang]);

  const changeLanguage = (newLang: Language) => {
    // 1. Actualizamos la memoria global
    globalLang = newLang; 
    
    // 2. Lo guardamos en el disco duro del teléfono (preferences)
    updatePrefs({ language: newLang }); 
    
    // 3. MAGIA: Disparamos la actualización a la botonera, la página actual y todo lo demás al instante
    listeners.forEach(listener => listener(newLang));
  };

  const t = useCallback((path: string) => {
    const keys = path.split('.');
    let value: any = dictionaries[lang];
    
    for (const key of keys) {
      // Si falta una traducción, devuelve la clave original para que no explote la app
      if (value?.[key] === undefined) return path; 
      value = value[key];
    }
    
    return value as string;
  }, [lang]);

  return { lang, changeLanguage, t };
}