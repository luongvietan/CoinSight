"use client";

import { TrendingDown, TrendingUp, Wallet } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { useLanguage } from "@/contexts/language-context";

interface StatCardsProps {
  income: number;
  expenses: number;
  savings: number;
}

export default function StatCards({
  income,
  expenses,
  savings,
}: StatCardsProps) {
  const { language, translations } = useLanguage();
  const { currency, exchangeRate } = useLanguage();
  const t = translations[language].stat;
  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{t.income}</CardTitle>
          <TrendingUp className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-primary">
            {formatCurrency(income, currency, exchangeRate)}
          </div>
          <p className="text-xs text-muted-foreground">{t.thismonth}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{t.expenses}</CardTitle>
          <TrendingDown className="h-4 w-4 text-destructive" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-destructive">
            {formatCurrency(expenses, currency, exchangeRate)}
          </div>
          <p className="text-xs text-muted-foreground">{t.thismonth}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{t.saving}</CardTitle>
          <Wallet className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatCurrency(savings, currency, exchangeRate)}
          </div>
          <p className="text-xs text-muted-foreground">{t.thismonth}</p>
        </CardContent>
      </Card>
    </>
  );
}
