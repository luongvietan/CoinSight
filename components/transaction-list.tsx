//transaction-list.tsx :
"use client";

import { useState, useMemo, memo, useCallback } from "react";
import type React from "react";
import { FixedSizeList as List } from "react-window";
import AutoSizer from "react-virtualized-auto-sizer";

import {
  ShoppingBag,
  Coffee,
  Home,
  CreditCard,
  Zap,
  Briefcase,
  Car,
  Heart,
  Book,
  Gift,
  Smartphone,
  ChevronDown,
  Search,
  Filter,
  ArrowUpDown,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { Transaction } from "@/types/transaction";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatDate, debounce } from "@/lib/utils";
import { useLanguage } from "@/contexts/language-context";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface TransactionListProps {
  transactions: Transaction[];
  isLoading: boolean;
  pageSize?: number;
}

const categoryIcons: Record<string, React.ReactNode> = {
  food: <Coffee className="h-4 w-4" />,
  groceries: <ShoppingBag className="h-4 w-4" />,
  shopping: <ShoppingBag className="h-4 w-4" />,
  clothing: <ShoppingBag className="h-4 w-4" />,
  electronics: <Smartphone className="h-4 w-4" />,
  bills: <Home className="h-4 w-4" />,
  rent: <Home className="h-4 w-4" />,
  transportation: <Car className="h-4 w-4" />,
  healthcare: <Heart className="h-4 w-4" />,
  education: <Book className="h-4 w-4" />,
  entertainment: <Zap className="h-4 w-4" />,
  travel: <Car className="h-4 w-4" />,
  gifts: <Gift className="h-4 w-4" />,
  personal: <CreditCard className="h-4 w-4" />,
  fitness: <Heart className="h-4 w-4" />,
  subscriptions: <CreditCard className="h-4 w-4" />,
  investments: <Briefcase className="h-4 w-4" />,
  income: <Briefcase className="h-4 w-4" />,
  salary: <Briefcase className="h-4 w-4" />,
  freelance: <Briefcase className="h-4 w-4" />,
  business: <Briefcase className="h-4 w-4" />,
  other: <CreditCard className="h-4 w-4" />,
};

const categoryColors: Record<string, string> = {
  food: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
  groceries:
    "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  shopping: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  clothing:
    "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300",
  electronics: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-300",
  bills:
    "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
  rent: "bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-300",
  transportation:
    "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  healthcare: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  education:
    "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300",
  entertainment:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  travel:
    "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300",
  gifts: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300",
  personal:
    "bg-fuchsia-100 text-fuchsia-800 dark:bg-fuchsia-900 dark:text-fuchsia-300",
  fitness: "bg-lime-100 text-lime-800 dark:bg-lime-900 dark:text-lime-300",
  subscriptions:
    "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-300",
  investments: "bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-300",
  income: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  salary: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  freelance:
    "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300",
  business: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  other: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
};

type SortOption = "date-desc" | "date-asc" | "amount-desc" | "amount-asc";

// Chuyển thành các component memoized riêng biệt
const TransactionItem = memo(
  ({
    transaction,
    language,
    currency,
    exchangeRates,
  }: {
    transaction: Transaction;
    language: string;
    currency: string;
    exchangeRates: Record<string, number>;
  }) => {
    const formattedAmount = formatCurrency(
      transaction.amount,
      currency,
      exchangeRates
    );
    const formattedDate = formatDate(transaction.date, language);
    const isIncome = transaction.amount > 0;
    const colorClass = isIncome ? "text-green-600" : "text-red-600";
    const sign = isIncome ? "+" : "";

    const category = transaction.category || "other";
    const categoryColorClass =
      categoryColors[category.toLowerCase()] || categoryColors.other;
    const CategoryIcon =
      categoryIcons[category.toLowerCase()] || categoryIcons.other;

    return (
      <div className="flex items-center justify-between p-2 hover:bg-muted/50 rounded-md transition-colors">
        <div className="flex items-center gap-3">
          <div
            className={`h-10 w-10 rounded-full flex items-center justify-center ${
              categoryColorClass.split(" ")[0]
            }`}
          >
            {CategoryIcon}
          </div>
          <div>
            <p className="font-medium line-clamp-1">
              {transaction.description}
            </p>
            <Badge variant="outline" className={categoryColorClass}>
              {transaction.category || "Other"}
            </Badge>
            <p className="text-sm text-muted-foreground">{formattedDate}</p>
          </div>
        </div>
        <div className={`font-medium ${colorClass}`}>
          {sign}
          {formattedAmount}
        </div>
      </div>
    );
  }
);
TransactionItem.displayName = "TransactionItem";

// Virtual item renderer for react-window
const VirtualRow = memo(({ index, style, data }: any) => {
  const { transactions, language, currency, exchangeRates } = data;
  const transaction = transactions[index];

  return (
    <div style={style}>
      <TransactionItem
        transaction={transaction}
        language={language}
        currency={currency}
        exchangeRates={exchangeRates}
      />
    </div>
  );
});
VirtualRow.displayName = "VirtualRow";

