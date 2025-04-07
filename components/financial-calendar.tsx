//financial-calendar.tsx :
"use client";

import { useState } from "react";
import {
  format,
  getDaysInMonth,
  startOfMonth,
  getDay,
  addMonths,
  subMonths,
} from "date-fns";
import { vi, enUS } from "date-fns/locale";
import { CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import type { Transaction } from "@/types/transaction";
import { formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/contexts/language-context";

interface FinancialCalendarProps {
  highSpendingDays: Transaction[];
  onSelectDate: (date: Date | null) => void;
  selectedDate: Date | null;
  selectedDateTransactions: Transaction[];
}

export default function FinancialCalendar({
  highSpendingDays,
  onSelectDate,
  selectedDate,
  selectedDateTransactions,
}: FinancialCalendarProps) {
  const { language, translations } = useLanguage();
  const t = translations[language].financialCalendar;
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const handleSelect = (date: Date) => {
    onSelectDate(date);
    setIsDialogOpen(true);
  };

  const goToPreviousMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const transactionsForDate = (date: Date) =>
    highSpendingDays.filter((t) => {
      try {
        const transactionDate = new Date(t.date);
        if (isNaN(transactionDate.getTime())) return false;
        return (
          transactionDate.getFullYear() === date.getFullYear() &&
          transactionDate.getMonth() === date.getMonth() &&
          transactionDate.getDate() === date.getDate()
        );
      } catch {
        return false;
      }
    });

  const getTotalSpending = () => {
    return selectedDateTransactions
      .filter((t) => t.amount < 0)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
  };

  const getTotalIncome = () => {
    return selectedDateTransactions
      .filter((t) => t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0);
  };

  const renderCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentMonth);
    const startDay = getDay(startOfMonth(currentMonth));
    const days = [];

    for (let i = 0; i < startDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-8"></div>);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth(),
        day
      );
      const isSelected =
        selectedDate &&
        selectedDate.getDate() === day &&
        selectedDate.getMonth() === currentMonth.getMonth() &&
        selectedDate.getFullYear() === currentMonth.getFullYear();

      const transactions = transactionsForDate(date);
      const totalSpending = transactions
        .filter((t) => t.amount < 0)
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);
      const totalIncome = transactions
        .filter((t) => t.amount > 0)
        .reduce((sum, t) => sum + t.amount, 0);

      // Chỉ hiển thị màu nếu có ít nhất 1 giao dịch
      const hasTransactions = transactions.length > 0;
      const isProfitDay = hasTransactions && totalIncome > totalSpending;
      const isLossDay = hasTransactions && totalSpending > totalIncome;

      days.push(
        <button
          key={day}
          onClick={() => handleSelect(date)}
          className={`h-8 w-8 rounded-full flex items-center justify-center
            ${isSelected ? "bg-blue-500 text-white" : ""}
            ${
              isProfitDay
                ? "bg-green-500 text-white font-bold"
                : isLossDay
                ? "bg-red-500 text-white font-bold"
                : ""
            }
            hover:bg-gray-200 transition-colors`}
        >
          {day}
        </button>
      );
    }

    return days;
  };

  return (
    <div className="space-y-4">
      <div className="bg-[#f0f0f0] rounded-lg border p-4 text-[#333]">
        <div className="mb-4 flex items-center justify-between">
          <Button variant="ghost" size="icon" onClick={goToPreviousMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-lg font-semibold text-center">
            {format(currentMonth, "MMMM yyyy", {
              locale: language === "vi" ? vi : enUS,
            })}
          </h2>
          <Button variant="ghost" size="icon" onClick={goToNextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center">
          {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
            <div key={day} className="text-sm font-medium text-gray-500">
              {t.dayNames?.[day as keyof typeof t.dayNames] || day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1 mt-2">
          {renderCalendarDays()}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <CalendarIcon className="h-4 w-4" />
          <span>
            {selectedDate
              ? format(selectedDate, "PPP", {
                  locale: language === "vi" ? vi : enUS,
                })
              : t.selectDate}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-green-500" />
            <span>{t.incomeGreater || "Income > Expenses"}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-red-500" />
            <span>{t.expensesGreater || "Expenses > Income"}</span>
          </div>
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {t.transactionDetails || "Transaction Details"}
            </DialogTitle>
            <DialogDescription>
              {t.viewTransactions ||
                "View transaction details for the selected date."}
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4">
            {selectedDateTransactions.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">{t.noTransactions}</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-primary/10 rounded-lg p-3 text-center">
                    <p className="text-sm text-muted-foreground">
                      {t.income || "Income"}
                    </p>
                    <p className="text-lg font-bold text-primary">
                      {formatCurrency(getTotalIncome())}
                    </p>
                  </div>
                  <div className="bg-destructive/10 rounded-lg p-3 text-center">
                    <p className="text-sm text-muted-foreground">
                      {t.expenses || "Expenses"}
                    </p>
                    <p className="text-lg font-bold text-destructive">
                      {formatCurrency(getTotalSpending())}
                    </p>
                  </div>
                </div>

                <h3 className="font-medium text-sm">
                  {t.transactions || "Transactions"}
                </h3>

                <AnimatePresence>
                  <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                    {selectedDateTransactions.map((transaction) => (
                      <motion.div
                        key={transaction.id}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex items-center justify-between rounded-md border p-3 hover:bg-accent/50 transition-colors"
                      >
                        <div>
                          <p className="font-medium">
                            {transaction.description}
                          </p>
                          <Badge variant="outline" className="mt-1">
                            {transaction.category}
                          </Badge>
                        </div>
                        <p
                          className={
                            transaction.amount < 0
                              ? "text-destructive font-medium"
                              : "text-primary font-medium"
                          }
                        >
                          {formatCurrency(transaction.amount)}
                        </p>
                      </motion.div>
                    ))}
                  </div>
                </AnimatePresence>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
