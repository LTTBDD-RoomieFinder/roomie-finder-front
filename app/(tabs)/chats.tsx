import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect } from "react";
import {
  Alert,
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ChatRoomItem } from "@/components/chat";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useChatRooms } from "@/hooks/use-chat-rooms";
import { syncTabBadgesToStore } from "@/services/tab-badge-service";
import { useChatRoomListRealtimeStore } from "@/stores/use-chat-room-list-realtime-store";
import { useNotificationStore } from "@/stores/use-notification-store";
import type { ChatRoomItem as ChatRoomItemType } from "@/types/chat";

const HEADER_HEIGHT = 130;

export default function ChatsScreen() {
  const { color } = useAppTheme();
  const router = useRouter();
  const { rooms, isLoading, error, refetch } = useChatRooms();
  const messageSeq = useNotificationStore((s) => s.messageSeq);
  const lastNotification = useNotificationStore((s) => s.lastNotification);
  const roomListMessageSeq = useChatRoomListRealtimeStore(
    (s) => s.roomListMessageSeq,
  );

  useFocusEffect(
    useCallback(() => {
      refetch().catch(() => undefined);
      void syncTabBadgesToStore();
      if (lastNotification?.type === "NEW_MESSAGE") {
        Alert.alert(lastNotification.title, lastNotification.content);
      }
    }, [refetch, messageSeq, lastNotification]),
  );

  // Realtime danh sách: STOMP đăng ký ở root (`useGlobalChatBadgeRealtime`);
  // khi có tin, store tăng seq → refetch silent tại đây.
  useEffect(() => {
    if (roomListMessageSeq === 0) return;
    refetch({ silent: true }).catch(() => undefined);
  }, [roomListMessageSeq, refetch]);

  const handlePress = useCallback(
    (id: number) => {
      router.push(`/chat/${id}`);
    },
    [router],
  );

  const renderItem = useCallback(
    ({ item }: { item: ChatRoomItemType }) => (
      <ChatRoomItem room={item} onPress={handlePress} />
    ),
    [handlePress],
  );

  const keyExtractor = useCallback(
    (item: ChatRoomItemType) => String(item.id),
    [],
  );

  const ListEmpty = () => (
    <ThemedView style={styles.emptyContainer}>
      <View style={[styles.emptyIconWrap, { backgroundColor: color.primary + "18" }]}>
        <IconSymbol
          name="bubble.left.and.bubble.right.fill"
          size={48}
          color={color.primary}
        />
      </View>
      <ThemedText style={[styles.emptyTitle, { color: color.text }]}>
        Chưa có phòng chat nào
      </ThemedText>
      <ThemedText style={[styles.emptySubtitle, { color: color.text, opacity: 0.65 }]}>
        Chấp nhận lời mời kết bạn phòng để tạo phòng chat riêng tư.
      </ThemedText>
    </ThemedView>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={[styles.header, { backgroundColor: color.primary }]}>
        <View style={styles.headerContent}>
          <View
            style={[styles.headerIconWrap, { backgroundColor: "rgba(255,255,255,0.2)" }]}
          >
            <IconSymbol
              name="bubble.left.and.bubble.right.fill"
              size={28}
              color={color.primaryText}
            />
          </View>
          <View style={styles.headerTextWrap}>
            <ThemedText style={[styles.headerTitle, { color: color.primaryText }]}>
              Tin nhắn
            </ThemedText>
            <ThemedText
              style={[styles.headerSubtitle, { color: color.primaryText, opacity: 0.9 }]}
            >
              Các phòng chat riêng tư của bạn
            </ThemedText>
          </View>
        </View>
      </View>

      <ThemedView style={[styles.content, { backgroundColor: color.background }]}>
        {error && (
          <ThemedView
            style={[styles.errorBanner, { backgroundColor: color.error + "20" }]}
          >
            <ThemedText style={[styles.errorText, { color: color.error }]}>
              {error}
            </ThemedText>
          </ThemedView>
        )}

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={color.primary} />
          </View>
        ) : (
          <FlatList
            data={rooms}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            ListEmptyComponent={ListEmpty}
            refreshControl={
              <RefreshControl
                refreshing={isLoading}
                onRefresh={() => refetch()}
                tintColor={color.primary}
              />
            }
            contentContainerStyle={styles.listContent}
          />
        )}
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: {
    height: HEADER_HEIGHT,
    justifyContent: "flex-end",
    paddingHorizontal: 20,
    paddingBottom: 20,
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
    fontSize: 22,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  headerSubtitle: {
    fontSize: 13,
    marginTop: 4,
    lineHeight: 19,
  },
  content: { flex: 1 },
  errorBanner: {
    margin: 16,
    padding: 14,
    borderRadius: 12,
  },
  errorText: { fontSize: 14 },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  listContent: {
    flexGrow: 1,
    paddingBottom: 32,
  },
  emptyContainer: {
    paddingTop: 80,
    alignItems: "center",
    paddingHorizontal: 32,
  },
  emptyIconWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 20,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 14,
    marginTop: 10,
    textAlign: "center",
    lineHeight: 21,
  },
});
