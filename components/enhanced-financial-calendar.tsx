//enhance-financial-calendar.tsx :
"use client";

import { useState, useMemo, useCallback } from "react";
import {
  format,
  isSameDay,
  isToday,
  isSameMonth,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
} from "date-fns";
import { vi, enUS } from "date-fns/locale";
import {
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  CalendarIcon,
} from "lucide-react";
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
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import React from "react";

// Tối ưu hiệu suất bằng việc tách component con
interface DayCellProps {
  day: Date;
  isCurrentMonth: boolean;
  isHighSpending: boolean;
  isIncomeDay: boolean;
  isTransactionDay: boolean;
  isProfitDay: boolean;
  isLossDay: boolean;
  isSelected: boolean;
  onClick: (date: Date) => void;
}

const DayCell = React.memo(
  ({
    day,
    isCurrentMonth,
    isHighSpending,
    isIncomeDay,
    isTransactionDay,
    isProfitDay,
    isLossDay,
    isSelected,
    onClick,
  }: DayCellProps) => {
    const dayClass = useMemo(() => {
      let baseClass =
        "flex items-center justify-center h-10 w-10 rounded-full relative cursor-pointer transition-colors";

      if (!isCurrentMonth) {
        baseClass += " text-muted-foreground opacity-40";
      }

      if (isToday(day)) {
        baseClass += " font-bold ring-1 ring-primary/30";
      }

      if (isSelected) {
        baseClass += " bg-primary text-primary-foreground";
      } else if (isProfitDay) {
        baseClass += " bg-green-500/80 text-white hover:bg-green-500";
      } else if (isLossDay) {
        baseClass += " bg-red-500/80 text-white hover:bg-red-500";
      } else if (isHighSpending) {
        baseClass += " hover:bg-destructive/20";
      } else if (isIncomeDay) {
        baseClass += " hover:bg-primary/20";
      } else {
        baseClass += " hover:bg-accent";
      }

      return baseClass;
    }, [
      day,
      isCurrentMonth,
      isHighSpending,
      isIncomeDay,
      isTransactionDay,
      isProfitDay,
      isLossDay,
      isSelected,
    ]);

    return (
      <div className={dayClass} onClick={() => onClick(day)}>
        {format(day, "d")}
        {isHighSpending && !isProfitDay && !isLossDay && (
          <span className="absolute bottom-0 right-0 h-2 w-2 bg-destructive rounded-full" />
        )}
        {isIncomeDay && !isProfitDay && !isLossDay && (
          <span className="absolute bottom-0 left-0 h-2 w-2 bg-primary rounded-full" />
        )}
        {isTransactionDay &&
          !isHighSpending &&
          !isIncomeDay &&
          !isProfitDay &&
          !isLossDay && (
            <span className="absolute bottom-0 left-0 h-2 w-2 bg-accent-foreground rounded-full" />
          )}
      </div>
    );
  }
);

interface EnhancedFinancialCalendarProps {
  transactions: Transaction[];
  onSelectDate: (date: Date | null) => void;
  selectedDate: Date | null;
  isLoading?: boolean;
}

