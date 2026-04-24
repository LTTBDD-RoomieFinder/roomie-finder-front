import React from "react";
import { StyleSheet, View } from "react-native";

import { RoomMapPinsView } from "@/components/map/room-map-pins-view";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { ThemedText } from "@/components/themed-text";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useLanguage } from "@/hooks/use-language";

export default function MapTabScreen() {
  const { color } = useAppTheme();
  const { t } = useLanguage();

  return (
    <View style={[styles.root, { backgroundColor: color.background }]}>
      <View style={[styles.header, { backgroundColor: color.primary }]}>
        <View style={styles.headerContent}>
          <View style={[styles.headerIconWrap, { backgroundColor: "rgba(255,255,255,0.2)" }]}>
            <IconSymbol name="map.fill" size={28} color={color.primaryText} />
          </View>
          <View style={styles.headerTextWrap}>
            <ThemedText style={[styles.headerTitle, { color: color.primaryText }]}>
              {t("map.title")}
            </ThemedText>
            <ThemedText style={[styles.headerSubtitle, { color: color.primaryText, opacity: 0.9 }]}>
              {t("map.subtitle")}
            </ThemedText>
          </View>
        </View>
      </View>
      <View style={styles.mapWrap}>
        <RoomMapPinsView />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    height: 100,
    marginTop: 40,
    justifyContent: "flex-end",
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  headerIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTextWrap: { flex: 1 },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  headerSubtitle: {
    fontSize: 14,
    marginTop: 4,
    lineHeight: 20,
  },
  mapWrap: { flex: 1 },
});
