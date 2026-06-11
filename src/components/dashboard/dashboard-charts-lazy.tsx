"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

const DashboardCharts = dynamic(
  () =>
    import("@/components/dashboard/charts").then((mod) => mod.DashboardCharts),
  {
    ssr: false,
    loading: () => (
      <div className="grid gap-6 lg:grid-cols-2">
        <Skeleton className="h-[300px] w-full rounded-lg" />
        <Skeleton className="h-[300px] w-full rounded-lg" />
      </div>
    ),
  }
);

interface ChartsProps {
  mostUsedTemplates: Array<{ name: string; count: number }>;
  emailsByDepartment: Array<{ name: string; count: number }>;
}

export function DashboardChartsLazy(props: ChartsProps) {
  return <DashboardCharts {...props} />;
}
