"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, DollarSign, Minus, Info, HelpCircle } from "lucide-react";
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
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";
import { useLanguage } from "@/contexts/language-context";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { ModeToggle } from "@/components/mode-toggle";
import Logo from "@/components/logo";
import LanguageCurrencySelector from "@/components/language-currency-selector";

// Bậc thuế TNCN Việt Nam (2023)
const INCOME_TAX_BRACKETS = [
  { threshold: 5000000, rate: 0.05 },
  { threshold: 10000000, rate: 0.1 },
  { threshold: 18000000, rate: 0.15 },
  { threshold: 32000000, rate: 0.2 },
  { threshold: 52000000, rate: 0.25 },
  { threshold: 80000000, rate: 0.3 },
  { threshold: Infinity, rate: 0.35 },
];

export default function TaxCalculatorPage() {
  const { language, translations, currency } = useLanguage();
  const { toast } = useToast();
  const t = translations[language].tools.taxCalculator;

  const [income, setIncome] = useState("15000000");
  const [dependants, setDependants] = useState("0");
  const [insuranceIncluded, setInsuranceIncluded] = useState(true);
  const [taxableIncome, setTaxableIncome] = useState(0);
  const [incomeTax, setIncomeTax] = useState(0);
  const [socialInsurance, setSocialInsurance] = useState(0);
  const [healthInsurance, setHealthInsurance] = useState(0);
  const [unemploymentInsurance, setUnemploymentInsurance] = useState(0);
  const [netIncome, setNetIncome] = useState(0);
  const [effectiveTaxRate, setEffectiveTaxRate] = useState(0);
  const [taxBreakdown, setTaxBreakdown] = useState<
    { rate: number; tax: number; income: number }[]
  >([]);

  // Định dạng tiền tệ
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(language === "vi" ? "vi-VN" : "en-US", {
      style: "currency",
      currency: currency,
      maximumFractionDigits: currency === "VND" ? 0 : 2,
    }).format(amount);
  };

  // Tính thuế khi thay đổi giá trị đầu vào
  useEffect(() => {
    calculateTax();
  }, [income, dependants, insuranceIncluded]);

  // Tính thuế thu nhập
  const calculateTax = () => {
    const incomeValue = parseFloat(income) || 0;
    const dependantsCount = parseInt(dependants) || 0;

    if (incomeValue <= 0) {
      toast({
        title: t.error.title,
        description: t.error.invalidIncome,
        variant: "destructive",
      });
      return;
    }

    // Tính bảo hiểm (BHXH, BHYT, BHTN)
    const siBase = Math.min(incomeValue, 36000000); // Mức đóng BHXH tối đa 36 triệu
    const socialInsuranceAmount = siBase * 0.08;
    const healthInsuranceAmount = siBase * 0.015;
    const unemploymentInsuranceAmount = siBase * 0.01;

    // Giảm trừ gia cảnh
    const personalDeduction = 11000000; // Mức giảm trừ cá nhân
    const dependantDeduction = dependantsCount * 4400000; // Mức giảm trừ người phụ thuộc

    // Tính thu nhập chịu thuế
    let taxableIncomeAmount =
      incomeValue - personalDeduction - dependantDeduction;

    // Trừ bảo hiểm nếu được chọn
    if (insuranceIncluded) {
      taxableIncomeAmount -=
        socialInsuranceAmount +
        healthInsuranceAmount +
        unemploymentInsuranceAmount;
    }

    // Đảm bảo thu nhập chịu thuế không âm
    taxableIncomeAmount = Math.max(0, taxableIncomeAmount);

    // Tính thuế theo từng bậc
    let taxAmount = 0;
    let remainingIncome = taxableIncomeAmount;
    let previousThreshold = 0;
    const breakdown: { rate: number; tax: number; income: number }[] = [];

    for (const bracket of INCOME_TAX_BRACKETS) {
      const bracketIncome = Math.min(
        remainingIncome,
        bracket.threshold - previousThreshold
      );

      if (bracketIncome > 0) {
        const bracketTax = bracketIncome * bracket.rate;
        taxAmount += bracketTax;
        breakdown.push({
          rate: bracket.rate * 100,
          tax: bracketTax,
          income: bracketIncome,
        });

        remainingIncome -= bracketIncome;
        if (remainingIncome <= 0) break;
      }

      previousThreshold = bracket.threshold;
    }

    // Tính thu nhập thực lãnh
    const netIncomeAmount =
      incomeValue -
      taxAmount -
      (insuranceIncluded
        ? socialInsuranceAmount +
          healthInsuranceAmount +
          unemploymentInsuranceAmount
        : 0);

    // Tính tỷ lệ thuế thực tế
    const effectiveTaxRateValue =
      incomeValue > 0 ? (taxAmount / incomeValue) * 100 : 0;

    // Cập nhật state
    setTaxableIncome(taxableIncomeAmount);
    setIncomeTax(taxAmount);
    setSocialInsurance(socialInsuranceAmount);
    setHealthInsurance(healthInsuranceAmount);
    setUnemploymentInsurance(unemploymentInsuranceAmount);
    setNetIncome(netIncomeAmount);
    setEffectiveTaxRate(effectiveTaxRateValue);
    setTaxBreakdown(breakdown);
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
        <div className="grid gap-8 md:grid-cols-3">
          <motion.div
            className="md:col-span-1"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>{t.title}</CardTitle>
                <CardDescription>{t.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="income">{t.income}</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="income"
                      type="number"
                      className="pl-9"
                      value={income}
                      onChange={(e) => setIncome(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="dependants">{t.dependants}</Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-4 w-4 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{t.tooltips.dependants}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <Input
                    id="dependants"
                    type="number"
                    value={dependants}
                    onChange={(e) => setDependants(e.target.value)}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="insurance"
                    checked={insuranceIncluded}
                    onCheckedChange={setInsuranceIncluded}
                  />
                  <div className="flex items-center gap-2">
                    <Label htmlFor="insurance">{t.insuranceIncluded}</Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-4 w-4 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{t.tooltips.insurance}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            className="md:col-span-2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>{t.results.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        {t.results.taxableIncome}
                      </p>
                      <p className="text-2xl font-bold">
                        {formatCurrency(taxableIncome)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        {t.results.incomeTax}
                      </p>
                      <p className="text-2xl font-bold text-primary">
                        {formatCurrency(incomeTax)}
                      </p>
                    </div>
                    {insuranceIncluded && (
                      <>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">
                            {t.results.socialInsurance}
                          </p>
                          <p className="text-2xl font-bold">
                            {formatCurrency(socialInsurance)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">
                            {t.results.healthInsurance}
                          </p>
                          <p className="text-2xl font-bold">
                            {formatCurrency(healthInsurance)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">
                            {t.results.unemploymentInsurance}
                          </p>
                          <p className="text-2xl font-bold">
                            {formatCurrency(unemploymentInsurance)}
                          </p>
                        </div>
                      </>
                    )}
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        {t.results.netIncome}
                      </p>
                      <p className="text-2xl font-bold text-green-500">
                        {formatCurrency(netIncome)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        {t.results.effectiveTaxRate}
                      </p>
                      <p className="text-2xl font-bold">
                        {effectiveTaxRate.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{t.taxBreakdown.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {taxBreakdown.map((bracket, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>
                            {t.taxBreakdown.rate}: {bracket.rate}%
                          </span>
                          <span>
                            {t.taxBreakdown.tax}: {formatCurrency(bracket.tax)}
                          </span>
                        </div>
                        <Progress
                          value={(bracket.income / taxableIncome) * 100}
                          className="h-2"
                        />
                        <p className="text-xs text-muted-foreground">
                          {t.taxBreakdown.income}:{" "}
                          {formatCurrency(bracket.income)}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
