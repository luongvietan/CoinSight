"use client";

import type React from "react";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Globe, DollarSign, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu";
import { useLanguage } from "@/contexts/language-context";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

export default function LanguageCurrencySelector() {
  const {
    language,
    setLanguage,
    currency,
    setCurrency,
    exchangeRates,
    isLoadingRates,
    refreshRates,
    lastUpdated,
  } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  const handleRefreshRates = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    await refreshRates();
  };

  const currencies = [
    { code: "USD", name: "US Dollar", symbol: "$" },
    { code: "VND", name: "Vietnamese Dong", symbol: "₫" },
    { code: "EUR", name: "Euro", symbol: "€" },
    { code: "GBP", name: "British Pound", symbol: "£" },
    { code: "JPY", name: "Japanese Yen", symbol: "¥" },
    { code: "CAD", name: "Canadian Dollar", symbol: "C$" },
    { code: "AUD", name: "Australian Dollar", symbol: "A$" },
    { code: "CNY", name: "Chinese Yuan", symbol: "¥" },
    { code: "SGD", name: "Singapore Dollar", symbol: "S$" },
  ];

  const languages = [
    { code: "en", name: "English", flag: "🇺🇸" },
    { code: "vi", name: "Tiếng Việt", flag: "🇻🇳" },
  ];

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="flex items-center gap-2 h-9 px-3"
        >
          <Globe className="h-4 w-4" />
          <span className="uppercase">{language}</span>
          <span className="text-muted-foreground">|</span>
          <DollarSign className="h-4 w-4" />
          <span>{currency}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Language</DropdownMenuLabel>
        <DropdownMenuGroup>
          <AnimatePresence mode="sync">
            {languages.map((lang) => (
              <motion.div
                key={lang.code}
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 5 }}
                transition={{ duration: 0.15 }}
              >
                <DropdownMenuItem
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => setLanguage(lang.code as any)}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-base">{lang.flag}</span>
                    <span>{lang.name}</span>
                  </div>
                  {language === lang.code && (
                    <Badge variant="outline" className="ml-2 bg-primary/10">
                      Active
                    </Badge>
                  )}
                </DropdownMenuItem>
              </motion.div>
            ))}
          </AnimatePresence>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Currency</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={handleRefreshRates}
            disabled={isLoadingRates}
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${isLoadingRates ? "animate-spin" : ""}`}
            />
          </Button>
        </DropdownMenuLabel>

        {lastUpdated && (
          <div className="px-2 py-1 text-xs text-muted-foreground">
            Rates updated: {formatDate(lastUpdated.toISOString(), language)}
          </div>
        )}

        <DropdownMenuGroup className="max-h-[200px] overflow-y-auto">
          <AnimatePresence mode="sync">
            {currencies.map((curr) => (
              <motion.div
                key={curr.code}
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 5 }}
                transition={{ duration: 0.15 }}
              >
                <DropdownMenuItem
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => setCurrency(curr.code as any)}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-base">{curr.symbol}</span>
                    <span>{curr.name}</span>
                  </div>
                  {currency === curr.code && (
                    <Badge variant="outline" className="ml-2 bg-primary/10">
                      Active
                    </Badge>
                  )}
                </DropdownMenuItem>
              </motion.div>
            ))}
          </AnimatePresence>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <div className="px-2 py-1.5 text-xs">
          <div className="font-medium mb-1">Exchange Rates (1 USD)</div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
            {Object.entries(exchangeRates)
              .filter(([code]) => code !== "USD")
              .slice(0, 6)
              .map(([code, rate]) => (
                <div key={code} className="flex items-center justify-between">
                  <span>{code}:</span>
                  <span className="font-mono">{rate.toFixed(2)}</span>
                </div>
              ))}
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
