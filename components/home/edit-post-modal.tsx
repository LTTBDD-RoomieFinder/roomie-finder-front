import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { PostResponse } from "@/data/response";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useLanguage } from "@/hooks/use-language";
import { postService } from "@/services/post-service";
import { STATUS_OPTIONS } from "@/constants/post-constants";
import { PostStatus } from "@/types/PostStatus";

type Props = {
  visible: boolean;
  post: PostResponse | null;
  onClose: () => void;
  onSuccess: () => void;
};

export function EditPostModal({ visible, post, onClose, onSuccess }: Props) {
  const { color } = useAppTheme();
  const { t } = useLanguage();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [status, setStatus] = useState<PostStatus>("PUBLISHED");
  const [isStatusPickerVisible, setStatusPickerVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const insets = useSafeAreaInsets();

  // Sync form with post when it changes
  React.useEffect(() => {
    if (post) {
      setTitle(post.title || "");
      setContent(post.content || "");
      setStatus(post.status || "PUBLISHED");
    }
  }, [post]);

  const handleSave = async () => {
    if (!post) return;
    if (!title.trim()) {
      Alert.alert(t("post.alerts.missingTitleTitle"), t("post.alerts.missingTitleMessage"));
      return;
    }
    try {
      setSubmitting(true);
      await postService.updatePost(post.id, {
        title: title.trim(),
        content: content.trim(),
        status
      });
      onSuccess();
      onClose();
    } catch (e: any) {
      Alert.alert(t("common.error"), e?.toString() ?? t("post.alerts.updateFailed"));
    } finally {
      setSubmitting(false);
    }
  };

  if (!post) return null;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <ThemedView style={{ flex: 1 }}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          {/* Header */}
          <View style={[
            styles.header,
            {
              borderBottomColor: color.border,
              paddingTop: Platform.OS === 'android' ? Math.max(insets.top, 12) : 12
            }
          ]}>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color={color.text} />
            </Pressable>
            <ThemedText type="subtitle" style={styles.headerTitle}>
              {t("post.editTitle")}
            </ThemedText>
            <Pressable
              onPress={handleSave}
              disabled={submitting}
              style={[
                styles.saveBtn,
                {
                  backgroundColor: title.trim() ? color.tint : color.placeholder,
                  opacity: submitting ? 0.7 : 1
                }
              ]}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <ThemedText type="defaultSemiBold" style={{ color: color.primaryText, fontSize: 13 }}>
                  {t("post.save")}
                </ThemedText>
              )}
            </Pressable>
          </View>

          <ScrollView
            contentContainerStyle={styles.body}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.profileSection}>
              <View style={[styles.avatar, { backgroundColor: color.backgroundSecondary }]}>
                <Image
                  source={require("@/assets/images/default-avatar.png")}
                  style={styles.avatarImg}
                />
              </View>
              <View style={{ flex: 1, justifyContent: "center" }}>
                <ThemedText type="defaultSemiBold" style={styles.userName}>
                  {post.user.username}
                </ThemedText>
                {/* Status Picker Badge */}
                <View style={{ zIndex: 10, elevation: 10 }}>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
                    style={[styles.statusBadge, { backgroundColor: color.backgroundSecondary }]}
                    onPress={() => setStatusPickerVisible(true)}
                  >
                    <Ionicons 
                      name={status === "PUBLISHED" ? "earth" : status === "DRAFT" ? "document-text" : "eye-off"} 
                      size={12} 
                      color={color.textSecondary} 
                    />
                    <ThemedText style={[styles.statusBadgeText, { color: color.textSecondary }]}>
                      {t(
                        STATUS_OPTIONS.find((o) => o.value === status)?.labelKey ??
                          "post.statusBadgeFallback",
                      )}
                    </ThemedText>
                    <Ionicons name="caret-down" size={10} color={color.textSecondary} style={{ marginLeft: 2 }}/>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            <View style={styles.inputContainer}>
              <View style={styles.labelRow}>
                <ThemedText style={[styles.label, { color: color.textSecondary }]}>
                  {t("post.labels.postTitle")}
                </ThemedText>
                <ThemedText style={[styles.charCount, { color: color.placeholder }]}>
                  {title.length}/100
                </ThemedText>
              </View>
              <TextInput
                style={[
                  styles.titleInput,
                  {
                    color: color.text,
                    borderBottomColor: color.border
                  }
                ]}
                placeholder={t("post.placeholders.titleEdit")}
                placeholderTextColor={color.placeholder}
                value={title}
                onChangeText={setTitle}
                maxLength={100}
              />

              <View style={[styles.labelRow, { marginTop: 24 }]}>
                <ThemedText style={[styles.label, { color: color.textSecondary }]}>
                  {t("post.labels.content")}
                </ThemedText>
                <ThemedText style={[styles.charCount, { color: color.placeholder }]}>
                  {content.length}/2000
                </ThemedText>
              </View>
              <TextInput
                style={[
                  styles.contentInput,
                  { color: color.text }
                ]}
                placeholder={t("post.placeholders.contentEdit")}
                placeholderTextColor={color.placeholder}
                multiline
                value={content}
                onChangeText={setContent}
                textAlignVertical="top"
                maxLength={2000}
              />
            </View>

            <View style={styles.section}>
              <ThemedText style={[styles.label, { color: color.textSecondary, marginBottom: 12 }]}>
                {t("post.labels.attachedRoomReadonly")}
              </ThemedText>
              <View style={[styles.roomCard, { backgroundColor: color.card, borderColor: color.border }]}>
                <Image
                  source={{ uri: post.room.imageUrls[0] }}
                  style={styles.roomImg}
                  contentFit="cover"
                />
                <View style={styles.roomInfo}>
                  <ThemedText type="defaultSemiBold" numberOfLines={1}>{post.room.title}</ThemedText>
                  <ThemedText style={[styles.roomPrice, { color: color.tint }]}>
                    {t("post.pricePerMonthShort", {
                      amount: post.room.price.toLocaleString("vi-VN"),
                    })}
                  </ThemedText>
                  <View style={styles.roomMeta}>
                    <Ionicons name="location-outline" size={12} color={color.textSecondary} />
                    <ThemedText style={[styles.roomAddress, { color: color.textSecondary }]} numberOfLines={1}>
                      {post.room.address.district}, {post.room.address.city}
                    </ThemedText>
                  </View>
                </View>
              </View>
            </View>

            <View style={{ height: 40 }} />
          </ScrollView>
        </KeyboardAvoidingView>

        {/* Status Picker Modal */}
        <Modal
          visible={isStatusPickerVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setStatusPickerVisible(false)}
        >
          <Pressable 
            style={styles.pickerOverlay} 
            onPress={() => setStatusPickerVisible(false)}
          >
            <View style={[styles.pickerContent, { backgroundColor: color.card, borderColor: color.border }]}>
              <ThemedText style={styles.pickerTitle}>{t("post.selectStatus")}</ThemedText>
              {STATUS_OPTIONS.map((opt) => {
                const isActive = status === opt.value;
                return (
                  <Pressable
                    key={opt.value}
                    style={[styles.pickerOption, { borderBottomColor: color.border }]}
                    onPress={() => {
                      setStatus(opt.value);
                      setStatusPickerVisible(false);
                    }}
                  >
                    <ThemedText style={{ color: isActive ? color.tint : color.text, fontWeight: isActive ? "700" : "400" }}>
                      {t(opt.labelKey)}
                    </ThemedText>
                    {isActive && <Ionicons name="checkmark" size={20} color={color.tint} />}
                  </Pressable>
                );
              })}
            </View>
          </Pressable>
        </Modal>
      </ThemedView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  closeBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  saveBtn: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 70,
    alignItems: "center",
  },
  saveBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },
  body: {
    padding: 20,
  },
  profileSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 24,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: "hidden",
  },
  avatarImg: {
    width: "100%",
    height: "100%",
  },
  userName: {
    fontSize: 16,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: 4,
    gap: 4,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: "600",
  },
  inputContainer: {
    marginBottom: 32,
  },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  charCount: {
    fontSize: 11,
  },
  titleInput: {
    fontSize: 22,
    fontWeight: "700",
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  contentInput: {
    fontSize: 16,
    lineHeight: 24,
    minHeight: 150,
    paddingTop: 8,
  },
  section: {
    marginBottom: 32,
  },
  roomCard: {
    flexDirection: "row",
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
    borderCurve: "continuous",
  },
  roomImg: {
    width: 100,
    height: 100,
  },
  roomInfo: {
    flex: 1,
    padding: 12,
    justifyContent: "center",
    gap: 4,
  },
  roomPrice: {
    fontSize: 15,
    fontWeight: "700",
  },
  roomMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  roomAddress: {
    fontSize: 12,
    flex: 1,
  },
  pickerOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  pickerContent: {
    width: "100%",
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },
  pickerTitle: {
    fontSize: 16,
    fontWeight: "700",
    padding: 16,
    textAlign: "center",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(150,150,150,0.3)",
  },
  pickerOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});
