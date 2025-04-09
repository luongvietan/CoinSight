/**
 * Script kiểm tra kết nối tới Ollama
 *
 * Usage: npm run test-ollama
 */

// Đọc biến môi trường từ file .env.local
require("dotenv").config({ path: "CoinSight/.env.local" });

const OLLAMA_API_URL = process.env.OLLAMA_API_URL || "http://localhost:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "llama3.2";

// console.log(`Sử dụng mô hình: ${OLLAMA_MODEL}`);

async function testOllamaConnection() {
  // console.log(`🔍 Kiểm tra kết nối tới Ollama API: ${OLLAMA_API_URL}`);

  try {
    const response = await fetch(`${OLLAMA_API_URL}/api/version`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`API responded with status ${response.status}`);
    }

    const data = await response.json();
    // console.log(`✅ Kết nối thành công tới Ollama API!`);
    // console.log(`📄 Phiên bản Ollama: ${data.version}`);

    // Kiểm tra model
    await testOllamaModel();
  } catch (error) {
    // console.error(`❌ Lỗi kết nối tới Ollama API: ${error.message}`);
    // console.log(`
    // 💡 Để khắc phục:
    // 1. Đảm bảo Ollama đã được cài đặt (https://ollama.com/download)
    // 2. Đảm bảo Ollama đang chạy trên máy của bạn
    // 3. Kiểm tra cấu hình OLLAMA_API_URL trong file .env.local (mặc định: http://localhost:11434)
    // `);
  }
}

async function testOllamaModel() {
  // console.log(`🔍 Kiểm tra mô hình "${OLLAMA_MODEL}"...`);

  try {
    const response = await fetch(`${OLLAMA_API_URL}/api/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        prompt: "Xin chào!",
        stream: false,
      }),
    });

    if (!response.ok) {
      throw new Error(`API responded with status ${response.status}`);
    }

    const data = await response.json();
    // console.log(`✅ Mô hình "${OLLAMA_MODEL}" hoạt động tốt!`);
    // console.log(
    //   `📝 Phản hồi thử nghiệm: "${data.response.substring(0, 50)}..."`
    // );

    // console.log(`
    // ✨ Tất cả kiểm tra THÀNH CÔNG! Ollama đã sẵn sàng cho tính năng AI Insights.
    //    Bạn có thể truy cập ứng dụng CoinSight và sử dụng AI Insights với mô hình local.
    // `);
  } catch (error) {
    // console.error(
    //   `❌ Lỗi khi sử dụng mô hình "${OLLAMA_MODEL}": ${error.message}`
    // );
    // console.log(`
    // 💡 Để khắc phục:
    // 1. Đảm bảo mô hình "${OLLAMA_MODEL}" đã được cài đặt:
    //    Chạy lệnh: ollama pull ${OLLAMA_MODEL}
    // 2. Kiểm tra cấu hình OLLAMA_MODEL trong file .env.local
    // 3. Thử sử dụng mô hình khác (ví dụ: mistral, gemma:7b, phi)
    // `);
  }
}

// Execute
testOllamaConnection();
