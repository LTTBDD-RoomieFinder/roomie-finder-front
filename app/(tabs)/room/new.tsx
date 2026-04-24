import { useRouter } from "expo-router";
import React from "react";
import { Alert, Pressable, StyleSheet, View } from "react-native";

import { RoomForm } from "@/components/room/room-form";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useLanguage } from "@/hooks/use-language";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { EMPTY_ROOM_FORM } from "@/constants/room-constants";
import { roomService } from "@/services/room-service";
import { RoomCreateRequest } from "@/data/request";

export default function NewRoomScreen() {
  const router = useRouter();
  const { color } = useAppTheme();
  const { t } = useLanguage();

  const handleSubmit = async (data: RoomCreateRequest) => {
    await roomService.createRoom(data);
    Alert.alert(t("common.success"), t("room.createSuccess"));
    router.replace("/(tabs)/room");
  };

  return (
    <ThemedView style={styles.root}>
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={[styles.iconButton, { borderColor: color.border }]}
        >
          <MaterialIcons name="arrow-back" size={20} color={color.text} />
        </Pressable>

        <ThemedText type="subtitle" style={styles.headerTitle}>
          Thêm phòng mới
        </ThemedText>
        <View style={styles.iconButtonPlaceholder} />
      </View>

      <RoomForm
        initialValues={EMPTY_ROOM_FORM}
        submitLabel={t("room.submitCreate")}
        onSubmit={handleSubmit}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    paddingTop: 56,
  },
  header: {
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
  },
  iconButton: {
    width: 38,
    height: 38,
    borderWidth: 1,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  iconButtonPlaceholder: {
    width: 38,
  },
});
