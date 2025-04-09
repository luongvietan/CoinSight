"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export default function TestAPIPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  async function testAiInsights() {
    setLoading(true);
    setError(null);
    try {
      console.log("Bắt đầu kiểm tra AI Insights API...");

      // Tạo dữ liệu mẫu cho API
      const sampleData = {
        transactions: [
          {
            id: "1",
            description: "Mua cà phê",
            amount: -50000,
            category: "food",
            date: "2023-05-01",
          },
          {
            id: "2",
            description: "Lương tháng 5",
            amount: 10000000,
            category: "salary",
            date: "2023-05-05",
          },
          {
            id: "3",
            description: "Mua quần áo",
            amount: -500000,
            category: "clothing",
            date: "2023-05-10",
          },
        ],
      };

      // Sử dụng Bearer token giả
      const response = await fetch("/api/ai-insights", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer test-token", // Token giả cho testing
        },
        body: JSON.stringify(sampleData),
      });

      const data = await response.json();
      console.log("Kết quả AI Insights:", data);
      setResult(data);
    } catch (err) {
      console.error("Lỗi khi kiểm tra AI Insights:", err);
      setError(
        err instanceof Error ? err.message : "Đã xảy ra lỗi không xác định"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container py-8">
      <h1 className="text-2xl font-bold mb-6">Kiểm tra AI Insights</h1>

      <div className="flex gap-4 mb-6">
        <Button onClick={testAiInsights} disabled={loading}>
          {loading ? "Đang kiểm tra..." : "Kiểm tra AI Insights"}
        </Button>
      </div>

      {error && (
        <div className="bg-destructive/10 text-destructive p-4 rounded-md mb-6">
          <h3 className="font-semibold mb-2">Lỗi:</h3>
          <p>{error}</p>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Kết quả kiểm tra</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-4/6" />
            </div>
          ) : result ? (
            <pre className="whitespace-pre-wrap overflow-auto max-h-[500px] text-sm">
              {JSON.stringify(result, null, 2)}
            </pre>
          ) : (
            <p className="text-muted-foreground">
              Chưa có kết quả. Nhấn nút kiểm tra để bắt đầu.
            </p>
          )}
        </CardContent>
      </Card>

      <div className="mt-6">
        <h2 className="text-xl font-semibold mb-4">Hướng dẫn</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            Kiểm tra AI Insights để xem các gợi ý AI (Llama) đang được xử lý
            đúng cách
          </li>
          <li>Xem thông tin chi tiết trong Console của trình duyệt (F12)</li>
        </ul>
      </div>
    </div>
  );
}
