"use client";

import { Badge } from "@/components/ui/badge";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Target, Plus, Edit2, Trash2, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
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
import { formatCurrency } from "@/lib/utils";
import { useLanguage } from "@/contexts/language-context";
import type { Goal } from "@/types/goal";

interface FinancialGoalsProps {
  goals: Goal[];
  onAddGoal: (goal: Omit<Goal, "id">) => void;
  onUpdateGoal: (goal: Goal) => void;
  onDeleteGoal: (goalId: string) => void;
}

export default function FinancialGoals({
  goals,
  onAddGoal,
  onUpdateGoal,
  onDeleteGoal,
}: FinancialGoalsProps) {
  const { language, translations } = useLanguage();
  const t = translations[language].goals;

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    category: "savings",
    targetAmount: "",
    currentAmount: "",
    deadline: "",
  });

  const handleOpenDialog = (goal?: Goal) => {
    if (goal) {
      setEditingGoal(goal);
      setFormData({
        name: goal.name,
        category: goal.category,
        targetAmount: goal.targetAmount.toString(),
        currentAmount: goal.currentAmount.toString(),
        deadline: goal.deadline,
      });
    } else {
      setEditingGoal(null);
      setFormData({
        name: "",
        category: "savings",
        targetAmount: "",
        currentAmount: "",
        deadline: "",
      });
    }
    setIsDialogOpen(true);
  };

  const handleSaveGoal = () => {
    const newGoal = {
      name: formData.name,
      category: formData.category,
      targetAmount: Number(formData.targetAmount),
      currentAmount: Number(formData.currentAmount),
      deadline: formData.deadline,
    };

    if (editingGoal) {
      onUpdateGoal({
        ...newGoal,
        id: editingGoal.id,
      });
    } else {
      onAddGoal(newGoal);
    }

    setIsDialogOpen(false);
  };

  const calculateProgress = (goal: Goal) => {
    return Math.min(
      Math.round((goal.currentAmount / goal.targetAmount) * 100),
      100
    );
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{t.title}</CardTitle>
          <Button size="sm" onClick={() => handleOpenDialog()}>
            <Plus className="h-4 w-4 mr-2" />
            {t.addGoalButton}
          </Button>
        </CardHeader>
        <CardContent>
          {goals.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Target className="h-12 w-12 text-muted-foreground opacity-50 mb-3" />
              <h3 className="text-lg font-medium">{t.noGoals}</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-xs">
                {t.addGoalPrompt}
              </p>
              <Button onClick={() => handleOpenDialog()} className="mt-4">
                <Plus className="h-4 w-4 mr-2" />
                {t.addGoalButton}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <AnimatePresence>
                {goals.map((goal) => (
                  <motion.div
                    key={goal.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, height: 0 }}
                    className="border rounded-lg p-4"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-medium">{goal.name}</h3>
                        <Badge variant="outline" className="mt-1">
                          {
                            t.categories[
                              goal.category as keyof typeof t.categories
                            ]
                          }
                        </Badge>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleOpenDialog(goal)}
                          aria-label="Edit goal"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => onDeleteGoal(goal.id)}
                          aria-label="Delete goal"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-3 text-sm">
                      <div>
                        <p className="text-muted-foreground">
                          {t.targetAmount}
                        </p>
                        <p className="font-medium">
                          {formatCurrency(goal.targetAmount)}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">
                          {t.currentAmount}
                        </p>
                        <p className="font-medium">
                          {formatCurrency(goal.currentAmount)}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span>{t.progress}</span>
                        <span>{calculateProgress(goal)}%</span>
                      </div>
                      <Progress
                        value={calculateProgress(goal)}
                        className="h-2"
                      />
                    </div>

                    {goal.deadline && (
                      <p className="text-xs text-muted-foreground mt-2">
                        {t.deadline}:{" "}
                        {new Date(goal.deadline).toLocaleDateString(
                          language === "vi" ? "vi-VN" : "en-US"
                        )}
                      </p>
                    )}
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
          aria-describedby="goal-dialog-description"
        >
          <DialogHeader>
            <DialogTitle>Add New Goal</DialogTitle>
            <DialogDescription id="goal-dialog-description">
              Create a new financial goal to track your progress.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">{t.goalName}</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
            </div>

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
                  <SelectItem value="savings">
                    {t.categories.savings}
                  </SelectItem>
                  <SelectItem value="investment">
                    {t.categories.investment}
                  </SelectItem>
                  <SelectItem value="debt">{t.categories.debt}</SelectItem>
                  <SelectItem value="purchase">
                    {t.categories.purchase}
                  </SelectItem>
                  <SelectItem value="emergency">
                    {t.categories.emergency}
                  </SelectItem>
                  <SelectItem value="other">{t.categories.other}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="targetAmount">{t.targetAmount}</Label>
                <Input
                  id="targetAmount"
                  type="number"
                  value={formData.targetAmount}
                  onChange={(e) =>
                    setFormData({ ...formData, targetAmount: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="currentAmount">{t.currentAmount}</Label>
                <Input
                  id="currentAmount"
                  type="number"
                  value={formData.currentAmount}
                  onChange={(e) =>
                    setFormData({ ...formData, currentAmount: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="deadline">{t.deadline}</Label>
              <Input
                id="deadline"
                type="date"
                value={formData.deadline}
                onChange={(e) =>
                  setFormData({ ...formData, deadline: e.target.value })
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              {t.cancelButton}
            </Button>
            <Button
              onClick={handleSaveGoal}
              disabled={!formData.name || !formData.targetAmount}
            >
              {t.saveGoalButton}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
