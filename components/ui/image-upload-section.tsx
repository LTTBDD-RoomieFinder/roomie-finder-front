import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Image, ScrollView, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { ThemedText } from "@/components/themed-text";
import { Ionicons } from "@expo/vector-icons";
import { IMAGE_CONSTANTS } from '@/constants/room-constants';

type Props = {
  data: string[]; // Danh sách URI của ảnh đã chọn
  onChange: (uris: string[]) => void; // Callback khi danh sách ảnh thay đổi
}

export default function ImageUploadSection({ data, onChange }: Props) {
  const [images, setImages] = useState<string[]>(data);

  const pickImage = async () => {
    // Yêu cầu quyền truy cập thư viện ảnh
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Thông báo', 'Chúng tôi cần quyền truy cập thư viện ảnh để tiếp tục!');
      return;
    }

    // Mở bộ sưu tập
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true, // Cho phép chọn nhiều ảnh
      selectionLimit: IMAGE_CONSTANTS.IMAGE_PICKER.MAX_SELECTION, // Giới hạn tối đa 
      quality: 0.7, // Nén ảnh nhẹ để tối ưu dung lượng
    });

    if (!result.canceled) {
      // Lấy danh sách URI của các ảnh đã chọn
      const selectedUris = result.assets.map(asset => asset.uri);
      const newImages = [...images, ...selectedUris].slice(0, IMAGE_CONSTANTS.IMAGE_PICKER.MAX_COUNT);
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
      <ThemedText style={styles.label}>Hình ảnh phòng</ThemedText>
      
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imageScroll}>
        {/* Nút bấm để chọn ảnh */}
        <TouchableOpacity style={styles.uploadButton} onPress={pickImage}>
          <Ionicons name="camera" size={32} color="#888" />
          <ThemedText style={styles.uploadText}>Thêm ảnh</ThemedText>
        </TouchableOpacity>

        {/* Hiển thị danh sách ảnh đã chọn */}
        {images.map((uri, index) => (
          <View key={index} style={styles.imageWrapper}>
            <Image source={{ uri }} style={styles.imagePreview} />
            <TouchableOpacity 
              style={styles.deleteBadge} 
              onPress={() => removeImage(index)}
            >
              <Ionicons name="close-circle" size={20} color="red" />
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  label: {
    fontWeight: 'bold',
    marginBottom: 10,
  },
  imageScroll: {
    flexDirection: 'row',
  },
  uploadButton: {
    width: 100,
    height: 100,
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderStyle: 'dashed',
    marginRight: 10,
  },
  uploadText: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
  },
  imageWrapper: {
    position: 'relative',
    marginRight: 10,
  },
  imagePreview: {
    width: 100,
    height: 100,
    borderRadius: 12,
  },
  deleteBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: 'white',
    borderRadius: 10,
  },
});