import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
    Alert,
    ActivityIndicator,
    FlatList,
    Pressable,
    RefreshControl,
    StyleSheet,
    View,
} from "react-native";
import { RequestCard } from "@/components/request";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useLanguage } from "@/hooks/use-language";
import { useRequests } from "@/hooks/use-requests";
import { useUpdateRequestStatus } from "@/hooks/use-update-request-status";
import { notificationService } from "@/services/notification-service";
import { useRequestDetailStore } from "@/stores/useRequestDetailStore";
import { useNotificationStore } from "@/stores/use-notification-store";
import { useRequestListRealtimeStore } from "@/stores/use-request-list-realtime-store";
import { syncTabBadgesToStore } from "@/services/tab-badge-service";
import type { NotificationItem } from "@/types/notification";
import type { RequestResponse } from "@/types/request";

const TAB_BAR_RADIUS = 14;

type TabType = "incoming" | "outgoing";

function unreadRequestReferenceIdsFromNotifications(
  list: NotificationItem[],
): number[] {
  const ids: number[] = [];
  for (const n of list) {
    if (
      !n.read &&
      (n.type === "REQUEST_RECEIVED" ||
        n.type === "REQUEST_ACCEPTED" ||
        n.type === "REQUEST_REJECTED") &&
      n.referenceId != null
    ) {
      ids.push(n.referenceId);
    }
  }
  return [...new Set(ids)];
}

export default function RequestsScreen() {
  const params = useLocalSearchParams<{ tab?: string }>();
  const { color } = useAppTheme();
  const { t } = useLanguage();
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
  const lastNotification = useNotificationStore((s) => s.lastNotification);
  const requestListSeq = useRequestListRealtimeStore((s) => s.requestListSeq);
  const [highlightedRequestIds, setHighlightedRequestIds] = useState<number[]>(
    [],
  );

  const applyRequestTabReadAndHighlight = useCallback(async () => {
    try {
      const list = await notificationService.getMyNotifications();
      const ids = unreadRequestReferenceIdsFromNotifications(list);
      setHighlightedRequestIds(ids);
      await notificationService.markRequestTabRead();
      void syncTabBadgesToStore();
      await refetch({ silent: true });
    } catch {
      await refetch().catch(() => undefined);
      void syncTabBadgesToStore();
    }
  }, [refetch]);

  useEffect(() => {
    if (params.tab === "outgoing") setActiveTab("outgoing");
  }, [params.tab]);

  const handleOpenChat = useCallback(
    (chatRoomId: number) => {
      router.push(`/chat/${chatRoomId}`);
    },
    [router],
  );

  useFocusEffect(
    useCallback(() => {
      let active = true;
      void (async () => {
        try {
          await applyRequestTabReadAndHighlight();
          if (!active) return;
          if (
            lastNotification &&
            (lastNotification.type === "REQUEST_RECEIVED" ||
              lastNotification.type === "REQUEST_ACCEPTED" ||
              lastNotification.type === "REQUEST_REJECTED")
          ) {
            Alert.alert(lastNotification.title, lastNotification.content);
          }
        } catch {
          // tránh Uncaught (in promise) nếu API lỗi
        }
      })().catch(() => undefined);
      return () => {
        active = false;
        setHighlightedRequestIds([]);
      };
    }, [
      applyRequestTabReadAndHighlight,
      lastNotification,
      requestListSeq,
    ]),
  );

  // Only reload when needed (mount/focus + user actions). No polling interval.

  const handleAccept = useCallback(
    async (id: number) => {
      const result = await updateStatus(id, { status: "ACCEPTED" });
      if (result) {
        refetch();
        void syncTabBadgesToStore();
        // Real-time flow: when receiver ACCEPTs and chatRoom is created,
        // navigate directly into chat.
        if (result.status === "ACCEPTED" && result.chatRoom?.id) {
          router.push(`/chat/${result.chatRoom.id}`);
        }
      }
    },
    [updateStatus, refetch, router],
  );

  const handleReject = useCallback(
    async (id: number) => {
      const result = await updateStatus(id, { status: "REJECTED" });
      if (result) {
        refetch();
        void syncTabBadgesToStore();
      }
    },
    [updateStatus, refetch],
  );

  const handlePressRequest = useCallback(
    (request: RequestResponse) => {
      setHighlightedRequestIds((prev) =>
        prev.filter((id) => id !== request.id),
      );
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
        emphasizeNew={highlightedRequestIds.includes(item.id)}
      />
    ),
    [
      activeTab,
      handleAccept,
      handleReject,
      handleOpenChat,
      handlePressRequest,
      highlightedRequestIds,
      isUpdating,
    ],
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
          ? t("request.emptyIncomingTitle")
          : t("request.emptyOutgoingTitle")}
      </ThemedText>
      <ThemedText
        style={[styles.emptySubtitle, { color: color.text, opacity: 0.65 }]}
      >
        {activeTab === "incoming"
          ? t("request.emptyIncomingSub")
          : t("request.emptyOutgoingSub")}
      </ThemedText>
    </ThemedView>
  );

  return (
    <View style={styles.safeArea}>
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
              {t("request.headerTitle")}
            </ThemedText>
            <ThemedText
              style={[
                styles.headerSubtitle,
                { color: color.primaryText, opacity: 0.92 },
              ]}
            >
              {t("request.headerSubtitle")}
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
              {t("request.incomingTab", { count: incoming.length })}
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
              {t("request.outgoingTab", { count: outgoing.length })}
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
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  /** Cùng tỉ lệ header với Profile: marginTop + height + padding */
  header: {
    height: 100,
    marginTop: 40,
    justifyContent: "flex-end",
    paddingHorizontal: 20,
    paddingVertical: 20,
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
    fontSize: 24,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  headerSubtitle: {
    fontSize: 14,
    marginTop: 4,
    lineHeight: 20,
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
