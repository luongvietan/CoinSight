"use client";

import { PlusCircle, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/language-context";

interface EmptyStateProps {
  onAddClick: () => void;
  title?: string;
  description?: string;
  buttonText?: string;
}

export default function EmptyState({
  onAddClick,
  title,
  description,
  buttonText,
}: EmptyStateProps) {
  const { language, translations } = useLanguage();
  const t = translations[language].emptyState;

  const displayTitle = title || t.title;
  const displayDescription = description || t.description;
  const displayButtonText = buttonText || t.addButton;

  return (
    <motion.div
      className="flex flex-col items-center justify-center py-12 text-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="mb-6 rounded-full bg-primary/10 p-6">
        <TrendingUp className="h-12 w-12 text-primary" />
      </div>
      <h2 className="text-2xl font-bold mb-2">{displayTitle}</h2>
      <p className="text-muted-foreground max-w-md mb-6">
        {displayDescription}
      </p>
      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
        <Button onClick={onAddClick} className="bg-primary hover:bg-primary/90">
          <PlusCircle className="mr-2 h-4 w-4" />
          {displayButtonText}
        </Button>
      </motion.div>
    </motion.div>
  );
}
