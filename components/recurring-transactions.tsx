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

  const handleOpenDialog = (recurring?: RecurringTransaction) => {
    if (recurring) {
      setEditingRecurring(recurring);
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
    const newRecurring: RecurringTransaction = {
      id: editingRecurring ? editingRecurring.id : Date.now().toString(),
      description: formData.description,
      amount: -Math.abs(Number(formData.amount)), // Always negative for expenses
      category: formData.category,
      frequency: formData.frequency as
        | "daily"
        | "weekly"
        | "monthly"
        | "yearly",
      nextDate: formData.nextDate,
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
                        <p className="font-medium text-destructive">
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
            <DialogTitle>Add Recurring Transaction</DialogTitle>
            <DialogDescription id="recurring-transaction-description">
              Set up a transaction that repeats automatically.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="amount">Amount</Label>
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
                <Label htmlFor="category">Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) =>
                    setFormData({ ...formData, category: value })
                  }
                >
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
                <Label htmlFor="frequency">Frequency</Label>
                <Select
                  value={formData.frequency}
                  onValueChange={(value) =>
                    setFormData({ ...formData, frequency: value })
                  }
                >
                  <SelectTrigger id="frequency">
                    <SelectValue placeholder="Select frequency" />
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
              <Label htmlFor="nextDate">{t.nextOccurrence}</Label>
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
              <Label htmlFor="isActive">Active</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveRecurring}
              disabled={
                !formData.description || !formData.amount || !formData.nextDate
              }
            >
              {t.saveRecurringButton}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
