import { ThemedText } from "@/components/themed-text";
import { IMAGE_CONSTANTS } from "@/constants/room-constants";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

type Props = {
  isProfile?: boolean;
  data: string[];
  onChange: (uris: string[]) => void;
};

export default function ImageUploadSection({
  data,
  onChange,
  isProfile = false,
}: Props) {
  const [images, setImages] = useState<string[]>(data || []);

  // 🔥 Sync lại khi parent thay đổi (fix bug UI không update)
  useEffect(() => {
    setImages(data || []);
  }, [data]);

  const pickImage = async () => {
    const { status } =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== "granted") {
      Alert.alert("Thông báo", "Cần quyền truy cập thư viện ảnh!");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: !isProfile,
      selectionLimit: isProfile
        ? 1
        : IMAGE_CONSTANTS.IMAGE_PICKER.MAX_SELECTION,
      quality: 0.7,
    });

    if (!result.canceled) {
      const selectedUris = result.assets.map((asset) => asset.uri);

      let newImages: string[];

      if (isProfile) {
        // 🔥 chỉ 1 ảnh → replace luôn
        newImages = [selectedUris[0]];
      } else {
        newImages = [...images, ...selectedUris].slice(
          0,
          IMAGE_CONSTANTS.IMAGE_PICKER.MAX_COUNT
        );
      }

      setImages(newImages);
      onChange(newImages);
    }
  };

  const removeImage = (index: number) => {
    const newImages = [...images];
    newImages.splice(index, 1);
    setImages(newImages);
    onChange(newImages);
  };

  return (
    <View style={styles.container}>
      <ThemedText style={styles.label}>
        {isProfile ? "Ảnh đại diện" : "Hình ảnh phòng"}
      </ThemedText>

      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {/* Upload button */}
        <TouchableOpacity style={styles.uploadButton} onPress={pickImage}>
          <Ionicons name="camera" size={32} color="#888" />
          <ThemedText style={styles.uploadText}>
            {isProfile ? "Chọn avatar" : "Thêm ảnh"}
          </ThemedText>
        </TouchableOpacity>

        {/* ===== PROFILE MODE ===== */}
        {isProfile ? (
          images.length > 0 && (
            <View style={styles.imageWrapper}>
              <Image source={{ uri: images[0] }} style={styles.avatar} />

              <TouchableOpacity
                style={styles.deleteBadge}
                onPress={() => {
                  setImages([]);
                  onChange([]);
                }}
              >
                <Ionicons name="close-circle" size={22} color="red" />
              </TouchableOpacity>
            </View>
          )
        ) : (
          /* ===== ROOM MODE ===== */
          images.map((uri, index) => (
            <View key={index} style={styles.imageWrapper}>
              <Image source={{ uri }} style={styles.image} />

              <TouchableOpacity
                style={styles.deleteBadge}
                onPress={() => removeImage(index)}
              >
                <Ionicons name="close-circle" size={20} color="red" />
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },

  label: {
    fontWeight: "bold",
    marginBottom: 10,
  },

  uploadButton: {
    width: 100,
    height: 100,
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    borderStyle: "dashed",
    marginRight: 10,
  },

  uploadText: {
    fontSize: 12,
    color: "#888",
    marginTop: 4,
  },

  imageWrapper: {
    position: "relative",
    marginRight: 10,
  },

  // 🔥 room image
  image: {
    width: 100,
    height: 100,
    borderRadius: 12,
  },

  // 🔥 avatar tròn
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },

  deleteBadge: {
    position: "absolute",
    top: -5,
    right: -5,
    backgroundColor: "#fff",
    borderRadius: 12,
  },
});