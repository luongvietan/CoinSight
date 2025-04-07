export interface Transaction {
  id: string
  description: string
  amount: number // Positive for income, negative for expense
  category: string
  date: string // ISO format: YYYY-MM-DD
}

