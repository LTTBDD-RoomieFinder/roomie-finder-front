import React, { memo, useCallback, useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Image } from "expo-image";
import { Marker } from "react-native-maps";

import type { MapPinGeoItem } from "@/data/response";
import { useAppTheme } from "@/hooks/use-app-theme";
import type { LocaleCode } from "@/lib/i18n-core";
import type { TranslateFn } from "@/utils/format-room";

const PIN_W = 50;
const IMG_H = 40;
const RADIUS = 16;

type Props = {
  pin: MapPinGeoItem;
  isSelected: boolean;
  t: TranslateFn;
  locale: LocaleCode;
  onPress: (pin: MapPinGeoItem) => void;
};

/** Giá gọn: 3.5tr / 3.5M */
function shortPrice(price: number, locale: LocaleCode): string {
  if (locale === "vi") {
    if (price >= 1_000_000) {
      const m = price / 1_000_000;
      return `${(m % 1 === 0 ? m : m.toFixed(1))}tr`;
    }
    return `${(price / 1_000).toFixed(0)}k`;
  }
  if (price >= 1_000_000) return `${(price / 1_000_000).toFixed(1)}M`;
  if (price >= 1_000) return `${(price / 1_000).toFixed(0)}K`;
  return `${price}`;
}

function RoomMapPinInner({ pin, isSelected, locale, onPress, t }: Props) {
  const { color, scheme } = useAppTheme();
  const label = shortPrice(pin.price, locale);
  const isDark = scheme === "dark";

  const [tracksViewChanges, setTracksViewChanges] = useState(true);
  useEffect(() => {
    setTracksViewChanges(true);
    const t = setTimeout(() => setTracksViewChanges(false), 900);
    return () => clearTimeout(t);
  }, [pin.id, pin.thumbnailUrl, isSelected]);

  const handlePress = useCallback(() => onPress(pin), [onPress, pin]);

  const imageSource = pin.thumbnailUrl?.trim()
    ? { uri: pin.thumbnailUrl.trim() }
    : require("@/assets/images/placeholder.png");

  const borderC = isSelected ? color.primary : isDark ? "rgba(255,255,255,0.92)" : "#fff";
  const gradBottom = isDark ? "rgba(0,0,0,0.82)" : "rgba(0,0,0,0.7)";

  return (
    <Marker
      coordinate={{ latitude: pin.lat, longitude: pin.lng }}
      tracksViewChanges={tracksViewChanges || isSelected}
      onPress={handlePress}
      anchor={{ x: 0.5, y: 1 }}
      zIndex={isSelected ? 999 : 1}
      accessibilityLabel={t("map.pinA11y", { price: label })}
    >
      <View style={styles.wrap}>
        <View
          style={[
            styles.card,
            {
              width: PIN_W,
              borderColor: borderC,
              shadowColor: isSelected ? color.primary : "#0f172a",
            },
            isSelected && styles.cardSelected,
          ]}
        >
          <View style={[styles.imageBox, { height: IMG_H, width: PIN_W }]}>
            <Image
              source={imageSource}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
              transition={150}
              onLoadEnd={() => {
                setTracksViewChanges(true);
                setTimeout(() => setTracksViewChanges(false), 400);
              }}
            />
            <LinearGradient
              colors={["transparent", "rgba(0,0,0,0.15)", gradBottom]}
              style={StyleSheet.absoluteFill}
              pointerEvents="none"
            />
            <View style={styles.priceRow} pointerEvents="none">
              <Text style={styles.priceText} numberOfLines={1}>
                {label}
              </Text>
            </View>
          </View>
        </View>
        <View
          style={[
            styles.tail,
            {
              borderTopColor: borderC,
            },
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
  card: {
    borderRadius: RADIUS,
    borderWidth: 2.5,
    backgroundColor: "#111",
    overflow: "hidden",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  cardSelected: {
    transform: [{ scale: 1.06 }],
    shadowOpacity: 0.45,
    shadowRadius: 12,
    elevation: 12,
  },
  imageBox: {
    borderTopLeftRadius: RADIUS - 2,
    borderTopRightRadius: RADIUS - 2,
    overflow: "hidden",
  },
  priceRow: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 4,
    paddingBottom: 4,
    paddingTop: 2,
  },
  priceText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: -0.2,
    textAlign: "center",
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 0.5 },
    textShadowRadius: 1.5,
  },
  tail: {
    width: 0,
    height: 0,
    borderLeftWidth: 7,
    borderRightWidth: 7,
    borderTopWidth: 8,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    marginTop: -2,
  },
});
