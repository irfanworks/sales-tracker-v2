"use client";

import dynamic from "next/dynamic";
import type { ComponentProps } from "react";
import { ChartSkeleton } from "@/components/ui/Skeleton";

const DashboardWorkCharts = dynamic(
  () =>
    import("@/components/dashboard/DashboardWorkCharts").then((m) => m.DashboardWorkCharts),
  {
    loading: () => (
      <div className="grid gap-5 lg:grid-cols-2">
        <ChartSkeleton />
        <ChartSkeleton />
      </div>
    ),
  }
);

export function LazyDashboardWorkCharts(
  props: ComponentProps<typeof DashboardWorkCharts>
) {
  return <DashboardWorkCharts {...props} />;
}
