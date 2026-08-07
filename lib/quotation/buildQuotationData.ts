import { format } from "date-fns";
import type { PaymentTermLine, PicSalutation } from "@/lib/types/database";
import { formatPicWithSalutation } from "@/lib/types/database";

const EMPTY = "—";

export type QuotationTemplateFields = {
  no_quote: string;
  date: string;
  customer_name: string;
  customer_sector: string;
  /** Salutation only, e.g. "Mr." — empty string when unset (avoids "— Name") */
  pic_salutation: string;
  /** PIC name only */
  pic_name: string;
  /** Combined "Mr. Name" for templates that prefer one token */
  pic_full: string;
  pipeline_name: string;
  pipeline_type: string;
  progress_type: string;
  value_idr: string;
  price_validity_days: string;
  delivery_weeks: string;
  payment_terms: string;
  sales_name: string;
  sales_email: string;
};

export type QuotationSource = {
  no_quote: string;
  pipeline_name: string;
  pipeline_type?: string | null;
  progress_type?: string | null;
  value?: number | null;
  pic_name?: string | null;
  pic_salutation?: PicSalutation | string | null;
  price_validity_days?: number | null;
  delivery_weeks?: number | null;
  payment_terms?: PaymentTermLine[] | null;
  customer_name?: string | null;
  customer_sector?: string | null;
  sales_name?: string | null;
  sales_email?: string | null;
  /** Defaults to now when omitted */
  date?: Date;
};

function text(value: string | null | undefined): string {
  const t = value?.trim();
  return t ? t : EMPTY;
}

function formatValueIdr(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return EMPTY;
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatPaymentTermsForDoc(
  terms: PaymentTermLine[] | null | undefined
): string {
  if (!terms || terms.length === 0) return EMPTY;
  return terms
    .map((t) => {
      const label = t.label?.trim() || "Term";
      const pct = Number.isFinite(t.percent) ? t.percent : 0;
      return `${pct}% ${label}`;
    })
    .join("; ");
}

/** Build the exact placeholder map used by the DOCX template. */
export function buildQuotationData(source: QuotationSource): QuotationTemplateFields {
  const picName = source.pic_name?.trim() || "";
  const picSalutation = source.pic_salutation?.trim() || "";

  return {
    no_quote: text(source.no_quote),
    date: format(source.date ?? new Date(), "dd MMM yyyy"),
    customer_name: text(source.customer_name),
    customer_sector: text(source.customer_sector),
    pic_salutation: picSalutation,
    pic_name: text(source.pic_name),
    pic_full: formatPicWithSalutation(picSalutation || null, picName || null),
    pipeline_name: text(source.pipeline_name),
    pipeline_type: text(source.pipeline_type),
    progress_type: text(source.progress_type),
    value_idr: formatValueIdr(source.value ?? null),
    price_validity_days:
      source.price_validity_days != null
        ? `${source.price_validity_days} days`
        : EMPTY,
    delivery_weeks:
      source.delivery_weeks != null ? `${source.delivery_weeks} weeks` : EMPTY,
    payment_terms: formatPaymentTermsForDoc(source.payment_terms),
    sales_name: text(source.sales_name),
    sales_email: text(source.sales_email),
  };
}

/** Safe download filename: Quotation-{no_quote}-{customer}.docx */
export function buildQuotationFilename(noQuote: string, customerName: string): string {
  const sanitize = (s: string) =>
    s
      .trim()
      .replace(/[\\/:*?"<>|]+/g, "-")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 80);

  const quotePart = sanitize(noQuote) || "quote";
  const customerPart = sanitize(customerName) || "customer";
  return `Quotation-${quotePart}-${customerPart}.docx`;
}
