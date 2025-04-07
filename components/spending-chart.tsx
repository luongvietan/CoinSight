//spending-chart.tsx
"use client";

import { useMemo, useState, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
  PieChart,
  Pie,
  Cell,
  Sector,
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingUp,
  ChevronDown,
  ChevronUp,
  BarChart3,
  LineChartIcon,
  PieChartIcon,
  Filter,
  Calendar,
  ArrowUpDown,
  RefreshCw,
} from "lucide-react";
import { useLanguage } from "@/contexts/language-context";
import type { Transaction } from "@/types/transaction";
import { formatCurrency, formatCompactNumber } from "@/lib/utils";
import TransactionList from "./transaction-list";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"; // Thêm import Tabs
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { format, subMonths } from "date-fns";
import { vi, enUS } from "date-fns/locale";
import CategoryManager, { type Category } from "./category-manager";
import EnhancedFinancialCalendar from "./enhanced-financial-calendar";
import React from "react";
import FinancialCalendar from "./financial-calendar";

interface SpendingChartProps {
  transactions: Transaction[];
  isLoading: boolean;
}

// Chart types
type ChartType = "line" | "bar" | "pie";
type TimeRange = "1m" | "3m" | "6m" | "1y" | "all";
type GroupBy = "day" | "week" | "month" | "category";

// Default categories with colors
const defaultCategories: Category[] = [
  { id: "food", name: "Food & Dining", color: "#ef4444" },
  { id: "groceries", name: "Groceries", color: "#84cc16" },
  { id: "shopping", name: "Shopping", color: "#3b82f6" },
  { id: "clothing", name: "Clothing", color: "#8b5cf6" },
  { id: "electronics", name: "Electronics", color: "#06b6d4" },
  { id: "bills", name: "Bills & Utilities", color: "#f97316" },
  { id: "rent", name: "Rent & Housing", color: "#ec4899" },
  { id: "transportation", name: "Transportation", color: "#6366f1" },
  { id: "healthcare", name: "Healthcare", color: "#f43f5e" },
  { id: "education", name: "Education", color: "#10b981" },
  { id: "entertainment", name: "Entertainment", color: "#f59e0b" },
  { id: "travel", name: "Travel", color: "#14b8a6" },
  { id: "gifts", name: "Gifts & Donations", color: "#d946ef" },
  { id: "personal", name: "Personal Care", color: "#0ea5e9" },
  { id: "fitness", name: "Fitness", color: "#22c55e" },
  { id: "subscriptions", name: "Subscriptions", color: "#64748b" },
  { id: "investments", name: "Investments", color: "#0f766e" },
  { id: "income", name: "Income", color: "#22c55e" },
  { id: "salary", name: "Salary", color: "#16a34a" },
  { id: "freelance", name: "Freelance", color: "#15803d" },
  { id: "business", name: "Business", color: "#166534" },
  { id: "other", name: "Other", color: "#64748b" },
];

