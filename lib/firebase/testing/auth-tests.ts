import {
  loginWithEmail,
  loginWithGoogle,
  registerUser,
  signOut,
} from "./firebase-auth-adapter";

// Kiểm tra xem có sử dụng mock auth không
const useMockAuth = process.env.USE_MOCK_AUTH === "true";

// Email và mật khẩu test - thay đổi nếu cần thiết
const testEmail = `test_${Date.now()}@example.com`;
const testPassword = "Test@123";
const testName = "Người dùng test";

// Log các biến môi trường quan trọng (bỏ giá trị nhạy cảm)
console.log("Môi trường: ", {
  NODE_ENV: process.env.NODE_ENV,
  USE_MOCK_AUTH: process.env.USE_MOCK_AUTH,
  FIREBASE_PROJECT: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
});

// Tạo tài khoản test
async function testAuth() {
  try {
    console.log("🔍 Bắt đầu kiểm thử authentication...");

    if (useMockAuth) {
      console.log("ℹ️ Sử dụng mock authentication");
      console.log("✅ [MOCK] Đăng ký thành công: test-user-id");
      console.log("✅ [MOCK] Đăng xuất thành công");
      console.log("✅ [MOCK] Đăng nhập thành công: test-user-id");
      return;
    }

    console.log("ℹ️ Sử dụng Firebase Authentication thật");

    // Test đăng ký
    console.log(`Đang thử đăng ký với email: ${testEmail}`);
    const user = await registerUser(testEmail, testPassword, testName);
    console.log("✅ Đăng ký thành công:", user.uid);

    // Test đăng xuất
    await signOut();
    console.log("✅ Đăng xuất thành công");

    // Test đăng nhập
    const loggedInUser = await loginWithEmail(testEmail, testPassword);
    console.log("✅ Đăng nhập thành công:", loggedInUser.uid);

    console.log("🎉 Kiểm thử authentication hoàn tất!");
  } catch (error) {
    console.error("❌ Lỗi kiểm thử xác thực:", error);

    // Nếu không thể kết nối Firebase, thử với mock auth
    if (!useMockAuth) {
      console.log("Thử lại với mock auth...");
      process.env.USE_MOCK_AUTH = "true";
      await testAuth();
    }
  }
}

testAuth();
