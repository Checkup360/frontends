import { Skeleton } from "@workspace/ui/components/skeleton"

export function AuthLoadingSkeleton() {
  return (
    <div className="min-h-svh bg-background px-4 py-6">
      <div className="mx-auto flex w-full max-w-7xl gap-6">
        <aside className="hidden w-64 shrink-0 space-y-4 rounded-lg border border-border/60 bg-card p-4 md:block">
          <Skeleton className="h-8 w-36" />
          <div className="space-y-2 pt-4">
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-5/6" />
            <Skeleton className="h-9 w-4/5" />
          </div>
        </aside>

        <main className="min-w-0 flex-1 space-y-6">
          <div className="space-y-2">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-4 w-72 max-w-full" />
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
          <Skeleton className="h-72" />
        </main>
      </div>
    </div>
  )
}
