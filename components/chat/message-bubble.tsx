import { StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useAppTheme } from "@/hooks/use-app-theme";
import type { ChatMessage } from "@/types/chat";
import { formatTimeVi } from "@/utils/format-time";

type Props = {
  message: ChatMessage;
  isMine: boolean;
  senderName?: string;
  seenByNames?: string[];
};

/** Single chat bubble — aligned right for sent, left for received. */
export function MessageBubble({
  message,
  isMine,
  senderName,
  seenByNames,
}: Props) {
  const { color } = useAppTheme();

  return (
    <View style={[styles.row, isMine ? styles.rowMine : styles.rowTheirs]}>
      <View
        style={[
          styles.bubble,
          isMine
            ? [styles.bubbleMine, { backgroundColor: color.primary }]
            : [styles.bubbleTheirs, { backgroundColor: color.card }],
        ]}
      >
        {!isMine &&
          message.type !== "JOIN" &&
          message.type !== "LEAVE" &&
          message.type !== "SYSTEM" && (
          <ThemedText
            style={[
              styles.sender,
              {
                color: color.textSecondary,
              },
            ]}
          >
            {senderName ?? "Thành viên"}
          </ThemedText>
        )}
        <ThemedText
          style={[
            styles.content,
            { color: isMine ? color.primaryText : color.text },
          ]}
        >
          {message.content}
        </ThemedText>
        <ThemedText
          style={[
            styles.meta,
            { color: isMine ? color.primaryText + "99" : color.icon },
          ]}
        >
          {formatTimeVi(message.createdAt)}
          {isMine && message.id > 0 && message.status === "SEEN" ? "  ✓✓" : ""}
          {isMine && message.id < 0 ? "  •••" : ""}
        </ThemedText>

        {isMine && message.id > 0 && message.status === "SEEN" && seenByNames?.length ? (
          <ThemedText style={[styles.readBy, { color: color.textSecondary }]}>
            Đã xem: {seenByNames.join(", ")}
          </ThemedText>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    paddingHorizontal: 14,
    paddingVertical: 3,
    flexDirection: "row",
  },
  rowMine: { justifyContent: "flex-end" },
  rowTheirs: { justifyContent: "flex-start" },
  bubble: {
    maxWidth: "75%",
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 18,
  },
  bubbleMine: { borderBottomRightRadius: 4 },
  bubbleTheirs: { borderBottomLeftRadius: 4 },
  content: {
    fontSize: 15,
    lineHeight: 21,
  },
  sender: {
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 6,
    opacity: 0.9,
  },
  meta: {
    fontSize: 11,
    marginTop: 4,
    alignSelf: "flex-end",
  },
  readBy: {
    fontSize: 11,
    marginTop: 3,
    alignSelf: "flex-end",
    opacity: 0.9,
  },
});
