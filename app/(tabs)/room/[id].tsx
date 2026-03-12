import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  Alert,
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { RoomResponse } from "@/data/response";
import { useAppTheme } from "@/hooks/use-app-theme";
import { roomService } from "@/services/room-service";
import { formatRoomAddress, formatRoomPrice } from "@/utils/format-room";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Image } from "expo-image";
import { GENDER_REQ_LABELS, ROOM_TYPE_LABELS } from "@/constants/room-constants";
import { GenderRequirement, RoomType } from "@/types/enums";
import { BlurView } from "expo-blur";

const { width } = Dimensions.get("window");

export default function RoomDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { color } = useAppTheme();

  const [room, setRoom] = useState<RoomResponse | null>(null);
  const [loading, setLoading] = useState(false);

  useFocusEffect(
    useCallback(() => {
      fetchRoom();
    }, [id])
  );

  const fetchRoom = async () => {
    setLoading(true);
    try {
      const res = await roomService.getRoomById(Number(id));
      setRoom(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert("Xóa phòng", "Bạn có chắc muốn xóa phòng này không? Hành động này không thể hoàn tác.", [
      { text: "Hủy", style: "cancel" },
      {
        text: "Xóa",
        style: "destructive",
        onPress: async () => {
          try {
            await roomService.deleteRoom(Number(id));
            router.back();
          } catch (e) {
            console.error(e);
          }
        },
      },
    ]);
  };

  if (!room) return null;

  return (
    <ThemedView style={styles.root}>
      <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
        {/* IMAGE CAROUSEL */}
        <View style={styles.imageContainer}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
          >
            {room.imageUrls.map((img, index) => (
              <Image
                key={index}
                source={{ uri: img }}
                style={styles.image}
                contentFit="cover"
              />
            ))}
          </ScrollView>

          {/* FLOATING HEADER CONTROLS */}
          <View style={styles.header}>
            <Pressable onPress={() => router.back()} style={styles.iconBtn}>
              <View style={styles.glassBtn}>
                <MaterialIcons name="arrow-back" size={24} color="#fff" />
              </View>
            </Pressable>

            <View style={styles.headerRight}>
              <Pressable
                onPress={() =>
                  router.push({
                    pathname: "/(tabs)/room/edit",
                    params: { id: room.id },
                  })
                }
                style={styles.iconBtn}
              >
                <View style={styles.glassBtn}>
                  <MaterialIcons name="edit" size={24} color="#fff" />
                </View>
              </Pressable>

              <Pressable onPress={handleDelete} style={styles.iconBtn}>
                <View style={styles.glassBtn}>
                  <MaterialIcons name="delete" size={24} color="#ff4444" />
                </View>
              </Pressable>
            </View>
          </View>
        </View>

        {/* CONTENT */}
        <View style={styles.content}>
          
          <View style={styles.titleSection}>
            <ThemedText type="title" style={styles.title}>{room.title}</ThemedText>
            <ThemedText style={[styles.price, { color: color.primary }]}>
              {formatRoomPrice(room.price)}
            </ThemedText>
          </View>

          {/* ADDRESS */}
          <View style={styles.row}>
            <MaterialIcons name="location-on" size={20} color={color.icon} />
            <ThemedText style={styles.addressText}>{formatRoomAddress(room.address)}</ThemedText>
          </View>

          {/* INFO GRIDS */}
          <View style={styles.infoGrid}>
            <View style={[styles.infoCard, { backgroundColor: color.card }]}>
              <MaterialIcons name="square-foot" size={24} color={color.primary} />
              <ThemedText style={styles.infoTitle}>Diện tích</ThemedText>
              <ThemedText style={styles.infoValue}>{room.area} m²</ThemedText>
            </View>

            <View style={[styles.infoCard, { backgroundColor: color.card }]}>
              <MaterialIcons name="groups" size={24} color={color.primary} />
              <ThemedText style={styles.infoTitle}>Sức chứa</ThemedText>
              <ThemedText style={styles.infoValue}>{room.capacity} người</ThemedText>
            </View>

            <View style={[styles.infoCard, { backgroundColor: color.card }]}>
              <MaterialIcons name="home" size={24} color={color.primary} />
              <ThemedText style={styles.infoTitle}>Loại phòng</ThemedText>
              <ThemedText style={styles.infoValue}>
                {ROOM_TYPE_LABELS[room.roomType as RoomType]}
              </ThemedText>
            </View>
          </View>
          
          {/* DESCRIPTION */}
          <View style={styles.section}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>Mô tả chi tiết</ThemedText>
            <ThemedText style={styles.descriptionText}>{room.description}</ThemedText>
          </View>

          {/* GENDER */}
          <View style={styles.section}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>Yêu cầu người ở</ThemedText>
            <View style={[styles.pill, { backgroundColor: color.card }]}>
              <MaterialIcons name="person" size={20} color={color.icon} />
              <ThemedText style={styles.pillText}>
                {GENDER_REQ_LABELS[room.genderRequirement as GenderRequirement]}
              </ThemedText>
            </View>
          </View>

          {/* AMENITIES */}
          <View style={styles.section}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>Tiện ích nổi bật</ThemedText>
            <View style={styles.amenities}>
              {room.amenities.map((a) => (
                <View
                  key={a.id}
                  style={[styles.amenity, { backgroundColor: color.card, borderColor: color.border }]}
                >
                  <ThemedText style={styles.amenityText}>{a.name}</ThemedText>
                </View>
              ))}
            </View>
          </View>

          {/* BOTTOM SPACING */}
          <View style={styles.bottomSpacer} />
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },

  imageContainer: {
    position: "relative",
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    overflow: "hidden",
    boxShadow: "0px 8px 16px rgba(0,0,0,0.1)",
    zIndex: 1,
  },

  image: {
    width: width,
    height: 380,
  },

  header: {
    position: "absolute",
    top: 55,
    left: 20,
    right: 20,
    flexDirection: "row",
    justifyContent: "space-between",
  },

  headerRight: {
    flexDirection: "row",
    gap: 12,
  },

  iconBtn: {
    borderRadius: 22,
    overflow: "hidden",
  },

  glassBtn: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0, 0, 0, 0.4)",
  },

  content: {
    padding: 24,
    gap: 24,
  },

  titleSection: {
    gap: 8,
  },

  title: {
    fontSize: 26,
    lineHeight: 34,
  },

  price: {
    fontSize: 24,
    fontWeight: "800",
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: -8,
  },

  addressText: {
    flex: 1,
    fontSize: 16,
    opacity: 0.8,
    lineHeight: 22,
  },

  infoGrid: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },

  infoCard: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderCurve: "continuous",
    alignItems: "center",
    gap: 6,
  },

  infoTitle: {
    fontSize: 12,
    opacity: 0.6,
    marginTop: 4,
  },

  infoValue: {
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center",
  },

  section: {
    gap: 12,
  },

  sectionTitle: {
    fontSize: 20,
  },

  descriptionText: {
    fontSize: 16,
    lineHeight: 26,
    opacity: 0.8,
  },

  pill: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderCurve: "continuous",
    gap: 8,
  },

  pillText: {
    fontSize: 15,
    fontWeight: "600",
  },

  amenities: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },

  amenity: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    borderCurve: "continuous",
    borderWidth: 1,
  },

  amenityText: {
    fontSize: 14,
    fontWeight: "500",
  },

  bottomSpacer: {
    height: 40,
  }
});