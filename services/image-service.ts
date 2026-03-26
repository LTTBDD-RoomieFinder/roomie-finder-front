export const imageService = {
  uploadToCloudinary: async (uri: string) => {
    if (uri.startsWith("http")) {
      return uri;
    }

    const cloudName = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME || "dayeqtplt";
    const uploadPreset = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "room_uploads";
    if (!uploadPreset) {
      throw new Error("Cloudinary upload preset is missing");
    }

    const formData = new FormData();

    // Web: ImagePicker often returns blob/data URL. Convert to Blob for Cloudinary.
    if (typeof window !== "undefined") {
      const fileResponse = await fetch(uri);
      const blob = await fileResponse.blob();
      formData.append("file", blob);
    } else {
      // Native: send local file uri.
      formData.append("file", {
        uri,
        type: "image/jpeg",
        name: "upload.jpg",
      } as any);
    }

    formData.append("upload_preset", uploadPreset);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      {
        method: "POST",
        body: formData,
      },
    );

    const data = await response.json();
    if (!response.ok) {
      const message =
        data?.error?.message ||
        data?.message ||
        "Upload image failed";
      throw new Error(message);
    }

    if (!data?.secure_url) {
      throw new Error("Cloudinary did not return secure_url");
    }

    return data.secure_url;
  },
};