import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { IconSymbol } from "@/components/ui/icon-symbol";
import {
  REQUEST_REJECT_COOLDOWN_DAYS,
  REQUEST_STATUS_COLOR,
  REQUEST_STATUS_LABEL,
} from "@/constants/request";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useUpdateRequestStatus } from "@/hooks/use-update-request-status";
import { useRequestDetailStore } from "@/stores/useRequestDetailStore";
import type { RequestResponse, RequestStatus } from "@/types/request";
import { formatDateLongVi } from "@/utils/format-date";

export default function RequestDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { color } = useAppTheme();
  const { request, variant: storedVariant, setRequest } = useRequestDetailStore();
  const { updateStatus, isLoading: isUpdating, error: updateError } = useUpdateRequestStatus();

  const requestId = id ? Number(id) : NaN;

  useEffect(() => {
    return () => {
      setRequest(null);
    };
  }, [setRequest]);

  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  const handleAccept = useCallback(async () => {
    if (!request || request.id !== requestId) return;
    const result = await updateStatus(request.id, { status: "ACCEPTED" });
    if (result) {
      setRequest(result, storedVariant);
    }
  }, [request, requestId, storedVariant, updateStatus, setRequest]);

  const handleReject = useCallback(async () => {
    if (!request || request.id !== requestId) return;
    const result = await updateStatus(request.id, { status: "REJECTED" });
    if (result) {
      setRequest(result, storedVariant);
    }
  }, [request, requestId, storedVariant, updateStatus, setRequest]);

  const handleOpenChat = useCallback(() => {
    if (request?.status === "ACCEPTED" && request.chatRoom) {
      router.push(`/chat/${request.chatRoom.id}`);
    }
  }, [request, router]);

  if (!request || request.id !== requestId) {
    return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <ThemedView style={styles.container}>
          <View style={[styles.header, { borderBottomColor: color.border + "60" }]}>
            <Pressable onPress={handleBack} style={styles.backButton} hitSlop={12}>
              <IconSymbol name="chevron.left" size={24} color={color.primary} />
            </Pressable>
            <ThemedText style={styles.headerTitle}>Lời mời</ThemedText>
          </View>
          <View style={styles.centered}>
            <View style={[styles.notFoundIcon, { backgroundColor: color.primary + "15" }]}>
              <IconSymbol name="questionmark.circle" size={40} color={color.primary} />
            </View>
            <ThemedText style={[styles.notFoundTitle, { color: color.text }]}>
              Không tìm thấy lời mời
            </ThemedText>
            <ThemedText style={[styles.notFoundSub, { color: color.text, opacity: 0.6 }]}>
              Vui lòng mở lại từ danh sách lời mời.
            </ThemedText>
          </View>
        </ThemedView>
      </SafeAreaView>
    );
  }

  const variant: "incoming" | "outgoing" = storedVariant ?? "outgoing";
  const otherUser = variant === "incoming" ? request.sender : request.receiver;
  const displayName = otherUser?.fullName || otherUser?.username || "Người dùng";
  const statusColor = REQUEST_STATUS_COLOR[request.status];
  const canRespond =
    variant === "incoming" &&
    request.status === "PENDING";
  const showCooldownHint =
    variant === "outgoing" && request.status === "REJECTED";

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ThemedView style={[styles.container, { backgroundColor: color.background }]}>
        <View style={[styles.header, { borderBottomColor: color.border + "60" }]}>
          <Pressable onPress={handleBack} style={styles.backButton} hitSlop={12}>
            <IconSymbol name="chevron.left" size={24} color={color.primary} />
          </Pressable>
          <ThemedText style={styles.headerTitle}>Chi tiết lời mời</ThemedText>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Thẻ thông tin người dùng */}
          <View style={[styles.userCard, { backgroundColor: color.primary + "10", borderColor: color.primary + "25" }]}>
            <View style={[styles.avatarWrap, { backgroundColor: color.primary + "20" }]}>
              <IconSymbol name="person.fill" size={30} color={color.primary} />
            </View>
            <View style={styles.userInfo}>
              <ThemedText style={styles.displayName}>{displayName}</ThemedText>
              {otherUser?.email ? (
                <ThemedText style={[styles.userEmail, { color: color.text, opacity: 0.6 }]}>
                  {otherUser.email}
                </ThemedText>
              ) : null}
            </View>
          </View>

          {/* Thẻ chi tiết */}
          <View
            style={[
              styles.card,
              {
                borderLeftColor: statusColor,
                borderLeftWidth: 4,
                backgroundColor: color.background,
                borderWidth: 1,
                borderColor: color.border + "40",
              },
            ]}
          >
            {/* Trạng thái & thời gian */}
            <View style={styles.metaRow}>
              <View style={[styles.statusBadge, { backgroundColor: statusColor + "1a" }]}>
                <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                <ThemedText style={[styles.statusText, { color: statusColor }]}>
                  {REQUEST_STATUS_LABEL[request.status]}
                </ThemedText>
              </View>
              <ThemedText style={[styles.date, { color: color.text, opacity: 0.6 }]}>
                {formatDateLongVi(request.createdAt)}
              </ThemedText>
            </View>

            {/* Loại lời mời */}
            <View style={[styles.typeRow, { borderTopColor: color.border + "40" }]}>
              <IconSymbol
                name={variant === "incoming" ? "tray.and.arrow.down.fill" : "tray.and.arrow.up.fill"}
                size={16}
                color={color.text}
              />
              <ThemedText style={[styles.typeLabel, { color: color.text, opacity: 0.7 }]}>
                {variant === "incoming" ? "Lời mời nhận được" : "Lời mời đã gửi"}
              </ThemedText>
            </View>

            {/* Tin nhắn */}
            {request.message ? (
              <View style={[styles.messageBlock, { borderTopColor: color.border + "40" }]}>
                <ThemedText style={[styles.messageLabel, { color: color.text, opacity: 0.5 }]}>
                  LỜI NHẮN
                </ThemedText>
                <ThemedText style={[styles.message, { color: color.text }]}>
                  {request.message}
                </ThemedText>
              </View>
            ) : null}

            {/* Gợi ý cooldown */}
            {showCooldownHint && (
              <View style={[styles.hintBlock, { backgroundColor: "#d9770615", borderTopColor: color.border + "40" }]}>
                <IconSymbol name="clock.fill" size={15} color="#d97706" />
                <ThemedText style={styles.hint}>
                  Bạn có thể gửi lại sau {REQUEST_REJECT_COOLDOWN_DAYS} ngày
                </ThemedText>
              </View>
            )}

            {/* Chat room đã tạo */}
            {request.status === "ACCEPTED" && request.chatRoom && (
              <View style={[styles.chatBlock, { borderTopColor: color.border + "40" }]}>
                <View style={styles.successRow}>
                  <IconSymbol name="checkmark.seal.fill" size={18} color="#16a34a" />
                  <ThemedText style={styles.successHint}>
                    Phòng chat đã được tạo — nhắn tin để thảo luận giá cả và nội quy nhà.
                  </ThemedText>
                </View>
                <Pressable
                  style={[styles.openChatButton, { backgroundColor: color.primary }]}
                  onPress={handleOpenChat}
                >
                  <IconSymbol
                    name="bubble.left.and.bubble.right.fill"
                    size={18}
                    color={color.primaryText}
                  />
                  <ThemedText style={[styles.openChatLabel, { color: color.primaryText }]}>
                    Mở chat
                  </ThemedText>
                </Pressable>
              </View>
            )}
          </View>

          {updateError ? (
            <View style={[styles.errorBlock, { backgroundColor: color.error + "15" }]}>
              <ThemedText style={[styles.error, { color: color.error }]}>{updateError}</ThemedText>
            </View>
          ) : null}

          {canRespond && (
            <View style={styles.actions}>
              <Pressable
                style={[styles.actionButton, { backgroundColor: color.primary }]}
                onPress={handleAccept}
                disabled={isUpdating}
              >
                {isUpdating ? (
                  <ActivityIndicator color={color.primaryText} size="small" />
                ) : (
                  <>
                    <IconSymbol name="checkmark.circle.fill" size={20} color={color.primaryText} />
                    <ThemedText style={[styles.actionLabel, { color: color.primaryText }]}>
                      Chấp nhận
                    </ThemedText>
                  </>
                )}
              </Pressable>
              <Pressable
                style={[styles.actionButton, { backgroundColor: color.error + "15", borderWidth: 1.5, borderColor: color.error }]}
                onPress={handleReject}
                disabled={isUpdating}
              >
                <IconSymbol name="xmark.circle.fill" size={20} color={color.error} />
                <ThemedText style={[styles.actionLabel, { color: color.error }]}>Từ chối</ThemedText>
              </Pressable>
            </View>
          )}
        </ScrollView>
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  backButton: { marginRight: 8 },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
    gap: 14,
  },
  notFoundIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  notFoundTitle: {
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
  },
  notFoundSub: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  scroll: { flex: 1 },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
    gap: 16,
  },
  userCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 18,
    borderRadius: 16,
    borderWidth: 1,
  },
  avatarWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  userInfo: { flex: 1 },
  displayName: {
    fontSize: 18,
    fontWeight: "700",
  },
  userEmail: {
    fontSize: 14,
    marginTop: 4,
  },
  card: {
    borderRadius: 16,
    overflow: "hidden",
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 18,
    flexWrap: "wrap",
    gap: 10,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 13,
    fontWeight: "700",
  },
  date: {
    fontSize: 13,
  },
  typeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  typeLabel: {
    fontSize: 14,
  },
  messageBlock: {
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderTopWidth: 1,
    gap: 8,
  },
  messageLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.8,
  },
  message: {
    fontSize: 15,
    lineHeight: 22,
  },
  hintBlock: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderTopWidth: 1,
  },
  hint: {
    fontSize: 14,
    color: "#d97706",
    flex: 1,
    lineHeight: 20,
  },
  chatBlock: {
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderTopWidth: 1,
    gap: 14,
  },
  successRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  successHint: {
    fontSize: 14,
    color: "#16a34a",
    flex: 1,
    lineHeight: 20,
  },
  openChatButton: {
    flexDirection: "row",
    alignSelf: "flex-start",
    alignItems: "center",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  openChatLabel: {
    fontSize: 15,
    fontWeight: "600",
  },
  errorBlock: {
    padding: 14,
    borderRadius: 12,
  },
  error: {
    fontSize: 14,
  },
  actions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 4,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 15,
    borderRadius: 14,
  },
  actionLabel: {
    fontSize: 15,
    fontWeight: "700",
  },
});
