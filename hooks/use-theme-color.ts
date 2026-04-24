import type { ThemePalette } from "@/constants/theme-presets";
import { getThemePalette } from "@/constants/theme-presets";
import { useAppThemeContext } from "@/contexts/app-theme-context";
import { useColorScheme } from "@/hooks/use-color-scheme";

export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: keyof ThemePalette,
) {
  const theme = useColorScheme() ?? "light";
  const colorFromProps = props[theme];
  if (colorFromProps) {
    return colorFromProps;
  }

  const ctx = useAppThemeContext();
  if (ctx.hydrated) {
    return getThemePalette(ctx.aesthetic, theme)[colorName];
  }

  return getThemePalette("modern", theme)[colorName];
}
