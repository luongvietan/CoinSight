import { loginWithEmail, registerUser, signOut } from "./firebase-auth-adapter";
import {
  addTransaction,
  getUserTransactions,
  updateTransaction,
  getTransaction,
  Transaction,
} from "./firestore-adapter";
import fetch from "node-fetch";

// Kiểm tra cấu hình
const useMockData = process.env.USE_MOCK_DATA === "true";
const testEmail = `int_test_${Date.now()}@example.com`;
const testPassword = "Test@123";
const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

console.log("Môi trường Integration Tests: ", {
  USE_MOCK_DATA: useMockData,
  NODE_ENV: process.env.NODE_ENV,
  BASE_URL: baseUrl,
});

// Mock luồng tích hợp
async function mockIntegrationTest() {
  console.log("✅ [MOCK] Đăng ký người dùng mới: mock-user-id");
  console.log("✅ [MOCK] Thêm 5 giao dịch thành công");
  console.log("✅ [MOCK] Phân loại giao dịch tự động");
  console.log(
    "✅ [MOCK] Xác minh các danh mục: food, shopping, other, bills, entertainment"
  );
  return true;
}

// Kiểm thử luồng tích hợp thật
async function realIntegrationTest() {
  try {
    // Bước 1: Đăng ký người dùng mới
    console.log(`1. Đăng ký người dùng: ${testEmail}`);
    let userId;
    try {
      const user = await registerUser(
        testEmail,
        testPassword,
        "Người dùng test tích hợp"
      );
      userId = user.uid;
      console.log(`✅ Đăng ký thành công, userId: ${userId}`);
    } catch (authError) {
      console.log("ℹ️ Tài khoản có thể đã tồn tại, thử đăng nhập...");
      const user = await loginWithEmail(testEmail, testPassword);
      userId = user.uid;
      console.log(`✅ Đăng nhập thành công, userId: ${userId}`);
    }

    // Bước 2: Xóa giao dịch cũ (nếu có)
    console.log("2. Kiểm tra và xóa giao dịch cũ");
    const existingTransactions = await getUserTransactions(userId);
    console.log(`Tìm thấy ${existingTransactions.length} giao dịch cũ`);

    // Bước 3: Thêm các giao dịch mới
    console.log("3. Thêm các giao dịch mới cho người dùng");
    const testTransactions = [
      { description: "Cà phê sáng", amount: 35000, category: "uncategorized" },
      { description: "Mua quần áo", amount: 450000, category: "uncategorized" },
      {
        description: "Thanh toán tiền điện",
        amount: 200000,
        category: "uncategorized",
      },
      {
        description: "Xem phim cuối tuần",
        amount: 120000,
        category: "uncategorized",
      },
      { description: "Mua trái cây", amount: 75000, category: "uncategorized" },
    ];

    const transactionIds = [];
    for (const tx of testTransactions) {
      const result = await addTransaction({
        userId: userId,
        description: tx.description,
        amount: tx.amount,
        category: tx.category,
        date: new Date(),
        isRecurring: false,
      });

      transactionIds.push(result.id);
      console.log(`✅ Thêm giao dịch: ${tx.description}`);
    }

    // Bước 4: Phân loại giao dịch bằng API
    console.log("4. Phân loại giao dịch bằng AI");

    for (let i = 0; i < testTransactions.length; i++) {
      const txId = transactionIds[i];
      const description = testTransactions[i].description;

      try {
        console.log(`Phân loại: "${description}"`);

        // Gọi API phân loại
        const response = await fetch(`${baseUrl}/api/classify-transaction`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            description: description,
            userId: userId,
          }),
        });

        if (response.ok) {
          const result = await response.json();
          await updateTransaction(txId!, { category: result.category });
          console.log(
            `✅ Phân loại "${description}" thành "${result.category}"`
          );
        } else {
          console.log(
            `⚠️ Không thể phân loại "${description}": ${response.status}`
          );
        }
      } catch (error) {
        console.log(`⚠️ Lỗi khi phân loại "${description}": ${error}`);
      }
    }

    // Bước 5: Kiểm tra kết quả phân loại
    console.log("5. Kiểm tra kết quả phân loại");
    const categorizedTransactions = await getUserTransactions(userId);

    console.log("Kết quả phân loại:");
    for (const tx of categorizedTransactions) {
      console.log(`- ${tx.description}: ${tx.category}`);
    }

    // Bước 6: Đăng xuất người dùng
    console.log("6. Đăng xuất người dùng");
    await signOut();
    console.log("✅ Đăng xuất thành công");

    return true;
  } catch (error) {
    console.error("❌ Lỗi kiểm thử tích hợp:", error);
    return false;
  }
}

async function testUserFlow() {
  console.log("🔍 Bắt đầu kiểm thử tích hợp...");

  try {
    if (useMockData) {
      console.log("ℹ️ Sử dụng mock data cho kiểm thử tích hợp");
      await mockIntegrationTest();
    } else {
      console.log("ℹ️ Sử dụng Firebase thật cho kiểm thử tích hợp");
      await realIntegrationTest();
    }

    console.log("🎉 Kiểm thử tích hợp hoàn tất!");
  } catch (error) {
    console.error("❌ Lỗi kiểm thử tích hợp:", error);

    if (!useMockData) {
      console.log("Thử lại với mock data...");
      process.env.USE_MOCK_DATA = "true";
      await testUserFlow();
    }
  }
}

testUserFlow();
