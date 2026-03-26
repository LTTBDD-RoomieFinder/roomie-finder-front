import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  LayoutAnimation,
  Platform,
  UIManager,
  useColorScheme as useRNColorScheme,
} from "react-native";

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

import type {
  ThemeAesthetic,
  ThemeMode,
} from "@/constants/theme-presets";

const STORAGE_MODE = "@roomie/theme_mode";
const STORAGE_AESTHETIC = "@roomie/theme_aesthetic";

export type AppThemeContextValue = {
  aesthetic: ThemeAesthetic;
  mode: ThemeMode;
  effectiveScheme: "light" | "dark";
  /** Resolved system scheme (for UI copy / preview). */
  systemScheme: "light" | "dark";
  setAesthetic: (v: ThemeAesthetic) => void;
  setMode: (v: ThemeMode) => void;
  hydrated: boolean;
};

const defaultValue: AppThemeContextValue = {
  aesthetic: "modern",
  mode: "system",
  effectiveScheme: "light",
  systemScheme: "light",
  setAesthetic: () => {},
  setMode: () => {},
  hydrated: false,
};

const AppThemeContext = createContext<AppThemeContextValue | null>(null);

export function AppThemeProvider({ children }: { children: React.ReactNode }) {
  const rnScheme = useRNColorScheme();
  const systemScheme: "light" | "dark" = rnScheme === "dark" ? "dark" : "light";

  const [aesthetic, setAestheticState] = useState<ThemeAesthetic>("modern");
  const [mode, setModeState] = useState<ThemeMode>("system");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [rawMode, rawAesthetic] = await Promise.all([
          AsyncStorage.getItem(STORAGE_MODE),
          AsyncStorage.getItem(STORAGE_AESTHETIC),
        ]);
        if (cancelled) return;
        if (rawMode === "light" || rawMode === "dark" || rawMode === "system") {
          setModeState(rawMode);
        }
        if (
          rawAesthetic === "cute" ||
          rawAesthetic === "modern" ||
          rawAesthetic === "classic"
        ) {
          setAestheticState(rawAesthetic);
        }
      } finally {
        if (!cancelled) setHydrated(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const effectiveScheme: "light" | "dark" = useMemo(() => {
    if (mode === "system") return systemScheme;
    return mode;
  }, [mode, systemScheme]);

  const setAesthetic = useCallback((v: ThemeAesthetic) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setAestheticState(v);
    void AsyncStorage.setItem(STORAGE_AESTHETIC, v);
  }, []);

  const setMode = useCallback((v: ThemeMode) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setModeState(v);
    void AsyncStorage.setItem(STORAGE_MODE, v);
  }, []);

  const value = useMemo<AppThemeContextValue>(
    () => ({
      aesthetic,
      mode,
      effectiveScheme,
      systemScheme,
      setAesthetic,
      setMode,
      hydrated,
    }),
    [
      aesthetic,
      mode,
      effectiveScheme,
      systemScheme,
      setAesthetic,
      setMode,
      hydrated,
    ],
  );

  return (
    <AppThemeContext.Provider value={value}>{children}</AppThemeContext.Provider>
  );
}

export function useAppThemeContext(): AppThemeContextValue {
  const ctx = useContext(AppThemeContext);
  if (!ctx) {
    return defaultValue;
  }
  return ctx;
}

export { AppThemeContext };
