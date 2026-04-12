import React, { memo, useCallback } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Marker } from "react-native-maps";

import type { MapPinGeoItem } from "@/data/response";
import { useAppTheme } from "@/hooks/use-app-theme";
import type { LocaleCode } from "@/lib/i18n-core";
import type { TranslateFn } from "@/utils/format-room";

type Props = {
  pin: MapPinGeoItem;
  isSelected: boolean;
  t: TranslateFn;
  locale: LocaleCode;
  onPress: (pin: MapPinGeoItem) => void;
};

/** Abbreviated price label: 3.5tr / 3.5M */
function shortPrice(price: number, locale: LocaleCode): string {
  if (locale === "vi") {
    if (price >= 1_000_000)
      return `${(price / 1_000_000 % 1 === 0
        ? price / 1_000_000
        : (price / 1_000_000).toFixed(1))}tr`;
    return `${(price / 1_000).toFixed(0)}k`;
  }
  if (price >= 1_000_000) return `${(price / 1_000_000).toFixed(1)}M`;
  if (price >= 1_000) return `${(price / 1_000).toFixed(0)}K`;
  return `${price}`;
}

function RoomMapPinInner({ pin, isSelected, locale, onPress }: Props) {
  const { color } = useAppTheme();
  const label = shortPrice(pin.price, locale);

  const handlePress = useCallback(() => onPress(pin), [onPress, pin]);

  return (
    <Marker
      coordinate={{ latitude: pin.lat, longitude: pin.lng }}
      tracksViewChanges={false}
      onPress={handlePress}
      anchor={{ x: 0.5, y: 1 }}
      zIndex={isSelected ? 999 : 1}
    >
      <View style={styles.wrap}>
        <View
          style={[
            styles.bubble,
            isSelected
              ? { backgroundColor: color.primary, borderColor: color.primary, ...styles.bubbleActive }
              : { backgroundColor: color.background, borderColor: color.border },
          ]}
        >
          <Text
            style={[styles.label, { color: isSelected ? "#fff" : color.text }]}
            numberOfLines={1}
          >
            {label}
          </Text>
        </View>
        {/* Tail */}
        <View
          style={[
            styles.tail,
            { borderTopColor: isSelected ? color.primary : color.border },
          ]}
        />
      </View>
    </Marker>
  );
}

export const RoomMapPin = memo(RoomMapPinInner);

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
  },
  bubble: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1.5,
    minWidth: 48,
    alignItems: "center",
    // iOS shadow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
    // Android elevation
    elevation: 4,
  },
  bubbleActive: {
    shadowOpacity: 0.32,
    shadowRadius: 6,
    elevation: 8,
    transform: [{ scale: 1.1 }],
  },
  label: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: -0.2,
  },
  tail: {
    width: 0,
    height: 0,
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderTopWidth: 6,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    marginTop: -1,
  },
});
