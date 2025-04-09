import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/firebase/config";

// Tăng thời gian timeout cho API route
export const maxDuration = 60; // Giảm xuống 60 giây theo giới hạn của Vercel Hobby
// Không cache kết quả
export const dynamic = "force-dynamic";

// Cache để lưu trữ kết quả phân tích
const INSIGHTS_CACHE = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 30 * 60 * 1000; // 30 phút

// Cấu hình Ollama API
const OLLAMA_API_URL = process.env.OLLAMA_API_URL || "http://127.0.0.1:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "llama3.2";

// Kiểm tra xem Ollama API có khả dụng không
async function isOllamaAvailable(): Promise<boolean> {
  // Luôn trả về false khi ở môi trường Vercel Production để dùng phân tích nội bộ
  if (process.env.VERCEL_ENV === "production") {
    return false;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000); // Giảm từ 5s xuống 3s

    const response = await fetch(`${OLLAMA_API_URL}/api/tags`, {
      method: "GET",
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    return response.ok;
  } catch (error) {
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    // Kiểm tra xác thực
    const idToken = request.headers.get("Authorization")?.split("Bearer ")[1];

    // Bỏ qua xác thực với token test khi debug
    const isTestToken = idToken === "test-token";

    if (!idToken && !isTestToken) {
      return NextResponse.json(
        { error: "Unauthorized: Missing token" },
        { status: 401 }
      );
    }

    // Lấy dữ liệu giao dịch từ request
    const { transactions } = await request.json();

    if (
      !transactions ||
      !Array.isArray(transactions) ||
      transactions.length === 0
    ) {
      return NextResponse.json(
        { error: "Invalid request: No transaction data" },
        { status: 400 }
      );
    }

    // Tạo cache key từ dữ liệu giao dịch
    const cacheKey = createCacheKey(transactions);

    // Kiểm tra cache
    const cachedResult = INSIGHTS_CACHE.get(cacheKey);
    if (cachedResult && Date.now() - cachedResult.timestamp < CACHE_TTL) {
      return NextResponse.json(cachedResult.data);
    }

    // Phân tích và tổng hợp dữ liệu giao dịch
    const { totalIncome, totalExpense, categoryBreakdown } =
      analyzeTransactions(transactions);

    // Kiểm tra nhanh xem Ollama có sẵn sàng không
    const ollamaAvailable = await isOllamaAvailable();

    // Nếu Ollama không khả dụng, sử dụng phân tích nội bộ
    if (!ollamaAvailable) {
      const fallbackInsights = generateLocalInsights(
        totalIncome,
        totalExpense,
        categoryBreakdown
      );

      const responseData = {
        insights: fallbackInsights,
        is_sample_data: true,
        reason: `Ollama API không khả dụng tại ${OLLAMA_API_URL}, sử dụng phân tích nội bộ`,
      };

      // Lưu cache
      INSIGHTS_CACHE.set(cacheKey, {
        data: responseData,
        timestamp: Date.now(),
      });

      return NextResponse.json(responseData);
    }

    try {
      // Gọi Ollama API để tạo insights
      const insights = await generateOllamaInsights(
        totalIncome,
        totalExpense,
        categoryBreakdown
      );

      const responseData = {
        insights: insights,
        is_sample_data: false,
        raw_response: true,
        formatted: true,
      };

      // Lưu vào cache
      INSIGHTS_CACHE.set(cacheKey, {
        data: responseData,
        timestamp: Date.now(),
      });

      return NextResponse.json(responseData);
    } catch (aiError) {
      console.error("[AI Insights API] Lỗi khi gọi Ollama API:", aiError);

      // Fallback sang phân tích nội bộ nếu có lỗi từ Ollama
      const fallbackInsights = generateLocalInsights(
        totalIncome,
        totalExpense,
        categoryBreakdown
      );

      const responseData = {
        insights: fallbackInsights,
        is_sample_data: true,
        raw_response: false,
        reason: `Lỗi khi gọi Ollama API (${OLLAMA_MODEL}): ${
          aiError instanceof Error ? aiError.message : "Lỗi không xác định"
        }`,
      };

      return NextResponse.json(responseData);
    }
  } catch (error) {
    console.error("[AI Insights API] Lỗi xử lý:", error);

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Server error",
        insights: [
          "Bạn đã chi 40% thu nhập cho ăn uống - đề xuất giảm 10%",
          "Chi tiêu mua sắm tăng 15% so với tháng trước",
          "Bạn có thể tiết kiệm 500.000₫ bằng cách giảm chi phí giải trí",
        ],
        is_sample_data: true,
      },
      { status: 500 }
    );
  }
}

