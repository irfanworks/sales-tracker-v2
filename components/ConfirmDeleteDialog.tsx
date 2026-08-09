"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, Loader2, X } from "lucide-react";

/**
 * Always portal to document.body so parents with overflow/transform
 * (e.g. .table-shell) cannot clip or trap position:fixed.
 */
export function ConfirmDeleteDialog({
  open,
  title,
  message,
  confirmLabel = "Yes, delete",
  busy = false,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busy) onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, busy, onCancel]);

  if (!mounted || !open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-end justify-center p-0 sm:items-center sm:p-4"
      data-confirm-delete-dialog="true"
    >
      <button
        type="button"
        className="absolute inset-0 bg-slate-950/55 backdrop-blur-[2px]"
        aria-label="Cancel"
        disabled={busy}
        onClick={() => {
          if (!busy) onCancel();
        }}
      />
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-delete-title"
        aria-describedby="confirm-delete-desc"
        className="relative z-10 w-full max-w-md overflow-hidden rounded-t-2xl bg-white shadow-elevated animate-slide-up safe-pb sm:rounded-2xl"
      >
        <div className="flex items-start gap-3 border-b border-slate-100 px-5 py-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600 ring-1 ring-red-100">
            <AlertTriangle className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <h2
              id="confirm-delete-title"
              className="text-base font-bold tracking-tight text-slate-900"
            >
              {title}
            </h2>
            <p
              id="confirm-delete-desc"
              className="mt-1 whitespace-pre-line text-sm leading-relaxed text-slate-600"
            >
              {message}
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="icon-btn text-slate-400 disabled:opacity-50"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex flex-col-reverse gap-2 px-5 py-4 sm:flex-row sm:justify-end">
          <button type="button" onClick={onCancel} disabled={busy} className="btn-secondary">
            Cancel
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onConfirm();
            }}
            disabled={busy}
            className="inline-flex min-h-[var(--touch-min)] items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500/40 disabled:opacity-60"
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
