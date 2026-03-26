import { useState } from "react";
import { Pressable, StyleSheet, TextInput, View } from "react-native";

import { IconSymbol } from "@/components/ui/icon-symbol";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useLanguage } from "@/hooks/use-language";

type Props = {
  onSend: (content: string) => void;
  disabled?: boolean;
};

/** Text input row with send button for the chat room. */
export function ChatInput({ onSend, disabled }: Props) {
  const { color } = useAppTheme();
  const { t } = useLanguage();
  const [text, setText] = useState("");

  const canSend = text.trim().length > 0 && !disabled;

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setText("");
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: color.card,
          borderTopColor: color.border + "40",
        },
      ]}
    >
      <TextInput
        style={[
          styles.input,
          { color: color.text, backgroundColor: color.background },
        ]}
        value={text}
        onChangeText={setText}
        placeholder={t("chat.inputPlaceholder")}
        placeholderTextColor={color.icon}
        multiline
        maxLength={2000}
        editable={!disabled}
      />
      <Pressable
        onPress={handleSend}
        disabled={!canSend}
        hitSlop={8}
        style={[
          styles.sendBtn,
          { backgroundColor: canSend ? color.primary : color.border + "60" },
        ]}
      >
        <IconSymbol name="paperplane.fill" size={20} color="#fff" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    gap: 8,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 120,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
});
