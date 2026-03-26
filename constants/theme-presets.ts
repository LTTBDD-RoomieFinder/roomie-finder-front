/**
 * Central theme tokens: 3 aesthetics × light/dark.
 * Components should consume colors via useAppTheme() / useThemeColor(), not these directly.
 */

export type ThemeAesthetic = "cute" | "modern" | "classic";
export type ThemeMode = "light" | "dark" | "system";

/** Visual style for vector icons (Expo vector icon families). */
export type IconPack = "ion" | "material" | "feather";

export type ThemePalette = {
  text: string;
  background: string;
  card: string;
  tint: string;
  icon: string;
  tabIconDefault: string;
  tabIconSelected: string;
  error: string;
  textSecondary: string;
  backgroundSecondary: string;
  border: string;
  /** Primary action / links */
  primary: string;
  /** On-primary text (e.g. button label on tinted bg) */
  onPrimary: string;
};

const ERROR = "#D14343";

const modernLight: ThemePalette = {
  text: "#11181C",
  background: "#FFFFFF",
  card: "#F4F4F5",
  tint: "#1abdb2",
  icon: "#687076",
  tabIconDefault: "#687076",
  tabIconSelected: "#1abdb2",
  error: ERROR,
  textSecondary: "#687076",
  backgroundSecondary: "#F4F4F5",
  border: "#E4E4E7",
  primary: "#1abdb2",
  onPrimary: "#FFFFFF",
};

const modernDark: ThemePalette = {
  text: "#ECEDEE",
  background: "#151718",
  card: "#27272A",
  tint: "#FFFFFF",
  icon: "#9BA1A6",
  tabIconDefault: "#9BA1A6",
  tabIconSelected: "#FFFFFF",
  error: ERROR,
  textSecondary: "#9BA1A6",
  backgroundSecondary: "#27272A",
  border: "#3F3F46",
  primary: "#5EEAD4",
  onPrimary: "#0F172A",
};

const cuteLight: ThemePalette = {
  text: "#3D2C3E",
  background: "#FFF8FB",
  card: "#FFE8F2",
  tint: "#E879A3",
  icon: "#9B7B8E",
  tabIconDefault: "#B89BAE",
  tabIconSelected: "#D45FA0",
  error: ERROR,
  textSecondary: "#7A6578",
  backgroundSecondary: "#FFF0F6",
  border: "#F5D0E6",
  primary: "#E879A3",
  onPrimary: "#FFFFFF",
};

const cuteDark: ThemePalette = {
  text: "#F5E6EE",
  background: "#1A1218",
  card: "#2A2230",
  tint: "#F8A4C8",
  icon: "#C4A8BC",
  tabIconDefault: "#9A8494",
  tabIconSelected: "#F8A4C8",
  error: ERROR,
  textSecondary: "#C4A8BC",
  backgroundSecondary: "#2A2230",
  border: "#3D3444",
  primary: "#F8A4C8",
  onPrimary: "#1A1218",
};

const classicLight: ThemePalette = {
  text: "#2C2416",
  background: "#F7F4EE",
  card: "#EDE8DF",
  tint: "#2C5282",
  icon: "#6B5B4F",
  tabIconDefault: "#8B7355",
  tabIconSelected: "#2C5282",
  error: ERROR,
  textSecondary: "#5C4D42",
  backgroundSecondary: "#EDE8DF",
  border: "#D4C9BC",
  primary: "#2C5282",
  onPrimary: "#F7F4EE",
};

const classicDark: ThemePalette = {
  text: "#EDE8DF",
  background: "#1C1814",
  card: "#2D2820",
  tint: "#A8C4E8",
  icon: "#A89B8C",
  tabIconDefault: "#8A7D72",
  tabIconSelected: "#A8C4E8",
  error: ERROR,
  textSecondary: "#A89B8C",
  backgroundSecondary: "#2D2820",
  border: "#4A4338",
  primary: "#8BA8D4",
  onPrimary: "#1C1814",
};

const PALETTES: Record<
  ThemeAesthetic,
  { light: ThemePalette; dark: ThemePalette }
> = {
  modern: { light: modernLight, dark: modernDark },
  cute: { light: cuteLight, dark: cuteDark },
  classic: { light: classicLight, dark: classicDark },
};

export function getThemePalette(
  aesthetic: ThemeAesthetic,
  scheme: "light" | "dark",
): ThemePalette {
  return PALETTES[aesthetic][scheme];
}

export function getIconPack(aesthetic: ThemeAesthetic): IconPack {
  switch (aesthetic) {
    case "cute":
      return "ion";
    case "modern":
      return "feather";
    case "classic":
    default:
      return "material";
  }
}

/** Border radius scale per aesthetic (React Native numeric). */
export function getRadiusScale(aesthetic: ThemeAesthetic) {
  switch (aesthetic) {
    case "cute":
      return { sm: 10, md: 16, lg: 22, xl: 28 };
    case "modern":
      return { sm: 6, md: 10, lg: 14, xl: 18 };
    case "classic":
    default:
      return { sm: 4, md: 6, lg: 8, xl: 10 };
  }
}
