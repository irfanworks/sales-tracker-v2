"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { formatNumberAsThousands, formatThousandsInput, parseThousandsInput } from "@/lib/formatThousands";

export function SettingsForm({
  initialDisplayName,
  userId,
  isAdmin,
  initialUsdPerIdr,
  initialSgdPerIdr,
  initialAnnualSalesTarget,
}: {
  initialDisplayName: string;
  userId: string;
  isAdmin: boolean;
  initialUsdPerIdr: number;
  initialSgdPerIdr: number;
  initialAnnualSalesTarget: number | null;
}) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [annualTargetDisplay, setAnnualTargetDisplay] = useState(
    formatNumberAsThousands(initialAnnualSalesTarget)
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [idrPerUsd, setIdrPerUsd] = useState((initialUsdPerIdr > 0 ? 1 / initialUsdPerIdr : 0).toString());
  const [idrPerSgd, setIdrPerSgd] = useState((initialSgdPerIdr > 0 ? 1 / initialSgdPerIdr : 0).toString());

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setLoading(true);
    const supabase = createClient();

    const annualTarget = parseThousandsInput(annualTargetDisplay);
    if (annualTargetDisplay.trim() && (annualTarget == null || annualTarget < 0)) {
      setLoading(false);
      setError("Annual sales target must be a valid non-negative number.");
      return;
    }

    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        display_name: displayName.trim() || null,
        annual_sales_target: annualTarget,
      })
      .eq("id", userId);
    if (updateError) {
      setLoading(false);
      setError(updateError.message);
      return;
    }

    if (isAdmin) {
      const idrUsd = Number(idrPerUsd);
      const idrSgd = Number(idrPerSgd);
      if (!Number.isFinite(idrUsd) || idrUsd <= 0 || !Number.isFinite(idrSgd) || idrSgd <= 0) {
        setLoading(false);
        setError("Currency rates must be valid positive numbers.");
        return;
      }
      const { error: ratesError } = await supabase.rpc("update_currency_rates", {
        p_usd_per_idr: 1 / idrUsd,
        p_sgd_per_idr: 1 / idrSgd,
      });
      if (ratesError) {
        setLoading(false);
        setError(ratesError.message);
        return;
      }
    }

    setLoading(false);
    setSuccess(true);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-md space-y-4">
      <div>
        <label htmlFor="display-name" className="mb-1 block text-sm font-medium text-slate-700">
          Display Name
        </label>
        <input
          id="display-name"
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          className="input-field"
          placeholder="Name displayed on Dashboard"
        />
      </div>
      <div>
        <label htmlFor="annual-target" className="mb-1 block text-sm font-medium text-slate-700">
          Annual sales target (IDR)
        </label>
        <input
          id="annual-target"
          type="text"
          inputMode="numeric"
          value={annualTargetDisplay}
          onChange={(e) => setAnnualTargetDisplay(formatThousandsInput(e.target.value))}
          className="input-field tabular-nums"
          placeholder="e.g. 10,000,000,000"
        />
        <p className="mt-1 text-xs text-slate-500">
          Your personal closing target for Target Achievement on the dashboard (Won vs this
          amount).
        </p>
      </div>
      {isAdmin && (
        <div className="space-y-4 rounded-lg border border-slate-200 p-4">
          <p className="text-sm font-medium text-slate-700">Currency conversion settings</p>
          <div>
            <label htmlFor="idr-per-usd" className="mb-1 block text-sm font-medium text-slate-700">
              1 USD to IDR
            </label>
            <input
              id="idr-per-usd"
              type="number"
              min="0"
              step="0.01"
              value={idrPerUsd}
              onChange={(e) => setIdrPerUsd(e.target.value)}
              className="input-field"
              placeholder="15500"
            />
          </div>
          <div>
            <label htmlFor="idr-per-sgd" className="mb-1 block text-sm font-medium text-slate-700">
              1 SGD to IDR
            </label>
            <input
              id="idr-per-sgd"
              type="number"
              min="0"
              step="0.01"
              value={idrPerSgd}
              onChange={(e) => setIdrPerSgd(e.target.value)}
              className="input-field"
              placeholder="11500"
            />
          </div>
        </div>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}
      {success && <p className="text-sm text-green-600">Settings saved successfully.</p>}
      <button type="submit" className="btn-primary gap-2" disabled={loading}>
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        Save Settings
      </button>
    </form>
  );
}
