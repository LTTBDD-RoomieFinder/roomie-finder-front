import { Pressable, StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { UserAvatar } from "@/components/ui/user-avatar";
import {
  REQUEST_REJECT_COOLDOWN_DAYS,
  REQUEST_STATUS_COLOR,
  REQUEST_STATUS_LABEL_KEY,
} from "@/constants/request";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useLanguage } from "@/hooks/use-language";
import type { RequestResponse, RequestStatus } from "@/types/request";
import { formatDate } from "@/utils/format-post";
import { displayNameForUser } from "@/utils/normalize-user";

type RequestCardProps = {
  request: RequestResponse;
  variant: "incoming" | "outgoing";
  onAccept?: (id: number) => void;
  onReject?: (id: number) => void;
  onOpenChat?: (chatRoomId: number) => void;
  onPress?: (request: RequestResponse) => void;
  isUpdating?: boolean;
  /** Vừa có thông báo chưa đọc — tô đậm để dễ nhận biết. */
  emphasizeNew?: boolean;
};

export function RequestCard({
  request,
  variant,
  onAccept,
  onReject,
  onOpenChat,
  onPress,
  isUpdating = false,
  emphasizeNew = false,
}: RequestCardProps) {
  const { color } = useAppTheme();
  const { t } = useLanguage();
  const statusColor = REQUEST_STATUS_COLOR[request.status];

  const otherUser = variant === "incoming" ? request.sender : request.receiver;
  const displayName = otherUser
    ? displayNameForUser(otherUser, t("request.card.fallbackName"))
    : t("request.card.fallbackName");

  const canRespond =
    variant === "incoming" &&
    request.status === "PENDING" &&
    onAccept &&
    onReject;

  const showCooldownHint =
    variant === "outgoing" && request.status === "REJECTED";

  const cardContent = (
    <>
      <View style={styles.main}>
        <View style={styles.row}>
          <UserAvatar
            userId={otherUser?.id}
            hintUrl={otherUser?.avatarUrl}
            name={displayName}
            size={46}
            style={{ marginRight: 12, flexShrink: 0 }}
          />
          <View style={styles.body}>
            <ThemedText
              style={[
                styles.displayName,
                emphasizeNew && styles.displayNameNew,
              ]}
              numberOfLines={1}
            >
              {displayName}
            </ThemedText>
            <View style={styles.meta}>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: statusColor + "1a" },
                ]}
              >
                <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                <ThemedText style={[styles.statusText, { color: statusColor }]}>
                  {t(REQUEST_STATUS_LABEL_KEY[request.status])}
                </ThemedText>
              </View>
              <ThemedText
                style={[styles.date, { color: color.text, opacity: 0.6 }]}
              >
                {formatDate(request.createdAt)}
              </ThemedText>
            </View>
          </View>
          <IconSymbol name="chevron.right" size={16} color={color.icon} style={{ opacity: 0.5 }} />
        </View>

        {request.message ? (
          <ThemedText
            style={[styles.message, { color: color.text, opacity: 0.85 }]}
            numberOfLines={3}
          >
            {request.message}
          </ThemedText>
        ) : null}

        {showCooldownHint && (
          <View style={[styles.hintRow, { backgroundColor: "#d9770612" }]}>
            <IconSymbol name="clock.fill" size={13} color="#d97706" />
            <ThemedText style={styles.hint}>
              {t("request.card.cooldownHint", { days: REQUEST_REJECT_COOLDOWN_DAYS })}
            </ThemedText>
          </View>
        )}

        {request.status === "ACCEPTED" && request.chatRoom && (
          <View style={styles.chatRoomBlock}>
            <View style={styles.successRow}>
              <IconSymbol name="checkmark.seal.fill" size={14} color="#16a34a" />
              <ThemedText style={styles.successHint}>
                {t("request.card.acceptedHint")}
              </ThemedText>
            </View>
            {onOpenChat && (
              <Pressable
                style={[
                  styles.openChatButton,
                  { backgroundColor: color.primary },
                ]}
                onPress={() => onOpenChat(request.chatRoom!.id)}
              >
                <IconSymbol
                  name="bubble.left.and.bubble.right.fill"
                  size={15}
                  color={color.primaryText}
                />
                <ThemedText
                  style={[styles.openChatLabel, { color: color.primaryText }]}
                >
                  {t("request.card.openChat")}
                </ThemedText>
              </Pressable>
            )}
          </View>
        )}
      </View>

      {canRespond && (
        <View style={[styles.actions, { borderTopColor: color.border + "60" }]}>
          <Pressable
            style={[
              styles.button,
              { backgroundColor: color.primary },
            ]}
            onPress={() => !isUpdating && onAccept?.(request.id)}
            disabled={isUpdating}
          >
            <IconSymbol
              name="checkmark.circle.fill"
              size={18}
              color={color.primaryText}
            />
            <ThemedText
              style={[styles.buttonLabel, { color: color.primaryText }]}
            >
              {t("request.card.accept")}
            </ThemedText>
          </Pressable>
          <Pressable
            style={[
              styles.button,
              { backgroundColor: color.error + "15", borderWidth: 1.5, borderColor: color.error },
            ]}
            onPress={() => !isUpdating && onReject?.(request.id)}
            disabled={isUpdating}
          >
            <IconSymbol name="xmark.circle.fill" size={18} color={color.error} />
            <ThemedText style={[styles.buttonLabel, { color: color.error }]}>
              {t("request.card.reject")}
            </ThemedText>
          </Pressable>
        </View>
      )}
    </>
  );

  const cardWrapper = (
    <ThemedView
      style={[
        styles.card,
        { borderLeftColor: statusColor, borderLeftWidth: 4 },
      ]}
    >
      {cardContent}
    </ThemedView>
  );

  if (onPress) {
    return (
      <Pressable onPress={() => onPress(request)}>
        {cardWrapper}
      </Pressable>
    );
  }
  return cardWrapper;
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  },
  main: {
    gap: 12,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  body: {
    flex: 1,
    minWidth: 0,
  },
  displayName: {
    fontSize: 16,
    fontWeight: "700",
  },
  displayNameNew: {
    fontWeight: "900",
  },
  meta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 6,
    flexWrap: "wrap",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "700",
  },
  date: {
    fontSize: 12,
  },
  message: {
    fontSize: 14,
    lineHeight: 21,
    paddingLeft: 58,
  },
  hintRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    marginLeft: 58,
  },
  hint: {
    fontSize: 13,
    color: "#d97706",
  },
  chatRoomBlock: {
    marginLeft: 58,
    gap: 10,
  },
  successRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  successHint: {
    fontSize: 13,
    color: "#16a34a",
    flex: 1,
    lineHeight: 18,
  },
  openChatButton: {
    flexDirection: "row",
    alignSelf: "flex-start",
    alignItems: "center",
    gap: 7,
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  openChatLabel: {
    fontSize: 13,
    fontWeight: "600",
  },
  actions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
  },
  button: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    paddingVertical: 11,
    borderRadius: 12,
  },
  buttonLabel: {
    fontSize: 14,
    fontWeight: "700",
  },
});
