import { useAppTheme } from "@/hooks/use-app-theme";
import { useAppThemeContext } from "@/contexts/app-theme-context";

/**
 * Theme + appearance controls (light/dark/system, aesthetic preset, persistence).
 */
export function useTheme() {
  const app = useAppTheme();
  const ctx = useAppThemeContext();

  return {
    ...app,
    mode: ctx.mode,
    systemScheme: ctx.systemScheme,
    setMode: ctx.setMode,
    setAesthetic: ctx.setAesthetic,
  };
}
