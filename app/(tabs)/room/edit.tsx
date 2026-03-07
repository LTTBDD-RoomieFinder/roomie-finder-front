import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import { Alert, Pressable, StyleSheet, View, ActivityIndicator } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { RoomResponse } from "@/data/response";
import { useAppTheme } from "@/hooks/use-app-theme";
import { roomService } from "@/services/room-service";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

import { RoomForm } from "@/components/room/room-form";
import { RoomFormValues } from "@/types/Room";
import { RoomCreateRequest } from "@/data/request";

export default function EditRoomScreen() {
  const { id } = useLocalSearchParams();
  const { color } = useAppTheme();

  const [room, setRoom] = useState<RoomResponse | null>(null);
  const [initialValues, setInitialValues] = useState<RoomFormValues | null>(null);

  useEffect(() => {
    fetchRoom();
  }, []);

  const fetchRoom = async () => {
    try {
      const res = await roomService.getRoomById(Number(id));
      const data = res.data;
      setRoom(data);

      const mappedInitialValues: RoomFormValues = {
        title: data.title,
        price: data.price,
        area: data.area,
        capacity: data.capacity,
        roomType: data.roomType,
        genderRequirement: data.genderRequirement,
        description: data.description || "",
        address: {
          city: data.address.city,
          district: data.address.district,
          ward: data.address.ward,
          streetAddress: data.address.streetAddress,
        },
        images: data.imageUrls || [],
        amenities: data.amenities?.map((a: any) => a.id) || [],
      };
      setInitialValues(mappedInitialValues);
    } catch (err) {
      console.error(err);
      Alert.alert("Lỗi", "Không thể lấy thông tin phòng");
    }
  };

  const handleUpdate = async (data: RoomCreateRequest) => {
    try {
      await roomService.updateRoom(Number(id), data);
      Alert.alert("Thành công", "Đã cập nhật phòng thành công");
      router.back();
    } catch (err) {
      console.error(err);
      Alert.alert("Lỗi", "Cập nhật thất bại");
    }
  };

  return (
    <ThemedView style={styles.root}>
      {/* HEADER */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={[styles.iconButton, { borderColor: color.border }]}
        >
          <MaterialIcons name="arrow-back" size={20} color={color.text} />
        </Pressable>

        <ThemedText type="subtitle" style={styles.headerTitle}>
          Sửa phòng
        </ThemedText>

        <View style={styles.iconButtonPlaceholder} />
      </View>

      {initialValues ? (
        <RoomForm
          initialValues={initialValues}
          submitLabel="Cập nhật phòng"
          onSubmit={handleUpdate}
        />
      ) : (
        <ActivityIndicator size="large" color={color.primary} style={{ marginTop: 20 }} />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  root: {
    paddingTop: 56,
    flex: 1,
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