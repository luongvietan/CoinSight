import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase/config";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(
  amount: number,
  currency = "USD",
  exchangeRates: Record<string, number> = { USD: 1, VND: 24850 },
  fromCurrency = "VND"
): string {
  // Convert amount if needed
  let convertedAmount = amount;

  if (fromCurrency !== currency) {
    // Convert to USD first (as base currency)
    const amountInUSD =
      fromCurrency === "USD" ? amount : amount / exchangeRates[fromCurrency];

    // Then convert from USD to target currency
    convertedAmount =
      currency === "USD" ? amountInUSD : amountInUSD * exchangeRates[currency];
  }

  // Format based on currency
  const formatter = new Intl.NumberFormat(getCurrencyLocale(currency), {
    style: "currency",
    currency: currency,
    maximumFractionDigits: getCurrencyDecimals(currency),
  });

  return formatter.format(convertedAmount);
}

// Helper to get appropriate locale for a currency
function getCurrencyLocale(currency: string): string {
  const localeMap: Record<string, string> = {
    USD: "en-US",
    VND: "vi-VN",
    EUR: "de-DE",
    GBP: "en-GB",
    JPY: "ja-JP",
    CAD: "en-CA",
    AUD: "en-AU",
    CNY: "zh-CN",
    SGD: "zh-SG",
  };

  return localeMap[currency] || "en-US";
}

// Helper to get appropriate decimal places for a currency
function getCurrencyDecimals(currency: string): number {
  const decimalsMap: Record<string, number> = {
    VND: 0,
    JPY: 0,
    KRW: 0,
    IDR: 0,
  };

  return decimalsMap[currency] !== undefined ? decimalsMap[currency] : 2;
}

export function formatDate(dateString: string, locale = "en"): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat(locale === "vi" ? "vi-VN" : "en-US", {
    day: "numeric",
    month: "short",
  }).format(date);
}

// Format a number with K, M, B suffixes
export function formatCompactNumber(num: number, locale = "en"): string {
  return new Intl.NumberFormat(locale === "vi" ? "vi-VN" : "en-US", {
    notation: "compact",
    compactDisplay: "short",
  }).format(num);
}

// Get a color for a percentage value (green for good, red for bad)
export function getPercentageColor(
  value: number,
  isHigherBetter = false
): string {
  if (isHigherBetter) {
    if (value >= 10) return "text-green-500";
    if (value > 0) return "text-green-400";
    if (value === 0) return "text-gray-500";
    if (value > -10) return "text-red-400";
    return "text-red-500";
  } else {
    if (value <= -10) return "text-green-500";
    if (value < 0) return "text-green-400";
    if (value === 0) return "text-gray-500";
    if (value < 10) return "text-red-400";
    return "text-red-500";
  }
}

export function logError(context, error, additionalData = {}) {
  // console.error(`[${context}] Error:`, error);

  // Gửi lỗi đến service ngoài như Sentry
  if (typeof window !== "undefined" && window.Sentry) {
    window.Sentry.captureException(error, {
      extra: {
        context,
        ...additionalData,
      },
    });
  }

  // Hoặc log vào Firestore nếu cần
  return addDoc(collection(db, "errors"), {
    context,
    errorMessage: error.message,
    stack: error.stack,
    timestamp: serverTimestamp(),
    ...additionalData,
  });
}

/**
 * Tạo một phiên bản debounced của hàm, chỉ gọi sau khi đã ngừng được gọi
 * trong khoảng thời gian chờ đã chỉ định.
 * @param fn Hàm cần debounce
 * @param wait Thời gian chờ tính bằng milliseconds
 * @returns Phiên bản debounced của hàm
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  return function (...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      fn(...args);
    };

    if (timeout !== null) {
      clearTimeout(timeout);
    }

    timeout = setTimeout(later, wait);
  };
}
