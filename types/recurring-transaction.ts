export interface RecurringTransaction {
  id: string
  description: string
  amount: number
  category: string
  frequency: "daily" | "weekly" | "monthly" | "yearly"
  nextDate: string
  isActive: boolean
}

