'use client';

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { translations } from './translations';

export type Locale = 'en' | 'ru' | 'uz';

interface LanguageContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: keyof typeof translations['en']) => string;
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('ru');

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
  }, []);

  const t = useCallback((key: keyof typeof translations['en']): string => {
    const dict = translations[locale] || translations['en'];
    return dict[key] || translations['en'][key] || String(key);
  }, [locale]);

  return (
    <LanguageContext value={{ locale, setLocale, t }}>
      {children}
    </LanguageContext>
  );
}

export function useLanguage(): LanguageContextValue {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
