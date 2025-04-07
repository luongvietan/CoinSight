export interface Budget {
  id?: string;
  userId?: string;
  category: string;
  limit: number;
  period?: "weekly" | "monthly";
}
