"use client"

import { useState, useMemo } from "react"
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
} from "date-fns"
import { vi, enUS } from "date-fns/locale"
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown, CalendarIcon } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import type { Transaction } from "@/types/transaction"
import { formatCurrency } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { motion, AnimatePresence } from "framer-motion"
import { useLanguage } from "@/contexts/language-context"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface EnhancedFinancialCalendarProps {
  transactions: Transaction[]
  onSelectDate: (date: Date | null) => void
  selectedDate: Date | null
  isLoading?: boolean
}

export default function EnhancedFinancialCalendar({
  transactions,
  onSelectDate,
  selectedDate,
  isLoading = false,
}: EnhancedFinancialCalendarProps) {
  const { language, translations, currency, exchangeRates } = useLanguage()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [calendarView, setCalendarView] = useState<"month" | "year">("month")
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [showTransactions, setShowTransactions] = useState(true)

  const t = translations[language].financialCalendar

  // Calculate daily spending data
  const dailyData = useMemo(() => {
    const data = new Map<
      string,
      {
        date: Date
        expenses: number
        income: number
        transactions: Transaction[]
      }
    >()

    transactions.forEach((transaction) => {
      const date = new Date(transaction.date)
      const dateKey = date.toISOString().split("T")[0]

      if (!data.has(dateKey)) {
        data.set(dateKey, {
          date,
          expenses: 0,
          income: 0,
          transactions: [],
        })
      }

      const dayData = data.get(dateKey)!

      if (transaction.amount < 0) {
        dayData.expenses += Math.abs(transaction.amount)
      } else {
        dayData.income += transaction.amount
      }

      dayData.transactions.push(transaction)
    })

    return data
  }, [transactions])

  // Get high spending days (top 25% of spending days)
  const highSpendingDays = useMemo(() => {
    const spendingDays = Array.from(dailyData.values())
      .filter((day) => day.expenses > 0)
      .sort((a, b) => b.expenses - a.expenses)

    if (spendingDays.length === 0) return []

    // Get top 25% of spending days
    const threshold = Math.max(
      spendingDays[0]?.expenses * 0.5 || 0, // At least 50% of highest spending
      spendingDays[Math.floor(spendingDays.length * 0.25)]?.expenses || 0,
    )

    return spendingDays.filter((day) => day.expenses >= threshold).map((day) => day.date)
  }, [dailyData])

  // Get income days
  const incomeDays = useMemo(() => {
    return Array.from(dailyData.values())
      .filter((day) => day.income > 0)
      .map((day) => day.date)
  }, [dailyData])

  // Get transaction days (that are not high spending or income days)
  const transactionDays = useMemo(() => {
    return Array.from(dailyData.values())
      .filter((day) => {
        const isHighSpending = highSpendingDays.some((d) => isSameDay(d, day.date))
        const isIncomeDay = incomeDays.some((d) => isSameDay(d, day.date))
        return !isHighSpending && !isIncomeDay && day.transactions.length > 0
      })
      .map((day) => day.date)
  }, [dailyData, highSpendingDays, incomeDays])

  // Get selected date data
  const selectedDateData = useMemo(() => {
    if (!selectedDate) return null

    const dateKey = selectedDate.toISOString().split("T")[0]
    return (
      dailyData.get(dateKey) || {
        date: selectedDate,
        expenses: 0,
        income: 0,
        transactions: [],
      }
    )
  }, [selectedDate, dailyData])

  // Get days for current month
  const daysInMonth = useMemo(() => {
    const start = startOfMonth(currentMonth)
    const end = endOfMonth(currentMonth)
    return eachDayOfInterval({ start, end })
  }, [currentMonth])

  // Handle date selection
  const handleDateClick = (date: Date) => {
    onSelectDate(date)
    setIsDialogOpen(true)
  }

  // Navigate to previous/next month
  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentMonth((prev) => (direction === "prev" ? subMonths(prev, 1) : addMonths(prev, 1)))
  }

  // Toggle between transactions and calendar view
  const toggleView = () => {
    setShowTransactions(!showTransactions)
  }

  // Get day class based on its status
  const getDayClass = (day: Date) => {
    const isSelected = selectedDate && isSameDay(selectedDate, day)
    const isCurrentMonth = isSameMonth(day, currentMonth)
    const isHighSpending = highSpendingDays.some((d) => isSameDay(d, day))
    const isIncomeDay = incomeDays.some((d) => isSameDay(d, day))
    const isTransactionDay = transactionDays.some((d) => isSameDay(d, day))

    let baseClass = "flex items-center justify-center h-10 w-10 rounded-full relative cursor-pointer transition-colors"

    if (!isCurrentMonth) {
      baseClass += " text-muted-foreground opacity-40"
    }

    if (isToday(day)) {
      baseClass += " font-bold ring-1 ring-primary/30"
    }

    if (isSelected) {
      baseClass += " bg-primary text-primary-foreground"
    } else if (isHighSpending) {
      baseClass += " hover:bg-destructive/20"
    } else if (isIncomeDay) {
      baseClass += " hover:bg-primary/20"
    } else {
      baseClass += " hover:bg-accent"
    }

    return baseClass
  }

  // Get recent transactions (last 5)
  const recentTransactions = useMemo(() => {
    return [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5)
  }, [transactions])

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-background border-b px-4 py-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-muted-foreground" />
            {t.title}
          </CardTitle>
          <Tabs value={calendarView} onValueChange={(v) => setCalendarView(v as any)} className="w-auto">
            <TabsList className="h-8">
              <TabsTrigger value="month" className="px-3 text-xs">
                Month
              </TabsTrigger>
              <TabsTrigger value="year" className="px-3 text-xs">
                Year
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>

      <TabsContent value="month" className="m-0 p-0">
        <CardContent className="p-0">
          <div className="flex items-center justify-between bg-muted/30 px-4 py-2 border-b">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigateMonth("prev")}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h3 className="text-base font-medium">
              {format(currentMonth, "MMMM yyyy", { locale: language === "vi" ? vi : enUS })}
            </h3>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigateMonth("next")}>
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
              {Array.from({ length: new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay() }).map(
                (_, i) => {
                  const day = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), -i)
                  return (
                    <div key={`prev-${i}`} className={getDayClass(day)} onClick={() => handleDateClick(day)}>
                      {format(day, "d")}
                      {/* Indicators */}
                      <div className="absolute bottom-1 left-0 right-0 flex justify-center gap-0.5">
                        {highSpendingDays.some((d) => isSameDay(d, day)) && (
                          <div className="h-1 w-1 rounded-full bg-destructive" />
                        )}
                        {incomeDays.some((d) => isSameDay(d, day)) && (
                          <div className="h-1 w-1 rounded-full bg-primary" />
                        )}
                        {transactionDays.some((d) => isSameDay(d, day)) && (
                          <div className="h-1 w-1 rounded-full bg-muted-foreground" />
                        )}
                      </div>
                    </div>
                  )
                },
              )}

              {/* Current month days */}
              {daysInMonth.map((day) => (
                <div key={day.toISOString()} className={getDayClass(day)} onClick={() => handleDateClick(day)}>
                  {format(day, "d")}
                  {/* Indicators */}
                  <div className="absolute bottom-1 left-0 right-0 flex justify-center gap-0.5">
                    {highSpendingDays.some((d) => isSameDay(d, day)) && (
                      <div className="h-1 w-1 rounded-full bg-destructive" />
                    )}
                    {incomeDays.some((d) => isSameDay(d, day)) && <div className="h-1 w-1 rounded-full bg-primary" />}
                    {transactionDays.some((d) => isSameDay(d, day)) && (
                      <div className="h-1 w-1 rounded-full bg-muted-foreground" />
                    )}
                  </div>
                </div>
              ))}

              {/* Next month days to fill grid */}
              {Array.from({
                length:
                  42 - (daysInMonth.length + new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay()),
              }).map((_, i) => {
                const day = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, i + 1)
                return (
                  <div key={`next-${i}`} className={getDayClass(day)} onClick={() => handleDateClick(day)}>
                    {format(day, "d")}
                    {/* Indicators */}
                    <div className="absolute bottom-1 left-0 right-0 flex justify-center gap-0.5">
                      {highSpendingDays.some((d) => isSameDay(d, day)) && (
                        <div className="h-1 w-1 rounded-full bg-destructive" />
                      )}
                      {incomeDays.some((d) => isSameDay(d, day)) && <div className="h-1 w-1 rounded-full bg-primary" />}
                      {transactionDays.some((d) => isSameDay(d, day)) && (
                        <div className="h-1 w-1 rounded-full bg-muted-foreground" />
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="flex items-center gap-4 px-4 py-3 border-t bg-muted/20 text-xs">
            <div className="flex items-center gap-1">
              <div className="h-2 w-2 rounded-full bg-destructive" />
              <span>High spending day</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="h-2 w-2 rounded-full bg-primary" />
              <span>Income day</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="h-2 w-2 rounded-full bg-muted-foreground" />
              <span>Transaction day</span>
            </div>
          </div>
        </CardContent>
      </TabsContent>

      <TabsContent value="year" className="m-0 p-0">
        <CardContent className="p-4">
          <div className="grid grid-cols-4 gap-2">
            {Array.from({ length: 12 }).map((_, i) => {
              const month = new Date(currentMonth.getFullYear(), i, 1)
              const monthName = format(month, "MMM", { locale: language === "vi" ? vi : enUS })
              const isCurrentMonthSelected = isSameMonth(month, currentMonth)

              // Count transactions in this month
              const transactionsInMonth = transactions.filter((t) => {
                const date = new Date(t.date)
                return date.getMonth() === i && date.getFullYear() === currentMonth.getFullYear()
              })

              // Calculate total spending and income for the month
              const monthData = transactionsInMonth.reduce(
                (acc, t) => {
                  if (t.amount < 0) {
                    acc.expenses += Math.abs(t.amount)
                  } else {
                    acc.income += t.amount
                  }
                  return acc
                },
                { expenses: 0, income: 0 },
              )

              const hasHighActivity = transactionsInMonth.length > 5 || monthData.expenses > 5000000

              return (
                <Button
                  key={i}
                  variant={isCurrentMonthSelected ? "default" : "outline"}
                  className={`h-24 relative flex flex-col items-center justify-center gap-1 ${
                    hasHighActivity ? "border-destructive/30" : ""
                  }`}
                  onClick={() => {
                    setCurrentMonth(month)
                    setCalendarView("month")
                  }}
                >
                  <span className="text-lg font-medium">{monthName}</span>
                  <span className="text-xs text-muted-foreground">{currentMonth.getFullYear()}</span>
                  {transactionsInMonth.length > 0 && (
                    <Badge variant="outline" className="mt-1 text-xs">
                      {transactionsInMonth.length} transactions
                    </Badge>
                  )}
                  {monthData.expenses > 0 && (
                    <div className="absolute bottom-1 right-1 w-2 h-2 rounded-full bg-destructive" />
                  )}
                </Button>
              )
            })}
          </div>
        </CardContent>
      </TabsContent>

      <CardFooter className="flex justify-between p-2 border-t">
        <Button variant="outline" size="sm" onClick={toggleView}>
          {showTransactions ? "Show Transactions" : "Show Calendar"}
        </Button>
        <Button variant="outline" size="sm">
          Export Report
        </Button>
      </CardFooter>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]" aria-describedby="transaction-details-description">
          <DialogHeader>
            <DialogTitle>
              {selectedDate
                ? format(selectedDate, "EEEE, MMMM d, yyyy", { locale: language === "vi" ? vi : enUS })
                : t.transactionsTitle}
            </DialogTitle>
            <DialogDescription id="transaction-details-description">
              Transaction details for selected date
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
                      <span>Income</span>
                    </div>
                    <p className="text-lg font-bold text-primary">
                      {formatCurrency(selectedDateData.income || 0, currency, exchangeRates, "VND")}
                    </p>
                  </div>
                  <div className="bg-destructive/10 rounded-lg p-3 text-center">
                    <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
                      <TrendingDown className="h-3.5 w-3.5 text-destructive" />
                      <span>Expenses</span>
                    </div>
                    <p className="text-lg font-bold text-destructive">
                      {formatCurrency(selectedDateData.expenses || 0, currency, exchangeRates, "VND")}
                    </p>
                  </div>
                </div>

                <h3 className="font-medium text-sm">Transactions</h3>

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
                          <p className="font-medium">{transaction.description}</p>
                          <Badge variant="outline" className="mt-1">
                            {transaction.category}
                          </Badge>
                        </div>
                        <p
                          className={
                            transaction.amount < 0 ? "text-destructive font-medium" : "text-primary font-medium"
                          }
                        >
                          {formatCurrency(transaction.amount, currency, exchangeRates, "VND")}
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
  )
}

