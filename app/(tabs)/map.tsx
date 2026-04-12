import React from "react";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { RoomMapPinsView } from "@/components/map/room-map-pins-view";
import { ThemedText } from "@/components/themed-text";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useLanguage } from "@/hooks/use-language";

export default function MapTabScreen() {
  const insets = useSafeAreaInsets();
  const { color } = useAppTheme();
  const { t } = useLanguage();

  return (
    <View style={[styles.root, { backgroundColor: color.background }]}>
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + 10,
            paddingBottom: 14,
            borderBottomColor: color.border,
            backgroundColor: color.background,
          },
        ]}
      >
        <ThemedText type="defaultSemiBold" style={styles.title}>
          {t("map.title")}
        </ThemedText>
        <ThemedText style={[styles.subtitle, { color: color.textSecondary }]}>
          {t("map.subtitle")}
        </ThemedText>
      </View>
      <View style={styles.mapWrap}>
        <RoomMapPinsView />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 6,
  },
  title: {
    fontSize: 22,
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  mapWrap: {
    flex: 1,
  },
});
