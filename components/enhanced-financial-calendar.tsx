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
  parseISO,
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
        {isTransactionDay && (
          <span className="absolute top-0 right-0 h-2 w-2 bg-accent-foreground rounded-full" />
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

// Hàm tạo Date từ chuỗi YYYY-MM-DD an toàn về múi giờ
const createDateWithoutTimezone = (dateString: string): Date => {
  try {
    // Xử lý các định dạng ngày hợp lệ khác nhau
    let year, month, day;

    // Kiểm tra xem đầu vào có phải là ngày hợp lệ không
    if (!dateString || typeof dateString !== "string") {
      console.error("Ngày không hợp lệ:", dateString);
      return new Date(0); // Trả về ngày mặc định nếu không hợp lệ
    }

    // Xử lý định dạng YYYY-MM-DD (tiêu chuẩn)
    if (dateString.includes("-")) {
      [year, month, day] = dateString.split("-").map(Number);
    }
    // Xử lý định dạng YYYY/MM/DD
    else if (dateString.includes("/")) {
      [year, month, day] = dateString.split("/").map(Number);
    }
    // Các định dạng khác có thể được hỗ trợ ở đây
    else {
      console.error("Định dạng ngày không được hỗ trợ:", dateString);
      return new Date(0);
    }

    // Kiểm tra các giá trị sau khi phân tích
    if (isNaN(year) || isNaN(month) || isNaN(day)) {
      console.error("Không thể phân tích ngày:", dateString, [
        year,
        month,
        day,
      ]);
      return new Date(0);
    }

    // Tạo ngày an toàn với múi giờ UTC
    return new Date(Date.UTC(year, month - 1, day));
  } catch (error) {
    console.error("Lỗi khi xử lý ngày:", dateString, error);
    return new Date(0);
  }
};

// Hàm tạo dateKey từ Date
const getDateKey = (date: Date): string => {
  // Kiểm tra date hợp lệ
  if (!date || isNaN(date.getTime())) {
    console.error("Ngày không hợp lệ trong getDateKey:", date);
    return "0000-00-00"; // Trả về giá trị mặc định cho lỗi
  }

  try {
    // Đảm bảo định dạng YYYY-MM-DD sử dụng UTC để tránh vấn đề múi giờ
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, "0");
    const day = String(date.getUTCDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  } catch (error) {
    console.error("Lỗi khi tạo dateKey:", error, date);
    return "0000-00-00";
  }
};

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
    console.log(
      "Đang tính toán lại dailyData, số giao dịch:",
      transactions.length
    );

    const data = new Map<
      string,
      {
        date: Date;
        expenses: number;
        income: number;
        transactions: Transaction[];
      }
    >();

    // Tạo danh sách các giao dịch có vấn đề để debug
    const problematicTransactions: Array<{
      id: string;
      date: string;
      reason: string;
    }> = [];

    transactions.forEach((transaction) => {
      try {
        // Kiểm tra transaction.date có hợp lệ không
        if (!transaction.date) {
          problematicTransactions.push({
            id: transaction.id,
            date: String(transaction.date),
            reason: "Ngày trống",
          });
          return; // Bỏ qua giao dịch này
        }

        // Tạo date từ string an toàn về múi giờ
        const date = createDateWithoutTimezone(transaction.date);

        // Kiểm tra date đã tạo có hợp lệ không
        if (isNaN(date.getTime())) {
          problematicTransactions.push({
            id: transaction.id,
            date: transaction.date,
            reason: "Không thể chuyển đổi thành ngày hợp lệ",
          });
          return; // Bỏ qua giao dịch này
        }

        // Tạo dateKey từ date
        const dateKey = getDateKey(date);

        // Kiểm tra dateKey đã tạo có hợp lệ không
        if (dateKey === "0000-00-00") {
          problematicTransactions.push({
            id: transaction.id,
            date: transaction.date,
            reason: "DateKey không hợp lệ",
          });
          return; // Bỏ qua giao dịch này
        }

        // Debug ngày 20 và 21
        if (date.getUTCDate() === 20 || date.getUTCDate() === 21) {
          console.log(`Giao dịch ngày ${date.getUTCDate()}:`, {
            id: transaction.id,
            rawDate: transaction.date,
            parsedDate: date.toISOString(),
            dateKey,
          });
        }

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
      } catch (error) {
        console.error("Lỗi khi xử lý giao dịch:", transaction, error);
        problematicTransactions.push({
          id: transaction.id,
          date: String(transaction.date),
          reason: "Lỗi xử lý: " + String(error),
        });
      }
    });

    // In log các giao dịch có vấn đề nếu có
    if (problematicTransactions.length > 0) {
      console.error(
        `Có ${problematicTransactions.length} giao dịch có vấn đề:`,
        problematicTransactions
      );
    }

    // In ra tổng số ngày đã xử lý
    console.log(`Tổng số ngày có giao dịch: ${data.size}`);

    return data;
  }, [transactions]);

  // Tạo một hàm helper để so sánh ngày chính xác hơn
  const isSameDayHelper = useCallback((date1: Date, date2: Date): boolean => {
    // Bổ sung kiểm tra null/undefined
    if (!date1 || !date2) {
      return false;
    }

    // Kiểm tra nếu date là invalid
    if (isNaN(date1.getTime()) || isNaN(date2.getTime())) {
      return false;
    }

    // Bổ sung debug log để kiểm tra
    const isDebugDay = date2.getUTCDate() === 20 || date2.getUTCDate() === 21;
    if (isDebugDay) {
      console.log(
        `So sánh ngày ${date2.getUTCDate()}: `,
        date1.toISOString(),
        date2.toISOString(),
        `[${date1.getUTCFullYear()}-${date1.getUTCMonth()}-${date1.getUTCDate()}]`,
        `[${date2.getUTCFullYear()}-${date2.getUTCMonth()}-${date2.getUTCDate()}]`
      );
    }

    // Chuyển đổi cả hai ngày sang cùng định dạng để so sánh
    const day1 = new Date(
      Date.UTC(date1.getUTCFullYear(), date1.getUTCMonth(), date1.getUTCDate())
    );

    const day2 = new Date(
      Date.UTC(date2.getUTCFullYear(), date2.getUTCMonth(), date2.getUTCDate())
    );

    // So sánh timestamp thay vì từng phần riêng lẻ
    return day1.getTime() === day2.getTime();
  }, []);

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

    const days = spendingDays
      .filter((day) => day.expenses >= threshold)
      .map((day) => day.date);

    // Kiểm tra ngày 20 và 21
    // console.log("High spending days:", days.map(d => d.getUTCDate()));

    return days;
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
      .filter((day) => day.transactions.length > 0)
      .map((day) => day.date);
  }, [dailyData]);

  // Sử dụng lại sau khi đã tính toán tất cả các ngày có giao dịch
  const regularTransactionDays = useMemo(() => {
    return transactionDays.filter((day) => {
      const isHighSpending = highSpendingDays.some((d) =>
        isSameDayHelper(d, day)
      );
      const isIncomeDay = incomeDays.some((d) => isSameDayHelper(d, day));
      const isProfitDay = profitDays.some((d) => isSameDayHelper(d, day));
      const isLossDay = lossDays.some((d) => isSameDayHelper(d, day));

      return !isHighSpending && !isIncomeDay && !isProfitDay && !isLossDay;
    });
  }, [
    transactionDays,
    highSpendingDays,
    incomeDays,
    profitDays,
    lossDays,
    isSameDayHelper,
  ]);

  const selectedDateData = useMemo(() => {
    if (!selectedDate) return null;

    // Tạo dateKey từ selectedDate
    const dateKey = getDateKey(selectedDate);

    return (
      dailyData.get(dateKey) || {
        date: selectedDate,
        expenses: 0,
        income: 0,
        transactions: [],
      }
    );
  }, [selectedDate, dailyData, getDateKey]);

  const daysInMonth = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  // Convert handlers to useCallback
  const handleDateClick = useCallback(
    (date: Date) => {
      // Tạo date chuẩn từ date được click sử dụng UTC
      const normalizedDate = new Date(
        Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
      );

      onSelectDate(normalizedDate);
      setIsDialogOpen(true);

      // Thêm log chi tiết để debug
      // console.log("===== DEBUG TRANSACTIONS =====");
      // console.log("1. Clicked date object:", date);
      // console.log("2. Normalized date:", normalizedDate);
      // console.log("3. Date ISO string:", normalizedDate.toISOString());
      // console.log("4. Date yyyy-MM-dd:", getDateKey(normalizedDate));

      const dateKey = getDateKey(normalizedDate);
      // console.log("5. Date key:", dateKey);

      // Log tất cả transactions
      // console.log(
      //   "6. All transactions:",
      //   transactions.map((t) => ({
      //     id: t.id,
      //     date: t.date,
      //     desc: t.description,
      //   }))
      // );

      // Log transactions tìm thấy theo dateKey
      const foundTransactions = dailyData.get(dateKey)?.transactions || [];
      // console.log(
      //   "7. Found transactions by dateKey:",
      //   foundTransactions.length
      // );
      // console.log(
      //   "8. Found transactions details:",
      //   foundTransactions.map((t) => ({
      //     id: t.id,
      //     date: t.date,
      //     desc: t.description,
      //     originalDateStr: t.date,
      //   }))
      // );

      // Log tất cả các khóa trong dailyData
      // console.log("9. All dailyData keys:", Array.from(dailyData.keys()));
    },
    [onSelectDate, setIsDialogOpen, dailyData, getDateKey, transactions]
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
                      isSameDayHelper(d, day)
                    )}
                    isIncomeDay={incomeDays.some((d) =>
                      isSameDayHelper(d, day)
                    )}
                    isProfitDay={profitDays.some((d) =>
                      isSameDayHelper(d, day)
                    )}
                    isLossDay={lossDays.some((d) => isSameDayHelper(d, day))}
                    isTransactionDay={regularTransactionDays.some((d) =>
                      isSameDayHelper(d, day)
                    )}
                    isSelected={
                      selectedDate !== null &&
                      isSameDayHelper(selectedDate, day)
                    }
                    onClick={handleDateClick}
                  />
                );
              })}

              {/* Current month days */}
              {daysInMonth.map((day) => {
                // Đảm bảo rằng day ở định dạng UTC
                const utcDay = new Date(
                  Date.UTC(day.getFullYear(), day.getMonth(), day.getDate())
                );

                return (
                  <DayCell
                    key={utcDay.toISOString()}
                    day={utcDay}
                    isCurrentMonth={isSameMonth(utcDay, currentMonth)}
                    isHighSpending={highSpendingDays.some((d) =>
                      isSameDayHelper(d, utcDay)
                    )}
                    isIncomeDay={incomeDays.some((d) =>
                      isSameDayHelper(d, utcDay)
                    )}
                    isProfitDay={profitDays.some((d) =>
                      isSameDayHelper(d, utcDay)
                    )}
                    isLossDay={lossDays.some((d) => isSameDayHelper(d, utcDay))}
                    isTransactionDay={regularTransactionDays.some((d) =>
                      isSameDayHelper(d, utcDay)
                    )}
                    isSelected={
                      selectedDate !== null &&
                      isSameDayHelper(selectedDate, utcDay)
                    }
                    onClick={handleDateClick}
                  />
                );
              })}

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
                      isSameDayHelper(d, day)
                    )}
                    isIncomeDay={incomeDays.some((d) =>
                      isSameDayHelper(d, day)
                    )}
                    isProfitDay={profitDays.some((d) =>
                      isSameDayHelper(d, day)
                    )}
                    isLossDay={lossDays.some((d) => isSameDayHelper(d, day))}
                    isTransactionDay={regularTransactionDays.some((d) =>
                      isSameDayHelper(d, day)
                    )}
                    isSelected={
                      selectedDate !== null &&
                      isSameDayHelper(selectedDate, day)
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
            <div className="flex items-center gap-1">
              <div className="h-2 w-2 rounded-full bg-accent-foreground" />
              <span>
                {language === "vi" ? "Giao dịch khác" : "Other transactions"}
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
              {selectedDate
                ? language === "vi"
                  ? `Chi tiết giao dịch cho ngày ${format(
                      selectedDate,
                      "dd/MM/yyyy"
                    )}`
                  : `Transaction details for ${format(
                      selectedDate,
                      "MMMM d, yyyy"
                    )}`
                : language === "vi"
                ? "Chi tiết giao dịch"
                : "Transaction details"}
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
