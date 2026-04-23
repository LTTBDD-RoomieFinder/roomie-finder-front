import React, { memo, useCallback, useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Marker } from "react-native-maps";
import { Image } from "expo-image";

import type { MapPinGeoItem } from "@/data/response";
import { useAppTheme } from "@/hooks/use-app-theme";
import type { LocaleCode } from "@/lib/i18n-core";
import type { TranslateFn } from "@/utils/format-room";

const PIN_SIZE = 44;
const PIN_RADIUS = 12;

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

  /**
   * Custom marker + remote image: `tracksViewChanges={false}` often chụp bitmap
   * trước khi ảnh tải → chấm “biến mất”. Bật tạm sau khi đổi pin/ảnh rồi tắt.
   */
  const [tracksViewChanges, setTracksViewChanges] = useState(true);
  useEffect(() => {
    setTracksViewChanges(true);
    const t = setTimeout(() => setTracksViewChanges(false), 900);
    return () => clearTimeout(t);
  }, [pin.id, pin.thumbnailUrl]);

  const handlePress = useCallback(() => onPress(pin), [onPress, pin]);

  const imageSource = pin.thumbnailUrl?.trim()
    ? { uri: pin.thumbnailUrl.trim() }
    : require("@/assets/images/placeholder.png");

  return (
    <Marker
      coordinate={{ latitude: pin.lat, longitude: pin.lng }}
      tracksViewChanges={tracksViewChanges || isSelected}
      onPress={handlePress}
      anchor={{ x: 0.5, y: 1 }}
      zIndex={isSelected ? 999 : 1}
    >
      <View style={styles.wrap}>
        <View
          style={[
            styles.card,
            isSelected ? styles.cardSelected : null,
            {
              borderColor: isSelected ? color.primary : "#ffffff",
              shadowColor: isSelected ? color.primary : "#000",
            },
          ]}
        >
          <Image
            source={imageSource}
            style={styles.pinPhoto}
            contentFit="cover"
            transition={150}
            onLoadEnd={() => {
              setTracksViewChanges(true);
              setTimeout(() => setTracksViewChanges(false), 400);
            }}
          />
          <View
            style={[
              styles.pricePill,
              {
                backgroundColor: isSelected ? color.primary : "rgba(0,0,0,0.78)",
              },
            ]}
          >
            <Text style={styles.priceText} numberOfLines={1}>
              {label}
            </Text>
          </View>
        </View>
        <View
          style={[
            styles.tail,
            {
              borderTopColor: isSelected ? color.primary : "#fff",
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
    width: PIN_SIZE,
    borderRadius: PIN_RADIUS,
    borderWidth: 2,
    backgroundColor: "#fff",
    overflow: "hidden",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 5,
    elevation: 6,
  },
  cardSelected: {
    transform: [{ scale: 1.08 }],
    shadowOpacity: 0.45,
    shadowRadius: 8,
    elevation: 10,
  },
  pinPhoto: {
    width: PIN_SIZE,
    height: PIN_SIZE,
    backgroundColor: "#e8e8e8",
  },
  pricePill: {
    width: PIN_SIZE,
    paddingHorizontal: 6,
    paddingVertical: 5,
    alignItems: "center",
    justifyContent: "center",
  },
  priceText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: -0.2,
  },
  tail: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 7,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    marginTop: -2,
  },
});
