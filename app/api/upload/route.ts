import { NextResponse } from "next/server";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { app } from "@/lib/firebase/config";
import { auth } from "@/lib/firebase/config";

const storage = getStorage(app);

export async function POST(request: Request) {
  try {
    // Kiểm tra xác thực
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Lấy form data từ request
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const userId = formData.get("userId") as string;

    if (!file || !userId) {
      return NextResponse.json(
        { error: "Missing file or userId" },
        { status: 400 }
      );
    }

    // Tạo path cho file
    const fileExtension = file.name.split(".").pop();
    const path = `users/${userId}/profile.${fileExtension || "jpg"}`;

    // Upload file lên Firebase Storage
    const storageRef = ref(storage, path);
    const result = await uploadBytes(storageRef, await file.arrayBuffer());

    // Lấy URL download
    const downloadURL = await getDownloadURL(result.ref);

    return NextResponse.json({ url: downloadURL });
  } catch (error: any) {
    console.error("Lỗi upload file:", error);
    return NextResponse.json(
      { error: error.message || "Failed to upload file" },
      { status: 500 }
    );
  }
}

// Tăng kích thước tối đa của request
export const config = {
  api: {
    bodyParser: false,
    responseLimit: "10mb",
  },
};
