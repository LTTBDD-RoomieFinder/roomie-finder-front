import { Fonts } from "@/constants/theme";
import {
  getIconPack,
  getRadiusScale,
  getThemePalette,
} from "@/constants/theme-presets";
import { useAppThemeContext } from "@/contexts/app-theme-context";

export function useAppTheme() {
  const ctx = useAppThemeContext();
  const scheme = ctx.effectiveScheme;
  const aesthetic = ctx.aesthetic;
  const palette = getThemePalette(aesthetic, scheme);
  const iconPack = getIconPack(aesthetic);
  const radius = getRadiusScale(aesthetic);

  const colors = palette;

  return {
    scheme,
    aesthetic,
    iconPack,
    radius,
    hydrated: ctx.hydrated,
    logo:
      scheme === "dark"
        ? require("@/assets/images/logo-dark.png")
        : require("@/assets/images/logo-light.png"),
    color: {
      text: colors.text,
      background: colors.background,
      card: colors.card,

      primary: colors.primary,
      primaryText: colors.onPrimary,

      border: colors.border,
      placeholder: colors.icon,

      icon: colors.icon,

      error: colors.error,

      textSecondary: colors.textSecondary,
      backgroundSecondary: colors.backgroundSecondary,
      tint: colors.tint,

      tab: {
        default: colors.tabIconDefault,
        active: colors.tabIconSelected,
      },
    },

    /** Raw palette for navigation / StatusBar */
    palette: colors,

    font: {
      sans: Fonts?.sans,
      serif: Fonts?.serif,
      rounded: Fonts?.rounded,
      mono: Fonts?.mono,
    },
  };
}

export type AppTheme = ReturnType<typeof useAppTheme>;
