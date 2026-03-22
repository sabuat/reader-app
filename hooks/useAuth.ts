import { useState, useEffect, useCallback } from 'react';
import { getPrefs, updatePrefs } from '@/lib/preferences';
import { dictionaries, Language } from '@/lib/i18n/dictionaries';

export function useLanguage() {
  const [lang, setLang] = useState<Language>('es');

  useEffect(() => {
    // 1. Carga inicial
    const prefs = getPrefs();
    if (prefs.language && dictionaries[prefs.language as Language]) {
      setLang(prefs.language as Language);
    }

    // 2. Escucha global para actualizar otros componentes en tiempo real (como la botonera)
    const handleLanguageChange = () => {
      const currentPrefs = getPrefs();
      if (currentPrefs.language) {
        setLang(currentPrefs.language as Language);
      }
    };

    window.addEventListener('languageChanged', handleLanguageChange);
    return () => window.removeEventListener('languageChanged', handleLanguageChange);
  }, []);

  const changeLanguage = (newLang: Language) => {
    setLang(newLang);
    updatePrefs({ language: newLang });
    // 3. Avisamos a toda la aplicación del cambio
    window.dispatchEvent(new Event('languageChanged'));
  };

  const t = useCallback((path: string) => {
    const keys = path.split('.');
    let value: any = dictionaries[lang];
    
    for (const key of keys) {
      if (value[key] === undefined) return path; 
      value = value[key];
    }
    
    return value as string;
  }, [lang]);

  return { lang, changeLanguage, t };
}