//financial-calendar.tsx :
"use client";

import { useState, useCallback } from "react";
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

// Cập nhật financial-calendar.tsx với một hàm chuyển đổi ngày từ Date sang yyyy-MM-dd string
const getFormattedDateString = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// Cập nhật hàm transactionsForDate để sử dụng phương thức mới này
const transactionsForDate = (date: Date) => {
  try {
    // Tạo dateKey theo đúng định dạng YYYY-MM-DD
    const dateKey = getDateKey(date);

    // Kiểm tra chi tiết quá trình so khớp
    // console.log("Đang tìm giao dịch cho ngày:", dateKey);
    // console.log(
    //   "So sánh với high spending days:",
    //   highSpendingDays.map((t) => ({ id: t.id, date: t.date }))
    // );

    // So khớp chính xác với rawDate của các giao dịch
    return highSpendingDays.filter((t) => t.date === dateKey);
  } catch (error) {
    console.error("Lỗi khi tìm giao dịch theo ngày:", error);
    return [];
  }
};

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
    // Tạo date chuẩn từ date được click sử dụng UTC
    const normalizedDate = new Date(
      Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
    );

    onSelectDate(normalizedDate);
    setIsDialogOpen(true);

    // Thêm log chi tiết để debug
    // console.log("===== DEBUG FINANCIAL CALENDAR =====");
    // console.log("1. Selected date object:", date);
    // console.log("2. Normalized date:", normalizedDate);
    // console.log("3. Date ISO string:", normalizedDate.toISOString());

    // Sử dụng getDateKey nếu đã thêm hàm này
    const dateKey = getDateKey(normalizedDate);
    // console.log("4. Date key:", dateKey);

    // Log các giao dịch tìm được
    // console.log("5. Found transactions for date:", selectedDateTransactions);

    // Log all transactions
    // console.log(
    //   "6. All high spending transactions:",
    //   highSpendingDays.map((t) => ({
    //     id: t.id,
    //     date: t.date,
    //     desc: t.description,
    //   }))
    // );

    // console.log("7. Selected date transactions:", selectedDateTransactions);

    // Thêm vào hàm handleSelect
    // console.log(
    //   "Transaction dates in raw format:",
    //   highSpendingDays.map((t) => ({
    //     id: t.id,
    //     rawDate: t.date,
    //     parsedDateKey: getDateKey(createDateWithoutTimezone(t.date)),
    //     description: t.description,
    //   }))
    // );

    // console.log("Selected date key:", dateKey);
    // console.log("Matching transactions:", selectedDateTransactions);
  };

  const goToPreviousMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
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

  const renderCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentMonth);
    const startDay = getDay(startOfMonth(currentMonth));
    const days = [];

    for (let i = 0; i < startDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-8"></div>);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(
        Date.UTC(currentMonth.getFullYear(), currentMonth.getMonth(), day)
      );
      const isSelected =
        selectedDate &&
        selectedDate.getUTCDate() === date.getUTCDate() &&
        selectedDate.getUTCMonth() === date.getUTCMonth() &&
        selectedDate.getUTCFullYear() === date.getUTCFullYear();

      // Tạo dateKey theo đúng định dạng:
      const dateKey = getDateKey(date);

      // Cải thiện cách tìm giao dịch cho ngày
      let transactions = [];

      // Thử các định dạng khác nhau để tìm giao dịch
      const paddedDay = String(day).padStart(2, "0");
      const yearMonthStr = `${currentMonth.getFullYear()}-${String(
        currentMonth.getMonth() + 1
      ).padStart(2, "0")}`;
      const fullDateStr = `${yearMonthStr}-${paddedDay}`;

      // Cải thiện tìm kiếm giao dịch - kiểm tra nhiều định dạng
      transactions = highSpendingDays.filter((t) => {
        // Kiểm tra nếu là chính xác ngày này
        if (t.date === fullDateStr) {
          return true;
        }

        // Kiểm tra startsWith cho các trường hợp có thêm thời gian
        if (t.date.startsWith(fullDateStr)) {
          return true;
        }

        // Xử lý trường hợp định dạng khác như yyyy/mm/dd
        const altFormat = fullDateStr.replace(/-/g, "/");
        if (t.date === altFormat || t.date.startsWith(altFormat)) {
          return true;
        }

        return false;
      });

      // Nếu là ngày 20 hoặc 21 tháng 4, 2025, bật debug
      if (
        (day === 20 || day === 21) &&
        currentMonth.getMonth() === 3 &&
        currentMonth.getFullYear() === 2025
      ) {
        console.log(`Debug ngày ${day}/04/2025:`, {
          fullDateStr,
          foundTransactions: transactions.length,
          firstTransaction: transactions[0],
        });
      }

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
                : t.viewTransactions ||
                  "View transaction details for the selected date."}
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4">
            {/* {console.log(
              "Dữ liệu selectedDateTransactions trong Dialog:",
              selectedDateTransactions
            )} */}

            {selectedDateTransactions.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">{t.noTransactions}</p>
                {/* <div className="mt-2 text-xs text-muted-foreground">
                  <p>
                    Debug info:{" "}
                    {selectedDate
                      ? format(selectedDate, "yyyy-MM-dd")
                      : "No date"}
                  </p>
                  <p>
                    Raw date transactions:{" "}
                    {JSON.stringify(
                      highSpendingDays.filter(
                        (t) =>
                          t.date ===
                          (selectedDate ? getDateKey(selectedDate) : "")
                      )
                    )}
                  </p>
                </div> */}
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
