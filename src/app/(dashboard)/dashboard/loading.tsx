import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardPageLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-40 bg-muted" />
        <Skeleton className="h-4 w-64 bg-muted" />
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Skeleton className="h-24 rounded-lg border-l-4 border-l-brand-lime bg-muted" />
        <Skeleton className="h-24 rounded-lg border-l-4 border-l-destructive bg-muted" />
        <Skeleton className="h-24 rounded-lg border-l-4 border-l-brand-steel-teal bg-muted" />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Skeleton className="h-[300px] rounded-lg bg-muted" />
        <Skeleton className="h-[300px] rounded-lg bg-muted" />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Skeleton className="h-48 rounded-lg bg-muted" />
        <Skeleton className="h-48 rounded-lg bg-muted" />
      </div>
    </div>
  );
}
