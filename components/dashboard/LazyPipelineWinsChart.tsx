"use client";

import dynamic from "next/dynamic";
import type { ComponentProps } from "react";
import { ChartSkeleton } from "@/components/ui/Skeleton";

const PipelineWinsChart = dynamic(
  () =>
    import("@/components/dashboard/PipelineWinsChart").then((m) => m.PipelineWinsChart),
  {
    loading: () => (
      <div className="flex h-full min-h-[280px] items-stretch">
        <div className="w-full">
          <ChartSkeleton />
        </div>
      </div>
    ),
  }
);

export function LazyPipelineWinsChart(props: ComponentProps<typeof PipelineWinsChart>) {
  return <PipelineWinsChart {...props} />;
}
