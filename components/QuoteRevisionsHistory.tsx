import { format } from "date-fns";
import type { PaymentTermLine, QuoteRevision } from "@/lib/types/database";
import { revisionSuffix } from "@/lib/quoteTerms";

function formatIdr(value: number | null) {
  if (value == null) return "—";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(value);
}

function PaymentTermsList({ terms }: { terms: PaymentTermLine[] }) {
  if (!terms?.length) return <span className="text-slate-400">—</span>;
  return (
    <ul className="space-y-0.5 text-sm text-slate-700">
      {terms.map((t, i) => (
        <li key={`${t.label}-${i}`} className="flex justify-between gap-3">
          <span>{t.label}</span>
          <span className="tabular-nums font-medium">{t.percent}%</span>
        </li>
      ))}
    </ul>
  );
}

export function QuoteRevisionsHistory({
  current,
  revisions,
}: {
  current: {
    no_quote: string;
    quote_revision?: number | null;
    value: number | null;
    price_validity_days?: number | null;
    delivery_weeks?: number | null;
    payment_terms?: PaymentTermLine[] | null;
  };
  revisions: QuoteRevision[];
}) {
  const sorted = [...revisions].sort((a, b) => b.revision - a.revision);

  return (
    <div className="card-elevated overflow-hidden">
      <div className="border-b border-slate-100 bg-slate-50/80 px-4 py-3 sm:px-5">
        <h2 className="text-sm font-semibold text-slate-900">Quote revision history</h2>
        <p className="mt-0.5 text-xs text-slate-500">
          Tracks tender value & commercial terms from initial quote through each revisi.
        </p>
      </div>

      <div className="divide-y divide-slate-100">
        {/* Current (live) */}
        <div className="p-4 sm:p-5">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-cyan-100 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-cyan-800">
              Current · {revisionSuffix(current.quote_revision ?? 0)}
            </span>
            <span className="font-mono text-sm font-semibold text-slate-800">{current.no_quote}</span>
          </div>
          <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                Tender value
              </dt>
              <dd className="mt-1 font-medium tabular-nums text-slate-900">
                {formatIdr(current.value)}
              </dd>
            </div>
            <div>
              <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                Price validity
              </dt>
              <dd className="mt-1 text-slate-800">
                {current.price_validity_days != null ? `${current.price_validity_days} days` : "—"}
              </dd>
            </div>
            <div>
              <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                Delivery
              </dt>
              <dd className="mt-1 text-slate-800">
                {current.delivery_weeks != null ? `${current.delivery_weeks} weeks` : "—"}
              </dd>
            </div>
            <div>
              <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                Payment terms
              </dt>
              <dd className="mt-1">
                <PaymentTermsList terms={current.payment_terms ?? []} />
              </dd>
            </div>
          </dl>
        </div>

        {sorted.length === 0 ? (
          <div className="px-4 py-6 text-center text-sm text-slate-500 sm:px-5">
            No prior revisions yet. Use <strong>Revisi Quote</strong> when the tender value or terms
            change — the previous figures stay here for accuracy tracking.
          </div>
        ) : (
          sorted.map((rev) => (
            <div key={rev.id} className="p-4 sm:p-5">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-slate-200/80 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-slate-700">
                  Snapshot · {revisionSuffix(rev.revision)}
                </span>
                <span className="font-mono text-sm text-slate-700">{rev.no_quote}</span>
                <span className="text-xs text-slate-400">
                  {format(new Date(rev.created_at), "dd MMM yyyy · HH:mm")}
                  {rev.author_name ? ` · ${rev.author_name}` : ""}
                </span>
              </div>
              {rev.notes && (
                <p className="mb-3 text-sm italic text-slate-600">&ldquo;{rev.notes}&rdquo;</p>
              )}
              <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    Tender value
                  </dt>
                  <dd className="mt-1 font-medium tabular-nums text-slate-900">
                    {formatIdr(rev.value != null ? Number(rev.value) : null)}
                  </dd>
                </div>
                <div>
                  <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    Price validity
                  </dt>
                  <dd className="mt-1 text-slate-800">
                    {rev.price_validity_days != null ? `${rev.price_validity_days} days` : "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    Delivery
                  </dt>
                  <dd className="mt-1 text-slate-800">
                    {rev.delivery_weeks != null ? `${rev.delivery_weeks} weeks` : "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    Payment terms
                  </dt>
                  <dd className="mt-1">
                    <PaymentTermsList
                      terms={Array.isArray(rev.payment_terms) ? rev.payment_terms : []}
                    />
                  </dd>
                </div>
              </dl>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
