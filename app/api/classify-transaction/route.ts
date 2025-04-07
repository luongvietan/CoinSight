import { NextResponse } from "next/server";
import { db } from "@/lib/firebase/config";
import { doc, getDoc } from "firebase/firestore";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { description, userId } = body;

    if (!description || !userId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Lấy danh mục của người dùng từ Firestore
    const userDoc = await getDoc(doc(db, "users", userId));

    if (!userDoc.exists()) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userData = userDoc.data();
    const userCategories = userData.categories || [
      "food",
      "shopping",
      "bills",
      "entertainment",
      "other",
    ];

    // Gửi yêu cầu phân loại đến OpenAI
    const prompt = `Phân loại "${description}" vào 1 trong ${
      userCategories.length
    } nhóm: 
    [${userCategories.join(", ")}]. Chỉ trả lời bằng 1 từ.`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const response = await openai.chat.completions.create(
        {
          model: "gpt-3.5-turbo",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.7,
        },
        { signal: controller.signal }
      );

      clearTimeout(timeoutId);

      const category = response.choices[0].message.content?.trim();

      // Kiểm tra xem danh mục trả về có nằm trong danh sách danh mục của người dùng không
      const finalCategory = userCategories.includes(category || "")
        ? category
        : "other";

      return NextResponse.json({ category: finalCategory });
    } catch (error) {
      if (error.name === "AbortError") {
        console.log("Request timed out");
        return NextResponse.json({ category: "other" });
      }
      console.error("Error classifying transaction:", error);
      return NextResponse.json(
        { error: "Failed to classify transaction" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error classifying transaction:", error);
    return NextResponse.json(
      { error: "Failed to classify transaction" },
      { status: 500 }
    );
  }
}
export async function deleteOldTransactions(userId) {
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

  const q = query(
    collection(db, "transactions"),
    where("userId", "==", userId),
    where("date", "<", oneYearAgo)
  );

  const snapshot = await getDocs(q);

  // Xóa theo batch để tối ưu
  const batch = db.batch();
  snapshot.docs.forEach((doc) => {
    batch.delete(doc.ref);
  });

  return batch.commit();
}
