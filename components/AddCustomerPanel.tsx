"use client";

import { useState } from "react";
import { ChevronDown, Plus } from "lucide-react";
import { AddCustomerForm } from "@/components/AddCustomerForm";
import type { CustomerNameOption } from "@/components/CustomerNameAutocomplete";

export function AddCustomerPanel({
  existingCustomers,
}: {
  existingCustomers: CustomerNameOption[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="card-elevated overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex min-h-12 w-full items-center justify-between gap-3 px-4 py-3.5 text-left transition hover:bg-slate-50/80 sm:px-5"
        aria-expanded={open}
      >
        <span className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-50 text-cyan-800 ring-1 ring-cyan-100">
            <Plus className="h-5 w-5" strokeWidth={2} />
          </span>
          <span>
            <span className="block text-[15px] font-semibold tracking-tight text-slate-900">
              Add customer
            </span>
            <span className="block text-xs text-slate-500">
              {open ? "Fill the form below" : "Tap to expand the create form"}
            </span>
          </span>
        </span>
        <ChevronDown
          className={`h-5 w-5 shrink-0 text-slate-400 transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>
      {open && (
        <div className="border-t border-slate-100 px-4 py-4 sm:px-5 sm:py-5">
          <AddCustomerForm existingCustomers={existingCustomers} />
        </div>
      )}
    </div>
  );
}
