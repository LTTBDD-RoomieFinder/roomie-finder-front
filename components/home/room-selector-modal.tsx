import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Modal, Pressable, StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { RoomResponse } from "@/data/response";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useLanguage } from "@/hooks/use-language";
import { roomService } from "@/services/room-service";

type Props = {
  visible: boolean;
  onClose: () => void;
  onSelectRoom: (room: RoomResponse) => void;
};

export function RoomSelectorModal({ visible, onClose, onSelectRoom }: Props) {
  const { color } = useAppTheme();
  const { t, locale } = useLanguage();
  const [rooms, setRooms] = useState<RoomResponse[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      fetchRooms();
    }
  }, [visible]);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      // We only want to select rooms the current user owns
      const res = await roomService.getMyRooms();
      setRooms(res.data as RoomResponse[]);
    } catch (error) {
      console.error("Failed to fetch user rooms", error);
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }: { item: RoomResponse }) => {
    return (
      <Pressable
        style={({ pressed }) => [
          styles.roomItem,
          { backgroundColor: pressed ? color.backgroundSecondary : color.background },
          { borderBottomColor: color.border },
        ]}
        onPress={() => onSelectRoom(item)}
      >
        <Image
          source={
            item.imageUrls?.[0]
              ? { uri: item.imageUrls[0] }
              : require("@/assets/images/placeholder.png")
          }
          style={styles.roomImage}
          contentFit="cover"
        />
        <View style={styles.roomDetails}>
          <ThemedText type="defaultSemiBold" numberOfLines={1}>
            {item.title}
          </ThemedText>
          <ThemedText style={{ color: color.textSecondary, marginTop: 4 }}>
            {t("room.metaVndMo", {
              price: item.price.toLocaleString(locale === "vi" ? "vi-VN" : "en-US"),
              area: item.area,
            })}
          </ThemedText>
        </View>
        <Ionicons name="chevron-forward" size={20} color={color.textSecondary} />
      </Pressable>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <ThemedView style={styles.container}>
        <View style={[styles.header, { borderBottomColor: color.border }]}>
          <Pressable onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={color.text} />
          </Pressable>
          <ThemedText type="subtitle" style={styles.headerTitle}>
            {t("room.selectorTitle")}
          </ThemedText>
          <View style={{ width: 40 }} />
        </View>

        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={color.tint} />
          </View>
        ) : rooms.length === 0 ? (
          <View style={styles.centerContainer}>
            <Ionicons name="home-outline" size={48} color={color.textSecondary} />
            <ThemedText style={{ color: color.textSecondary, marginTop: 16 }}>
              {t("room.selectorEmpty")}
            </ThemedText>
          </View>
        ) : (
          <FlatList
            data={rooms}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
          />
        )}
      </ThemedView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 8,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  closeButton: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
  },
  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  listContent: {
    paddingBottom: 24,
  },
  roomItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
  },
  roomImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  roomDetails: {
    flex: 1,
  },
});
