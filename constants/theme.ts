/**
 * Global font stacks and bootstrap color aliases (modern palette).
 * Runtime theming uses `getThemePalette` + AppThemeProvider — see `constants/theme-presets.ts`.
 */

import { Platform } from "react-native";

import { getThemePalette } from "@/constants/theme-presets";

/** Bootstrap `Colors` for fallbacks (e.g. before provider mounts). Matches `modern` aesthetic. */
export const Colors = {
  light: getThemePalette("modern", "light"),
  dark: getThemePalette("modern", "dark"),
};

export const Fonts = Platform.select({
  ios: {
    sans: "system-ui",
    serif: "ui-serif",
    rounded: "ui-rounded",
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded:
      "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
