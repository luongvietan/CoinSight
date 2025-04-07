"use client"

import type React from "react"

import { ShoppingBag, Coffee, Home, CreditCard, Zap, Briefcase, Car, Heart, Book, Gift, Smartphone } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import type { Transaction } from "@/types/transaction"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { formatCurrency, formatDate } from "@/lib/utils"
import { useLanguage } from "@/contexts/language-context"

interface TransactionListProps {
  transactions: Transaction[]
  isLoading: boolean
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
}

const categoryColors: Record<string, string> = {
  food: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
  groceries: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  shopping: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  clothing: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300",
  electronics: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-300",
  bills: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
  rent: "bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-300",
  transportation: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  healthcare: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  education: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300",
  entertainment: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  travel: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300",
  gifts: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300",
  personal: "bg-fuchsia-100 text-fuchsia-800 dark:bg-fuchsia-900 dark:text-fuchsia-300",
  fitness: "bg-lime-100 text-lime-800 dark:bg-lime-900 dark:text-lime-300",
  subscriptions: "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-300",
  investments: "bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-300",
  income: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  salary: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  freelance: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300",
  business: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  other: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
}

export default function TransactionList({ transactions, isLoading }: TransactionListProps) {
  const { language, currency, exchangeRate } = useLanguage()

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
    )
  }

  if (transactions.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">No transactions found. Add your first transaction!</div>
    )
  }

  return (
    <div className="space-y-4">
      <AnimatePresence>
        {transactions.map((transaction) => (
          <motion.div
            key={transaction.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, height: 0 }}
            whileHover={{ scale: 1.01 }}
            transition={{ duration: 0.2 }}
            className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors"
            tabIndex={0}
            role="button"
            aria-label={`${transaction.description}, ${formatCurrency(transaction.amount, currency, exchangeRate)}, Category: ${transaction.category}`}
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                {categoryIcons[transaction.category] || categoryIcons.other}
              </div>
              <div>
                <div className="font-medium">{transaction.description}</div>
                <div className="text-sm text-muted-foreground">{formatDate(transaction.date, language)}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={categoryColors[transaction.category] || categoryColors.other}>
                {transaction.category}
              </Badge>
              <span className={transaction.amount < 0 ? "text-destructive font-medium" : "text-primary font-medium"}>
                {formatCurrency(transaction.amount, currency, exchangeRate)}
              </span>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

