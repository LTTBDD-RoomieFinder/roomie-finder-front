export const imageService = {
  uploadToCloudinary: async (uri: string) => {
    if (uri.startsWith('http')) {
      return uri;
    }

    const cloudName = "dayeqtplt"; // Lấy trong Dashboard Cloudinary
    const uploadPreset = "room_uploads";

    // Khởi tạo FormData
    const formData = new FormData();
    
    // Đối với React Native, cấu hình file upload như sau:
    formData.append("file", {
      uri: uri,
      type: "image/jpeg",
      name: "upload.jpg",
    } as any);
    
    formData.append("upload_preset", uploadPreset);

    try {
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        {
          method: "POST",
          body: formData,
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      const data = await response.json();
      return data.secure_url; // Đây là URL ảnh để lưu vào DB
    } catch (error) {
      console.error("Upload error:", error);
      throw error;
    }
  },
};