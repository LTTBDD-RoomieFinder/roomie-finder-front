import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { LayoutAnimation, Platform, UIManager } from "react-native";

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

import { getNested, interpolate, type LocaleCode } from "@/lib/i18n-core";
import en from "@/locales/en.json";
import vi from "@/locales/vi.json";

const STORAGE_LOCALE = "@roomie/locale";

const CATALOG: Record<LocaleCode, Record<string, unknown>> = {
  en: en as Record<string, unknown>,
  vi: vi as Record<string, unknown>,
};

export type I18nContextValue = {
  locale: LocaleCode;
  setLocale: (code: LocaleCode) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  hydrated: boolean;
};

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<LocaleCode>("en");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_LOCALE);
        if (cancelled) return;
        if (raw === "vi" || raw === "en") {
          setLocaleState(raw);
        }
      } finally {
        if (!cancelled) setHydrated(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const setLocale = useCallback((code: LocaleCode) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setLocaleState(code);
    void AsyncStorage.setItem(STORAGE_LOCALE, code);
  }, []);

  const t = useCallback(
    (key: string, params?: Record<string, string | number>) => {
      const table = CATALOG[locale];
      const raw = getNested(table, key) ?? getNested(CATALOG.en, key) ?? key;
      return interpolate(raw, params);
    },
    [locale],
  );

  const value = useMemo<I18nContextValue>(
    () => ({ locale, setLocale, t, hydrated }),
    [locale, setLocale, t, hydrated],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    const fallback: I18nContextValue = {
      locale: "en",
      setLocale: () => {},
      t: (key, params) => {
        const raw = getNested(CATALOG.en, key) ?? key;
        return interpolate(raw, params);
      },
      hydrated: true,
    };
    return fallback;
  }
  return ctx;
}
