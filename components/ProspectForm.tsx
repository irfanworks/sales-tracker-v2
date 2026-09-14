"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import type { PicSalutation, ProspectStatus } from "@/lib/types/database";
import {
  PIC_SALUTATIONS,
  PROSPECT_STATUSES,
  formatPicWithSalutation,
  isPicSalutation,
} from "@/lib/types/database";
import { clipText, logSalesActivity } from "@/lib/salesActivity";
import {
  formatNumberAsThousands,
  formatThousandsInput,
  parseThousandsInput,
} from "@/lib/formatThousands";
import { CustomerSelectAutocomplete } from "@/components/CustomerSelectAutocomplete";

interface CustomerPicOption {
  id: string;
  nama: string | null;
}

export function ProspectForm({
  seedCustomer,
  prospect,
  backPath = "/dashboard/prospects",
}: {
  seedCustomer?: {
    id: string;
    name: string;
    pics?: CustomerPicOption[];
  } | null;
  prospect?: {
    id: string;
    customer_id: string;
    title: string;
    work_description: string | null;
    pic_name?: string | null;
    pic_salutation?: PicSalutation | null;
    status: ProspectStatus;
    estimated_value?: number | null;
  };
  backPath?: string;
}) {
  const router = useRouter();
  const isEdit = Boolean(prospect);
  const [customerId, setCustomerId] = useState(prospect?.customer_id ?? seedCustomer?.id ?? "");
  const [customerName, setCustomerName] = useState(seedCustomer?.name ?? "");
  const [picName, setPicName] = useState(prospect?.pic_name ?? "");
  const [picSalutation, setPicSalutation] = useState<PicSalutation | "">(
    isPicSalutation(prospect?.pic_salutation) ? prospect.pic_salutation : ""
  );
  const [title, setTitle] = useState(prospect?.title ?? "");
  const [workDescription, setWorkDescription] = useState(prospect?.work_description ?? "");
  const [status, setStatus] = useState<ProspectStatus>(prospect?.status ?? "Open");
  const [estimatedValue, setEstimatedValue] = useState(
    formatNumberAsThousands(prospect?.estimated_value ?? null)
  );
  const [initialUpdate, setInitialUpdate] = useState("");
  const [fetchedPics, setFetchedPics] = useState<CustomerPicOption[] | null>(
    seedCustomer?.pics ?? null
  );
  const [loadingPics, setLoadingPics] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const picOptions = useMemo(
    () => (fetchedPics ?? []).filter((p) => p.nama?.trim()),
    [fetchedPics]
  );

  useEffect(() => {
    if (!customerId) {
      setFetchedPics(null);
      return;
    }

    if (seedCustomer?.id === customerId && seedCustomer.pics) {
      setFetchedPics(seedCustomer.pics);
      return;
    }

    let cancelled = false;
    async function loadPics() {
      setLoadingPics(true);
      const supabase = createClient();
      const { data } = await supabase
        .from("customer_pics")
        .select("id, nama")
        .eq("customer_id", customerId)
        .order("nama");
      if (!cancelled) {
        setFetchedPics(data ?? []);
        setLoadingPics(false);
      }
    }
    void loadPics();
    return () => {
      cancelled = true;
    };
  }, [customerId, seedCustomer]);

  function handleCustomerChange(next: { id: string; name: string } | null) {
    setCustomerId(next?.id ?? "");
    setCustomerName(next?.name ?? "");
    if (next?.id === prospect?.customer_id) {
      setPicName(prospect?.pic_name ?? "");
      setPicSalutation(isPicSalutation(prospect?.pic_salutation) ? prospect.pic_salutation : "");
    } else {
      setPicName("");
      setPicSalutation("");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!customerId) {
      setError("Customer is required.");
      return;
    }
    if (!picName.trim()) {
      setError("PIC is required. Select a PIC from the chosen customer.");
      return;
    }
    if (!picSalutation) {
      setError("PIC salutation is required (Mr. / Mrs. / Ms.).");
      return;
    }
    if (!title.trim()) {
      setError("Work / opportunity title is required.");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("You must be signed in.");
      setLoading(false);
      return;
    }

    const resolvedCustomerName = customerName.trim() || "customer";
    const estimatedValueNum = parseThousandsInput(estimatedValue);
    const trimmedTitle = title.trim();
    const trimmedPic = picName.trim();
    const picLabel = formatPicWithSalutation(picSalutation, trimmedPic);

    if (prospect) {
      const changes: string[] = [];
      if (prospect.customer_id !== customerId) changes.push(`Customer → ${resolvedCustomerName}`);
      const prevPic = formatPicWithSalutation(prospect.pic_salutation, prospect.pic_name);
      if (prevPic !== picLabel) changes.push(`PIC → ${picLabel}`);
      if (prospect.title !== trimmedTitle) changes.push(`Title → ${trimmedTitle}`);
      if ((prospect.work_description ?? "") !== (workDescription.trim() || "")) {
        changes.push("Work description updated");
      }
      if (prospect.status !== status) changes.push(`Status → ${status}`);
      if ((prospect.estimated_value ?? null) !== (estimatedValueNum ?? null)) {
        changes.push(
          `Estimated value → ${estimatedValueNum != null ? formatNumberAsThousands(estimatedValueNum) : "cleared"}`
        );
      }

      // No-op save: leave quietly — do not clutter Sales Activity
      if (changes.length === 0) {
        setLoading(false);
        router.push(`/dashboard/prospects/${prospect.id}`);
        router.refresh();
        return;
      }

      const { error: updateError } = await supabase
        .from("prospects")
        .update({
          customer_id: customerId,
          title: trimmedTitle,
          work_description: workDescription.trim() || null,
          pic_name: trimmedPic,
          pic_salutation: picSalutation,
          status,
          estimated_value: estimatedValueNum,
        })
        .eq("id", prospect.id);

      setLoading(false);
      if (updateError) {
        setError(updateError.message);
        return;
      }

      await logSalesActivity(supabase, {
        actorId: user.id,
        actionType: "prospect_updated",
        entityType: "prospect",
        entityId: prospect.id,
        entityLabel: trimmedTitle,
        summary: `Edited prospect “${trimmedTitle}” (${resolvedCustomerName})`,
        details: changes.join(" · "),
      });

      router.push(`/dashboard/prospects/${prospect.id}`);
      router.refresh();
      return;
    }

    const trimmedUpdate = initialUpdate.trim();
    const { data: created, error: insertError } = await supabase
      .from("prospects")
      .insert({
        customer_id: customerId,
        title: trimmedTitle,
        work_description: workDescription.trim() || null,
        pic_name: trimmedPic,
        pic_salutation: picSalutation,
        status: "Open",
        estimated_value: estimatedValueNum,
        sales_id: user.id,
        latest_update: trimmedUpdate || null,
      })
      .select("id")
      .single();

    if (insertError || !created) {
      setLoading(false);
      setError(insertError?.message ?? "Failed to create prospect.");
      return;
    }

    if (trimmedUpdate) {
      await supabase.from("prospect_updates").insert({
        prospect_id: created.id,
        content: trimmedUpdate,
        created_by: user.id,
      });
    }

    await logSalesActivity(supabase, {
      actorId: user.id,
      actionType: "prospect_created",
      entityType: "prospect",
      entityId: created.id,
      entityLabel: trimmedTitle,
      summary: `Created prospect “${trimmedTitle}” for ${resolvedCustomerName} (PIC: ${picLabel})`,
      details: trimmedUpdate ? `Initial note: ${clipText(trimmedUpdate)}` : null,
    });

    setLoading(false);
    router.push(`/dashboard/prospects/${created.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="w-full min-w-0 space-y-6 overflow-x-clip">
      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {error}
        </p>
      )}

      <div className="form-grid">
        <div className="min-w-0">
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Customer
          </label>
          <CustomerSelectAutocomplete
            valueId={customerId}
            valueLabel={customerName}
            onSelect={handleCustomerChange}
            required
            placeholder="Search customer by name…"
          />
        </div>
        <div className="min-w-0">
          <label htmlFor="prospect-pic" className="mb-1 block text-sm font-medium text-slate-700">
            PIC <span className="text-red-600">*</span>
          </label>
          <div className="grid grid-cols-1 gap-2.5 min-[380px]:grid-cols-[minmax(5.5rem,7rem)_minmax(0,1fr)]">
            <select
              id="prospect-pic-salutation"
              value={picSalutation}
              onChange={(e) =>
                setPicSalutation(isPicSalutation(e.target.value) ? e.target.value : "")
              }
              className="input-field"
              required
              aria-label="PIC salutation"
            >
              <option value="">Title</option>
              {PIC_SALUTATIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <select
              id="prospect-pic"
              value={picName}
              onChange={(e) => setPicName(e.target.value)}
              className="input-field"
              required
              disabled={!customerId || loadingPics}
            >
              <option value="">
                {!customerId
                  ? "Select customer first"
                  : loadingPics
                    ? "Loading PICs…"
                    : picOptions.length === 0
                      ? "No PIC — add one on Customer first"
                      : "Select PIC"}
              </option>
              {picOptions.map((p) => (
                <option key={p.id} value={p.nama ?? ""}>
                  {p.nama}
                </option>
              ))}
              {prospect?.pic_name &&
                !picOptions.some((p) => p.nama === prospect.pic_name) && (
                  <option value={prospect.pic_name}>{prospect.pic_name} (saved)</option>
                )}
            </select>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Choose salutation and PIC saved for this customer.
          </p>
        </div>
      </div>

      <div>
        <label htmlFor="prospect-title" className="mb-1 block text-sm font-medium text-slate-700">
          Work / opportunity
        </label>
        <input
          id="prospect-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="input-field"
          placeholder="e.g. Data center UPS expansion"
          required
        />
        <p className="mt-1 text-xs text-slate-500">Short label for the opportunity before it becomes a quote.</p>
      </div>

      <div>
        <label
          htmlFor="prospect-estimated-value"
          className="mb-1 block text-sm font-medium text-slate-700"
        >
          Estimated value
          <span className="ml-1 font-normal text-slate-500">(optional)</span>
        </label>
        <div className="pipeline-currency-wrap">
          <span className="pipeline-currency-affix">Rp</span>
          <input
            id="prospect-estimated-value"
            type="text"
            inputMode="numeric"
            autoComplete="off"
            value={estimatedValue}
            onChange={(e) => setEstimatedValue(formatThousandsInput(e.target.value))}
            className="input-field tabular-nums"
            placeholder="e.g. 1,500,000,000"
          />
        </div>
        <p className="mt-1 text-xs text-slate-500">
          Carried over as the pipeline value when this prospect is converted.
        </p>
      </div>

      <div>
        <label htmlFor="prospect-work" className="mb-1 block text-sm font-medium text-slate-700">
          Work description
        </label>
        <textarea
          id="prospect-work"
          value={workDescription}
          onChange={(e) => setWorkDescription(e.target.value)}
          className="input-field min-h-[100px] resize-y"
          rows={4}
          placeholder="Scope, context, or notes about the opportunity…"
        />
      </div>

      {isEdit && (
        <div>
          <label htmlFor="prospect-status" className="mb-1 block text-sm font-medium text-slate-700">
            Status
          </label>
          <select
            id="prospect-status"
            value={status}
            onChange={(e) => setStatus(e.target.value as ProspectStatus)}
            className="input-field"
          >
            {PROSPECT_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      )}

      {!isEdit && (
        <div>
          <label htmlFor="prospect-initial-update" className="mb-1 block text-sm font-medium text-slate-700">
            Initial progress update
            <span className="ml-1 font-normal text-slate-500">(optional)</span>
          </label>
          <textarea
            id="prospect-initial-update"
            value={initialUpdate}
            onChange={(e) => setInitialUpdate(e.target.value)}
            className="input-field min-h-[90px] resize-y"
            rows={3}
            placeholder="First activity note — meeting, intro call, site visit…"
          />
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <button type="submit" className="btn-primary gap-2" disabled={loading}>
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {isEdit ? "Save changes" : "Create prospect"}
        </button>
        <button
          type="button"
          className="btn-secondary"
          disabled={loading}
          onClick={() => router.push(backPath)}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
