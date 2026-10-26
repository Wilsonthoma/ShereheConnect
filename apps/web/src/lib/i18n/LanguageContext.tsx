'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  DEFAULT_LOCALE,
  LOCALES,
  dictionaries,
  type Locale,
  type TranslationKey,
} from './translations';

type InterpolationValues = Record<string, string | number>;

interface LanguageContextValue {
  language: Locale;
  setLanguage: (lang: Locale) => void;
  /** Simple translate, with optional {token} interpolation */
  t: (key: TranslationKey, values?: InterpolationValues) => string;
  /** Plural-aware translate — pass `count` */
  tp: (
    key: string,
    count: number,
    values?: InterpolationValues,
  ) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);
const STORAGE_KEY = 'sherehe.language';
const COOKIE_KEY = 'sherehe.language';

function interpolate(template: string, values?: InterpolationValues): string {
  if (!values) return template;
  return template.replace(/\{(\w+)\}/g, (match, name) => {
    const v = values[name];
    return v === undefined ? match : String(v);
  });
}

function pickPluralKey(key: string, count: number): string {
  if (count === 0) return `${key}.zero`;
  if (count === 1) return `${key}.one`;
  return `${key}.other`;
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Locale>(DEFAULT_LOCALE);

  // Hydrate from cookie first (server-set), then localStorage
  useEffect(() => {
    try {
      const cookieMatch = document.cookie
        .split('; ')
        .find((c) => c.startsWith(`${COOKIE_KEY}=`));
      const cookieLang = cookieMatch?.split('=')[1] as Locale | undefined;

      const stored = (cookieLang ??
        localStorage.getItem(STORAGE_KEY)) as Locale | null;

      if (stored && (LOCALES as readonly string[]).includes(stored)) {
        setLanguageState(stored);
        document.documentElement.lang = stored;
      }
    } catch {
      /* ignore */
    }
  }, []);

  const setLanguage = useCallback((lang: Locale) => {
    setLanguageState(lang);
    try {
      localStorage.setItem(STORAGE_KEY, lang);
      document.cookie = `${COOKIE_KEY}=${lang}; path=/; max-age=31536000; samesite=lax`;
      document.documentElement.lang = lang;
    } catch {
      /* ignore */
    }
  }, []);

  const t = useCallback(
    (key: TranslationKey, values?: InterpolationValues) => {
      const dict = dictionaries[language] ?? dictionaries[DEFAULT_LOCALE];
      const raw = (dict as Record<string, string>)[key as string] ?? key;
      return interpolate(raw, values);
    },
    [language],
  );

  const tp = useCallback(
    (key: string, count: number, values?: InterpolationValues) => {
      const dict = dictionaries[language] ?? dictionaries[DEFAULT_LOCALE];
      const pluralKey = pickPluralKey(key, count);
      const raw = dict[pluralKey] ?? pluralKey;
      return interpolate(raw, { count, ...values });
    },
    [language],
  );

  const value = useMemo(
    () => ({ language, setLanguage, t, tp }),
    [language, setLanguage, t, tp],
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error('useLanguage must be used inside <LanguageProvider>');
  }
  return ctx;
}