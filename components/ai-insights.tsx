"use client";

import { useState, useEffect, useCallback, useMemo, memo } from "react";
import {
  Lightbulb,
  Sparkles,
  RefreshCw,
  AlertCircle,
  InfoIcon,
  ExternalLink,
} from "lucide-react";
import type { Transaction } from "@/types/transaction";
import type { Budget } from "@/types/budget";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { getAiInsights, fetchBudgets } from "@/lib/api";
import { useLanguage } from "@/contexts/language-context";
import { debounce } from "@/lib/utils";
import BudgetUsage from "./budget-usage";

interface AiInsightsProps {
  transactions: Transaction[];
  isLoading: boolean;
}

interface CategorySpending {
  category: string;
  amount: number;
  percentage: number;
  budget: number;
  budgetAmount: number;
}

// Tạo cache cho kết quả AI insights và budgets
const AI_CACHE_TTL = 30 * 60 * 1000; // 30 phút
let cachedInsights: {
  insights: string[];
  timestamp: number;
  transactionsHash: string;
} | null = null;

// Sử dụng memo để tránh render không cần thiết
const InsightItem = memo(({ insight }: { insight: string }) => (
  <li className="flex items-start gap-2">
    <Lightbulb className="h-4 w-4 text-primary mt-0.5 shrink-0" />
    <span className="text-sm">{insight}</span>
  </li>
));
InsightItem.displayName = "InsightItem";

// Sử dụng memo cho BudgetItem
const BudgetItem = memo(({ category }: { category: CategorySpending }) => (
  <Card key={category.category}>
    <CardContent className="p-4">
      <div className="flex justify-between items-center mb-2">
        <span className="capitalize">{category.category}</span>
        <span className="text-sm font-medium">
          {category.budget}% of budget
        </span>
      </div>
      <Progress
        value={category.budget}
        max={100}
        className={category.budget > 80 ? "bg-destructive/20" : ""}
      />
    </CardContent>
  </Card>
));
BudgetItem.displayName = "BudgetItem";

