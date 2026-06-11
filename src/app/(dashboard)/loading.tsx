import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48 bg-muted" />
        <Skeleton className="h-4 w-72 bg-muted" />
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Skeleton className="h-24 rounded-lg bg-muted" />
        <Skeleton className="h-24 rounded-lg bg-muted" />
        <Skeleton className="h-24 rounded-lg bg-muted" />
      </div>
      <Skeleton className="h-64 w-full rounded-lg bg-muted" />
    </div>
  );
}
