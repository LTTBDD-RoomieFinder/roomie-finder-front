import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    Pressable,
    RefreshControl,
    StyleSheet,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { RequestCard } from "@/components/request";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useRequests } from "@/hooks/use-requests";
import { useUpdateRequestStatus } from "@/hooks/use-update-request-status";
import { useRequestDetailStore } from "@/stores/useRequestDetailStore";
import type { RequestResponse } from "@/types/request";

const HEADER_HEIGHT = 148;
const TAB_BAR_RADIUS = 14;

type TabType = "incoming" | "outgoing";

export default function RequestsScreen() {
  const params = useLocalSearchParams<{ tab?: string }>();
  const { color } = useAppTheme();
  const [activeTab, setActiveTab] = useState<TabType>(() =>
    params.tab === "outgoing" ? "outgoing" : "incoming",
  );
  const setRequestDetail = useRequestDetailStore((s) => s.setRequest);

  const { incoming, outgoing, isLoading, error, refetch } = useRequests();
  const {
    updateStatus,
    isLoading: isUpdating,
    error: updateError,
  } = useUpdateRequestStatus();
  const router = useRouter();

  const data = activeTab === "incoming" ? incoming : outgoing;

  useEffect(() => {
    if (params.tab === "outgoing") setActiveTab("outgoing");
  }, [params.tab]);

  const handleOpenChat = useCallback(
    (chatRoomId: number) => {
      router.push(`/chat/${chatRoomId}`);
    },
    [router],
  );

  useEffect(() => {
    refetch();
  }, [refetch]);

  const handleAccept = useCallback(
    async (id: number) => {
      const result = await updateStatus(id, { status: "ACCEPTED" });
      if (result) refetch();
    },
    [updateStatus, refetch],
  );

  const handleReject = useCallback(
    async (id: number) => {
      const result = await updateStatus(id, { status: "REJECTED" });
      if (result) refetch();
    },
    [updateStatus, refetch],
  );

  const handlePressRequest = useCallback(
    (request: RequestResponse) => {
      setRequestDetail(request, activeTab);
      router.push(`/request/${request.id}`);
    },
    [activeTab, router, setRequestDetail],
  );

  const renderItem = useCallback(
    ({ item }: { item: RequestResponse }) => (
      <RequestCard
        request={item}
        variant={activeTab}
        onAccept={activeTab === "incoming" ? handleAccept : undefined}
        onReject={activeTab === "incoming" ? handleReject : undefined}
        onOpenChat={handleOpenChat}
        onPress={handlePressRequest}
        isUpdating={isUpdating}
      />
    ),
    [activeTab, handleAccept, handleReject, handleOpenChat, handlePressRequest, isUpdating],
  );

  const keyExtractor = useCallback(
    (item: RequestResponse) => String(item.id),
    [],
  );

  const ListEmpty = () => (
    <ThemedView style={styles.emptyContainer}>
      <View
        style={[
          styles.emptyIconWrap,
          { backgroundColor: color.primary + "18" },
        ]}
      >
        <IconSymbol
          name={
            activeTab === "incoming"
              ? "tray.and.arrow.down.fill"
              : "tray.and.arrow.up.fill"
          }
          size={48}
          color={color.primary}
        />
      </View>
      <ThemedText style={[styles.emptyTitle, { color: color.text }]}>
        {activeTab === "incoming"
          ? "Chưa có lời mời nào"
          : "Bạn chưa gửi lời mời nào"}
      </ThemedText>
      <ThemedText
        style={[styles.emptySubtitle, { color: color.text, opacity: 0.65 }]}
      >
        {activeTab === "incoming"
          ? "Khi ai đó gửi lời mời kết bạn phòng cho bạn, chúng sẽ xuất hiện tại đây."
          : "Các lời mời bạn đã gửi sẽ hiển thị ở đây."}
      </ThemedText>
    </ThemedView>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={[styles.header, { backgroundColor: color.primary }]}>
        <View style={styles.headerContent}>
          <View
            style={[
              styles.headerIconWrap,
              { backgroundColor: "rgba(255,255,255,0.2)" },
            ]}
          >
            <IconSymbol
              name="envelope.fill"
              size={28}
              color={color.primaryText}
            />
          </View>
          <View style={styles.headerTextWrap}>
            <ThemedText
              style={[styles.headerTitle, { color: color.primaryText }]}
            >
              Lời mời kết bạn phòng
            </ThemedText>
            <ThemedText
              style={[
                styles.headerSubtitle,
                { color: color.primaryText, opacity: 0.92 },
              ]}
            >
              Chấp nhận để tạo phòng chat riêng, thảo luận giá cả & nội quy
            </ThemedText>
          </View>
        </View>
      </View>

      <ThemedView
        style={[styles.content, { backgroundColor: color.background }]}
      >
        <View
          style={[
            styles.tabBar,
            {
              backgroundColor: color.border + "28",
              borderRadius: TAB_BAR_RADIUS,
            },
          ]}
        >
          <Pressable
            style={[
              styles.tab,
              activeTab === "incoming" && styles.tabActive,
              activeTab === "incoming" && {
                backgroundColor: color.background,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.06,
                shadowRadius: 3,
                elevation: 2,
              },
            ]}
            onPress={() => setActiveTab("incoming")}
          >
            <IconSymbol
              name="tray.and.arrow.down.fill"
              size={18}
              color={activeTab === "incoming" ? color.primary : color.icon}
            />
            <ThemedText
              style={[
                styles.tabLabel,
                {
                  color: activeTab === "incoming" ? color.primary : color.icon,
                },
              ]}
            >
              Nhận được ({incoming.length})
            </ThemedText>
          </Pressable>
          <Pressable
            style={[
              styles.tab,
              activeTab === "outgoing" && styles.tabActive,
              activeTab === "outgoing" && {
                backgroundColor: color.background,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.06,
                shadowRadius: 3,
                elevation: 2,
              },
            ]}
            onPress={() => setActiveTab("outgoing")}
          >
            <IconSymbol
              name="tray.and.arrow.up.fill"
              size={18}
              color={activeTab === "outgoing" ? color.primary : color.icon}
            />
            <ThemedText
              style={[
                styles.tabLabel,
                {
                  color: activeTab === "outgoing" ? color.primary : color.icon,
                },
              ]}
            >
              Đã gửi ({outgoing.length})
            </ThemedText>
          </Pressable>
        </View>

        {(error || updateError) && (
          <ThemedView
            style={[
              styles.errorBanner,
              { backgroundColor: color.error + "20" },
            ]}
          >
            <ThemedText style={[styles.errorText, { color: color.error }]}>
              {error || updateError}
            </ThemedText>
          </ThemedView>
        )}

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={color.primary} />
          </View>
        ) : (
          <FlatList
            data={data}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={ListEmpty}
            refreshControl={
              <RefreshControl
                refreshing={isLoading}
                onRefresh={refetch}
                tintColor={color.primary}
              />
            }
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
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  tabBar: {
    flexDirection: "row",
    padding: 5,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 10,
  },
  tabActive: {},
  tabLabel: {
    fontSize: 14,
    fontWeight: "600",
  },
  errorBanner: {
    padding: 14,
    borderRadius: 12,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 14,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  listContent: {
    paddingBottom: 40,
  },
  emptyContainer: {
    paddingVertical: 56,
    alignItems: "center",
    paddingHorizontal: 24,
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
