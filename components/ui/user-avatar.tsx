import { Image } from "expo-image";
import type { ImageStyle, StyleProp, ViewStyle } from "react-native";
import { StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useResolvedAvatarUrl } from "@/hooks/use-resolved-avatar-url";

type Props = {
  userId: string | number | null | undefined;
  /** URL from post/search/request payload — kept in sync via store `applyHint`. */
  hintUrl?: string | null;
  size?: number;
  /** Used for initial fallback when there is no image. */
  name?: string | null;
  style?: StyleProp<ViewStyle>;
  borderColor?: string;
};

export function UserAvatar({
  userId,
  hintUrl,
  size = 44,
  name,
  style,
  borderColor,
}: Props) {
  const { color } = useAppTheme();
  const uri = useResolvedAvatarUrl(userId, hintUrl);
  const letter = (name?.trim()?.charAt(0) || "?").toUpperCase();
  const dim = { width: size, height: size, borderRadius: size / 2 };

  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={[
          dim,
          { overflow: "hidden" },
          borderColor ? { borderWidth: StyleSheet.hairlineWidth, borderColor } : null,
          style as StyleProp<ImageStyle>,
        ]}
        contentFit="cover"
        transition={150}
        cachePolicy="memory-disk"
        recyclingKey={String(uri)}
      />
    );
  }

  return (
    <View
      style={[
        dim,
        {
          backgroundColor: color.primary + "22",
          alignItems: "center",
          justifyContent: "center",
          ...(borderColor
            ? { borderWidth: StyleSheet.hairlineWidth, borderColor }
            : {}),
        },
        style,
      ]}
    >
      <ThemedText
        style={{
          fontSize: Math.max(12, size * 0.38),
          fontWeight: "800",
          color: color.primary,
        }}
      >
        {letter}
      </ThemedText>
    </View>
  );
}
