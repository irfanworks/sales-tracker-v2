"use client";

export type Currency = "IDR" | "USD" | "SGD";

const currencies: Currency[] = ["IDR", "USD", "SGD"];

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
    <div className={`inline-flex rounded-xl border border-slate-200 bg-slate-100/80 p-1 ${className}`}>
      {currencies.map((cur) => (
        <button
          key={cur}
          type="button"
          onClick={() => onChange(cur)}
          className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-200 sm:text-sm ${
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

export function useCurrencyFormatter(currency: Currency) {
  return (n: number) =>
    new Intl.NumberFormat(currency === "IDR" ? "id-ID" : "en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(n);
}
