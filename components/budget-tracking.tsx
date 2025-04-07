"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Plus } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import type { Transaction } from "@/types/transaction"
import type { Budget } from "@/types/budget"
import { formatCurrency } from "@/lib/utils"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"

interface BudgetTrackingProps {
  budgets: Budget[]
  transactions: Transaction[]
  isLoading: boolean
}

export default function BudgetTracking({ budgets, transactions, isLoading }: BudgetTrackingProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState("")
  const [budgetAmount, setBudgetAmount] = useState("")

  // Calculate spending by category
  const getCategorySpending = (category: string) => {
    return transactions
      .filter((t) => t.category === category && t.amount < 0)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0)
  }

  // Calculate budget usage percentage
  const getUsagePercentage = (category: string) => {
    const budget = budgets.find((b) => b.category === category)
    if (!budget || budget.amount === 0) return 0

    const spending = getCategorySpending(category)
    return Math.min(Math.round((spending / budget.amount) * 100), 100)
  }

  const handleSaveBudget = () => {
    // In a real app, this would save to your backend
    console.log("Saving budget:", {
      category: selectedCategory,
      amount: Number.parseFloat(budgetAmount),
    })

    setIsDialogOpen(false)
    setSelectedCategory("")
    setBudgetAmount("")
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="flex justify-between">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-20" />
            </div>
            <Skeleton className="h-2 w-full" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium">Category Budgets</h3>
        <Button variant="outline" size="sm" onClick={() => setIsDialogOpen(true)} className="gap-1">
          <Plus className="h-3.5 w-3.5" />
          <span>Set Budget</span>
        </Button>
      </div>

      <div className="space-y-4">
        {budgets.length === 0 ? (
          <p className="text-center text-muted-foreground py-4">
            No budgets set. Add your first budget to track spending.
          </p>
        ) : (
          budgets.map((budget) => {
            const usage = getUsagePercentage(budget.category)
            const spending = getCategorySpending(budget.category)

            return (
              <motion.div
                key={budget.category}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-2"
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="capitalize">{budget.category}</span>
                    {usage > 80 && (
                      <span className="text-xs text-destructive">{usage >= 100 ? "Exceeded" : "Almost exceeded"}</span>
                    )}
                  </div>
                  <span className="text-sm">
                    {formatCurrency(spending)} / {formatCurrency(budget.amount)}
                  </span>
                </div>
                <Progress
                  value={usage}
                  max={100}
                  className={usage > 80 ? "bg-destructive/20" : ""}
                  aria-label={`${budget.category} budget usage: ${usage}%`}
                />
              </motion.div>
            )
          })
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Set Budget</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label htmlFor="category" className="text-sm font-medium">
                Category
              </label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger id="category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="food">Food</SelectItem>
                  <SelectItem value="shopping">Shopping</SelectItem>
                  <SelectItem value="bills">Bills</SelectItem>
                  <SelectItem value="entertainment">Entertainment</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <label htmlFor="amount" className="text-sm font-medium">
                Budget Amount
              </label>
              <Input
                id="amount"
                type="number"
                placeholder="1000000"
                value={budgetAmount}
                onChange={(e) => setBudgetAmount(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveBudget} disabled={!selectedCategory || !budgetAmount}>
              Save Budget
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

