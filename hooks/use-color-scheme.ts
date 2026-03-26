import { useAppThemeContext } from "@/contexts/app-theme-context";

/**
 * Effective light/dark scheme (respects user preference + system when mode is "system").
 */
export function useColorScheme(): "light" | "dark" | null {
  const ctx = useAppThemeContext();
  return ctx.effectiveScheme;
}
