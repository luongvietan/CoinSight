"use client";

import { Coins } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";
import { useLanguage } from "@/contexts/language-context";
import Link from "next/link";

interface LogoProps {
  className?: string;
  animated?: boolean;
}

export default function Logo({ className, animated = true }: LogoProps) {
  const { theme } = useTheme();
  const { language, translations } = useLanguage();
  const t = translations[language];

  const isDark = theme === "dark";

  const logoVariants = {
    initial: { scale: 0.9, opacity: 0 },
    animate: { scale: 1, opacity: 1, transition: { duration: 0.5 } },
    hover: { scale: 1.05, transition: { duration: 0.2 } },
  };

  const dotVariants = {
    initial: { scale: 0 },
    animate: { scale: 1, transition: { delay: 0.3, duration: 0.3 } },
    hover: {
      scale: [1, 1.5, 1],
      transition: {
        duration: 0.5,
        repeat: Number.POSITIVE_INFINITY,
        repeatType: "reverse" as const,
      },
    },
  };

  const textVariants = {
    initial: { x: -10, opacity: 0 },
    animate: { x: 0, opacity: 1, transition: { delay: 0.2, duration: 0.3 } },
  };

  return (
    <Link href="/">
      <motion.div
        className={cn("flex items-center gap-2 cursor-pointer", className)}
        initial={animated ? "initial" : false}
        animate={animated ? "animate" : false}
        whileHover="hover"
      >
        <motion.div className="relative" variants={logoVariants}>
          <Coins
            className={cn("h-6 w-6", isDark ? "text-primary" : "text-primary")}
          />
          <motion.div
            className={cn(
              "absolute -right-1 -top-1 h-2 w-2 rounded-full",
              isDark ? "bg-primary" : "bg-primary"
            )}
            variants={dotVariants}
          />
        </motion.div>
        <motion.span
          className={cn(
            "font-bold text-xl",
            isDark ? "text-white" : "text-foreground"
          )}
          variants={textVariants}
        >
          {t.appName}
        </motion.span>
      </motion.div>
    </Link>
  );
}