// Phân tích giao dịch và tính toán các số liệu
function analyzeTransactions(transactions: any[]): {
  totalIncome: number;
  totalExpense: number;
  categoryBreakdown: { category: string; amount: number; percentage: number }[];
} {
  const categories: Record<string, number> = {};
  const totalIncome = transactions
    .filter((t) => t.amount > 0)
    .reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = transactions
    .filter((t) => t.amount < 0)
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  // Phân tích chi tiêu theo danh mục
  transactions
    .filter((t) => t.amount < 0)
    .forEach((t) => {
      categories[t.category] =
        (categories[t.category] || 0) + Math.abs(t.amount);
    });

  // Tạo ra biểu đồ chi tiêu theo danh mục
  const categoryBreakdown = Object.entries(categories)
    .map(([category, amount]) => {
      const percentage = totalExpense > 0 ? (amount / totalExpense) * 100 : 0;
      return {
        category,
        amount,
        percentage: parseFloat(percentage.toFixed(1)),
      };
    })
    .sort((a, b) => b.percentage - a.percentage);

  return { totalIncome, totalExpense, categoryBreakdown };
}

// Tạo cache key từ mảng giao dịch
function createCacheKey(transactions: any[]): string {
  const simplified = transactions.map((t) => ({
    amount: t.amount,
    category: t.category,
    date: t.date,
  }));

  // Tạo hash từ dữ liệu giao dịch
  return JSON.stringify(simplified);
}

async function generateOllamaInsights(
  totalIncome: number,
  totalExpense: number,
  categoryBreakdown: { category: string; amount: number; percentage: number }[]
): Promise<string[]> {
  const formattedCategories = categoryBreakdown
    .map(
      (cat) =>
        `${cat.category}: ${cat.amount.toLocaleString("vi-VN")}₫ (${
          cat.percentage
        }%)`
    )
    .join(", ");

  const spendingRatio =
    totalIncome > 0 ? (totalExpense / totalIncome) * 100 : 0;

  const prompt = `
Dựa trên dữ liệu tài chính sau:
- Tổng thu nhập: ${totalIncome.toLocaleString("vi-VN")}₫
- Tổng chi tiêu: ${totalExpense.toLocaleString("vi-VN")}₫
- Tỷ lệ chi tiêu/thu nhập: ${spendingRatio.toFixed(1)}%
- Chi tiêu theo danh mục: ${formattedCategories}

Hãy đưa ra 5 gợi ý để quản lý tài chính tốt hơn. Mỗi gợi ý phải:
1. Ngắn gọn, không quá 15 từ
2. Cụ thể và thực tế (bao gồm số liệu cụ thể)
3. Viết bằng tiếng Việt
4. Tập trung vào tiết kiệm và cân đối chi tiêu

Trả về dưới dạng danh sách mỗi phần tử là một gợi ý, không đánh số, không thêm tiêu đề hay nội dung khác.`;

  // Hàm gọi API với retry logic
  const callOllamaApi = async (
    retryCount = 0,
    maxRetries = 1
  ): Promise<string[]> => {
    try {
      // Tăng timeout và thêm các tùy chọn cải thiện hiệu suất
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
      }, 45000); // Giảm timeout xuống 45 giây

      try {
        // Gọi Ollama API với cấu hình tối ưu
        const response = await fetch(`${OLLAMA_API_URL}/api/generate`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Connection: "keep-alive",
          },
          body: JSON.stringify({
            model: OLLAMA_MODEL,
            prompt: prompt,
            stream: false,
            options: {
              temperature: 0.5,
              top_p: 0.9,
              top_k: 40,
              num_predict: 200, // Giảm xuống 200 tokens
              num_ctx: 1024, // Giảm context window
              num_thread: 4,
              repeat_penalty: 1.1,
              seed: Date.now(),
            },
          }),
          cache: "no-store",
          signal: controller.signal,
        });

        // Xóa timeout sau khi nhận được phản hồi
        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(
            `Ollama API responded with status ${response.status}`
          );
        }

        const data = await response.json();
        const content = data.response?.trim();

        if (!content) {
          throw new Error("Không nhận được phản hồi từ Ollama");
        }

        const items = content
          .split(/\n+/)
          .map((line: string) => line.trim())
          .filter((line: string) => line.length > 0)
          .map((line: string) => {
            // Loại bỏ các ký tự đánh số đầu dòng như "1. ", "- ", v.v.
            return line.replace(/^(\d+[\.\)]|[\-\*])\s*/, "").trim();
          });

        if (items.length === 0) {
          throw new Error("Không thể tách phản hồi từ Ollama thành các gợi ý");
        }

        return items.slice(0, 5);
      } catch (err) {
        clearTimeout(timeoutId);
        throw err;
      }
    } catch (error) {
      if (retryCount < maxRetries) {
        // Thử lại với 1.5 giây delay
        await new Promise((resolve) => setTimeout(resolve, 1500));
        return callOllamaApi(retryCount + 1, maxRetries);
      }
      throw error;
    }
  };

  return callOllamaApi();
}

