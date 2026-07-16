import type { PaymentTermLine } from "@/lib/types/database";

export const PAYMENT_TERM_PRESETS = [
  "Down payment",
  "After drawing approval",
  "After FAT",
  "Before Delivery",
  "After Delivery/MOS (Material On-Site)",
  "After Testing",
  "After Commissioning",
  "Custom",
] as const;

export type PaymentTermPreset = (typeof PAYMENT_TERM_PRESETS)[number];

export const PRICE_VALIDITY_OPTIONS = [60, 90] as const;
export type PriceValidityDays = (typeof PRICE_VALIDITY_OPTIONS)[number];

export function emptyPaymentTerm(): PaymentTermLine {
  return { label: "Down payment", percent: 0, is_custom: false };
}

export function paymentTermsTotal(terms: PaymentTermLine[]): number {
  return terms.reduce((sum, t) => sum + (Number.isFinite(t.percent) ? t.percent : 0), 0);
}

export function validatePaymentTerms(terms: PaymentTermLine[]): string | null {
  if (terms.length === 0) {
    return "Add at least one payment term.";
  }
  for (const t of terms) {
    const label = t.label.trim();
    if (!label) return "Each payment term needs a description.";
    if (!Number.isFinite(t.percent) || t.percent < 0 || t.percent > 100) {
      return "Each percentage must be between 0 and 100.";
    }
  }
  const total = paymentTermsTotal(terms);
  if (Math.abs(total - 100) > 0.01) {
    return `Payment terms must total 100% (currently ${total}%).`;
  }
  return null;
}

export function revisionSuffix(revision: number): string {
  if (revision <= 0) return "00";
  return `R${revision}`;
}

export function formatQuoteNumber(base: string, revision: number): string {
  return `${base}-${revisionSuffix(revision)}`;
}
