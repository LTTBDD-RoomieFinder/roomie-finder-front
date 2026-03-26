import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Keyboard,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ChatInput, ChatMembershipNotice, MessageBubble } from "@/components/chat";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useLanguage } from "@/hooks/use-language";
import { useChatMessages } from "@/hooks/use-chat-messages";
import { useChatRoomDetails } from "@/hooks/use-chat-room-details";
import { useChatSocket } from "@/hooks/use-chat-socket";
import { chatService } from "@/services/chat-service";
import { useAuthStore } from "@/stores/useAuthStore";
import type { ChatMessage } from "@/types/chat";
import { syncTabBadgesToStore } from "@/services/tab-badge-service";
import { decodeJwtPayload } from "@/utils/jwt";
import { formatDateVi } from "@/utils/format-date";
import {
  getMembershipNoticeModel,
  parseMemberKickedUserId,
} from "@/utils/chat-system-message";

export default function ChatRoomScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { color } = useAppTheme();
  const { t } = useLanguage();

  const chatRoomId = Number(id);

  const [myUserId, setMyUserId] = useState<number | null>(null);
  const accessToken = useAuthStore((s) => s.accessToken);
  const flatListRef = useRef<FlatList<ChatMessage>>(null);
  const [infoOpen, setInfoOpen] = useState(false);
  const isLeavingOrDeletingRef = useRef(false);
  const kickedAlertShownRef = useRef(false);
  const roomDeletedAlertShownRef = useRef(false);
  const markSeenDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  // Resolve current user ID from JWT on mount
  useEffect(() => {
    if (!accessToken) return;
    const claims = decodeJwtPayload(accessToken);
    if (claims?.userId != null) {
      setMyUserId(Number(claims.userId));
    }
  }, [accessToken]);

  const {
    messages,
    isLoading,
    isLoadingMore,
    hasMore,
    error,
    fetchInitial,
    loadMore,
    addMessage,
  } = useChatMessages(chatRoomId);

  const { details: chatRoomDetails, error: detailsError, refetch } =
    useChatRoomDetails(chatRoomId);

  const memberNameById = useMemo(() => {
    const map = new Map<number, string>();
    if (!chatRoomDetails?.members) return map;
    for (const m of chatRoomDetails.members) {
      const key = Number(m.id);
      map.set(key, m.fullName || m.username);
    }
    return map;
  }, [chatRoomDetails?.members]);

  const createdAtLabel = useMemo(() => {
    if (!chatRoomDetails?.createdAt) return "";
    return formatDateVi(chatRoomDetails.createdAt);
  }, [chatRoomDetails?.createdAt]);

  const handleIncomingMessage = useCallback(
    (msg: ChatMessage) => {
      // Backend broadcasts a SYSTEM message when room is deleted by owner.
      // Use this to notify all connected users in this chatroom screen.
      if (msg.type === "SYSTEM" && msg.content === "ROOM_DELETED") {
        if (roomDeletedAlertShownRef.current) return;
        roomDeletedAlertShownRef.current = true;

        if (markSeenDebounceRef.current) {
          clearTimeout(markSeenDebounceRef.current);
          markSeenDebounceRef.current = null;
        }

        Alert.alert(
          t("chat.roomDeletedTitle"),
          t("chat.roomDeletedMessage"),
          [
            {
              text: t("common.ok"),
              onPress: () => router.replace("/(tabs)/chats"),
            },
          ],
        );
        return;
      }

      // Backend: SYSTEM MEMBER_KICKED (optional "|" display suffix); show alert for kicked user.
      if (msg.type === "SYSTEM" && msg.content?.startsWith("MEMBER_KICKED:")) {
        const kickedId = parseMemberKickedUserId(msg.content);
        if (myUserId != null && kickedId === myUserId) {
          if (kickedAlertShownRef.current) return;
          kickedAlertShownRef.current = true;

          if (markSeenDebounceRef.current) {
            clearTimeout(markSeenDebounceRef.current);
            markSeenDebounceRef.current = null;
          }

          Alert.alert(
            t("chat.kickedTitle"),
            t("chat.kickedMessage"),
            [
              {
                text: t("common.ok"),
                onPress: () => router.replace("/(tabs)/chats"),
              },
            ],
          );
        }
      }

      addMessage(msg);
      if (!myUserId) return;
      if (msg.senderId === myUserId) return;

      // Debounce to avoid spamming /seen when nhiều message đến nhanh.
      if (markSeenDebounceRef.current) {
        clearTimeout(markSeenDebounceRef.current);
      }
      markSeenDebounceRef.current = setTimeout(() => {
        chatService
          .markMessagesSeen(chatRoomId)
          .then(() => {
            void syncTabBadgesToStore();
          })
          .catch((err) => {
            const msg =
              typeof err === "string" ? err : typeof err?.message === "string" ? err.message : "";
            if (
              msg.toLowerCase().includes("not a member") &&
              !kickedAlertShownRef.current &&
              !isLeavingOrDeletingRef.current
            ) {
              kickedAlertShownRef.current = true;
              Alert.alert(
                t("chat.notMemberTitle"),
                t("chat.notMemberMessage"),
                [
                  {
                    text: t("common.ok"),
                    onPress: () => router.replace("/(tabs)/chats"),
                  },
                ],
              );
            }
          });
      }, 600);
    },
    [addMessage, myUserId, chatRoomId, router, t],
  );

  const { isConnected, sendMessage } = useChatSocket(
    chatRoomId,
    handleIncomingMessage,
  );

  useEffect(() => {
    fetchInitial();
  }, [fetchInitial]);

  const handleSend = useCallback(
    (content: string) => {
      if (!myUserId) return;

      // Optimistic message with negative temp ID
      const optimistic: ChatMessage = {
        id: -Date.now(),
        content,
        type: "TEXT",
        status: "SENT",
        senderId: myUserId,
        chatRoomId,
        createdAt: new Date().toISOString().replace("T", " ").slice(0, 19),
      };
      addMessage(optimistic);

      sendMessage({ chatRoomId, content, type: "TEXT" });
      Keyboard.dismiss();
    },
    [addMessage, sendMessage, chatRoomId, myUserId],
  );

  const handleLeaveRoom = useCallback(() => {
    if (!myUserId) return;
    isLeavingOrDeletingRef.current = true;
    chatService
      .leaveChatRoom(chatRoomId)
      .then(() => {
        Alert.alert(t("chat.leaveSuccessTitle"), t("chat.leaveSuccessMessage"), [
          {
            text: t("common.ok"),
            onPress: () => {
              setInfoOpen(false);
              router.back();
            },
          },
        ]);
      })
      .catch(() => {
        isLeavingOrDeletingRef.current = false;
        Alert.alert(t("chat.leaveErrorTitle"), t("chat.leaveErrorMessage"));
      });
  }, [chatRoomId, myUserId, router, t]);

  const handleKickMember = useCallback(
    (memberUserId: number) => {
      chatService
        .kickChatRoomMember(chatRoomId, memberUserId)
        .then(() => {
          // Owner kicked someone: refresh member list.
          refetch();
          Alert.alert(
            t("chat.kickSuccessTitle"),
            t("chat.kickSuccessMessage"),
          );
        })
        .catch(() => {
          Alert.alert(t("chat.kickErrorTitle"), t("chat.kickErrorMessage"));
        });
    },
    [chatRoomId, refetch, t],
  );

  const handleDeleteRoom = useCallback(() => {
    if (!chatRoomDetails?.ownerId) return;
    Alert.alert(
      t("chat.deleteTitle"),
      t("chat.deleteMessage"),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("common.ok"),
          style: "destructive",
          onPress: () => {
            isLeavingOrDeletingRef.current = true;
            chatService
              .deleteChatRoom(chatRoomId)
              .then(() => {
                setInfoOpen(false);
                router.replace("/(tabs)/chats");
              })
              .catch(() => {
                isLeavingOrDeletingRef.current = false;
                Alert.alert(
                  t("chat.deleteErrorTitle"),
                  t("chat.deleteErrorMessage"),
                );
              });
          },
        },
      ],
    );
  }, [chatRoomDetails?.ownerId, chatRoomId, router, t]);

  // If BE rejects membership after leave/kick => show alert and bounce back.
  useEffect(() => {
    const msg = [detailsError, error].filter(Boolean).join(" ");
    if (!msg) return;
    if (isLeavingOrDeletingRef.current) return;
    if (kickedAlertShownRef.current) return;

    const isNotMember = msg.toLowerCase().includes("not a member");
    const isNotFound = msg.toLowerCase().includes("not found");
    if (!isNotMember && !isNotFound) return;

    kickedAlertShownRef.current = true;

    if (isNotFound) {
      Alert.alert(
        t("chat.roomDeletedTitle"),
        t("chat.roomDeletedMessage"),
        [
          {
            text: t("common.ok"),
            onPress: () => router.replace("/(tabs)/chats"),
          },
        ],
      );
      return;
    }

    Alert.alert(t("chat.notMemberTitle"), t("chat.notMemberMessage"), [
      {
        text: t("common.ok"),
        onPress: () => router.replace("/(tabs)/chats"),
      },
    ]);
  }, [detailsError, error, router, t]);

  const renderItem = useCallback(
    ({ item }: { item: ChatMessage }) => {
      const notice = getMembershipNoticeModel(item, memberNameById);
      if (notice) {
        return <ChatMembershipNotice model={notice} />;
      }
      return (
        <MessageBubble
          message={item}
          isMine={item.senderId === myUserId}
          senderName={memberNameById.get(item.senderId)}
          seenByNames={
            item.seenByIds?.length ?
              item.seenByIds
                .map((uid) => memberNameById.get(uid))
                .filter((n): n is string => Boolean(n))
            : undefined
          }
        />
      );
    },
    [myUserId, memberNameById],
  );

  const keyExtractor = useCallback((item: ChatMessage) => String(item.id), []);

  const handleEndReached = useCallback(() => {
    if (hasMore && !isLoadingMore) loadMore();
  }, [hasMore, isLoadingMore, loadMore]);

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <ThemedView
        style={[styles.container, { backgroundColor: color.background }]}
      >
        {/* ── Header ── */}
        <View
          style={[styles.header, { borderBottomColor: color.border + "60" }]}
        >
          <Pressable
            onPress={() => router.back()}
            style={styles.backButton}
            hitSlop={12}
          >
            <IconSymbol name="chevron.left" size={24} color={color.primary} />
          </Pressable>

          <View style={styles.headerCenter}>
            <ThemedText style={styles.headerTitle}>
              {chatRoomDetails?.postTitle?.trim()
                ? chatRoomDetails.postTitle
                : t("chat.roomFallback", { id: chatRoomId })}
            </ThemedText>

            <ThemedText style={[styles.headerSub, { color: color.icon }]}>
              {t("chat.headerSubtitle")}
            </ThemedText>
          </View>

          <View style={styles.rightWrap}>
            {/* Connection status dot */}
            <View style={styles.statusWrap}>
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: isConnected ? "#22c55e" : color.border },
                ]}
              />
              <ThemedText style={[styles.statusLabel, { color: color.icon }]}>
                {isConnected ? t("chat.online") : t("chat.connecting")}
              </ThemedText>
            </View>

            {/* 3 chấm xem chi tiết */}
            <Pressable
              onPress={() => setInfoOpen(true)}
              hitSlop={10}
              style={({ pressed }) => [
                styles.infoBtn,
                {
                  backgroundColor:
                    pressed ? color.backgroundSecondary : "transparent",
                },
              ]}
              accessibilityLabel={t("chat.infoA11y")}
            >
              <Ionicons
                name="ellipsis-horizontal"
                size={22}
                color={color.icon}
              />
            </Pressable>
          </View>
        </View>

        <Modal
          visible={infoOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setInfoOpen(false)}
        >
          <Pressable
            style={styles.modalOverlay}
            onPress={() => setInfoOpen(false)}
          >
            <View style={[styles.modalCard, { backgroundColor: color.card }]}>
              <ThemedText style={[styles.modalTitle, { color: color.text }]}>
                {t("chat.detailTitle")}
              </ThemedText>

              {chatRoomDetails ?
                <>
                  <ThemedText style={[styles.modalRow, { color: color.icon }]}>
                    {t("chat.statusLabel", {
                      status: chatRoomDetails.status ?? "—",
                    })}
                  </ThemedText>
                  {chatRoomDetails.createdAt ?
                    <ThemedText
                      style={[styles.modalRow, { color: color.icon }]}
                    >
                      {t("chat.createdAt", { date: createdAtLabel })}
                    </ThemedText>
                  : null}

                  <ThemedText
                    style={[styles.modalSectionTitle, { color: color.text }]}
                  >
                    {t("chat.members", {
                      count: chatRoomDetails.members.length,
                    })}
                  </ThemedText>

                  <ScrollView style={styles.modalMembers}>
                    {chatRoomDetails.members.map((m) => {
                      const ownerId = chatRoomDetails.ownerId ?? null;
                      const iAmOwner =
                        myUserId != null && ownerId != null && myUserId === ownerId;
                      const isMe =
                        myUserId != null && Number(m.id) === myUserId;

                      const initial = (
                        m.fullName?.trim()?.[0] ??
                        m.username?.trim()?.[0] ??
                        "?"
                      ).toUpperCase();
                      return (
                        <View
                          key={m.id}
                          style={[
                            styles.modalMemberRow,
                            { borderColor: color.border + "30" },
                          ]}
                        >
                          <View
                            style={[
                              styles.modalMemberAvatar,
                              {
                                backgroundColor: color.primary + "18",
                                borderColor: color.primary + "25",
                              },
                            ]}
                          >
                            <ThemedText
                              style={[
                                styles.modalMemberInitial,
                                { color: color.primary },
                              ]}
                            >
                              {initial}
                            </ThemedText>
                          </View>
                          <View style={{ flex: 1 }}>
                            <ThemedText
                              style={[
                                styles.modalMemberName,
                                { color: color.text },
                              ]}
                              numberOfLines={1}
                            >
                              {m.fullName || m.username}
                            </ThemedText>
                            <ThemedText
                              style={[
                                styles.modalMemberSub,
                                { color: color.icon },
                              ]}
                              numberOfLines={1}
                            >
                              {m.email}
                            </ThemedText>
                          </View>

                          {isMe && !iAmOwner ? (
                            <Pressable
                              onPress={() =>
                                Alert.alert(
                                  t("chat.leaveConfirmTitle"),
                                  t("chat.leaveConfirmMessage"),
                                  [
                                    { text: t("common.cancel"), style: "cancel" },
                                    {
                                      text: t("common.ok"),
                                      onPress: handleLeaveRoom,
                                    },
                                  ],
                                )
                              }
                              style={({ pressed }) => [
                                styles.modalActionBtn,
                                {
                                  borderColor: color.error + "40",
                                  backgroundColor: pressed
                                    ? color.error + "18"
                                    : color.error + "10",
                                },
                              ]}
                              hitSlop={6}
                              accessibilityLabel={t("chat.leaveA11y")}
                            >
                              <Ionicons
                                name="log-out-outline"
                                size={18}
                                color={color.error}
                              />
                            </Pressable>
                          ) : null}

                          {iAmOwner && !isMe ? (
                            <Pressable
                              onPress={() => handleKickMember(Number(m.id))}
                              style={({ pressed }) => [
                                styles.modalActionBtn,
                                {
                                  borderColor: color.tint + "40",
                                  backgroundColor: pressed
                                    ? color.tint + "18"
                                    : color.tint + "10",
                                },
                              ]}
                              hitSlop={6}
                              accessibilityLabel={t("chat.kickA11y")}
                            >
                              <Ionicons
                                name="person-remove-outline"
                                size={18}
                                color={color.tint}
                              />
                            </Pressable>
                          ) : null}
                        </View>
                      );
                    })}
                  </ScrollView>
                </>
              : <View style={styles.modalLoading}>
                  <ActivityIndicator size="small" color={color.tint} />
                  <ThemedText style={{ color: color.icon, marginTop: 8 }}>
                    {t("chat.loadingDetail")}
                  </ThemedText>
                </View>
              }

              {/* Owner delete button (room persists unless owner deletes). */}
              {chatRoomDetails && myUserId != null && chatRoomDetails.ownerId === myUserId ? (
                <Pressable
                  onPress={handleDeleteRoom}
                  style={({ pressed }) => [
                    styles.modalDeleteBtn,
                    {
                      backgroundColor: pressed ? color.error + "15" : color.error + "10",
                      borderColor: color.error + "60",
                    },
                  ]}
                  hitSlop={10}
                  accessibilityLabel={t("chat.deleteA11y")}
                >
                  <Ionicons name="trash-outline" size={18} color={color.error} />
                  <ThemedText style={[styles.modalDeleteText, { color: color.error }]}>
                    {t("chat.deleteRoom")}
                  </ThemedText>
                </Pressable>
              ) : null}

              <Pressable
                onPress={() => setInfoOpen(false)}
                style={({ pressed }) => [
                  styles.modalCloseBtn,
                  { opacity: pressed ? 0.9 : 1 },
                ]}
              >
                <ThemedText
                  style={[styles.modalCloseText, { color: color.tint }]}
                >
                  {t("chat.close")}
                </ThemedText>
              </Pressable>
            </View>
          </Pressable>
        </Modal>

        {/* Optional detail error banner (only when opening room info) */}
        {detailsError && infoOpen ?
          <View
            style={[
              styles.errorBanner,
              { backgroundColor: color.error + "20" },
            ]}
          >
            <ThemedText style={[styles.errorText, { color: color.error }]}>
              {detailsError}
            </ThemedText>
          </View>
        : null}

        {/* ── Error banner ── */}
        {error && (
          <View
            style={[
              styles.errorBanner,
              { backgroundColor: color.error + "20" },
            ]}
          >
            <ThemedText style={[styles.errorText, { color: color.error }]}>
              {error}
            </ThemedText>
          </View>
        )}

        {/* ── Message list ── */}
        {isLoading ?
          <View style={styles.loaderWrap}>
            <ActivityIndicator size="large" color={color.primary} />
          </View>
        : <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            inverted
            onEndReached={handleEndReached}
            onEndReachedThreshold={0.4}
            ListFooterComponent={
              isLoadingMore ?
                <View style={styles.loadMoreIndicator}>
                  <ActivityIndicator size="small" color={color.primary} />
                </View>
              : null
            }
            contentContainerStyle={styles.listContent}
            keyboardShouldPersistTaps="handled"
          />
        }

        {/* ── Input bar ── */}
        <ChatInput onSend={handleSend} />
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
  headerCenter: { flex: 1, paddingHorizontal: 8 },
  headerTitle: { fontSize: 16, fontWeight: "700" },
  headerSub: { fontSize: 12, marginTop: 3, lineHeight: 16 },
  headerMembersLine: { fontSize: 12, marginTop: 8, lineHeight: 16 },
  headerCreatedAt: {
    fontSize: 11,
    marginTop: 3,
    lineHeight: 15,
    opacity: 0.75,
  },
  rightWrap: { flexDirection: "row", alignItems: "center", gap: 10 },
  infoBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    padding: 0,
  },
  memberAvatarsRow: { gap: 8, paddingTop: 8, paddingBottom: 4 },
  memberAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  memberInitial: { fontSize: 13, fontWeight: "800" },
  statusWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusLabel: { fontSize: 12 },

  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.35)",
    paddingHorizontal: 18,
  },
  modalCard: {
    borderRadius: 14,
    padding: 16,
    maxHeight: "78%",
  },
  modalTitle: { fontSize: 16, fontWeight: "800", marginBottom: 12 },
  modalRow: { fontSize: 13, marginBottom: 6 },
  modalSectionTitle: {
    fontSize: 14,
    fontWeight: "800",
    marginTop: 14,
    marginBottom: 8,
  },
  modalMembers: { maxHeight: 240 },
  modalMemberRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  modalMemberAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  modalMemberInitial: { fontSize: 13, fontWeight: "900" },
  modalMemberName: { fontSize: 14, fontWeight: "800" },
  modalMemberSub: { fontSize: 12, marginTop: 2 },
  modalActionBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  modalDeleteBtn: {
    marginTop: 14,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  modalDeleteText: { fontSize: 14, fontWeight: "900" },
  modalLoading: { alignItems: "center", paddingVertical: 18 },
  modalCloseBtn: {
    marginTop: 14,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    backgroundColor: "transparent",
  },
  modalCloseText: { fontSize: 14, fontWeight: "900" },
  errorBanner: {
    marginHorizontal: 14,
    marginTop: 8,
    padding: 12,
    borderRadius: 10,
  },
  errorText: { fontSize: 13 },
  loaderWrap: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  listContent: {
    paddingVertical: 10,
    flexGrow: 1,
    justifyContent: "flex-end",
  },
  loadMoreIndicator: {
    paddingVertical: 14,
    alignItems: "center",
  },
});
