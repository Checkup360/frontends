import { OverviewStatCardSkeleton } from "@workspace/components/components/card"
import { WorkspaceShellSkeleton } from "@workspace/components/components/workspace-shell-skeleton"
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRowsSkeleton,
  TableRow,
} from "@workspace/ui/components/table"
import { Card, CardContent, CardHeader } from "@workspace/ui/components/card"
import { Skeleton } from "@workspace/ui/components/skeleton"

const organizationTableSkeletonColumns = [
  { lines: ["h-4 w-36", "h-3 w-24"] },
  { skeletonClassName: "h-4 w-8" },
  { skeletonClassName: "h-4 w-10" },
  { skeletonClassName: "h-6 w-20 rounded-full" },
  {
    cellClassName: "text-right",
    skeletonClassName: "ml-auto h-8 w-16",
  },
]

function OrganizationsPageSkeleton() {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Skeleton className="h-5 w-20" />
        <Skeleton className="h-9 w-44" />
      </div>

      <section className="grid gap-4 md:grid-cols-3">
        <OverviewStatCardSkeleton />
        <OverviewStatCardSkeleton />
        <OverviewStatCardSkeleton />
      </section>

      <Card>
        <CardHeader className="gap-4 sm:grid-cols-[1fr_280px]">
          <div className="space-y-2">
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-4 w-44" />
          </div>
          <Skeleton className="h-10 w-full" />
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-lg border border-border/60">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead>Organization</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Collaborators</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRowsSkeleton
                  rows={5}
                  columns={organizationTableSkeletonColumns}
                />
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export function BackofficeLoadingSkeleton() {
  return (
    <WorkspaceShellSkeleton
      titleClassName="h-5 w-28"
      appLabelClassName="h-3 w-16"
      navItemClassNames={["h-3.5 w-24", "h-3.5 w-20"]}
      secondaryNavItemClassNames={["h-3.5 w-16"]}
    >
      <OrganizationsPageSkeleton />
    </WorkspaceShellSkeleton>
  )
}
