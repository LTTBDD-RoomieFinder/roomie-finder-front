import { useAppThemeContext } from "@/contexts/app-theme-context";

/**
 * Web: same as native — theme is driven by AppThemeProvider (avoids SSR flash vs system).
 */
export function useColorScheme(): "light" | "dark" | null {
  const ctx = useAppThemeContext();
  return ctx.effectiveScheme;
}