export default function EnhancedFinancialCalendar({
  transactions,
  onSelectDate,
  selectedDate,
  isLoading = false,
}: EnhancedFinancialCalendarProps) {
  const { language, translations, currency, exchangeRates } = useLanguage();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [calendarView, setCalendarView] = useState<"month" | "year">("month");
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showTransactions, setShowTransactions] = useState(true);

  const t = translations[language].financialCalendar;

  // Tất cả các tính toán dữ liệu hàng ngày được memoize
  const dailyData = useMemo(() => {
    const data = new Map<
      string,
      {
        date: Date;
        expenses: number;
        income: number;
        transactions: Transaction[];
      }
    >();

    transactions.forEach((transaction) => {
      const date = new Date(transaction.date);
      const dateKey = date.toISOString().split("T")[0];

      if (!data.has(dateKey)) {
        data.set(dateKey, {
          date,
          expenses: 0,
          income: 0,
          transactions: [],
        });
      }

      const dayData = data.get(dateKey)!;

      if (transaction.amount < 0) {
        dayData.expenses += Math.abs(transaction.amount);
      } else {
        dayData.income += transaction.amount;
      }

      dayData.transactions.push(transaction);
    });

    return data;
  }, [transactions]);

  const highSpendingDays = useMemo(() => {
    const spendingDays = Array.from(dailyData.values())
      .filter((day) => day.expenses > 0)
      .sort((a, b) => b.expenses - a.expenses);

    if (spendingDays.length === 0) return [];

    // Get top 25% of spending days
    const threshold = Math.max(
      spendingDays[0]?.expenses * 0.5 || 0, // At least 50% of highest spending
      spendingDays[Math.floor(spendingDays.length * 0.25)]?.expenses || 0
    );

    return spendingDays
      .filter((day) => day.expenses >= threshold)
      .map((day) => day.date);
  }, [dailyData]);

  const incomeDays = useMemo(() => {
    return Array.from(dailyData.values())
      .filter((day) => day.income > 0)
      .map((day) => day.date);
  }, [dailyData]);

  const profitDays = useMemo(() => {
    return Array.from(dailyData.values())
      .filter((day) => day.income > day.expenses && day.transactions.length > 0)
      .map((day) => day.date);
  }, [dailyData]);

  const lossDays = useMemo(() => {
    return Array.from(dailyData.values())
      .filter((day) => day.expenses > day.income && day.transactions.length > 0)
      .map((day) => day.date);
  }, [dailyData]);

  const transactionDays = useMemo(() => {
    return Array.from(dailyData.values())
      .filter((day) => {
        const isHighSpending = highSpendingDays.some((d) =>
          isSameDay(d, day.date)
        );
        const isIncomeDay = incomeDays.some((d) => isSameDay(d, day.date));
        const isProfitDay = profitDays.some((d) => isSameDay(d, day.date));
        const isLossDay = lossDays.some((d) => isSameDay(d, day.date));
        return (
          !isHighSpending &&
          !isIncomeDay &&
          !isProfitDay &&
          !isLossDay &&
          day.transactions.length > 0
        );
      })
      .map((day) => day.date);
  }, [dailyData, highSpendingDays, incomeDays, profitDays, lossDays]);

  const selectedDateData = useMemo(() => {
    if (!selectedDate) return null;

    const dateKey = selectedDate.toISOString().split("T")[0];
    return (
      dailyData.get(dateKey) || {
        date: selectedDate,
        expenses: 0,
        income: 0,
        transactions: [],
      }
    );
  }, [selectedDate, dailyData]);

  const daysInMonth = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  // Convert handlers to useCallback
  const handleDateClick = useCallback(
    (date: Date) => {
      onSelectDate(date);
      setIsDialogOpen(true);
    },
    [onSelectDate, setIsDialogOpen]
  );

  const navigateMonth = useCallback((direction: "prev" | "next") => {
    setCurrentMonth((prev) =>
      direction === "prev" ? subMonths(prev, 1) : addMonths(prev, 1)
    );
  }, []);

  const toggleView = useCallback(() => {
    setShowTransactions(!showTransactions);
  }, [showTransactions]);

  // Tối ưu recentTransactions bằng useMemo
  const recentTransactions = useMemo(() => {
    return [...transactions]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
  }, [transactions]);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-background border-b px-4 py-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-muted-foreground" />
            {translations[language].dashboard.financialCalendar}
          </CardTitle>
          <Tabs
            value={calendarView}
            onValueChange={(v) => setCalendarView(v as any)}
            className="w-auto"
          >
            <TabsList className="h-8">
              <TabsTrigger value="month" className="px-3 text-xs">
                {language === "vi" ? "Tháng" : "Month"}
              </TabsTrigger>
              <TabsTrigger value="year" className="px-3 text-xs">
                {language === "vi" ? "Năm" : "Year"}
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>

      <TabsContent value="month" className="m-0 p-0">
        <CardContent className="p-0">
          <div className="flex items-center justify-between bg-muted/30 px-4 py-2 border-b">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => navigateMonth("prev")}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h3 className="text-base font-medium">
              {format(currentMonth, "MMMM yyyy", {
                locale: language === "vi" ? vi : enUS,
              })}
            </h3>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => navigateMonth("next")}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="p-2">
            {/* Days of week header */}
            <div className="grid grid-cols-7 mb-1">
              {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
                <div
                  key={day}
                  className="flex items-center justify-center h-10 text-sm font-medium text-muted-foreground"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1">
              {/* Previous month days */}
              {Array.from({
                length: new Date(
                  currentMonth.getFullYear(),
                  currentMonth.getMonth(),
                  1
                ).getDay(),
              }).map((_, i) => {
                const day = new Date(
                  currentMonth.getFullYear(),
                  currentMonth.getMonth(),
                  -i
                );
                return (
                  <DayCell
                    key={`prev-${i}`}
                    day={day}
                    isCurrentMonth={isSameMonth(day, currentMonth)}
                    isHighSpending={highSpendingDays.some((d) =>
                      isSameDay(d, day)
                    )}
                    isIncomeDay={incomeDays.some((d) => isSameDay(d, day))}
                    isProfitDay={profitDays.some((d) => isSameDay(d, day))}
                    isLossDay={lossDays.some((d) => isSameDay(d, day))}
                    isTransactionDay={transactionDays.some((d) =>
                      isSameDay(d, day)
                    )}
                    isSelected={
                      selectedDate !== null && isSameDay(selectedDate, day)
                    }
                    onClick={handleDateClick}
                  />
                );
              })}

              {/* Current month days */}
              {daysInMonth.map((day) => (
                <DayCell
                  key={day.toISOString()}
                  day={day}
                  isCurrentMonth={isSameMonth(day, currentMonth)}
                  isHighSpending={highSpendingDays.some((d) =>
                    isSameDay(d, day)
                  )}
                  isIncomeDay={incomeDays.some((d) => isSameDay(d, day))}
                  isProfitDay={profitDays.some((d) => isSameDay(d, day))}
                  isLossDay={lossDays.some((d) => isSameDay(d, day))}
                  isTransactionDay={transactionDays.some((d) =>
                    isSameDay(d, day)
                  )}
                  isSelected={
                    selectedDate !== null && isSameDay(selectedDate, day)
                  }
                  onClick={handleDateClick}
                />
              ))}

              {/* Next month days to fill grid */}
              {Array.from({
                length:
                  42 -
                  (daysInMonth.length +
                    new Date(
                      currentMonth.getFullYear(),
                      currentMonth.getMonth(),
                      1
                    ).getDay()),
              }).map((_, i) => {
                const day = new Date(
                  currentMonth.getFullYear(),
                  currentMonth.getMonth() + 1,
                  i + 1
                );
                return (
                  <DayCell
                    key={`next-${i}`}
                    day={day}
                    isCurrentMonth={isSameMonth(day, currentMonth)}
                    isHighSpending={highSpendingDays.some((d) =>
                      isSameDay(d, day)
                    )}
                    isIncomeDay={incomeDays.some((d) => isSameDay(d, day))}
                    isProfitDay={profitDays.some((d) => isSameDay(d, day))}
                    isLossDay={lossDays.some((d) => isSameDay(d, day))}
                    isTransactionDay={transactionDays.some((d) =>
                      isSameDay(d, day)
                    )}
                    isSelected={
                      selectedDate !== null && isSameDay(selectedDate, day)
                    }
                    onClick={handleDateClick}
                  />
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-4 px-4 py-3 border-t bg-muted/20 text-xs">
            <div className="flex items-center gap-1">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              <span>
                {language === "vi"
                  ? "Thu nhập > Chi tiêu"
                  : "Income > Expenses"}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <div className="h-2 w-2 rounded-full bg-red-500" />
              <span>
                {language === "vi"
                  ? "Chi tiêu > Thu nhập"
                  : "Expenses > Income"}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <div className="h-2 w-2 rounded-full bg-destructive" />
              <span>
                {language === "vi" ? "Ngày chi tiêu cao" : "High spending day"}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <div className="h-2 w-2 rounded-full bg-primary" />
              <span>
                {language === "vi" ? "Ngày có thu nhập" : "Income day"}
              </span>
            </div>
          </div>
        </CardContent>
      </TabsContent>

      <TabsContent value="year" className="m-0 p-0">
        <CardContent className="p-4">
          <div className="grid grid-cols-4 gap-2">
            {Array.from({ length: 12 }).map((_, i) => {
              const month = new Date(currentMonth.getFullYear(), i, 1);
              const monthName = format(month, "MMM", {
                locale: language === "vi" ? vi : enUS,
              });
              const isCurrentMonthSelected = isSameMonth(month, currentMonth);

              // Count transactions in this month
              const transactionsInMonth = transactions.filter((t) => {
                const date = new Date(t.date);
                return (
                  date.getMonth() === i &&
                  date.getFullYear() === currentMonth.getFullYear()
                );
              });

              // Calculate total spending and income for the month
              const monthData = transactionsInMonth.reduce(
                (acc, t) => {
                  if (t.amount < 0) {
                    acc.expenses += Math.abs(t.amount);
                  } else {
                    acc.income += t.amount;
                  }
                  return acc;
                },
                { expenses: 0, income: 0 }
              );

              const hasHighActivity =
                transactionsInMonth.length > 5 || monthData.expenses > 5000000;

              return (
                <Button
                  key={i}
                  variant={isCurrentMonthSelected ? "default" : "outline"}
                  className={`h-24 relative flex flex-col items-center justify-center gap-1 ${
                    hasHighActivity ? "border-destructive/30" : ""
                  }`}
                  onClick={() => {
                    setCurrentMonth(month);
                    setCalendarView("month");
                  }}
                >
                  <span className="text-lg font-medium">{monthName}</span>
                  <span className="text-xs text-muted-foreground">
                    {currentMonth.getFullYear()}
                  </span>
                  {transactionsInMonth.length > 0 && (
                    <Badge variant="outline" className="mt-1 text-xs">
                      {transactionsInMonth.length}{" "}
                      {language === "vi" ? "giao dịch" : "transactions"}
                    </Badge>
                  )}
                  {monthData.expenses > 0 && (
                    <div className="absolute bottom-1 right-1 w-2 h-2 rounded-full bg-destructive" />
                  )}
                </Button>
              );
            })}
          </div>
        </CardContent>
      </TabsContent>

      <CardFooter className="flex justify-between p-2 border-t">
        <Button variant="outline" size="sm" onClick={toggleView}>
          {showTransactions
            ? language === "vi"
              ? "Hiển thị giao dịch"
              : "Show Transactions"
            : language === "vi"
            ? "Hiển thị lịch"
            : "Show Calendar"}
        </Button>
        <Button variant="outline" size="sm">
          {language === "vi" ? "Xuất báo cáo" : "Export Report"}
        </Button>
      </CardFooter>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent
          className="sm:max-w-[425px]"
          aria-describedby="transaction-details-description"
        >
          <DialogHeader>
            <DialogTitle>
              {selectedDate
                ? format(selectedDate, "EEEE, MMMM d, yyyy", {
                    locale: language === "vi" ? vi : enUS,
                  })
                : t.transactionsTitle}
            </DialogTitle>
            <DialogDescription id="transaction-details-description">
              {language === "vi"
                ? "Chi tiết giao dịch cho ngày đã chọn"
                : "Transaction details for selected date"}
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4">
            {!selectedDateData || selectedDateData.transactions.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">{t.noTransactions}</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-primary/10 rounded-lg p-3 text-center">
                    <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
                      <TrendingUp className="h-3.5 w-3.5 text-primary" />
                      <span>{language === "vi" ? "Thu nhập" : "Income"}</span>
                    </div>
                    <p className="text-lg font-bold text-primary">
                      {formatCurrency(
                        selectedDateData.income || 0,
                        currency,
                        exchangeRates,
                        "VND"
                      )}
                    </p>
                  </div>
                  <div className="bg-destructive/10 rounded-lg p-3 text-center">
                    <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
                      <TrendingDown className="h-3.5 w-3.5 text-destructive" />
                      <span>{language === "vi" ? "Chi tiêu" : "Expenses"}</span>
                    </div>
                    <p className="text-lg font-bold text-destructive">
                      {formatCurrency(
                        selectedDateData.expenses || 0,
                        currency,
                        exchangeRates,
                        "VND"
                      )}
                    </p>
                  </div>
                </div>

                <h3 className="font-medium text-sm">
                  {language === "vi" ? "Giao dịch" : "Transactions"}
                </h3>

                <AnimatePresence>
                  <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                    {selectedDateData.transactions.map((transaction) => (
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
                          {formatCurrency(
                            transaction.amount,
                            currency,
                            exchangeRates,
                            "VND"
                          )}
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
    </Card>
  );
}