export default function SpendingChart({
  transactions,
  isLoading,
}: SpendingChartProps) {
  const { language, translations, currency, exchangeRates, refreshRates } =
    useLanguage();
  const [chartType, setChartType] = useState<ChartType>("line");
  const [timeRange, setTimeRange] = useState<TimeRange>("3m");
  const [groupBy, setGroupBy] = useState<GroupBy>("month");
  const [showMobileChart, setShowMobileChart] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [categories, setCategories] = useState<Category[]>(defaultCategories);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const t = translations[language].spendingChart;

  // Debug chartType
  useEffect(() => {
    console.log("Current chartType:", chartType);
  }, [chartType]);

  // Di chuyển formatPeriodLabel vào đây
  const formatPeriodLabel = useCallback(
    (date: Date, groupBy: GroupBy, language: string): string => {
      if (groupBy === "day") {
        return format(date, "MMM d", { locale: language === "vi" ? vi : enUS });
      } else if (groupBy === "week") {
        return `W${format(date, "w")} ${format(date, "MMM", {
          locale: language === "vi" ? vi : enUS,
        })}`;
      } else {
        return format(date, "MMM yyyy", {
          locale: language === "vi" ? vi : enUS,
        });
      }
    },
    []
  );

  // Load categories from localStorage
  useEffect(() => {
    const storedCategories = localStorage.getItem("categories");
    if (storedCategories) {
      try {
        setCategories(JSON.parse(storedCategories));
      } catch (e) {
        console.error("Failed to parse stored categories:", e);
      }
    }
  }, []);

  // Save categories to localStorage when they change
  useEffect(() => {
    localStorage.setItem("categories", JSON.stringify(categories));
  }, [categories]);

  // Filter transactions based on time range
  const filteredTransactions = useMemo(() => {
    if (timeRange === "all") return transactions;

    const now = new Date();
    let startDate: Date;

    switch (timeRange) {
      case "1m":
        startDate = subMonths(now, 1);
        break;
      case "3m":
        startDate = subMonths(now, 3);
        break;
      case "6m":
        startDate = subMonths(now, 6);
        break;
      case "1y":
        startDate = subMonths(now, 12);
        break;
      default:
        startDate = subMonths(now, 3);
    }

    return transactions.filter((t) => {
      const transDate = new Date(t.date);
      return transDate >= startDate && transDate <= now;
    });
  }, [transactions, timeRange]);

  // Filter by selected categories if any
  const categoryFilteredTransactions = useMemo(() => {
    if (selectedCategories.length === 0) return filteredTransactions;

    return filteredTransactions.filter((t) =>
      selectedCategories.includes(t.category)
    );
  }, [filteredTransactions, selectedCategories]);

  // Get recent transactions (last 5)
  const recentTransactions = useMemo(() => {
    return [...categoryFilteredTransactions]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
  }, [categoryFilteredTransactions]);

  // Prepare chart data based on groupBy
  const chartData = useMemo(() => {
    if (categoryFilteredTransactions.length === 0) return [];

    if (groupBy === "category") {
      // Group by category
      const categoryData: Record<
        string,
        { category: string; expenses: number; income: number }
      > = {};

      categoryFilteredTransactions.forEach((t) => {
        if (!categoryData[t.category]) {
          categoryData[t.category] = {
            category: t.category,
            expenses: 0,
            income: 0,
          };
        }

        if (t.amount < 0) {
          categoryData[t.category].expenses += Math.abs(t.amount);
        } else {
          categoryData[t.category].income += t.amount;
        }
      });

      return Object.values(categoryData).sort((a, b) =>
        sortOrder === "desc" ? b.expenses - a.expenses : a.expenses - b.expenses
      );
    } else {
      // Group by time period
      const dateFormat =
        groupBy === "day"
          ? "yyyy-MM-dd"
          : groupBy === "week"
          ? "yyyy-'W'ww"
          : "yyyy-MM";
      const timeData: Record<
        string,
        {
          period: string;
          expenses: number;
          income: number;
          date: Date;
        }
      > = {};

      categoryFilteredTransactions.forEach((t) => {
        const date = new Date(t.date);
        let period: string;

        if (groupBy === "day") {
          period = format(date, "yyyy-MM-dd");
        } else if (groupBy === "week") {
          period = format(date, "yyyy-'W'ww");
        } else {
          period = format(date, "yyyy-MM");
        }

        if (!timeData[period]) {
          timeData[period] = {
            period,
            expenses: 0,
            income: 0,
            date,
          };
        }

        if (t.amount < 0) {
          timeData[period].expenses += Math.abs(t.amount);
        } else {
          timeData[period].income += t.amount;
        }
      });

      return Object.values(timeData)
        .sort((a, b) => a.date.getTime() - b.date.getTime())
        .map((item) => ({
          ...item,
          period: formatPeriodLabel(item.date, groupBy, language),
        }));
    }
  }, [categoryFilteredTransactions, groupBy, language, sortOrder]);

  // Get category color
  const getCategoryColor = (categoryId: string): string => {
    const category = categories.find((c) => c.id === categoryId);
    return category?.color || "#64748b"; // Default gray
  };

  // Get category name
  const getCategoryName = (categoryId: string): string => {
    const category = categories.find((c) => c.id === categoryId);
    return category?.name || categoryId;
  };

  // Custom formatter for Y-axis (convert to "Tỷ")
  const formatYAxis = (value: number): string => {
    if (value >= 1_000_000_000) {
      return `${(value / 1_000_000_000).toFixed(0)} Tỷ`;
    } else if (value >= 1_000_000) {
      return `${(value / 1_000_000).toFixed(0)} Triệu`;
    } else if (value >= 1_000) {
      return `${(value / 1_000).toFixed(0)} Nghìn`;
    }
    return value.toString();
  };

  // Custom tooltip for charts
  const CustomTooltip = React.memo(({ active, payload, label }: any) => {
    if (!active || !payload || payload.length === 0) return null;

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-background p-4 border rounded-md shadow-lg"
      >
        <p className="font-semibold text-lg">{label}</p>
        {payload.map((entry: any, index: number) => {
          const isExpense = entry.dataKey === "expenses";
          const isIncome = entry.dataKey === "income";
          const color = isExpense
            ? "text-destructive"
            : isIncome
            ? "text-primary"
            : entry.color;

          return (
            <p key={`item-${index}`} className={`text-sm ${color}`}>
              <span className="font-medium">{entry.name}:</span>{" "}
              {formatCurrency(entry.value, currency, exchangeRates, "VND")}
            </p>
          );
        })}
      </motion.div>
    );
  });

  // Custom active shape for pie chart
  const renderActiveShape = (props: any) => {
    const {
      cx,
      cy,
      innerRadius,
      outerRadius,
      startAngle,
      endAngle,
      fill,
      payload,
      percent,
      value,
    } = props;

    return (
      <g>
        <text
          x={cx}
          y={cy}
          dy={-20}
          textAnchor="middle"
          className="text-sm font-medium text-foreground"
        >
          {payload.category}
        </text>
        <text
          x={cx}
          y={cy}
          textAnchor="middle"
          className="text-lg font-bold text-foreground"
        >
          {formatCurrency(value, currency, exchangeRates, "VND")}
        </text>
        <text
          x={cx}
          y={cy}
          dy={20}
          textAnchor="middle"
          className="text-xs text-muted-foreground"
        >
          {`${(percent * 100).toFixed(1)}%`}
        </text>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius + 6}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
        />
        <Sector
          cx={cx}
          cy={cy}
          startAngle={startAngle}
          endAngle={endAngle}
          innerRadius={outerRadius + 6}
          outerRadius={outerRadius + 10}
          fill={fill}
        />
      </g>
    );
  };

  // Handle pie chart hover
  const onPieEnter = useCallback((_: any, index: number) => {
    setActiveIndex(index);
  }, []);

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    const totalExpenses = categoryFilteredTransactions
      .filter((t) => t.amount < 0)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    const totalIncome = categoryFilteredTransactions
      .filter((t) => t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0);

    const balance = totalIncome - totalExpenses;

    // Calculate top spending categories
    const categorySpending: Record<string, number> = {};
    categoryFilteredTransactions
      .filter((t) => t.amount < 0)
      .forEach((t) => {
        categorySpending[t.category] =
          (categorySpending[t.category] || 0) + Math.abs(t.amount);
      });

    const topCategories = Object.entries(categorySpending)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([category, amount]) => ({ category, amount }));

    return {
      totalExpenses,
      totalIncome,
      balance,
      topCategories,
    };
  }, [categoryFilteredTransactions]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t.title}</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <div className="w-full space-y-4">
            <Skeleton className="w-full h-[250px]" />
            <div className="flex justify-center space-x-8">
              <Skeleton className="w-16 h-4" />
              <Skeleton className="w-16 h-4" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Empty state for no data
  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t.title}</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px]">
          <div className="flex flex-col items-center justify-center h-full">
            <TrendingUp className="h-16 w-16 text-muted-foreground opacity-50 mb-3" />
            <h3 className="text-lg font-medium">{t.noData}</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-xs text-center">
              {t.addDataPrompt}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle>{t.title}</CardTitle>
            <CardDescription>
              {timeRange === "all"
                ? "All time"
                : timeRange === "1m"
                ? "Last month"
                : timeRange === "3m"
                ? "Last 3 months"
                : timeRange === "6m"
                ? "Last 6 months"
                : "Last year"}
            </CardDescription>
          </div>

          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8">
                  <Filter className="h-3.5 w-3.5 mr-1" />
                  <span className="hidden sm:inline">Filter</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Categories</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {categories.map((category) => (
                  <DropdownMenuCheckboxItem
                    key={category.id}
                    checked={
                      selectedCategories.includes(category.id) ||
                      selectedCategories.length === 0
                    }
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedCategories((prev) =>
                          prev.includes(category.id)
                            ? prev
                            : [...prev, category.id]
                        );
                      } else {
                        setSelectedCategories((prev) =>
                          prev.filter((id) => id !== category.id)
                        );
                      }
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: category.color }}
                      />
                      <span>{category.name}</span>
                    </div>
                  </DropdownMenuCheckboxItem>
                ))}
                <DropdownMenuSeparator />
                <div className="px-2 py-1.5">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => setSelectedCategories([])}
                  >
                    Reset Filters
                  </Button>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() =>
                setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"))
              }
            >
              <ArrowUpDown className="h-3.5 w-3.5" />
            </Button>

            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setShowCalendar((prev) => !prev)}
            >
              <Calendar className="h-3.5 w-3.5" />
            </Button>

            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={refreshRates}
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>

            <button
              className="md:hidden flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              onClick={() => setShowMobileChart(!showMobileChart)}
              aria-expanded={showMobileChart}
            >
              {showMobileChart ? (
                <>
                  <span className="mr-1">{t.hideChart}</span>
                  <ChevronUp className="h-4 w-4" />
                </>
              ) : (
                <>
                  <span className="mr-1">{t.showChart}</span>
                  <ChevronDown className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        </CardHeader>

        <CardContent className="px-2 pb-0">
          <div className="flex flex-wrap items-center justify-between gap-2 px-2 mb-4">
            <div className="flex flex-wrap items-center gap-2">
              <Select
                value={timeRange}
                onValueChange={(value) => setTimeRange(value as TimeRange)}
              >
                <SelectTrigger className="h-8 w-[120px]">
                  <SelectValue placeholder="Time Range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1m">Last Month</SelectItem>
                  <SelectItem value="3m">Last 3 Months</SelectItem>
                  <SelectItem value="6m">Last 6 Months</SelectItem>
                  <SelectItem value="1y">Last Year</SelectItem>
                  <SelectItem value="all">All Time</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={groupBy}
                onValueChange={(value) => setGroupBy(value as GroupBy)}
              >
                <SelectTrigger className="h-8 w-[120px]">
                  <SelectValue placeholder="Group By" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">Daily</SelectItem>
                  <SelectItem value="week">Weekly</SelectItem>
                  <SelectItem value="month">Monthly</SelectItem>
                  <SelectItem value="category">Category</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Tabs
                value={chartType}
                onValueChange={(value) => setChartType(value as ChartType)}
              >
                <TabsList className="h-8">
                  <TabsTrigger value="line">
                    <LineChartIcon className="h-3.5 w-3.5" />
                  </TabsTrigger>
                  <TabsTrigger value="bar">
                    <BarChart3 className="h-3.5 w-3.5" />
                  </TabsTrigger>
                  <TabsTrigger value="pie">
                    <PieChartIcon className="h-3.5 w-3.5" />
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              <CategoryManager
                categories={categories}
                onCategoriesChange={setCategories}
                defaultCategories={defaultCategories}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <Card className="bg-primary/5 border-primary/10">
              <CardContent className="p-4">
                <div className="flex flex-col">
                  <span className="text-sm text-muted-foreground">
                    Total Income
                  </span>
                  <span className="text-2xl font-bold text-primary">
                    {formatCurrency(
                      summaryStats.totalIncome,
                      currency,
                      exchangeRates,
                      "VND"
                    )}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-destructive/5 border-destructive/10">
              <CardContent className="p-4">
                <div className="flex flex-col">
                  <span className="text-sm text-muted-foreground">
                    Total Expenses
                  </span>
                  <span className="text-2xl font-bold text-destructive">
                    {formatCurrency(
                      summaryStats.totalExpenses,
                      currency,
                      exchangeRates,
                      "VND"
                    )}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card
              className={`${
                summaryStats.balance >= 0
                  ? "bg-primary/5 border-primary/10"
                  : "bg-destructive/5 border-destructive/10"
              }`}
            >
              <CardContent className="p-4">
                <div className="flex flex-col">
                  <span className="text-sm text-muted-foreground">Balance</span>
                  <span
                    className={`text-2xl font-bold ${
                      summaryStats.balance >= 0
                        ? "text-primary"
                        : "text-destructive"
                    }`}
                  >
                    {formatCurrency(
                      summaryStats.balance,
                      currency,
                      exchangeRates,
                      "VND"
                    )}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          <div
            className={`transition-all duration-300 overflow-hidden ${
              showMobileChart
                ? "h-[400px] opacity-100"
                : "h-0 md:h-[400px] opacity-0 md:opacity-100"
            }`}
          >
            <div className="h-full w-full">
              <AnimatePresence mode="wait">
                <motion.div
                  key={`${chartType}-${groupBy}-${timeRange}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="h-full w-full"
                >
                  {chartType === "line" && (
                    <ResponsiveContainer
                      width="100%"
                      height="100%"
                      aria-label={t.ariaLabel}
                      className="chart-container"
                    >
                      <LineChart
                        data={chartData}
                        margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="hsl(var(--border))"
                        />
                        <XAxis
                          dataKey={
                            groupBy === "category" ? "category" : "period"
                          }
                          stroke="hsl(var(--foreground))"
                          tick={{ fill: "hsl(var(--foreground))" }}
                          tickFormatter={(value) => {
                            if (groupBy === "category") {
                              return (
                                getCategoryName(value).substring(0, 10) +
                                (getCategoryName(value).length > 10
                                  ? "..."
                                  : "")
                              );
                            }
                            return value;
                          }}
                        />
                        <YAxis
                          stroke="hsl(var(--foreground))"
                          tick={{ fill: "hsl(var(--foreground))" }}
                          tickFormatter={formatYAxis}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                        {groupBy !== "category" && (
                          <Line
                            type="monotone"
                            dataKey="income"
                            stroke="hsl(var(--primary))"
                            strokeWidth={3}
                            dot={{ r: 5, fill: "hsl(var(--primary))" }}
                            activeDot={{ r: 8, fill: "hsl(var(--primary))" }}
                            name={t.income}
                            className="income-line"
                          />
                        )}
                        <Line
                          type="monotone"
                          dataKey="expenses"
                          stroke="hsl(var(--destructive))"
                          strokeWidth={3}
                          dot={{ r: 5, fill: "hsl(var(--destructive))" }}
                          activeDot={{ r: 8, fill: "hsl(var(--destructive))" }}
                          name={t.expenses}
                          className="expenses-line"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  )}

                  {chartType === "bar" && (
                    <ResponsiveContainer
                      width="100%"
                      height="100%"
                      aria-label={t.ariaLabel}
                      className="chart-container"
                    >
                      {chartData.some(
                        (item) => item.income > 0 || item.expenses > 0
                      ) ? (
                        <BarChart
                          data={chartData}
                          margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                        >
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="hsl(var(--border))"
                          />
                          <XAxis
                            dataKey={
                              groupBy === "category" ? "category" : "period"
                            }
                            stroke="hsl(var(--foreground))"
                            tick={{ fill: "hsl(var(--foreground))" }}
                            tickFormatter={(value) => {
                              if (groupBy === "category") {
                                return (
                                  getCategoryName(value).substring(0, 10) +
                                  (getCategoryName(value).length > 10
                                    ? "..."
                                    : "")
                                );
                              }
                              return value;
                            }}
                          />
                          <YAxis
                            stroke="hsl(var(--foreground))"
                            tick={{ fill: "hsl(var(--foreground))" }}
                            tickFormatter={formatYAxis}
                          />
                          <Tooltip content={<CustomTooltip />} />
                          <Legend />
                          {groupBy !== "category" && (
                            <Bar
                              dataKey="income"
                              fill="hsl(var(--primary))"
                              name={t.income}
                              radius={[4, 4, 0, 0]}
                              className="income-bar"
                            />
                          )}
                          <Bar
                            dataKey="expenses"
                            fill="hsl(var(--destructive))"
                            name={t.expenses}
                            radius={[4, 4, 0, 0]}
                            className="expenses-bar"
                          />
                        </BarChart>
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <p className="text-muted-foreground">
                            No data available for Bar Chart
                          </p>
                        </div>
                      )}
                    </ResponsiveContainer>
                  )}

                  {chartType === "pie" && (
                    <ResponsiveContainer
                      width="100%"
                      height="100%"
                      aria-label={t.ariaLabel}
                      className="chart-container"
                    >
                      {chartData.some((item) => item.expenses > 0) ? (
                        <PieChart>
                          <Pie
                            activeIndex={activeIndex}
                            activeShape={renderActiveShape}
                            data={
                              groupBy === "category"
                                ? chartData.map((item) => ({
                                    ...item,
                                    name:
                                      "category" in item
                                        ? getCategoryName(item.category)
                                        : "",
                                    value: item.expenses,
                                  }))
                                : chartData.map((item) => ({
                                    ...item,
                                    name: "period" in item ? item.period : "",
                                    value: item.expenses,
                                  }))
                            }
                            cx="50%"
                            cy="50%"
                            innerRadius={70}
                            outerRadius={90}
                            fill="url(#gradient)"
                            dataKey="value"
                            nameKey={groupBy === "category" ? "name" : "period"}
                            onMouseEnter={onPieEnter}
                            label={({ name, percent }) =>
                              `${name}: ${(percent * 100).toFixed(1)}%`
                            }
                            labelLine={false}
                            paddingAngle={5} // Tăng khoảng cách giữa các phần
                          >
                            {/* Gradient màu sắc */}
                            <defs>
                              <linearGradient
                                id="gradient"
                                x1="0"
                                y1="0"
                                x2="1"
                                y2="1"
                              >
                                <stop offset="0%" stopColor="#4caf50" />
                                <stop offset="100%" stopColor="#81c784" />
                              </linearGradient>
                            </defs>

                            {chartData.map((entry, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={
                                  groupBy === "category"
                                    ? "category" in entry
                                      ? getCategoryColor(entry.category)
                                      : "#64748b" // Default color for entries without category
                                    : `hsl(${index * 30}, 70%, 50%)`
                                }
                                stroke="#fff" // Đường viền trắng
                                strokeWidth={2} // Độ dày đường viền
                              />
                            ))}
                          </Pie>
                          <Tooltip content={<CustomTooltip />} />
                        </PieChart>
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <p className="text-muted-foreground">
                            No expenses data available for Pie Chart
                          </p>
                        </div>
                      )}
                    </ResponsiveContainer>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {showCalendar ? (
            <div className="mt-4">
              <EnhancedFinancialCalendar
                transactions={transactions}
                onSelectDate={setSelectedDate}
                selectedDate={selectedDate}
              />
            </div>
          ) : (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium">
                  {translations[language].dashboard.recentTransactions}
                </h3>
                {summaryStats.topCategories.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {summaryStats.topCategories.map(({ category, amount }) => (
                      <Badge
                        key={category}
                        variant="outline"
                        className="bg-muted/50"
                      >
                        <div
                          className="w-2 h-2 rounded-full mr-1"
                          style={{
                            backgroundColor: getCategoryColor(category),
                          }}
                        />
                        <span>{getCategoryName(category)}</span>
                        <span className="ml-1 text-xs opacity-70">
                          {formatCurrency(
                            amount,
                            currency,
                            exchangeRates,
                            "VND"
                          )}
                        </span>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
              <TransactionList
                transactions={recentTransactions}
                isLoading={false}
              />
            </div>
          )}
        </CardContent>

        <CardFooter className="flex justify-between pt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowCalendar((prev) => !prev)}
          >
            {showCalendar ? "Show Transactions" : "Show Calendar"}
          </Button>

          <Button variant="outline" size="sm" onClick={() => window.print()}>
            Export Report
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
}
