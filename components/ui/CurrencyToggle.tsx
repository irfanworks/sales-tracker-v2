"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

export type Currency = "IDR" | "USD" | "SGD";

const currencies: Currency[] = ["IDR", "USD", "SGD"];

type CurrencyContextValue = {
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  usdPerIdr: number;
  sgdPerIdr: number;
  convert: (valueInIdr: number) => number;
  format: (valueInIdr: number) => string;
};

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

export function CurrencyProvider({
  usdPerIdr,
  sgdPerIdr,
  children,
}: {
  usdPerIdr: number;
  sgdPerIdr: number;
  children: ReactNode;
}) {
  const [currency, setCurrency] = useState<Currency>("IDR");

  const value = useMemo<CurrencyContextValue>(() => {
    const convert = (valueInIdr: number) => {
      if (currency === "USD") return valueInIdr * usdPerIdr;
      if (currency === "SGD") return valueInIdr * sgdPerIdr;
      return valueInIdr;
    };
    const locale = currency === "IDR" ? "id-ID" : "en-US";
    return {
      currency,
      setCurrency,
      usdPerIdr,
      sgdPerIdr,
      convert,
      format: (valueInIdr: number) =>
        new Intl.NumberFormat(locale, {
          style: "currency",
          currency,
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(convert(valueInIdr)),
    };
  }, [currency, usdPerIdr, sgdPerIdr]);

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}

export function useCurrencyScope() {
  return useContext(CurrencyContext);
}

export function CurrencyToggle({
  value,
  onChange,
  className = "",
}: {
  value: Currency;
  onChange: (currency: Currency) => void;
  className?: string;
}) {
  return (
    <div
      className={`inline-flex rounded-xl border border-slate-200 bg-slate-100/80 p-1 ${className}`}
      role="group"
      aria-label="Currency"
    >
      {currencies.map((cur) => (
        <button
          key={cur}
          type="button"
          onClick={() => onChange(cur)}
          className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-200 ease-premium sm:text-sm ${
            value === cur
              ? "bg-white text-cyan-700 shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          {cur}
        </button>
      ))}
    </div>
  );
}

/** Toggle bound to nearest CurrencyProvider */
export function CurrencyScopeToggle({ className = "" }: { className?: string }) {
  const scope = useCurrencyScope();
  if (!scope) return null;
  return (
    <CurrencyToggle value={scope.currency} onChange={scope.setCurrency} className={className} />
  );
}

export function useCurrencyFormatter(currency: Currency) {
  return (n: number) =>
    new Intl.NumberFormat(currency === "IDR" ? "id-ID" : "en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(n);
}
