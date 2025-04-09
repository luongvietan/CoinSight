"use client";

import dynamic from "next/dynamic";
import { useState, useEffect, Suspense, useMemo, useCallback } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Header from "@/components/header";
import StatCards from "@/components/stat-cards";
import SpendingChart from "@/components/spending-chart";
import TransactionList from "@/components/transaction-list";
import AddTransactionModal from "@/components/add-transaction-modal";
import EmptyState from "@/components/empty-state";
import ErrorState from "@/components/error-state";
import BudgetTracking from "@/components/budget-tracking";
import ExportData from "@/components/export-data";
import { fetchTransactions } from "@/lib/api";
import { useLanguage } from "@/contexts/language-context";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

// Lazy load AI Insights component to improve initial page load
const AiInsights = dynamic(() => import("@/components/ai-insights"), {
  loading: () => (
    <div className="space-y-4 mt-6">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
      <Skeleton className="h-4 w-4/6" />
    </div>
  ),
  ssr: false, // Disable SSR for AI component
  suspense: true, // Sử dụng suspense cho tương thích tốt hơn với Next.js
});

export default function DashboardPage() {
  const { language, translations } = useLanguage();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  const t = useMemo(
    () => translations[language]?.dashboard || {},
    [language, translations]
  );

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push("/login");
      } else {
        loadTransactions();
      }
    }
  }, [user, authLoading, router]);

  const loadTransactions = useCallback(async () => {
    setIsLoading(true);
    setIsError(false);

    try {
      // Kiểm tra cache
      const cachedData = localStorage.getItem("transactions_cache");
      const now = Date.now();

      if (cachedData) {
        try {
          const { data, timestamp } = JSON.parse(cachedData);
          // Cache có hiệu lực trong 5 phút
          if (now - timestamp < 5 * 60 * 1000) {
            setTransactions(data);
            setIsLoading(false);

            // Tải dữ liệu mới ở nền
            fetchTransactions()
              .then((freshData) => {
                setTransactions(freshData);
                // Cập nhật cache
                localStorage.setItem(
                  "transactions_cache",
                  JSON.stringify({
                    data: freshData,
                    timestamp: now,
                  })
                );
              })
              .catch(() => {});

            return;
          }
        } catch (e) {
          // Lỗi khi parse cache, bỏ qua
        }
      }

      const data = await fetchTransactions();
      setTransactions(data);

      // Lưu vào cache
      localStorage.setItem(
        "transactions_cache",
        JSON.stringify({
          data,
          timestamp: now,
        })
      );
    } catch (error) {
      console.error("Error loading transactions:", error);
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  if (authLoading) {
    return (
      <div className="container mx-auto py-6 space-y-8">
        <Skeleton className="h-10 w-64 mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
        </div>
      </div>
    );
  }

  if (isError) {
    return <ErrorState onRetry={loadTransactions} />;
  }

  if (!isLoading && transactions.length === 0) {
    return (
      <>
        <EmptyState onAddTransaction={() => setIsAddModalOpen(true)} />
        {isAddModalOpen && (
          <AddTransactionModal
            isOpen={isAddModalOpen}
            onClose={() => setIsAddModalOpen(false)}
            onTransactionAdded={loadTransactions}
          />
        )}
      </>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <Header onAddTransaction={() => setIsAddModalOpen(true)} />

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 lg:w-auto lg:inline-grid">
          <TabsTrigger value="overview">
            {t.tabs?.overview || "Overview"}
          </TabsTrigger>
          <TabsTrigger value="insights">
            {t.tabs?.insights || "Insights"}
          </TabsTrigger>
          <TabsTrigger value="budgets">
            {t.tabs?.budgets || "Budgets"}
          </TabsTrigger>
          <TabsTrigger value="export">{t.tabs?.export || "Export"}</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <StatCards transactions={transactions} isLoading={isLoading} />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SpendingChart transactions={transactions} isLoading={isLoading} />
            <TransactionList
              transactions={transactions}
              isLoading={isLoading}
              onTransactionAdded={loadTransactions}
              limit={5}
            />
          </div>
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <div className="lg:col-span-3">
              <Suspense fallback={<Skeleton className="h-32 w-full" />}>
                <AiInsights transactions={transactions} isLoading={isLoading} />
              </Suspense>
            </div>
            <div className="lg:col-span-2">
              <TransactionList
                transactions={transactions}
                isLoading={isLoading}
                onTransactionAdded={loadTransactions}
                limit={3}
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="budgets" className="space-y-4">
          <BudgetTracking transactions={transactions} isLoading={isLoading} />
        </TabsContent>

        <TabsContent value="export" className="space-y-4">
          <ExportData transactions={transactions} isLoading={isLoading} />
        </TabsContent>
      </Tabs>

      {isAddModalOpen && (
        <AddTransactionModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onTransactionAdded={loadTransactions}
        />
      )}
    </div>
  );
}
