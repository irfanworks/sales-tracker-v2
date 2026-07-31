"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import type { ProspectStatus } from "@/lib/types/database";
import { PROSPECT_STATUSES } from "@/lib/types/database";
import { clipText, logSalesActivity } from "@/lib/salesActivity";

interface CustomerPicOption {
  id: string;
  nama: string | null;
}

type CustomerOption = {
  id: string;
  name: string;
  pics?: CustomerPicOption[];
};

export function ProspectForm({
  customers,
  prospect,
  backPath = "/dashboard/prospects",
}: {
  customers: CustomerOption[];
  prospect?: {
    id: string;
    customer_id: string;
    title: string;
    work_description: string | null;
    pic_name?: string | null;
    status: ProspectStatus;
  };
  backPath?: string;
}) {
  const router = useRouter();
  const isEdit = Boolean(prospect);
  const [customerId, setCustomerId] = useState(prospect?.customer_id ?? "");
  const [picName, setPicName] = useState(prospect?.pic_name ?? "");
  const [title, setTitle] = useState(prospect?.title ?? "");
  const [workDescription, setWorkDescription] = useState(prospect?.work_description ?? "");
  const [status, setStatus] = useState<ProspectStatus>(prospect?.status ?? "Open");
  const [initialUpdate, setInitialUpdate] = useState("");
  const [fetchedPics, setFetchedPics] = useState<CustomerPicOption[] | null>(null);
  const [loadingPics, setLoadingPics] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedCustomer = useMemo(
    () => customers.find((c) => c.id === customerId) ?? null,
    [customers, customerId]
  );

  const picOptions = useMemo(() => {
    const fromCustomer = selectedCustomer?.pics;
    if (fromCustomer && fromCustomer.length > 0) {
      return fromCustomer.filter((p) => p.nama?.trim());
    }
    return (fetchedPics ?? []).filter((p) => p.nama?.trim());
  }, [selectedCustomer, fetchedPics]);

  useEffect(() => {
    if (!customerId) {
      setFetchedPics(null);
      return;
    }

    const fromProps = customers.find((c) => c.id === customerId)?.pics;
    if (fromProps) {
      setFetchedPics(null);
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
  }, [customerId, customers]);

  function handleCustomerChange(nextId: string) {
    setCustomerId(nextId);
    setPicName(nextId === prospect?.customer_id ? (prospect?.pic_name ?? "") : "");
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

    const customerName = selectedCustomer?.name ?? "customer";
    const trimmedTitle = title.trim();
    const trimmedPic = picName.trim();

    if (prospect) {
      const changes: string[] = [];
      if (prospect.customer_id !== customerId) changes.push(`Customer → ${customerName}`);
      if ((prospect.pic_name ?? "") !== trimmedPic) changes.push(`PIC → ${trimmedPic}`);
      if (prospect.title !== trimmedTitle) changes.push(`Title → ${trimmedTitle}`);
      if ((prospect.work_description ?? "") !== (workDescription.trim() || "")) {
        changes.push("Work description updated");
      }
      if (prospect.status !== status) changes.push(`Status → ${status}`);

      const { error: updateError } = await supabase
        .from("prospects")
        .update({
          customer_id: customerId,
          title: trimmedTitle,
          work_description: workDescription.trim() || null,
          pic_name: trimmedPic,
          status,
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
        summary: `Edited prospect “${trimmedTitle}” (${customerName})`,
        details: changes.length > 0 ? changes.join(" · ") : "Saved prospect details",
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
        status: "Open",
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
      summary: `Created prospect “${trimmedTitle}” for ${customerName} (PIC: ${trimmedPic})`,
      details: trimmedUpdate ? `Initial note: ${clipText(trimmedUpdate)}` : null,
    });

    setLoading(false);
    router.push(`/dashboard/prospects/${created.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {error}
        </p>
      )}

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor="prospect-customer" className="mb-1 block text-sm font-medium text-slate-700">
            Customer
          </label>
          <select
            id="prospect-customer"
            value={customerId}
            onChange={(e) => handleCustomerChange(e.target.value)}
            className="input-field"
            required
          >
            <option value="">Select customer…</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="prospect-pic" className="mb-1 block text-sm font-medium text-slate-700">
            PIC <span className="text-red-600">*</span>
          </label>
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
          <p className="mt-1 text-xs text-slate-500">
            Choose from PICs saved for this customer.
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
