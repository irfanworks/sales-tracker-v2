import { format } from "date-fns";
import { SalesStageBadge } from "@/components/SalesStageBadge";
import type { PipelineStageHistoryRow } from "@/lib/salesStage";

export function PipelineStageHistory({
  entries,
}: {
  entries: Array<
    PipelineStageHistoryRow & {
      changer_name?: string | null;
    }
  >;
}) {
  const sorted = [...entries].sort(
    (a, b) => new Date(b.changed_at).getTime() - new Date(a.changed_at).getTime()
  );

  return (
    <div className="card-elevated overflow-hidden">
      <div className="border-b border-slate-100 bg-slate-50/80 px-4 py-3 sm:px-5">
        <h2 className="text-sm font-semibold text-slate-900">Sales stage history</h2>
        <p className="mt-0.5 text-xs text-slate-500">
          Tanggal perubahan stage beserta alasan / catatan.
        </p>
      </div>

      {sorted.length === 0 ? (
        <p className="px-4 py-8 text-center text-sm text-slate-500 sm:px-5">
          Belum ada histori stage.
        </p>
      ) : (
        <ol className="divide-y divide-slate-100">
          {sorted.map((entry) => (
            <li key={entry.id} className="px-4 py-3.5 sm:px-5">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0 space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    {entry.previous_stage ? (
                      <>
                        <SalesStageBadge value={entry.previous_stage} />
                        <span className="text-xs text-slate-400">→</span>
                      </>
                    ) : null}
                    <SalesStageBadge value={entry.stage} />
                    {entry.reason_category ? (
                      <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                        {entry.reason_category}
                      </span>
                    ) : null}
                  </div>
                  {(entry.reason || entry.note) && (
                    <p className="text-sm text-slate-600">
                      {entry.reason && entry.reason !== entry.reason_category ? (
                        <>
                          <span className="font-medium text-slate-800">Reason:</span> {entry.reason}
                        </>
                      ) : null}
                      {entry.reason &&
                      entry.reason !== entry.reason_category &&
                      entry.note
                        ? " · "
                        : null}
                      {entry.note ? (
                        <>
                          <span className="font-medium text-slate-800">Notes:</span> {entry.note}
                        </>
                      ) : null}
                    </p>
                  )}
                </div>
                <div className="text-right text-xs text-slate-500">
                  <p className="font-medium text-slate-700">
                    {format(new Date(entry.changed_at), "dd MMM yyyy, HH:mm")}
                  </p>
                  {entry.changer_name ? <p className="mt-0.5">{entry.changer_name}</p> : null}
                </div>
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
