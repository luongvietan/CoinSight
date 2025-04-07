export interface Budget {
  amount: number;
  id?: string;
  userId?: string;
  category: string;
  limit: number;
  period?: "weekly" | "monthly";
}
