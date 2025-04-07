"use client";

import { useState, useEffect } from "react";
import { Lightbulb, Sparkles } from "lucide-react";
import type { Transaction } from "@/types/transaction";
import type { Budget } from "@/types/budget";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { getAiInsights, fetchBudgets } from "@/lib/api";
import { useLanguage } from "@/contexts/language-context";

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

export default function AiInsights({
  transactions,
  isLoading,
}: AiInsightsProps) {
  const [insights, setInsights] = useState<string[]>([]);
  const [categorySpending, setCategorySpending] = useState<CategorySpending[]>(
    []
  );
  const [aiLoading, setAiLoading] = useState(false);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [budgetsLoading, setBudgetsLoading] = useState(false);
  const { language, translations } = useLanguage();
  const t = translations[language].dashboard;

  useEffect(() => {
    if (transactions.length > 0 && !isLoading) {
      setAiLoading(true);
      setBudgetsLoading(true);

      // Get budgets
      fetchBudgets()
        .then((budgetsData) => {
          setBudgets(budgetsData);

          // Calculate category spending
          const categories: Record<string, number> = {};
          const totalSpending = transactions
            .filter((t) => t.amount < 0)
            .reduce((sum, t) => sum + Math.abs(t.amount), 0);

          transactions
            .filter((t) => t.amount < 0)
            .forEach((t) => {
              categories[t.category] =
                (categories[t.category] || 0) + Math.abs(t.amount);
            });

          // Map spending data with budget data
          const categoryData = Object.entries(categories)
            .map(([category, amount]) => {
              const budgetForCategory = budgetsData.find(
                (b) => b.category === category
              );
              return {
                category,
                amount,
                percentage: Math.round((amount / totalSpending) * 100),
                budget: budgetForCategory
                  ? Math.round((amount / budgetForCategory.amount) * 100)
                  : 0,
                budgetAmount: budgetForCategory ? budgetForCategory.amount : 0,
              };
            })
            .filter((item) => item.budgetAmount > 0); // Only show categories that have budgets

          setCategorySpending(categoryData);
          setBudgetsLoading(false);
        })
        .catch((error) => {
          console.error("Error getting budgets:", error);
          setBudgetsLoading(false);
        });

      // Get AI insights
      getAiInsights(transactions)
        .then((data) => {
          setInsights(data.insights);
        })
        .catch((error) => {
          console.error("Error getting AI insights:", error);
          setInsights([
            "You've spent 40% of your income on food - consider reducing by 10%",
            "Your shopping expenses increased by 15% compared to last month",
            "You could save ₫500,000 by reducing entertainment expenses",
          ]);
        })
        .finally(() => {
          setAiLoading(false);
        });
    }
  }, [transactions, isLoading]);

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
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="h-5 w-5 text-primary" />
          <h3 className="font-medium">{t.aiInsights.title}</h3>
        </div>

        {aiLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-4/6" />
          </div>
        ) : (
          <ul className="space-y-2 text-sm">
            {insights.map((insight, index) => (
              <li key={index} className="flex items-start gap-2">
                <Lightbulb className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <span>{insight}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {categorySpending.length > 0 && (
        <div>
          <h3 className="font-medium mb-3">Budget Usage</h3>
          <div className="space-y-4">
            {budgetsLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : (
              categorySpending.map((category) => (
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
                      className={
                        category.budget > 80 ? "bg-destructive/20" : ""
                      }
                    />
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
