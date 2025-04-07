/**
 * Dịch vụ upload ảnh lên Cloudinary
 * Lưu ý: Cần đăng ký tài khoản Cloudinary và thêm các biến môi trường:
 * - NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
 * - NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET
 */

/**
 * Upload ảnh lên Cloudinary
 * @param file File ảnh cần upload
 * @param folder Thư mục lưu trữ trên Cloudinary (tùy chọn)
 * @returns URL của ảnh đã upload
 */
export const uploadToCloudinary = async (
  file: File,
  folder: string = "user-avatars"
): Promise<string> => {
  try {
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

    if (!cloudName || !uploadPreset) {
      throw new Error(
        "Thiếu cấu hình Cloudinary. Kiểm tra biến môi trường NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME và NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET"
      );
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", uploadPreset);
    formData.append("folder", folder);

    // Basic transformation: crop và resize
    formData.append("transformation", "c_fill,w_300,h_300,g_face");

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      {
        method: "POST",
        body: formData,
      }
    );

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data.secure_url;
  } catch (error) {
    console.error("Lỗi upload lên Cloudinary:", error);
    throw error;
  }
};
