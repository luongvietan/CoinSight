// Cloud Functions cho Firebase
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const { OpenAI } = require("openai");

admin.initializeApp();
const db = admin.firestore();

// Khởi tạo OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Cloud Function phân loại giao dịch tự động
exports.classifyTransaction = functions.firestore
  .document("transactions/{transactionId}")
  .onCreate(async (snapshot, context) => {
    const { description, userId } = snapshot.data();

    if (!description || !userId) {
      console.log("Missing required fields for transaction classification");
      return null;
    }

    try {
      // Lấy danh mục người dùng
      const userDoc = await db.collection("users").doc(userId).get();
      if (!userDoc.exists) {
        console.log("User not found");
        return null;
      }

      const userCategories = userDoc.data().categories || [
        "food",
        "shopping",
        "bills",
        "entertainment",
        "other",
      ];

      // Gọi OpenAI để phân loại
      const prompt = `Phân loại "${description}" vào 1 trong ${
        userCategories.length
      } nhóm: 
      [${userCategories.join(", ")}]. Chỉ trả lời bằng 1 từ.`;

      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
      });

      const category = response.choices[0].message.content.trim();

      // Cập nhật giao dịch với danh mục
      return snapshot.ref.update({
        category: userCategories.includes(category) ? category : "other",
      });
    } catch (error) {
      console.error("Error classifying transaction:", error);
      return null;
    }
  });
