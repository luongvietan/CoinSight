"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
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
  addGoal,
  updateGoal,
  deleteGoal,
} from "@/lib/api";
import { useLanguage } from "@/contexts/language-context";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  ExternalLink,
  Wrench,
  CreditCard,
  Calendar,
  Calculator,
  Percent,
} from "lucide-react";

// Wrap StatCards with React.memo to prevent unnecessary renders
const MemoizedStatCards = React.memo(StatCards);
// Wrap SpendingChart with React.memo to prevent unnecessary renders
const MemoizedSpendingChart = React.memo(SpendingChart);
// Wrap TransactionList with React.memo to prevent unnecessary renders
const MemoizedTransactionList = React.memo(TransactionList);

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

  const handleAddGoal = async (goal: Omit<Goal, "id">) => {
    try {
      if (user) {
        // Nếu đã đăng nhập, lưu vào database
        const newGoal = await addGoal(goal);
        setGoals((prev) => [...prev, newGoal]);
      } else {
        // Nếu chưa đăng nhập, chỉ lưu vào localStorage
        const newGoal: Goal = {
          ...goal,
          id: Date.now().toString(), // Tạo ID tạm thời
        };

        const updatedGoals = [...goals, newGoal];
        setGoals(updatedGoals);
        localStorage.setItem("financialGoals", JSON.stringify(updatedGoals));
      }

      toast.success({
        title: "Thành công",
        description: "Đã thêm mục tiêu tài chính mới",
      });
    } catch (error: any) {
      console.error("Lỗi khi thêm mục tiêu:", error);
      toast.error({
        title: "Lỗi",
        description: error.message || "Không thể thêm mục tiêu tài chính",
      });
    }
  };

  const handleUpdateGoal = async (updatedGoal: Goal) => {
    try {
      if (user) {
        // Nếu đã đăng nhập, cập nhật trong database
        await updateGoal(updatedGoal.id, updatedGoal);
      }

      // Cập nhật state UI
      const updatedGoals = goals.map((goal) =>
        goal.id === updatedGoal.id ? updatedGoal : goal
      );

      setGoals(updatedGoals);

      // Luôn lưu vào localStorage để đảm bảo dữ liệu được đồng bộ
      localStorage.setItem("financialGoals", JSON.stringify(updatedGoals));

      toast.success({
        title: "Thành công",
        description: "Đã cập nhật mục tiêu tài chính",
      });
    } catch (error: any) {
      console.error("Lỗi khi cập nhật mục tiêu:", error);
      toast.error({
        title: "Lỗi",
        description: error.message || "Không thể cập nhật mục tiêu tài chính",
      });
    }
  };

  const handleDeleteGoal = async (goalId: string) => {
    try {
      if (user) {
        // Nếu đã đăng nhập, xóa trong database
        await deleteGoal(goalId);
      }

      // Cập nhật state UI
      const updatedGoals = goals.filter((goal) => goal.id !== goalId);
      setGoals(updatedGoals);

      // Luôn lưu vào localStorage để đảm bảo dữ liệu được đồng bộ
      localStorage.setItem("financialGoals", JSON.stringify(updatedGoals));

      toast.success({
        title: "Thành công",
        description: "Đã xóa mục tiêu tài chính",
      });
    } catch (error: any) {
      console.error("Lỗi khi xóa mục tiêu:", error);
      toast.error({
        title: "Lỗi",
        description: error.message || "Không thể xóa mục tiêu tài chính",
      });
    }
  };

  const handleAddBudget = async (budget: Budget) => {
    console.log("Thêm ngân sách:", budget);
    // Cập nhật UI sau khi thêm thành công
    refreshData();
  };

  const handleUpdateBudget = async (budget: Budget) => {
    console.log("Cập nhật ngân sách:", budget);
    // Cập nhật UI sau khi cập nhật thành công
    refreshData();
  };

  const handleDeleteBudget = async (budgetId: string) => {
    console.log("Xóa ngân sách:", budgetId);
    // Cập nhật UI sau khi xóa thành công
    refreshData();
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

  // Hàm để làm mới dữ liệu
  const refreshData = useCallback(() => {
    loadData();
  }, [loadData]);

  // Tối ưu các tính toán thống kê bằng useMemo
  const statistics = useMemo(() => {
    const income = transactions
      .filter((t) => t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0);

    const expenses = transactions
      .filter((t) => t.amount < 0)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    const savings = income - expenses;

    return { income, expenses, savings };
  }, [transactions]);

  // Tối ưu hàm getTransactionsForDate bằng useCallback
  const getTransactionsForDate = useCallback(
    (date: Date) => {
      const dateString = date.toISOString().split("T")[0];
      return transactions.filter((t) => t.date === dateString);
    },
    [transactions]
  );

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
                <MemoizedStatCards
                  income={statistics.income}
                  expenses={statistics.expenses}
                  savings={statistics.savings}
                />
              </div>

              <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                className="mb-6"
              >
                <TabsList className="grid grid-cols-3 md:grid-cols-5 mb-4">
                  <TabsTrigger value="overview">{t.overview}</TabsTrigger>
                  <TabsTrigger value="transactions">
                    {t.transactions}
                  </TabsTrigger>
                  <TabsTrigger value="budgets">{t.budgets}</TabsTrigger>
                  <TabsTrigger value="goals" className="hidden md:block">
                    {t.goals}
                  </TabsTrigger>
                  <TabsTrigger value="tools" className="hidden md:block">
                    {t.tools}
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="overview">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                      <MemoizedSpendingChart
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
                        <MemoizedTransactionList
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
                        <MemoizedTransactionList
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
                          onAddBudget={handleAddBudget}
                          onUpdateBudget={handleUpdateBudget}
                          onDeleteBudget={handleDeleteBudget}
                        />
                      </motion.div>
                    </div>

                    <div>
                      <MemoizedSpendingChart
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
                      <div className="mt-4 flex justify-end">
                        <Link href="/goals" passHref>
                          <Button
                            variant="outline"
                            className="flex items-center gap-2"
                          >
                            <span>
                              {translations[language].goals.viewAllGoals}
                            </span>
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
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
                      <motion.div
                        className="bg-card rounded-lg shadow p-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                      >
                        <div className="flex justify-between items-center mb-4">
                          <h2 className="text-xl font-semibold">
                            Công cụ tài chính
                          </h2>
                          <Link href="/tools">
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex items-center gap-2"
                            >
                              <span>Xem tất cả</span>
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          </Link>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <Link href="/tools#loan-calculator" className="block">
                            <div className="flex flex-col items-center rounded-lg border p-4 text-center hover:border-primary hover:bg-primary/5 transition-colors">
                              <CreditCard className="mb-2 h-8 w-8 text-primary" />
                              <h3 className="text-lg font-medium">
                                Tính khoản vay
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                Tính toán chi phí và lãi suất khoản vay
                              </p>
                            </div>
                          </Link>

                          <Link href="/tools/loan-schedule" className="block">
                            <div className="flex flex-col items-center rounded-lg border p-4 text-center hover:border-primary hover:bg-primary/5 transition-colors">
                              <Calendar className="mb-2 h-8 w-8 text-primary" />
                              <h3 className="text-lg font-medium">
                                Lịch trả nợ
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                Tạo lịch trả nợ chi tiết cho khoản vay
                              </p>
                            </div>
                          </Link>

                          <Link href="/tools/tax-calculator" className="block">
                            <div className="flex flex-col items-center rounded-lg border p-4 text-center hover:border-primary hover:bg-primary/5 transition-colors">
                              <Calculator className="mb-2 h-8 w-8 text-primary" />
                              <h3 className="text-lg font-medium">Tính thuế</h3>
                              <p className="text-sm text-muted-foreground">
                                Tính toán thuế thu nhập cá nhân
                              </p>
                            </div>
                          </Link>
                        </div>
                      </motion.div>

                      <div className="mt-6">
                        <ExportData transactions={transactions} />
                      </div>
                    </div>

                    <div className="space-y-6">
                      <motion.div
                        className="bg-card rounded-lg shadow p-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                      >
                        <h2 className="text-xl font-semibold mb-4">
                          Tính năng nổi bật
                        </h2>
                        <div className="space-y-4">
                          <div className="flex items-center gap-3 p-3 rounded-lg border">
                            <Wrench className="h-8 w-8 text-primary" />
                            <div>
                              <h3 className="font-medium">
                                Chuyển đổi tiền tệ
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                Chuyển đổi giữa các loại tiền tệ
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 p-3 rounded-lg border">
                            <Percent className="h-8 w-8 text-primary" />
                            <div>
                              <h3 className="font-medium">Tính tiết kiệm</h3>
                              <p className="text-sm text-muted-foreground">
                                Tính toán giá trị tương lai và lãi kép
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="mt-4">
                          <Link href="/tools">
                            <Button className="w-full">
                              Khám phá công cụ tài chính
                            </Button>
                          </Link>
                        </div>
                      </motion.div>

                      <motion.div
                        className="bg-card rounded-lg shadow p-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
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
