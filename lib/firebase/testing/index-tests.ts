/**
 * Kiểm thử tổng hợp cho CoinSight
 * Chạy tất cả các kiểm thử trong một file
 */

import { config } from "dotenv";
config();

import { mockAuthTest, realAuthTest } from "./auth-tests";
import { mockFirestoreTest, realFirestoreTest } from "./firestore-tests";
import { mockAPITest, realAPITest } from "./api-tests";
import { mockPerformanceTest, realPerformanceTest } from "./performance-tests";
import { mockIntegrationTest, realIntegrationTest } from "./integration-tests";

// Kiểm tra môi trường và cấu hình
const useMockAuth =
  process.env.USE_MOCK_AUTH === "true" ||
  !process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
const useMockData =
  process.env.USE_MOCK_DATA === "true" ||
  !process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
const useMockAPI =
  process.env.USE_MOCK_API === "true" || !process.env.NEXT_PUBLIC_SITE_URL;

// Thông báo kiểu kiểm thử
// console.log("\n======= KIỂM THỬ TỔNG HỢP COINSIGHT =======");
// console.log(
//   `Chế độ kiểm thử: ${
//     useMockAuth && useMockData ? "Dữ liệu mô phỏng" : "Dữ liệu thật"
//   }`
// );
// console.log("==========================================\n");

async function runTests() {
  try {
    // 1. Kiểm thử xác thực
    // console.log("\n------ KIỂM THỬ XÁC THỰC ------");
    if (useMockAuth) {
      await mockAuthTest();
    } else {
      await realAuthTest();
    }

    // 2. Kiểm thử Firestore
    // console.log("\n------ KIỂM THỬ FIRESTORE ------");
    if (useMockData) {
      await mockFirestoreTest();
    } else {
      await realFirestoreTest();
    }

    // 3. Kiểm thử API
    // console.log("\n------ KIỂM THỬ API ------");
    if (useMockAPI) {
      await mockAPITest();
    } else {
      await realAPITest();
    }

    // 4. Kiểm thử hiệu năng
    // console.log("\n------ KIỂM THỬ HIỆU NĂNG ------");
    if (useMockData) {
      await mockPerformanceTest();
    } else {
      await realPerformanceTest();
    }

    // 5. Kiểm thử tích hợp
    // console.log("\n------ KIỂM THỬ TÍCH HỢP ------");
    if (useMockData) {
      await mockIntegrationTest();
    } else {
      await realIntegrationTest();
    }

    // Thông báo kết quả
    // console.log("\n======= KẾT QUẢ KIỂM THỬ =======");
    // console.log("✅ Tất cả các kiểm thử đã hoàn thành thành công!");
    // console.log("===================================\n");
  } catch (error) {
    // console.error("\n❌ CÓ LỖI XẢY RA TRONG QUÁ TRÌNH KIỂM THỬ:");
    // console.error(error);
    process.exit(1);
  }
}

// Chạy tất cả các kiểm thử
runTests();
