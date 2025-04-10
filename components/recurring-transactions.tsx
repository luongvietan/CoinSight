"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Repeat, Plus, Edit2, Trash2, X, Pause, Play } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { formatCurrency } from "@/lib/utils";
import { useLanguage } from "@/contexts/language-context";
import type { RecurringTransaction } from "@/types/recurring-transaction";

interface RecurringTransactionsProps {
  recurringTransactions: RecurringTransaction[];
  onAddRecurring: (recurring: RecurringTransaction) => void;
  onUpdateRecurring: (recurring: RecurringTransaction) => void;
  onDeleteRecurring: (recurringId: string) => void;
}

export default function RecurringTransactions({
  recurringTransactions,
  onAddRecurring,
  onUpdateRecurring,
  onDeleteRecurring,
}: RecurringTransactionsProps) {
  const { language, translations } = useLanguage();
  const t = translations[language].recurring;

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRecurring, setEditingRecurring] =
    useState<RecurringTransaction | null>(null);
  const [formData, setFormData] = useState({
    description: "",
    amount: "",
    category: "bills",
    frequency: "monthly",
    nextDate: "",
    isActive: true,
  });
  const [transactionType, setTransactionType] = useState<"expense" | "income">(
    "expense"
  );

  const handleOpenDialog = (recurring?: RecurringTransaction) => {
    if (recurring) {
      setEditingRecurring(recurring);
      setTransactionType(recurring.amount < 0 ? "expense" : "income");
      setFormData({
        description: recurring.description,
        amount: Math.abs(recurring.amount).toString(),
        category: recurring.category,
        frequency: recurring.frequency,
        nextDate: recurring.nextDate,
        isActive: recurring.isActive,
      });
    } else {
      setEditingRecurring(null);
      setTransactionType("expense");
      setFormData({
        description: "",
        amount: "",
        category: "bills",
        frequency: "monthly",
        nextDate: new Date().toISOString().split("T")[0],
        isActive: true,
      });
    }
    setIsDialogOpen(true);
  };

  const handleSaveRecurring = () => {
    const amount = Number(formData.amount);

    // Tính toán nextDate dựa trên frequency
    const startDate = new Date(formData.nextDate);
    let nextDate = new Date(startDate);

    // Nếu đang thêm mới, tự động tính toán ngày giao dịch tiếp theo dựa trên frequency
    if (!editingRecurring) {
      switch (formData.frequency) {
        case "daily":
          nextDate.setDate(nextDate.getDate() + 1);
          break;
        case "weekly":
          nextDate.setDate(nextDate.getDate() + 7);
          break;
        case "monthly":
          nextDate.setMonth(nextDate.getMonth() + 1);
          break;
        case "yearly":
          nextDate.setFullYear(nextDate.getFullYear() + 1);
          break;
      }
    }

    const newRecurring: RecurringTransaction = {
      id: editingRecurring ? editingRecurring.id : Date.now().toString(),
      description: formData.description,
      amount:
        transactionType === "expense" ? -Math.abs(amount) : Math.abs(amount),
      category: formData.category,
      frequency: formData.frequency as
        | "daily"
        | "weekly"
        | "monthly"
        | "yearly",
      nextDate: !editingRecurring
        ? nextDate.toISOString().split("T")[0]
        : formData.nextDate,
      isActive: formData.isActive,
    };

    if (editingRecurring) {
      onUpdateRecurring(newRecurring);
    } else {
      onAddRecurring(newRecurring);
    }

    setIsDialogOpen(false);
  };

  const toggleStatus = (recurring: RecurringTransaction) => {
    onUpdateRecurring({
      ...recurring,
      isActive: !recurring.isActive,
    });
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{t.title}</CardTitle>
          <Button size="sm" onClick={() => handleOpenDialog()}>
            <Plus className="h-4 w-4 mr-2" />
            {t.addRecurringButton}
          </Button>
        </CardHeader>
        <CardContent>
          {recurringTransactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Repeat className="h-12 w-12 text-muted-foreground opacity-50 mb-3" />
              <h3 className="text-lg font-medium">{t.noRecurring}</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-xs">
                {t.addRecurringPrompt}
              </p>
              <Button onClick={() => handleOpenDialog()} className="mt-4">
                <Plus className="h-4 w-4 mr-2" />
                {t.addRecurringButton}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <AnimatePresence>
                {recurringTransactions.map((recurring) => (
                  <motion.div
                    key={recurring.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, height: 0 }}
                    className={`border rounded-lg p-4 ${
                      !recurring.isActive ? "opacity-60" : ""
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-medium">{recurring.description}</h3>
                        <div className="flex flex-wrap gap-2 mt-1">
                          <Badge variant="outline">{recurring.category}</Badge>
                          <Badge variant="outline">
                            {
                              t.frequency[
                                recurring.frequency as keyof typeof t.frequency
                              ]
                            }
                          </Badge>
                          <Badge
                            variant={
                              recurring.isActive ? "default" : "secondary"
                            }
                          >
                            {recurring.isActive
                              ? t.status.active
                              : t.status.paused}
                          </Badge>
                          <Badge
                            variant={
                              recurring.amount > 0 ? "success" : "destructive"
                            }
                          >
                            {recurring.amount > 0
                              ? t.income || "Thu nhập"
                              : t.expense || "Chi tiêu"}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => toggleStatus(recurring)}
                          aria-label={
                            recurring.isActive
                              ? "Pause recurring transaction"
                              : "Activate recurring transaction"
                          }
                        >
                          {recurring.isActive ? (
                            <Pause className="h-4 w-4" />
                          ) : (
                            <Play className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleOpenDialog(recurring)}
                          aria-label="Edit recurring transaction"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => onDeleteRecurring(recurring.id)}
                          aria-label="Delete recurring transaction"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-3 text-sm">
                      <div>
                        <p className="text-muted-foreground">Amount</p>
                        <p
                          className={`font-medium ${
                            recurring.amount < 0
                              ? "text-destructive"
                              : "text-green-600"
                          }`}
                        >
                          {formatCurrency(recurring.amount)}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">
                          {t.nextOccurrence}
                        </p>
                        <p className="font-medium">
                          {new Date(recurring.nextDate).toLocaleDateString(
                            language === "vi" ? "vi-VN" : "en-US"
                          )}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent
          className="sm:max-w-[425px]"
          aria-describedby="recurring-transaction-description"
        >
          <DialogHeader>
            <DialogTitle>
              {editingRecurring ? "Chỉnh sửa" : "Thêm"} giao dịch định kỳ{" "}
              {transactionType === "expense" ? "(Chi tiêu)" : "(Thu nhập)"}
            </DialogTitle>
            <DialogDescription id="recurring-transaction-description">
              {t.dialogDescription ||
                "Thiết lập giao dịch tự động lặp lại theo định kỳ."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Loại giao dịch</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={
                    transactionType === "expense" ? "default" : "outline"
                  }
                  className="flex-1"
                  onClick={() => setTransactionType("expense")}
                >
                  {t.expense || "Chi tiêu"}
                </Button>
                <Button
                  type="button"
                  variant={transactionType === "income" ? "default" : "outline"}
                  className="flex-1"
                  onClick={() => setTransactionType("income")}
                >
                  {t.income || "Thu nhập"}
                </Button>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">{t.description || "Mô tả"}</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="amount">{t.amount || "Số tiền"}</Label>
              <Input
                id="amount"
                type="number"
                value={formData.amount}
                onChange={(e) =>
                  setFormData({ ...formData, amount: e.target.value })
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="category">{t.category || "Danh mục"}</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) =>
                    setFormData({ ...formData, category: value })
                  }
                >
                  <SelectTrigger id="category">
                    <SelectValue
                      placeholder={t.selectCategory || "Chọn danh mục"}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="food">
                      {t.categories?.food || "Ăn uống"}
                    </SelectItem>
                    <SelectItem value="shopping">
                      {t.categories?.shopping || "Mua sắm"}
                    </SelectItem>
                    <SelectItem value="bills">
                      {t.categories?.bills || "Hóa đơn"}
                    </SelectItem>
                    <SelectItem value="entertainment">
                      {t.categories?.entertainment || "Giải trí"}
                    </SelectItem>
                    <SelectItem value="salary">
                      {t.categories?.salary || "Lương"}
                    </SelectItem>
                    <SelectItem value="investment">
                      {t.categories?.investment || "Đầu tư"}
                    </SelectItem>
                    <SelectItem value="other">
                      {t.categories?.other || "Khác"}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="frequency">
                  {t.frequencyLabel || "Tần suất"}
                </Label>
                <Select
                  value={formData.frequency}
                  onValueChange={(value) =>
                    setFormData({ ...formData, frequency: value })
                  }
                >
                  <SelectTrigger id="frequency">
                    <SelectValue
                      placeholder={t.selectFrequency || "Chọn tần suất"}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">{t.frequency.daily}</SelectItem>
                    <SelectItem value="weekly">{t.frequency.weekly}</SelectItem>
                    <SelectItem value="monthly">
                      {t.frequency.monthly}
                    </SelectItem>
                    <SelectItem value="yearly">{t.frequency.yearly}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="nextDate">
                {t.nextOccurrence || "Ngày bắt đầu"}
              </Label>
              <Input
                id="nextDate"
                type="date"
                value={formData.nextDate}
                onChange={(e) =>
                  setFormData({ ...formData, nextDate: e.target.value })
                }
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, isActive: checked })
                }
              />
              <Label htmlFor="isActive">{t.isActive || "Kích hoạt"}</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              {t.cancel || "Hủy"}
            </Button>
            <Button
              onClick={handleSaveRecurring}
              disabled={
                !formData.description || !formData.amount || !formData.nextDate
              }
            >
              {t.saveRecurringButton || "Lưu"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
