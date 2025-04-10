"use client";

import { useState, useEffect } from "react";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import type { Transaction } from "@/types/transaction";
import type { Budget } from "@/types/budget";
import { formatCurrency } from "@/lib/utils";
import { auth } from "@/lib/firebase/config";
import { useLanguage } from "@/contexts/language-context";
import { fetchBudgets } from "@/lib/api";

interface BudgetUsageProps {
  transactions: Transaction[];
  isLoading?: boolean;
}

export default function BudgetUsage({
  transactions,
  isLoading = false,
}: BudgetUsageProps) {
  const { language, translations } = useLanguage();
  const t = translations[language];
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);

  // Tải dữ liệu ngân sách từ Firestore
  useEffect(() => {
    const loadBudgets = async () => {
      if (!auth.currentUser) {
        setLoading(false);
        return;
      }

      try {
        const budgetsData = await fetchBudgets();
        setBudgets(budgetsData);
      } catch (error) {
        console.error("Lỗi khi tải ngân sách:", error);
      } finally {
        setLoading(false);
      }
    };

    loadBudgets();
  }, []);

  // Tính toán chi tiêu theo danh mục
  const getCategorySpending = (category: string) => {
    return transactions
      .filter((t) => t.category === category && t.amount < 0)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
  };

  // Tính phần trăm sử dụng ngân sách
  const getUsagePercentage = (budget: Budget) => {
    if (!budget || budget.limit <= 0) return 0;
    const spending = getCategorySpending(budget.category);
    return Math.min(Math.round((spending / budget.limit) * 100), 100);
  };

  if (isLoading || loading) {
    return (
      <div className="space-y-6">
        <h3 className="text-lg font-medium">Budget Usage</h3>
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="flex justify-between">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-24" />
              </div>
              <Skeleton className="h-2 w-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium">Budget Usage</h3>
      <div className="space-y-4">
        {budgets.length === 0 ? (
          <p className="text-center text-muted-foreground py-4">
            No budgets set. Add your first budget to track spending.
          </p>
        ) : (
          budgets.map((budget) => {
            const usage = getUsagePercentage(budget);

            return (
              <div key={budget.id} className="space-y-2 p-3 border rounded-md">
                <div className="flex justify-between">
                  <span className="capitalize">{budget.category}</span>
                  <span>{usage}% of budget</span>
                </div>
                <Progress
                  value={usage}
                  max={100}
                  className={usage > 80 ? "bg-destructive/20" : ""}
                  aria-label={`${budget.category} budget usage: ${usage}%`}
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>
                    {formatCurrency(getCategorySpending(budget.category))}
                  </span>
                  <span>{formatCurrency(budget.limit)}</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
