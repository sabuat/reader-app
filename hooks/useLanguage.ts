"use client";

import { useState, useEffect, useCallback } from 'react';
import { PreferencesService, SupportedLanguage } from '@/lib/preferences';
import { dictionaries } from '@/lib/i18n/dictionaries';

const getDeviceLanguageFallback = (): SupportedLanguage => {
  if (typeof window === 'undefined') return 'es';

  const browserLang = window.navigator.language.toLowerCase();

  if (browserLang.startsWith('es')) return 'es';
  if (browserLang.startsWith('pt')) return 'pt';
  return 'en';
};

export function useLanguage() {
  const [lang, setLangState] = useState<SupportedLanguage>('es');
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const storedLang = PreferencesService.getLanguage();

    if (storedLang) {
      setLangState(storedLang);
    } else {
      const detectedLang = getDeviceLanguageFallback();
      setLangState(detectedLang);
      PreferencesService.setLanguage(detectedLang);
    }

    setIsReady(true);
  }, []);

  const setLang = useCallback((newLang: SupportedLanguage) => {
    setLangState(newLang);
    PreferencesService.setLanguage(newLang);
  }, []);

  const t = useCallback(
    (path: string): string => {
      const currentDict = dictionaries[lang] || dictionaries.es;

      const keys = path.split('.');
      let value: unknown = currentDict;

      for (const key of keys) {
        if (value === null || value === undefined || typeof value !== 'object') {
          return path;
        }

        value = (value as Record<string, unknown>)[key];
      }

      return typeof value === 'string' || typeof value === 'number'
        ? String(value)
        : path;
    },
    [lang]
  );

  return {
    lang,
    setLang,
    t,
    isReady,
  };
}