// This would normally call a real API, but for demo purposes we'll simulate it
export async function fetchExchangeRates(): Promise<{
  rates: Record<string, number>;
  base: string;
  timestamp: number;
}> {
  // Sử dụng queueMicrotask thay vì setTimeout để tránh blocking và có độ ưu tiên tốt hơn
  return new Promise((resolve) => {
    queueMicrotask(() => {
      resolve({
        base: "USD",
        timestamp: Date.now(),
        rates: {
          USD: 1,
          VND: 24850,
          EUR: 0.92,
          GBP: 0.79,
          JPY: 151.72,
          CAD: 1.37,
          AUD: 1.52,
          CNY: 7.24,
          SGD: 1.35,
        },
      });
    });
  });
}

// Convert amount from one currency to another
export function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  rates: Record<string, number>
): number {
  if (fromCurrency === toCurrency) return amount;

  // Convert to USD first (as base currency)
  const amountInUSD =
    fromCurrency === "USD" ? amount : amount / rates[fromCurrency];

  // Then convert from USD to target currency
  return toCurrency === "USD" ? amountInUSD : amountInUSD * rates[toCurrency];
}
