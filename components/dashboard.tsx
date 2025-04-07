"use client";

import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { useHotkeys } from "react-hotkeys-hook";
import { motion, AnimatePresence } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Header from "@/components/header";
import StatCards from "@/components/stat-cards";
import SpendingChart from "@/components/spending-chart";
import TransactionList from "@/components/transaction-list";
import AiInsights from "@/components/ai-insights";
import AddTransactionModal from "@/components/add-transaction-modal";
import EmptyState from "@/components/empty-state";
import ErrorState from "@/components/error-state";
import FinancialCalendar from "@/components/financial-calendar";
import BudgetTracking from "@/components/budget-tracking";
import FinancialGoals from "@/components/financial-goals";
import ExportData from "@/components/export-data";
import RecurringTransactions from "@/components/recurring-transactions";
import type { Transaction } from "@/types/transaction";
import type { Budget } from "@/types/budget";
import type { Goal } from "@/types/goal";
import type { RecurringTransaction } from "@/types/recurring-transaction";
import {
  fetchTransactions,
  fetchBudgets,
  getGoals,
  getRecurringTransactions,
  addTransaction,
} from "@/lib/api";
import { useLanguage } from "@/contexts/language-context";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";

export default function Dashboard() {
  const { language, translations } = useLanguage();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [recurringTransactions, setRecurringTransactions] = useState<
    RecurringTransaction[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const { toast } = useToast();

  const t = translations[language].dashboard;

  // Keyboard shortcut to open add transaction modal
  useHotkeys(
    "ctrl+n",
    (event) => {
      event.preventDefault();
      setIsAddModalOpen(true);
    },
    { enableOnFormTags: false }
  );

  // Keyboard shortcut to close modal with Escape
  useHotkeys("escape", () => {
    if (isAddModalOpen) setIsAddModalOpen(false);
  });

  const loadData = useCallback(async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setIsError(false);

    try {
      // Gọi các API để lấy dữ liệu
      const [transactionsData, budgetsData, goalsData, recurringData] =
        await Promise.all([
          fetchTransactions(),
          fetchBudgets(),
          getGoals(),
          getRecurringTransactions(),
        ]);

      // Cập nhật state với dữ liệu đã lấy được
      setTransactions(transactionsData);
      setBudgets(budgetsData);
      setGoals(goalsData);
      setRecurringTransactions(recurringData);

      // Nếu tất cả dữ liệu đều là mảng rỗng và chúng ta không phải đang ở trạng thái loading lần đầu
      // thì có thể hiển thị một toast cảnh báo
      if (
        transactionsData.length === 0 &&
        budgetsData.length === 0 &&
        goalsData.length === 0 &&
        recurringData.length === 0
      ) {
        // Không hiển thị toast nếu người dùng vừa đăng nhập và chưa có dữ liệu
        // Điều này là bình thường và không phải là lỗi
        console.log("Chưa có dữ liệu nào cho người dùng");
      }
    } catch (error: any) {
      console.error("Error loading data:", error);
      // Chỉ hiển thị lỗi và thiết lập trạng thái lỗi khi có lỗi thực sự
      // không phải chỉ vì không có dữ liệu
      setIsError(true);
      toast.error({
        title: t.errorToast.title,
        description: error.message || t.errorToast.description,
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast, t.errorToast, user]);

  useEffect(() => {
    if (!authLoading) {
      loadData();
    }
  }, [loadData, authLoading]);

  const handleAddTransaction = async (transaction: Transaction) => {
    try {
      // Gọi API để thêm giao dịch vào database
      const newTransaction = await addTransaction({
        description: transaction.description,
        amount: transaction.amount,
        category: transaction.category,
        date: transaction.date,
      });

      // Cập nhật state UI với giao dịch mới
      setTransactions((prev) => [newTransaction, ...prev]);
      setIsAddModalOpen(false);

      toast.success({
        title: t.successToast.title,
        description: t.successToast.description,
      });
    } catch (error: any) {
      console.error("Lỗi khi thêm giao dịch:", error);
      toast.error({
        title: "Lỗi",
        description: error.message || "Không thể thêm giao dịch",
      });
    }
  };

  const handleAddGoal = (goal: Goal) => {
    setGoals((prev) => [...prev, goal]);
  };

  const handleUpdateGoal = (goal: Goal) => {
    setGoals((prev) => prev.map((g) => (g.id === goal.id ? goal : g)));
  };

  const handleDeleteGoal = (goalId: string) => {
    setGoals((prev) => prev.filter((g) => g.id !== goalId));
  };

  const handleAddRecurring = (recurring: RecurringTransaction) => {
    setRecurringTransactions((prev) => [...prev, recurring]);
  };

  const handleUpdateRecurring = (recurring: RecurringTransaction) => {
    setRecurringTransactions((prev) =>
      prev.map((r) => (r.id === recurring.id ? recurring : r))
    );
  };

  const handleDeleteRecurring = (recurringId: string) => {
    setRecurringTransactions((prev) =>
      prev.filter((r) => r.id !== recurringId)
    );
  };

  const handleRetry = () => {
    loadData();
  };

  // Calculate statistics
  const income = transactions
    .filter((t) => t.amount > 0)
    .reduce((sum, t) => sum + t.amount, 0);

  const expenses = transactions
    .filter((t) => t.amount < 0)
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const savings = income - expenses;

  // Get transactions for selected date
  const getTransactionsForDate = (date: Date) => {
    const dateString = date.toISOString().split("T")[0];
    return transactions.filter((t) => t.date === dateString);
  };

  // Get high spending days
  const getHighSpendingDays = () => {
    const days: Record<string, number> = {};

    transactions
      .filter((t) => t.amount < 0)
      .forEach((t) => {
        days[t.date] = (days[t.date] || 0) + Math.abs(t.amount);
      });

    return Object.entries(days)
      .filter(([_, amount]) => amount > 200000) // Threshold for "high spending"
      .map(([date]) => new Date(date));
  };

  // Hàm điều hướng đến trang đăng nhập
  const redirectToLogin = () => {
    router.push("/auth/login");
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Header onAddClick={() => setIsAddModalOpen(true)} />
        <main className="container mx-auto px-4 py-6">
          <EmptyState
            title="Vui lòng đăng nhập"
            description="Bạn cần đăng nhập để sử dụng CoinSight"
            buttonText="Đăng nhập ngay"
            onAddClick={redirectToLogin}
          />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header onAddClick={() => setIsAddModalOpen(true)} />

      <main className="container mx-auto px-4 py-6">
        {isError ? (
          <ErrorState onRetry={handleRetry} />
        ) : isLoading ? (
          <div className="min-h-[400px] flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : transactions.length === 0 ? (
          <EmptyState onAddClick={() => setIsAddModalOpen(true)} />
        ) : (
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                <StatCards
                  income={income}
                  expenses={expenses}
                  savings={savings}
                />
              </div>

              <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                className="mb-6"
              >
                <TabsList className="grid grid-cols-3 md:grid-cols-5 mb-4">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="transactions">Transactions</TabsTrigger>
                  <TabsTrigger value="budgets">Budgets</TabsTrigger>
                  <TabsTrigger value="goals" className="hidden md:block">
                    Goals
                  </TabsTrigger>
                  <TabsTrigger value="tools" className="hidden md:block">
                    Tools
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="overview">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                      <SpendingChart
                        transactions={transactions}
                        isLoading={isLoading}
                      />

                      <motion.div
                        className="bg-card rounded-lg shadow p-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                      >
                        <h2 className="text-xl font-semibold mb-4">
                          {t.recentTransactions}
                        </h2>
                        <TransactionList
                          transactions={transactions.slice(0, 5)}
                          isLoading={isLoading}
                        />
                      </motion.div>
                    </div>

                    <div className="space-y-6">
                      <motion.div
                        className="bg-card rounded-lg shadow p-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                      >
                        <h2 className="text-xl font-semibold mb-4">
                          {t.aiInsights}
                        </h2>
                        <AiInsights
                          transactions={transactions}
                          isLoading={isLoading}
                        />
                      </motion.div>

                      <motion.div
                        className="bg-card rounded-lg shadow p-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.6 }}
                      >
                        <h2 className="text-xl font-semibold mb-4">
                          {t.financialCalendar}
                        </h2>
                        <FinancialCalendar
                          highSpendingDays={getHighSpendingDays()}
                          onSelectDate={setSelectedDate}
                          selectedDate={selectedDate}
                          selectedDateTransactions={
                            selectedDate
                              ? getTransactionsForDate(selectedDate)
                              : []
                          }
                        />
                      </motion.div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="transactions">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2">
                      <motion.div
                        className="bg-card rounded-lg shadow p-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                      >
                        <h2 className="text-xl font-semibold mb-4">
                          All Transactions
                        </h2>
                        <TransactionList
                          transactions={transactions}
                          isLoading={isLoading}
                        />
                      </motion.div>
                    </div>

                    <div className="space-y-6">
                      <RecurringTransactions
                        recurringTransactions={recurringTransactions}
                        onAddRecurring={handleAddRecurring}
                        onUpdateRecurring={handleUpdateRecurring}
                        onDeleteRecurring={handleDeleteRecurring}
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="budgets">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2">
                      <motion.div
                        className="bg-card rounded-lg shadow p-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                      >
                        <h2 className="text-xl font-semibold mb-4">
                          {t.budgetTracking}
                        </h2>
                        <BudgetTracking
                          budgets={budgets}
                          transactions={transactions}
                          isLoading={isLoading}
                        />
                      </motion.div>
                    </div>

                    <div>
                      <SpendingChart
                        transactions={transactions}
                        isLoading={isLoading}
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="goals">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2">
                      <FinancialGoals
                        goals={goals}
                        onAddGoal={handleAddGoal}
                        onUpdateGoal={handleUpdateGoal}
                        onDeleteGoal={handleDeleteGoal}
                      />
                    </div>

                    <div className="space-y-6">
                      <motion.div
                        className="bg-card rounded-lg shadow p-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                      >
                        <h2 className="text-xl font-semibold mb-4">
                          {t.aiInsights}
                        </h2>
                        <AiInsights
                          transactions={transactions}
                          isLoading={isLoading}
                        />
                      </motion.div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="tools">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2">
                      <ExportData transactions={transactions} />
                    </div>

                    <div className="space-y-6">
                      <motion.div
                        className="bg-card rounded-lg shadow p-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                      >
                        <h2 className="text-xl font-semibold mb-4">
                          {t.financialCalendar}
                        </h2>
                        <FinancialCalendar
                          highSpendingDays={getHighSpendingDays()}
                          onSelectDate={setSelectedDate}
                          selectedDate={selectedDate}
                          selectedDateTransactions={
                            selectedDate
                              ? getTransactionsForDate(selectedDate)
                              : []
                          }
                        />
                      </motion.div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </motion.div>
          </AnimatePresence>
        )}
      </main>

      <footer className="border-t py-6 text-center text-sm text-muted-foreground">
        © 2024 CoinSight - {t.footerText}
      </footer>

      <AddTransactionModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAddTransaction}
      />
    </div>
  );
}
