import { Colors, Fonts } from "@/constants/theme";
import { useColorScheme } from "react-native";

export function useAppTheme() {
  const scheme = useColorScheme() ?? "light";
  const colors = Colors[scheme];

  return {
    scheme,
    logo:
      scheme === "dark"
        ? require("@/assets/images/logo-dark.png")
        : require("@/assets/images/logo-light.png"),
    color: {
      text: colors.text,
      background: colors.background,
      card: colors.card,

      primary: colors.tint,
      primaryText: scheme === "dark" ? colors.background : colors.background,

      border: colors.icon,
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

    font: {
      sans: Fonts?.sans,
      serif: Fonts?.serif,
      rounded: Fonts?.rounded,
      mono: Fonts?.mono,
    },
  };
}
