import React, { memo, useCallback } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Callout, Marker } from "react-native-maps";
import { Image } from "expo-image";

import { ThemedText } from "@/components/themed-text";
import type { MapPinGeoItem } from "@/data/response";
import { useAppTheme } from "@/hooks/use-app-theme";
import type { LocaleCode } from "@/lib/i18n-core";
import { formatRoomPrice, type TranslateFn } from "@/utils/format-room";

type Props = {
  pin: MapPinGeoItem;
  t: TranslateFn;
  locale: LocaleCode;
  /** `pin.id` là post id — parent resolve post → room. */
  onOpenPin: (pin: MapPinGeoItem) => void;
};

function MapPinWithCalloutInner({ pin, t, locale, onOpenPin }: Props) {
  const { color } = useAppTheme();

  const open = useCallback(() => onOpenPin(pin), [onOpenPin, pin]);

  const thumb = pin.thumbnailUrl;

  return (
    <Marker
      coordinate={{ latitude: pin.lat, longitude: pin.lng }}
      tracksViewChanges={false}
      onCalloutPress={open}
      accessibilityLabel={`${pin.shortTitle || pin.title}, ${formatRoomPrice(pin.price, t, locale)}`}
    >
      <View style={[styles.dot, { backgroundColor: color.primary, borderColor: color.background }]} />
      <Callout tooltip>
        <Pressable
          onPress={open}
          style={[styles.card, { backgroundColor: color.card, borderColor: color.border }]}
          accessibilityRole="button"
          accessibilityHint={t("map.openRoom")}
        >
          <Image
            source={
              thumb ? { uri: thumb } : require("@/assets/images/placeholder.png")
            }
            style={styles.thumb}
            contentFit="cover"
          />
          <View style={styles.body}>
            <ThemedText type="defaultSemiBold" numberOfLines={2} style={styles.title}>
              {pin.shortTitle || pin.title}
            </ThemedText>
            <ThemedText style={[styles.price, { color: color.primary }]}>
              {formatRoomPrice(pin.price, t, locale)}
            </ThemedText>
            <View style={[styles.cta, { backgroundColor: color.primary }]}>
              <ThemedText style={{ color: color.primaryText, fontWeight: "700", fontSize: 13 }}>
                {t("map.openRoom")}
              </ThemedText>
            </View>
          </View>
        </Pressable>
      </Callout>
    </Marker>
  );
}

export const MapPinWithCallout = memo(MapPinWithCalloutInner);

const styles = StyleSheet.create({
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderCurve: "continuous",
  },
  card: {
    flexDirection: "row",
    width: 268,
    borderRadius: 16,
    borderCurve: "continuous",
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },
  thumb: {
    width: 88,
    height: 88,
  },
  body: {
    flex: 1,
    padding: 10,
    gap: 4,
    justifyContent: "center",
  },
  title: {
    fontSize: 14,
    lineHeight: 18,
  },
  price: {
    fontSize: 15,
    fontWeight: "800",
  },
  cta: {
    marginTop: 4,
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
});
