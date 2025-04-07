"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  ChevronLeft,
  Download,
  Calendar,
  Info,
  DollarSign,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useLanguage } from "@/contexts/language-context";
import { useAuth } from "@/contexts/auth-context";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { ModeToggle } from "@/components/mode-toggle";
import Logo from "@/components/logo";
import LanguageCurrencySelector from "@/components/language-currency-selector";

interface PaymentScheduleItem {
  period: number;
  date: string;
  payment: number;
  principal: number;
  interest: number;
  remainingBalance: number;
}

export default function LoanSchedulePage() {
  const { language, translations, currency } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const t = translations[language].tools.loanSchedule;

  // State cho thông tin khoản vay
  const [loanAmount, setLoanAmount] = useState("1000000");
  const [loanInterestRate, setLoanInterestRate] = useState("10");
  const [loanTermMonths, setLoanTermMonths] = useState("12");
  const [startDate, setStartDate] = useState("");
  const [paymentSchedule, setPaymentSchedule] = useState<PaymentScheduleItem[]>(
    []
  );

  // Định dạng tiền tệ
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(language === "vi" ? "vi-VN" : "en-US", {
      style: "currency",
      currency: currency,
      maximumFractionDigits: currency === "VND" ? 0 : 2,
    }).format(amount);
  };

  // Định dạng ngày
  const formatDate = (dateString: string): string => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  // Khởi tạo ngày bắt đầu mặc định là ngày hiện tại
  useEffect(() => {
    const today = new Date();
    const formattedDate = today.toISOString().split("T")[0];
    setStartDate(formattedDate);
  }, []);

  // Tính toán lịch trả nợ
  const calculatePaymentSchedule = () => {
    const principal = parseFloat(loanAmount) || 0;
    const interestRate = (parseFloat(loanInterestRate) || 0) / 100 / 12;
    const months = parseInt(loanTermMonths) || 0;

    if (principal <= 0 || interestRate <= 0 || months <= 0 || !startDate) {
      toast({
        title: t.error.title,
        description: t.error.invalidValues,
        variant: "destructive",
      });
      return;
    }

    // Công thức tính PMT (Payment)
    const x = Math.pow(1 + interestRate, months);
    const monthlyPayment = (principal * x * interestRate) / (x - 1);

    // Tạo lịch trả nợ
    const schedule: PaymentScheduleItem[] = [];
    let balance = principal;
    let startingDate = new Date(startDate);

    for (let period = 1; period <= months; period++) {
      const interestPayment = balance * interestRate;
      const principalPayment = monthlyPayment - interestPayment;
      balance -= principalPayment;

      // Tính ngày trả nợ tiếp theo
      const paymentDate = new Date(startingDate);
      paymentDate.setMonth(paymentDate.getMonth() + period);

      schedule.push({
        period,
        date: paymentDate.toISOString().split("T")[0],
        payment: monthlyPayment,
        principal: principalPayment,
        interest: interestPayment,
        remainingBalance: Math.max(0, balance),
      });
    }

    setPaymentSchedule(schedule);
  };

  // Xuất lịch trả nợ ra CSV
  const exportToCSV = () => {
    if (paymentSchedule.length === 0) {
      toast({
        title: t.noData,
        description: t.calculateFirst,
        variant: "warning",
      });
      return;
    }

    // Tạo nội dung CSV
    const headers = `${t.table.period},${t.table.date},${t.table.payment},${t.table.principal},${t.table.interest},${t.table.remainingBalance}\n`;
    const rows = paymentSchedule.map(
      (item) =>
        `${item.period},${formatDate(item.date)},${item.payment.toFixed(
          0
        )},${item.principal.toFixed(0)},${item.interest.toFixed(
          0
        )},${item.remainingBalance.toFixed(0)}`
    );
    const csvContent = `data:text/csv;charset=utf-8,${headers}${rows.join(
      "\n"
    )}`;

    // Tạo và kích hoạt download link
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `lich-tra-no-${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container flex h-16 items-center px-4">
          <div className="flex items-center">
            <Logo />
            <div className="ml-4 hidden md:block">
              <Link href="/tools" className="flex items-center">
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span>{translations[language].tools.backToHome}</span>
                </Button>
              </Link>
            </div>
          </div>
          <div className="ml-auto flex items-center space-x-4">
            <LanguageCurrencySelector />
            <ModeToggle />
          </div>
        </div>
      </header>

      <main className="container px-4 py-6 md:py-10">
        <Card>
          <CardHeader>
            <CardTitle>{t.title}</CardTitle>
            <CardDescription>{t.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="loan-amount">{t.loanAmount}</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="loan-amount"
                    type="number"
                    className="pl-9"
                    value={loanAmount}
                    onChange={(e) => setLoanAmount(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="loan-interest">{t.interestRate}</Label>
                <Input
                  id="loan-interest"
                  type="number"
                  value={loanInterestRate}
                  onChange={(e) => setLoanInterestRate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="loan-term">{t.loanTerm}</Label>
                <Input
                  id="loan-term"
                  type="number"
                  value={loanTermMonths}
                  onChange={(e) => setLoanTermMonths(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="start-date">{t.startDate}</Label>
                <Input
                  id="start-date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
            </div>

            <div className="mt-6 flex gap-4">
              <Button className="flex-1" onClick={calculatePaymentSchedule}>
                {t.calculate}
              </Button>
              <Button
                variant="outline"
                className="flex items-center gap-2"
                onClick={exportToCSV}
              >
                <Download className="h-4 w-4" />
                {t.export}
              </Button>
            </div>

            {paymentSchedule.length > 0 && (
              <div className="mt-8">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t.table.period}</TableHead>
                      <TableHead>{t.table.date}</TableHead>
                      <TableHead>{t.table.payment}</TableHead>
                      <TableHead>{t.table.principal}</TableHead>
                      <TableHead>{t.table.interest}</TableHead>
                      <TableHead>{t.table.remainingBalance}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paymentSchedule.map((item) => (
                      <TableRow key={item.period}>
                        <TableCell>{item.period}</TableCell>
                        <TableCell>{formatDate(item.date)}</TableCell>
                        <TableCell>{formatCurrency(item.payment)}</TableCell>
                        <TableCell>{formatCurrency(item.principal)}</TableCell>
                        <TableCell>{formatCurrency(item.interest)}</TableCell>
                        <TableCell>
                          {formatCurrency(item.remainingBalance)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
