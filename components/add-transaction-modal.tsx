"use client";

import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { ArrowDownCircle, ArrowUpCircle, Loader2, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Transaction } from "@/types/transaction";
import { classifyTransaction, addTransaction } from "@/lib/api";
import { useLanguage } from "@/contexts/language-context";

const formSchema = z.object({
  description: z.string().min(2, {
    message: "Description must be at least 2 characters.",
  }),
  amount: z.coerce.number().positive({
    message: "Amount must be a positive number.",
  }),
  category: z.string().min(1, {
    message: "Please select a category.",
  }),
  type: z.enum(["income", "expense"]),
  date: z.string().min(1, "Date is required"),
});

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (transaction: Transaction) => void;
}

export default function AddTransactionModal({
  isOpen,
  onClose,
  onAdd,
}: AddTransactionModalProps) {
  const { language, translations } = useLanguage();
  const [isClassifying, setIsClassifying] = useState(false);
  const [activeTab, setActiveTab] = useState<"expense" | "income">("expense");
  const [currentDate] = useState(new Date().toISOString().split("T")[0]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      description: "",
      amount: undefined,
      category: "",
      type: "expense",
      date: currentDate,
    },
  });

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      form.reset({
        description: "",
        amount: undefined,
        category: "",
        type: "expense",
        date: currentDate,
      });
      setActiveTab("expense");
    }
  }, [isOpen, form, currentDate]);

  // Update form value when tab changes
  useEffect(() => {
    form.setValue("type", activeTab);
  }, [activeTab, form]);

  const handleDescriptionChange = async (value: string) => {
    if (value.length > 5) {
      setIsClassifying(true);
      try {
        const result = await classifyTransaction(value);
        if (result.category) {
          form.setValue("category", result.category);
        }
      } catch (error) {
        console.error("Error classifying transaction:", error);
      } finally {
        setIsClassifying(false);
      }
    }
  };

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    const newTransaction: Transaction = {
      id: Date.now().toString(),
      description: values.description,
      amount: values.type === "expense" ? -values.amount : values.amount,
      category: values.category,
      date: values.date || currentDate,
    };

    onAdd(newTransaction);
    form.reset();
    setActiveTab("expense");
  };

  const t = translations[language].addTransaction;

  // Determine which categories to show based on the active tab
  const getCategories = () => {
    const categories = t.categories;
    const items = [];

    if (activeTab === "expense") {
      // Expense categories
      items.push(
        <SelectItem key="food" value="food">
          {categories.food}
        </SelectItem>,
        <SelectItem key="groceries" value="groceries">
          {categories.groceries}
        </SelectItem>,
        <SelectItem key="shopping" value="shopping">
          {categories.shopping}
        </SelectItem>,
        <SelectItem key="clothing" value="clothing">
          {categories.clothing}
        </SelectItem>,
        <SelectItem key="electronics" value="electronics">
          {categories.electronics}
        </SelectItem>,
        <SelectItem key="bills" value="bills">
          {categories.bills}
        </SelectItem>,
        <SelectItem key="rent" value="rent">
          {categories.rent}
        </SelectItem>,
        <SelectItem key="transportation" value="transportation">
          {categories.transportation}
        </SelectItem>,
        <SelectItem key="healthcare" value="healthcare">
          {categories.healthcare}
        </SelectItem>,
        <SelectItem key="education" value="education">
          {categories.education}
        </SelectItem>,
        <SelectItem key="entertainment" value="entertainment">
          {categories.entertainment}
        </SelectItem>,
        <SelectItem key="travel" value="travel">
          {categories.travel}
        </SelectItem>,
        <SelectItem key="gifts" value="gifts">
          {categories.gifts}
        </SelectItem>,
        <SelectItem key="personal" value="personal">
          {categories.personal}
        </SelectItem>,
        <SelectItem key="fitness" value="fitness">
          {categories.fitness}
        </SelectItem>,
        <SelectItem key="subscriptions" value="subscriptions">
          {categories.subscriptions}
        </SelectItem>,
        <SelectItem key="other" value="other">
          {categories.other}
        </SelectItem>
      );
    } else {
      // Income categories
      items.push(
        <SelectItem key="salary" value="salary">
          {categories.salary}
        </SelectItem>,
        <SelectItem key="freelance" value="freelance">
          {categories.freelance}
        </SelectItem>,
        <SelectItem key="business" value="business">
          {categories.business}
        </SelectItem>,
        <SelectItem key="investments" value="investments">
          {categories.investments}
        </SelectItem>,
        <SelectItem key="other" value="other">
          {categories.other}
        </SelectItem>
      );
    }

    return items;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="sm:max-w-[425px] overflow-y-auto max-h-[90vh]"
        aria-describedby="transaction-dialog-description"
      >
        <DialogHeader className="flex flex-row items-center justify-between">
          <div>
            <DialogTitle>{t.title}</DialogTitle>
            <DialogDescription id="transaction-dialog-description">
              Add a new transaction to track your finances
            </DialogDescription>
          </div>
          <DialogClose asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              aria-label={t.close}
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogClose>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Tabs
              defaultValue="expense"
              value={activeTab}
              onValueChange={(value) =>
                setActiveTab(value as "expense" | "income")
              }
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger
                  value="expense"
                  className="data-[state=active]:bg-destructive data-[state=active]:text-destructive-foreground"
                  aria-label={t.expenseTab}
                >
                  <ArrowDownCircle className="mr-2 h-4 w-4" />
                  {t.expense}
                </TabsTrigger>
                <TabsTrigger
                  value="income"
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                  aria-label={t.incomeTab}
                >
                  <ArrowUpCircle className="mr-2 h-4 w-4" />
                  {t.income}
                </TabsTrigger>
              </TabsList>

              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <TabsContent value="expense" className="mt-4">
                    <p className="text-sm text-muted-foreground mb-4">
                      {t.expenseDescription}
                    </p>
                  </TabsContent>

                  <TabsContent value="income" className="mt-4">
                    <p className="text-sm text-muted-foreground mb-4">
                      {t.incomeDescription}
                    </p>
                  </TabsContent>
                </motion.div>
              </AnimatePresence>
            </Tabs>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t.descriptionLabel}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t.descriptionPlaceholder}
                      {...field}
                      onChange={(e) => {
                        field.onChange(e);
                        handleDescriptionChange(e.target.value);
                      }}
                      aria-describedby="description-hint"
                    />
                  </FormControl>
                  <p
                    id="description-hint"
                    className="text-xs text-muted-foreground"
                  >
                    {t.descriptionHint}
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.amountLabel}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="50000"
                        {...field}
                        value={field.value === undefined ? "" : field.value}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value === ""
                              ? undefined
                              : Number.parseFloat(e.target.value)
                          )
                        }
                        aria-describedby="amount-hint"
                      />
                    </FormControl>
                    <p
                      id="amount-hint"
                      className="text-xs text-muted-foreground"
                    >
                      {t.amountHint}
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.dateLabel}</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        {...field}
                        value={field.value || currentDate}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    {t.categoryLabel}
                    {isClassifying && (
                      <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                    )}
                  </FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value || ""}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t.categoryPlaceholder} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>{getCategories()}</SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={onClose}>
                {t.cancelButton}
              </Button>
              <motion.div whileTap={{ scale: 0.95 }}>
                <Button
                  type="submit"
                  disabled={form.formState.isSubmitting}
                  className="relative"
                >
                  {form.formState.isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t.savingButton}
                    </>
                  ) : (
                    t.saveButton
                  )}
                </Button>
              </motion.div>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
