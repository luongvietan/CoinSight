"use client";

import { useState } from "react";
import { format } from "date-fns";
import { vi, enUS } from "date-fns/locale";
import { CalendarIcon, X } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
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

  const handleSelect = (date: Date | undefined) => {
    if (date) {
      onSelectDate(date);
      setIsDialogOpen(true);
    }
  };

  // Function to determine if a date has high spending
  const isHighSpendingDay = (date: Date) => {
    return highSpendingDays.some(
      (d) => d.toISOString().split("T")[0] === date.toISOString().split("T")[0]
    );
  };

  // Get total spending for selected date
  const getTotalSpending = () => {
    return selectedDateTransactions
      .filter((t) => t.amount < 0)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
  };

  // Get total income for selected date
  const getTotalIncome = () => {
    return selectedDateTransactions
      .filter((t) => t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0);
  };

  return (
    <div className="space-y-4">
      <div className="bg-card rounded-lg border p-3">
        <Calendar
          mode="single"
          selected={selectedDate || undefined}
          onSelect={handleSelect}
          className="rounded-md"
          locale={language === "vi" ? vi : enUS}
          modifiers={{
            highSpending: highSpendingDays,
          }}
          modifiersClassNames={{
            highSpending: "bg-destructive/20 font-bold text-destructive",
          }}
          components={{
            DayContent: (props) => {
              const isHighSpending = isHighSpendingDay(props.date);
              return (
                <div
                  className={`relative flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-accent ${
                    isHighSpending ? "font-bold" : ""
                  }`}
                >
                  {props.date.getDate()}
                  {isHighSpending && (
                    <div className="absolute bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-destructive" />
                  )}
                </div>
              );
            },
          }}
        />
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
