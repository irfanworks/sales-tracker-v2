/** Format digits with thousand separators (commas), e.g. 1000000 → 1,000,000 */
export function formatThousandsInput(raw: string): string {
  const digits = raw.replace(/[^\d]/g, "");
  if (!digits) return "";
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

/** Parse thousand-separated input back to a finite number, or null if empty/invalid */
export function parseThousandsInput(formatted: string): number | null {
  const trimmed = formatted.trim();
  if (!trimmed) return null;
  const digits = trimmed.replace(/,/g, "").replace(/[^\d]/g, "");
  if (!digits) return null;
  const n = Number(digits);
  return Number.isFinite(n) ? n : null;
}

export function formatNumberAsThousands(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return "";
  return formatThousandsInput(String(Math.trunc(value)));
}
