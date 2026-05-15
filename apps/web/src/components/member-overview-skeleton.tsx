import { OverviewStatCardSkeleton } from "@workspace/components/components/card"
import {
  Card,
  CardContent,
  CardHeader,
} from "@workspace/ui/components/card"
import { Skeleton } from "@workspace/ui/components/skeleton"

export function MemberOverviewSkeleton() {
  return (
    <div className="space-y-8">
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-destructive/30 bg-destructive/5">
          <CardHeader className="pb-3">
            <Skeleton className="h-4 w-28" />
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-4">
              <div className="flex flex-col gap-2">
                <Skeleton className="h-10 w-16" />
                <Skeleton className="h-3 w-14" />
              </div>
              <div className="flex-1 space-y-2">
                <Skeleton className="ml-auto h-3 w-24" />
                <Skeleton className="h-2 w-full rounded-full" />
              </div>
            </div>
            <Skeleton className="mt-3 h-3 w-64 max-w-full" />
          </CardContent>
        </Card>

        <OverviewStatCardSkeleton />
        <OverviewStatCardSkeleton />
      </div>
    </div>
  )
}
