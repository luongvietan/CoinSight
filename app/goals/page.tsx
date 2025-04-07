"use client";

import React, { useState, useEffect } from "react";
import Head from "next/head";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import FinancialGoals from "@/components/financial-goals";
import { useToast } from "@/components/ui/use-toast";
import { useLanguage } from "@/contexts/language-context";
import type { Goal } from "@/types/goal";
import { ModeToggle } from "@/components/mode-toggle";
import LanguageCurrencySelector from "@/components/language-currency-selector";
import Logo from "@/components/logo";
import Link from "next/link";
import { Home, ChevronLeft } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { getGoals, addGoal, updateGoal, deleteGoal } from "@/lib/api";

export default function GoalsPage() {
  const { toast } = useToast();
  const { language, translations } = useLanguage();
  const { user } = useAuth();
  const t = translations[language].goals;

  const [goals, setGoals] = useState<Goal[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Tải dữ liệu mục tiêu từ API hoặc localStorage
  const loadGoals = async () => {
    setIsLoading(true);
    try {
      // Thử gọi API để lấy dữ liệu nếu đã đăng nhập
      if (user) {
        try {
          const goalsData = await getGoals();
          setGoals(goalsData);
        } catch (error) {
          console.error("Không thể tải mục tiêu tài chính từ API:", error);

          // Nếu không lấy được từ API, thử từ localStorage
          const savedGoals = localStorage.getItem("financialGoals");
          if (savedGoals) {
            setGoals(JSON.parse(savedGoals));
          }
        }
      } else {
        // Nếu không đăng nhập, lấy từ localStorage
        const savedGoals = localStorage.getItem("financialGoals");
        if (savedGoals) {
          setGoals(JSON.parse(savedGoals));
        }
      }
    } catch (error) {
      console.error("Không thể tải mục tiêu tài chính:", error);
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Không thể tải dữ liệu mục tiêu tài chính",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadGoals();
  }, [user]);

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
        saveGoalsToLocalStorage(updatedGoals);
      }

      toast({
        title: "Thành công",
        description: "Đã thêm mục tiêu tài chính mới",
      });
    } catch (error) {
      console.error("Lỗi khi thêm mục tiêu:", error);
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Không thể thêm mục tiêu tài chính",
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
      saveGoalsToLocalStorage(updatedGoals);

      toast({
        title: "Thành công",
        description: "Đã cập nhật mục tiêu tài chính",
      });
    } catch (error) {
      console.error("Lỗi khi cập nhật mục tiêu:", error);
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Không thể cập nhật mục tiêu tài chính",
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
      saveGoalsToLocalStorage(updatedGoals);

      toast({
        title: "Thành công",
        description: "Đã xóa mục tiêu tài chính",
      });
    } catch (error) {
      console.error("Lỗi khi xóa mục tiêu:", error);
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Không thể xóa mục tiêu tài chính",
      });
    }
  };

  const saveGoalsToLocalStorage = (goalsToSave: Goal[]) => {
    try {
      localStorage.setItem("financialGoals", JSON.stringify(goalsToSave));
    } catch (error) {
      console.error(
        "Không thể lưu mục tiêu tài chính vào localStorage:",
        error
      );
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <Logo />
            <div className="hidden md:block">
              <h1 className="text-lg font-medium">{t.title}</h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/" passHref>
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <ChevronLeft className="h-4 w-4" />
                <span className="hidden md:inline">Quay lại Dashboard</span>
                <span className="inline md:hidden">
                  <Home className="h-4 w-4" />
                </span>
              </Button>
            </Link>
            <LanguageCurrencySelector />
            <ModeToggle />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-bold">{t.title}</h2>
          </div>

          <Tabs defaultValue="all" className="space-y-4">
            <TabsList>
              <TabsTrigger value="all">
                {language === "vi" ? "Tất cả mục tiêu" : "All Goals"}
              </TabsTrigger>
              <TabsTrigger value="active">
                {language === "vi" ? "Đang thực hiện" : "Active Goals"}
              </TabsTrigger>
              <TabsTrigger value="completed">
                {language === "vi" ? "Đã hoàn thành" : "Completed"}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-4">
              {isLoading ? (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                </div>
              ) : (
                <FinancialGoals
                  goals={goals}
                  onAddGoal={handleAddGoal}
                  onUpdateGoal={handleUpdateGoal}
                  onDeleteGoal={handleDeleteGoal}
                />
              )}
            </TabsContent>

            <TabsContent value="active" className="space-y-4">
              {isLoading ? (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                </div>
              ) : (
                <FinancialGoals
                  goals={goals.filter(
                    (goal) => goal.currentAmount / goal.targetAmount < 1
                  )}
                  onAddGoal={handleAddGoal}
                  onUpdateGoal={handleUpdateGoal}
                  onDeleteGoal={handleDeleteGoal}
                />
              )}
            </TabsContent>

            <TabsContent value="completed" className="space-y-4">
              {isLoading ? (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                </div>
              ) : (
                <FinancialGoals
                  goals={goals.filter(
                    (goal) => goal.currentAmount / goal.targetAmount >= 1
                  )}
                  onAddGoal={handleAddGoal}
                  onUpdateGoal={handleUpdateGoal}
                  onDeleteGoal={handleDeleteGoal}
                />
              )}
            </TabsContent>
          </Tabs>

          <div className="mt-8 bg-card rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">
              {language === "vi"
                ? "Lời khuyên đạt mục tiêu"
                : "Goal Achievement Tips"}
            </h2>
            <div className="space-y-3 text-muted-foreground">
              <p>
                {language === "vi"
                  ? "1. Chia nhỏ mục tiêu lớn thành các mục tiêu nhỏ dễ quản lý hơn."
                  : "1. Break down large goals into smaller, manageable objectives."}
              </p>
              <p>
                {language === "vi"
                  ? "2. Đặt thời hạn cụ thể để tạo động lực thực hiện."
                  : "2. Set specific deadlines to create motivation."}
              </p>
              <p>
                {language === "vi"
                  ? "3. Theo dõi tiến độ thường xuyên và điều chỉnh khi cần thiết."
                  : "3. Track progress regularly and adjust when necessary."}
              </p>
              <p>
                {language === "vi"
                  ? "4. Tự thưởng cho bản thân khi đạt được các cột mốc quan trọng."
                  : "4. Reward yourself when you reach important milestones."}
              </p>
              <p>
                {language === "vi"
                  ? "5. Tự động hóa việc tiết kiệm để đảm bảo đều đặn."
                  : "5. Automate your savings to ensure consistency."}
              </p>
            </div>
          </div>
        </motion.div>
      </main>

      <footer className="border-t py-6 text-center text-sm text-muted-foreground">
        © 2024 CoinSight -{" "}
        {language === "vi"
          ? "Quản lý tài chính bằng AI"
          : "AI-Powered Finance Management"}
      </footer>
    </div>
  );
}
