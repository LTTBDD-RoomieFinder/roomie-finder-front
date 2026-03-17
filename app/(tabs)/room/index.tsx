import { RoomCard } from "@/components/room/room-card";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { RoomResponse } from "@/data/response";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useRefresh } from "@/hooks/use-refresh";
import { roomService } from "@/services/room-service";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import { FlatList, Pressable, StyleSheet, View } from "react-native";

export default function RoomListScreen() {
  const router = useRouter();
  const { color } = useAppTheme();
  const [rooms, setRooms] = useState<RoomResponse[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchRooms = useCallback(async () => {
    setLoading(true);
    try {
      const res = await roomService.getMyRooms();
      setRooms(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  const { refreshing, onRefresh } = useRefresh(fetchRooms);

  // call service get list room
  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  return (
    <ThemedView style={styles.root}>
      <View style={styles.header}>
        <ThemedText type="title" style={styles.headerTitle}>Quản lý phòng</ThemedText>
        <Pressable
          onPress={() => router.push("/(tabs)/room/new")}
          style={[
            styles.addButton,
            {
              backgroundColor: color.primary,
            },
          ]}
        >
          <MaterialIcons name="add" size={18} color={color.primaryText} />
          <ThemedText type="defaultSemiBold" style={{ color: color.primaryText, fontSize: 13 }}>
            Thêm mới
          </ThemedText>
        </Pressable>
      </View>

      <FlatList
        data={rooms}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshing={refreshing}
        onRefresh={onRefresh}
        ListEmptyComponent={
          <View
            style={[
              styles.emptyBox,
              {
                backgroundColor: color.card,
              },
            ]}
          >
            <MaterialIcons name="maps-home-work" size={48} color={color.placeholder} />
            <ThemedText type="defaultSemiBold" style={styles.emptyTitle}>Chưa có phòng nào</ThemedText>
            <ThemedText style={styles.emptyDesc}>
              Bắt đầu hành trình cho thuê của bạn bằng cách đăng phòng đầu tiên.
            </ThemedText>
            <Pressable
              onPress={() => router.push("/(tabs)/room/new")}
              style={[
                styles.emptyButton,
                { backgroundColor: color.primary }
              ]}
            >
              <ThemedText type="defaultSemiBold" style={{ color: color.primaryText }}>Thêm phòng ngay</ThemedText>
            </Pressable>
          </View>
        }
        renderItem={({ item }) => (
          <RoomCard
            room={item}
            onPress={() =>
              router.push({
                pathname: "/(tabs)/room/[id]",
                params: { id: item.id, from: 'room' },
              })
            }
          />
        )}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    paddingTop: 65,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 28,
  },
  addButton: {
    borderRadius: 20,
    borderCurve: "continuous",
    paddingHorizontal: 14,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    boxShadow: "0px 2px 8px rgba(0, 0, 0, 0.1)",
  },
  listContent: {
    gap: 16,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 24,
  },
  emptyBox: {
    borderRadius: 24,
    padding: 32,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
    gap: 8,
    borderCurve: "continuous",
  },
  emptyTitle: {
    fontSize: 18,
    marginTop: 8,
  },
  emptyDesc: {
    textAlign: "center",
    opacity: 0.7,
    marginBottom: 16,
    lineHeight: 22,
  },
  emptyButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 16,
    borderCurve: "continuous",
  }
});
