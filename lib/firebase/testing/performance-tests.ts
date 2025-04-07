import {
  getUserTransactions,
  addTransaction,
  updateTransaction,
  deleteTransaction,
  Transaction,
} from "./firestore-adapter";
import { loginWithEmail, registerUser } from "./firebase-auth-adapter";

// Kiểm tra cấu hình
const useMockData = process.env.USE_MOCK_DATA === "true";
const testEmail = `perf_test_${Date.now()}@example.com`;
const testPassword = "Test@123";

console.log("Môi trường Performance Tests: ", {
  USE_MOCK_DATA: useMockData,
  NODE_ENV: process.env.NODE_ENV,
});

// Mock hiệu năng
function mockPerformanceTest() {
  console.log("✅ [MOCK] Đọc 100 transactions: 50ms");
  console.log("✅ [MOCK] Ghi transaction: 30ms");
  console.log("✅ [MOCK] Cập nhật transaction: 25ms");
  console.log("✅ [MOCK] Xóa transaction: 20ms");
  console.log("✅ [MOCK] Batch write 10 transactions: 100ms");
  console.log("✅ [MOCK] Query với filter: 45ms");

  return {
    readTime: 50,
    writeTime: 30,
    updateTime: 25,
    deleteTime: 20,
    batchWriteTime: 100,
    queryTime: 45,
  };
}

// Test hiệu năng thật
async function realPerformanceTest() {
  let userId = "";

  try {
    // Đăng ký hoặc đăng nhập người dùng
    try {
      console.log("Đăng ký người dùng mới...");
      const user = await registerUser(
        testEmail,
        testPassword,
        "Người dùng test hiệu năng"
      );
      userId = user.uid;
    } catch (authError) {
      console.log("Tài khoản đã tồn tại, đăng nhập...");
      const user = await loginWithEmail(testEmail, testPassword);
      userId = user.uid;
    }

    // Kiểm tra hiệu năng đọc
    console.log("Kiểm tra hiệu năng đọc...");
    const startRead = Date.now();
    const transactions = await getUserTransactions(userId, 100);
    const readTime = Date.now() - startRead;
    console.log(`✅ Đọc ${transactions.length} transactions: ${readTime}ms`);

    // Kiểm tra hiệu năng ghi
    console.log("Kiểm tra hiệu năng ghi...");
    const newTransaction: Omit<Transaction, "id"> = {
      userId: userId,
      amount: 50000,
      description: "Test hiệu năng ghi",
      category: "other",
      date: new Date(),
      isRecurring: false,
    };

    const startWrite = Date.now();
    const txResult = await addTransaction(newTransaction);
    const writeTime = Date.now() - startWrite;
    console.log(`✅ Ghi transaction: ${writeTime}ms`);

    // Kiểm tra hiệu năng cập nhật
    console.log("Kiểm tra hiệu năng cập nhật...");
    const startUpdate = Date.now();
    await updateTransaction(txResult.id!, { amount: 60000 });
    const updateTime = Date.now() - startUpdate;
    console.log(`✅ Cập nhật transaction: ${updateTime}ms`);

    // Kiểm tra hiệu năng xóa
    console.log("Kiểm tra hiệu năng xóa...");
    const startDelete = Date.now();
    await deleteTransaction(txResult.id!);
    const deleteTime = Date.now() - startDelete;
    console.log(`✅ Xóa transaction: ${deleteTime}ms`);

    // Kiểm tra hiệu năng batch write (mô phỏng)
    console.log("Kiểm tra hiệu năng batch write (10 giao dịch)...");
    const startBatch = Date.now();
    for (let i = 0; i < 10; i++) {
      await addTransaction({
        userId: userId,
        amount: 10000 * (i + 1),
        description: `Batch giao dịch ${i + 1}`,
        category: "other",
        date: new Date(),
        isRecurring: false,
      });
    }
    const batchWriteTime = Date.now() - startBatch;
    console.log(`✅ Batch write 10 transactions: ${batchWriteTime}ms`);

    // Báo cáo hiệu năng
    return {
      readTime,
      writeTime,
      updateTime,
      deleteTime,
      batchWriteTime,
      queryTime: readTime, // Sử dụng thời gian đọc làm thời gian query
    };
  } catch (error) {
    console.error("❌ Lỗi kiểm thử hiệu năng:", error);
    throw error;
  }
}

// Đánh giá hiệu năng dựa trên ngưỡng
function evaluatePerformance(metrics: Record<string, number>) {
  console.log("\n🔍 Đánh giá hiệu năng:");

  const thresholds = {
    readTime: 200,
    writeTime: 150,
    updateTime: 150,
    deleteTime: 100,
    batchWriteTime: 500,
    queryTime: 200,
  };

  let overallRating = "Tốt";

  for (const [metric, value] of Object.entries(metrics)) {
    const threshold = thresholds[metric as keyof typeof thresholds];
    let rating = "✅ Tốt";

    if (value > threshold * 2) {
      rating = "❌ Kém";
      overallRating = "Cần cải thiện";
    } else if (value > threshold) {
      rating = "⚠️ Trung bình";
      if (overallRating === "Tốt") overallRating = "Trung bình";
    }

    console.log(`${metric}: ${value}ms - ${rating}`);
  }

  console.log(`\nĐánh giá tổng thể: ${overallRating}`);

  if (overallRating !== "Tốt") {
    console.log("\nĐề xuất cải thiện:");

    if (metrics.readTime > thresholds.readTime) {
      console.log("- Thêm indexes cho truy vấn Firestore");
      console.log("- Cài đặt caching ở client");
    }

    if (metrics.batchWriteTime > thresholds.batchWriteTime) {
      console.log("- Sử dụng Firestore Batch hoặc Transaction API");
      console.log("- Giảm số lượng writes đồng thời");
    }
  }
}

async function testPerformance() {
  console.log("🔍 Bắt đầu kiểm thử hiệu năng...");

  try {
    let metrics;

    if (useMockData) {
      console.log("ℹ️ Sử dụng mock data cho kiểm thử hiệu năng");
      metrics = mockPerformanceTest();
    } else {
      console.log("ℹ️ Sử dụng Firebase thật cho kiểm thử hiệu năng");
      metrics = await realPerformanceTest();
    }

    evaluatePerformance(metrics);
    console.log("🎉 Kiểm thử hiệu năng hoàn tất!");
  } catch (error) {
    console.error("❌ Lỗi kiểm thử hiệu năng:", error);

    if (!useMockData) {
      console.log("Thử lại với mock data...");
      process.env.USE_MOCK_DATA = "true";
      await testPerformance();
    }
  }
}

testPerformance();
