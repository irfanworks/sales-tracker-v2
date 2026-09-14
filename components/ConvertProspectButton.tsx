"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowRightLeft, Loader2 } from "lucide-react";
import { convertProspectToPipelineAction } from "@/app/dashboard/prospects/actions";

export function ConvertProspectButton({
  prospectId,
  prospectTitle,
  hasEstimatedValue,
}: {
  prospectId: string;
  prospectTitle: string;
  hasEstimatedValue: boolean;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleConvert() {
    const confirmed = window.confirm(
      `Convert “${prospectTitle}” into a pipeline?\n\nA quote number is allocated, activity notes are copied over, and the prospect is marked Converted.${
        hasEstimatedValue ? "" : "\n\nNo estimated value is set, so the pipeline starts at Rp 0."
      }`
    );
    if (!confirmed) return;

    setError(null);
    startTransition(async () => {
      const result = await convertProspectToPipelineAction({ prospectId });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.push(result.redirectTo);
      router.refresh();
    });
  }

  return (
    <div className="inline-flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={handleConvert}
        disabled={pending}
        className="btn-primary gap-2"
      >
        {pending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <ArrowRightLeft className="h-4 w-4" />
        )}
        Convert to Pipeline
      </button>
      {error && <span className="max-w-xs text-xs text-red-600">{error}</span>}
    </div>
  );
}
