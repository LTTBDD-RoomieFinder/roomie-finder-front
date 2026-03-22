import { StyleSheet, Text, View } from "react-native";

import { useAppTheme } from "@/hooks/use-app-theme";
import type { MembershipNoticeModel } from "@/utils/chat-system-message";

type Props = {
  model: MembershipNoticeModel;
};

function initialFromName(name: string): string {
  const t = name.trim();
  if (!t) return "?";
  return t[0]!.toUpperCase();
}

/** Centered pill: avatar + bold name + action (leave / kick / join), not a chat bubble. */
export function ChatMembershipNotice({ model }: Props) {
  const { color } = useAppTheme();
  const { displayName, variant } = model;

  const suffix =
    variant === "leave" ? " rời khỏi nhóm"
    : variant === "kick" ? " đã bị mời khỏi nhóm"
    : " đã tham gia nhóm";

  return (
    <View style={styles.wrap}>
      <View
        style={[
          styles.pill,
          {
            backgroundColor: color.card,
            borderColor: color.border + "35",
          },
        ]}
      >
        <View
          style={[
            styles.avatar,
            {
              backgroundColor: color.primary + "18",
              borderColor: color.primary + "30",
            },
          ]}
        >
          <Text style={[styles.avatarLetter, { color: color.primary }]}>
            {initialFromName(displayName)}
          </Text>
        </View>
        <View style={styles.textBlock}>
          <Text
            style={[styles.bodyText, { color: color.text }]}
            numberOfLines={2}
          >
            <Text style={styles.nameBold}>{displayName}</Text>
            <Text style={styles.suffixRegular}>{suffix}</Text>
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: "100%",
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "center",
    flexGrow: 0,
    flexShrink: 1,
    maxWidth: "92%",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 10,
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarLetter: {
    fontSize: 12,
    fontWeight: "800",
  },
  textBlock: {
    flexGrow: 0,
    flexShrink: 1,
    minWidth: 0,
  },
  bodyText: {
    fontSize: 14,
    lineHeight: 20,
  },
  nameBold: {
    fontWeight: "700",
  },
  suffixRegular: {
    fontWeight: "400",
  },
});
