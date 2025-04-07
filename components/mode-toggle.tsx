"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/contexts/language-context";
import { useEffect, useState } from "react";

export function ModeToggle() {
  const { setTheme, theme, resolvedTheme } = useTheme();
  const { language, translations } = useLanguage();
  const [mounted, setMounted] = useState(false);

  const t = translations[language].themeToggle;

  // Only access theme on the client side to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle theme toggle
  const toggleTheme = () => {
    const currentTheme = theme === "system" ? resolvedTheme : theme;
    setTheme(currentTheme === "dark" ? "light" : "dark");
  };

  // If not mounted yet, render a placeholder button to avoid hydration mismatch
  if (!mounted) {
    return (
      <Button
        variant="outline"
        size="icon"
        className="relative overflow-hidden"
      >
        <span className="sr-only">{t.toggleTheme}</span>
      </Button>
    );
  }

  // After client-side hydration, determine the current theme
  const currentTheme = theme === "system" ? resolvedTheme : theme;
  const isDark = currentTheme === "dark";

  return (
    <Button
      variant="outline"
      size="icon"
      aria-label={isDark ? t.switchToLight : t.switchToDark}
      className="relative overflow-hidden"
      onClick={toggleTheme}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={isDark ? "dark" : "light"}
          initial={{ y: -30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 30, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="absolute inset-0 flex items-center justify-center"
        >
          {isDark ? (
            <Moon className="h-[1.2rem] w-[1.2rem]" />
          ) : (
            <Sun className="h-[1.2rem] w-[1.2rem]" />
          )}
        </motion.div>
      </AnimatePresence>
      <span className="sr-only">{t.toggleTheme}</span>
    </Button>
  );
}
