import { OverviewStatCardSkeleton } from "@workspace/components/components/card"
import { Skeleton } from "@workspace/ui/components/skeleton"

export function DashboardPageSkeleton() {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-8">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <OverviewStatCardSkeleton />
        <OverviewStatCardSkeleton />
        <OverviewStatCardSkeleton />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Skeleton className="h-[320px] lg:col-span-2" />
        <Skeleton className="h-[320px]" />
      </div>

      <div className="rounded-lg border border-border/60 bg-card p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-4 w-44" />
          </div>
          <Skeleton className="h-10 w-full sm:w-80" />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    </div>
  )
}