function generateLocalInsights(
  totalIncome: number,
  totalExpense: number,
  categoryBreakdown: { category: string; amount: number; percentage: number }[]
): string[] {
  const insights: string[] = [];
  const spendingRatio =
    totalIncome > 0 ? (totalExpense / totalIncome) * 100 : 0;

  // Gợi ý về tỷ lệ chi tiêu/thu nhập
  if (spendingRatio > 70) {
    insights.push(
      `Chi tiêu chiếm ${Math.round(
        spendingRatio
      )}% thu nhập, nên giảm xuống dưới 70%`
    );
  } else if (spendingRatio > 50 && spendingRatio <= 70) {
    insights.push(
      `Tỷ lệ chi tiêu ${Math.round(
        spendingRatio
      )}% là chấp nhận được, nhưng nên giảm thêm`
    );
  } else if (spendingRatio > 0) {
    insights.push(
      `Tỷ lệ chi tiêu ${Math.round(
        spendingRatio
      )}% rất tốt, bạn đang tiết kiệm hiệu quả`
    );
  }

  // Danh mục chi tiêu cao nhất
  if (categoryBreakdown.length > 0) {
    const topCategory = categoryBreakdown[0];
    if (topCategory.percentage > 40) {
      insights.push(
        `Chi tiêu cho ${topCategory.category} chiếm ${Math.round(
          topCategory.percentage
        )}% - nên giảm xuống`
      );
    } else if (topCategory.percentage > 20) {
      insights.push(
        `${topCategory.category} là chi tiêu lớn nhất (${Math.round(
          topCategory.percentage
        )}%), hãy xem xét lại`
      );
    }
  }

  // Gợi ý tiết kiệm nếu có nhiều danh mục
  if (categoryBreakdown.length >= 2) {
    const secondCategory = categoryBreakdown[1];
    insights.push(
      `Giảm chi tiêu cho ${secondCategory.category} có thể tiết kiệm ${(
        secondCategory.amount * 0.1
      ).toLocaleString("vi-VN")}₫`
    );
  }

  // Gợi ý về việc để dành
  if (totalIncome > 0 && totalExpense < totalIncome) {
    const savings = totalIncome - totalExpense;
    const savingsPercentage = (savings / totalIncome) * 100;

    if (savingsPercentage < 20) {
      insights.push(
        `Nên để dành ít nhất 20% thu nhập thay vì ${Math.round(
          savingsPercentage
        )}% hiện tại`
      );
    } else {
      insights.push(
        `Bạn đang để dành ${Math.round(savingsPercentage)}% thu nhập - rất tốt!`
      );
    }
  }

  // Giới hạn số lượng gợi ý
  return insights.slice(0, 5);
}