function AiInsights({ transactions, isLoading }: AiInsightsProps) {
  const [insights, setInsights] = useState<string[]>([]);
  const [categorySpending, setCategorySpending] = useState<CategorySpending[]>(
    []
  );
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [isSampleData, setIsSampleData] = useState(false);
  const [apiReason, setApiReason] = useState<string | null>(null);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [budgetsLoading, setBudgetsLoading] = useState(false);
  const { language, translations } = useLanguage();
  const dashboard = translations[language]?.dashboard;
  const t: {
    aiInsights?: {
      title?: string;
      localModelInfo?: string;
      retryButton?: string;
    };
  } =
    typeof dashboard === "object" &&
    !Array.isArray(dashboard) &&
    dashboard !== null &&
    "aiInsights" in dashboard &&
    typeof dashboard.aiInsights === "object"
      ? { aiInsights: dashboard.aiInsights }
      : {};

  // Tạo hash từ mảng giao dịch để so sánh cache - tối ưu để tránh tính toán lặp lại
  const getTransactionsHash = useCallback((trans: Transaction[]): string => {
    // Dùng một số trường quan trọng thay vì toàn bộ object để hash nhanh hơn
    return JSON.stringify(
      trans.slice(0, 50).map((t) => ({
        // Giới hạn số giao dịch để tăng tốc hash
        id: t.id,
        amount: t.amount,
        date: t.date,
        category: t.category,
      }))
    );
  }, []);

  // Tối ưu tính toán với useCallback và làm nhẹ hơn
  const calculateCategorySpending = useCallback(
    (
      transactions: Transaction[],
      budgetsData: Budget[]
    ): CategorySpending[] => {
      // Chỉ xử lý tối đa 100 giao dịch gần đây nhất để tăng hiệu suất
      const recentTransactions = transactions.slice(-100);
      const categories: Record<string, number> = {};
      const totalSpending = recentTransactions
        .filter((t) => t.amount < 0)
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);

      // Tính toán chi tiêu theo danh mục
      recentTransactions
        .filter((t) => t.amount < 0)
        .forEach((t) => {
          const category = t.category || "Uncategorized";
          categories[category] =
            (categories[category] || 0) + Math.abs(t.amount);
        });

      // Chuyển đổi thành mảng và tính phần trăm
      return Object.entries(categories)
        .map(([category, amount]) => {
          const budget = budgetsData.find((b) => b.category === category);
          return {
            category,
            amount,
            percentage: (amount / totalSpending) * 100,
            budget: budget?.amount || 0,
            budgetAmount: budget?.spent || 0,
          };
        })
        .slice(0, 10); // Chỉ hiển thị top 10 danh mục để tránh render quá nhiều
    },
    []
  );

  // Hàm reloadInsights được tối ưu hóa
  const reloadInsights = useCallback(() => {
    // Xóa cache trước khi gọi API
    const cacheKey = `ai_insights_${getTransactionsHash(transactions)}`;
    localStorage.removeItem(cacheKey);
    cachedInsights = null;

    // Reset các trạng thái
    setAiLoading(true);
    setAiError(null);
    setIsSampleData(false);
    setApiReason(null);

    // Kiểm tra xem đang ở Vercel hay không
    const isVercelEnvironment =
      typeof window !== "undefined" &&
      (window.location.hostname.includes("vercel.app") ||
        window.location.hostname.includes("coinsight-app.com"));

    // Gọi API để lấy dữ liệu mới
    getAiInsights(transactions)
      .then((data) => {
        setIsSampleData(!!data.is_sample_data);
        setApiReason(data.reason || data.error || null);

        if (data?.insights && data.insights.length > 0) {
          setInsights(data.insights);
        } else {
          setInsights([
            "Bạn đã chi 40% thu nhập cho ăn uống - đề xuất giảm 10%",
            "Chi tiêu mua sắm tăng 15% so với tháng trước",
            "Bạn có thể tiết kiệm 500.000₫ bằng cách giảm chi phí giải trí",
          ]);
          setIsSampleData(true);

          // Thêm thông tin nếu đang ở Vercel
          if (isVercelEnvironment) {
            setApiReason(
              "Sử dụng phân tích tài chính cơ bản trên môi trường production"
            );
          }
        }
        setAiError(null);
      })
      .catch((error) => {
        console.error(
          "[AI Insights Component] Lỗi khi gọi API insights:",
          error
        );
        setAiError("Không thể tải gợi ý AI. Vui lòng thử lại sau.");
        setInsights([
          "Bạn đã chi 40% thu nhập cho ăn uống - đề xuất giảm 10%",
          "Chi tiêu mua sắm tăng 15% so với tháng trước",
          "Bạn có thể tiết kiệm 500.000₫ bằng cách giảm chi phí giải trí",
        ]);
        setIsSampleData(true);

        // Thêm thông tin lỗi nếu đang ở Vercel
        if (isVercelEnvironment) {
          setApiReason("Đang sử dụng dữ liệu mẫu trên môi trường production");
        }
      })
      .finally(() => {
        setAiLoading(false);
      });
  }, [transactions, getTransactionsHash]);

  // Sử dụng useEffect với dependencies đã được tối ưu
  useEffect(() => {
    if (transactions?.length > 0 && !isLoading) {
      // Tăng thời gian debounce để tránh gọi API quá nhiều
      const timer = setTimeout(() => {
        reloadInsights();
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [transactions, isLoading, reloadInsights]);

  // Tối ưu useEffect cho budget
  useEffect(() => {
    if (!isLoading && transactions.length > 0) {
      setBudgetsLoading(true);

      // Sử dụng biến local để tránh race condition
      let isActive = true;

      fetchBudgets()
        .then((budgetsData) => {
          if (!isActive) return;
          setBudgets(budgetsData);
          // Chỉ tính toán nếu component vẫn mounted
          const categoryData = calculateCategorySpending(
            transactions,
            budgetsData
          );
          setCategorySpending(categoryData);
        })
        .catch((error) => {
          console.error("Error getting budgets:", error);
        })
        .finally(() => {
          if (isActive) {
            setBudgetsLoading(false);
          }
        });

      return () => {
        isActive = false;
      };
    }
  }, [transactions, isLoading, calculateCategorySpending]);

  // Memoize renderModelInfo để tránh render lại không cần thiết
  const renderModelInfo = useMemo(() => {
    if (isSampleData && apiReason) {
      // Kiểm tra nếu lỗi liên quan đến Ollama
      if (apiReason.includes("Ollama") || apiReason.includes("127.0.0.1")) {
        return (
          <div className="mt-2 text-xs text-muted-foreground">
            <p className="flex items-center gap-1.5">
              <AlertCircle className="h-3.5 w-3.5 text-amber-500" />
              <span>
                {t.aiInsights?.localModelInfo ||
                  "Sử dụng dữ liệu mẫu do không thể kết nối đến Ollama."}
              </span>
            </p>
            <p className="mt-1 pl-5 text-xs text-muted-foreground/80">
              {apiReason}
            </p>
            <div className="mt-2 pl-5 space-y-1">
              <p className="text-xs font-medium">Hướng dẫn sửa lỗi:</p>
              <ol className="text-xs space-y-1.5 list-decimal pl-4">
                <li>
                  <span className="font-medium">Kiểm tra Ollama:</span> Mở
                  Command Prompt và chạy{" "}
                  <code className="bg-muted px-1 py-0.5 rounded">
                    curl http://127.0.0.1:11434/api/tags
                  </code>
                </li>
                <li>
                  <span className="font-medium">Khởi động Ollama:</span> Nếu
                  chưa chạy, mở ứng dụng Ollama từ Start Menu
                </li>
                <li>
                  <span className="font-medium">Cài đặt model:</span> Mở Command
                  Prompt và chạy{" "}
                  <code className="bg-muted px-1 py-0.5 rounded">
                    ollama pull llama3.2
                  </code>
                </li>
                <li>
                  <span className="font-medium">Khởi động lại ứng dụng:</span>{" "}
                  Sau khi cài đặt xong, tải lại trang này
                </li>
              </ol>
              <p className="text-xs mt-2 flex items-center gap-1.5">
                <a
                  href="https://ollama.com/download"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline flex items-center gap-1"
                >
                  <span>Tải Ollama</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </p>
            </div>
          </div>
        );
      } else if (
        apiReason.includes("gợi ý hợp lệ") ||
        apiReason.includes("insights")
      ) {
        // Hiển thị thông tin khi Ollama đang chạy nhưng không tạo được gợi ý
        return (
          <div className="mt-2 text-xs text-muted-foreground">
            <p className="flex items-center gap-1.5">
              <InfoIcon className="h-3.5 w-3.5 text-amber-500" />
              <span>
                Ollama hoạt động nhưng không thể tạo đủ gợi ý. Đang sử dụng dữ
                liệu mẫu.
              </span>
            </p>
            <p className="mt-1 pl-5 text-xs text-muted-foreground/80">
              {apiReason}
            </p>
          </div>
        );
      }
    }

    return null;
  }, [isSampleData, apiReason, t.aiInsights]);

  // Memoize danh sách insights để tránh render lại không cần thiết
  const insightsList = useMemo(() => {
    if (insights.length > 0) {
      return (
        <ul className="space-y-3">
          {insights.map((insight, index) => (
            <InsightItem key={index} insight={insight} />
          ))}
        </ul>
      );
    }
    return (
      <div className="text-sm text-muted-foreground">
        Không có dữ liệu để phân tích. Hãy thêm giao dịch để nhận gợi ý.
      </div>
    );
  }, [insights]);

  // Memoize danh sách budgets
  const budgetList = useMemo(() => {
    if (categorySpending.length > 0) {
      if (budgetsLoading) {
        return (
          <div className="space-y-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        );
      }

      return (
        <div className="space-y-4">
          {categorySpending.map((category) => (
            <BudgetItem key={category.category} category={category} />
          ))}
        </div>
      );
    }
    return null;
  }, [categorySpending, budgetsLoading]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-4/6" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-primary/10 rounded-lg p-4 border border-primary/20">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <h3 className="font-medium">
              {typeof t.aiInsights === "object" && t.aiInsights?.title
                ? t.aiInsights.title
                : "AI Insights"}
            </h3>
          </div>

          {!aiLoading && transactions?.length > 0 && (
            <button
              onClick={reloadInsights}
              className="text-xs text-primary hover:text-primary/80 flex items-center gap-1"
              disabled={aiLoading}
            >
              <RefreshCw
                className={`h-3 w-3 ${aiLoading ? "animate-spin" : ""}`}
              />
              <span>{t.aiInsights?.retryButton || "Làm mới"}</span>
            </button>
          )}
        </div>

        {aiError && <div className="text-sm text-red-500 mb-3">{aiError}</div>}

        {renderModelInfo}

        {aiLoading ? (
          <div className="space-y-4 rounded-lg border bg-card p-4">
            {/* Simplified loading state - fewer animations */}
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin"></div>
              <div className="flex flex-col">
                <span className="font-medium">
                  Đang phân tích dữ liệu tài chính...
                </span>
              </div>
            </div>
            <Progress value={50} className="h-1.5" />
          </div>
        ) : (
          insightsList
        )}
      </div>

      {categorySpending.length > 0 && (
        <BudgetUsage transactions={transactions} isLoading={isLoading} />
      )}
    </div>
  );
}

// Wrap the component with memo for better performance
export default memo(AiInsights);
