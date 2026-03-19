import { Image } from "expo-image";
import React from "react";
import { Platform, Pressable, StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useAppTheme } from "@/hooks/use-app-theme";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { RoomResponse } from "@/data/response";
import { formatRoomAddress, formatRoomPrice } from "@/utils/format-room";
import { GENDER_REQ_LABELS, ROOM_TYPE_LABELS } from "@/constants/room-constants";
import { RoomType, GenderRequirement } from "@/types/enums";

type RoomCardProps = {
  room: RoomResponse;
  onPress?: () => void;
};

export function RoomCard({ room, onPress }: RoomCardProps) {
  const { color } = useAppTheme();

  const image = room.imageUrls?.[0];

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.card,
        {
          backgroundColor: color.background,
        },
      ]}
    >
      {/* IMAGE */}
      <View style={styles.imageWrapper}>
        <Image source={{ uri: image }} style={styles.thumbnail} contentFit="cover" />

        {/* PRICE BADGE */}
        <View style={[styles.priceBadge, { backgroundColor: color.primary }]}>
          <ThemedText style={[styles.priceText, { color: color.primaryText }]}>
            {formatRoomPrice(room.price)}
          </ThemedText>
        </View>

        {/* ROOM TYPE */}
        <View style={[styles.typeBadge]}>
          <ThemedText style={styles.typeText}>
            {ROOM_TYPE_LABELS[room.roomType as RoomType]}
          </ThemedText>
        </View>
      </View>

      {/* CONTENT */}
      <View style={styles.content}>
        {/* TITLE */}
        <ThemedText type="defaultSemiBold" numberOfLines={1} style={styles.titleText}>
          {room.title}
        </ThemedText>

        {/* ADDRESS */}
        <View style={styles.row}>
          <MaterialIcons name="location-on" size={14} color={color.icon} />
          <ThemedText numberOfLines={1} style={[styles.metaText, { flex: 1 }]}>
            {formatRoomAddress(room.address)}
          </ThemedText>
        </View>

        {/* INFO GRIDS */}
        <View style={styles.infoGrid}>
          <View style={[styles.infoPill, { backgroundColor: color.card }]}>
            <MaterialIcons name="square-foot" size={14} color={color.icon} />
            <ThemedText style={styles.pillText}>{room.area} m²</ThemedText>
          </View>

          <View style={[styles.infoPill, { backgroundColor: color.card }]}>
            <MaterialIcons name="groups" size={14} color={color.icon} />
            <ThemedText style={styles.pillText}>
              {room.capacity}
            </ThemedText>
          </View>

          <View style={[styles.infoPill, { backgroundColor: color.card }]}>
            <MaterialIcons name="person" size={14} color={color.icon} />
            <ThemedText style={styles.pillText}>
              {GENDER_REQ_LABELS[room.genderRequirement as GenderRequirement]}
            </ThemedText>
          </View>
        </View>

        {/* AMENITIES */}
        <View style={styles.amenities}>
          {room.amenities?.slice(0, 4).map((a) => (
            <View
              key={a.id}
              style={[styles.amenityBadge, { borderColor: color.border, backgroundColor: color.card }]}
            >
              <ThemedText style={styles.amenityText}>
                {a.name}
              </ThemedText>
            </View>
          ))}
          {(room.amenities?.length || 0) > 4 && (
            <View style={[styles.amenityBadge, { borderColor: color.border, backgroundColor: color.card }]}>
              <ThemedText style={styles.amenityText}>+{(room.amenities?.length || 0) - 4}</ThemedText>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    borderCurve: "continuous",
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.08,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 6 },
      },
      android: {
        elevation: 2,
      },
      default: {},
    }),
  },

  imageWrapper: {
    position: "relative",
  },

  thumbnail: {
    width: "100%",
    height: 190,
  },

  priceBadge: {
    position: "absolute",
    bottom: 12,
    left: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderCurve: "continuous",
  },

  priceText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },

  typeBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    borderCurve: "continuous",
    backgroundColor: "rgba(0, 0, 0, 0.6)",
  },

  typeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },

  content: {
    padding: 14,
    gap: 10,
  },
  
  titleText: {
    fontSize: 17,
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  metaText: {
    opacity: 0.7,
    fontSize: 13,
  },

  infoGrid: {
    flexDirection: "row",
    gap: 8,
  },

  infoPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderCurve: "continuous",
  },

  pillText: {
    fontSize: 13,
    fontWeight: "500",
  },

  amenities: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 2,
  },

  amenityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderCurve: "continuous",
  },

  amenityText: {
    fontSize: 11,
    opacity: 0.8,
  },
});