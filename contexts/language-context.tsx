"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
  useMemo,
  useCallback,
} from "react";
import { en } from "@/translations/en";
import { vi } from "@/translations/vi";
import { fetchExchangeRates } from "@/lib/exchange-api";

type Language = "en" | "vi";
type Currency =
  | "USD"
  | "VND"
  | "EUR"
  | "GBP"
  | "JPY"
  | "CAD"
  | "AUD"
  | "CNY"
  | "SGD";

type Translations = {
  en: typeof en;
  vi: typeof vi;
};

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  translations: Translations;
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  exchangeRates: Record<string, number>;
  isLoadingRates: boolean;
  refreshRates: () => Promise<void>;
  lastUpdated: Date | null;
}

const translations: Translations = {
  en,
  vi,
};

// Default exchange rates (will be updated with real rates)
const defaultRates: Record<string, number> = {
  USD: 1,
  VND: 24850,
  EUR: 0.92,
  GBP: 0.79,
  JPY: 151.72,
  CAD: 1.37,
  AUD: 1.52,
  CNY: 7.24,
  SGD: 1.35,
  VND_TO_USD: 1 / 24850, // Add this for conversion
};

// Map languages to default currencies
const languageToCurrency: Record<Language, Currency> = {
  en: "USD",
  vi: "VND",
};

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined
);

// Khai báo kiểu window.requestIdleCallback
declare global {
  interface Window {
    requestIdleCallback: (
      callback: IdleRequestCallback,
      options?: IdleRequestOptions
    ) => number;
  }
}

// Hàm trợ giúp không đồng bộ để tránh blocking main thread khi đọc localStorage
const safeGetLocalStorage = (key: string): Promise<string | null> => {
  return new Promise((resolve) => {
    queueMicrotask(() => {
      try {
        const value = localStorage.getItem(key);
        resolve(value);
      } catch (error) {
        console.error(`Error reading ${key} from localStorage:`, error);
        resolve(null);
      }
    });
  });
};

// Hàm trợ giúp không đồng bộ để tránh blocking main thread khi ghi localStorage
const safeSetLocalStorage = (key: string, value: string): Promise<void> => {
  return new Promise((resolve) => {
    queueMicrotask(() => {
      try {
        localStorage.setItem(key, value);
      } catch (error) {
        console.error(`Error writing ${key} to localStorage:`, error);
      }
      resolve();
    });
  });
};

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en");
  const [currency, setCurrencyState] = useState<Currency>("USD");
  const [exchangeRates, setExchangeRates] =
    useState<Record<string, number>>(defaultRates);
  const [isLoadingRates, setIsLoadingRates] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Fetch exchange rates - using useCallback to memoize
  const refreshRates = useCallback(async () => {
    if (isLoadingRates) return; // Prevent multiple simultaneous requests

    setIsLoadingRates(true);
    try {
      const data = await fetchExchangeRates();

      // Check if rates actually changed before updating state
      const updatedRates = {
        ...data.rates,
        VND_TO_USD: 1 / data.rates.VND,
      };

      // Only update state if rates have changed
      const currentRatesJSON = JSON.stringify(exchangeRates);
      const newRatesJSON = JSON.stringify(updatedRates);

      if (currentRatesJSON !== newRatesJSON) {
        setExchangeRates(updatedRates);
        setLastUpdated(new Date(data.timestamp));

        // Store in localStorage with timestamp - sử dụng hàm không đồng bộ
        safeSetLocalStorage(
          "exchangeRates",
          JSON.stringify({
            rates: updatedRates,
            timestamp: data.timestamp,
          })
        );
      }
    } catch (error) {
      console.error("Failed to fetch exchange rates:", error);
    } finally {
      setIsLoadingRates(false);
    }
  }, [exchangeRates, isLoadingRates]);

  useEffect(() => {
    // Initialize with default values first to avoid undefined states
    setLanguageState("en");
    setCurrencyState("USD");

    // Function to handle initial loading logic
    const initializeContext = async () => {
      // Try to get stored exchange rates - sử dụng phương thức không đồng bộ
      const storedRates = await safeGetLocalStorage("exchangeRates");
      if (storedRates) {
        try {
          const { rates, timestamp } = JSON.parse(storedRates);
          const storedTime = new Date(timestamp);
          const now = new Date();

          // Use stored rates if they're less than 1 hour old
          if (now.getTime() - storedTime.getTime() < 3600000) {
            setExchangeRates(rates);
            setLastUpdated(storedTime);
          } else {
            // Rates are too old, fetch new ones using requestIdleCallback or setTimeout
            "requestIdleCallback" in window
              ? window.requestIdleCallback(() => refreshRates())
              : setTimeout(() => refreshRates(), 1000); // Longer delay to reduce initial load
          }
        } catch (e) {
          // Use request idle callback to defer fetch after critical rendering
          "requestIdleCallback" in window
            ? window.requestIdleCallback(() => refreshRates())
            : setTimeout(() => refreshRates(), 1000);
        }
      } else {
        // No stored rates, fetch new ones with lower priority
        "requestIdleCallback" in window
          ? window.requestIdleCallback(() => refreshRates())
          : setTimeout(() => refreshRates(), 1000);
      }

      // Try to get language from localStorage
      const savedLanguage = (await safeGetLocalStorage(
        "language"
      )) as Language | null;
      if (savedLanguage && (savedLanguage === "en" || savedLanguage === "vi")) {
        setLanguageState(savedLanguage);
        // Set default currency based on language
        setCurrencyState(languageToCurrency[savedLanguage]);
      } else {
        // Try to detect browser language
        const browserLanguage = navigator.language.split("-")[0];
        if (browserLanguage === "vi") {
          setLanguageState("vi");
          setCurrencyState("VND");
        }
      }

      // Try to get currency from localStorage
      const savedCurrency = (await safeGetLocalStorage(
        "currency"
      )) as Currency | null;
      if (savedCurrency && Object.keys(defaultRates).includes(savedCurrency)) {
        setCurrencyState(savedCurrency as Currency);
      }
    };

    // Use requestIdleCallback if available, otherwise use a small delay
    if (typeof window !== "undefined") {
      if ("requestIdleCallback" in window) {
        window.requestIdleCallback(() => initializeContext());
      } else {
        // Small delay to let the initial render complete
        setTimeout(() => initializeContext(), 50);
      }
    }
  }, []);

  // Memoize setLanguage to avoid recreating function
  const setLanguage = useCallback(async (newLanguage: Language) => {
    setLanguageState(newLanguage);
    await safeSetLocalStorage("language", newLanguage);
    document.documentElement.lang = newLanguage;

    // Automatically update currency when language changes
    const newCurrency = languageToCurrency[newLanguage];
    setCurrency(newCurrency);
  }, []);

  // Memoize setCurrency to avoid recreating function
  const setCurrency = useCallback(async (newCurrency: Currency) => {
    // Ensure we always have a valid currency
    const validCurrency =
      newCurrency && Object.keys(defaultRates).includes(newCurrency)
        ? newCurrency
        : "USD";

    setCurrencyState(validCurrency);
    await safeSetLocalStorage("currency", validCurrency);
  }, []);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(
    () => ({
      language,
      setLanguage,
      translations,
      currency,
      setCurrency,
      exchangeRates,
      isLoadingRates,
      refreshRates,
      lastUpdated,
    }),
    [
      language,
      setLanguage,
      currency,
      setCurrency,
      exchangeRates,
      isLoadingRates,
      refreshRates,
      lastUpdated,
    ]
  );

  return (
    <LanguageContext.Provider value={contextValue}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
