import { cache } from "react";
import { getSupabase } from "@/lib/auth";

const DEFAULT_USD_PER_IDR = 0.000065;
const DEFAULT_SGD_PER_IDR = 0.000086;

export const getCurrencyRates = cache(async () => {
  const supabase = await getSupabase();
  const { data } = await supabase
    .from("currency_rates")
    .select("usd_per_idr, sgd_per_idr")
    .eq("id", 1)
    .maybeSingle();

  return {
    usdPerIdr: Number(data?.usd_per_idr ?? DEFAULT_USD_PER_IDR),
    sgdPerIdr: Number(data?.sgd_per_idr ?? DEFAULT_SGD_PER_IDR),
  };
});
