import {
  addTransaction,
  getTransaction,
  getUserTransactions,
  updateTransaction,
  deleteTransaction,
  Transaction,
} from "./firestore-adapter";
import { loginWithEmail, registerUser } from "./firebase-auth-adapter";

// Kiểm tra cấu hình
const useMockData = process.env.USE_MOCK_DATA === "true";
const testEmail = `firestore_test_${Date.now()}@example.com`;
const testPassword = "Test@123";

// Log các biến môi trường quan trọng
console.log("Môi trường Firestore Tests: ", {
  NODE_ENV: process.env.NODE_ENV,
  USE_MOCK_DATA: process.env.USE_MOCK_DATA,
  FIREBASE_PROJECT: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
});

async function testFirestore() {
  try {
    console.log("🔍 Bắt đầu kiểm thử Firestore...");

    // Xác định User ID dựa vào môi trường
    let userId = "mock-user-id";

    // Nếu sử dụng Firebase thật, đăng ký và đăng nhập
    if (!useMockData) {
      console.log("ℹ️ Sử dụng Firestore thật");
      try {
        // Đăng ký người dùng mới
        const user = await registerUser(
          testEmail,
          testPassword,
          "Người dùng test Firestore"
        );
        userId = user.uid;
        console.log(`✅ Đăng ký người dùng thành công với ID: ${userId}`);
      } catch (authError) {
        // Nếu tài khoản đã tồn tại, thử đăng nhập
        console.log("ℹ️ Tài khoản có thể đã tồn tại, thử đăng nhập...");
        const user = await loginWithEmail(testEmail, testPassword);
        userId = user.uid;
        console.log(`✅ Đăng nhập thành công với ID: ${userId}`);
      }
    } else {
      console.log("ℹ️ Sử dụng mock data cho Firestore");
    }

    // Bước 1: Lấy danh sách giao dịch hiện tại
    const initialTransactions = await getUserTransactions(userId);
    console.log(`✅ Lấy ${initialTransactions.length} giao dịch hiện có`);

    // Bước 2: Thêm giao dịch mới
    const newTransaction: Omit<Transaction, "id"> = {
      userId: userId,
      amount: 75000,
      description: "Giao dịch test Firestore",
      category: "food",
      date: new Date(),
      isRecurring: false,
    };

    const addedTx = await addTransaction(newTransaction);
    console.log(`✅ Thêm giao dịch mới thành công: ${addedTx.id}`);

    // Bước 3: Lấy chi tiết giao dịch
    const txDetail = await getTransaction(addedTx.id!);
    console.log(
      `✅ Lấy chi tiết giao dịch: ${txDetail.description} - ${txDetail.amount}`
    );

    // Bước 4: Cập nhật giao dịch
    await updateTransaction(addedTx.id!, { amount: 100000 });
    console.log("✅ Cập nhật giao dịch thành công");

    // Bước 5: Lấy danh sách giao dịch sau cập nhật
    const updatedTransactions = await getUserTransactions(userId);
    console.log(`✅ Sau cập nhật có ${updatedTransactions.length} giao dịch`);

    // Bước 6: Xóa giao dịch
    await deleteTransaction(addedTx.id!);
    console.log("✅ Xóa giao dịch thành công");

    // Bước 7: Kiểm tra sau khi xóa
    const finalTransactions = await getUserTransactions(userId);
    console.log(`✅ Sau khi xóa còn ${finalTransactions.length} giao dịch`);

    console.log("🎉 Kiểm thử Firestore hoàn tất!");
  } catch (error) {
    console.error("❌ Lỗi kiểm thử Firestore:", error);

    // Nếu thất bại với Firebase thật, thử lại với mock
    if (!useMockData) {
      console.log("Thử lại với mock data...");
      process.env.USE_MOCK_DATA = "true";
      await testFirestore();
    }
  }
}

testFirestore();
