import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useLanguage } from "@/hooks/use-language";
import { useCreateRequest } from "@/hooks/use-create-request";
import { usePostsJoinEligibility } from "@/hooks/use-posts-join-eligibility";
import type { UserResponse } from "@/types/request";

type CreateRequestParams = {
  receiverId: string;
  postId?: string;
  receiver?: string;
};

export default function CreateRequestScreen() {
  const params = useLocalSearchParams<CreateRequestParams>();
  const router = useRouter();
  const { color } = useAppTheme();
  const { t } = useLanguage();
  const { create, isLoading, error, resetError } = useCreateRequest();

  const [message, setMessage] = useState("");

  const rawReceiverId = params.receiverId;
  const receiverId = rawReceiverId ? Number(rawReceiverId) : NaN;
  const rawPostId = params.postId;
  const postId = rawPostId ? Number(rawPostId) : NaN;
  const hasPostContext = !Number.isNaN(postId) && postId > 0;

  const {
    eligibilityByPostId,
    loading: eligLoading,
    error: eligError,
    refresh: refreshElig,
  } = usePostsJoinEligibility(
    hasPostContext ? [postId] : [],
    hasPostContext && !Number.isNaN(receiverId),
  );
  const elig = hasPostContext ? eligibilityByPostId[postId] : undefined;
  const canSubmitWithPost =
    !hasPostContext ||
    (!eligLoading &&
      !eligError &&
      (elig?.canRequestJoinChatRoom === true ||
        elig?.disabledReason === "CHAT_ROOM_FULL"));
  const receiver: UserResponse | null = params.receiver
    ? (() => {
        try {
          return JSON.parse(params.receiver!) as UserResponse;
        } catch {
          return null;
        }
      })()
    : null;

  const displayName =
    receiver?.fullName || receiver?.username || t("request.card.fallbackName");

  useEffect(() => {
    // expo-router có thể render 1 frame đầu khi params chưa kịp load => rawReceiverId === undefined.
    // Chỉ redirect khi rawReceiverId đã có nhưng parse ra không hợp lệ.
    if (rawReceiverId === undefined) return;
    if (!receiverId || Number.isNaN(receiverId)) {
      router.replace("/(tabs)/requests");
    }
  }, [rawReceiverId, receiverId, router]);

  const handleSubmit = useCallback(async () => {
    if (Number.isNaN(receiverId)) return;
    const result = await create({
      receiverId,
      postId: hasPostContext ? postId : undefined,
      message: message.trim() || undefined,
    });
    if (result) {
      resetError();
      router.replace("/(tabs)/requests?tab=outgoing");
    }
  }, [create, receiverId, postId, hasPostContext, message, resetError, router]);

  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  if (rawReceiverId === undefined) {
    return null; // waiting params
  }
  if (!receiverId || Number.isNaN(receiverId)) {
    return null;
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ThemedView style={[styles.container, { backgroundColor: color.background }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: color.border + "60" }]}>
          <Pressable
            onPress={handleBack}
            style={styles.backButton}
            hitSlop={12}
          >
            <IconSymbol name="chevron.left" size={24} color={color.primary} />
          </Pressable>
          <ThemedText style={styles.headerTitle}>{t("request.screenTitle")}</ThemedText>
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.flex}
        >
          <View style={styles.content}>
            {/* Thẻ người nhận */}
            <View style={[styles.receiverCard, { backgroundColor: color.primary + "10", borderColor: color.primary + "25" }]}>
              <View style={[styles.avatarWrap, { backgroundColor: color.primary + "20" }]}>
                <IconSymbol name="person.fill" size={28} color={color.primary} />
              </View>
              <View style={styles.receiverInfo}>
                <ThemedText style={[styles.receiverLabel, { color: color.text, opacity: 0.55 }]}>
                  {t("request.sendTo")}
                </ThemedText>
                <ThemedText style={styles.receiverName}>{displayName}</ThemedText>
                {receiver?.email ? (
                  <ThemedText style={[styles.receiverEmail, { color: color.text, opacity: 0.6 }]}>
                    {receiver.email}
                  </ThemedText>
                ) : null}
              </View>
            </View>

            {/* Gợi ý */}
            <View style={[styles.tipBlock, { backgroundColor: color.border + "18", borderColor: color.border + "40" }]}>
              <IconSymbol name="info.circle.fill" size={16} color={color.primary} />
              <ThemedText style={[styles.tipText, { color: color.text, opacity: 0.75 }]}>
                {hasPostContext ? t("request.tipWithPost") : t("request.tipGeneral")}
              </ThemedText>
            </View>

            {hasPostContext && eligLoading ? (
              <View style={[styles.tipBlock, { borderColor: color.border + "40" }]}>
                <ActivityIndicator size="small" color={color.primary} />
                <ThemedText style={[styles.tipText, { color: color.text, opacity: 0.75 }]}>
                  {t("request.checkingSlot")}
                </ThemedText>
              </View>
            ) : null}

            {hasPostContext && eligError ? (
              <Pressable
                onPress={refreshElig}
                style={[styles.tipBlock, { borderColor: color.error + "40", backgroundColor: color.error + "10" }]}
              >
                <IconSymbol name="exclamationmark.circle.fill" size={16} color={color.error} />
                <ThemedText style={[styles.tipText, { color: color.error }]}>
                  {t("request.eligibilityError")}
                </ThemedText>
              </Pressable>
            ) : null}

            {hasPostContext && !eligLoading && !eligError && elig && !elig.canRequestJoinChatRoom ? (
              elig.disabledReason === "CHAT_ROOM_FULL" ? (
                <View style={[styles.tipBlock, { borderColor: color.tint + "40", backgroundColor: color.tint + "10" }]}>
                  <ThemedText style={[styles.tipText, { color: color.icon }]}>
                    {t("request.queueFull", {
                      current: elig.currentOccupancy,
                      capacity: elig.roomCapacity,
                    })}
                  </ThemedText>
                </View>
              ) : (
                <View style={[styles.tipBlock, { borderColor: color.error + "40", backgroundColor: color.error + "12" }]}>
                  <ThemedText style={[styles.tipText, { color: color.error }]}>
                    {elig.disabledReason === "ALREADY_REQUESTED"
                      ? t("request.alreadySent")
                      : t("request.cannotSendReason", {
                          reason: elig.disabledReason ?? "UNKNOWN",
                        })}
                  </ThemedText>
                </View>
              )
            ) : null}

            {/* Lời nhắn */}
            <ThemedText style={[styles.label, { color: color.text }]}>
              {t("request.messageLabel")}{" "}
              <ThemedText style={[styles.optional, { color: color.text, opacity: 0.5 }]}>
                ({t("common.optional")})
              </ThemedText>
            </ThemedText>
            <TextInput
              style={[
                styles.input,
                {
                  color: color.text,
                  borderColor: error ? color.error : color.border,
                  backgroundColor: color.background,
                },
              ]}
              placeholder={t("request.modal.placeholder")}
              placeholderTextColor={color.placeholder}
              value={message}
              onChangeText={(text) => {
                setMessage(text);
                if (error) resetError();
              }}
              multiline
              numberOfLines={4}
              editable={!isLoading}
            />

            {error ? (
              <View style={[styles.errorBlock, { backgroundColor: color.error + "15" }]}>
                <IconSymbol name="exclamationmark.circle.fill" size={16} color={color.error} />
                <ThemedText style={[styles.error, { color: color.error }]}>{error}</ThemedText>
              </View>
            ) : null}

            <Pressable
              style={[
                styles.submitButton,
                { backgroundColor: isLoading ? color.primary + "80" : color.primary },
              ]}
              onPress={handleSubmit}
              disabled={isLoading || !canSubmitWithPost}
            >
              {isLoading ? (
                <ActivityIndicator color={color.primaryText} size="small" />
              ) : (
                <>
                  <IconSymbol name="envelope.fill" size={18} color={color.primaryText} />
                  <ThemedText style={[styles.submitLabel, { color: color.primaryText }]}>
                    {t("request.send")}
                  </ThemedText>
                </>
              )}
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
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
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
    gap: 16,
  },
  receiverCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 14,
  },
  avatarWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  receiverInfo: { flex: 1 },
  receiverLabel: {
    fontSize: 12,
    marginBottom: 2,
    fontWeight: "500",
  },
  receiverName: {
    fontSize: 17,
    fontWeight: "700",
  },
  receiverEmail: {
    fontSize: 13,
    marginTop: 3,
  },
  tipBlock: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  tipText: {
    fontSize: 13,
    lineHeight: 19,
    flex: 1,
  },
  label: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: -8,
  },
  optional: {
    fontSize: 14,
    fontWeight: "400",
  },
  input: {
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    minHeight: 120,
    textAlignVertical: "top",
    lineHeight: 22,
  },
  errorBlock: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    borderRadius: 10,
    marginTop: -8,
  },
  error: {
    fontSize: 14,
    flex: 1,
    lineHeight: 20,
  },
  submitButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 16,
    borderRadius: 14,
    marginTop: 4,
  },
  submitLabel: {
    fontSize: 16,
    fontWeight: "700",
  },
});
