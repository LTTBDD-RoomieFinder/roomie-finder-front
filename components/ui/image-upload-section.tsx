import { ThemedText } from "@/components/themed-text";
import { IMAGE_CONSTANTS } from "@/constants/room-constants";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useLanguage } from "@/hooks/use-language";
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
  const { color, scheme } = useAppTheme();
  const { t } = useLanguage();
  const isDark = scheme === "dark";

  const [images, setImages] = useState<string[]>(data || []);

  useEffect(() => {
    setImages(data || []);
  }, [data]);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== "granted") {
      Alert.alert(
        t("common.permissionTitle"),
        t("common.mediaLibraryPermission"),
      );
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

  if (isProfile) {
    return (
      <TouchableOpacity
        style={styles.avatarWrapper}
        onPress={pickImage}
        activeOpacity={0.85}
      >
        {images[0] ? (
          <Image source={{ uri: images[0] }} style={styles.avatarImg} />
        ) : (
          <View
            style={[
              styles.avatarImg,
              styles.avatarPlaceholder,
              {
                backgroundColor: isDark ? color.card : "#f0f0f0",
                borderColor: color.border,
              },
            ]}
          >
            <Ionicons name="person" size={44} color={color.textSecondary} />
          </View>
        )}

        <View
          style={[
            styles.editBadge,
            { backgroundColor: color.primary, borderColor: color.background },
          ]}
        >
          <Ionicons name="pencil" size={14} color="#fff" />
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.roomContainer}>
      <ThemedText style={[styles.label, { color: color.text }]}>
        {t("room.form.roomPhotos")}
      </ThemedText>

      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <TouchableOpacity
          style={[
            styles.uploadButton,
            {
              backgroundColor: isDark ? color.card : "#f5f5f5",
              borderColor: color.border,
            },
          ]}
          onPress={pickImage}
        >
          <Ionicons name="camera" size={32} color={color.textSecondary} />
          <ThemedText style={[styles.uploadText, { color: color.textSecondary }]}>
            {t("room.form.addPhoto")}
          </ThemedText>
        </TouchableOpacity>

        {images.map((uri, index) => (
          <View key={index} style={styles.imageWrapper}>
            <Image source={{ uri }} style={styles.image} />
            <TouchableOpacity
              style={[styles.deleteBadge, { backgroundColor: color.background }]}
              onPress={() => removeImage(index)}
            >
              <Ionicons name="close-circle" size={20} color={color.error} />
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  avatarWrapper: {
    alignSelf: "center",
    marginBottom: 4,
    position: "relative",
  },
  avatarImg: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarPlaceholder: {
    borderWidth: 1.5,
    justifyContent: "center",
    alignItems: "center",
  },
  editBadge: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
    // shadow cho iOS
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    // elevation Android
    elevation: 3,
  },

  roomContainer: {
    marginBottom: 20,
  },
  label: {
    fontWeight: "bold",
    marginBottom: 10,
  },
  uploadButton: {
    width: 100,
    height: 100,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderStyle: "dashed",
    marginRight: 10,
  },
  uploadText: {
    fontSize: 12,
    marginTop: 4,
  },
  imageWrapper: {
    position: "relative",
    marginRight: 10,
  },
  image: {
    width: 100,
    height: 100,
    borderRadius: 12,
  },
  deleteBadge: {
    position: "absolute",
    top: -5,
    right: -5,
    borderRadius: 12,
  },
});