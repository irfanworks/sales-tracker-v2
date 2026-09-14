export type AiInsightPreset = {
  id: string;
  label: string;
  description: string;
  prompt: string;
  icon: "users" | "chart" | "forecast" | "risk" | "strategy";
};

export const AI_INSIGHT_PRESETS: AiInsightPreset[] = [
  {
    id: "sales-performance",
    label: "Analisis Performa Per Sales / Tim",
    description: "Evaluasi kinerja individu dan tim penjualan",
    icon: "users",
    prompt:
      "Analisis performa per sales person dan tim secara keseluruhan. Bandingkan open pipeline value, win YTD, win rate, dan pencapaian target. Sebutkan siapa yang strongest/weakest, pola yang terlihat, dan rekomendasi coaching singkat yang actionable.",
  },
  {
    id: "revenue-month",
    label: "Omzet & Ringkasan Penjualan",
    description: "Ringkasan omzet dan momentum penjualan",
    icon: "chart",
    prompt:
      "Buat ringkasan omzet & penjualan berdasarkan data snapshot (bulan berjalan / YTD). Highlight total Win YTD, open pipeline, late stage (Technical Clarification, Commercial Negotiation, LOA/PO Pending), dan tren bulanan. Jelaskan apa artinya untuk manajemen Enercon dalam bahasa eksekutif yang jelas.",
  },
  {
    id: "q-forecast",
    label: "Proyeksi Sales & Forecast Target",
    description: "Forecast closing dan gap ke target",
    icon: "forecast",
    prompt:
      "Buat proyeksi/forecast penjualan menuju sisa tahun dan kuartal berjalan. Gunakan open pipeline, late stage (Technical Clarification, Commercial Negotiation, LOA/PO Pending), win rate historis, dan gap ke annual target. Berikan skenario conservative / base / optimistic beserta asumsi dan risiko utama.",
  },
  {
    id: "at-risk",
    label: "Deals Berisiko / Stagnan",
    description: "Identifikasi deal yang perlu intervensi",
    icon: "risk",
    prompt:
      "Identifikasi deals berisiko atau stagnan dari daftar atRiskDeals dan konteks pipeline. Prioritaskan 5–8 deal paling kritis, jelaskan alasan risikonya, dan usulkan next action konkret untuk sales owner masing-masing.",
  },
  {
    id: "strategy",
    label: "Saran Strategi & Action Plan",
    description: "Rencana aksi strategis 30–60 hari",
    icon: "strategy",
    prompt:
      "Susun saran strategi dan action plan penjualan untuk 30–60 hari ke depan. Fokus pada prioritas manajemen, alokasi effort sales, fokus sektor/customer, dan cara menutup gap target. Sajikan sebagai keputusan strategis yang bisa dieksekusi minggu ini.",
  },
];

export function getPresetById(id: string | undefined | null) {
  if (!id) return null;
  return AI_INSIGHT_PRESETS.find((p) => p.id === id) ?? null;
}
