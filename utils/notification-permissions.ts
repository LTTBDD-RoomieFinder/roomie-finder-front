import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

/** Phải trùng `expo-notifications` plugin `defaultChannel` trong `app.json`. */
export const DEFAULT_NOTIFICATION_CHANNEL_ID = "default";

/**
 * Có thể hiển thị thông báo (đã cấp quyền, hoặc iOS bản thử tạm thời).
 */
export function notificationPermissionsAllowPresentation(
  s: Notifications.NotificationPermissionsStatus,
): boolean {
  if (s.granted) return true;
  if (s.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL) return true;
  return false;
}

/**
 * Kênh Android: bắt buộc từ Android 8+; nếu không, thông báo cục bộ dễ fail / bị tắt hết.
 * `importance: HIGH` để người dùng thấy hộp thoại hệ thống rõ.
 */
export async function ensureDefaultAndroidChannel(): Promise<void> {
  if (Platform.OS !== "android") return;
  await Notifications.setNotificationChannelAsync(DEFAULT_NOTIFICATION_CHANNEL_ID, {
    name: "Thông báo",
    description: "Tin nhắn, lời mời và cập nhật từ Roomie",
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: "#4F46E5",
    sound: "default",
    enableVibrate: true,
    showBadge: true,
  });
}

const IOS_REQUEST: Notifications.NotificationPermissionsRequest = {
  ios: {
    allowAlert: true,
    allowBadge: true,
    allowSound: true,
  },
};

/**
 * Hệ thống hiển thị hội thoại xin quyền (nếu chưa trả lời hoặc chưa granted).
 * Gọi sau khi người dùng đã đăng nhập — thường 1 lần mỗi phiên tạo ổn định.
 */
export async function requestNotificationPermissionsForPushAsync(): Promise<Notifications.NotificationPermissionsStatus> {
  await ensureDefaultAndroidChannel();
  const current = await Notifications.getPermissionsAsync();
  if (notificationPermissionsAllowPresentation(current)) {
    return current;
  }
  return await Notifications.requestPermissionsAsync(IOS_REQUEST);
}

/**
 * Bắn thông báo local chỉ khi app đã có quyền (tránh lỗi khi từ chối).
 */
export async function scheduleLocalNotificationIfPermitted(
  input: Parameters<typeof Notifications.scheduleNotificationAsync>[0],
): Promise<string | void> {
  const perms = await Notifications.getPermissionsAsync();
  if (!notificationPermissionsAllowPresentation(perms)) return;
  if (Platform.OS === "android" && input && input.trigger == null) {
    return await Notifications.scheduleNotificationAsync({
      ...input,
      trigger: { channelId: DEFAULT_NOTIFICATION_CHANNEL_ID },
    });
  }
  return await Notifications.scheduleNotificationAsync(input);
}
