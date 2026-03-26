// Themed vector icons: Material (classic), Ionicons (cute), Feather outline (modern).

import Feather from "@expo/vector-icons/Feather";
import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { SymbolWeight } from "expo-symbols";
import { OpaqueColorValue, type StyleProp, type TextStyle } from "react-native";

import { resolveIconForPack, type IconSymbolName } from "@/constants/icon-packs";
import { useAppTheme } from "@/hooks/use-app-theme";

export function IconSymbol({
  name,
  size = 24,
  color,
  style,
  weight: _weight,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  const { iconPack } = useAppTheme();
  const { family, glyph } = resolveIconForPack(iconPack, name);

  if (family === "material") {
    return (
      <MaterialIcons
        color={color}
        size={size}
        name={glyph as keyof typeof MaterialIcons.glyphMap}
        style={style}
      />
    );
  }

  if (family === "ion") {
    return (
      <Ionicons
        color={color}
        size={size}
        name={glyph as keyof typeof Ionicons.glyphMap}
        style={style}
      />
    );
  }

  return (
    <Feather
      color={color}
      size={size}
      name={glyph as keyof typeof Feather.glyphMap}
      style={style}
    />
  );
}

export type { IconSymbolName };
