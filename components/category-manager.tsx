"use client";

import { useState } from "react";
import { Plus, X, Edit2, Check, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/language-context";
import { cn } from "@/lib/utils";

export interface Category {
  id: string;
  name: string;
  color: string;
  icon?: string;
  isCustom?: boolean;
}

interface CategoryManagerProps {
  categories: Category[];
  onCategoriesChange: (categories: Category[]) => void;
  defaultCategories: Category[];
}

export default function CategoryManager({
  categories,
  onCategoriesChange,
  defaultCategories,
}: CategoryManagerProps) {
  const { language, translations } = useLanguage();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryColor, setNewCategoryColor] = useState("#4f46e5");
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  // Predefined colors for new categories
  const colorOptions = [
    "#ef4444", // red
    "#f97316", // orange
    "#f59e0b", // amber
    "#84cc16", // lime
    "#10b981", // emerald
    "#06b6d4", // cyan
    "#3b82f6", // blue
    "#6366f1", // indigo
    "#8b5cf6", // violet
    "#d946ef", // fuchsia
    "#ec4899", // pink
  ];

  const handleAddCategory = () => {
    if (!newCategoryName.trim()) {
      toast({
        title: "Category name is required",
        variant: "destructive",
      });
      return;
    }

    // Check if category with this name already exists
    if (
      categories.some(
        (c) => c.name.toLowerCase() === newCategoryName.toLowerCase()
      )
    ) {
      toast({
        title: "Category already exists",
        variant: "destructive",
      });
      return;
    }

    const newCategory: Category = {
      id: `custom-${Date.now()}`,
      name: newCategoryName,
      color: newCategoryColor,
      isCustom: true,
    };

    onCategoriesChange([...categories, newCategory]);
    setNewCategoryName("");
    toast({
      title: "Category added",
      description: `"${newCategoryName}" has been added to your categories.`,
    });
  };

  const handleUpdateCategory = () => {
    if (!editingCategory) return;

    if (!editingCategory.name.trim()) {
      toast({
        title: "Category name is required",
        variant: "destructive",
      });
      return;
    }

    // Check if another category with this name already exists
    if (
      categories.some(
        (c) =>
          c.id !== editingCategory.id &&
          c.name.toLowerCase() === editingCategory.name.toLowerCase()
      )
    ) {
      toast({
        title: "Category already exists",
        variant: "destructive",
      });
      return;
    }

    const updatedCategories = categories.map((c) =>
      c.id === editingCategory.id ? editingCategory : c
    );

    onCategoriesChange(updatedCategories);
    setEditingCategory(null);
    toast({
      title: "Category updated",
      description: `"${editingCategory.name}" has been updated.`,
    });
  };

  const handleDeleteCategory = (categoryId: string) => {
    const categoryToDelete = categories.find((c) => c.id === categoryId);
    if (!categoryToDelete) return;

    // Only allow deleting custom categories
    if (!categoryToDelete.isCustom) {
      toast({
        title: "Cannot delete default category",
        description: "Default categories cannot be deleted.",
        variant: "destructive",
      });
      return;
    }

    const updatedCategories = categories.filter((c) => c.id !== categoryId);
    onCategoriesChange(updatedCategories);
    toast({
      title: "Category deleted",
      description: `"${categoryToDelete.name}" has been deleted.`,
    });
  };

  const handleResetCategories = () => {
    onCategoriesChange(defaultCategories);
    toast({
      title: "Categories reset",
      description: "All categories have been reset to default.",
    });
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-1"
      >
        <Plus className="h-3.5 w-3.5" />
        <span>Manage Categories</span>
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent
          className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto"
          aria-describedby="category-manager-description"
        >
          <DialogHeader>
            <DialogTitle>Manage Categories</DialogTitle>
            <DialogDescription id="category-manager-description">
              Add, edit, or remove transaction categories
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 my-4">
            <div className="flex items-end gap-2">
              <div className="flex-1 space-y-2">
                <label htmlFor="categoryName" className="text-sm font-medium">
                  New Category Name
                </label>
                <Input
                  id="categoryName"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="Enter category name"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="categoryColor" className="text-sm font-medium">
                  Color
                </label>
                <div className="flex items-center gap-1">
                  {colorOptions.map((color) => (
                    <button
                      key={color}
                      type="button"
                      className={cn(
                        "w-6 h-6 rounded-full transition-all",
                        newCategoryColor === color
                          ? "ring-2 ring-offset-2 ring-ring"
                          : ""
                      )}
                      style={{ backgroundColor: color }}
                      onClick={() => setNewCategoryColor(color)}
                      aria-label={`Select color ${color}`}
                    />
                  ))}
                </div>
              </div>

              <Button onClick={handleAddCategory} className="ml-2">
                <Plus className="h-4 w-4 mr-1" />
                Add
              </Button>
            </div>

            <div className="border rounded-md p-4">
              <h3 className="font-medium mb-3">Your Categories</h3>
              <div className="grid grid-cols-2 gap-2">
                <AnimatePresence>
                  {categories.map((category) => (
                    <motion.div
                      key={category.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, height: 0 }}
                      className={cn(
                        "flex items-center justify-between p-2 rounded-md border",
                        editingCategory?.id === category.id
                          ? "ring-2 ring-ring"
                          : ""
                      )}
                    >
                      {editingCategory?.id === category.id ? (
                        <div className="flex items-center gap-2 w-full">
                          <div
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: editingCategory.color }}
                          />
                          <Input
                            value={editingCategory.name || ""}
                            onChange={(e) =>
                              setEditingCategory({
                                ...editingCategory,
                                name: e.target.value,
                              })
                            }
                            className="h-7 flex-1"
                            autoFocus
                          />
                          <div className="flex items-center">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7"
                              onClick={handleUpdateCategory}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7"
                              onClick={() => setEditingCategory(null)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: category.color }}
                            />
                            <span>{category.name}</span>
                            {category.isCustom && (
                              <Badge variant="outline" className="text-xs">
                                Custom
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center">
                            {category.isCustom && (
                              <>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-7 w-7"
                                  onClick={() => setEditingCategory(category)}
                                >
                                  <Edit2 className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-7 w-7 text-destructive"
                                  onClick={() =>
                                    handleDeleteCategory(category.id)
                                  }
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </>
                            )}
                          </div>
                        </>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          </div>

          <DialogFooter className="flex justify-between">
            <Button
              variant="outline"
              onClick={handleResetCategories}
              className="text-destructive hover:text-destructive"
            >
              Reset to Default
            </Button>
            <Button onClick={() => setIsOpen(false)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
