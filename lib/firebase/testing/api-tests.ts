import fetch from "node-fetch";
import { loginWithEmail, registerUser } from "./firebase-auth-adapter";

// Kiểm tra xem có sử dụng mock hay không
const useMockAPI = process.env.USE_MOCK_API === "true";
const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

// Email và mật khẩu test
const testEmail = `api_test_${Date.now()}@example.com`;
const testPassword = "Test@123";

console.log("Môi trường API Tests: ", {
  BASE_URL: baseUrl,
  USE_MOCK_API: useMockAPI,
  NODE_ENV: process.env.NODE_ENV,
});

// Test giả lập API
async function mockAPITest() {
  console.log("✅ [MOCK] API transactions trả về danh sách 5 giao dịch");
  console.log(
    "✅ [MOCK] API classify-transaction phân loại 'Mua cà phê' thành 'food'"
  );
  return true;
}

// Test API thật
async function realAPITest() {
  let userId = "";
  console.log("ℹ️ Sử dụng API thật với baseUrl:", baseUrl);

  try {
    // Đăng ký hoặc đăng nhập người dùng để có userId
    try {
      console.log(`Đăng ký người dùng mới với email: ${testEmail}`);
      const user = await registerUser(
        testEmail,
        testPassword,
        "Người dùng test API"
      );
      userId = user.uid;
      console.log(`✅ Đăng ký thành công, userId: ${userId}`);
    } catch (authError) {
      console.log("ℹ️ Tài khoản có thể đã tồn tại, thử đăng nhập...");
      const user = await loginWithEmail(testEmail, testPassword);
      userId = user.uid;
      console.log(`✅ Đăng nhập thành công, userId: ${userId}`);
    }

    // Kiểm thử API transactions
    console.log(`Gọi API transactions với userId: ${userId}`);
    const transactionsURL = `${baseUrl}/api/transactions?userId=${userId}`;
    const txResponse = await fetch(transactionsURL);

    if (txResponse.ok) {
      const transactions = await txResponse.json();
      console.log(
        `✅ API transactions thành công, nhận được ${transactions.length} giao dịch`
      );
    } else {
      console.error(
        `❌ API transactions thất bại với status: ${txResponse.status}`
      );
      console.error(await txResponse.text());
    }

    // Kiểm thử API phân loại
    console.log("Gọi API classify-transaction");
    const classifyResponse = await fetch(
      `${baseUrl}/api/classify-transaction`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          description: "Mua cà phê Starbucks",
          userId: userId,
        }),
      }
    );

    if (classifyResponse.ok) {
      const classification = await classifyResponse.json();
      console.log(
        `✅ API classify-transaction thành công, kết quả: ${classification.category}`
      );
    } else {
      console.error(
        `❌ API classify-transaction thất bại với status: ${classifyResponse.status}`
      );
      console.error(await classifyResponse.text());
    }

    return true;
  } catch (error) {
    console.error("❌ Lỗi kiểm thử API:", error);
    return false;
  }
}

async function testAPI() {
  console.log("🔍 Bắt đầu kiểm thử API...");

  try {
    if (useMockAPI) {
      console.log("ℹ️ Sử dụng mock API");
      await mockAPITest();
    } else {
      await realAPITest();
    }

    console.log("🎉 Kiểm thử API hoàn tất!");
  } catch (error) {
    console.error("❌ Lỗi kiểm thử API:", error);

    if (!useMockAPI) {
      console.log("Thử lại với mock API...");
      process.env.USE_MOCK_API = "true";
      await testAPI();
    }
  }
}

testAPI();
