"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle, AlertCircle, XCircle, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export function CustomToaster() {
  const { toasts, dismiss } = useToast();

  return (
    <div className="fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]">
      <AnimatePresence>
        {toasts.map(
          ({ id, title, description, variant = "default", ...props }) => {
            const { onOpenChange, ...cleanProps } = props;

            return (
              <motion.div
                key={id}
                initial={{ opacity: 0, y: 50, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
                transition={{ type: "spring", damping: 20, stiffness: 300 }}
                className={cn(
                  "group pointer-events-auto relative mb-2 flex w-full overflow-hidden rounded-lg border p-4 pr-8 shadow-lg",
                  {
                    "bg-background text-foreground border-border":
                      variant === "default",
                    "bg-destructive text-destructive-foreground border-destructive":
                      variant === "destructive",
                    "bg-green-600 text-white border-green-800":
                      variant === "success",
                    "bg-blue-600 text-white border-blue-800":
                      variant === "info",
                    "bg-yellow-600 text-white border-yellow-800":
                      variant === "warning",
                  }
                )}
                {...cleanProps}
              >
                <div className="grid gap-1">
                  {/* Icon based on variant */}
                  <div className="flex items-center gap-3">
                    {variant === "default" && <Info className="h-5 w-5" />}
                    {variant === "destructive" && (
                      <XCircle className="h-5 w-5" />
                    )}
                    {variant === "success" && (
                      <CheckCircle className="h-5 w-5" />
                    )}
                    {variant === "warning" && (
                      <AlertCircle className="h-5 w-5" />
                    )}
                    {variant === "info" && <Info className="h-5 w-5" />}

                    {title && (
                      <div className="text-sm font-semibold">{title}</div>
                    )}
                  </div>

                  {description && (
                    <div className="text-sm opacity-90 mt-1">{description}</div>
                  )}
                </div>

                {/* Close button */}
                <button
                  onClick={() => dismiss(id)}
                  className="absolute right-2 top-2 rounded-md p-1 text-foreground/50 opacity-0 transition-opacity hover:text-foreground focus:opacity-100 focus:outline-none group-hover:opacity-100"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="lucide lucide-x"
                  >
                    <path d="M18 6 6 18"></path>
                    <path d="m6 6 12 12"></path>
                  </svg>
                </button>
              </motion.div>
            );
          }
        )}
      </AnimatePresence>
    </div>
  );
}
