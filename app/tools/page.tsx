//tools : 
"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Calculator,
  Calendar,
  ChevronLeft,
  CreditCard,
  ArrowRight,
  Percent,
  RefreshCw,
  DollarSign,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useLanguage } from "@/contexts/language-context";
import { useAuth } from "@/contexts/auth-context";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ModeToggle } from "@/components/mode-toggle";
import Logo from "@/components/logo";
import LanguageCurrencySelector from "@/components/language-currency-selector";
import { Home } from "lucide-react";

export default function ToolsPage() {
  const { language, translations, currency } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("loan-calculator");
  const t = translations[language].tools;

  // Loan Calculator
  const [loanAmount, setLoanAmount] = useState("1000000");
  const [loanInterestRate, setLoanInterestRate] = useState("10");
  const [loanTermMonths, setLoanTermMonths] = useState("12");
  const [monthlyPayment, setMonthlyPayment] = useState(0);
  const [totalPayment, setTotalPayment] = useState(0);
  const [totalInterest, setTotalInterest] = useState(0);

  // Savings Calculator
  const [savingsInitial, setSavingsInitial] = useState("0");
  const [savingsMonthly, setSavingsMonthly] = useState("500000");
  const [savingsRate, setSavingsRate] = useState("7");
  const [savingsTerm, setSavingsTerm] = useState("60");
  const [savingsFinal, setSavingsFinal] = useState(0);
  const [savingsInterest, setSavingsInterest] = useState(0);

  // Currency Converter
  const [fromCurrency, setFromCurrency] = useState("VND");
  const [toCurrency, setToCurrency] = useState("USD");
  const [convertAmount, setConvertAmount] = useState("1000000");
  const [convertResult, setConvertResult] = useState(0);

  // Loan Schedule
  const [scheduleLoanAmount, setScheduleLoanAmount] = useState("1000000");
  const [scheduleInterestRate, setScheduleInterestRate] = useState("10");
  const [scheduleTermMonths, setScheduleTermMonths] = useState("12");
  const [scheduleStartDate, setScheduleStartDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [scheduleData, setScheduleData] = useState<any[]>([]);

  // Tax Calculator
  const [monthlyIncome, setMonthlyIncome] = useState("10000000");
  const [numberOfDependants, setNumberOfDependants] = useState("0");
  const [includeInsurance, setIncludeInsurance] = useState(true);
  const [taxResults, setTaxResults] = useState<any>(null);

  // Định dạng tiền tệ
  const formatCurrency = (amount: number, currencyCode = "VND") => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: currencyCode,
      maximumFractionDigits: currencyCode === "VND" ? 0 : 2,
    }).format(amount);
  };

  // Tính toán khoản vay
  const calculateLoan = () => {
    const principal = parseFloat(loanAmount) || 0;
    const interestRate = (parseFloat(loanInterestRate) || 0) / 100 / 12;
    const months = parseInt(loanTermMonths) || 0;

    if (principal <= 0 || interestRate <= 0 || months <= 0) {
      toast({
        title: t.errorMessage.title,
        description: t.errorMessage.invalidValues,
        variant: "destructive",
      });
      return;
    }

    // Công thức tính PMT (Payment)
    const x = Math.pow(1 + interestRate, months);
    const monthly = (principal * x * interestRate) / (x - 1);

    setMonthlyPayment(monthly);
    setTotalPayment(monthly * months);
    setTotalInterest(monthly * months - principal);
  };

  // Tính toán tiết kiệm
  const calculateSavings = () => {
    const initial = parseFloat(savingsInitial) || 0;
    const monthly = parseFloat(savingsMonthly) || 0;
    const rate = (parseFloat(savingsRate) || 0) / 100 / 12;
    const months = parseInt(savingsTerm) || 0;

    if (rate <= 0 || months <= 0) {
      toast({
        title: t.errorMessage.title,
        description: t.errorMessage.invalidValues,
        variant: "destructive",
      });
      return;
    }

    // Công thức tính FV (Future Value) với khoản đóng góp hàng tháng
    let finalAmount = initial;
    for (let i = 0; i < months; i++) {
      finalAmount = finalAmount * (1 + rate) + monthly;
    }

    setSavingsFinal(finalAmount);
    setSavingsInterest(finalAmount - initial - monthly * months);
  };

  // Chuyển đổi tiền tệ
  const convertCurrency = () => {
    const amount = parseFloat(convertAmount) || 0;

    // Tỷ giá đơn giản (trong thực tế nên sử dụng API)
    const rates = {
      VND_USD: 0.000041,
      USD_VND: 24500,
      VND_EUR: 0.000038,
      EUR_VND: 26500,
      USD_EUR: 0.92,
      EUR_USD: 1.09,
    };

    const rateKey = `${fromCurrency}_${toCurrency}`;
    const rate = rates[rateKey as keyof typeof rates] || 1;

    setConvertResult(amount * rate);
  };

  // Tính toán lịch trả nợ
  const calculateLoanSchedule = () => {
    const principal = parseFloat(scheduleLoanAmount) || 0;
    const interestRate = (parseFloat(scheduleInterestRate) || 0) / 100 / 12;
    const months = parseInt(scheduleTermMonths) || 0;
    const startDate = new Date(scheduleStartDate);

    if (principal <= 0 || interestRate <= 0 || months <= 0) {
      toast({
        title: t.loanSchedule.error.title,
        description: t.loanSchedule.error.invalidValues,
        variant: "destructive",
      });
      return;
    }

    const x = Math.pow(1 + interestRate, months);
    const monthlyPayment = (principal * x * interestRate) / (x - 1);
    let remainingBalance = principal;
    const schedule = [];

    for (let i = 0; i < months; i++) {
      const interest = remainingBalance * interestRate;
      const principalPayment = monthlyPayment - interest;
      remainingBalance -= principalPayment;

      const paymentDate = new Date(startDate);
      paymentDate.setMonth(startDate.getMonth() + i);

      schedule.push({
        period: i + 1,
        date: paymentDate.toLocaleDateString(),
        payment: monthlyPayment,
        principal: principalPayment,
        interest: interest,
        remainingBalance: remainingBalance > 0 ? remainingBalance : 0,
      });
    }

    setScheduleData(schedule);
  };

  // Tính toán thuế
  const calculateTax = () => {
    const income = parseFloat(monthlyIncome) || 0;
    const dependants = parseInt(numberOfDependants) || 0;

    if (income <= 0) {
      toast({
        title: t.taxCalculator.error.title,
        description: t.taxCalculator.error.invalidIncome,
        variant: "destructive",
      });
      return;
    }

    // Các khoản giảm trừ
    const personalDeduction = 11000000; // 11 triệu
    const dependantDeduction = 4400000 * dependants; // 4.4 triệu/người phụ thuộc

    // Bảo hiểm bắt buộc
    let insuranceDeduction = 0;
    if (includeInsurance) {
      const socialInsurance = income * 0.08; // 8%
      const healthInsurance = income * 0.015; // 1.5%
      const unemploymentInsurance = income * 0.01; // 1%
      insuranceDeduction =
        socialInsurance + healthInsurance + unemploymentInsurance;
    }

    // Thu nhập chịu thuế
    const taxableIncome = Math.max(
      0,
      income - personalDeduction - dependantDeduction - insuranceDeduction
    );

    // Tính thuế theo bậc
    const taxBrackets = [
      { rate: 0.05, max: 5000000 },
      { rate: 0.1, max: 10000000 },
      { rate: 0.15, max: 18000000 },
      { rate: 0.2, max: 32000000 },
      { rate: 0.25, max: 52000000 },
      { rate: 0.3, max: 80000000 },
      { rate: 0.35, max: Infinity },
    ];

    let tax = 0;
    let remainingIncome = taxableIncome;
    const taxBreakdown = [];

    for (const bracket of taxBrackets) {
      if (remainingIncome <= 0) break;

      const taxableAmount = Math.min(remainingIncome, bracket.max);
      const bracketTax = taxableAmount * bracket.rate;
      tax += bracketTax;

      taxBreakdown.push({
        rate: bracket.rate * 100,
        income: taxableAmount,
        tax: bracketTax,
      });

      remainingIncome -= taxableAmount;
    }

    const netIncome =
      income - tax - (includeInsurance ? insuranceDeduction : 0);
    const effectiveTaxRate = (tax / income) * 100;

    setTaxResults({
      taxableIncome,
      incomeTax: tax,
      socialInsurance: includeInsurance ? income * 0.08 : 0,
      healthInsurance: includeInsurance ? income * 0.015 : 0,
      unemploymentInsurance: includeInsurance ? income * 0.01 : 0,
      netIncome,
      effectiveTaxRate,
      taxBreakdown,
      deductions: {
        personal: personalDeduction,
        dependant: dependantDeduction,
        insurance: insuranceDeduction,
      },
    });
  };

  // Xuất lịch trả nợ ra CSV
  const exportScheduleToCSV = () => {
    if (scheduleData.length === 0) {
      toast({
        title: t.loanSchedule.error.title,
        description: t.loanSchedule.noData,
        variant: "destructive",
      });
      return;
    }

    const headers = [
      t.loanSchedule.table.period,
      t.loanSchedule.table.date,
      t.loanSchedule.table.payment,
      t.loanSchedule.table.principal,
      t.loanSchedule.table.interest,
      t.loanSchedule.table.remainingBalance,
    ];

    const csvContent = [
      headers.join(","),
      ...scheduleData.map((row) =>
        [
          row.period,
          row.date,
          formatCurrency(row.payment),
          formatCurrency(row.principal),
          formatCurrency(row.interest),
          formatCurrency(row.remainingBalance),
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "loan_schedule.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
                <span className="hidden md:inline">
                  {language === "en" ? "Back to Dashboard" : "Quay lại Dashboard"}
                </span>
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

          <div className="grid gap-6">
            {/* Loan Calculator */}
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger
                  value="loan-calculator"
                  className="flex items-center gap-2"
                >
                  <CreditCard className="h-4 w-4" />
                  <span className="hidden sm:inline">
                    {t.tabs.loanCalculator}
                  </span>
                </TabsTrigger>
                <TabsTrigger
                  value="savings-calculator"
                  className="flex items-center gap-2"
                >
                  <Percent className="h-4 w-4" />
                  <span className="hidden sm:inline">
                    {t.tabs.savingsCalculator}
                  </span>
                </TabsTrigger>
                <TabsTrigger
                  value="currency-converter"
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  <span className="hidden sm:inline">
                    {t.tabs.currencyConverter}
                  </span>
                </TabsTrigger>
                <TabsTrigger
                  value="loan-schedule"
                  className="flex items-center gap-2"
                >
                  <Calendar className="h-4 w-4" />
                  <span className="hidden sm:inline">
                    {t.loanSchedule.title}
                  </span>
                </TabsTrigger>
              </TabsList>

              {/* Loan Calculator */}
              <TabsContent value="loan-calculator">
                <Card>
                  <CardHeader>
                    <CardTitle>{t.loanCalculator.title}</CardTitle>
                    <CardDescription>
                      {t.loanCalculator.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="loan-amount">
                          {t.loanCalculator.loanAmount}
                        </Label>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            id="loan-amount"
                            type="number"
                            className="pl-9"
                            placeholder="1,000,000"
                            value={loanAmount}
                            onChange={(e) => setLoanAmount(e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="loan-interest">
                          {t.loanCalculator.interestRate}
                        </Label>
                        <Input
                          id="loan-interest"
                          type="number"
                          placeholder="10"
                          value={loanInterestRate}
                          onChange={(e) => setLoanInterestRate(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="loan-term">
                          {t.loanCalculator.loanTerm}
                        </Label>
                        <Input
                          id="loan-term"
                          type="number"
                          placeholder="12"
                          value={loanTermMonths}
                          onChange={(e) => setLoanTermMonths(e.target.value)}
                        />
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button onClick={calculateLoan}>
                      {t.loanCalculator.calculate}
                    </Button>
                  </CardFooter>
                </Card>

                {monthlyPayment > 0 && (
                  <Card className="mt-4">
                    <CardHeader>
                      <CardTitle>{t.loanCalculator.results.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid gap-4 md:grid-cols-3">
                        <div className="space-y-2">
                          <Label>
                            {t.loanCalculator.results.monthlyPayment}
                          </Label>
                          <div className="text-2xl font-bold">
                            {formatCurrency(monthlyPayment)}
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>{t.loanCalculator.results.totalPayment}</Label>
                          <div className="text-2xl font-bold">
                            {formatCurrency(totalPayment)}
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>
                            {t.loanCalculator.results.totalInterest}
                          </Label>
                          <div className="text-2xl font-bold">
                            {formatCurrency(totalInterest)}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Savings Calculator */}
              <TabsContent value="savings-calculator">
                <Card>
                  <CardHeader>
                    <CardTitle>{t.savingsCalculator.title}</CardTitle>
                    <CardDescription>
                      {t.savingsCalculator.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="savings-initial">
                          {t.savingsCalculator.initialAmount}
                        </Label>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            id="savings-initial"
                            type="number"
                            className="pl-9"
                            placeholder="0"
                            value={savingsInitial}
                            onChange={(e) => setSavingsInitial(e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="savings-monthly">
                          {t.savingsCalculator.monthlyDeposit}
                        </Label>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            id="savings-monthly"
                            type="number"
                            className="pl-9"
                            placeholder="500,000"
                            value={savingsMonthly}
                            onChange={(e) => setSavingsMonthly(e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="savings-rate">
                          {t.savingsCalculator.interestRate}
                        </Label>
                        <Input
                          id="savings-rate"
                          type="number"
                          placeholder="7"
                          value={savingsRate}
                          onChange={(e) => setSavingsRate(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="savings-term">
                          {t.savingsCalculator.savingsTerm}
                        </Label>
                        <Input
                          id="savings-term"
                          type="number"
                          placeholder="60"
                          value={savingsTerm}
                          onChange={(e) => setSavingsTerm(e.target.value)}
                        />
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button onClick={calculateSavings}>
                      {t.savingsCalculator.calculate}
                    </Button>
                  </CardFooter>
                </Card>

                {savingsFinal > 0 && (
                  <Card className="mt-4">
                    <CardHeader>
                      <CardTitle>{t.savingsCalculator.results.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid gap-4 md:grid-cols-3">
                        <div className="space-y-2">
                          <Label>
                            {t.savingsCalculator.results.futureValue}
                          </Label>
                          <div className="text-2xl font-bold">
                            {formatCurrency(savingsFinal)}
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>
                            {t.savingsCalculator.results.totalPrincipal}
                          </Label>
                          <div className="text-2xl font-bold">
                            {formatCurrency(
                              parseFloat(savingsInitial) +
                                parseFloat(savingsMonthly) *
                                  parseInt(savingsTerm)
                            )}
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>
                            {t.savingsCalculator.results.totalInterest}
                          </Label>
                          <div className="text-2xl font-bold">
                            {formatCurrency(savingsInterest)}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Currency Converter */}
              <TabsContent value="currency-converter">
                <Card>
                  <CardHeader>
                    <CardTitle>{t.currencyConverter.title}</CardTitle>
                    <CardDescription>
                      {t.currencyConverter.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="convert-amount">
                          {t.currencyConverter.amount}
                        </Label>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            id="convert-amount"
                            type="number"
                            className="pl-9"
                            placeholder="1,000,000"
                            value={convertAmount}
                            onChange={(e) => setConvertAmount(e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>{t.currencyConverter.from}</Label>
                        <Select
                          value={fromCurrency}
                          onValueChange={setFromCurrency}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(t.currencyConverter.currencies).map(
                              ([code, name]) => (
                                <SelectItem key={code} value={code}>
                                  {name}
                                </SelectItem>
                              )
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>{t.currencyConverter.to}</Label>
                        <Select
                          value={toCurrency}
                          onValueChange={setToCurrency}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(t.currencyConverter.currencies).map(
                              ([code, name]) => (
                                <SelectItem key={code} value={code}>
                                  {name}
                                </SelectItem>
                              )
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button onClick={convertCurrency}>
                      {t.currencyConverter.convert}
                    </Button>
                  </CardFooter>
                </Card>

                {convertResult > 0 && (
                  <Card className="mt-4">
                    <CardHeader>
                      <CardTitle>{t.currencyConverter.result}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {formatCurrency(convertResult, toCurrency)}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Loan Schedule */}
              <TabsContent value="loan-schedule">
                <Card>
                  <CardHeader>
                    <CardTitle>{t.loanSchedule.title}</CardTitle>
                    <CardDescription>
                      {t.loanSchedule.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="schedule-loan-amount">
                          {t.loanSchedule.loanAmount}
                        </Label>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            id="schedule-loan-amount"
                            type="number"
                            className="pl-9"
                            placeholder="1,000,000"
                            value={scheduleLoanAmount}
                            onChange={(e) =>
                              setScheduleLoanAmount(e.target.value)
                            }
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="schedule-interest-rate">
                          {t.loanSchedule.interestRate}
                        </Label>
                        <Input
                          id="schedule-interest-rate"
                          type="number"
                          placeholder="10"
                          value={scheduleInterestRate}
                          onChange={(e) =>
                            setScheduleInterestRate(e.target.value)
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="schedule-term">
                          {t.loanSchedule.loanTerm}
                        </Label>
                        <Input
                          id="schedule-term"
                          type="number"
                          placeholder="12"
                          value={scheduleTermMonths}
                          onChange={(e) =>
                            setScheduleTermMonths(e.target.value)
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="schedule-start-date">
                          {t.loanSchedule.startDate}
                        </Label>
                        <Input
                          id="schedule-start-date"
                          type="date"
                          value={scheduleStartDate}
                          onChange={(e) => setScheduleStartDate(e.target.value)}
                        />
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <Button onClick={calculateLoanSchedule}>
                      {t.loanSchedule.calculate}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={exportScheduleToCSV}
                      disabled={scheduleData.length === 0}
                    >
                      {t.loanSchedule.export}
                    </Button>
                  </CardFooter>
                </Card>

                {scheduleData.length > 0 && (
                  <Card className="mt-4">
                    <CardHeader>
                      <CardTitle>{t.loanSchedule.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr>
                              <th className="px-4 py-2 text-left">
                                {t.loanSchedule.table.period}
                              </th>
                              <th className="px-4 py-2 text-left">
                                {t.loanSchedule.table.date}
                              </th>
                              <th className="px-4 py-2 text-right">
                                {t.loanSchedule.table.payment}
                              </th>
                              <th className="px-4 py-2 text-right">
                                {t.loanSchedule.table.principal}
                              </th>
                              <th className="px-4 py-2 text-right">
                                {t.loanSchedule.table.interest}
                              </th>
                              <th className="px-4 py-2 text-right">
                                {t.loanSchedule.table.remainingBalance}
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {scheduleData.map((row) => (
                              <tr key={row.period}>
                                <td className="px-4 py-2">{row.period}</td>
                                <td className="px-4 py-2">{row.date}</td>
                                <td className="px-4 py-2 text-right">
                                  {formatCurrency(row.payment)}
                                </td>
                                <td className="px-4 py-2 text-right">
                                  {formatCurrency(row.principal)}
                                </td>
                                <td className="px-4 py-2 text-right">
                                  {formatCurrency(row.interest)}
                                </td>
                                <td className="px-4 py-2 text-right">
                                  {formatCurrency(row.remainingBalance)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </motion.div>

        {/* Phần gợi ý thêm công cụ */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>{t.additionalTools.title}</CardTitle>
            <CardDescription>{t.additionalTools.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <Link href="/tools/loan-schedule">
                <div className="flex items-center p-3 rounded-lg border hover:bg-accent transition-colors">
                  <Calendar className="h-5 w-5 mr-3 text-primary" />
                  <div>
                    <h3 className="font-medium">
                      {t.additionalTools.loanSchedule}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {t.additionalTools.loanScheduleDescription}
                    </p>
                  </div>
                </div>
              </Link>

              <Link href="/tools/tax-calculator">
                <div className="flex items-center p-3 rounded-lg border hover:bg-accent transition-colors">
                  <Percent className="h-5 w-5 mr-3 text-primary" />
                  <div>
                    <h3 className="font-medium">
                      {t.additionalTools.taxCalculator}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {t.additionalTools.taxCalculatorDescription}
                    </p>
                  </div>
                </div>
              </Link>
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full">
              <span>{t.additionalTools.suggestTool}</span>
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>
      </main>
    </div>
  );
}
