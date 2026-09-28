import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { Button } from "@workspace/ui/components/button"
import { HealthContentGrid } from "@workspace/components/components/health-content-grid"
import { useMemberArticles } from "@/hooks/use-member-articles"

export function MemberNewsPage() {
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const { articles, pagination, isLoading } = useMemberArticles({
    page,
    limit: 9,
  })

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
    <div className="mx-auto w-full max-w-7xl space-y-8">
      <HealthContentGrid
        articles={articles}
        title="Health Articles & News"
        description="Explore articles, medical advice, and healthy habits tailored for you."
        onNavigate={(href) => navigate(href)}
      />

      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-border pt-4">
          <p className="text-sm text-muted-foreground">
            Page {pagination.page} of {pagination.totalPages} (
            {pagination.totalDocs} articles)
          </p>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={!pagination.hasPrevPage}
            >
              <ChevronLeft className="mr-1 h-4 w-4" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => p + 1)}
              disabled={!pagination.hasNextPage}
            >
              Next
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

export default MemberNewsPage
