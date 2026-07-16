"use client";

import dynamic from "next/dynamic";
import type { ComponentProps } from "react";
import { ChartSkeleton } from "@/components/ui/Skeleton";

const QuoteSubmittedChart = dynamic(
  () =>
    import("@/components/dashboard/QuoteSubmittedChart").then((m) => m.QuoteSubmittedChart),
  {
    loading: () => (
      <div className="flex h-full min-h-[300px] items-stretch">
        <div className="w-full">
          <ChartSkeleton />
        </div>
      </div>
    ),
  }
);

export function LazyQuoteSubmittedChart(
  props: ComponentProps<typeof QuoteSubmittedChart>
) {
  return <QuoteSubmittedChart {...props} />;
}
