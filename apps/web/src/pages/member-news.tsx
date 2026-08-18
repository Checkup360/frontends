import { Skeleton } from "@workspace/ui/components/skeleton"
import { HealthContentGrid } from "@workspace/components/components/health-content-grid"
import { useMemberArticles } from "@/hooks/use-member-articles"

export function MemberNewsPage() {
  const { articles, isLoading } = useMemberArticles()

  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-7xl space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="space-y-3 rounded-xl border p-4">
              <Skeleton className="aspect-video w-full rounded-lg" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-7xl">
      <HealthContentGrid
        articles={articles}
        title="Health Articles & News"
        description="Explore articles, medical advice, and healthy habits tailored for you."
      />
    </div>
  )
}
