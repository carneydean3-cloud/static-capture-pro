import { createContext, useContext, useState, ReactNode } from "react";

type Currency = "USD" | "EUR" | "GBP";

interface CurrencyContextType {
  currency: Currency;
  setCurrency: (c: Currency) => void;
  formatPrice: (gbpPrice: number) => string;
}

// Base currency is GBP — all prices are stored in GBP
// Rates are GBP → other currencies
const rates: Record<Currency, { rate: number; symbol: string }> = {
  GBP: { rate: 1, symbol: "£" },
  USD: { rate: 1.27, symbol: "$" },
  EUR: { rate: 1.17, symbol: "€" },
};

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const CurrencyProvider = ({ children }: { children: ReactNode }) => {
  const [currency, setCurrency] = useState<Currency>("GBP");

  const formatPrice = (gbpPrice: number) => {
    const { rate, symbol } = rates[currency];
    const converted = Math.round(gbpPrice * rate);
    return `${symbol}${converted}`;
  };

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, formatPrice }}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error("useCurrency must be used within CurrencyProvider");
  return ctx;
};
