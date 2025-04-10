"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, Edit, Trash2, AlertTriangle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import type { Transaction } from "@/types/transaction";
import type { Budget } from "@/types/budget";
import { formatCurrency } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  addBudget,
  updateBudget,
  deleteBudget,
  getUserBudgets,
} from "@/lib/firebase/firestore";
import { auth } from "@/lib/firebase/config";
import { useLanguage } from "@/contexts/language-context";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface BudgetTrackingProps {
  budgets: Budget[];
  transactions: Transaction[];
  isLoading: boolean;
  onAddBudget?: (budget: Budget) => void;
  onUpdateBudget?: (budget: Budget) => void;
  onDeleteBudget?: (budgetId: string) => void;
}

const BUDGET_PERIODS = ["weekly", "monthly"] as const;

export default function BudgetTracking({
  budgets: initialBudgets,
  transactions,
  isLoading,
  onAddBudget,
  onUpdateBudget,
  onDeleteBudget,
}: BudgetTrackingProps) {
  const { language, translations } = useLanguage();
  const t = translations[language];
  const { toast } = useToast();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [budgetAmount, setBudgetAmount] = useState("");
  const [budgetPeriod, setBudgetPeriod] = useState<"weekly" | "monthly">(
    "monthly"
  );
  const [editingBudgetId, setEditingBudgetId] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [budgetToDelete, setBudgetToDelete] = useState<Budget | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Cập nhật budgets từ initialBudgets (props)
  useEffect(() => {
    setBudgets(initialBudgets || []);
  }, [initialBudgets]);

  // Tính toán chi tiêu theo danh mục
  const getCategorySpending = (category: string) => {
    return transactions
      .filter((t) => t.category === category && t.amount < 0)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
  };

  // Tính phần trăm sử dụng ngân sách
  const getUsagePercentage = (budget: Budget) => {
    if (!budget || budget.limit === 0) return 0;

    const spending = getCategorySpending(budget.category);
    return Math.min(Math.round((spending / budget.limit) * 100), 100);
  };

  // Mở dialog để thêm ngân sách mới
  const openAddBudgetDialog = () => {
    setEditingBudgetId(null);
    setSelectedCategory("");
    setBudgetAmount("");
    setBudgetPeriod("monthly");
    setIsDialogOpen(true);
  };

  // Mở dialog để chỉnh sửa ngân sách
  const openEditBudgetDialog = (budget: Budget) => {
    if (!budget.id) return;

    setEditingBudgetId(budget.id);
    setSelectedCategory(budget.category);
    setBudgetAmount(budget.limit.toString());
    setBudgetPeriod(budget.period || "monthly");
    setIsDialogOpen(true);
  };

  // Mở dialog để xác nhận xóa ngân sách
  const openDeleteDialog = (budget: Budget) => {
    setBudgetToDelete(budget);
    setIsDeleteDialogOpen(true);
  };

  // Lưu hoặc cập nhật ngân sách
  const handleSaveBudget = async () => {
    try {
      if (!auth.currentUser) {
        toast({
          title: t.common.error,
          description: t.common.notSignedIn,
          variant: "destructive",
        });
        return;
      }

      const budgetData = {
        userId: auth.currentUser.uid,
        category: selectedCategory,
        limit: Number(budgetAmount),
        period: budgetPeriod,
      };

      if (editingBudgetId) {
        // Cập nhật ngân sách
        await updateBudget(editingBudgetId, budgetData);
        toast({
          title: t.common.success,
          description: t.budgetTracking.budgetUpdated,
        });
      } else {
        // Thêm ngân sách mới
        await addBudget(budgetData);
        toast({
          title: t.common.success,
          description: t.budgetTracking.budgetAdded,
        });
      }

      // Đóng dialog và làm mới danh sách ngân sách
      setIsDialogOpen(false);

      // Thông báo cho component cha nếu có callback
      if (editingBudgetId) {
        onUpdateBudget?.({ ...budgetData, id: editingBudgetId });
      } else {
        onAddBudget?.(budgetData as Budget);
      }
    } catch (error) {
      console.error("Lỗi khi lưu ngân sách:", error);
      toast({
        title: t.common.error,
        description: t.common.errorSavingData,
        variant: "destructive",
      });
    }
  };

  // Xóa ngân sách
  const handleDeleteBudget = async () => {
    try {
      if (!budgetToDelete || !budgetToDelete.id) return;

      await deleteBudget(budgetToDelete.id);

      toast({
        title: t.common.success,
        description: t.budgetTracking.budgetDeleted,
      });

      // Đóng dialog và làm mới danh sách ngân sách
      setIsDeleteDialogOpen(false);
      setBudgetToDelete(null);

      // Thông báo cho component cha nếu có callback
      if (budgetToDelete && budgetToDelete.id) {
        onDeleteBudget?.(budgetToDelete.id);
      }
    } catch (error) {
      console.error("Lỗi khi xóa ngân sách:", error);
      toast({
        title: t.common.error,
        description: t.common.errorDeletingData,
        variant: "destructive",
      });
    }
  };

  // Hiển thị skeleton nếu đang tải
  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="flex justify-between">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-20" />
            </div>
            <Skeleton className="h-2 w-full" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium">{t.budgetTracking.title}</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={openAddBudgetDialog}
          className="gap-1"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>{t.budgetTracking.setBudget}</span>
        </Button>
      </div>

      <div className="space-y-4">
        {budgets.length === 0 ? (
          <p className="text-center text-muted-foreground py-4">
            {t.budgetTracking.noBudgets}
          </p>
        ) : (
          budgets.map((budget) => {
            const usage = getUsagePercentage(budget);
            const spending = getCategorySpending(budget.category);

            return (
              <motion.div
                key={budget.id || budget.category}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-2 p-3 border rounded-md"
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="capitalize">{budget.category}</span>
                    {budget.period === "weekly" && (
                      <span className="text-xs text-muted-foreground">
                        {t.budgetTracking.weekly}
                      </span>
                    )}
                    {usage > 80 && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <AlertTriangle
                              className={`h-4 w-4 ${
                                usage >= 100
                                  ? "text-destructive"
                                  : "text-amber-500"
                              }`}
                            />
                          </TooltipTrigger>
                          <TooltipContent>
                            <span className="text-xs">
                              {usage >= 100
                                ? t.budgetTracking.budgetExceeded
                                : t.budgetTracking.budgetWarning}
                            </span>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">
                      {formatCurrency(spending)} /{" "}
                      {formatCurrency(budget.limit)}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEditBudgetDialog(budget)}
                      className="h-7 w-7"
                    >
                      <Edit className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openDeleteDialog(budget)}
                      className="h-7 w-7 text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
                <Progress
                  value={usage}
                  max={100}
                  className={usage > 80 ? "bg-destructive/20" : ""}
                  aria-label={`${budget.category} ${t.budgetTracking.budgetUsage}: ${usage}%`}
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>{usage}%</span>
                  <span>
                    {budget.period === "weekly"
                      ? t.budgetTracking.weekly
                      : t.budgetTracking.monthly}
                  </span>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Dialog để thêm/sửa ngân sách */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent
          className="sm:max-w-[425px]"
          aria-describedby="budget-dialog-description"
        >
          <DialogHeader>
            <DialogTitle>
              {editingBudgetId
                ? t.budgetTracking.editBudgetTitle
                : t.budgetTracking.setBudgetTitle}
            </DialogTitle>
            <DialogDescription id="budget-dialog-description">
              {t.budgetTracking.setBudgetDescription}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label htmlFor="category" className="text-sm font-medium">
                {t.common.category}
              </label>
              <Select
                value={selectedCategory}
                onValueChange={setSelectedCategory}
                disabled={!!editingBudgetId} // Không cho phép sửa danh mục khi đang chỉnh sửa
              >
                <SelectTrigger id="category">
                  <SelectValue placeholder={t.common.selectCategory} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="food">
                    {t.addTransaction.categories.food}
                  </SelectItem>
                  <SelectItem value="shopping">
                    {t.addTransaction.categories.shopping}
                  </SelectItem>
                  <SelectItem value="bills">
                    {t.addTransaction.categories.bills}
                  </SelectItem>
                  <SelectItem value="entertainment">
                    {t.addTransaction.categories.entertainment}
                  </SelectItem>
                  <SelectItem value="transportation">
                    {t.addTransaction.categories.transportation}
                  </SelectItem>
                  <SelectItem value="health">
                    {t.addTransaction.categories.healthcare}
                  </SelectItem>
                  <SelectItem value="education">
                    {t.addTransaction.categories.education}
                  </SelectItem>
                  <SelectItem value="other">
                    {t.addTransaction.categories.other}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <label htmlFor="amount" className="text-sm font-medium">
                {t.budgetTracking.amountLabel}
              </label>
              <Input
                id="amount"
                type="number"
                placeholder="1000000"
                value={budgetAmount}
                onChange={(e) => setBudgetAmount(e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <label htmlFor="period" className="text-sm font-medium">
                {t.budgetTracking.periodLabel}
              </label>
              <Select
                value={budgetPeriod}
                onValueChange={(value) =>
                  setBudgetPeriod(value as "weekly" | "monthly")
                }
              >
                <SelectTrigger id="period">
                  <SelectValue placeholder={t.budgetTracking.selectPeriod} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">
                    {t.budgetTracking.weekly}
                  </SelectItem>
                  <SelectItem value="monthly">
                    {t.budgetTracking.monthly}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              {t.common.cancel}
            </Button>
            <Button
              onClick={handleSaveBudget}
              disabled={
                !selectedCategory || !budgetAmount || Number(budgetAmount) <= 0
              }
            >
              {editingBudgetId ? t.common.update : t.budgetTracking.saveButton}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog xác nhận xóa ngân sách */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.common.confirmDelete}</AlertDialogTitle>
            <AlertDialogDescription>
              {t.budgetTracking.confirmDeleteBudget}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.common.cancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteBudget}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t.common.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
