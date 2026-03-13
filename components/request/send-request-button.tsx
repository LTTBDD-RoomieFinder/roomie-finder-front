import { useState } from "react";
import { Pressable, StyleSheet } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useAppTheme } from "@/hooks/use-app-theme";
import type { UserResponse } from "@/types/request";
import { SendRequestModal } from "./send-request-modal";

type SendRequestButtonProps = {
  receiver: UserResponse;
  onSuccess?: () => void;
  variant?: "primary" | "outline";
};

export function SendRequestButton({
  receiver,
  onSuccess,
  variant = "primary",
}: SendRequestButtonProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const { color } = useAppTheme();
  const isPrimary = variant === "primary";

  return (
    <>
      <Pressable
        style={[
          styles.button,
          isPrimary
            ? { backgroundColor: color.primary }
            : [styles.buttonOutline, { borderColor: color.border }],
        ]}
        onPress={() => setModalVisible(true)}
      >
        <IconSymbol
          name="envelope.fill"
          size={20}
          color={isPrimary ? color.primaryText : color.text}
        />
        <ThemedText
          style={[
            styles.label,
            { color: isPrimary ? color.primaryText : color.text },
          ]}
        >
          Gửi lời mời kết bạn phòng
        </ThemedText>
      </Pressable>

      <SendRequestModal
        visible={modalVisible}
        receiver={receiver}
        onClose={() => setModalVisible(false)}
        onSuccess={onSuccess}
      />
    </>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: 22,
    borderRadius: 14,
  },
  buttonOutline: {
    borderWidth: 1.5,
  },
  label: {
    fontSize: 15,
    fontWeight: "600",
  },
});