// Tạo component TransactionFilter riêng biệt và memo
const TransactionFilter = memo(
  ({
    searchTerm,
    setSearchTerm,
    categoryFilter,
    setCategoryFilter,
    sortBy,
    setSortBy,
    categories,
    resetFilters,
  }: {
    searchTerm: string;
    setSearchTerm: (value: string) => void;
    categoryFilter: string;
    setCategoryFilter: (value: string) => void;
    sortBy: SortOption;
    setSortBy: (value: SortOption) => void;
    categories: string[];
    resetFilters: () => void;
  }) => {
    // Thêm debounce cho search để tránh rerender quá nhiều
    const debouncedSearch = useMemo(
      () => debounce((value: string) => setSearchTerm(value), 300),
      [setSearchTerm]
    );

    const handleSearchChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        debouncedSearch(e.target.value);
      },
      [debouncedSearch]
    );

    return (
      <div className="mb-4 space-y-2">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-grow">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Tìm kiếm giao dịch..."
              className="pl-8"
              defaultValue={searchTerm}
              onChange={handleSearchChange}
            />
          </div>
          <div className="flex gap-2">
            <Select
              value={categoryFilter}
              onValueChange={(value) => setCategoryFilter(value)}
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Danh mục" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả danh mục</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <ArrowUpDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuGroup>
                  <DropdownMenuItem onClick={() => setSortBy("date-desc")}>
                    Mới nhất trước
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy("date-asc")}>
                    Cũ nhất trước
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy("amount-desc")}>
                    Giá trị cao nhất
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy("amount-asc")}>
                    Giá trị thấp nhất
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              variant="outline"
              size="icon"
              onClick={resetFilters}
              title="Đặt lại bộ lọc"
            >
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  }
);
TransactionFilter.displayName = "TransactionFilter";

function TransactionList({
  transactions,
  isLoading,
  pageSize = 10,
}: TransactionListProps) {
  const { language, currency, exchangeRates } = useLanguage();
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<SortOption>("date-desc");

  // Get unique categories from transactions - memoized
  const categories = useMemo(() => {
    if (transactions.length === 0) return [];

    const uniqueCategories = new Set<string>();
    transactions.forEach((transaction) => {
      if (transaction.category) {
        uniqueCategories.add(transaction.category);
      }
    });
    return Array.from(uniqueCategories).sort();
  }, [transactions]);

  // Filter and sort transactions
  const filteredAndSortedTransactions = useMemo(() => {
    // Nếu không có bộ lọc nào được áp dụng, trả về mảng gốc để tránh tạo mảng mới
    if (!searchTerm && categoryFilter === "all" && sortBy === "date-desc") {
      return transactions;
    }

    let result = [...transactions];

    // Apply search filter
    if (searchTerm) {
      const searchTermLower = searchTerm.toLowerCase();
      result = result.filter((transaction) =>
        transaction.description.toLowerCase().includes(searchTermLower)
      );
    }

    // Apply category filter
    if (categoryFilter && categoryFilter !== "all") {
      result = result.filter(
        (transaction) => transaction.category === categoryFilter
      );
    }

    // Apply sorting
    result.sort((a, b) => {
      switch (sortBy) {
        case "date-desc":
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        case "date-asc":
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        case "amount-desc":
          return b.amount - a.amount;
        case "amount-asc":
          return a.amount - b.amount;
        default:
          return new Date(b.date).getTime() - new Date(a.date).getTime();
      }
    });

    return result;
  }, [transactions, searchTerm, categoryFilter, sortBy]);

  const resetFilters = useCallback(() => {
    setSearchTerm("");
    setCategoryFilter("all");
    setSortBy("date-desc");
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between p-2">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-1">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
            <Skeleton className="h-5 w-20" />
          </div>
        ))}
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <CreditCard className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="font-medium text-lg mb-1">Không có giao dịch nào</h3>
        <p className="text-muted-foreground">
          Bạn chưa có giao dịch nào. Hãy thêm giao dịch mới để bắt đầu.
        </p>
      </div>
    );
  }

  return (
    <div>
      <TransactionFilter
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        categoryFilter={categoryFilter}
        setCategoryFilter={setCategoryFilter}
        sortBy={sortBy}
        setSortBy={setSortBy}
        categories={categories}
        resetFilters={resetFilters}
      />

      {filteredAndSortedTransactions.length === 0 ? (
        <div className="text-center py-6">
          <p className="text-muted-foreground">
            Không tìm thấy giao dịch nào phù hợp với bộ lọc của bạn.
          </p>
          <Button variant="link" onClick={resetFilters} className="mt-2">
            Đặt lại bộ lọc
          </Button>
        </div>
      ) : (
        <div className="h-[400px] w-full">
          <AutoSizer>
            {({ height, width }) => (
              <List
                height={height}
                width={width}
                itemCount={filteredAndSortedTransactions.length}
                itemSize={70}
                itemData={{
                  transactions: filteredAndSortedTransactions,
                  language,
                  currency,
                  exchangeRates,
                }}
              >
                {VirtualRow}
              </List>
            )}
          </AutoSizer>
        </div>
      )}
    </div>
  );
}

export default memo(TransactionList);
