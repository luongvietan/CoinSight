"use client";

import { useState } from "react";
import { format, getDaysInMonth, startOfMonth, getDay } from "date-fns";
import { vi, enUS } from "date-fns/locale";
import { CalendarIcon, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
  DialogDescription,
} from "@/components/ui/dialog";
import type { Transaction } from "@/types/transaction";
import { formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/contexts/language-context";

interface FinancialCalendarProps {
  highSpendingDays: Date[];
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
  const [currentMonth] = useState(new Date(2025, 3)); // April 2025 (0-indexed)

  const handleSelect = (date: Date) => {
    onSelectDate(date);
    setIsDialogOpen(true);
  };

  const isHighSpendingDay = (date: Date) => {
    return highSpendingDays.some(
      (d) => d.toISOString().split("T")[0] === date.toISOString().split("T")[0]
    );
  };

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

  // Generate calendar days
  const renderCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentMonth);
    const startDay = getDay(startOfMonth(currentMonth));
    const days = [];

    // Add empty cells for days before the 1st of the month
    for (let i = 0; i < startDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-8"></div>);
    }

    // Add days of the month
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
      const isHighSpending = isHighSpendingDay(date);

      days.push(
        <button
          key={day}
          onClick={() => handleSelect(date)}
          className={`h-8 w-8 rounded-full flex items-center justify-center
            ${isSelected ? "bg-blue-500 text-white" : ""}
            ${isHighSpending ? "bg-red-500 text-white font-bold" : ""}
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
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-center">
            {format(currentMonth, "MMMM yyyy", {
              locale: language === "vi" ? vi : enUS,
            })}
          </h2>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center">
          {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
            <div key={day} className="text-sm font-medium text-gray-500">
              {day}
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
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-destructive" />
          <span>{t.highSpendingDay}</span>
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent
          className="sm:max-w-[425px]"
          aria-describedby="calendar-dialog-description"
        >
          <DialogHeader>
            <DialogTitle>Transaction Details</DialogTitle>
            <DialogDescription id="calendar-dialog-description">
              View transaction details for the selected date.
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
                    <p className="text-sm text-muted-foreground">Income</p>
                    <p className="text-lg font-bold text-primary">
                      {formatCurrency(getTotalIncome())}
                    </p>
                  </div>
                  <div className="bg-destructive/10 rounded-lg p-3 text-center">
                    <p className="text-sm text-muted-foreground">Expenses</p>
                    <p className="text-lg font-bold text-destructive">
                      {formatCurrency(getTotalSpending())}
                    </p>
                  </div>
                </div>

                <h3 className="font-medium text-sm">Transactions</h3>

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
