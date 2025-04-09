import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/firebase/config";

export async function POST(request: NextRequest) {
  try {
    // Kiểm tra xác thực
    const idToken = request.headers.get("Authorization")?.split("Bearer ")[1];
    if (!idToken) {
      return NextResponse.json(
        { error: "Unauthorized: Missing token" },
        { status: 401 }
      );
    }

    const { description } = await request.json();

    if (!description) {
      return NextResponse.json(
        { error: "Description is required" },
        { status: 400 }
      );
    }

    // Sử dụng phân loại trực tiếp thay vì gọi đến API HuggingFace
    const lowerDesc = description.toLowerCase();
    const category = fallbackClassify(lowerDesc);

    console.log(
      `[Classify] Phân loại "${description}" thành danh mục: ${category}`
    );

    return NextResponse.json({ category });
  } catch (error) {
    console.error("Error classifying transaction:", error);
    return NextResponse.json(
      { error: "Error classifying transaction", category: "other" },
      { status: 500 }
    );
  }
}

// Hàm phân loại dự phòng khi API lỗi
function fallbackClassify(lowerDesc: string): string {
  if (
    lowerDesc.includes("coffee") ||
    lowerDesc.includes("starbucks") ||
    lowerDesc.includes("ăn") ||
    lowerDesc.includes("restaurant") ||
    lowerDesc.includes("lunch") ||
    lowerDesc.includes("dinner")
  ) {
    return "food";
  } else if (
    lowerDesc.includes("grocery") ||
    lowerDesc.includes("supermarket") ||
    lowerDesc.includes("thực phẩm")
  ) {
    return "groceries";
  } else if (
    lowerDesc.includes("quần") ||
    lowerDesc.includes("áo") ||
    lowerDesc.includes("clothes") ||
    lowerDesc.includes("shirt") ||
    lowerDesc.includes("pants")
  ) {
    return "clothing";
  } else if (
    lowerDesc.includes("laptop") ||
    lowerDesc.includes("phone") ||
    lowerDesc.includes("điện thoại") ||
    lowerDesc.includes("máy tính")
  ) {
    return "electronics";
  } else if (
    lowerDesc.includes("điện") ||
    lowerDesc.includes("nước") ||
    lowerDesc.includes("bill") ||
    lowerDesc.includes("utility")
  ) {
    return "bills";
  } else if (
    lowerDesc.includes("rent") ||
    lowerDesc.includes("thuê nhà") ||
    lowerDesc.includes("mortgage")
  ) {
    return "rent";
  } else if (
    lowerDesc.includes("taxi") ||
    lowerDesc.includes("bus") ||
    lowerDesc.includes("train") ||
    lowerDesc.includes("xe")
  ) {
    return "transportation";
  } else if (
    lowerDesc.includes("doctor") ||
    lowerDesc.includes("hospital") ||
    lowerDesc.includes("medicine") ||
    lowerDesc.includes("bệnh")
  ) {
    return "healthcare";
  } else if (
    lowerDesc.includes("school") ||
    lowerDesc.includes("tuition") ||
    lowerDesc.includes("học")
  ) {
    return "education";
  } else if (
    lowerDesc.includes("phim") ||
    lowerDesc.includes("game") ||
    lowerDesc.includes("chơi") ||
    lowerDesc.includes("movie")
  ) {
    return "entertainment";
  } else if (
    lowerDesc.includes("travel") ||
    lowerDesc.includes("hotel") ||
    lowerDesc.includes("flight") ||
    lowerDesc.includes("du lịch")
  ) {
    return "travel";
  } else if (
    lowerDesc.includes("gift") ||
    lowerDesc.includes("present") ||
    lowerDesc.includes("quà")
  ) {
    return "gifts";
  } else if (
    lowerDesc.includes("gym") ||
    lowerDesc.includes("fitness") ||
    lowerDesc.includes("thể dục")
  ) {
    return "fitness";
  } else if (
    lowerDesc.includes("netflix") ||
    lowerDesc.includes("spotify") ||
    lowerDesc.includes("subscription")
  ) {
    return "subscriptions";
  } else if (lowerDesc.includes("salary") || lowerDesc.includes("lương")) {
    return "salary";
  } else if (lowerDesc.includes("freelance") || lowerDesc.includes("tự do")) {
    return "freelance";
  } else if (
    lowerDesc.includes("investment") ||
    lowerDesc.includes("stock") ||
    lowerDesc.includes("đầu tư")
  ) {
    return "investments";
  } else if (
    lowerDesc.includes("mua") ||
    lowerDesc.includes("buy") ||
    lowerDesc.includes("purchase")
  ) {
    return "shopping";
  } else {
    return "other";
  }
}
