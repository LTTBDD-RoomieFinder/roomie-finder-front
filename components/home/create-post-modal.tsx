import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
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
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { UserAvatar } from "@/components/ui/user-avatar";
import { RoomResponse } from "@/data/response";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useLanguage } from "@/hooks/use-language";
import { postService } from "@/services/post-service";
import { useAuthStore } from "@/stores/useAuthStore";
import { RoomSelectorModal } from "./room-selector-modal";
import { STATUS_OPTIONS } from "@/constants/post-constants";
import { PostStatus } from "@/types/PostStatus";

type Props = {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
};

export function CreatePostModal({ visible, onClose, onSuccess }: Props) {
  const { color } = useAppTheme();
  const { t } = useLanguage();
  const user = useAuthStore((state) => state.user);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [selectedRoom, setSelectedRoom] = useState<RoomResponse | null>(null);
  const [isRoomSelectorVisible, setRoomSelectorVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<PostStatus>("PUBLISHED");
  const [isStatusPickerVisible, setStatusPickerVisible] = useState(false);
  const insets = useSafeAreaInsets();

  const resetState = () => {
    setTitle("");
    setContent("");
    setSelectedRoom(null);
    setStatus("PUBLISHED");
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handlePost = async () => {
    if (!title.trim()) {
      Alert.alert(t("post.alerts.missingTitleTitle"), t("post.alerts.missingTitleMessage"));
      return;
    }
    if (!selectedRoom) {
      Alert.alert(t("post.alerts.missingRoomTitle"), t("post.alerts.missingRoomMessage"));
      return;
    }

    try {
      setSubmitting(true);
      await postService.createPost({
        title: title.trim(),
        content: content.trim(),
        roomId: selectedRoom.id,
        status: status,
      });
      resetState();
      onSuccess?.();
      onClose();
    } catch (e: any) {
      Alert.alert(t("common.error"), e?.toString() ?? t("post.alerts.createFailed"));
    } finally {
      setSubmitting(false);
    }
  };

  const canPost = title.trim().length > 0 && selectedRoom !== null && !submitting;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <ThemedView style={styles.container}>
        <KeyboardAvoidingView
          style={styles.keyboardAvoidingView}
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
            <Pressable onPress={handleClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={color.text} />
            </Pressable>
            <ThemedText type="subtitle" style={styles.headerTitle}>
              {t("post.createTitle")}
            </ThemedText>
            <Pressable
              onPress={handlePost}
              disabled={!canPost}
              style={[
                styles.postButton,
                {
                  backgroundColor: canPost ? color.tint : color.placeholder,
                  opacity: submitting ? 0.7 : 1
                }
              ]}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <ThemedText style={styles.postButtonText}>{t("post.publish")}</ThemedText>
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
                <UserAvatar
                  userId={user?.id}
                  hintUrl={user?.avatarUrl}
                  name={user?.fullName || user?.username}
                  size={52}
                  style={styles.avatarImg}
                />
              </View>
              <View style={{ flex: 1, justifyContent: "center" }}>
                <ThemedText type="defaultSemiBold" style={styles.userName}>
                  {user?.fullName || t("post.displayNameFallback")}
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
                placeholder={t("post.placeholders.title")}
                placeholderTextColor={color.placeholder}
                value={title}
                onChangeText={setTitle}
                maxLength={100}
              />
            </View>

            <View style={styles.inputContainer}>
              <View style={styles.labelRow}>
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
                placeholder={t("post.placeholders.content")}
                placeholderTextColor={color.placeholder}
                multiline
                value={content}
                onChangeText={setContent}
                textAlignVertical="top"
                maxLength={2000}
              />
            </View>

            <View style={styles.section}>
              <View style={styles.labelRow}>
                <ThemedText style={[styles.label, { color: color.textSecondary }]}>
                  {t("post.labels.attachedRoom")}
                </ThemedText>
                {!selectedRoom && (
                  <ThemedText style={{ color: color.error, fontSize: 11 }}>
                    {t("post.roomRequiredTag")}
                  </ThemedText>
                )}
              </View>

              {selectedRoom ? (
                <View style={[styles.roomCard, { backgroundColor: color.card, borderColor: color.border }]}>
                  <Pressable
                    style={styles.removeRoomButton}
                    onPress={() => setSelectedRoom(null)}
                  >
                    <View style={styles.removeIconBg}>
                      <Ionicons name="close" size={14} color="white" />
                    </View>
                  </Pressable>
                  <Image
                    source={
                      selectedRoom.imageUrls?.[0]
                        ? { uri: selectedRoom.imageUrls[0] }
                        : require("@/assets/images/placeholder.png")
                    }
                    style={styles.roomImg}
                    contentFit="cover"
                  />
                  <View style={styles.roomInfo}>
                    <ThemedText type="defaultSemiBold" numberOfLines={1}>
                      {selectedRoom.title}
                    </ThemedText>
                    <ThemedText style={[styles.roomPrice, { color: color.tint }]}>
                      {t("post.pricePerMonthShort", {
                        amount: selectedRoom.price.toLocaleString("vi-VN"),
                      })}
                    </ThemedText>
                    <View style={styles.roomMeta}>
                      <Ionicons name="location-outline" size={12} color={color.textSecondary} />
                      <ThemedText style={[styles.roomAddress, { color: color.textSecondary }]} numberOfLines={1}>
                        {selectedRoom.address.district}, {selectedRoom.address.city}
                      </ThemedText>
                    </View>
                  </View>
                </View>
              ) : (
                <Pressable
                  onPress={() => setRoomSelectorVisible(true)}
                  style={[
                    styles.attachBtn,
                    { backgroundColor: color.backgroundSecondary, borderColor: color.border }
                  ]}
                >
                  <Ionicons name="add-circle-outline" size={24} color={color.tint} />
                  <ThemedText style={{ color: color.tint, fontWeight: "600" }}>
                    {t("post.selectRoom")}
                  </ThemedText>
                </Pressable>
              )}
            </View>

            <View style={{ height: 40 }} />
          </ScrollView>

          {/* {!selectedRoom && (
            <View style={[styles.toolbar, { borderTopColor: color.border }]}>
              <Pressable 
                onPress={() => setRoomSelectorVisible(true)}
                style={styles.toolbarItem}
              >
                <Ionicons name="home" size={22} color="#4ade80" />
                <ThemedText style={styles.toolbarText}>
                  {t("post.toolbarAddRoom")}
                </ThemedText>
              </Pressable>
              <View style={styles.toolbarDivider} />
              <View style={styles.toolbarItem}>
                <Ionicons name="images" size={22} color="#4ade80" />
                <ThemedText style={styles.toolbarText}>
                  {t("post.toolbarPhotoVideo")}
                </ThemedText>
              </View>
            </View>
          )} */}
        </KeyboardAvoidingView>

        {/* Room Selector Modal */}
        <RoomSelectorModal
          visible={isRoomSelectorVisible}
          onClose={() => setRoomSelectorVisible(false)}
          onSelectRoom={(room) => {
            setSelectedRoom(room);
            setRoomSelectorVisible(false);
          }}
        />

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
  container: {
    flex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  closeButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  postButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 70,
    alignItems: "center",
  },
  postButtonText: {
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
    marginBottom: 24,
  },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  charCount: {
    fontSize: 11,
  },
  titleInput: {
    fontSize: 20,
    fontWeight: "700",
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  contentInput: {
    fontSize: 16,
    lineHeight: 24,
    minHeight: 120,
    paddingTop: 8,
  },
  section: {
    marginBottom: 32,
  },
  attachBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: "dashed",
    borderCurve: "continuous",
  },
  roomCard: {
    flexDirection: "row",
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
    borderCurve: "continuous",
    position: "relative",
  },
  removeRoomButton: {
    position: "absolute",
    top: 8,
    right: 8,
    zIndex: 10,
  },
  removeIconBg: {
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 12,
    padding: 4,
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
  toolbar: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    backgroundColor: "transparent",
  },
  toolbarItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  toolbarText: {
    fontSize: 14,
    fontWeight: "600",
  },
  toolbarDivider: {
    width: 1,
    height: 20,
    backgroundColor: "rgba(150,150,150,0.3)",
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
