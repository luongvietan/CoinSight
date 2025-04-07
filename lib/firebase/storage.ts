import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { app, auth, storage } from "./config";
import { uploadToCloudinary } from "../upload-services/cloudinary";

/**
 * Upload file lên dịch vụ lưu trữ (Firebase Storage hoặc Cloudinary)
 *
 * Phương pháp 1: Upload trực tiếp tới Firebase Storage (có thể gặp lỗi CORS)
 * Phương pháp 2: Upload qua API proxy (giải quyết vấn đề CORS)
 * Phương pháp 3: Upload lên Cloudinary (không có vấn đề CORS)
 *
 * Mặc định sẽ thử phương pháp 1, nếu gặp lỗi CORS sẽ sử dụng phương pháp 3
 */
export const uploadFile = async (
  file: File,
  path: string,
  useCloudinary: boolean = false
): Promise<string> => {
  try {
    // Kiểm tra xem có muốn sử dụng Cloudinary không
    if (useCloudinary) {
      // Sử dụng Cloudinary nếu đã cấu hình
      if (process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME) {
        try {
          // Trích xuất ID người dùng từ path
          const userId = path.split("/")[1] || "unknown";
          return await uploadToCloudinary(file, `users/${userId}`);
        } catch (cloudinaryError) {
          console.error(
            "Lỗi upload lên Cloudinary, thử Firebase Storage:",
            cloudinaryError
          );
        }
      }
    }

    // Phương pháp 1: Upload trực tiếp lên Firebase Storage
    try {
      const storageRef = ref(storage, path);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      return downloadURL;
    } catch (directError) {
      console.error("Lỗi upload trực tiếp, thử qua API proxy:", directError);

      // Phương pháp 2: Sử dụng API proxy
      if (typeof window !== "undefined") {
        try {
          // Lấy ID người dùng từ đường dẫn
          const userId = path.split("/")[1];

          // Tạo formData
          const formData = new FormData();
          formData.append("file", file);
          formData.append("userId", userId);

          // Lấy token xác thực hiện tại
          const token = auth.currentUser
            ? await auth.currentUser.getIdToken()
            : "";

          // Gọi API route
          const response = await fetch("/api/upload", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
            },
            body: formData,
          });

          if (!response.ok) {
            throw new Error(`Upload failed: ${response.statusText}`);
          }

          const result = await response.json();
          return result.url;
        } catch (proxyError) {
          console.error("Lỗi upload qua proxy:", proxyError);
          throw proxyError;
        }
      } else {
        throw directError;
      }
    }
  } catch (error) {
    console.error("Lỗi upload file:", error);

    // Nếu đang ở chế độ development, trả về URL avatar tạm thời
    if (
      typeof window !== "undefined" &&
      window.location.hostname === "localhost"
    ) {
      const userName = auth.currentUser?.displayName || "User";
      return `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
        userName
      )}`;
    }

    // Trả về một URL ảnh mặc định hoặc empty string để tránh crash ứng dụng
    return "";
  }
};

// Xóa file từ Firebase Storage
export const deleteFile = async (path: string): Promise<void> => {
  try {
    const storageRef = ref(storage, path);
    await deleteObject(storageRef);
  } catch (error) {
    console.error("Lỗi xóa file:", error);
    // Không throw error để tránh crash ứng dụng
  }
};
